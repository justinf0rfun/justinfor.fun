import assert from "node:assert/strict";
import test from "node:test";
import { SCRUBBER_STEP, scrubPosition, scrubSnap, scrubVelocity } from "../src/lib/finds-scrubber.ts";

test("held ruler movement is continuous and follows the pointer pixel for pixel", () => {
  for (const delta of [-35, -14, -7, 7, 14, 35]) {
    const next = scrubPosition(5, delta, 16);
    assert.ok(Math.abs(-(next - 5) * SCRUBBER_STEP - delta) < 1e-8);
  }
  assert.equal(scrubPosition(5, -7, 16), 5.25);
});
test("soft boundaries resist smoothly without changing the endpoint selection", () => {
  assert.ok(scrubPosition(0, 1000, 16) > -.32);
  assert.ok(scrubPosition(15, -1000, 16) < 15.32);
  assert.ok(Math.round(scrubPosition(0, 1000, 16)) === 0);
  assert.equal(Math.round(scrubPosition(15, -1000, 16)), 15);
  const delta = .001;
  assert.ok(Math.abs(scrubPosition(0, delta, 16) / (-delta / SCRUBBER_STEP) - 1) < .001);
});
test("release snaps to a detent and a fast flick adds at most two cards", () => {
  assert.equal(scrubSnap(5.25, 0, 16), 5);
  assert.equal(scrubSnap(5.75, 0, 16), 6);
  assert.equal(scrubSnap(5, 1000, 16), 7);
  assert.equal(scrubSnap(5, -1000, 16), 3);
  assert.equal(scrubSnap(-.3, -1000, 16), 0);
  assert.equal(scrubSnap(15.3, 1000, 16), 15);
  assert.equal(scrubSnap(0, 1000, 1), 0);
  assert.equal(scrubVelocity(5, 1000, 16), 30);
  assert.equal(scrubVelocity(5, -1000, 16), -30);
  assert.equal(scrubVelocity(-.3, -100, 16), 0);
  assert.equal(scrubVelocity(15.3, 100, 16), 0);
});
