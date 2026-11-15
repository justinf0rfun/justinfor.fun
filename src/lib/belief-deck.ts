export interface PaperSize { width: number; height: number }
export interface PaperPose { x: number; y: number; scale: number; rotate: number; turn?: number }

export function drawSticker(order: number[], step = 1) {
  const offset = ((step % order.length) + order.length) % order.length;
  return [...order.slice(offset), ...order.slice(0, offset)];
}

export function stickerSwipe(x: number, y: number, milliseconds: number) {
  if (Math.abs(x) < 14 || Math.abs(x) < Math.abs(y) * 1.2) return 0;
  return Math.abs(x) >= 44 || Math.abs(x) / Math.max(1, milliseconds) >= 0.45 ? Math.sign(x) : 0;
}

export function stickerPose(depth: number, count: number, card: PaperSize, front: PaperSize, stageWidth: number, fan: boolean): PaperPose {
  if (fan) {
    const slot = depth - (count - 1) / 2;
    const spacing = Math.min(72, Math.max(0, (stageWidth - 276 * .68 - 32) / Math.max(1, count - 1)));
    return { x: slot * spacing, y: Math.abs(slot) * 9, scale: .68, rotate: slot * 8 };
  }
  const fit = Math.min(1, front.width / card.width, front.height / card.height);
  return { x: depth === 0 ? 0 : (depth % 2 ? -1 : 1) * (8 + depth * 3), y: depth * 4,
    scale: depth === 0 ? 1 : fit * (0.96 - depth * .025), rotate: depth === 0 ? -3 : (depth % 2 ? 1 : -1) * (3 + depth * 1.4) };
}

export const paperTransform = ({ x, y, scale, rotate, turn = 0 }: PaperPose) =>
  `perspective(700px) translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) rotateY(${turn}deg) scale(${scale})`;
