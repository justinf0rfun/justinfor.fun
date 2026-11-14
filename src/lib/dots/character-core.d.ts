import type { Object3D, Vector3 } from "three";

export interface CharacterMotion {
  values: Record<string, number>;
  motions: Record<string, { duration: number; sample(time: number): Record<string, number> }>;
  readonly state: { name: string; playing: boolean; blending: boolean };
  ambient(): void;
  excite(options?: { restart?: boolean }): void;
  stop(): void;
  setReducedMotion(value: boolean): void;
  sample(name: string, time: number, options?: { loop?: boolean }): void;
  update(delta: number, options?: { apply?: boolean }): void;
}
export interface PreparedCharacter {
  scene: Object3D;
  center: Vector3;
  size: Vector3;
  motion?: CharacterMotion;
  pose(expression?: Record<string, number>, x?: number, y?: number): void;
  poseHero(bend: number, tilt: number, offset: { x: number; y: number }): void;
  dispose(): void;
}
export function prepareCharacter(scene: Object3D, name: string): PreparedCharacter;
export const REST_POSE: Record<string, number>;
export function sampleExpression(name: string, elapsed: number): Record<string, number>;
export const EXPRESSION_DURATION: Record<string, number>;
