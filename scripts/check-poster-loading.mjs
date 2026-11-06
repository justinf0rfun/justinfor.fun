import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
const section = html.match(/<section\b[^>]*class="belief-notes"[^>]*>(.*?)<\/section>/s)?.[1];
assert.ok(section, "homepage poster section must be rendered");

const fallbacks = [...section.matchAll(/<noscript\b[^>]*>(.*?)<\/noscript>/gs)].map((match) => match[1]);
assert.equal(fallbacks.length, 3, "every entrance needs an image fallback without JavaScript");
const enhanced = section.replace(/<noscript\b[^>]*>.*?<\/noscript>/gs, "");
const images = [...enhanced.matchAll(/<img\b([^>]+)>/g)].map((match) => match[1]);
assert.equal(images.length, 3);
for (const image of images) {
  assert.match(image, /\bwidth="[1-9]\d*"/);
  assert.match(image, /\bheight="[1-9]\d*"/);
  assert.match(image, /\balt="[^"]+"/);
  assert.match(image, /\bcrossorigin="anonymous"/i);
}
for (const fallback of fallbacks) {
  assert.match(fallback, /belief-sticker-reveal\{display:none!important\}/);
  assert.match(fallback, /<img\b[^>]+alt="[^"]+"/);
}
assert.equal([...enhanced.matchAll(/aria-busy="true"/g)].length, 3, "all three posters start with an entrance skeleton");
assert.equal([...section.matchAll(/<a\b/g)].length, 3, "only source captions should link");
assert.equal([...section.matchAll(/<figcaption\b[^>]*>\s*via <a\b/g)].length, 3);
console.log("Poster SSR check passed: 3 sized entrances, 3 no-JS image fallbacks, only via links.");
