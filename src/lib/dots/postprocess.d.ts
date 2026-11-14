import type { Scene, Camera, WebGLRenderer } from "three";
export function createDotsPostprocess(renderer: WebGLRenderer, scene: Scene, camera: Camera): {
  render(grade?: boolean): void;
  dispose(): void;
};
