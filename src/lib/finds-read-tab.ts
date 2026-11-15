export function readTabOffset(distance: number) {
  const travel = Math.max(0, distance), extra = Math.max(0, travel - 32);
  return Math.min(travel, 32) + extra / (1 + extra / 32);
}

export function readTabShouldOpen(distance: number, moved: boolean, pulling: boolean) {
  return !moved || (pulling && distance >= 28);
}
