import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";
import { setImmediate } from "node:timers/promises";
import test from "node:test";
import { mix } from "motion";

const source = stripTypeScriptTypes(readFileSync(new URL("../src/scripts/reading-capsule.ts", import.meta.url), "utf8"))
  .replace(/^import .*;$/gm, "").replace(/^export /gm, "");

class Element {
  attrs = new Map(); listeners = new Map(); selectors = {}; children = new Set(); offsetHeight = 0;
  style = {};
  addEventListener(event, callback) { this.listeners.set(event, callback); }
  fire(event, value = {}) { this.listeners.get(event)?.(value); }
  querySelector(selector) { return this.selectors[selector] ?? null; }
  setAttribute(name, value) { this.attrs.set(name, value); this.onAttribute?.(name); }
  removeAttribute(name) { this.attrs.delete(name); }
  toggleAttribute(name, value) { if (value) this.attrs.set(name, ""); else this.attrs.delete(name); }
  contains(target) { return target === this || this.children.has(target); }
}

function fixture(reduced = false, titleBottom = -1, manual = false) {
  const document = new Element(), capsule = new Element(), toggle = new Element(), toolbar = new Element(), chapters = new Element(), share = new Element();
  const wrap = new Element(), title = new Element(), window = new Element();
  const actions = new Element();
  actions.popoverOpen = false;
  actions.matches = () => actions.popoverOpen;
  actions.hidePopover = () => { actions.popoverOpen = false; };
  const surface = new Element(), brand = new Element(), mark = new Element();
  const avatar = new Element();
  const shareSurface = new Element(), shareLabel = new Element();
  capsule.getBoundingClientRect = () => ({ width: 366 });
  title.bottom = titleBottom;
  title.getBoundingClientRect = () => ({ bottom: title.bottom });
  const mobile = new Element(); mobile.matches = true;
  const motion = new Element(); motion.matches = reduced;
  const animations = [];
  const firstVisible = [];
  wrap.onAttribute = (name) => {
    if (name === "data-visible") firstVisible.push({ clip: surface.style.clipPath, opacity: capsule.style.opacity,
      transform: capsule.style.transform, brand: brand.style.transform, label: toggle.style.opacity,
      parentClipEnabled: capsule.attrs.has("data-entry-ready") });
  };
  const location = { hash: "" };
  window.location = location;
  const frames = [];
  document.selectors["[data-reading-wrap]"] = wrap;
  document.selectors[".article-prose h1"] = title;
  document.selectors["[data-article-actions]"] = actions;
  toolbar.offsetHeight = 58; chapters.offsetHeight = 240;
  document.selectors["[data-reading-capsule]"] = capsule;
  capsule.selectors = { "[data-reading-toggle]": toggle, "[data-reading-toolbar]": toolbar, "[data-reading-chapters]": chapters, "[data-reading-share]": share,
    "[data-reading-surface]": surface, "[data-reading-brand]": brand };
  brand.selectors = { "[data-reading-dot]": mark, ".reading-back": avatar };
  share.selectors = { "[data-reading-share-surface]": shareSurface, "[data-reading-share-label]": shareLabel };
  capsule.children = new Set([toggle, toolbar, chapters, share]);
  toggle.focus = () => { document.activeElement = toggle; };
  const mount = runInNewContext(`${source}\nmountReadingCapsule`, {
    document, Element, Node: Element, queueMicrotask, window,
    requestAnimationFrame: callback => { frames.push(callback); return frames.length; },
    matchMedia: (query) => query.includes("reduced") ? motion : mobile,
    ResizeObserver: class { observe() {} },
    animate: (target, values, options) => {
      let finish;
      const finished = manual ? new Promise(resolve => { finish = resolve; }) : Promise.resolve();
      const animation = { target, values, options, finished, finish: () => finish?.(), stopped: false, stop() { this.stopped = true; } };
      animations.push(animation); return animation;
    },
  });
  mount();
  return { document, capsule, toggle, toolbar, chapters, share, mobile, animations, location, wrap, title, window, surface, brand, shareSurface, shareLabel, firstVisible, mark, avatar, actions,
    get panelAnimations() { return animations.filter(({ values }) => typeof values === "object" && "height" in values); },
    flush: () => { while (frames.length) frames.shift()(); } };
}

