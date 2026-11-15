import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";
import { setImmediate } from "node:timers/promises";
import test from "node:test";

const source = stripTypeScriptTypes(readFileSync(new URL("../src/scripts/theme-dial.ts", import.meta.url), "utf8"))
  .replace(/^import .*;$/gm, "").replace(/^export /gm, "");

function fixture({ mode = "system", dark = false, reduced = false, transitions = false, storageFails = false } = {}) {
  const handlers = {}, attrs = new Map(), label = {}, status = {}, writes = [], waves = [], snapshots = [], timers = [];
  let sounds = 0, onSystem;
  const root = { dataset: { homeMode: mode, homeTheme: mode === "system" ? (dark ? "dark" : "light") : mode },
    setAttribute(name, value) { attrs.set(name, value); }, removeAttribute(name) { attrs.delete(name); },
    animate(frames, settings) { waves.push({ frames, settings }); } };
  const button = { attrs: new Map(), querySelector: () => label,
    setAttribute(name, value) { this.attrs.set(name, value); }, removeAttribute(name) { this.attrs.delete(name); },
    toggleAttribute(name, present) { if (present) this.attrs.set(name, ""); else this.attrs.delete(name); },
    addEventListener(name, callback) { handlers[name] = callback; },
    getBoundingClientRect: () => ({ left: 300, top: 700, width: 44, height: 44 }) };
  const system = { matches: dark, addEventListener(name, callback) { onSystem = callback; } };
  const document = { documentElement: root, querySelector: selector => selector === "[data-theme-dial]" ? button : status };
  if (transitions) document.startViewTransition = update => {
    let ready, finish;
    const snapshot = { ready: new Promise(resolve => { ready = resolve; }), finished: new Promise(resolve => { finish = resolve; }),
      skipTransition() { this.skipped = true; ready(); finish(); }, update() { update(); ready(); }, finish() { finish(); } };
    snapshots.push(snapshot);return snapshot;
  };
  const timeout = callback => { timers.push(callback);return timers.length; };
  runInNewContext(`${source}\nmountThemeDial()`, { document, innerWidth: 390, innerHeight: 844,
    matchMedia: query => query.includes("color-scheme") ? system : { matches: reduced },
    localStorage: { setItem(key, value) { if (storageFails) throw Error("blocked");writes.push([key, value]); } },
    createReturnSound: () => () => { sounds++; }, clearTimeout() {}, window: { setTimeout: timeout } });
  return { root, button, label, status, writes, waves, snapshots, attrs, timers,
    click: (detail = 1, isTrusted = true) => handlers.click({ detail, isTrusted }),
    systemChange(value) { system.matches = value;onSystem(); }, sounds: () => sounds };
}

test("one control cycles light, dark and system, persists preference and announces the mode", () => {
  const f = fixture();
  assert.equal(f.label.textContent, "System");
  for (const [mode, effective, next] of [["light", "light", "Dark"], ["dark", "dark", "System"], ["system", "light", "Light"]]) {
    f.click();assert.equal(f.root.dataset.homeMode, mode);assert.equal(f.root.dataset.homeTheme, effective);
    assert.equal(f.writes.at(-1)[1], mode);assert.match(f.button.attrs.get("aria-label"), new RegExp(`Switch to ${next}`));
  }
  assert.equal(f.sounds(), 3);assert.equal(f.status.textContent, "System theme");
  f.timers.at(-1)();assert.equal(f.button.attrs.has("data-hint"), false);
});

test("system changes follow the OS only in system mode; blocked storage still switches", () => {
  const f = fixture({ storageFails: true });
  f.systemChange(true);assert.equal(f.root.dataset.homeTheme, "dark");
  f.click();assert.equal(f.root.dataset.homeTheme, "light");
  f.systemChange(false);f.systemChange(true);assert.equal(f.root.dataset.homeTheme, "light");
});

test("keyboard, reduced motion and unchanged effective colors avoid page snapshots", () => {
  for (const options of [{}, { reduced: true }, { mode: "dark", dark: true }]) {
    const f = fixture({ ...options, transitions: true });
    f.click(Object.keys(options).length ? 1 : 0);
    assert.equal(f.snapshots.length, 0);
  }
  const f = fixture({ transitions: true });f.click(0, false);
  assert.equal(f.button.attrs.has("data-instant"), true);assert.equal(f.sounds(), 0);
});

test("the page reveal originates at the control and rapid clicks cannot restore stale state", async () => {
  const f = fixture({ transitions: true });
  f.click();assert.equal(f.snapshots.length, 0, "system light → explicit light needs only the icon morph");
  f.click();const old = f.snapshots[0];old.update();await setImmediate();
  assert.match(f.waves[0].frames.clipPath[0], /at 322px 722px/);
  assert.equal(f.waves[0].settings.pseudoElement, "::view-transition-new(root)");
  f.click();assert.equal(old.skipped, true);
  const latest = f.snapshots.at(-1);latest.update();await setImmediate();old.finish();await setImmediate();
  assert.equal(f.attrs.has("data-theme-transition"), true);
  assert.equal(f.root.dataset.homeMode, "system");assert.equal(f.root.dataset.homeTheme, "light");
  latest.finish();await setImmediate();assert.equal(f.attrs.has("data-theme-transition"), false);
});
