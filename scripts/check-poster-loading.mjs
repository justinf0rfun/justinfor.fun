import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
const section = html.match(/<section\b[^>]*class="belief-notes belief-deck"[^>]*>(.*?)<\/section>/s)?.[1];
assert.ok(section, "homepage poster section must be rendered");
assert.doesNotMatch(section, /data-taped|--tape-wash|\/home\/acu-note\.png/, "posters must not render decorative or embedded tape");

const fallbacks = [...section.matchAll(/<noscript\b[^>]*>(.*?)<\/noscript>/gs)].map((match) => match[1]);
assert.equal(fallbacks.length, 1, "the deck has one static reading layout without JavaScript");
const enhanced = section.replace(/<noscript\b[^>]*>.*?<\/noscript>/gs, "");
const images = [...enhanced.matchAll(/<img\b([^>]+)>/g)].map((match) => match[1]);
assert.equal(images.length, 5);
assert.match(section, /Attention Is All You Need/);
assert.match(section, /The Bitter Lesson/);
for (const src of ["acu-note-portrait.webp", "first-do-it-portrait.webp"]) {
  const image = images.find(attributes => attributes.includes(src));
  assert.ok(image, `portrait poster missing: ${src}`);
  const width = Number(image.match(/\bwidth="(\d+)"/)[1]);
  const height = Number(image.match(/\bheight="(\d+)"/)[1]);
  assert.equal(width / height, 3 / 4, `${src} must use portrait dimensions`);
}
for (const image of images) {
  assert.match(image, /\bwidth="[1-9]\d*"/);
  assert.match(image, /\bheight="[1-9]\d*"/);
  assert.match(image, /\balt="[^"]+"/);
  assert.match(image, /\bcrossorigin="anonymous"/i);
}
for (const fallback of fallbacks) {
  assert.match(fallback, /\.belief-stage\{[^}]*height:auto/);
  assert.match(fallback, /transform:none!important/);
  assert.match(fallback, /\.belief-card-credit\{display:block\}/);
}
assert.equal([...enhanced.matchAll(/aria-busy="true"/g)].length, 0, "the compact deck must render real posters before hydration");
assert.equal([...section.matchAll(/<a\b/g)].length, 6, "five static source credits and the active source stay available");
assert.equal([...section.matchAll(/<figcaption\b/g)].length, 5);
assert.equal([...section.matchAll(/data-sticker-card=/g)].length, 5);
console.log("Poster SSR check passed: 5 sized real images, compact deck, accessible source credits and no-JS reading layout.");
