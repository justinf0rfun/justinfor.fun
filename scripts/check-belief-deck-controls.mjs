import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { drawSticker, paperTransform, stickerPose, stickerSwipe } from "../src/lib/belief-deck.ts";

const source = stripTypeScriptTypes(readFileSync(new URL("../src/scripts/belief-deck.ts", import.meta.url), "utf8"))
  .replace(/^import .*;$/gm, "").replace(/^export /gm, "");
class Element {
  dataset = {};style = {};listeners = new Map();tabIndex = -1;offsetWidth = 200;offsetHeight = 226;
  addEventListener(name, listener) { this.listeners.set(name, listener); }
  removeEventListener(name) { this.listeners.delete(name); }
  focus() { this.focused = true; }
  closest(selector) { return selector === "[data-sticker-card]" ? this : null; }
  querySelector(selector) { return selector === "[data-sticker-art]" ? { getBoundingClientRect: () => ({ right: 300, bottom: 300 }) } : selector === "[data-peeling]" ? {} : null; }
  animate(frames, settings) { return { frames, settings, finished: new Promise(() => {}), cancel() {} }; }
}
function fixture() {
  const root = new Element(), stage = { clientWidth: 358 }, status = {}, media = new Element(), hover = new Element(), window = new Element();
  media.matches = false;hover.matches = true;
  const cards = Array.from({ length: 5 }, (_, index) => Object.assign(new Element(), { dataset: { stickerCard: String(index), stickerLabel: `Paper ${index}` } }));
  const captures = new Set(), selected = [];
  root.querySelector = selector => selector === "[data-sticker-stage]" ? stage : selector === "[data-sticker-status]" ? status : null;
  root.querySelectorAll = () => cards;
  root.setPointerCapture = id => captures.add(id);root.hasPointerCapture = id => captures.has(id);root.releasePointerCapture = id => captures.delete(id);
  const mount = runInNewContext(`${source}\nmountBeliefDeck`, { matchMedia: query => query.includes("reduced") ? media : hover,
    getComputedStyle: element => ({ transform: element.style.transform || "none" }), Element, window,
    ResizeObserver: class { observe() {} disconnect() {} }, drawSticker, paperTransform, stickerPose, stickerSwipe });
  const cleanup = mount(root, index => selected.push(index));
  const fire = (name, x, y, time, extra = {}) => {
    const event = { target: cards[selected.at(-1) ?? 0], pointerId: 1, isPrimary: true, pointerType: "touch", button: 0,
      clientX: x, clientY: y, timeStamp: time, type: name, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; }, ...extra };
    root.listeners.get(name)?.(event);return event;
  };
  return { root, cards, captures, selected, status, media, fire, cleanup };
}

test("centre swipe draws immediately and repeated swipes do not wait for animations", () => {
  const f = fixture();
  for (let i = 0; i < 8; i++) {
    const down = f.fire("pointerdown", 150, 150, i * 100);
    assert.equal(down.stopped, true);assert.equal(down.prevented, undefined);
    f.fire("pointermove", 85, 150, i * 100 + 40);
    assert.equal(f.captures.has(1), true);
    f.fire("pointerup", 85, 150, i * 100 + 50);
    assert.equal(f.captures.size, 0);assert.equal(f.selected.at(-1), (i + 1) % 5);
    assert.equal(f.cards[i % 5].style.pointerEvents, "none", "departing paper must not steal the next swipe");
    assert.equal(f.cards[(i + 1) % 5].style.pointerEvents, "auto");
  }
});

test("vertical scrolling and cancelled horizontal drags never change the selected paper", () => {
  const f = fixture();
  f.fire("pointerdown", 150, 150, 0);
  assert.equal(f.fire("pointermove", 154, 185, 40).prevented, undefined);
  f.fire("pointerup", 154, 210, 90);assert.equal(f.selected.length, 0);
  f.fire("pointerdown", 150, 150, 100);f.fire("pointermove", 80, 150, 130);
  f.fire("pointercancel", 80, 150, 160);assert.equal(f.selected.length, 0);assert.equal(f.captures.size, 0);
});

test("transferring a touch's implicit capture from the image to the deck does not cancel drawing", () => {
  const f = fixture();f.fire("pointerdown", 150, 150, 0);f.fire("pointermove", 125, 150, 30);
  f.fire("lostpointercapture", 125, 150, 31, { target: f.cards[0] });
  assert.equal(f.captures.has(1), true);
  f.fire("pointermove", 80, 150, 60);f.fire("pointerup", 80, 150, 90);
  assert.equal(f.selected.at(-1), 1);
});

test("the lower right corner is handed to the existing peeler without interception", () => {
  const f = fixture();const event = f.fire("pointerdown", 280, 280, 0);
  assert.equal(event.stopped, undefined);assert.equal(event.prevented, undefined);
  f.fire("pointermove", 220, 250, 40);f.fire("pointerup", 220, 250, 80);
  assert.equal(f.selected.length, 0);
});

test("touching a back paper does not select it before a click or block page scrolling", () => {
  const f = fixture();const event = f.fire("pointerdown", 150, 150, 0, { target: f.cards[3] });
  assert.equal(event.prevented, undefined);assert.equal(event.stopped, undefined);
  f.fire("pointermove", 150, 200, 40);f.fire("pointercancel", 150, 200, 60);
  assert.equal(f.selected.length, 0);
});

test("keyboard navigation restores focus and cleanup releases every listener", () => {
  const f = fixture();f.fire("keydown", 0, 0, 0, { key: "ArrowLeft" });
  assert.equal(f.selected.at(-1), 4);assert.equal(f.cards[4].focused, true);
  assert.match(f.status.textContent, /Paper 4/);
  f.cleanup();assert.equal(f.root.listeners.size, 0);
});
