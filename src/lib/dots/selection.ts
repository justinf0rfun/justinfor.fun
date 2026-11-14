import { spring } from "motion";

const REVEAL_YAW = -110 * Math.PI / 180;
const smooth = (start: number, end: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
};
const turn = (from = 0, to = -Math.PI, velocity = 0) => spring({
  keyframes: [from, to], velocity, stiffness: 330, damping: 43, mass: 1.5,
  restDelta: 0.001, restSpeed: 0.005,
});

// Original Dots selection spring: reveal the next model while its back faces us.
export function createSelection(name: string) {
  return { from: name, to: name, revealed: name, yaw: 0, scale: 1, startYaw: 0,
    startScale: 1, angularVelocity: 0, elapsed: 0, active: false, generator: turn() };
}

export function updateSelection(state: ReturnType<typeof createSelection>, name: string, delta: number, animate: boolean) {
  if (!animate) {
    state.from = state.to = state.revealed = name;
    state.yaw = state.angularVelocity = 0;
    state.scale = 1; state.active = false;
    return false;
  }
  const starting = !state.active && state.to !== name;
  if (state.to !== name) {
    if (state.active && state.from !== state.to && state.revealed === state.from && name !== state.from) state.to = name;
    else {
      state.from = state.revealed; state.to = name; state.startYaw = state.yaw;
      state.startScale = state.scale; state.elapsed = 0; state.active = true;
      state.generator = turn(state.yaw, state.from === name ? 0 : -Math.PI, state.angularVelocity);
    }
  }
  if (!state.active) return false;
  const dt = starting ? 0 : Math.max(0, Math.min(delta, 0.05));
  const previousYaw = state.yaw, wasRevealed = state.revealed !== state.from;
  state.elapsed += dt;
  const frame = state.generator.next(state.elapsed * 1000);
  const changing = state.from !== state.to;
  if (changing && frame.value <= REVEAL_YAW) state.revealed = state.to;
  const revealed = state.revealed !== state.from;
  state.yaw = frame.value + (revealed ? Math.PI : 0);
  if (dt > 0) state.angularVelocity = (state.yaw - previousYaw - (revealed && !wasRevealed ? Math.PI : 0)) / dt;
  if (!changing) state.scale = state.startScale + (1 - state.startScale) * smooth(0, 1, state.elapsed / 0.3);
  else if (revealed) {
    const progress = smooth(REVEAL_YAW, -Math.PI, frame.value);
    state.scale = progress < 0.6 ? 0.9 + 0.125 * smooth(0, 0.6, progress) : 1 + 0.025 * (1 - smooth(0.6, 1, progress));
  } else state.scale = state.startScale + (0.9 - state.startScale) * smooth(state.startYaw, REVEAL_YAW, frame.value);
  if (frame.done) {
    state.from = state.revealed = state.to; state.yaw = state.angularVelocity = 0;
    state.scale = 1; state.active = false;
  }
  return state.active;
}
