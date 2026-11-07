import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const html = read("../dist/index.html");
const trigger = html.match(/<button\b[^>]*data-home-chat-trigger[^>]*>/)?.[0];
assert.ok(trigger, "homepage must expose a Chat entry");
assert.match(trigger, /aria-controls="home-chat"/);
assert.match(trigger, /aria-expanded="false"/);
assert.match(trigger, /\bdisabled\b/, "do not expose a dead button before hydration");

const island = html.match(/<astro-island\b[^>]*component-url="[^"]*HomeChat[^>]*>/)?.[0];
assert.ok(island, "chat must be a separate island");
assert.match(island, /client="load"/, "Say hi must work on mobile as well as desktop");
assert.match(html, /Say hi/);
assert.match(html, /aria-label="Open voice demo"/);
const panel = html.match(/<section\b[^>]*id="home-chat"[^>]*>/)?.[0];
assert.ok(panel);
assert.match(panel, /data-open="false"/);
assert.match(panel, /\binert\b/, "closed chat must not receive keyboard focus");
assert.match(panel, /aria-modal="false"/, "the homepage stays usable alongside chat");
assert.equal([...html.matchAll(/id="home-chat"/g)].length, 1);

for (const route of ["thoughts", "what-i-use", "music", "memory"]) {
  assert.doesNotMatch(read(`../dist/${route}/index.html`), /data-home-chat-trigger|id="home-chat"/);
}
console.log("Chat SSR check passed: shared Say hi and voice entry, initially inert island; other pages unchanged.");
