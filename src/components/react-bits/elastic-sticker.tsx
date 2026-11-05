"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import * as THREE from "three";
import { cn } from "../../lib/utils";

// React Bits Pro Elastic Sticker; keep the image visible until WebGL is ready.

export type ElasticStickerFinish = "gloss" | "matte" | "holo";

export interface ElasticStickerHandle {
  peel: () => void;
  reset: () => void;
  moveTo: (x: number, y: number) => void;
}

export interface ElasticStickerProps {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  radius?: number;
  border?: number;
  borderColor?: string;
  backColor?: string;
  sheenColor?: string;
  finish?: ElasticStickerFinish;
  sheen?: number;
  rotation?: number;
  lift?: number;
  tilt?: number;
  bend?: number;
  elasticity?: number;
  shadow?: number;
  hoverPeel?: number;
  idleHint?: boolean;
  draggable?: boolean;
  bounds?: "parent" | "none";
  snapBack?: boolean;
  raiseOnDrag?: boolean;
  autoplay?: boolean;
  autoplaySpeed?: number;
  idleDelay?: number;
  defaultPosition?: { x: number; y: number };
  onDragStart?: () => void;
  onDragEnd?: (position: { x: number; y: number }) => void;
  className?: string;
  style?: CSSProperties;
}

interface Settings {
  src: string;
  radius: number;
  border: number;
  borderColor: string;
  backColor: string;
  sheenColor: string;
  finish: ElasticStickerFinish;
  sheen: number;
  rotation: number;
  lift: number;
  tilt: number;
  bend: number;
  elasticity: number;
  shadow: number;
  hoverPeel: number;
  idleHint: boolean;
  draggable: boolean;
  bounds: "parent" | "none";
  snapBack: boolean;
  raiseOnDrag: boolean;
  autoplay: boolean;
  autoplaySpeed: number;
  idleDelay: number;
  defaultPosition: { x: number; y: number };
  reduced: boolean;
  onDragStart?: () => void;
  onDragEnd?: (position: { x: number; y: number }) => void;
}

interface Controller {
  sync: () => void;
  destroy: () => void;
  peel: () => void;
  reset: () => void;
  moveTo: (x: number, y: number) => void;
}

interface Hooks {
  onAspect: (aspect: number) => void;
  onReady: () => void;
  onFail: () => void;
}

type Vec = { x: number; y: number };

const DEFAULT_SRC =
  "https://pro.reactbits.dev/demo-media/abstract-rose-petal.webp";
const PROFILE = 256;
const NODES = 20;
const TAU = Math.PI * 2;
let layer = 10;

const subscribeToMotion = (notify: () => void) => {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

const readMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smooth = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

let colorContext: CanvasRenderingContext2D | null = null;

const parseColor = (value: string, fallback: [number, number, number]): [number, number, number] => {
  if (!colorContext) colorContext = document.createElement("canvas").getContext("2d");
  if (!colorContext) return fallback;
  colorContext.fillStyle = "#010203";
  colorContext.fillStyle = value;
  const read = String(colorContext.fillStyle);
  if (read === "#010203" && value.trim().toLowerCase() !== "#010203") return fallback;
  if (read.startsWith("#")) {
    const hex = read.slice(1);
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255,
    ];
  }
  const parts = read.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return fallback;
  return [Number(parts[0]) / 255, Number(parts[1]) / 255, Number(parts[2]) / 255];
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image"));
    image.src = src;
  });

const naturalSize = (image: HTMLImageElement) => ({
  width: image.naturalWidth || image.width || 1,
  height: image.naturalHeight || image.height || 1,
});

const hasTransparency = (image: HTMLImageElement) => {
  try {
    const probe = document.createElement("canvas");
    probe.width = 48;
    probe.height = 48;
    const context = probe.getContext("2d", { willReadFrequently: true });
    if (!context) return false;
    context.drawImage(image, 0, 0, 48, 48);
    const data = context.getImageData(0, 0, 48, 48).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] < 230) return true;
    return false;
  } catch {
    return false;
  }
};

const roundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
};

const blurInto = (
  target: HTMLCanvasElement,
  source: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
  sigma: number,
) => {
  const context = target.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  const offset = target.width + sigma * 6 + 200;
  context.clearRect(0, 0, target.width, target.height);
  context.save();
  context.shadowColor = "#000";
  context.shadowBlur = Math.max(0.01, sigma * 2);
  context.shadowOffsetX = offset;
  context.drawImage(source, x - offset, y, width, height);
  context.restore();
  return context.getImageData(0, 0, target.width, target.height).data;
};

const drawArt = (
  image: HTMLImageElement | null,
  cutout: boolean,
  width: number,
  height: number,
  scale: number,
  settings: Settings,
) => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.round(width * scale));
  canvas.height = Math.max(2, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) return canvas;
  const edge = clamp(settings.border, 0, Math.min(width, height) / 4);
  if (!cutout || !image) {
    context.scale(scale, scale);
    roundedRect(context, 0, 0, width, height, settings.radius);
    context.fillStyle = settings.borderColor;
    context.fill();
    context.save();
    roundedRect(context, edge, edge, width - edge * 2, height - edge * 2, Math.max(0, settings.radius - edge));
    context.clip();
    const innerWidth = width - edge * 2;
    const innerHeight = height - edge * 2;
    if (image) {
      const size = naturalSize(image);
      const cover = Math.max(innerWidth / size.width, innerHeight / size.height);
      const drawWidth = size.width * cover;
      const drawHeight = size.height * cover;
      context.drawImage(image, edge + (innerWidth - drawWidth) / 2, edge + (innerHeight - drawHeight) / 2, drawWidth, drawHeight);
    } else {
      const gradient = context.createLinearGradient(edge, edge, width - edge, height - edge);
      gradient.addColorStop(0, "#5227FF");
      gradient.addColorStop(1, "#FF9FFC");
      context.fillStyle = gradient;
      context.fillRect(edge, edge, innerWidth, innerHeight);
    }
    context.restore();
    return canvas;
  }
  const size = naturalSize(image);
  const fit = Math.min((width - edge * 2) / size.width, (height - edge * 2) / size.height);
  const drawWidth = size.width * fit * scale;
  const drawHeight = size.height * fit * scale;
  const drawX = (canvas.width - drawWidth) / 2;
  const drawY = (canvas.height - drawHeight) / 2;
  if (edge > 0) {
    const silhouette = document.createElement("canvas");
    silhouette.width = canvas.width;
    silhouette.height = canvas.height;
    const silhouetteContext = silhouette.getContext("2d", { willReadFrequently: true });
    const blurred = document.createElement("canvas");
    blurred.width = canvas.width;
    blurred.height = canvas.height;
    if (silhouetteContext) {
      silhouetteContext.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      silhouetteContext.globalCompositeOperation = "source-in";
      silhouetteContext.fillStyle = "#000";
      silhouetteContext.fillRect(0, 0, silhouette.width, silhouette.height);
      const sharp = silhouetteContext.getImageData(0, 0, silhouette.width, silhouette.height).data;
      const soft = blurInto(blurred, silhouette, 0, 0, silhouette.width, silhouette.height, (edge * scale) / 1.5);
      if (soft) {
        const [r, g, b] = parseColor(settings.borderColor, [1, 1, 1]);
        const outline = context.createImageData(canvas.width, canvas.height);
        const out = outline.data;
        for (let i = 0; i < out.length; i += 4) {
          const spread = smooth(0.05, 0.085, soft[i + 3] / 255);
          const alpha = Math.max(spread, sharp[i + 3] / 255);
          out[i] = r * 255;
          out[i + 1] = g * 255;
          out[i + 2] = b * 255;
          out[i + 3] = alpha * 255;
        }
        const layerCanvas = document.createElement("canvas");
        layerCanvas.width = canvas.width;
        layerCanvas.height = canvas.height;
        layerCanvas.getContext("2d")?.putImageData(outline, 0, 0);
        context.drawImage(layerCanvas, 0, 0);
      }
    }
  }
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  return canvas;
};

