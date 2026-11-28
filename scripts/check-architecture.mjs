import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const requireFromAstro = createRequire(import.meta.resolve("astro/config"));
const { parse: parseAstro } = requireFromAstro("@astrojs/compiler-rs");
const { parseAst } = await import(pathToFileURL(requireFromAstro.resolve("vite")).href);
const project = fileURLToPath(new URL("../", import.meta.url));
const extensions = [".astro", ".ts", ".tsx", ".js", ".mjs", ".css", ".json"];
const files = readdirSync(join(project, "src"), { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile())
  .map(entry => join(entry.parentPath, entry.name))
  .sort();
const known = new Set(files);
const graph = new Map();
const name = file => relative(project, file).split(sep).join("/");

function collectImports(node, imports) {
  if (!node || typeof node !== "object") return;
  switch (node.type) {
    case "ImportDeclaration":
    case "ExportNamedDeclaration":
    case "ExportAllDeclaration":
    case "ImportExpression":
    case "TSImportType":
      if (typeof node.source?.value === "string") imports.add(node.source.value);
      break;
    case "JSXOpeningElement":
      if (node.name?.name === "script") {
        const src = node.attributes.find(attribute => attribute.name?.name === "src")?.value?.value;
        if (typeof src === "string") imports.add(src);
      }
      break;
  }
  for (const child of Object.values(node)) {
    if (Array.isArray(child)) child.forEach(child => collectImports(child, imports));
    else collectImports(child, imports);
  }
}

for (const file of files) {
  const ext = extname(file);
  const imports = new Set();
  if (extensions.includes(ext) && ext !== ".json") {
    const source = readFileSync(file, "utf8");
    if (ext === ".css") {
      for (const [, specifier] of source.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/g)) imports.add(specifier);
    } else {
      const lang = file.endsWith(".d.ts") ? "dts" : ext.slice(1).replace("mjs", "js");
      const ast = ext === ".astro"
        ? parseAstro(source).ast
        : parseAst(source, { lang }, file);
      collectImports(ast, imports);
    }
  }
  const targets = [];
  for (const specifier of imports) {
    const path = specifier.split(/[?#]/, 1)[0];
    let target;
    if (path.startsWith("/src/")) target = resolve(project, "." + path);
    else if (/^\.\.?\//.test(path)) target = resolve(dirname(file), path);
    else continue;
    const candidates = [target, ...extensions.map(ext => target + ext), ...extensions.map(ext => join(target, "index" + ext))];
    const resolved = candidates.find(candidate => known.has(candidate));
    assert.ok(resolved, `${name(file)} has an unrecognized local dependency ${specifier}`);
    targets.push(resolved);
  }
  graph.set(file, targets);
}

const visited = new Set();
const visiting = new Set();
function checkCycles(file) {
  if (visited.has(file)) return;
  assert.ok(!visiting.has(file), `Dependency cycle: ${[...visiting, file].map(name).join(" → ")}`);
  visiting.add(file);
  graph.get(file).forEach(checkCycles);
  visiting.delete(file);
  visited.add(file);
}

for (const [file, targets] of graph) {
  checkCycles(file);
  if (!name(file).startsWith("src/data/")) continue;
  for (const target of targets) {
    assert.doesNotMatch(name(target), /^src\/(?:components\/|layouts\/|pages\/|scripts\/|styles\/|worker\.js$|engineering-feed\.js$)/,
      `${name(file)} depends on the presentation or runtime entry point ${name(target)}`);
  }
}

if (process.argv.includes("--graph")) {
  console.log(JSON.stringify(Object.fromEntries([...graph].map(([file, targets]) => [name(file), targets.map(name).sort()])), null, 2));
} else {
  console.log(`Architecture check passed for ${graph.size} source files.`);
}
