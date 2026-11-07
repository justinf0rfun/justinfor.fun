import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { chatReducer, initialChatState } from "../src/lib/home-chat.ts";

const source = stripTypeScriptTypes(readFileSync(new URL("../src/scripts/say-hi-guide.ts", import.meta.url), "utf8"))
  .replace(/^import .*;$/gm, "").replace(/^export /gm, "");
const events = () => {
  const listeners = new Map();
  return {
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: name => listeners.delete(name),
    fire: (name, event = {}) => listeners.get(name)?.(event),
    get listenerCount() { return listeners.size; },
  };
};
class Element {
  constructor(guide = false) { this.guide = guide; this.attrs = new Map(); this.style = {}; this.disabled = false; this.offsetWidth = this.offsetHeight = 56; }
  setAttribute(name, value) { this.attrs.set(name, value); }
  getAttribute(name) { return this.attrs.get(name) ?? null; }
  removeAttribute(name) { this.attrs.delete(name); }
  hasAttribute(name) { return this.attrs.has(name); }
  closest() { return this.guide ? this : this.parent?.closest() ?? null; }
  getBoundingClientRect() { return { left: 100, top: 700, width: 80, height: 44 }; }
}

function fixture({ ready = true, triggerDisabled = false, reduced = false, open = false, bottom = false } = {}) {
  const sourceButton = new Element(true), child = new Element(), trigger = new Element();
  child.parent = sourceButton;
  if (ready) sourceButton.setAttribute("data-guide-ready", "true");
  trigger.disabled = triggerDisabled;
  trigger.setAttribute("aria-expanded", String(open));
  const hand = new Element(), ring = new Element(), status = { textContent: "" };
  const document = { ...events(), hidden: false, documentElement: { scrollHeight: 3000 },
    querySelector: selector => ({ "[data-chat-guide-hand]": hand, "[data-chat-guide-ring]": ring, "[data-chat-guide-status]": status })[selector],
    querySelectorAll: () => [sourceButton],
  };
  const guideStates = [];
  const window = { ...events(), innerWidth: 390, innerHeight: 800, scrollY: bottom ? 2200 : 0,
    dispatchEvent: event => guideStates.push(event.detail),
  };
  const media = { ...events(), matches: reduced };
  const observers = [], scrolls = [], taps = [];
  const set = (target, vars) => {
    if (vars.clearProps) {
      for (const key of Object.keys(target.style)) {
        if (vars.clearProps === "all" || ["transform", "x", "y", "scale", "rotation", "transformOrigin"].includes(key)) delete target.style[key];
      }
    } else for (const [key, value] of Object.entries(vars)) {
      if (!["duration", "ease"].includes(key)) target.style[key] = value;
    }
  };
  const animation = (vars, steps = []) => ({
    vars, steps, killed: false,
    kill() { this.killed = true; },
    complete() {
      if (this.killed) return;
      for (const [target, values] of steps) set(target, values);
      if (vars.scrollTo) window.scrollY = vars.scrollTo.y;
      vars.onComplete?.();
    },
    to(target, values) { steps.push([target, values]); return this; },
    set(target, values) { steps.push([target, values]); return this; },
    addLabel() { return this; },
  });
  let opens = 0, chat = { ...initialChatState, open };
  const mount = runInNewContext(`${source}\nmountSayHiGuide`, {
    document, window, Element, ScrollToPlugin: {},
    matchMedia: () => media,
    getComputedStyle: () => ({ visibility: "visible" }),
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    MutationObserver: class {
      constructor(notify) { this.notify = notify; observers.push(this); }
      observe(target) { assert.equal(target, trigger); }
      disconnect() { this.disconnected = true; }
    },
    gsap: {
      registerPlugin() {}, set,
      to(target, vars) { assert.equal(target, window); const tween = animation(vars); scrolls.push(tween); return tween; },
      timeline(vars) { const timeline = animation(vars); taps.push(timeline); return timeline; },
    },
  });
  const destroy = mount(trigger, () => {
    opens++;
    chat = chatReducer(chat, { type: "open" });
    trigger.setAttribute("aria-expanded", String(chat.open));
  });
  return { sourceButton, child, trigger, hand, ring, status, document, window, media, observers, scrolls, taps, guideStates, destroy,
    get opens() { return opens; }, get chat() { return chat; },
    click(detail = 1) { document.fire("click", { target: child, detail }); },
    dockClick() {
      document.fire("pointerdown", { target: trigger });
      chat = chatReducer(chat, { type: "toggle" });
      trigger.setAttribute("aria-expanded", String(chat.open));
      document.fire("click", { target: trigger, detail: 1 });
    },
  };
}