const drawShadowMap = (art: HTMLCanvasElement, width: number, height: number, margin: number, spread: [number, number, number]) => {
  const scale = 0.5;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.ceil((width + margin * 2) * scale));
  canvas.height = Math.max(2, Math.ceil((height + margin * 2) * scale));
  const scratch = document.createElement("canvas");
  scratch.width = canvas.width;
  scratch.height = canvas.height;
  const layers = spread.map((sigma) =>
    blurInto(scratch, art, margin * scale, margin * scale, width * scale, height * scale, sigma * scale),
  );
  const context = canvas.getContext("2d");
  if (!context) return canvas;
  const image = context.createImageData(canvas.width, canvas.height);
  const out = image.data;
  for (let i = 0; i < out.length; i += 4) {
    out[i] = layers[0]?.[i + 3] ?? 0;
    out[i + 1] = layers[1]?.[i + 3] ?? 0;
    out[i + 2] = layers[2]?.[i + 3] ?? 0;
    out[i + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return canvas;
};

const buildGrid = (x0: number, y0: number, x1: number, y1: number, cell: number) => {
  const columns = clamp(Math.ceil((x1 - x0) / cell), 2, 180);
  const rows = clamp(Math.ceil((y1 - y0) / cell), 2, 180);
  const positions = new Float32Array((columns + 1) * (rows + 1) * 3);
  let p = 0;
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= columns; i++) {
      positions[p++] = x0 + ((x1 - x0) * i) / columns;
      positions[p++] = y0 + ((y1 - y0) * j) / rows;
      positions[p++] = 0;
    }
  }
  const indices: number[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < columns; i++) {
      const a = j * (columns + 1) + i;
      const b = a + 1;
      const c = a + columns + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  return geometry;
};

const BEND = `
uniform vec2 uSize;
uniform vec2 uGrab;
uniform vec2 uDir;
uniform sampler2D uProfile;
uniform vec2 uProfileRange;
uniform vec4 uCorners[4];
uniform vec2 uShift;
uniform float uRoll;
uniform float uGrabHeight;

vec3 bendSheet(vec2 point, out vec3 normal) {
  vec2 q = clamp(point, vec2(0.0), uSize);
  vec2 outside = point - q;
  vec3 p = vec3(q, 0.0);
  vec3 n = vec3(0.0, 0.0, 1.0);
  for (int c = 0; c < 4; c++) {
    vec4 k = uCorners[c];
    if (k.x < 0.0005) continue;
    bool right = c == 1 || c == 2;
    bool bottom = c >= 2;
    vec2 corner = vec2(right ? uSize.x : 0.0, bottom ? uSize.y : 0.0);
    vec2 inward = vec2(right ? -0.70710678 : 0.70710678, bottom ? -0.70710678 : 0.70710678);
    float depth = k.y - dot(q - corner, inward);
    if (depth <= 0.0) continue;
    float angle = min(depth / k.z, k.x);
    float rest = max(depth - k.z * k.x, 0.0);
    float along = k.z * sin(angle) + rest * cos(k.x);
    float rise = k.z * (1.0 - cos(angle)) + rest * sin(k.x);
    p.xy += inward * (depth - along);
    p.z += rise;
    n = vec3(inward * sin(angle), cos(angle));
  }
  p.xy += outside;
  vec2 side = vec2(-uDir.y, uDir.x);
  vec2 rel = p.xy - uGrab;
  float s = dot(rel, uDir);
  float f = (s - uProfileRange.x) / uProfileRange.y;
  float fc = clamp(f, 0.0, 254.999);
  int i = int(fc);
  vec4 a = texelFetch(uProfile, ivec2(i, 0), 0);
  vec4 b = texelFetch(uProfile, ivec2(i + 1, 0), 0);
  vec3 pr = mix(a.xyz, b.xyz, fc - float(i));
  float over = (f - fc) * uProfileRange.y;
  pr.x += over * cos(pr.z);
  pr.y -= over * sin(pr.z);
  float ct = cos(pr.z);
  float st = sin(pr.z);
  float nd = dot(n.xy, uDir);
  float ns = dot(n.xy, side);
  float nz = n.z * ct - nd * st;
  float cr = cos(uRoll);
  float sr = sin(uRoll);
  normal = vec3(uDir * (nd * ct + n.z * st) + side * (ns * cr - nz * sr), ns * sr + nz * cr);
  float across = dot(rel, side);
  float up = pr.y + p.z * ct - uGrabHeight;
  return vec3(uGrab + uDir * (pr.x + p.z * st) + side * (across * cr - up * sr), across * sr + up * cr + uGrabHeight);
}
`;

const SHEET_VERTEX = `
${BEND}
uniform float uCamera;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
varying float vHeight;

void main() {
  vec3 n;
  vec3 p = bendSheet(position.xy, n);
  vec3 world = vec3(p.x - uSize.x * 0.5 + uShift.x, uSize.y * 0.5 - p.y + uShift.y, p.z);
  vUv = vec2(position.x / uSize.x, 1.0 - position.y / uSize.y);
  vNormal = vec3(n.x, -n.y, n.z);
  vView = vec3(0.0, 0.0, uCamera) - world;
  vHeight = p.z;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`;

const SHEET_FRAGMENT = `
uniform sampler2D uArt;
uniform vec3 uBack;
uniform vec3 uSheenColor;
uniform float uSheen;
uniform float uFinish;
uniform vec3 uLight;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
varying float vHeight;

void main() {
  vec4 art = texture2D(uArt, vUv);
  if (art.a < 0.004) discard;
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vView);
  vec3 base = art.rgb;
  bool front = gl_FrontFacing;
  if (!front) {
    n = -n;
    base = uBack * art.a;
  }
  float relief = dot(n, uLight) - uLight.z;
  vec3 color = base * clamp(1.0 + relief * 0.22, 0.8, 1.12);
  vec3 r = reflect(-v, n);
  vec3 still = reflect(-v, vec3(0.0, 0.0, 1.0));
  vec2 swing = r.xy - still.xy;
  float amount = length(swing);
  float toward = dot(swing / max(amount, 1e-4), normalize(uLight.xy));
  float softbox = smoothstep(0.02, 0.7, amount) * (0.25 + 0.75 * smoothstep(-0.4, 0.9, toward));
  float facing = max(dot(r, uLight), 0.0);
  float glint = pow(facing, 90.0);
  float gloss = softbox * 0.3 + glint * 0.45;
  float satin = softbox * 0.1;
  float spec = front ? (uFinish > 0.5 && uFinish < 1.5 ? satin : gloss) : satin;
  if (front && uFinish > 1.5) {
    float phase = dot(r.xy, vec2(1.3, 0.8)) * 1.6 + vUv.x * 0.8 - vUv.y * 0.5;
    vec3 spectrum = 0.55 + 0.45 * cos(6.2831853 * (phase + vec3(0.0, 0.33, 0.67)));
    float mixAmount = uSheen * clamp(0.14 + smoothstep(0.0, 0.5, amount) * 0.6 + glint, 0.0, 0.8);
    color += (spectrum * art.a - color) * mixAmount * 0.5;
  }
  color += uSheenColor * spec * uSheen * art.a;
  gl_FragColor = vec4(color, art.a);
}
`;

