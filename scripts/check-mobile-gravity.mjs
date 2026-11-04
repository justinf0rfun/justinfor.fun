import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";

const source = stripTypeScriptTypes(readFileSync(new URL("../src/lib/mobile-gravity.ts", import.meta.url), "utf8")).replace(/^export /gm, "");
const flush = () => new Promise((resolve) => setImmediate(resolve));

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
  const gravity = [], shakes = [], states = [];
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
    onState: (value) => states.push(value),
    isPaused: () => paused,
  });
  const advance = (ms) => {
    time += ms;
    for (const [id, timer] of timers) if (timer.at <= time) { timers.delete(id); timer.fn(); }
  };
  return {
    controller, window, document, media, gravity, shakes, states, timers, observer, advance,
    pause(value) { paused = value; },
    visible(value) { observer.callback([{ isIntersecting: value }]); },
    sample(beta, gamma, ms = 40) { advance(ms); window.fire("deviceorientation", { beta, gamma }); },
    shake(x, y = 0, z = 0) { window.fire("devicemotion", { acceleration: { x, y, z } }); },
  };
}

test("only start motion on supported secure mobile browsers", async () => {
  for (const options of [{ secure: false }, { coarse: false }, { orientation: null }, { reduced: true }]) {
    const f = fixture(options);
    await flush();
    assert.equal(f.states.at(-1), "unavailable");
    assert.equal(f.window.listeners.size, 0);
    assert.deepEqual(f.gravity.at(-1), { x: 0, y: 1 });
    f.controller.destroy();
  }
});

test("automatically resume previously granted permissions without click handlers", async () => {
  const calls = [];
  let grantOrientation, grantMotion;
  const orientation = { requestPermission() { assert.equal(this, orientation); calls.push("orientation"); return new Promise((resolve) => { grantOrientation = resolve; }); } };
  const motion = { requestPermission() { assert.equal(this, motion); calls.push("motion"); return new Promise((resolve) => { grantMotion = resolve; }); } };
  const f = fixture({ orientation, motion });
  assert.deepEqual(calls, ["orientation", "motion"]);
  assert.deepEqual(f.states, ["checking"]);
  grantOrientation("granted"); grantMotion("granted"); await flush();
  f.sample(45, 0);
  assert.equal(f.states.at(-1), "active");
  assert.ok(!f.states.includes("prompt"));
  assert.deepEqual([...f.window.listeners.keys()], ["deviceorientation", "devicemotion"]);
  assert.ok(f.gravity.length > 1);
  f.controller.destroy();
});

test("denial and request failures leave normal gravity and no sensor listeners", async () => {
  for (const requestPermission of [async () => "denied", () => { throw new DOMException("Requires a user gesture", "NotAllowedError"); }]) {
    const f = fixture({ orientation: { requestPermission } });
    await flush();
    assert.equal(f.states.at(-1), "prompt");
    assert.equal(f.window.listeners.size, 0);
    assert.deepEqual(f.gravity.at(-1), { x: 0, y: 1 });
    f.controller.destroy();
  }
});

test("disposal cancels pending permission updates and releases observers", async () => {
  let resolve;
  const f = fixture({ orientation: { requestPermission: () => new Promise((done) => { resolve = done; }) } });
  const before = f.gravity.length;
  const stateCount = f.states.length;
  f.controller.destroy(); resolve("granted"); await flush();
  assert.equal(f.gravity.length, before);
  assert.equal(f.states.length, stateCount);
  assert.equal(f.window.listeners.size, 0);
  assert.equal(f.media.listeners.size, 0);
  assert.equal(f.timers.size, 0);
  assert.ok(f.observer.disconnected);
});

test("reduced motion cancels pending access and automatically resumes when disabled", async () => {
  const grants = [];
  const f = fixture({ orientation: { requestPermission: () => new Promise((done) => { grants.push(done); }) } });
  f.media.matches = true; f.media.fire("change");
  assert.equal(f.states.at(-1), "unavailable");
  f.media.matches = false; f.media.fire("change");
  grants[0]("granted"); await flush();
  assert.equal(f.window.listeners.size, 0);
  grants[1]("granted"); await flush();
  assert.equal(f.window.listeners.size, 2);
  f.controller.destroy();
});