test("guide waits for both intro hydration and the chat trigger", () => {
  const f = fixture({ ready: false, triggerDisabled: true });
  assert.equal(f.sourceButton.disabled, true);
  f.click(); assert.equal(f.scrolls.length, 0);
  f.sourceButton.setAttribute("data-guide-ready", "true");
  f.document.fire("home-intro-ready");
  assert.equal(f.sourceButton.disabled, true);
  f.trigger.disabled = false; f.observers[0].notify();
  assert.equal(f.sourceButton.disabled, false);
});

test("scroll completes before the hand; a duplicate activation cannot open twice", () => {
  const f = fixture(); f.click(); f.click();
  assert.equal(f.scrolls.length, 1);
  assert.equal(f.scrolls[0].vars.scrollTo.y, 2200);
  assert.equal(f.taps.length, 0);
  assert.equal(f.opens, 0);
  assert.equal(f.sourceButton.getAttribute("aria-busy"), "true");
  f.scrolls[0].complete();
  assert.equal(f.taps.length, 1); assert.equal(f.opens, 0);
  f.taps[0].complete(); f.taps[0].vars.onComplete();
  assert.equal(f.opens, 1); assert.equal(f.chat.open, true);
  assert.equal(f.sourceButton.disabled, false);
  assert.equal(f.sourceButton.hasAttribute("aria-busy"), false);
  assert.deepEqual(f.hand.style, {}); assert.deepEqual(f.ring.style, {});
  assert.deepEqual(f.trigger.style, {}); assert.equal(f.status.textContent, "");
  assert.deepEqual(f.guideStates, [true, false]);
});

test("wheel, Escape, another pointer and ScrollTo auto-kill cancel without delayed opening", () => {
  for (const stop of [f => f.document.fire("wheel"), f => f.document.fire("keydown", { key: "Escape" }),
    f => f.document.fire("pointerdown", { target: new Element() }), f => f.scrolls[0].vars.scrollTo.onAutoKill()]) {
    const f = fixture(); f.click(); const scroll = f.scrolls[0]; stop(f);
    scroll.vars.onComplete();
    assert.equal(scroll.killed, true); assert.equal(f.opens, 0); assert.equal(f.taps.length, 0);
    assert.equal(f.sourceButton.disabled, false); assert.equal(f.sourceButton.hasAttribute("aria-busy"), false);
    assert.equal(f.status.textContent, "");
  }
});

test("manual dock activation during the hand sequence wins over the guide", () => {
  const f = fixture({ bottom: true }); f.click();
  assert.equal(f.scrolls.length, 0); const tap = f.taps[0];
  f.dockClick(); tap.vars.onComplete();
  assert.equal(tap.killed, true); assert.equal(f.chat.open, true); assert.equal(f.opens, 0);
  assert.deepEqual(f.hand.style, {});
});

test("keyboard, reduced motion and an already-open chat skip the animation", () => {
  for (const options of [{ detail: 0 }, { reduced: true }, { open: true }]) {
    const f = fixture(options); f.click(options.detail ?? 1);
    assert.equal(f.opens, 1); assert.equal(f.chat.open, true);
    assert.equal(f.scrolls.length, 0); assert.equal(f.taps.length, 0);
    assert.equal(f.window.scrollY, 0);
  }
});

test("height-only browser chrome changes do not interrupt; width changes and hidden pages do", () => {
  const f = fixture(); f.click();
  f.window.innerHeight = 850; f.window.fire("resize");
  assert.equal(f.scrolls[0].killed, false);
  f.window.innerWidth = 844; f.window.fire("resize");
  assert.equal(f.scrolls[0].killed, true);
  f.click(); const scroll = f.scrolls.at(-1);
  f.document.hidden = true; f.document.fire("visibilitychange"); scroll.vars.onComplete();
  assert.equal(f.opens, 0);
});

test("changing to reduced motion finishes the requested opening without a hand", () => {
  const f = fixture(); f.click();
  f.media.matches = true; f.media.fire("change"); f.scrolls[0].vars.onComplete();
  assert.equal(f.opens, 1); assert.equal(f.taps.length, 0);
});

test("unmount removes handlers, stops animation and disables the source", () => {
  const f = fixture(); f.click(); f.scrolls[0].complete(); const tap = f.taps[0];
  f.destroy(); tap.vars.onComplete(); f.click(); f.document.fire("home-intro-ready");
  assert.equal(f.opens, 0); assert.equal(f.sourceButton.disabled, true);
  assert.equal(f.document.listenerCount, 0); assert.equal(f.window.listenerCount, 0); assert.equal(f.media.listenerCount, 0);
  assert.equal(f.observers[0].disconnected, true); assert.equal(tap.killed, true);
  assert.deepEqual(f.hand.style, {}); assert.deepEqual(f.guideStates, [true, false]);
});
