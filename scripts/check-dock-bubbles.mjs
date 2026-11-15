import assert from "node:assert/strict";
import test from "node:test";
import { dockBubbleBounds } from "../src/lib/dock-bubbles.ts";

const close = (actual, expected) => { for (const key of Object.keys(expected)) assert.ok(Math.abs(actual[key] - expected[key]) < 1e-8, `${key}: ${actual[key]} instead of ${expected[key]}`); };
test("bubble geometry stays in Dock coordinates while the whole bar shrinks", () => {
  const logical = { x: 20, y: 0, width: 96, height: 44 };
  for (const scale of [1, .84]) {
    close(dockBubbleBounds({ left: 100 + 20 * scale, top: 500, width: 96 * scale, height: 44 * scale },
      { left: 100, top: 500, width: 360 * scale, height: 44 * scale }, { width: 360, height: 44 }), logical);
  }
});
test("native button padding may bleed left without shifting its content", () => {
  close(dockBubbleBounds({ left: 94, top: 500, width: 90, height: 44 },
    { left: 100, top: 500, width: 360, height: 44 }, { width: 360, height: 44 }), { x: -6, y: 0, width: 90, height: 44 });
});
