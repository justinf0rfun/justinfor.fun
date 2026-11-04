import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";

const source = stripTypeScriptTypes(readFileSync(new URL("../src/lib/mobile-gravity.ts", import.meta.url), "utf8")).replace(/^export /gm, "");

function events() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
    fire: (name, value) => listeners.get(name)?.(value),
  };
}

function fixture({ secure = true, coarse = true, orientation = {}, motion = {}, reduced = false, angle = 0, legacyAngle } = {}) {
  let time = 0;
  let paused = false;
  let observer;
  let timerId = 0;
  const timers = new Map();
  const media = { ...events(), matches: reduced };
  const document = { hidden: false };
  const window = {
    ...events(), isSecureContext: secure, DeviceOrientationEvent: orientation, DeviceMotionEvent: motion,
    screen: { orientation: { angle } }, orientation: legacyAngle,
    matchMedia: (query) => query.includes("reduced-motion") ? media : { matches: coarse },
    setTimeout: (fn, delay) => { timers.set(++timerId, { fn, at: time + delay }); return timerId; },
    clearTimeout: (id) => timers.delete(id),
  };
  const gravity = [], shakes = [], statuses = [];
  const create = runInNewContext(`${source}\ncreateMobileGravity`, {
    window, document, performance: { now: () => time },
    IntersectionObserver: class {
      constructor(callback) { this.callback = callback; this.disconnected = false; observer = this; }
      observe() { this.callback([{ isIntersecting: true }]); }
      disconnect() { this.disconnected = true; }
    },
  });
  const controller = create({}, {
    onGravity: (value) => gravity.push({ ...value }), onShake: (value) => shakes.push(value),
    onStatus: (value) => statuses.push(value), isPaused: () => paused,
  });
  const advance = (ms) => {
    time += ms;
    for (const [id, timer] of timers) if (timer.at <= time) { timers.delete(id); timer.fn(); }
  };
  return {
    controller, window, document, media, gravity, shakes, statuses, timers, observer, advance,
    pause(value) { paused = value; },
    visible(value) { observer.callback([{ isIntersecting: value }]); },
    sample(beta, gamma, ms = 40) { advance(ms); window.fire("deviceorientation", { beta, gamma }); },
    shake(x, y = 0, z = 0) { window.fire("devicemotion", { acceleration: { x, y, z } }); },
  };
}

test("only offer motion on supported secure mobile browsers", async () => {
  for (const options of [{ secure: false }, { coarse: false }, { orientation: null }, { reduced: true }]) {
    const f = fixture(options);
    assert.equal(f.statuses.at(-1), "unavailable");
    await f.controller.enable();
    assert.equal(f.window.listeners.size, 0);
    assert.deepEqual(f.gravity.at(-1), { x: 0, y: 1 });
    f.controller.destroy();
  }
});

test("request both permissions synchronously, preserving their receivers", async () => {
  const calls = [];
  let grantOrientation, grantMotion;
  const orientation = { requestPermission() { assert.equal(this, orientation); calls.push("orientation"); return new Promise((resolve) => { grantOrientation = resolve; }); } };
  const motion = { requestPermission() { assert.equal(this, motion); calls.push("motion"); return new Promise((resolve) => { grantMotion = resolve; }); } };
  const f = fixture({ orientation, motion });
  const pending = f.controller.enable();
  assert.deepEqual(calls, ["orientation", "motion"]);
  assert.equal(f.statuses.at(-1), "requesting");
  grantOrientation("granted"); grantMotion("granted"); await pending;
  f.sample(45, 0);
  assert.equal(f.statuses.at(-1), "active");
  assert.equal(f.window.listeners.size, 2);
  f.controller.destroy();
});

test("denial and request failures leave normal gravity and no sensor listeners", async () => {
  for (const requestPermission of [async () => "denied", () => { throw new Error("blocked"); }]) {
    const f = fixture({ orientation: { requestPermission } });
    await f.controller.enable();
    assert.equal(f.statuses.at(-1), "denied");
    assert.equal(f.window.listeners.size, 0);
    assert.deepEqual(f.gravity.at(-1), { x: 0, y: 1 });
    f.controller.destroy();
  }
});

test("disposal cancels pending permission updates and releases observers", async () => {
  let resolve;
  const f = fixture({ orientation: { requestPermission: () => new Promise((done) => { resolve = done; }) } });
  const pending = f.controller.enable();
  const before = f.statuses.length;
  f.controller.destroy(); resolve("granted"); await pending;
  assert.equal(f.statuses.length, before);
  assert.equal(f.window.listeners.size, 0);
  assert.equal(f.media.listeners.size, 0);
  assert.equal(f.timers.size, 0);
  assert.ok(f.observer.disconnected);
});

