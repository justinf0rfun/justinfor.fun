// Geometry, damping, and timing from the deployed Engineering Shelf animation.
// The local shelf projects the two faces separately to keep the cover visible in WebKit.
export const modulo = (value: number, count: number) => (value % count + count) % count;

export function bookDistance(slot: number, position: number, count: number) {
  const offset = modulo(slot - position, count);
  return offset > count / 2 ? offset - count : offset;
}

export function nearestBook(position: number, book: number, count: number) {
  const index = Math.round(position);
  return index + modulo(book - modulo(index, count) + count / 2, count) - count / 2;
}

export function stepBook(position: number, target: number, dt: number, dragging: boolean, immediate: boolean) {
  if (immediate) return target;
  const next = position + (target - position) * (1 - Math.exp(-(dragging ? 18 : 5.2) * dt));
  return 1e-4 > Math.abs(target - next) ? target : next;
}

export function bookX(offset: number, spine: number, gap: number, width: number) {
  const spread = 1 > Math.abs(offset)
    ? (offset + Math.sin(Math.PI * offset) / Math.PI) / 2
    : .5 * Math.sign(offset);
  return offset * (spine + gap) + (width - spine + 1.6 * gap) * spread;
}

export function bookPose(x: number, offset: number, height: number, tiltX: number, tiltY: number, lift: number) {
  const center = Math.max(0, 1 - Math.abs(offset));
  const turn = center * center * (3 - 2 * center);
  return {
    transform: `perspective(2200px) translate3d(${x}px,${-(.025 * turn) * height - .045 * lift * height}px,${.2 * turn * height}px) rotateZ(${-4.5 * turn}deg) rotateX(${tiltX * turn}deg) rotateY(${-90 * turn + tiltY * turn}deg)`,
    z: Math.round(100 - 4 * Math.abs(offset)),
    spineShade: (.55 * turn).toFixed(3),
    coverShade: ((1 - turn) * .5).toFixed(3),
    turn,
  };
}

export const closedBookClip = (box: DOMRect) =>
  `inset(${box.top}px ${innerWidth - box.right}px ${innerHeight - box.bottom}px ${box.left}px round 3px)`;

export const openBookClip = "inset(0px 0px 0px 0px round 0px)";
export const openBookTiming = { duration: 1050, easing: "cubic-bezier(.76,0,.18,1)", fill: "both" } as const;
export const closeBookTiming = { duration: 800, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" } as const;
export const bookTextTiming = { duration: 900, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" } as const;

export const inkPoints = [
  { x: 150, y: 330, delay: 0 },
  { x: 340, y: 600, delay: 120 },
  { x: 250, y: 120, delay: 220 },
  { x: 90, y: 760, delay: 300 },
  { x: 400, y: 250, delay: 360 },
  { x: 260, y: 860, delay: 420 },
  { x: 230, y: 470, delay: 180 },
] as const;

export const bookInkRadius = (elapsed: number, delay: number) =>
  720 * (1 - Math.pow(1 - Math.max(0, Math.min(1, (elapsed - 520 - delay) / 1250)), 3));
