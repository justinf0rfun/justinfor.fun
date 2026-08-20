import { spawnSync } from "node:child_process";
import { access, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { parseArgs } from "node:util";

const args = process.argv.slice(2);
if (args[0] === "--") args.shift();

const { values } = parseArgs({
  args,
  options: {
    bucket: { type: "string", default: process.env.MEMORY_R2_BUCKET ?? "justin-memory" },
    "source-dir": { type: "string", default: "public/memory" },
    "public-base-url": { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
});

const manifestPath = resolve("src/data/memories.json");
const sourceDir = resolve(values["source-dir"]);
const photos = JSON.parse(await readFile(manifestPath, "utf8"));
const ids = new Set();
const objectKeys = new Set();

for (const photo of photos) {
  if (!photo.id || ids.has(photo.id)) throw new Error(`Invalid or duplicate photo id: ${photo.id}`);
  if (!photo.objectKey || objectKeys.has(photo.objectKey)) {
    throw new Error(`Invalid or duplicate R2 object key: ${photo.objectKey}`);
  }
  if (!/^\d{4}-\d{2}$/.test(photo.month) || photo.width <= 0 || photo.height <= 0) {
    throw new Error(`Invalid metadata for photo: ${photo.id}`);
  }
  ids.add(photo.id);
  objectKeys.add(photo.objectKey);
}

const wrangler = resolve(
  "node_modules/.bin",
  process.platform === "win32" ? "wrangler.cmd" : "wrangler",
);
let uploaded = 0;
let skipped = 0;

for (const photo of photos) {
  const source = resolve(sourceDir, basename(photo.objectKey));
  const sourceExists = await access(source).then(
    () => true,
    () => false,
  );
  if (!sourceExists) {
    if (!URL.canParse(photo.src)) throw new Error(`Missing source file for photo: ${photo.id}`);
    skipped += 1;
    continue;
  }
  const destination = `${values.bucket}/${photo.objectKey}`;

  if (values["dry-run"]) {
    console.log(`${source} -> r2://${destination}`);
    uploaded += 1;
    continue;
  }

  const result = spawnSync(
    wrangler,
    [
      "r2",
      "object",
      "put",
      destination,
      "--file",
      source,
      "--content-type",
      "image/jpeg",
      "--cache-control",
      "public,max-age=31536000,immutable",
      "--remote",
    ],
    { stdio: "inherit" },
  );

  if (result.status !== 0) process.exit(result.status ?? 1);
  uploaded += 1;
}

if (values["public-base-url"] && !values["dry-run"]) {
  const baseUrl = values["public-base-url"].replace(/\/$/, "");
  const published = photos.map((photo) => ({
    ...photo,
    src: `${baseUrl}/${photo.objectKey}`,
  }));
  await writeFile(manifestPath, `${JSON.stringify(published, null, 2)}\n`);
}

console.log(
  values["dry-run"]
    ? `Validated ${photos.length} photos: ${uploaded} pending, ${skipped} already published.`
    : `Published ${uploaded} photos to bucket ${values.bucket}; skipped ${skipped} existing photos.`,
);
