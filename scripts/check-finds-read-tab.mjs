import assert from "node:assert/strict";
import test from "node:test";
import { readTabIsPulling, readTabOffset, readTabShouldOpen } from "../src/lib/finds-read-tab.ts";

test("paper follows the first 32px then resists continuously below 64px", () => {
  assert.equal(readTabOffset(-20), 0);
  for (const distance of [0, 7, 20, 28, 32]) assert.equal(readTabOffset(distance), distance);
  assert.ok(readTabOffset(40) > 32 && readTabOffset(40) < 40);
  assert.ok(readTabOffset(1e6) < 64);
  assert.ok(Math.abs((readTabOffset(32.001) - 32) / .001 - 1) < .001);
});
test("tap opens, partial or sideways pulls cancel, a deliberate downward pull opens", () => {
  assert.equal(readTabShouldOpen(0, false, false), true);
  assert.equal(readTabShouldOpen(17, true, true), false);
  assert.equal(readTabShouldOpen(18, true, true), true);
  assert.equal(readTabShouldOpen(80, true, false), false);
  assert.equal(readTabShouldOpen(-40, true, false), false);
  assert.equal(readTabShouldOpen(0, true, true), false);
});
test("the direction can recover from sideways jitter and accepts a modest diagonal pull", () => {
  assert.equal(readTabIsPulling(8, 1), false);
  assert.equal(readTabIsPulling(10, 90), true);
  assert.equal(readTabShouldOpen(90, true, readTabIsPulling(10, 90)), true);
  assert.equal(readTabShouldOpen(18, true, readTabIsPulling(20, 18)), true);
  assert.equal(readTabIsPulling(60, 20), false);
  assert.equal(readTabIsPulling(0, -40), false);
});
