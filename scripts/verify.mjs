import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const directory = new URL("./", import.meta.url);
const root = fileURLToPath(new URL("../", directory));
const scriptPath = file => fileURLToPath(new URL(file, directory));
const cacheCheck = "check-vite-cache.mjs";
const typescriptPackage = new URL(import.meta.resolve("typescript/package.json"));
const tsc = fileURLToPath(new URL(JSON.parse(readFileSync(typescriptPackage, "utf8")).bin.tsc, typescriptPackage));
const checks = readdirSync(directory)
  .filter(file => /^check-.*\.mjs$/.test(file) && file !== cacheCheck)
  .sort()
  .map(scriptPath);

for (const args of [
  [scriptPath(cacheCheck), "--build"],
  [tsc, "--noEmit"],
  ["--test", ...checks],
]) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