const SHADOW_VERTEX = `
${BEND}
uniform vec2 uShadowShift;
uniform float uMargin;
uniform float uContact;
varying vec2 vShadowUv;
varying float vHeight;

void main() {
  vec3 n;
  vec3 p = bendSheet(position.xy, n);
  vec3 world = vec3(p.x - uSize.x * 0.5 + uShift.x, uSize.y * 0.5 - p.y + uShift.y, 0.0);
  world.xy += uShadowShift * (max(p.z, 0.0) + uContact);
  vShadowUv = vec2((position.x + uMargin) / (uSize.x + uMargin * 2.0), 1.0 - (position.y + uMargin) / (uSize.y + uMargin * 2.0));
  vHeight = p.z;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`;

const SHADOW_FRAGMENT = `
uniform sampler2D uShadowMap;
uniform float uShadow;
uniform float uLiftRef;
varying vec2 vShadowUv;
varying float vHeight;

void main() {
  vec2 edge = min(vShadowUv, 1.0 - vShadowUv);
  float window = smoothstep(0.0, 0.08, min(edge.x, edge.y));
  vec3 m = texture2D(uShadowMap, vShadowUv).rgb * window;
  float h = max(vHeight, 0.0) / uLiftRef;
  float soft = mix(m.g, m.b, smoothstep(0.1, 0.9, h));
  float rest = m.r * 0.3;
  float lifted = soft * 0.36 / (1.0 + 0.8 * h);
  float a = mix(rest, lifted, smoothstep(0.0, 0.12, h)) * uShadow;
  gl_FragColor = vec4(0.0, 0.0, 0.0, a);
}
`;

