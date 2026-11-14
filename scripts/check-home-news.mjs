import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";

const source = stripTypeScriptTypes(readFileSync(new URL("../src/scripts/home-news.ts", import.meta.url), "utf8"))
  .replace(/^import .*;$/gm, "").replace(/^export /gm, "");

function fixture(start = 0, reduced = false) {
  const listeners = new Map(), attrs = new Map(), timers = new Map(), animations = [];
  let frame = null, focused = false, now = 0, timerId = 0;
  const window = {
    scrollY: start,
    addEventListener(type, callback) { listeners.set(type, callback); },
    removeEventListener(type) { listeners.delete(type); },
  };
  const news = {
    contains: () => focused, inert: true, style: { width: "32px", opacity: "0" },
    removeAttribute: name => attrs.delete(name),
    setAttribute: (name, value) => attrs.set(name, value),
    toggleAttribute: (name, value) => { if (value) attrs.set(name, ""); else attrs.delete(name); },
    addEventListener(type, callback) { listeners.set(type, callback); },
    removeEventListener(type) { listeners.delete(type); },
  };
  const mount = runInNewContext(`${source}\nmountHomeNews`, {
    window, document: { activeElement: {} },
    matchMedia: () => ({ matches: reduced, addEventListener() {}, removeEventListener() {} }),
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, at: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    animate(target, values, options) {
      const animation = { values, options, stopped: false, stop() { this.stopped = true; } };
      animations.push(animation);
      return animation;
    },
    requestAnimationFrame(callback) { frame = callback; return 1; },
    cancelAnimationFrame() { frame = null; },
  });
  const destroy = mount(news);
  const flush = () => { const callback = frame; frame = null; callback?.(); };
  return {
    news, attrs, destroy, listeners, flush, animations,
    advance(ms) {
      const end = now + ms;
      while (true) {
        const next = [...timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        now = next[1].at; timers.delete(next[0]); next[1].callback();
      }
      now = end;
    },
    scroll(y) { window.scrollY = y; listeners.get("scroll")?.(); },
    focus(value) { focused = value; listeners.get("focusout")?.(); },
  };
}

test("top-of-page visibility follows the latest scroll position and preserves keyboard focus", () => {
  const f = fixture();
  f.advance(100);
  assert.equal(f.news.inert, false);
  f.scroll(9); f.flush();
  assert.equal(f.news.inert, true);
  assert.equal(f.attrs.get("aria-hidden"), "true");
  assert.equal(f.attrs.has("data-open"), false);
  f.scroll(80); f.scroll(0); f.flush();
  f.advance(100);
  assert.equal(f.news.inert, false, "a stale scroll frame must not hide the returning pill");
  f.focus(true); f.scroll(80); f.flush();
  assert.equal(f.news.inert, false, "do not hide a focused link");
  f.focus(false); f.flush();
  assert.equal(f.news.inert, true);
  f.destroy();
  assert.equal(f.listeners.size, 0);
});

test("the capsule changes real width and delays its text reveal until halfway through expansion", () => {
  const f = fixture();
  const width = f.animations.find(animation => animation.values.width === "auto");
  assert.ok(width, "use the reference's real width tween, not a clip-path wipe");
  assert.equal(width.options.duration, 0.2);
  assert.equal(f.news.inert, true);
  f.advance(99);
  assert.equal(f.attrs.has("data-open"), false);
  f.advance(1);
  assert.equal(f.news.inert, false);
});

test("reversing a pending close cancels shrink and stale fade animations", () => {
  const f = fixture(); f.advance(100);
  f.scroll(80); f.flush(); f.advance(59);
  assert.equal(f.animations.filter(animation => animation.values.width === 32).length, 0);
  f.scroll(0); f.flush(); f.advance(200);
  assert.equal(f.animations.filter(animation => animation.values.width === 32).length, 0);
  assert.equal(f.news.inert, false);
  f.scroll(80); f.flush(); f.advance(60);
  assert.equal(f.animations.at(-2).values.width, 32);
  assert.equal(f.animations.at(-2).options.duration, 0.18);
  const closing = f.animations.slice(-2);
  f.scroll(0); f.flush(); f.advance(100);
  assert.ok(closing.every(animation => animation.stopped));
  assert.equal(f.news.inert, false);
});

test("reduced motion shows and hides immediately without a width tween", () => {
  const f = fixture(0, true);
  assert.equal(f.news.inert, false);
  assert.equal(f.news.style.width, "auto");
  assert.ok(f.animations.every(animation => animation.options.duration === 0));
});

test("a restored scrolled page starts hidden instead of replaying the entrance", () => {
  const f = fixture(400);
  assert.equal(f.news.inert, true);
  assert.equal(f.attrs.has("data-open"), false);
  assert.equal(f.animations.some(animation => animation.values.width === "auto"), false);
});

test("the homepage announces the newest published thought and uses its real article route", () => {
  const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
  const home = read("../dist/index.html");
  const latest = read("../dist/thoughts/index.html").match(/<a\b[^>]*href="([^"]+)"[^>]*data-writing-select=/)?.[1];
  assert.ok(latest);
  const news = home.match(/<aside\b[^>]*data-home-news[^>]*>[\s\S]*?<\/aside>/)?.[0];
  assert.ok(news);
  assert.ok(news.includes(`href="${latest}"`));
  assert.match(news, /aria-label="New thought: [^"]+"/);
  assert.equal((home.match(/<aside\b[^>]*data-home-news\b/g) ?? []).length, 1);
  assert.doesNotMatch(news, /noechague|Make your design system AI-ready/);
  assert.doesNotMatch(read("../dist/thoughts/index.html"), /<aside\b[^>]*data-home-news\b/);
});
