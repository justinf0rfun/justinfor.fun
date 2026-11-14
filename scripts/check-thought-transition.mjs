import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";

const source = stripTypeScriptTypes(readFileSync(new URL("../src/lib/thought-transition.ts", import.meta.url), "utf8"))
  .replace(/^export /gm, "");

function fixture(reduced = false) {
  const animations = [], swaps = [];
  const pane = { animate(frames, options) {
    let resolve;
    const animation = { frames, options, cancelled: false, finished: new Promise((done) => { resolve = done; }),
      finish() { resolve(); }, cancel() { this.cancelled = true; resolve(); } };
    animations.push(animation);
    return animation;
  } };
  const create = runInNewContext(`${source}\ncreateThoughtTransition`, {
    matchMedia: () => ({ matches: reduced }),
    getComputedStyle: () => ({ opacity: "0.6", transform: "matrix(1, 0, 0, 1, 0, 4)", filter: "blur(2px)" }),
  });
  return { animations, swaps, change: create(pane), swap: (id) => () => swaps.push(id) };
}

test("preview swaps after exit and releases animation effects after entry", async () => {
  const f = fixture();
  const pending = f.change(f.swap("next"));
  assert.deepEqual(f.swaps, []);
  assert.equal(f.animations[0].options.duration, 160);
  assert.equal(f.animations[0].frames[0].opacity, "0.6");
  f.animations[0].finish();
  await pending;
  assert.deepEqual(f.swaps, ["next"]);
  assert.equal(f.animations[0].cancelled, true);
  assert.equal(f.animations[1].options.duration, 600);
  assert.equal(f.animations[1].options.fill, undefined);
});

test("rapid selection never commits an outdated article", async () => {
  const f = fixture();
  const first = f.change(f.swap("first"));
  const last = f.change(f.swap("last"));
  assert.equal(f.animations[0].cancelled, true);
  f.animations[1].finish();
  await Promise.all([first, last]);
  assert.deepEqual(f.swaps, ["last"]);
});

test("keyboard and reduced-motion selection are immediate, cancelling pending motion", async () => {
  for (const reduced of [false, true]) {
    const f = fixture(reduced);
    const first = f.change(f.swap("first"));
    await f.change(f.swap("keyboard"), false);
    await first;
    assert.equal(f.swaps.at(-1), "keyboard");
    if (reduced) assert.equal(f.animations.length, 0);
    else assert.equal(f.animations[0].cancelled, true);
  }
});
