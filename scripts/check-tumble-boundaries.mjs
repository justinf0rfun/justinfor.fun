import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import Matter from "matter-js";

// Exercise the shipped controller and physics, with only browser plumbing stubbed.
const source = readFileSync(new URL("../src/components/react-bits/tumble-wall.tsx", import.meta.url), "utf8");
const controllerSource = stripTypeScriptTypes(source.slice(source.indexOf("// Matter.js"), source.indexOf("const shadowOf")));

function element() {
  const events = new Map();
  return {
    style: { setProperty(name, value) { this[name] = value; }, removeProperty(name) { delete this[name]; } },
    addEventListener: (name, callback) => events.set(name, callback),
    removeEventListener: (name) => events.delete(name),
    dispatch: (name, event) => events.get(name)?.(event),
    querySelector: () => null,
    closest() { return this; },
    getAttribute: () => "test",
    matches: () => false,
  };
}

function wall({ width = 720, height = 112, count = 10, random = 0.000001, ...overrides } = {}) {
  let engine;
  let time = 0;
  let nextFrame = 0;
  const frames = new Map();
  const nodes = Array.from({ length: count }, element);
  const document = { ...element(), hidden: false };
  const window = { ...element(), setTimeout: () => 0, clearTimeout() {}, innerHeight: 900 };
  const stage = {
    ...element(), ownerDocument: { ...document, defaultView: window },
    clientWidth: width, clientHeight: height,
    getBoundingClientRect: () => ({ left: 0, top: 0, width, height }),
    querySelectorAll: () => nodes,
    setPointerCapture() {}, hasPointerCapture: () => false, releasePointerCapture() {},
  };
  const settings = { items: nodes.map(() => ({ title: "test" })), count, shape: "square", size: 46, sizeVariance: 0.08, fill: 0.45, radius: 12, frame: "none", frameWidth: 6, showTitles: false, hoverScale: 1.08, gravity: 1, gravityX: 0, bounce: 0.32, friction: 0.3, airFriction: 0.012, spin: 0.5, drift: 0, entrance: "rain", stagger: 55, draggable: true, dragStiffness: 0.2, throwStrength: 1, popForce: 1, contain: true, paused: false, reduced: false, ...overrides };
  const createWall = runInNewContext(`${controllerSource}\ncreateWall`, {
    Matter: { ...Matter, Engine: { ...Matter.Engine, create(options) { engine = Matter.Engine.create(options); return engine; } } },
    Math: Object.assign(Object.create(Math), { random: () => random }),
    document, window, performance: { now: () => time },
    requestAnimationFrame: (callback) => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: (id) => frames.delete(id),
    ResizeObserver: class { observe() {} disconnect() {} },
    IntersectionObserver: class {
      constructor(callback) { this.callback = callback; }
      observe() { this.callback([{ isIntersecting: true, intersectionRatio: 1 }]); }
      disconnect() {}
    },
  });
  const controller = createWall(stage, element(), { current: settings }, { current() {} });
  function advance(ticks) {
    for (let i = 0; i < ticks; i++) {
      time += 1000 / 60;
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback(time));
    }
  }
  function pointer(type, node, x, y) {
    stage.dispatch(type, { target: node, isPrimary: true, pointerType: "mouse", pointerId: 1, button: 0, clientX: x, clientY: y });
  }
  return { engine, nodes, advance, pointer, controller, settings };
}