test("capsule expands in place, exposes chapters, and interrupts a reversal", () => {
  const f = fixture();
  f.toggle.fire("click");
  assert.equal(f.toggle.attrs.get("aria-expanded"), "true");
  assert.equal(f.chapters.inert, false);
  assert.equal(f.panelAnimations[0].values.height, 298);
  f.toggle.fire("click");
  assert.equal(f.panelAnimations[0].stopped, true);
  assert.equal(f.panelAnimations[1].values.height, 58);
  assert.equal(f.chapters.inert, true);
  assert.equal(f.chapters.attrs.get("aria-hidden"), "true");
});

test("outside press, Escape, sharing, and desktop resize dismiss the chapter list", () => {
  const f = fixture();
  for (const close of [
    () => f.document.fire("pointerdown", { target: new Element() }),
    () => f.document.fire("keydown", { key: "Escape" }),
    () => f.share.fire("click"),
    () => { f.mobile.matches = false; f.mobile.fire("change"); },
  ]) {
    f.toggle.fire("click"); f.document.activeElement = f.chapters;
    close();
    assert.equal(f.toggle.attrs.get("aria-expanded"), "false");
    assert.equal(f.chapters.inert, true);
  }
  assert.equal(f.document.activeElement, f.chapters);
});

test("Escape returns focus to the toggle and reduced motion has no spring duration", () => {
  const f = fixture(true);
  f.toggle.fire("click"); f.document.activeElement = f.chapters;
  f.document.fire("keydown", { key: "Escape" });
  assert.equal(f.document.activeElement, f.toggle);
  assert.ok(f.animations.every(({ options }) => options.duration === 0));
});

