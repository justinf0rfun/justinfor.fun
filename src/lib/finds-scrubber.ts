export const SCRUBBER_STEP = 28;

export function scrubPosition(start: number, delta: number, count: number) {
  const raw = start - delta / SCRUBBER_STEP;
  const bounded = Math.max(0, Math.min(count - 1, raw)), excess = raw - bounded;
  return bounded + excess / (1 + Math.abs(excess) / .32);
}

export function scrubSnap(position: number, velocity: number, count: number) {
  const momentum = Math.max(-2, Math.min(2, velocity * .12));
  return Math.max(0, Math.min(count - 1, Math.round(position + momentum)));
}

export function scrubVelocity(position: number, velocity: number, count: number) {
  return position < 0 || position > count - 1 ? 0 : Math.max(-30, Math.min(30, velocity));
}
