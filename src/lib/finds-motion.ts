// Adapted from the served Mantras and Segmented Navigation modules; see finds/SOURCE.md.
export const cardSpring = { type: "spring", stiffness: 250, damping: 20, mass: .5 } as const;
export const indexSpring = { type: "spring", stiffness: 500, damping: 40, mass: .8 } as const;
export const drawerSpring = { type: "spring", stiffness: 300, damping: 34, mass: .6 } as const;
export const clampCard = (position: number, count: number) => Math.max(0, Math.min(count - 1, position));

export function foldedCardOffset(offset: number, spread = 3) {
  const distance = Math.abs(offset), tail = Math.max(0, distance - spread);
  // Keep the original 48px step nearby; join the bounded paper stack with the same slope.
  return Math.sign(offset) * (Math.min(distance, spread) * 48 + 48 * tail / (1 + tail / 1.25));
}

export function fanLayout(width: number, compact: boolean) {
  const spread = compact ? 1 : width < 500 ? 2 : 3;
  const extent = spread * 48 + 60;
  const projectedWidth = (304 + extent * 2) * Math.cos(Math.PI / 6) + 413 * .5;
  return { spread, scale: Math.min(compact ? .49 : .72, Math.max(0, width - (compact ? 32 : 16)) / projectedWidth) };
}

export function stackLift(offset: number, spread: number) {
  const tail = Math.max(0, Math.abs(offset) - spread);
  return 1 / (1 + (tail / .5) ** 2);
}

export function cardPose(index: number, position: number, hover: number | null = null, velocity = 0, spread = 3) {
  const offset = index - position;
  const folded = foldedCardOffset(offset, spread);
  const speed = Math.max(0, Math.min(1, (Math.abs(velocity) - 5) / 7));
  const cascade = speed * speed * (3 - 2 * speed);
  const proximity = 250 * Math.max(0, 1 - Math.abs(offset) / 5) ** 2;
  const slide = index === Math.round(position) ? 160 : 0;
  return {
    x: folded,
    y: slide + (proximity - slide) * cascade + (index === hover && !slide ? 24 : 0),
    z: folded / 24,
  };
}

export function followFind(trail: string[], id: string) {
  const previous = trail.indexOf(id);
  return previous < 0 ? [...trail, id] : trail.slice(0, previous + 1);
}
