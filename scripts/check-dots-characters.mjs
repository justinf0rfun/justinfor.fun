import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { prepareCharacter, sampleExpression, REST_POSE } from "../src/lib/dots/character-core.js";
import { attachFur } from "../src/lib/dots/fur.js";
import { createSelection, updateSelection } from "../src/lib/dots/selection.ts";

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
for (const name of ["Alfred", "Felipe", "Iggy", "Todd"]) {
  const bytes = readFileSync(new URL(`../public/moments-reference/${name.toLowerCase()}.glb`, import.meta.url));
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  const model = prepareCharacter(gltf.scene, name);
  assert.ok(model.size.y > 0);
  let bones = 0; model.scene.traverse(node => { if (node.isBone) bones++; });
  assert.ok(bones >= 10, `${name} must use the rigged asset`);
  const cleanup = attachFur(model.scene);
  let fur = 0; model.scene.traverse(node => { if (node.name === "Optimized fur cards") { fur++; assert.equal(node.geometry.getAttribute("plushRoot").count, 8192); } });
  assert.equal(fur, name === "Felipe" ? 2 : 1);
  if (model.motion) {
    assert.equal(model.motion.motions.ambient.duration, 6);
    model.motion.sample("ambient", 1.5, { loop: true });
    close(model.motion.values.lift, 0.016);
    close(model.motion.values.yaw, 0.045);
    close(model.motion.values.bendSide, 0.018);
    close(model.motion.values.eyeX, 0.009);
    const matrices = [];
    model.scene.traverse(node => { if (node.isBone) matrices.push(...node.matrix.elements); });
    model.motion.sample("ambient", 4.5, { loop: true });
    close(model.motion.values.lift, -0.016);
    const moved = []; model.scene.traverse(node => { if (node.isBone) moved.push(...node.matrix.elements); });
    assert.ok(matrices.some((value, i) => Math.abs(value - moved[i]) > 1e-5), "ambient motion must deform bones");
    model.motion.setReducedMotion(true);
    model.motion.update(1);
    close(model.motion.values.lift, 0);
  } else {
    assert.equal(name, "Todd");
    assert.notDeepEqual(sampleExpression("Todd", 0.5), REST_POSE);
    assert.equal(sampleExpression("Todd", 3), REST_POSE);
  }
  cleanup(); model.dispose();
}
const selection = createSelection("Alfred");
updateSelection(selection, "Felipe", 1 / 60, true);
assert.equal(selection.revealed, "Alfred");
for (let i = 0; i < 8; i++) updateSelection(selection, "Felipe", 1 / 60, true);
for (let i = 0; i < 240; i++) {
  updateSelection(selection, "Iggy", 1 / 60, true);
  assert.ok(Number.isFinite(selection.yaw) && Number.isFinite(selection.scale));
  assert.ok(selection.scale >= 0.89 && selection.scale <= 1.026);
}
assert.equal(selection.revealed, "Iggy");assert.equal(selection.active, false);close(selection.yaw, 0);close(selection.scale, 1);
updateSelection(selection, "Todd", 1 / 60, false);assert.equal(selection.revealed, "Todd");assert.equal(selection.active, false);
console.log("Dots characters passed: 4 rigged models, original fur, 6-second ambient channels, bone deformation, Todd expressions, reduced motion and interrupted selection.");
