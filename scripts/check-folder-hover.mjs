import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";

const source = stripTypeScriptTypes(readFileSync(new URL("../src/lib/folder-hover.ts", import.meta.url), "utf8")).replace(/^import .*;$/gm, "").replace(/^export /gm, "");
function fixture(returning) {
  const listeners = new Map(); let enter, starts = 0, stops = 0;
  const element = { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) };
  const folderHover = runInNewContext(`${source}\nfolderHover`, {
    document: { querySelector: () => returning ? {} : null },
    hover: (_, callback) => { enter = callback; },
  });
  folderHover(element, () => { ++starts; return () => ++stops; });
  return { enter: () => enter(), move: pointerType => listeners.get("pointermove")?.({ pointerType }), counts: () => ({ starts, stops }), listeners };
}

test("ordinary folder hover keeps its original enter and leave behavior", () => {
  const f = fixture(false), leave = f.enter();
  assert.deepEqual(f.counts(), { starts: 1, stops: 0 });
  leave(); assert.deepEqual(f.counts(), { starts: 1, stops: 1 });
});

test("uncovering a stationary pointer does not animate the folder until real movement", () => {
  const f = fixture(true), leave = f.enter();
  assert.deepEqual(f.counts(), { starts: 0, stops: 0 });
  f.move("touch"); assert.equal(f.counts().starts, 0);
  f.move("mouse"); f.move("mouse"); assert.equal(f.counts().starts, 1);
  leave(); assert.deepEqual(f.counts(), { starts: 1, stops: 1 });
  assert.equal(f.listeners.size, 0);
});

test("leaving a deferred hover discards it without starting or cleaning up an unrelated hover", () => {
  const f = fixture(true), leave = f.enter();
  leave(); f.move("mouse");
  assert.deepEqual(f.counts(), { starts: 0, stops: 0 }); assert.equal(f.listeners.size, 0);
});

test("pen hover keeps the same deferred activation as mouse hover", () => {
  const f = fixture(true), leave = f.enter();
  f.move("pen"); assert.equal(f.counts().starts, 1);
  leave(); assert.equal(f.counts().stops, 1);
});
