interface Rect { left: number; top: number; width: number; height: number }

export function momentsPlacement(viewport: { width: number; height: number }, mainLeft: number, dock: Rect) {
  if (mainLeft >= 336 && viewport.height >= 650) {
    const width = Math.min(340, mainLeft - 48);
    const top = Math.max(20, (viewport.height - 560) / 2);
    return { mode: "side" as const, left: (mainLeft - width) / 2, top, width, anchor: dock.top, maxHeight: viewport.height - top - 20 };
  }
  const width = Math.min(Math.max(dock.width, 320), viewport.width - 32);
  const left = Math.min(viewport.width - width - 16, Math.max(16, dock.left + (dock.width - width) / 2));
  return { mode: "sheet" as const, left, top: 16, width, anchor: dock.top + 1, maxHeight: Math.max(160, dock.top - 16) };
}

export function flightTransform(from: Rect, to: Rect) {
  return { x: from.left + from.width / 2 - to.left - to.width / 2,
    y: from.top + from.height / 2 - to.top - to.height / 2,
    scale: from.width / Math.max(1, to.width) };
}
