import assert from "node:assert/strict";
import { drawSticker, stickerPose, stickerSwipe } from "../src/lib/belief-deck.ts";
const initial = [0, 1, 2, 3, 4];
let order = initial;
for (let index = 0; index < 100; index++) {
  order = drawSticker(order);
  assert.equal(new Set(order).size, 5);
  assert.equal(order[0], (index + 1) % 5);
}
assert.deepEqual(initial, [0, 1, 2, 3, 4]);
assert.deepEqual(drawSticker(initial, -1), [4, 0, 1, 2, 3]);
assert.equal(drawSticker(initial, initial.indexOf(3))[0], 3);
assert.equal(stickerSwipe(60, 8, 500), 1);
assert.equal(stickerSwipe(-16, 2, 25), -1);
assert.equal(stickerSwipe(13, 0, 1), 0, "a tap must not draw a card");
assert.equal(stickerSwipe(20, 2, 300), 0, "a slow short drag returns to the stack");
assert.equal(stickerSwipe(50, 90, 80), 0, "page scrolling must not shuffle");
for (const stageWidth of [288, 358, 576]) {
  const landscape = { width: Math.min(276, stageWidth - 64), height: 150 };
  const portrait = { width: 180, height: 240 };
  const pose = stickerPose(3, 5, portrait, landscape, stageWidth, false);
  assert.ok(portrait.height * pose.scale < landscape.height, "back papers must fit behind a shorter front paper");
  for (let depth = 0; depth < 5; depth++) {
    const fan = stickerPose(depth, 5, portrait, landscape, stageWidth, true);
    assert.ok(Math.abs(fan.x) + 276 * fan.scale / 2 <= stageWidth / 2 - 15);
  }
}
console.log("Belief deck passed: repeated draws, reverse and direct selection, swipe intent, compact stack and responsive fan.");
