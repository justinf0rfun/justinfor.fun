import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";
import { cardPose, clampCard, fanLayout, foldedCardOffset, followFind, stackLift } from "../src/lib/finds-motion.ts";
const records = JSON.parse(readFileSync(new URL("../src/data/x-bookmarks.json", import.meta.url)));
const code = stripTypeScriptTypes(readFileSync(new URL("../src/data/finds.ts", import.meta.url), "utf8").replace(/^import .*;$/m, "")).replace(/^export /gm, "");
const { finds, findDrawers, inDrawer } = runInNewContext(`${code}\n({finds,findDrawers,inDrawer})`, { xBookmarks: records });
test("original Mantras geometry and finite navigation survive fractional movement", () => {
 assert.deepEqual(cardPose(1, 1), { x: 0, y: 160, z: 0 });
 assert.deepEqual(cardPose(2, 1, 2), { x: 48, y: 24, z: 2 });
 assert.equal(cardPose(2, 1.25).x, 36);
 assert.equal(cardPose(1, 1, null, 12).y, 250);
 assert.ok(cardPose(2, 1, null, 12).y > cardPose(3, 1, null, 12).y);
 assert.equal(cardPose(1, 1, null, -12).y, 250);
 assert.equal(clampCard(-10, 4), 0); assert.equal(clampCard(10, 4), 3);
 assert.equal(clampCard(4, 1), 0);
});
test("following an existing card unwinds the reading path instead of creating loops", () => {
 assert.deepEqual(followFind(["a", "b"], "c"), ["a", "b", "c"]);
 assert.deepEqual(followFind(["a", "b", "c"], "a"), ["a"]);
 assert.deepEqual(followFind(["a"], "a"), ["a"]);
});
test("paper stacks retain the original nearby spacing and fold continuously at both ends", () => {
 for (const spread of [1, 2, 3]) {
  for (const offset of [-spread, -.5, 0, .5, spread]) assert.equal(foldedCardOffset(offset, spread), offset * 48);
  let previous = -Infinity;
  for (let offset = -30; offset <= 30; offset += .125) {
   const folded = foldedCardOffset(offset, spread);
   assert.ok(folded > previous); previous = folded;
   assert.ok(Math.abs(folded) < spread * 48 + 60);
   assert.ok(Math.abs(folded + foldedCardOffset(-offset, spread)) < 1e-8);
  }
  const delta = .0001;
  assert.ok(Math.abs((foldedCardOffset(spread + delta, spread) - foldedCardOffset(spread, spread)) / delta - 48) < .01);
 }
});
test("desktop and phone fans fit the available width without a clipping mask", () => {
 for (const [width, compact, expected] of [[288, true, 1], [358, true, 1], [359, false, 2], [676, false, 3]]) {
  const { spread, scale } = fanLayout(width, compact);
  assert.equal(spread, expected);
  const projected = (304 + 2 * (spread * 48 + 60)) * Math.cos(Math.PI / 6) + 413 * .5;
  assert.ok(projected * scale <= width - 16 + 1e-8);
 }
});
test("nearby cards keep their full spring lift while distant residual motion tucks into the stack", () => {
 for (const spread of [1, 2, 3]) {
  assert.equal(stackLift(-spread, spread), 1); assert.equal(stackLift(spread, spread), 1);
  assert.equal(stackLift(0, spread), 1);
  assert.ok(stackLift(spread + .0001, spread) > .99999);
  assert.ok(stackLift(spread + 2, spread) < .06);
  assert.equal(stackLift(-spread - 2, spread), stackLift(spread + 2, spread));
 }
});
test("a newly saved source is readable in Unfiled before editorial metadata is added", () => {
 const added = { ...records[0], id: "a-new-source" };
 const { finds: next } = runInNewContext(`${code}\n({finds})`, { xBookmarks: [...records, added] });
 const note = next.find(note => note.id === added.id);
 assert.equal(note.url, added.url); assert.equal(note.number, added.id);
 assert.deepEqual(Array.from(note.topics), ["inbox"]); assert.equal(note.thought, added.thought);
});
test("every source is retained, every drawer has enough cards, and links cross drawers", () => {
 assert.equal(finds.length, records.length + 12);
 assert.equal(finds.filter(note => !note.mock).length, records.length);
 assert.equal(new Set(finds.map(note => note.id)).size, finds.length);
 for (const source of records) {
  const note = finds.find(note => note.id === source.id);
  for (const field of ["url", "thought", "savedAt"]) assert.equal(note[field], source[field]);
  assert.equal(JSON.stringify(note.snapshot), JSON.stringify(source.snapshot));
  for (const link of note.links) { assert.ok(finds.some(target => target.id === link.id)); assert.ok(link.reason); assert.notEqual(link.id, note.id); }
 }
 for (const drawer of findDrawers) assert.ok(finds.filter(note => inDrawer(note, drawer.id)).length >= 5);
 for (const note of finds.filter(note => note.mock)) {
  assert.equal(note.url, ""); assert.equal(note.thought, ""); assert.ok(note.snapshot.text);
  assert.ok(note.links.every(link => finds.some(target => target.id === link.id)));
 }
 const map = finds.find(note => note.number === "003");
 assert.ok(inDrawer(map, "learning") && inDrawer(map, "engineering"));
 assert.ok(map.links.some(link => !inDrawer(finds.find(note => note.id === link.id), "learning")));
 assert.deepEqual(Array.from(finds.find(note => note.number === "004").topics), ["inbox"]);
});
