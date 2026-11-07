import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

// Reads the public bundles as data; evaluates only their isolated artwork module with React stubs.
const cache = process.argv[2];
assert.ok(cache, "Usage: node extract-artwork.mjs <downloaded-public-bundle-directory>");
const output = resolve(dirname(fileURLToPath(import.meta.url)), "../artwork");
const require = createRequire(new URL("../../../package.json", import.meta.url));
const React = require("react");
const jsx = require("react/jsx-runtime");
const { renderToStaticMarkup } = require("react-dom/server");
const artworkBundle = "10ysidpnhxe89.js";
const tokenBundle = "17brw7d926k_q.js";
const stylesheet = "0b56~22g19qgj.css";
const sourceURL = `https://www.graphicalui.com/_next/static/chunks/${artworkBundle}`;
const cssURL = `https://www.graphicalui.com/_next/static/chunks/${stylesheet}`;
const script = readFileSync(join(cache, artworkBundle), "utf8");
const tokenScript = readFileSync(join(cache, tokenBundle), "utf8");
const cssSource = readFileSync(join(cache, stylesheet), "utf8");
const classStart = tokenScript.indexOf("e.v({") + 5;
const classEnd = tokenScript.indexOf("})},490942", classStart);
assert.ok(classStart > 4 && classEnd > classStart);
const classes = Object.fromEntries([...tokenScript.slice(classStart, classEnd).matchAll(/(\w+):"([^"]+)"/g)].map(match => [match[1], match[2]]));
const prefix = ",802503,e=>{";
const start = script.indexOf(prefix) + prefix.length;
const end = script.indexOf("},599208,e=>", start);
assert.ok(start >= prefix.length && end > start);
const exports = {};
const modules = new Map([[843476, jsx], [657688, { default: "img" }], [258470, { default: classes }], [271645, React]]);
runInNewContext(`(function(e){${script.slice(start, end)}})`, {})({
  i(id) { assert.ok(modules.has(id), `Unexpected import ${id}`); return modules.get(id); },
  s(entries) { for (let i = 0; i < entries.length; i += 3) exports[entries[i]] = entries[i + 2]; },
});
assert.equal(typeof exports.LanguageArtwork, "function");
assert.equal(typeof exports.DetailArtwork, "function");

const wantedClasses = ["pictogram", "categoryArtwork", "miniToggle", "miniSwatches", "miniType", "miniEffect", "artworkOutline"];
const originalRules = cssSource.split("}").filter(rule => wantedClasses.some(name => rule.includes(`__${name}`))).map(rule => `${rule}}`).join("\n");
assert.ok(!originalRules.includes("@media"), "Unexpected nested CSS: inspect before extraction");
mkdirSync(output, { recursive: true });
writeFileSync(join(output, "artwork.css"), `/* Original Graphical artwork rules, extracted from ${cssURL}. */\n${originalRules}\n`);

const states = [
  { id: "themes", label: "themes", group: "language", kind: "theme", rotation: -9, offsetX: 0, svg: true },
  { id: "systems", label: "systems", group: "language", kind: "system", rotation: 4, offsetX: 0, svg: true },
  { id: "languages", label: "languages", group: "language", kind: "language", rotation: 12, offsetX: 0, svg: true },
  { id: "components", label: "components", group: "detail", kind: "components", rotation: -5, offsetX: 0 },
  { id: "colors", label: "colors", group: "detail", kind: "colors", rotation: -8, offsetX: 10 },
  { id: "type", label: "type", group: "detail", kind: "type", rotation: -13, offsetX: 0 },
  { id: "spacing", label: "spacing", group: "detail", kind: "spacing", rotation: -6, offsetX: 0, svg: true },
  { id: "icons", label: "icons", group: "detail", kind: "icons", rotation: -7, offsetX: 2, svg: true },
  { id: "effects", label: "effects", group: "detail", kind: "effects", rotation: 11, offsetX: 0 },
  { id: "states", label: "states", group: "detail", kind: "states", rotation: -11, offsetX: 4, svg: true },
  { id: "motion", label: "motion", group: "detail", kind: "motion", rotation: 6, offsetX: 2, svg: true },
];

const manifest = states.map(state => {
  const component = state.group === "language" ? exports.LanguageArtwork : exports.DetailArtwork;
  const markup = renderToStaticMarkup(React.createElement(component, { kind: state.kind }));
  assert.ok(markup.includes(`data-kind="${state.kind}"`));
  writeFileSync(join(output, `${state.id}.fragment.html`), `${markup}\n`);
  if (state.svg) {
    const svg = markup.match(/<svg\b[\s\S]*<\/svg>/)?.[0];
    assert.ok(svg, `${state.id} must contain its original SVG`);
    writeFileSync(join(output, `${state.id}.svg`), `${svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" style="overflow:visible" ')}\n`);
  }
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Graphical — ${state.label} original artwork</title><link rel="stylesheet" href="artwork.css">
<style>
@font-face{font-family:"GT Standard L";src:url("../fonts/GT-Standard-L-Standard-Semibold.woff2") format("woff2");font-style:normal;font-weight:600;font-display:swap}
html,body{margin:0;width:100%;height:100%;background:transparent}
.artwork-stage{--companion:#26d95d;--art-gradient:linear-gradient(140deg,#ffe22d,#ff6b39 48%,#fa27b9);--marketing-display-font:"GT Standard L",sans-serif;--token-artwork-scale:1;position:relative;width:100%;height:100%;font-size:75vw}
.artwork-layer{position:absolute;inset:0;transform:translateX(${state.offsetX / 128 * 100}vw) rotate(${state.rotation}deg)}
.artwork-stage .${classes.pictogram}{left:calc(50% - .47em)}
</style></head><body><div class="artwork-stage" role="img" aria-label="${state.label}"><div class="artwork-layer">${markup}</div></div></body></html>
`;
  writeFileSync(join(output, `${state.id}.html`), html);
  return {
    id: state.id, label: state.label, group: state.group, kind: state.kind,
    type: state.svg ? "svg" : "html-css", filepath: `artwork/${state.id}.${state.svg ? "svg" : "html"}`,
    previewPath: `artwork/${state.id}.html`, originalFragmentPath: `artwork/${state.id}.fragment.html`,
    sourceURL, stylesheetURL: cssURL,
    sourceBundleSha256: createHash("sha256").update(script).digest("hex"),
    renderingNotes: {
      exactArtwork: "Rendered from the original public React artwork module; no path or illustration was redrawn.",
      outerRotationDegrees: state.rotation, outerOffsetXPx: state.offsetX,
      originalHeroArtworkScale: 1.44, previewArtworkScale: 1,
      dependencies: state.id === "type" ? ["artwork/artwork.css", "fonts/GT-Standard-L-Standard-Semibold.woff2"] : state.svg ? [] : ["artwork/artwork.css"],
      note: state.svg ? "Standalone SVG preserves original paths; use its HTML preview for original outer rotation, optical offset and shadow." : state.id === "type" ? "Original SVG text remains text; exact glyphs require the original GT Standard L Semibold font." : "Original CSS drawing remains HTML/CSS; effects uses backdrop-filter and retains transparency.",
    },
  };
});
assert.equal(manifest.length, 11);
assert.equal(new Set(manifest.map(asset => asset.id)).size, 11);
writeFileSync(join(output, "artwork.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Extracted ${manifest.length} original artwork states: ${states.filter(state => state.svg).length} SVG + ${states.filter(state => !state.svg).length} HTML/CSS.`);
