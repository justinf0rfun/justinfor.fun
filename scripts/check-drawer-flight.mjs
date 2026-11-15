import assert from "node:assert/strict";
import test from "node:test";
import { drawerFlightDuration, drawerFlightPose, paperArrival } from "../src/lib/drawer-flight.ts";
const start = { x: -360, y: -100, scale: .22, rotate: 0, tilt: 0 };
const landed = { x: 0, y: 0, scale: 1, rotate: 0, tilt: 0 };
const near = (a, b, tolerance = 1e-5) => { for (const key of Object.keys(a)) assert.ok(Math.abs(a[key] - b[key]) < tolerance, key); };
test("the card visibly peeks, arcs and settles rather than reaching the desk in its first frames", () => {
  near(drawerFlightPose(0, start, false), start);
  near(drawerFlightPose(1, start, false), landed);
  const peek = drawerFlightPose(.1, start, false), air = drawerFlightPose(.5, start, false);
  assert.ok(Math.abs(peek.x - start.x) < 10 && peek.y < start.y && peek.scale < .34);
  assert.ok(air.x > start.x && air.x < 0 && air.scale > peek.scale);
  assert.ok(drawerFlightPose(.84, start, false).scale > 1);
  for (const boundary of [.18, .84]) near(drawerFlightPose(boundary - 1e-7, start, false), drawerFlightPose(boundary + 1e-7, start, false), .001);
});
test("a new drawer choice inherits the current pose without repeating the peek", () => {
  const current = drawerFlightPose(.45, start, false), velocity = { x: 500, y: 120, scale: 1, rotate: 5, tilt: 4 };
  near(drawerFlightPose(0, current, false, velocity), current);
  near(drawerFlightPose(1, current, false, velocity), landed);
  assert.ok(drawerFlightDuration(false, true) < drawerFlightDuration(false, false));
  near(drawerFlightPose(.5, landed, false, { x: 0, y: 0, scale: 0, rotate: 0, tilt: 0 }), landed);
});
test("neighbor papers open in a smooth stagger and preserve the settled dialing geometry", () => {
  assert.ok(paperArrival(.3, 1) > paperArrival(.3, 3));
  for (const distance of [0, 1, 3, 16]) { assert.equal(paperArrival(0, distance), 0); assert.equal(paperArrival(1, distance), 1); }
  assert.ok(drawerFlightDuration(true, false) < drawerFlightDuration(false, false));
});
