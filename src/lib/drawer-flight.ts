export type DrawerFlightPose = { x: number; y: number; scale: number; rotate: number; tilt: number };
const smooth = (t: number) => t * t * (3 - 2 * t);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const bezier = (a: number, b: number, c: number, d: number, t: number) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d;
const settle = (a: number, b: number, speed: number, duration: number, t: number) => {
  const limit = 3 * Math.max(Math.abs(b - a), .02) / duration;
  const velocity = Math.max(-limit, Math.min(limit, speed));
  return (2 * t ** 3 - 3 * t ** 2 + 1) * a + (t ** 3 - 2 * t ** 2 + t) * velocity * duration + (-2 * t ** 3 + 3 * t ** 2) * b;
};
export const drawerFlightDuration = (compact: boolean, retarget: boolean) => retarget ? (compact ? .3 : .38) : (compact ? .56 : .68);

export function drawerFlightPose(progress: number, start: DrawerFlightPose, compact: boolean, velocity?: DrawerFlightPose): DrawerFlightPose {
  const t = Math.max(0, Math.min(1, progress)), arc = compact ? 32 : 68;
  if (velocity) {
    const duration = drawerFlightDuration(compact, true), bow = Math.sin(Math.PI * t) ** 2;
    return {
      x: settle(start.x, 0, velocity.x, duration, t),
      y: settle(start.y, 0, velocity.y, duration, t) - arc * .3 * bow * Math.min(1, Math.hypot(start.x, start.y) / 160),
      scale: settle(start.scale, 1, velocity.scale, duration, t),
      rotate: settle(start.rotate, 0, velocity.rotate, duration, t),
      tilt: settle(start.tilt, 0, velocity.tilt, duration, t),
    };
  }
  const direction = start.x <= 0 ? 1 : -1;
  const peek = { x: start.x + direction * (compact ? 3 : 6), y: start.y - (compact ? 12 : 18), scale: compact ? .37 : .32, rotate: direction * (compact ? -6 : -9), tilt: compact ? -6 : -10 };
  if (t < .18) {
    const p = smooth(t / .18);
    return { x: mix(start.x, peek.x, p), y: mix(start.y, peek.y, p), scale: mix(start.scale, peek.scale, p), rotate: mix(start.rotate, peek.rotate, p), tilt: mix(start.tilt, peek.tilt, p) };
  }
  if (t < .84) {
    const p = smooth((t - .18) / .66);
    return {
      x: bezier(peek.x, peek.x * .85, peek.x * .12, 0, p),
      y: bezier(peek.y, peek.y - arc, -arc * .6, compact ? 3 : 6, p),
      scale: mix(peek.scale, compact ? 1.012 : 1.025, p),
      rotate: mix(peek.rotate, direction * (compact ? 2 : 4), p),
      tilt: mix(peek.tilt, compact ? 1 : 2, p),
    };
  }
  const p = smooth((t - .84) / .16);
  return { x: 0, y: mix(compact ? 3 : 6, 0, p), scale: mix(compact ? 1.012 : 1.025, 1, p), rotate: mix(direction * (compact ? 2 : 4), 0, p), tilt: mix(compact ? 1 : 2, 0, p) };
}

export function paperArrival(progress: number, distance: number) {
  const delay = Math.min(4, Math.abs(distance)) * .055;
  return smooth(Math.max(0, Math.min(1, (progress - delay) / (1 - delay))));
}
