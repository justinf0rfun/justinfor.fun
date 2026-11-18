export interface BotOptions {
  shape?: unknown;
  color?: string;
  icon?: unknown;
  iconLook?: "tube" | "plain";
  iconGlow?: number;
  iconEdge?: number;
  material?: string;
  referenceColor?: boolean;
  expression?: string;
  zoom?: number;
  animate?: boolean;
  interactive?: boolean;
  intro?: boolean;
  shown?: boolean;
  poster?: false;
  renderer?: "webgl2";
  quality?: number;
  maxPixelRatio?: number;
}
export class CognitionBotView {
  constructor(canvas: HTMLCanvasElement, options: BotOptions);
  readonly drawn: boolean;
  readonly pending: boolean;
  readonly renderer: string | null;
  update(options: BotOptions): void;
  lookAt(target: [number, number] | null): void;
  wink(side?: "left" | "right"): void;
  renderNow(): void;
  dispose(): void;
}
export function getShape(id: string): { color: string };
export function loadWebGL2(): Promise<void>;
