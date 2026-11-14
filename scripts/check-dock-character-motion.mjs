import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { prepareCharacter, EXPRESSION_DURATION } from "../src/lib/dots/character-core.js";
import { advanceDockMotion, consumeDockHover, createDockMotion, greetDockCompanion, leaveDockResponse, pulseDockMotion } from "../src/lib/dots/dock-motion.ts";

const intent = createDockMotion();
assert.equal(consumeDockHover(intent, 1, "dock", false), true);
assert.equal(consumeDockHover(intent, 1, "dock", false), false);
assert.equal(consumeDockHover(intent, 2, "travel", false), false);
assert.equal(consumeDockHover(intent, 3, "stage", false), false);
assert.equal(consumeDockHover(intent, 4, "dock", true), false);
assert.equal(consumeDockHover(intent, 4, "dock", false), false, "suppressed requests must not replay later");

for (const name of ["Alfred", "Felipe", "Iggy", "Todd"]) {
  const bytes = readFileSync(new URL(`../public/moments-reference/${name.toLowerCase()}.glb`, import.meta.url));
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  const model = prepareCharacter(gltf.scene, name);
  const item = { model, elapsed: 10, playExpression: false, dockResponse: false };
  const motion = createDockMotion();
  const scale = Math.min(0.44 * 0.6 / model.size.y, 0.44 * 0.72 / Math.max(model.size.x, model.size.z));
  model.motion?.ambient();
  let peak = 0;
  for (let frame = 0; frame < 1080; frame++) {
    model.motion?.update(1 / 60, { apply: false });
    const lift = model.motion?.values.lift;
    const pose = advanceDockMotion(motion, 1 / 60, "dock", false, lift === undefined ? null : lift / 0.016, 0.016 * scale * 100);
    if (frame > 360) peak = Math.max(peak, Math.abs((lift ?? 0) * scale * 100 + pose.liftPixels));
    if (model.motion) assert.equal(model.motion.values.lift, lift, "Dock enhancement must not change source rig values");
  }
  assert.ok(peak > 1.2 && peak <= 1.5, `${name}: Dock lift ${peak}px`);
  assert.equal(greetDockCompanion(item, name), true);
  model.motion?.update(0.3);
  item.elapsed = 0.3;
  const greeting = model.motion?.values.lift;
  assert.equal(greetDockCompanion(item, name), false, "hover must not restart a greeting already playing");
  if (model.motion) assert.equal(model.motion.values.lift, greeting);
  leaveDockResponse(item);
  assert.equal(item.dockResponse, false);
  if (model.motion) assert.equal(model.motion.state.name, "ambient");
  else {
    assert.equal(item.playExpression, false);
    item.elapsed = EXPRESSION_DURATION.Todd;
    assert.equal(greetDockCompanion(item, name), true);
    leaveDockResponse(item);
  }
  for (let frame = 0; frame < 36; frame++) advanceDockMotion(motion, 1 / 60, "travel", false, 1, 0.4);
  assert.equal(motion.lift, 0, "extra Dock movement should settle during the flight");
  assert.deepEqual(advanceDockMotion(motion, 1 / 60, "stage", false, 1, 1.4), { liftPixels: 0, scale: 1 });
  motion.lift = 1;
  pulseDockMotion(motion);
  assert.deepEqual(advanceDockMotion(motion, 1 / 60, "dock", true, 1, 0.4), { liftPixels: 0, scale: 1 });
  assert.equal(motion.pulse, null);
  model.dispose();
}

const ring = createDockMotion();
pulseDockMotion(ring);
for (let frame = 0; frame < 12; frame++) advanceDockMotion(ring, 1 / 60, "dock", false, null, 0);
const elapsed = ring.pulse;
pulseDockMotion(ring);
assert.equal(ring.pulse, elapsed, "ring response must not restart while active");
for (let frame = 0; frame < 30; frame++) advanceDockMotion(ring, 1 / 60, "dock", false, null, 0);
assert.equal(ring.pulse, null);
assert.deepEqual(advanceDockMotion(ring, 1 / 60, "stage", false, null, 0), { liftPixels: 0, scale: 1 });
console.log("Dock character motion passed: 1.2–1.5px idle, single hover responses, smooth travel, original stage poses and reduced motion.");
