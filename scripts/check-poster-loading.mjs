import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
const section = html.match(/<section\b[^>]*class="belief-notes"[^>]*>(.*?)<\/section>/s)?.[1];
assert.ok(section, "homepage poster section must be rendered");

// A skeleton must not replace the server-rendered image before the browser can load it.
const images = [...section.matchAll(/<img\b([^>]+)>/g)].map((match) => match[1]);
assert.equal(images.length, 3);
for (const image of images) {
  assert.match(image, /\bwidth="[1-9]\d*"/);
  assert.match(image, /\bheight="[1-9]\d*"/);
  assert.match(image, /\balt="[^"]+"/);
  assert.match(image, /\bcrossorigin="anonymous"/i);
}
assert.doesNotMatch(section, /aria-busy="true"/);
assert.equal([...section.matchAll(/<a\b/g)].length, 3, "only source captions should link");
assert.equal([...section.matchAll(/<figcaption\b[^>]*>\s*via <a\b/g)].length, 3);
console.log("Poster SSR check passed: 3 sized images, no initial loading lock, only via links.");