for (const { name, ticks = 25, width = 720, height = 112, gravity = 1, gravityX = 0, contain = true, paused = false } of [
  { name: "during rain" },
  { name: "after rain", ticks: 240 },
  { name: "on mobile", width: 390 },
  { name: "with an open entrance", contain: false },
  { name: "from the bottom", gravity: -1 },
  { name: "from the left", width: 112, height: 720, gravity: 0, gravityX: 1 },
  { name: "from the right", width: 112, height: 720, gravity: 0, gravityX: -1 },
  { name: "while paused", paused: true },
]) {
  test(`respect containment when dragging ${name}`, () => {
    const scene = wall({ width, height, gravity, gravityX, contain });
    scene.advance(ticks);
    const bodies = Matter.Composite.allBodies(scene.engine.world).filter((body) => !body.isStatic);
    const node = scene.nodes[1];
    const [x, y] = node.style.transform.match(/translate3d\(([-\d.]+)px,([-\d.]+)px/).slice(1).map(Number);
    const center = { x: x + parseFloat(node.style["--tw-w"]) / 2, y: y + parseFloat(node.style["--tw-h"]) / 2 };
    const body = bodies.toSorted((a, b) => Math.hypot(a.position.x - center.x, a.position.y - center.y) - Math.hypot(b.position.x - center.x, b.position.y - center.y))[0];
    const axis = gravityX ? "x" : "y";
    const positive = (gravityX || gravity) > 0;
    const size = gravityX ? width : height;
    const inside = () => positive ? body.bounds.min[axis] >= -0.001 : body.bounds.max[axis] <= size + 0.001;
    const visible = () => positive ? body.bounds.max[axis] : size - body.bounds.min[axis];
    assert.ok(inside(), "The dragged icon must have already entered the container");
    if (paused) {
      scene.settings.paused = true;
      scene.controller.sync();
      Matter.Body.setAngle(body, 0);
    }
    const target = { ...center, [axis]: positive ? -300 : size + 300 };
    scene.pointer("pointerdown", node, center.x, center.y);
    scene.pointer("pointermove", node, target.x, target.y);
    scene.advance(1);
    scene.pointer("pointerup", node, target.x, target.y);
    if (paused) assert.ok(inside(), "Direct dragging must keep an entered icon inside while paused");
    let clearance = visible();
    for (let i = 0; i < 45; i++) {
      scene.advance(1);
      clearance = Math.min(clearance, visible());
    }
    if (paused) { scene.settings.paused = false; scene.controller.sync(); }
    scene.advance(300);
    const settled = Matter.Composite.allBodies(scene.engine.world).filter((body) => !body.isStatic);
    assert.equal(settled.length, 10, "Every icon must finish entering");
    assert.ok(settled.every((b) => b.bounds.min.x >= -2 && b.bounds.min.y >= -2 && b.bounds.max.x <= width + 2 && b.bounds.max.y <= height + 2), "All icons must settle inside the container");
    scene.controller.destroy();
    assert.equal(clearance >= 0, contain, `Unexpected containment during the first throw: clearance=${clearance.toFixed(2)}`);
  });
}

test("settled state waits for landing and changes when icons move again", () => {
  const scene = wall({ width: 390 });
  assert.equal(scene.controller.isSettled(), false);
  scene.advance(1);
  assert.equal(scene.controller.isSettled(), false);
  scene.advance(600);
  assert.equal(scene.controller.isSettled(), true);
  scene.controller.shake();
  assert.equal(scene.controller.isSettled(), false);
  scene.controller.destroy();
  assert.equal(scene.controller.isSettled(), false);
});

test("resting icons finish entering despite small collision overlap", () => {
  const scene = wall({ width: 390 });
  scene.advance(600);
  const bodies = Matter.Composite.allBodies(scene.engine.world).filter((body) => !body.isStatic);
  assert.equal(bodies.length, 10);
  assert.ok(bodies.every((body) => body.collisionFilter.category === 1), "An edge overlap must not leave the entrance active forever");
  scene.controller.destroy();
});

for (const { name, changes } of [
  { name: "horizontal", changes: [{ gravityX: 1, gravity: 0 }] },
  { name: "zero", changes: [{ gravityX: 0, gravity: 0 }] },
  { name: "upward", changes: [{ gravityX: 0, gravity: -1 }] },
  { name: "rapidly changing", changes: [{ gravityX: 1, gravity: 0 }, { gravityX: 0, gravity: 0 }, { gravityX: 0, gravity: -1 }] },
]) {
  test(`finish rain and apply ${name} gravity requested during entrance`, () => {
    const scene = wall({ width: 390 });
    for (const change of changes) {
      scene.advance(1);
      Object.assign(scene.settings, change);
      scene.controller.sync();
    }
    scene.advance(600);
    const bodies = Matter.Composite.allBodies(scene.engine.world).filter((body) => !body.isStatic);
    assert.equal(bodies.length, 10);
    assert.ok(bodies.every((body) => body.collisionFilter.category === 1), "Every icon must finish crossing the entrance");
    assert.ok(bodies.every((body) => body.bounds.min.x >= -2 && body.bounds.min.y >= -2 && body.bounds.max.x <= 392 && body.bounds.max.y <= 114), "Tilt must preserve containment after entrance");
    const target = changes.at(-1);
    assert.equal(scene.engine.gravity.x, target.gravityX);
    assert.equal(scene.engine.gravity.y, target.gravity);
    if (target.gravityX > 0) assert.ok(bodies.reduce((sum, body) => sum + body.position.x, 0) / bodies.length > 195, "Icons must settle toward the right edge");
    if (target.gravity < 0) assert.ok(bodies.reduce((sum, body) => sum + body.position.y, 0) / bodies.length < 56, "Icons must settle toward the top edge");
    scene.controller.destroy();
  });
}

test("release deferred gravity when a randomized pile rests across the entrance", () => {
  for (const random of [0, 0.11, 0.37, 0.93]) {
    const scene = wall({ width: 390, random });
    scene.advance(1);
    scene.settings.gravity = -1;
    scene.controller.sync();
    scene.advance(600);
    const bodies = Matter.Composite.allBodies(scene.engine.world).filter((body) => !body.isStatic);
    assert.equal(bodies.length, 10);
    assert.ok(bodies.every((body) => body.collisionFilter.category === 1), `Entrance must finish for random=${random}`);
    assert.ok(bodies.every((body) => body.bounds.min.x >= -2 && body.bounds.min.y >= -2 && body.bounds.max.x <= 392 && body.bounds.max.y <= 114), `All icons must be contained for random=${random}`);
    assert.equal(scene.engine.gravity.y, -1, "Tilt must take effect after the entrance finishes");
    scene.controller.destroy();
  }
});
