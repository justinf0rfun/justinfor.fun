import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { spring } from "motion";

const source = stripTypeScriptTypes(readFileSync(new URL("../src/scripts/dock-scroll.ts", import.meta.url), "utf8"))
  .replace(/^import .*;$/gm, "").replace(/^export /gm, "");
const events = () => {
  const listeners = new Map();
  return {
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
    fire: (name, ...args) => listeners.get(name)?.(...args),
  };
};
function fixture({ start = 0, reduced = false, touch = false } = {}) {
  let focused = false, frame = null;
  const media = { ...events(), matches: reduced };
  const pointer = { ...events(), matches: touch };
  const window = { ...events(), scrollY: start, innerHeight: 800, innerWidth: 390, visualViewport: events() };
  const document = { documentElement: { scrollHeight: 3000, style: {} } };
  const properties = new Map();
  const wrap = { style: {
    setProperty: (key, value) => properties.set(key, value),
    removeProperty: (key) => properties.delete(key),
  } };
  const anchor = () => properties.get("--dock-anchor-top") ?? `${window.innerHeight - 38}px`;
  const value = { current: 1 };
  const dock = {
    ...events(), parentElement: wrap, querySelector: () => focused ? {} : null,
    style: { removeProperty: (key) => { if (key === "transform") value.current = 1; } },
  };
  const targets = [], animations = [];
  const mount = runInNewContext(`${source}\nmountDockScroll`, {
    window, document, matchMedia: (query) => query.includes("pointer") ? pointer : media,
    getComputedStyle: () => ({ top: anchor() }),
    animate: (element, keyframes, options) => {
      assert.equal(element, dock);
      assert.deepEqual(Object.keys(keyframes), ["transform"]);
      const target = Number(keyframes.transform.match(/^scale\(([\d.]+)\)$/)[1]);
      targets.push(target); animations.push(options); value.current = target;
      return { stop() {} };
    },
    requestAnimationFrame: (fn) => { frame = fn; return 1; },
    cancelAnimationFrame: () => { frame = null; },
  });
  const destroy = mount(dock);
  const flush = () => { const fn = frame; frame = null; fn?.(); };
  return {
    window, document, media, targets, animations, value, destroy, flush, anchor, properties,
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

test("mobile dock anchor stays fixed when the host resizes the entire webview", () => {
  const f = fixture({ touch: true });
  const initial = f.anchor();
  for (const height of [814, 828, 842, 820, 800]) {
    f.window.innerHeight = height;
    f.window.fire("resize");
    f.window.visualViewport.fire("resize");
    assert.equal(f.anchor(), initial);
  }
  f.window.innerWidth = 844;
  f.window.innerHeight = 390;
  f.window.fire("resize");
  assert.equal(f.anchor(), "352px");
  f.destroy();
  assert.equal(f.properties.size, 0);
});

test("desktop dock does not acquire a fixed mobile anchor", () => {
  const f = fixture();
  assert.equal(f.properties.size, 0);
  f.window.innerHeight = 900; f.window.fire("resize");
  assert.equal(f.properties.size, 0);
});

test("scale eases through intermediate sizes instead of completing in a snap", () => {
  const f = fixture({ start: 100 });
  f.scroll(140);
  const animation = spring({ keyframes: [1, 0.84], ...f.animations[0] });
  let previous = 1;
  for (let frame = 1; frame <= 42; frame++) {
    const t = frame * 1000 / 60;
    const { value } = animation.next(t);
    assert.ok(Math.abs(value - previous) <= 0.015, `large scale step at ${t}ms`);
    assert.ok(value <= previous + 0.001 && value >= 0.839, "no visible bounce");
    if (t <= 150) assert.ok(value > 0.856, "do not finish most of the movement in 150ms");
    previous = value;
  }
  assert.ok(Math.abs(previous - 0.84) < 0.001);
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

test("opening chat restores full size immediately and suspends scroll scaling until closed", () => {
  const f = fixture({ start: 100 });
  f.scroll(140);
  assert.equal(f.value.current, 0.84);
  f.window.fire("home-chat-change", { detail: true });
  assert.equal(f.value.current, 1);
  assert.equal(f.animations.at(-1).duration, 0);
  f.scroll(300); f.scroll(280); f.scroll(400);
  assert.deepEqual(f.targets, [0.84, 1]);
  f.window.fire("home-chat-change", { detail: false });
  f.scroll(431);
  assert.equal(f.value.current, 1);
  f.scroll(432);
  assert.equal(f.value.current, 0.84);
});

test("chat keeps its mobile anchor during viewport changes and repins when closed", () => {
  const f = fixture({ touch: true });
  const initial = f.anchor();
  f.window.fire("home-chat-change", { detail: true });
  for (const height of [840, 790, 900]) {
    f.window.innerHeight = height;
    f.window.fire("resize");
    f.window.visualViewport.fire("resize");
    assert.equal(f.anchor(), initial);
  }
  f.window.innerWidth = 844;
  f.window.innerHeight = 390;
  f.window.fire("resize");
  assert.equal(f.anchor(), initial);
  f.window.fire("home-chat-change", { detail: false });
  assert.equal(f.anchor(), "352px");
});

test("cleanup removes chat events as well as scroll tracking", () => {
  const f = fixture({ touch: true });
  f.window.fire("home-chat-change", { detail: true });
  f.destroy();
  const animationCount = f.targets.length;
  f.window.fire("home-chat-change", { detail: false });
  f.scroll(300);
  assert.equal(f.targets.length, animationCount);
  assert.equal(f.properties.size, 0);
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
