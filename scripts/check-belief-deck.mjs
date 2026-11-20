import assert from "node:assert/strict";
import { ABOVE, CARD_H, CARD_W, PIVOT, STAGE_H, STAGE_W, fitPaper, nextSticker, promoteSticker, springStep, stackPose, stickerSwipe } from "../src/lib/belief-deck.ts";

let value = 0, velocity = 0;
for (let i = 0; i < 180; i++) ({ value, velocity } = springStep(value, velocity, 100, 1));
assert.equal(value, 100);assert.equal(velocity, 0);
for (let i = 0; i < 8; i++) ({ value, velocity } = springStep(value, velocity, 0, 1));
assert.ok(value > 0 && value < 100);
for (let i = 0; i < 180; i++) ({ value, velocity } = springStep(value, velocity, 100, 1));
assert.equal(value, 100);assert.equal(velocity, 0);
assert.ok(Math.abs(springStep(0, 0, 100, 1).value - 5.544) < .00001);

for (let slot = 0; slot < 5; slot++) {
  const shut = stackPose(slot, 5, 0), open = stackPose(slot, 5, 100);
  assert.ok(Math.abs(shut.angle - open.angle * .4) < .0001);
  assert.equal(open.scale, 1);assert.ok(open.y === 0);
  assert.equal(shut.y, -(4 - slot) * 5);
  const radians = open.angle * Math.PI / 180;
  const centreX = STAGE_W / 2 + PIVOT * Math.sin(radians);
  const halfWidth = (CARD_W * Math.cos(radians) + CARD_H * Math.abs(Math.sin(radians))) / 2;
  assert.ok(centreX - halfWidth > 0 && centreX + halfWidth < STAGE_W);
}
assert.ok(ABOVE > CARD_H / 2 && STAGE_H > CARD_H);
for (const [width,height] of [[792,856],[1280,720],[960,1280],[1025,1280],[720,960]]) {
  const size = fitPaper(width,height,STAGE_W-40,STAGE_H-24);
  assert.ok(Math.abs(size.width/size.height-width/height)<.00001);
  assert.ok(size.width<=STAGE_W-40+.001 && size.height<=STAGE_H-24+.001);
}
assert.deepEqual(promoteSticker([0,1,2,3,4],3),[3,0,1,2,4]);
assert.equal(nextSticker(4,1,5),0);assert.equal(nextSticker(0,-1,5),4);
assert.equal(stickerSwipe(60,8,500),1);assert.equal(stickerSwipe(-16,2,25),-1);
assert.equal(stickerSwipe(13,0,1),0);assert.equal(stickerSwipe(50,90,80),0);
console.log("Bencho stack passed: spring and pivot, responsive bounds, uncut artwork, promote and wrap, and touch intent.");
