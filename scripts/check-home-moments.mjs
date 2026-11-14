import assert from "node:assert/strict";
import { momentsPlacement, flightTransform } from "../src/lib/home-moments.ts";

const wide = momentsPlacement({ width: 1440, height: 900 }, 432, { left: 400, top: 780, width: 640, height: 72 });
assert.equal(wide.mode, "side");assert.equal(wide.width, 340);
assert.ok(wide.left >= 20 && wide.left + wide.width <= 432 - 20);
assert.ok(wide.top + wide.maxHeight <= 880);
for (const width of [320, 390, 768, 1024]) {
  const dockWidth = Math.min(640, width - 30);
  const place = momentsPlacement({ width, height: 640 }, Math.max(16, (width - 576) / 2), { left: (width - dockWidth) / 2, top: 530, width: dockWidth, height: 70 });
  assert.equal(place.mode, "sheet");assert.ok(place.left >= 16);assert.ok(place.left + place.width <= width - 16);
  assert.ok(place.maxHeight <= 530 - 16);
}
const from = { left: 500, top: 750, width: 44, height: 44 };
const to = { left: 140, top: 300, width: 164, height: 164 };
const flight = flightTransform(from, to);
assert.equal(to.left + to.width / 2 + flight.x, from.left + from.width / 2);
assert.equal(to.top + to.height / 2 + flight.y, from.top + from.height / 2);
assert.equal(to.width * flight.scale, from.width);
const interrupted = flightTransform({ left: 300, top: 460, width: 95, height: 95 }, from);
assert.equal(from.left + from.width / 2 + interrupted.x, 347.5);
console.log("Home Moments passed: side gutter, 320–1024 sheet bounds, short screens, centered flight and interrupted return.");