test("the phone button requests both permissions synchronously and waits for real data", async () => {
  let canPrompt = false;
  const calls = [];
  const permission = (name) => ({ requestPermission() {
    calls.push(name);
    if (!canPrompt) throw new DOMException("Requires activation", "NotAllowedError");
    return Promise.resolve("granted");
  } });
  const f = fixture({ orientation: permission("orientation"), motion: permission("motion") });
  await flush();
  assert.equal(f.states.at(-1), "prompt");
  canPrompt = true; calls.length = 0;
  const pending = f.controller.requestAccess();
  assert.deepEqual(calls, ["orientation", "motion"]);
  assert.equal(f.states.at(-1), "requesting");
  await pending;
  assert.equal(f.states.at(-1), "requesting");
  assert.equal(f.window.listeners.size, 2);
  f.sample(null, 0);
  assert.equal(f.states.at(-1), "requesting");
  f.sample(45, 20);
  assert.equal(f.states.at(-1), "active");
  assert.equal(f.timers.size, 0);
  f.controller.destroy();
});

test("denied button requests stay retryable without automatically requesting again", async () => {
  let permission = "denied";
  let requests = 0;
  const f = fixture({ orientation: { requestPermission() { requests++; return Promise.resolve(permission); } } });
  await flush();
  await f.controller.requestAccess();
  assert.deepEqual(f.states, ["checking", "prompt", "requesting", "prompt"]);
  f.advance(10000);
  assert.equal(requests, 2);
  permission = "granted";
  await f.controller.requestAccess();
  assert.equal(f.states.at(-1), "requesting");
  f.advance(3000);
  assert.equal(f.states.at(-1), "unavailable");
  assert.equal(f.window.listeners.size, 0);
  assert.deepEqual(f.gravity.at(-1), { x: 0, y: 1 });
  f.controller.destroy();
});

test("a button request supersedes automatic permission checks and cleans up on disposal", async () => {
  const grants = [];
  const f = fixture({ orientation: { requestPermission: () => new Promise((resolve) => grants.push(resolve)) } });
  const pending = f.controller.requestAccess();
  grants[0]("denied"); await flush();
  assert.equal(f.states.at(-1), "requesting");
  grants[1]("granted"); await pending;
  assert.equal(f.window.listeners.size, 2);
  assert.equal(f.timers.size, 1);
  f.controller.destroy();
  f.advance(3000);
  assert.equal(f.states.at(-1), "requesting");
  assert.equal(f.window.listeners.size, 0);
  assert.equal(f.timers.size, 0);
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
    await flush();
    for (let i = 0; i < 40; i++) f.sample(beta, gamma);
    const actual = f.gravity.at(-1);
    assert.ok(Math.abs(actual.x - expected[0]) < 0.012 && Math.abs(actual.y - expected[1]) < 0.012, `${beta},${gamma},${angle}: ${JSON.stringify(actual)}`);
    f.controller.destroy();
  }
});

test("ignore invalid sensor fields and time out devices without real data", async () => {
  const f = fixture();
  await flush();
  f.sample(null, 0); f.sample(0, null); f.sample(NaN, 20); f.sample(20, Infinity);
  assert.equal(f.gravity.length, 1);
  f.advance(3000);
  assert.equal(f.states.at(-1), "unavailable");
  assert.equal(f.window.listeners.size, 0);
  assert.deepEqual(f.gravity.at(-1), { x: 0, y: 1 });
  f.controller.destroy();
});

test("throttle tilt updates, reject stationary gravity, and cap shake impulses", async () => {
  const f = fixture();
  await flush();
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
  await flush(); f.sample(45, 20);
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
  assert.equal(f.window.listeners.size, 0);
  assert.deepEqual(f.gravity.at(-1), { x: 0, y: 1 });
  f.media.matches = false; f.media.fire("change");
  await flush();
  assert.equal(f.window.listeners.size, 2);
  f.controller.destroy();
});