test("chapter activation still navigates when the collapsing list becomes inert", () => {
  const f = fixture();
  const link = new Element(); link.hash = "#a-section"; link.closest = () => link;
  f.toggle.fire("click");
  let prevented = false;
  f.chapters.fire("click", { target: link, preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(f.location.hash, "#a-section");
  assert.equal(f.chapters.inert, true);
});

test("focus transfer between capsule controls never dismisses before chapter activation", () => {
  const f = fixture();
  f.toggle.fire("click");
  for (const relatedTarget of [null, f.chapters, f.share]) {
    f.capsule.fire("focusout", { relatedTarget });
    assert.equal(f.chapters.inert, false);
  }
  f.capsule.fire("focusout", { relatedTarget: new Element() });
  assert.equal(f.chapters.inert, true);
});

test("first screen stays hidden; scrolling past the title reveals and returning closes the capsule", async () => {
  const f = fixture(false, 160);
  assert.equal(f.wrap.inert, true);
  assert.equal(f.wrap.attrs.get("aria-hidden"), "true");
  f.title.bottom = -1;
  f.window.fire("scroll"); f.flush();
  await setImmediate();
  assert.equal(f.wrap.inert, false);
  assert.equal(f.wrap.attrs.get("aria-hidden"), "false");
  f.toggle.fire("click");
  f.title.bottom = 1;
  f.window.fire("scroll"); f.flush();
  assert.equal(f.wrap.inert, true);
  assert.equal(f.toggle.attrs.get("aria-expanded"), "false");
});

test("opening chapters or returning to the title closes the mobile action popover", () => {
  const f = fixture();
  f.actions.popoverOpen = true;
  f.toggle.fire("click");
  assert.equal(f.actions.popoverOpen, false);
  f.actions.popoverOpen = true;
  f.title.bottom = 160;
  f.window.fire("scroll"); f.flush();
  assert.equal(f.actions.popoverOpen, false);
});

test("entry preserves the original Dots drop, circle spread and delayed content timing", async () => {
  const f = fixture();
  const drop = f.animations.find(({ target, values }) => target === f.capsule && Array.isArray(values.transform));
  assert.deepEqual(Array.from(drop.values.transform), ["translateY(-180px)", "translateY(72px)", "translateY(0px)"]);
  assert.equal(drop.options.delay, 0.085);
  assert.equal(drop.options.duration, 1.0916);
  const surface = f.animations.find(({ target }) => target === f.surface);
  assert.equal(surface.options.delay, 0.558);
  assert.equal(surface.options.duration, 0.509);
  assert.match(surface.values.clipPath[0], /50% - 29px/);
  const label = f.animations.find(({ target }) => target === f.toggle);
  assert.equal(label.options.delay, 0.63);
  assert.equal(label.options.duration, 0.577);
  assert.equal(f.wrap.inert, true);
  await setImmediate();
  assert.equal(f.wrap.inert, false);
});

test("surface interpolation preserves the centered circle rather than producing a rectangular inset", () => {
  const f = fixture();
  const { values } = f.animations.find(({ target }) => target === f.surface);
  const [from, to] = values.clipPath;
  const interpolate = mix(from, to);
  assert.equal(interpolate(0), from);
  assert.equal(interpolate(1), to);
  assert.match(interpolate(0.5), /calc\(/);
});

test("the live entrance is circular and offscreen before visibility changes, without seeking animation time", () => {
  const f = fixture();
  assert.match(f.firstVisible[0].clip ?? "", /50% - 29px/);
  assert.equal(f.firstVisible[0].opacity, "0");
  assert.equal(f.firstVisible[0].transform, "translateY(-180px)");
  assert.equal(f.firstVisible[0].label, "0");
  assert.equal(f.firstVisible[0].parentClipEnabled, false);
  assert.equal(f.mark.style.opacity, "1");
  assert.equal(f.avatar.style.opacity, "0");
  assert.equal(f.capsule.attrs.has("data-entry-ready"), false);
});

test("the original ring remains throughout entry and only then hands off to the personal avatar", async () => {
  const f = fixture(false, -1, true);
  assert.equal(f.avatar.style.opacity, "0");
  assert.equal(f.animations.some(({ target }) => target === f.avatar), false);
  f.animations.forEach(animation => animation.finish());
  await setImmediate();
  assert.equal(f.capsule.attrs.has("data-entry-ready"), true);
  assert.equal(f.animations.find(({ target }) => target === f.avatar).values.opacity, 1);
  assert.equal(f.animations.find(({ target, values }) => target === f.mark && "opacity" in values).values.opacity, 0);
});

test("CTA stretch follows the original progress wave and settles without a residual tail", () => {
  const f = fixture();
  const progress = f.animations.find(({ target }) => target === 0);
  assert.equal(progress.options.delay, 0.558);
  assert.equal(progress.options.duration, 0.509);
  progress.options.onUpdate(0.5);
  assert.equal(f.shareSurface.style.clipPath, "inset(0px 0px 0px 0px round 999px)");
  assert.equal(f.shareLabel.style.transform, "translateX(-16px)");
  progress.options.onUpdate(1);
  assert.equal(f.shareSurface.style.clipPath, "inset(0px 0px 0px 32px round 999px)");
  assert.equal(f.shareLabel.style.transform, "translateX(0px)");
});

test("reversing the scroll during entry cancels stale completion and releases only the latest entry", async () => {
  const f = fixture(false, 160, true);
  f.title.bottom = -1; f.window.fire("scroll"); f.flush();
  const old = [...f.animations];
  f.title.bottom = 1; f.window.fire("scroll"); f.flush();
  const exit = f.animations.at(-1);
  f.title.bottom = -1; f.window.fire("scroll"); f.flush();
  old.forEach(animation => animation.finish()); exit.finish();
  await setImmediate();
  assert.equal(f.wrap.inert, true);
  assert.equal(f.wrap.attrs.has("data-visible"), true);
  f.animations.slice(old.length + 1).forEach(animation => animation.finish());
  await setImmediate();
  assert.equal(f.wrap.inert, false);
});
