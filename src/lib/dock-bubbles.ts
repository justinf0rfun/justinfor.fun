// Original Bubble Navbar springs: https://bubblenavbar.yashb.xyz/
export const hoverBubbleSpring = { type: "spring", stiffness: 500, damping: 35 } as const;
export const activeBubbleSpring = { type: "spring", stiffness: 500, damping: 30 } as const;

type Rect = { left: number; top: number; width: number; height: number };

export function dockBubbleBounds(button: Rect, track: Rect, size: { width: number; height: number }) {
  const scaleX = track.width / size.width, scaleY = track.height / size.height;
  return {
    x: (button.left - track.left) / scaleX,
    y: (button.top - track.top) / scaleY,
    width: button.width / scaleX,
    height: button.height / scaleY,
  };
}
