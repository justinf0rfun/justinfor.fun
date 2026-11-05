import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";

const source = stripTypeScriptTypes(readFileSync(new URL("../src/scripts/dock-scroll.ts", import.meta.url), "utf8"))
  .replace(/^import .*;$/gm, "").replace(/^export /gm, "");
const events = () => {
  const listeners = new Map();
  return {
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
    fire: (name) => listeners.get(name)?.(),
  };
};
function fixture({ start = 0, reduced = false } = {}) {
  let focused = false, frame = null;
  const media = { ...events(), matches: reduced };
  const window = { ...events(), scrollY: start, innerHeight: 800, innerWidth: 390, visualViewport: events() };
  const document = { documentElement: { scrollHeight: 3000, style: {} } };
  const dock = { ...events(), querySelector: () => focused ? {} : null };
  const value = { current: 1, jump(v) { this.current = v; }, destroy() {} };
  const targets = [];
  const mount = runInNewContext(`${source}\nmountDockScroll`, {
    window, document, matchMedia: () => media,
    motionValue: () => value,
    styleEffect: (element) => { assert.equal(element, dock); return () => {}; },
    animate: (v, target) => { targets.push(target); v.current = target; },
    requestAnimationFrame: (fn) => { frame = fn; return 1; },
    cancelAnimationFrame: () => { frame = null; },
  });
  const destroy = mount(dock);
  const flush = () => { const fn = frame; frame = null; fn?.(); };
  return {
    window, document, media, targets, value, destroy, flush,
    scroll(y) { window.scrollY = y; window.fire("scroll"); flush(); },
    focus(next) { focused = next; dock.fire(next ? "focusin" : "focusout"); },
  };
}

test("scroll down compacts; stopping preserves size; reversing restores after a threshold", () => {
  const f = fixture({ start: 100 });
  f.scroll(115); assert.equal(f.value.current, 1);
  f.scroll(132); assert.equal(f.value.current, 0.84);
  f.scroll(132); assert.equal(f.value.current, 0.84);
  for (const y of [131, 133, 130, 132]) f.scroll(y);
  assert.deepEqual(f.targets, [0.84]);
  f.scroll(111); assert.equal(f.value.current, 1);
});

test("top remains expanded and Safari overscroll does not create a false reversal", () => {
  const f = fixture();
  f.scroll(40); assert.equal(f.value.current, 1);
  f.scroll(100); assert.equal(f.value.current, 0.84);
  f.scroll(2200); f.scroll(2300); f.scroll(2200);
  assert.deepEqual(f.targets, [0.84]);
  f.scroll(0); f.scroll(-80); f.scroll(0);
  assert.equal(f.value.current, 1);
});

test("viewport width changes reset direction without changing the current size", () => {
  const f = fixture({ start: 100 });
  f.scroll(140);
  f.window.scrollY = 300;
  f.window.innerWidth = 844;
  f.window.visualViewport.fire("resize");
  f.scroll(299);
  assert.deepEqual(f.targets, [0.84]);
  f.scroll(275); assert.equal(f.value.current, 1);
});

test("continuous toolbar height changes do not postpone scroll feedback", () => {
  const f = fixture({ start: 100 });
  for (const y of [108, 116, 124, 132, 140]) {
    f.scroll(y);
    f.window.innerHeight += 4;
    f.window.visualViewport.fire("resize");
  }
  assert.equal(f.value.current, 0.84);
});

test("toolbar resize before the queued scroll frame preserves accumulated distance", () => {
  const f = fixture({ start: 100 });
  for (const y of [108, 116, 124, 132, 140]) {
    f.window.scrollY = y;
    f.window.fire("scroll");
    f.window.innerHeight += 4;
    f.window.visualViewport.fire("resize");
    f.flush();
  }
  assert.equal(f.value.current, 0.84);
});

test("changing the bottom scroll boundary does not look like a user reversing direction", () => {
  const f = fixture({ start: 2100 });
  f.scroll(2200);
  f.window.innerHeight = 840;
  f.window.scrollY = 2160;
  f.window.visualViewport.fire("resize");
  f.scroll(2160);
  f.window.innerHeight = 800;
  f.window.scrollY = 2200;
  f.window.visualViewport.fire("resize");
  f.scroll(2200);
  assert.deepEqual(f.targets, [0.84]);
  f.scroll(2180);
  assert.equal(f.value.current, 1);
});

test("keyboard focus expands the dock and pauses shrinking while operating its controls", () => {
  const f = fixture({ start: 100 });
  f.scroll(140); f.focus(true); f.scroll(300);
  assert.equal(f.value.current, 1);
  f.focus(false); f.scroll(332);
  assert.equal(f.value.current, 0.84);
});

test("reduced motion keeps the original dock, including a preference change mid-scroll", () => {
  const f = fixture({ reduced: true });
  f.scroll(200); assert.deepEqual(f.targets, []);
  f.media.matches = false; f.media.fire("change"); f.scroll(240);
  assert.equal(f.value.current, 0.84);
  f.media.matches = true; f.media.fire("change"); f.scroll(300);
  assert.equal(f.value.current, 1);
});

test("folder scroll locks, history restoration, and cleanup do not leave stale scroll state", () => {
  const f = fixture({ start: 100 });
  f.document.documentElement.style.overflow = "hidden";
  f.scroll(300); assert.deepEqual(f.targets, []);
  f.document.documentElement.style.overflow = "";
  f.scroll(332); assert.equal(f.value.current, 0.84);
  f.window.fire("pageshow"); assert.equal(f.value.current, 1);
  f.destroy(); f.scroll(600); assert.equal(f.value.current, 1);
});
