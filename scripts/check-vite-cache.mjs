import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import config from "../astro.config.mjs";

const require = createRequire(import.meta.resolve("astro/config"));
const { resolveConfig } = await import(pathToFileURL(require.resolve("vite")).href);
const configurations = [];
for (const [command, mode] of [["serve", "development"], ["serve", "production"], ["build", "production"]]) {
  const resolved = await resolveConfig({ ...config.vite, configFile: false, mode }, command);
  configurations.push({ command, mode, cacheDir: resolved.cacheDir });
}
console.table(configurations);
assert.equal(new Set(configurations.map(config => config.cacheDir)).size, configurations.length,
  "development, prerender and build must not overwrite each other's optimized dependency cache");
console.log("Vite cache isolation check passed.");

const devDependencies = join(configurations[0].cacheDir, "deps");
const buildRequested = process.argv.includes("--build");
const digest = file => createHash("sha256").update(readFileSync(file)).digest("hex");
const before = existsSync(devDependencies)
  ? new Map(readdirSync(devDependencies).filter(file => file.endsWith(".js"))
    .map(file => [file, digest(join(devDependencies, file))]))
  : null;
if (before) assert.ok(before.size > 0, "warm development dependencies before checking build preservation");

if (before || buildRequested) {
  const astroPackage = require.resolve("astro/package.json");
  const cli = fileURLToPath(new URL(JSON.parse(readFileSync(astroPackage, "utf8")).bin.astro, pathToFileURL(astroPackage)));
  const build = spawnSync(process.execPath, [cli, "build"], {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    env: { ...process.env, NODE_ENV: "production" }, stdio: "inherit",
  });
  assert.equal(build.status, 0, "production build must succeed");
}

if (before) {
  for (const [file, hash] of before) {
    const path = join(devDependencies, file);
    assert.ok(existsSync(path), `build removed an active dev dependency: ${file}`);
    assert.equal(digest(path), hash, `build overwrote an active dev dependency: ${file}`);
  }
  console.log(`Production build preserved all ${before.size} active development dependency files.`);
} else if (!buildRequested) {
  console.log("No populated development cache: checked resolved cache isolation only.");
}
