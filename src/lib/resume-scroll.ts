// Ported from Devouring Details' public homepage bundle, modules 19002/59888/76198.
// Source URLs, original symbols and adaptation boundaries: docs/resume.md.
export const MINIMAP_COUNT = 36;
export const MINIMAP_RANGE = 315;
export const progressSpring = { stiffness: 650, damping: 40 };
export const tickSpring = { stiffness: 600, damping: 45 };
export const indicatorSpring = { type: "spring", stiffness: 240, damping: 30 } as const;

export const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

export function minimapProgress(scrollY: number, documentHeight: number, viewportHeight: number) {
  const distance = documentHeight - viewportHeight;
  return distance > 0 ? Math.max(0, Math.min(MINIMAP_RANGE, scrollY / distance * MINIMAP_RANGE)) : 0;
}

export function majorTick(index: number, count = MINIMAP_COUNT) {
  if (index === 0 || index === count - 1) return true;
  const interval = count / (Math.floor(count / 8) + 1);
  return Math.abs(index % interval) < .5 || Math.abs(index % interval - interval) < .5;
}

export function tickScale(distance: number, initial = 1, base = 1, intensity = 2) {
  if (Math.abs(distance) > 48) return initial;
  const falloff = initial - Math.abs(distance) / 48;
  return base + falloff * falloff * intensity;
}

export function currentSection(tops: number[], viewportHeight: number, scrollY: number) {
  if (scrollY <= 0) return -1;
  return tops.findLastIndex(top => top < viewportHeight * .4);
}