test("a reduced-motion change cancels an in-flight permission request", async () => {
  let resolve;
  const f = fixture({ orientation: { requestPermission: () => new Promise((done) => { resolve = done; }) } });
  const pending = f.controller.enable();
  f.media.matches = true; f.media.fire("change");
  f.media.matches = false; f.media.fire("change");
  resolve("granted"); await pending;
  assert.equal(f.statuses.at(-1), "ready");
  assert.equal(f.window.listeners.size, 0);
  f.controller.destroy();
});

test("project tilt correctly through portrait, landscape, and legacy orientation", async () => {
  for (const [beta, gamma, angle, expected] of [
    [0, 0, 0, [0, 0]], [45, 0, 0, [0, Math.SQRT1_2]],
    [0, 30, 0, [0.5, 0]], [0, -30, 0, [-0.5, 0]], [-30, 0, 0, [0, -0.5]],
    [120, 30, 0, [-0.25, Math.sqrt(3) / 2]], [0, -90, 90, [0, 1]], [0, 90, 270, [0, 1]],
    [0, 90, undefined, [0, 1]],
  ]) {
    const f = fixture({ angle, legacyAngle: -90 });
    if (angle === undefined) f.window.screen.orientation = undefined;
    await f.controller.enable();
    for (let i = 0; i < 40; i++) f.sample(beta, gamma);
    const actual = f.gravity.at(-1);
    assert.ok(Math.abs(actual.x - expected[0]) < 0.012 && Math.abs(actual.y - expected[1]) < 0.012, `${beta},${gamma},${angle}: ${JSON.stringify(actual)}`);
    f.controller.destroy();
  }
});

test("ignore invalid sensor fields and time out devices without real data", async () => {
  const f = fixture();
  await f.controller.enable();
  f.sample(null, 0); f.sample(0, null); f.sample(NaN, 20); f.sample(20, Infinity);
  assert.equal(f.gravity.length, 1);
  assert.equal(f.statuses.at(-1), "requesting");
  f.advance(3000);
  assert.equal(f.statuses.at(-1), "unavailable");
  assert.equal(f.window.listeners.size, 0);
  assert.deepEqual(f.gravity.at(-1), { x: 0, y: 1 });
  f.controller.destroy();
});

test("throttle tilt updates, reject stationary gravity, and cap shake impulses", async () => {
  const f = fixture();
  await f.controller.enable();
  for (let i = 0; i < 100; i++) f.sample(45, Math.sin(i) * 30, 10);
  assert.ok(f.gravity.length <= 32);
  f.window.fire("devicemotion", { acceleration: null, accelerationIncludingGravity: { x: 0, y: 0, z: 9.81 } });
  f.shake(0, 0, 0); f.shake(10); f.shake(null); f.shake(Infinity);
  assert.equal(f.shakes.length, 0);
  f.shake(13); f.shake(100);
  assert.equal(f.shakes.length, 1);
  f.advance(350); f.shake(100);
  assert.equal(f.shakes.length, 2);
  assert.ok(f.shakes.every((strength) => strength > 0 && strength <= 1.2));
  f.controller.destroy();
  const before = [f.gravity.length, f.shakes.length];
  f.sample(0, 90, 400); f.shake(100);
  assert.deepEqual([f.gravity.length, f.shakes.length], before);
  assert.equal(f.window.listeners.size, 0);
});

test("hidden, offscreen, paused, and reduced-motion states suppress sensor actions", async () => {
  const f = fixture();
  await f.controller.enable(); f.sample(45, 20);
  for (const [disable, restore] of [
    [() => { f.document.hidden = true; }, () => { f.document.hidden = false; }],
    [() => f.visible(false), () => f.visible(true)],
    [() => f.pause(true), () => f.pause(false)],
  ]) {
    disable(); const before = [f.gravity.length, f.shakes.length];
    f.sample(0, 90, 400); f.shake(100);
    assert.deepEqual([f.gravity.length, f.shakes.length], before);
    restore();
  }
  f.media.matches = true; f.media.fire("change");
  assert.equal(f.statuses.at(-1), "unavailable");
  assert.equal(f.window.listeners.size, 0);
  assert.deepEqual(f.gravity.at(-1), { x: 0, y: 1 });
  f.media.matches = false; f.media.fire("change");
  assert.equal(f.statuses.at(-1), "ready");
  assert.equal(f.window.listeners.size, 0);
  f.controller.destroy();
});
