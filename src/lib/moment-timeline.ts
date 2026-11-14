export const MOBILE_MOMENT_STEP = 176;
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const indexProgress = (index: number, count: number) => count < 2 ? 0 : index / (count - 1);
export const nearestMoment = (progress: number, count: number) => Math.round(clamp(progress, 0, 1) * Math.max(0, count - 1));
const influence = (distance: number) => (1 + Math.cos(Math.min(1, Math.abs(distance) / 90) * Math.PI)) / 2;
export const majorTickScale = (distance: number) => 1 - (1 - 2 / 18) * influence(distance);
export const minorTickScale = (distance: number, growth: number) => 1 + (5 / 9) * influence(distance) * growth;
export const tickDivisions = (travel: number, count: number) => Math.max(1, Math.floor(travel / (Math.max(1, count - 1) * 18)));
export const characterCenter = (x: number, width: number) => width <= 600 ? clamp(x + 58, Math.min(100, width / 2), width - Math.min(100, width / 2)) : x + 58;

export function bubblePosition(center: number, width: number, index: number, count: number) {
  const bubbleWidth = 280;
  const gap = width <= 600 ? 20 : 60;
  const origin = 58 + Math.max(0, width - 116) * indexProgress(index, count);
  const flip = origin > width / 2 && origin + gap + bubbleWidth > width;
  return clamp(center + (flip ? -bubbleWidth - gap : gap), 0, Math.max(0, width - bubbleWidth));
}

export const mobileClickIndex = (scrollLeft: number, offsetFromCenter: number, count: number) =>
  clamp(Math.round((scrollLeft + offsetFromCenter) / MOBILE_MOMENT_STEP), 0, Math.max(0, count - 1));
