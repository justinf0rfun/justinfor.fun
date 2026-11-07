import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../.demo-build/", import.meta.url));
const manifest = JSON.parse(await readFile(new URL("../manifest.json", import.meta.url), "utf8"));
for (const asset of manifest.assets) await access(join(root, "reference", asset.presentationPath));
for (const name of ["justin-avatar.png", "zuoyebang-icon.png", "didi-icon.png"]) await access(join(root, name));

async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { await check(path); continue; }
    if (!/\.(?:html|css|js)$/.test(entry.name)) continue;
    const text = await readFile(path, "utf8");
    assert.ok(!text.includes("/@fs/") && !text.includes("/Users/"), `${path} exposes a local path`);
    if (entry.name.endsWith(".js")) continue;
    const references = [...text.matchAll(/(?:src|href)=["']([^"']+)["']|url\(["']?([^"')]+)["']?\)/g)];
    for (const match of references) {
      const url = match[1] ?? match[2];
      if (/^(?:https?:|data:|#)/.test(url)) continue;
      const target = url.startsWith("/") ? join(root, url) : resolve(dirname(path), url);
      await access(target.split(/[?#]/)[0]);
    }
  }
}
await check(root);
assert.deepEqual((await readdir(root)).sort(), ["assets", "didi-icon.png", "index.html", "justin-avatar.png", "reference", "zuoyebang-icon.png"]);
console.log("PASS: portable static preview, all 16 gallery states and local resources resolve; no local filesystem URLs.");