const createSticker = (
  root: HTMLDivElement,
  settingsRef: { current: Settings },
  hooks: Hooks,
): Controller | null => {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.position = "absolute";
  canvas.style.pointerEvents = "none";
  canvas.style.display = "block";
  canvas.style.opacity = "0";
  root.appendChild(canvas);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true });
  } catch {
    canvas.remove();
    return null;
  }
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 4000);
  const profileData = new Float32Array(PROFILE * 4);
  const profile = new THREE.DataTexture(profileData, PROFILE, 1, THREE.RGBAFormat, THREE.FloatType);
  profile.minFilter = THREE.NearestFilter;
  profile.magFilter = THREE.NearestFilter;
  profile.needsUpdate = true;

  const corners = [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 1, 0));
  const shared = {
    uSize: { value: new THREE.Vector2(1, 1) },
    uGrab: { value: new THREE.Vector2(0.5, 0.5) },
    uDir: { value: new THREE.Vector2(0, 1) },
    uProfile: { value: profile },
    uProfileRange: { value: new THREE.Vector2(-1, 2 / (PROFILE - 1)) },
    uCorners: { value: corners },
    uShift: { value: new THREE.Vector2(0, 0) },
    uRoll: { value: 0 },
    uGrabHeight: { value: 0 },
  };
  const sheetMaterial = new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
      uCamera: { value: 1000 },
      uArt: { value: null as THREE.Texture | null },
      uBack: { value: new THREE.Vector3(0.93, 0.92, 0.95) },
      uSheenColor: { value: new THREE.Vector3(1, 1, 1) },
      uSheen: { value: 0.6 },
      uFinish: { value: 0 },
      uLight: { value: new THREE.Vector3(-0.3, 0.5, 0.8) },
    },
    vertexShader: SHEET_VERTEX,
    fragmentShader: SHEET_FRAGMENT,
    side: THREE.DoubleSide,
    transparent: true,
    premultipliedAlpha: true,
    depthTest: true,
    depthWrite: true,
  });
  const shadowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
      uShadowMap: { value: null as THREE.Texture | null },
      uShadowShift: { value: new THREE.Vector2(0.1, -0.4) },
      uMargin: { value: 40 },
      uContact: { value: 1.5 },
      uShadow: { value: 0.5 },
      uLiftRef: { value: 48 },
    },
    vertexShader: SHADOW_VERTEX,
    fragmentShader: SHADOW_FRAGMENT,
    side: THREE.DoubleSide,
    transparent: true,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
  });
  const sheet = new THREE.Mesh(new THREE.BufferGeometry(), sheetMaterial);
  const shade = new THREE.Mesh(new THREE.BufferGeometry(), shadowMaterial);
  sheet.frustumCulled = false;
  shade.frustumCulled = false;
  shade.renderOrder = 0;
  sheet.renderOrder = 1;
  scene.add(shade, sheet);

  let destroyed = false;
  let raf = 0;
  let last = 0;
  let ready = false;
  let visible = true;
  let width = 0;
  let height = 0;
  let span = 1;
  let margin = 0;
  let shadowMargin = 0;
  let cameraDistance = 1000;
  let artKey = "";
  let loadedSrc = "";
  let failedSrc = "";
  let image: HTMLImageElement | null = null;
  let cutout = false;
  let artTexture: THREE.Texture | null = null;
  let shadowTexture: THREE.Texture | null = null;
  let flat = false;

  const offset = { x: settingsRef.current.defaultPosition.x, y: settingsRef.current.defaultPosition.y };
  const offsetVelocity = { x: 0, y: 0 };
  let offsetTarget: Vec | null = null;
  const pagePrevious = { x: offset.x, y: offset.y };
  const pageVelocity = { x: 0, y: 0 };
  const grab = { x: 0, y: 0 };
  const dir = { x: 0, y: 1 };
  const lean = { x: 0, y: 0 };
  const leanVelocity = { x: 0, y: 0 };
  let liftValue = 0;
  let liftVelocity = 0;
  let flex = 0;
  let flexVelocity = 0;
  let roll = 0;
  let grabHeight = 0;
  let stick = 0;
  const chains = [0, 1].map(() => ({
    angle: new Float64Array(NODES),
    speed: new Float64Array(NODES),
    target: new Float64Array(NODES),
    length: 1,
  }));
  let hopUntil = 0;
  const cornerAmount = [0, 0, 0, 0];
  const cornerVelocity = [0, 0, 0, 0];
  let hover: Vec | null = null;
  let hint = { corner: 0, until: 0, next: performance.now() + 700 };
  let interactedAt = -1e9;

  let drag: {
    id: number;
    startX: number;
    startY: number;
    origin: Vec;
    min: Vec;
    max: Vec;
  } | null = null;

  const auto = {
    phase: "idle" as "idle" | "drag",
    time: 0,
    next: performance.now() + 1400,
    route: 0,
    origin: { x: 0, y: 0 },
  };

  const applyOffset = () => {
    root.style.translate = `${offset.x.toFixed(2)}px ${offset.y.toFixed(2)}px`;
  };
  applyOffset();

  const toLocal = (clientX: number, clientY: number): Vec => {
    const rect = root.getBoundingClientRect();
    const angle = (-settingsRef.current.rotation * Math.PI) / 180;
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return { x: dx * c - dy * s + width / 2, y: dx * s + dy * c + height / 2 };
  };

  const toLocalVector = (x: number, y: number): Vec => {
    const angle = (-settingsRef.current.rotation * Math.PI) / 180;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return { x: x * c - y * s, y: x * s + y * c };
  };

  const measureBounds = () => {
    const settings = settingsRef.current;
    const parent = root.parentElement;
    if (settings.bounds === "none" || !parent) {
      return { min: { x: -1e6, y: -1e6 }, max: { x: 1e6, y: 1e6 } };
    }
    const area = parent.getBoundingClientRect();
    const rect = root.getBoundingClientRect();
    const range = (low: number, high: number) => (low <= high ? [low, high] : [(low + high) / 2, (low + high) / 2]);
    const [minX, maxX] = range(offset.x + area.left - rect.left, offset.x + area.right - rect.right);
    const [minY, maxY] = range(offset.y + area.top - rect.top, offset.y + area.bottom - rect.bottom);
    return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
  };

  const rubber = (value: number, min: number, max: number) => {
    if (value < min) return min - (min - value) * 0.3 / (1 + (min - value) / 400);
    if (value > max) return max + (value - max) * 0.3 / (1 + (value - max) / 400);
    return value;
  };

  const layout = () => {
    const settings = settingsRef.current;
    span = Math.max(width, height);
    shadowMargin = Math.ceil(3.4 * (0.07 * span + 6));
    margin = Math.ceil(0.28 * span + settings.lift * 1.1 + shadowMargin * 0.6 + 24);
    cameraDistance = Math.max(620, span * 2.4);
    const canvasWidth = width + margin * 2;
    const canvasHeight = height + margin * 2;
    const ratio = Math.min(window.devicePixelRatio || 1, 2, 2400 / Math.max(canvasWidth, canvasHeight));
    renderer.setPixelRatio(ratio);
    renderer.setSize(canvasWidth, canvasHeight, false);
    canvas.style.left = `${-margin}px`;
    canvas.style.top = `${-margin}px`;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    camera.aspect = canvasWidth / canvasHeight;
    camera.fov = (2 * Math.atan(canvasHeight / 2 / cameraDistance) * 180) / Math.PI;
    camera.near = cameraDistance * 0.05;
    camera.far = cameraDistance * 4;
    camera.position.set(0, 0, cameraDistance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    sheetMaterial.uniforms.uCamera.value = cameraDistance;
    sheet.geometry.dispose();
    shade.geometry.dispose();
    sheet.geometry = buildGrid(0, 0, width, height, Math.max(2.5, span / 110));
    shade.geometry = buildGrid(-shadowMargin, -shadowMargin, width + shadowMargin, height + shadowMargin, Math.max(6, span / 40));
    shared.uSize.value.set(width, height);
    shadowMaterial.uniforms.uMargin.value = shadowMargin;
    return Math.min(window.devicePixelRatio || 1, 2) * 1.25;
  };

  const rebuild = () => {
    if (destroyed) return;
    const settings = settingsRef.current;
    const nextWidth = root.offsetWidth;
    const nextHeight = root.offsetHeight;
    if (nextWidth < 4 || nextHeight < 4) return;
    if (settings.src !== loadedSrc && settings.src !== failedSrc) {
      loadedSrc = settings.src;
      const requested = settings.src;
      loadImage(requested)
        .then((loaded) => {
          if (destroyed || settingsRef.current.src !== requested) return;
          image = loaded;
          cutout = hasTransparency(loaded);
          const size = naturalSize(loaded);
          hooks.onAspect(size.width / size.height);
          artKey = "";
          rebuild();
        })
        .catch(() => {
          if (destroyed || settingsRef.current.src !== requested) return;
          failedSrc = requested;
          hooks.onFail();
        });
      if (!image) return;
    }
    if (!image || settings.src === failedSrc) return;
    const key = [nextWidth, nextHeight, settings.src, settings.radius, settings.border, settings.borderColor, settings.lift, image ? 1 : 0].join("|");
    if (key === artKey) return;
    artKey = key;
    width = nextWidth;
    height = nextHeight;
    const scale = layout();
    const art = drawArt(image, cutout, width, height, scale, settings);
    try {
      art.getContext("2d")?.getImageData(0, 0, 1, 1);
    } catch {
      ready = false;
      hooks.onFail();
      return;
    }
    const shadowMap = drawShadowMap(art, width, height, shadowMargin, [1.4, 0.03 * span + 3, 0.07 * span + 6]);
    artTexture?.dispose();
    shadowTexture?.dispose();
    artTexture = new THREE.CanvasTexture(art);
    artTexture.colorSpace = THREE.NoColorSpace;
    artTexture.premultiplyAlpha = true;
    artTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    artTexture.minFilter = THREE.LinearMipmapLinearFilter;
    artTexture.generateMipmaps = true;
    shadowTexture = new THREE.CanvasTexture(shadowMap);
    shadowTexture.colorSpace = THREE.NoColorSpace;
    shadowTexture.generateMipmaps = false;
    shadowTexture.minFilter = THREE.LinearFilter;
    sheetMaterial.uniforms.uArt.value = artTexture;
    shadowMaterial.uniforms.uShadowMap.value = shadowTexture;
    ready = true;
    flat = false;
    render();
    canvas.style.opacity = "1";
    hooks.onReady();
    wake();
  };

  const cornerPoint = (index: number): Vec => ({
    x: index === 1 || index === 2 ? width : 0,
    y: index >= 2 ? height : 0,
  });

  const measureChains = () => {
    const across = { x: -dir.y, y: dir.x };
    let far = 1;
    let near = 1;
    let wide = 1;
    for (let index = 0; index < 4; index++) {
      const point = cornerPoint(index);
      const along = (point.x - grab.x) * dir.x + (point.y - grab.y) * dir.y;
      far = Math.max(far, along);
      near = Math.max(near, -along);
      wide = Math.max(wide, Math.abs((point.x - grab.x) * across.x + (point.y - grab.y) * across.y));
    }
    chains[0].length = far;
    chains[1].length = near;
    return wide;
  };

  const chooseGrip = (point: Vec) => {
    if (liftValue > 0.05) return;
    grab.x = clamp(point.x, 0, width);
    grab.y = clamp(point.y, 0, height);
    const lx = width / 2 - grab.x;
    const ly = height / 2 - grab.y;
    const size = Math.hypot(lx, ly);
    if (size > span * 0.08) {
      dir.x = lx / size;
      dir.y = ly / size;
    } else if (width >= height) {
      dir.x = 1;
      dir.y = 0;
    } else {
      dir.x = 0;
      dir.y = 1;
    }
    measureChains();
    for (const chain of chains) {
      chain.angle.fill(0);
      chain.speed.fill(0);
    }
  };

  const chainAngle = (chain: (typeof chains)[number], distance: number) => {
    const t = clamp(distance / chain.length, 0, 1) * (NODES - 1);
    const j = Math.min(NODES - 2, Math.floor(t));
    return chain.angle[j] + (chain.angle[j + 1] - chain.angle[j]) * (t - j);
  };

  const writeProfile = (height0: number, radius: number) => {
    const sValues = [
      { x: -shadowMargin, y: -shadowMargin },
      { x: width + shadowMargin, y: -shadowMargin },
      { x: width + shadowMargin, y: height + shadowMargin },
      { x: -shadowMargin, y: height + shadowMargin },
    ].map((point) => (point.x - grab.x) * dir.x + (point.y - grab.y) * dir.y);
    const sMin = Math.min(...sValues);
    const sMax = Math.max(...sValues);
    const step = (sMax - sMin) / (PROFILE - 1);
    shared.uProfileRange.value.set(sMin, step);
    const zero = -sMin / step;
    for (const sign of [1, -1]) {
      const chain = chains[sign > 0 ? 0 : 1];
      let phi = chain.angle[0];
      let x = 0;
      let z = height0;
      let sigma = 0;
      let contact = false;
      const first = sign > 0 ? Math.ceil(zero) : Math.floor(zero);
      for (let k = first; sign > 0 ? k < PROFILE : k >= 0; k += sign) {
        const target = Math.abs(sMin + k * step);
        const h = Math.max(0, target - sigma);
        let mid = phi;
        if (!contact) {
          const next = clamp(chainAngle(chain, target), -1.45, 1.45);
          const drop = z - h * Math.sin((phi + next) / 2);
          if (next > 0 && drop <= radius * (1 - Math.cos(next))) {
            contact = true;
          } else {
            mid = (phi + next) / 2;
            phi = next;
          }
        }
        if (contact) {
          const next = Math.max(0, phi - h / radius);
          mid = (phi + next) / 2;
          phi = next;
        }
        x += h * Math.cos(mid);
        z -= h * Math.sin(mid);
        if (contact && phi === 0) z = Math.max(0, z - h * 0.4);
        if (z < 0) z = 0;
        sigma = target;
        const index = k * 4;
        profileData[index] = sign * x;
        profileData[index + 1] = z;
        profileData[index + 2] = sign * phi;
        profileData[index + 3] = 0;
      }
    }
    profile.needsUpdate = true;
  };

  const writeFlat = () => {
    const start = -span * 4;
    const step = (span * 8) / (PROFILE - 1);
    profileData.fill(0);
    for (let k = 0; k < PROFILE; k++) profileData[k * 4] = start + k * step;
    shared.uProfileRange.value.set(start, step);
    profile.needsUpdate = true;
  };

  const render = () => {
    if (!ready) return;
    const settings = settingsRef.current;
    const minSide = Math.min(width, height);
    const radius = 0.08 * minSide + 4;
    const bent = chains.some((chain) => chain.angle.some((value) => Math.abs(value) > 1e-4));
    if (grabHeight > 0.05 || bent) {
      writeProfile(grabHeight, radius);
      flat = false;
    } else if (!flat) {
      writeFlat();
      flat = true;
    }
    shared.uDir.value.set(dir.x, dir.y);
    shared.uGrab.value.set(grab.x, grab.y);
    shared.uRoll.value = roll;
    shared.uGrabHeight.value = grabHeight;
    const pin = grabHeight / cameraDistance;
    shared.uShift.value.set(-(grab.x - width / 2) * pin, (grab.y - height / 2) * pin);
    const peel = clamp(settings.hoverPeel, 0, 1);
    for (let index = 0; index < 4; index++) {
      const amount = settings.reduced ? 0 : cornerAmount[index];
      corners[index].set(
        Math.max(0, amount) * (0.6 + 2.2 * peel),
        (0.08 + 0.14 * Math.max(0, amount)) * minSide,
        0.045 * minSide + 3,
        0,
      );
    }
    const angle = (settings.rotation * Math.PI) / 180;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const light = { x: -0.42, y: -0.62 };
    const lightLocal = { x: light.x * c + light.y * s, y: -light.x * s + light.y * c };
    const lightVector = new THREE.Vector3(lightLocal.x, -lightLocal.y, 1).normalize();
    sheetMaterial.uniforms.uLight.value.copy(lightVector);
    const cast = { x: 0.1, y: 0.42 };
    const castLocal = { x: cast.x * c + cast.y * s, y: -cast.x * s + cast.y * c };
    shadowMaterial.uniforms.uShadowShift.value.set(castLocal.x, -castLocal.y);
    shadowMaterial.uniforms.uShadow.value = clamp(settings.shadow, 0, 1) * 2;
    shadowMaterial.uniforms.uLiftRef.value = Math.max(8, settings.lift);
    sheetMaterial.uniforms.uSheen.value = clamp(settings.sheen, 0, 1);
    sheetMaterial.uniforms.uFinish.value = settings.finish === "matte" ? 1 : settings.finish === "holo" ? 2 : 0;
    const back = parseColor(settings.backColor, [0.93, 0.92, 0.95]);
    sheetMaterial.uniforms.uBack.value.set(back[0], back[1], back[2]);
    const sheenColor = parseColor(settings.sheenColor, [1, 1, 1]);
    sheetMaterial.uniforms.uSheenColor.value.set(sheenColor[0], sheenColor[1], sheenColor[2]);
    renderer.render(scene, camera);
  };

  const springStep = (value: number, velocity: number, target: number, omega: number, zeta: number, h: number) => {
    const accel = omega * omega * (target - value) - 2 * zeta * omega * velocity;
    const nextVelocity = velocity + accel * h;
    return [value + nextVelocity * h, nextVelocity];
  };

  const release = (cancelled: boolean) => {
    const current = drag;
    if (!current) return;
    drag = null;
    root.style.cursor = "";
    if (root.hasPointerCapture(current.id)) {
      try {
        root.releasePointerCapture(current.id);
      } catch {}
    }
    const settings = settingsRef.current;
    let target: Vec;
    if (cancelled) {
      target = { ...current.origin };
    } else if (settings.snapBack) {
      target = { x: 0, y: 0 };
    } else {
      const glide = Math.min(1, 60 / Math.max(1, Math.hypot(pageVelocity.x, pageVelocity.y) * 0.08));
      target = {
        x: clamp(offset.x + pageVelocity.x * 0.08 * glide, current.min.x, current.max.x),
        y: clamp(offset.y + pageVelocity.y * 0.08 * glide, current.min.y, current.max.y),
      };
    }
    offsetTarget = target;
    offsetVelocity.x = settings.reduced ? 0 : pageVelocity.x;
    offsetVelocity.y = settings.reduced ? 0 : pageVelocity.y;
    interactedAt = performance.now();
    settings.onDragEnd?.({ x: Math.round(target.x), y: Math.round(target.y) });
    wake();
  };

  const startDrag = (id: number, clientX: number, clientY: number, point: Vec) => {
    const settings = settingsRef.current;
    const bounds = measureBounds();
    drag = { id, startX: clientX, startY: clientY, origin: { ...offset }, min: bounds.min, max: bounds.max };
    const grounded = liftValue < 0.05;
    chooseGrip(point);
    stick = grounded && !settings.reduced ? 1 : 0;
    offsetTarget = null;
    offsetVelocity.x = 0;
    offsetVelocity.y = 0;
    if (settings.raiseOnDrag) root.style.zIndex = String(++layer);
    root.style.cursor = "grabbing";
    if (!settings.reduced) flexVelocity += 2.2 * settings.bend;
    settings.onDragStart?.();
    wake();
  };

  const stopAutoplay = () => {
    if (auto.phase === "drag") {
      auto.phase = "idle";
      if (drag && drag.id === -1) release(false);
      offsetTarget = { ...auto.origin };
    }
  };

  const autoplayStep = (now: number, dt: number) => {
    const settings = settingsRef.current;
    const allowed = settings.autoplay && !settings.reduced && ready && visible && !hover;
    if (!allowed) {
      if (auto.phase === "drag") stopAutoplay();
      auto.next = Math.max(auto.next, now + settings.idleDelay * 1000);
      return;
    }
    if (drag && drag.id !== -1) return;
    const idleFor = now - interactedAt;
    if (auto.phase === "idle") {
      if (now < auto.next || idleFor < settings.idleDelay * 1000) return;
      auto.phase = "drag";
      auto.time = 0;
      auto.origin = { ...offset };
      const grips = [
        { x: 0.74, y: 0.3 },
        { x: 0.28, y: 0.7 },
        { x: 0.66, y: 0.74 },
        { x: 0.32, y: 0.28 },
      ];
      const grip = grips[auto.route % grips.length];
      startDrag(-1, 0, 0, { x: grip.x * width, y: grip.y * height });
      if (drag) {
        drag.min = { x: -1e6, y: -1e6 };
        drag.max = { x: 1e6, y: 1e6 };
      }
      return;
    }
    const duration = 2.8;
    auto.time += dt * Math.max(0.1, settings.autoplaySpeed);
    const u = smoother(clamp(auto.time / duration, 0, 1));
    const amplitude = Math.min(0.24 * span, 90);
    const route = auto.route % 2;
    const phase = TAU * u;
    const path =
      route === 0
        ? { x: amplitude * Math.sin(phase), y: -amplitude * 0.45 * (1 - Math.cos(phase)) }
        : { x: -amplitude * 0.9 * Math.sin(phase), y: amplitude * 0.38 * Math.sin(phase * 2) };
    offset.x = auto.origin.x + path.x;
    offset.y = auto.origin.y + path.y;
    applyOffset();
    if (auto.time >= duration) {
      auto.phase = "idle";
      auto.route += 1;
      auto.next = now + 2200 / Math.max(0.1, settings.autoplaySpeed);
      offset.x = auto.origin.x;
      offset.y = auto.origin.y;
      release(false);
      offsetTarget = { ...auto.origin };
      interactedAt = -1e9;
    }
  };

  const step = (now: number, dt: number) => {
    const settings = settingsRef.current;
    const reduced = settings.reduced;
    autoplayStep(now, dt);
    if (!drag && offsetTarget) {
      let x = offset.x;
      let y = offset.y;
      let vx = offsetVelocity.x;
      let vy = offsetVelocity.y;
      const count = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / count;
      for (let i = 0; i < count; i++) {
        [x, vx] = springStep(x, vx, offsetTarget.x, reduced ? 40 : 13, 1, h);
        [y, vy] = springStep(y, vy, offsetTarget.y, reduced ? 40 : 13, 1, h);
      }
      offset.x = x;
      offset.y = y;
      offsetVelocity.x = vx;
      offsetVelocity.y = vy;
      if (Math.abs(offsetTarget.x - x) < 0.05 && Math.abs(offsetTarget.y - y) < 0.05 && Math.hypot(vx, vy) < 1) {
        offset.x = offsetTarget.x;
        offset.y = offsetTarget.y;
        offsetTarget = null;
        offsetVelocity.x = 0;
        offsetVelocity.y = 0;
      }
      applyOffset();
    }
    if (dt > 0) {
      const blend = 1 - Math.exp(-dt / 0.05);
      pageVelocity.x += ((offset.x - pagePrevious.x) / dt - pageVelocity.x) * blend;
      pageVelocity.y += ((offset.y - pagePrevious.y) / dt - pageVelocity.y) * blend;
    }
    const moved = Math.hypot(offset.x - pagePrevious.x, offset.y - pagePrevious.y);
    pagePrevious.x = offset.x;
    pagePrevious.y = offset.y;
    const holding = !!drag || now < hopUntil;
    const liftTarget = drag ? 1 : now < hopUntil ? 0.55 : 0;
    const elastic = clamp(settings.elasticity, 0, 1);
    const tiltMax = reduced ? 0 : (clamp(settings.tilt, 0, 60) * Math.PI) / 180;
    const velocity = toLocalVector(pageVelocity.x, pageVelocity.y);
    const liftWeight = smooth(0, 0.35, liftValue);
    let leanX = (-velocity.x * tiltMax) / 1100;
    let leanY = (-velocity.y * tiltMax) / 1100;
    const leanSize = Math.hypot(leanX, leanY);
    if (leanSize > tiltMax && leanSize > 0) {
      leanX *= tiltMax / leanSize;
      leanY *= tiltMax / leanSize;
    }
    leanX *= liftWeight;
    leanY *= liftWeight;
    const speedNorm = Math.min(1, Math.hypot(velocity.x, velocity.y) / 1400);
    const flexTarget = reduced ? 0 : 0.35 * settings.bend * speedNorm * liftWeight;
    const count = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / count;
    for (let i = 0; i < count; i++) {
      if (reduced) {
        liftValue = liftTarget;
        liftVelocity = 0;
      } else {
        const rising = liftTarget > liftValue;
        [liftValue, liftVelocity] = springStep(liftValue, liftVelocity, liftTarget, rising ? 19 : 15, rising ? 0.62 : 0.95, h);
        if (liftValue < 0) {
          liftValue = 0;
          liftVelocity = 0;
        }
      }
      [lean.x, leanVelocity.x] = springStep(lean.x, leanVelocity.x, leanX, 9.5, 0.78 - 0.5 * elastic, h);
      [lean.y, leanVelocity.y] = springStep(lean.y, leanVelocity.y, leanY, 9.5, 0.78 - 0.5 * elastic, h);
      [flex, flexVelocity] = springStep(flex, flexVelocity, flexTarget, 16, 0.55 - 0.4 * elastic, h);
    }
    if (reduced) {
      lean.x = 0;
      lean.y = 0;
      flex = 0;
    }
    const held = smooth(0, 0.35, liftValue);
    stick = drag ? Math.max(0, stick - dt / 0.26 - moved / 160) : 0;
    const adhesion = smooth(0, 1, stick);
    const wide = measureChains();
    const lever = Math.hypot(width / 2 - grab.x, height / 2 - grab.y) / (span / 2);
    const pitchLean = lean.x * dir.x + lean.y * dir.y;
    roll = -lean.x * dir.y + lean.y * dir.x;
    const boundary = -(tiltMax * 0.5 * Math.min(1, lever) * held + pitchLean);
    const bend = reduced ? 0 : clamp(settings.bend, 0, 1);
    chains.forEach((chain, index) => {
      const sign = index === 0 ? 1 : -1;
      const total = (bend * 0.8 * (chain.length / span) + flex) * held;
      for (let j = 0; j < NODES; j++) {
        const t = j / (NODES - 1);
        const free = 0.95 * Math.tanh((sign * boundary - total * (0.3 * t + 0.7 * t * t)) / 0.95);
        chain.target[j] = free + (0.8 * smooth(0, 0.3, t) - free) * adhesion;
      }
    });
    const coupling = 9000;
    const restore = 70;
    const damping = 11 - 8 * elastic;
    for (const chain of chains) {
      const angle = chain.angle;
      const spin = chain.speed;
      const target = chain.target;
      if (reduced) {
        angle.set(target);
        spin.fill(0);
        continue;
      }
      for (let i = 0; i < count; i++) {
        angle[0] = target[0];
        spin[0] = 0;
        for (let j = 1; j < NODES; j++) {
          const here = angle[j] - target[j];
          const before = angle[j - 1] - target[j - 1];
          const after = j + 1 < NODES ? angle[j + 1] - target[j + 1] : here;
          spin[j] += (coupling * (before - 2 * here + after) - restore * here - damping * spin[j]) * h;
        }
        for (let j = 1; j < NODES; j++) angle[j] += spin[j] * h;
      }
    }
    const speedNow = Math.hypot(pageVelocity.x, pageVelocity.y);
    const dip = wide * Math.sin(Math.min(1.2, Math.abs(roll))) + 4;
    grabHeight = Math.min(
      cameraDistance * 0.3,
      Math.max(liftValue * settings.lift * (1 + 0.25 * Math.min(1, speedNow / 1500)), dip * held),
    );
    const minSide = Math.min(width, height);
    const hintActive = settings.idleHint && !reduced && !drag && !hover && now < hint.until;
    if (settings.idleHint && !reduced && !drag && !hover && now >= hint.next && liftValue < 0.02 && ready) {
      hint = { corner: (hint.corner + 1 + Math.floor(Math.random() * 3)) % 4, until: now + 1250, next: now + 4200 + Math.random() * 2600 };
    }
    for (let index = 0; index < 4; index++) {
      let target = 0;
      if (!holding && liftValue < 0.2) {
        if (hover) {
          const point = cornerPoint(index);
          const distance = Math.hypot(hover.x - point.x, hover.y - point.y);
          target = 1 - smooth(0.12 * minSide, 0.62 * minSide, distance);
        }
        if (hintActive && hint.corner === index) target = Math.max(target, 0.55);
      }
      let value = cornerAmount[index];
      let speed = cornerVelocity[index];
      for (let i = 0; i < count; i++) [value, speed] = springStep(value, speed, target, 13, 0.6, h);
      cornerAmount[index] = value;
      cornerVelocity[index] = speed;
    }
    return holding;
  };

  const settled = () =>
    !drag &&
    !offsetTarget &&
    liftValue < 0.0005 &&
    Math.abs(liftVelocity) < 0.001 &&
    Math.hypot(lean.x, lean.y) < 0.0005 &&
    Math.hypot(leanVelocity.x, leanVelocity.y) < 0.001 &&
    Math.abs(flex) < 1e-6 &&
    Math.abs(flexVelocity) < 1e-5 &&
    chains.every((chain) => chain.angle.every((value) => Math.abs(value) < 1e-4) && chain.speed.every((value) => Math.abs(value) < 1e-3)) &&
    cornerAmount.every((value, index) => Math.abs(value) < 0.001 && Math.abs(cornerVelocity[index]) < 0.002) &&
    Math.hypot(pageVelocity.x, pageVelocity.y) < 0.5;

  let hintTimer = 0;
  const scheduleWake = (delay: number) => {
    window.clearTimeout(hintTimer);
    hintTimer = window.setTimeout(() => {
      hintTimer = 0;
      wake();
    }, Math.max(16, delay));
  };

  const frame = (now: number) => {
    raf = 0;
    if (destroyed || !ready) return;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    step(now, dt);
    render();
    const settings = settingsRef.current;
    const waiting = auto.phase === "drag" || !!hover;
    if (!visible) return;
    if (!settled() || waiting) {
      raf = requestAnimationFrame(frame);
      return;
    }
    liftValue = 0;
    lean.x = 0;
    lean.y = 0;
    pageVelocity.x = 0;
    pageVelocity.y = 0;
    for (let index = 0; index < 4; index++) {
      cornerAmount[index] = 0;
      cornerVelocity[index] = 0;
    }
    for (const chain of chains) {
      chain.angle.fill(0);
      chain.speed.fill(0);
    }
    const wakeAt: number[] = [];
    if (settings.idleHint && !settings.reduced) wakeAt.push(hint.next);
    if (settings.autoplay && !settings.reduced) wakeAt.push(Math.max(auto.next, interactedAt + settings.idleDelay * 1000));
    if (wakeAt.length) scheduleWake(Math.min(...wakeAt) - now);
  };

  const wake = () => {
    if (destroyed || raf || !ready || !visible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const onPointerDown = (event: PointerEvent) => {
    const settings = settingsRef.current;
    if (!settings.draggable || event.button !== 0 || !ready) return;
    if (drag && drag.id !== -1) return;
    const point = toLocal(event.clientX, event.clientY);
    stopAutoplay();
    event.preventDefault();
    try {
      root.setPointerCapture(event.pointerId);
    } catch {}
    interactedAt = performance.now();
    startDrag(event.pointerId, event.clientX, event.clientY, point);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (drag && drag.id === event.pointerId) {
      const x = drag.origin.x + event.clientX - drag.startX;
      const y = drag.origin.y + event.clientY - drag.startY;
      offset.x = rubber(x, drag.min.x, drag.max.x);
      offset.y = rubber(y, drag.min.y, drag.max.y);
      applyOffset();
      wake();
      return;
    }
    if (event.pointerType === "touch") return;
    hover = toLocal(event.clientX, event.clientY);
    interactedAt = performance.now();
    if (auto.phase === "drag") stopAutoplay();
    wake();
  };

  const onPointerLeave = (event: PointerEvent) => {
    if (drag && drag.id === event.pointerId) return;
    hover = null;
    interactedAt = performance.now();
    wake();
  };

  const onPointerUp = (event: PointerEvent) => {
    if (drag && drag.id === event.pointerId) release(false);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const settings = settingsRef.current;
    if (!settings.draggable) return;
    if (event.key === "Escape" && drag && drag.id !== -1) {
      event.preventDefault();
      release(true);
      return;
    }
    const distance = event.shiftKey ? 48 : 12;
    const moves: Record<string, Vec> = {
      ArrowLeft: { x: -distance, y: 0 },
      ArrowRight: { x: distance, y: 0 },
      ArrowUp: { x: 0, y: -distance },
      ArrowDown: { x: 0, y: distance },
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      stopAutoplay();
      const bounds = measureBounds();
      const base = offsetTarget ?? offset;
      offsetTarget = {
        x: clamp(base.x + move.x, bounds.min.x, bounds.max.x),
        y: clamp(base.y + move.y, bounds.min.y, bounds.max.y),
      };
      chooseGrip({ x: width / 2, y: height / 2 });
      hopUntil = performance.now() + 140;
      interactedAt = performance.now();
      settings.onDragEnd?.({ x: Math.round(offsetTarget.x), y: Math.round(offsetTarget.y) });
      wake();
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      peel();
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      reset();
    }
  };

  const onBlur = () => {
    if (drag && drag.id !== -1) release(false);
  };

  const peel = () => {
    if (!ready) return;
    stopAutoplay();
    chooseGrip({ x: width * 0.78, y: height * 0.22 });
    hopUntil = performance.now() + 620;
    leanVelocity.x -= 0.9;
    leanVelocity.y += 0.4;
    interactedAt = performance.now();
    wake();
  };

  const reset = () => {
    stopAutoplay();
    offsetTarget = { x: settingsRef.current.defaultPosition.x, y: settingsRef.current.defaultPosition.y };
    chooseGrip({ x: width / 2, y: height / 2 });
    hopUntil = performance.now() + 200;
    wake();
  };

  const moveTo = (x: number, y: number) => {
    stopAutoplay();
    offsetTarget = { x, y };
    chooseGrip({ x: width / 2, y: height / 2 });
    hopUntil = performance.now() + 240;
    wake();
  };

  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerleave", onPointerLeave);
  root.addEventListener("pointerup", onPointerUp);
  root.addEventListener("pointercancel", onPointerUp);
  root.addEventListener("lostpointercapture", onPointerUp);
  root.addEventListener("keydown", onKeyDown);
  window.addEventListener("blur", onBlur);

  const resizeObserver = new ResizeObserver(() => rebuild());
  resizeObserver.observe(root);
  const intersection = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) wake();
    },
    { rootMargin: "120px" },
  );
  intersection.observe(root);

  const onContextLost = (event: Event) => {
    event.preventDefault();
    ready = false;
    canvas.style.opacity = "0";
    hooks.onFail();
  };
  canvas.addEventListener("webglcontextlost", onContextLost);

  rebuild();

  return {
    sync: () => {
      rebuild();
      if (ready) {
        render();
        wake();
      }
    },
    destroy: () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(hintTimer);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", onPointerLeave);
      root.removeEventListener("pointerup", onPointerUp);
      root.removeEventListener("pointercancel", onPointerUp);
      root.removeEventListener("lostpointercapture", onPointerUp);
      root.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", onBlur);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      resizeObserver.disconnect();
      intersection.disconnect();
      sheet.geometry.dispose();
      shade.geometry.dispose();
      sheetMaterial.dispose();
      shadowMaterial.dispose();
      profile.dispose();
      artTexture?.dispose();
      shadowTexture?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      root.style.translate = "";
      root.style.cursor = "";
    },
    peel,
    reset,
    moveTo,
  };
};

