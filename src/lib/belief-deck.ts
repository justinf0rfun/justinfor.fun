// Bencho Card Stack geometry, MIT © 2026 Lorenzo Cabra. See components/bencho/LICENSE.
export const CARD_W = 156, CARD_H = 208, PIVOT = 260, BEAT = 55;
export const VIEW_IN = 920, VIEW_OUT = 660;
const rad = (degrees: number) => degrees * Math.PI / 180;
const MOST = 20 * 1.22;
const DROP = PIVOT * (1 - Math.cos(rad(MOST)));
const EXT_X = (CARD_W * Math.cos(rad(MOST)) + CARD_H * Math.sin(rad(MOST))) / 2;
const EXT_Y = (CARD_W * Math.sin(rad(MOST)) + CARD_H * Math.cos(rad(MOST))) / 2;
const JIT = 7 + (CARD_W * Math.sin(rad(5)) + CARD_H * (1 - Math.cos(rad(5)))) / 2;
export const ABOVE = Math.max(CARD_H / 2 + 25, EXT_Y - DROP) + 20 + JIT;
export const STAGE_W = Math.ceil((PIVOT * Math.sin(rad(MOST)) + EXT_X + JIT) * 2);
export const STAGE_H = Math.ceil(ABOVE + Math.max(CARD_H / 2, EXT_Y + DROP) + JIT);
export const VIEW_AT = "perspective(2000em) translate(0em, 0em) rotate(0deg) rotateY(180deg) scale(1)";

export function springStep(value: number, velocity: number, target: number, dt: number) {
  velocity = (velocity + (target - value) * .088 * dt) * Math.pow(.63, dt);
  value += velocity * dt;
  return Math.abs(target - value) < .02 && Math.abs(velocity) < .02
    ? { value: target, velocity: 0, settled: true } : { value, velocity, settled: false };
}

export function stackPose(slot: number, count: number, progress: number) {
  const u = progress / 100, depth = count - 1 - slot;
  const angle = (slot - (count - 1) / 2) * 35.5 / Math.max(1, count - 1);
  return { angle: angle * (.4 + .6 * u), y: -depth * 5 * (1 - u), scale: 1 - depth * .016 * (1 - u) };
}

export function fitPaper(width: number, height: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(maxWidth / width, maxHeight / height);
  return { width: width * scale, height: height * scale };
}

export const promoteSticker = (deck: number[], id: number) => [id, ...deck.filter(item => item !== id)];
export const nextSticker = (id: number, step: number, count: number) => ((id + step) % count + count) % count;
export function stickerSwipe(x: number, y: number, milliseconds: number) {
  if (Math.abs(x) < 14 || Math.abs(x) < Math.abs(y) * 1.2) return 0;
  return Math.abs(x) >= 44 || Math.abs(x) / Math.max(1, milliseconds) >= 0.45 ? Math.sign(x) : 0;
}
