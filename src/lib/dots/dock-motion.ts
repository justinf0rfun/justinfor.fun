import { EXPRESSION_DURATION, type PreparedCharacter } from "./character-core.js";

export type CharacterSurface = "dock" | "travel" | "stage";
export const DOCK_FLOAT_PIXELS = 1.25;

export function createDockMotion(response = 0) {
  return { elapsed: 0, lift: 0, pulse: null as number | null, response };
}

export function consumeDockHover(state: ReturnType<typeof createDockMotion>, response: number, surface: CharacterSurface, reduced: boolean) {
  if (response === state.response) return false;
  state.response = response;
  return surface === "dock" && !reduced;
}

export function pulseDockMotion(state: ReturnType<typeof createDockMotion>) {
  if (state.pulse === null) state.pulse = 0;
}

export function advanceDockMotion(state: ReturnType<typeof createDockMotion>, delta: number, surface: CharacterSurface, reduced: boolean, nativeLiftRatio: number | null, nativeAmplitudePixels: number) {
  const dt = Math.max(0, Math.min(delta, 0.05));
  state.elapsed += dt;
  if (reduced || surface === "stage") {
    state.lift = 0; state.pulse = null;
    return { liftPixels: 0, scale: 1 };
  }
  const target = surface !== "dock" ? 0 : nativeLiftRatio === null
    ? DOCK_FLOAT_PIXELS * Math.sin(state.elapsed * Math.PI / 3)
    : nativeLiftRatio * Math.max(0, DOCK_FLOAT_PIXELS - nativeAmplitudePixels);
  state.lift += (target - state.lift) * (1 - Math.exp(-18 * dt));
  if (target === 0 && Math.abs(state.lift) < 0.001) state.lift = 0;
  if (surface !== "dock") state.pulse = null;
  let scale = 1;
  if (state.pulse !== null) {
    state.pulse += dt;
    if (state.pulse >= 0.6) state.pulse = null;
    else scale += 0.06 * Math.sin(state.pulse / 0.6 * Math.PI) ** 2;
  }
  return { liftPixels: state.lift, scale };
}

interface DockCompanion {
  model: PreparedCharacter;
  elapsed: number;
  playExpression: boolean;
  dockResponse: boolean;
}

export function greetDockCompanion(item: DockCompanion, name: string) {
  if (item.model.motion) {
    const motion = item.model.motion.state;
    if (motion.name === "excite" && motion.playing) return false;
    item.model.motion.excite({ restart: true });
  } else if (name === "Todd") {
    if (item.playExpression && item.elapsed < EXPRESSION_DURATION.Todd) return false;
    item.elapsed = 0; item.playExpression = true;
  } else return false;
  item.dockResponse = true;
  return true;
}

export function leaveDockResponse(item: DockCompanion) {
  if (!item.dockResponse) return;
  item.model.motion?.ambient();
  if (!item.model.motion) item.playExpression = false;
  item.dockResponse = false;
}