const ElasticSticker = forwardRef<ElasticStickerHandle, ElasticStickerProps>(function ElasticSticker(
  {
    src = DEFAULT_SRC,
    alt = "Sticker",
    width = 300,
    height,
    radius = 20,
    border = 8,
    borderColor = "#FFFFFF",
    backColor = "#E9E7EF",
    sheenColor = "#FFFFFF",
    finish = "gloss",
    sheen = 0.6,
    rotation = 0,
    lift = 80,
    tilt = 28,
    bend = 0.5,
    elasticity = 0.5,
    shadow = 0.5,
    hoverPeel = 0.5,
    idleHint = true,
    draggable = true,
    bounds = "parent",
    snapBack = false,
    raiseOnDrag = true,
    autoplay = false,
    autoplaySpeed = 1,
    idleDelay = 2.5,
    defaultPosition,
    onDragStart,
    onDragEnd,
    className,
    style,
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<Controller | null>(null);
  const reduced = useSyncExternalStore(subscribeToMotion, readMotion, () => false);
  const [aspect, setAspect] = useState<number | null>(null);
  const [fallback, setFallback] = useState(true);
  const settingsRef = useRef<Settings>({
    src,
    radius,
    border,
    borderColor,
    backColor,
    sheenColor,
    finish,
    sheen,
    rotation,
    lift,
    tilt,
    bend,
    elasticity,
    shadow,
    hoverPeel,
    idleHint,
    draggable,
    bounds,
    snapBack,
    raiseOnDrag,
    autoplay,
    autoplaySpeed,
    idleDelay,
    defaultPosition: defaultPosition ?? { x: 0, y: 0 },
    reduced,
    onDragStart,
    onDragEnd,
  });

  useEffect(() => {
    settingsRef.current = {
      src,
      radius,
      border,
      borderColor,
      backColor,
      sheenColor,
      finish,
      sheen,
      rotation,
      lift,
      tilt,
      bend,
        elasticity,
      shadow,
      hoverPeel,
      idleHint,
      draggable,
      bounds,
      snapBack,
      raiseOnDrag,
      autoplay,
      autoplaySpeed,
      idleDelay,
      defaultPosition: defaultPosition ?? { x: 0, y: 0 },
      reduced,
      onDragStart,
      onDragEnd,
    };
    controllerRef.current?.sync();
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const controller = createSticker(root, settingsRef, {
      onAspect: setAspect,
      onReady: () => setFallback(false),
      onFail: () => setFallback(true),
    });
    controllerRef.current = controller;
    if (!controller) queueMicrotask(() => setFallback(true));
    return () => {
      controller?.destroy();
      controllerRef.current = null;
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      peel: () => controllerRef.current?.peel(),
      reset: () => controllerRef.current?.reset(),
      moveTo: (x: number, y: number) => controllerRef.current?.moveTo(x, y),
    }),
    [],
  );

  const resolvedHeight = height ?? Math.round(width / (aspect ?? 4 / 3));

  return (
    <div
      ref={rootRef}
      role={draggable ? "button" : "img"}
      tabIndex={draggable ? 0 : undefined}
      aria-roledescription={draggable ? "draggable sticker" : undefined}
      aria-label={alt}
      className={cn(
        "relative inline-block shrink-0 select-none outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current",
        draggable ? "cursor-grab touch-none" : "cursor-inherit touch-auto",
        className,
      )}
      style={{
        width,
        maxWidth: "100%",
        aspectRatio: `${width} / ${resolvedHeight}`,
        borderRadius: radius,
        rotate: `${rotation}deg`,
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      {fallback && (
        <img
          src={src}
          alt=""
          draggable={false}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: radius,
            border: `${border}px solid ${borderColor}`,
            boxSizing: "border-box",
            boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
          }}
        />
      )}
    </div>
  );
});

ElasticSticker.displayName = "ElasticSticker";

export { ElasticSticker };
export default ElasticSticker;
