"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import Matter from "matter-js";
import { cn } from "../../lib/utils";

// Matter.js is CommonJS; a default import also works during Astro prerendering.
const { Bodies, Body, Composite, Constraint, Engine, Sleeping } = Matter;
type Body = Matter.Body;
type Constraint = Matter.Constraint;

export interface TumbleWallItem {
  src?: string;
  alt?: string;
  title?: string;
  href?: string;
}

export type TumbleWallShape = "circle" | "square" | "card" | "chip" | "mixed";
export type TumbleWallFrame = "none" | "border" | "polaroid";
export type TumbleWallEntrance = "rain" | "burst" | "drop" | "none";

export interface TumbleWallHandle {
  drop: () => void;
  shake: (strength?: number) => void;
  pop: (x: number, y: number, strength?: number) => void;
}

export interface TumbleWallProps {
  items?: TumbleWallItem[];
  count?: number;
  shape?: TumbleWallShape;
  size?: number;
  sizeVariance?: number;
  fill?: number;
  radius?: number;
  frame?: TumbleWallFrame;
  frameWidth?: number;
  frameColor?: string;
  textColor?: string;
  backgroundColor?: string;
  shadow?: number;
  showTitles?: boolean;
  monochrome?: boolean;
  hoverScale?: number;
  gravity?: number;
  gravityX?: number;
  bounce?: number;
  friction?: number;
  airFriction?: number;
  spin?: number;
  drift?: number;
  entrance?: TumbleWallEntrance;
  stagger?: number;
  draggable?: boolean;
  dragStiffness?: number;
  throwStrength?: number;
  popForce?: number;
  contain?: boolean;
  paused?: boolean;
  ariaLabel?: string;
  onSelect?: (item: TumbleWallItem, index: number) => void;
  className?: string;
  style?: CSSProperties;
}

type Kind = "circle" | "square" | "card" | "chip";
type Side = "top" | "bottom" | "left" | "right";
type Point = { x: number; y: number };

interface Settings {
  items: TumbleWallItem[];
  count: number;
  shape: TumbleWallShape;
  size: number;
  sizeVariance: number;
  fill: number;
  radius: number;
  frame: TumbleWallFrame;
  frameWidth: number;
  showTitles: boolean;
  hoverScale: number;
  gravity: number;
  gravityX: number;
  bounce: number;
  friction: number;
  airFriction: number;
  spin: number;
  drift: number;
  entrance: TumbleWallEntrance;
  stagger: number;
  draggable: boolean;
  dragStiffness: number;
  throwStrength: number;
  popForce: number;
  contain: boolean;
  paused: boolean;
  reduced: boolean;
}

interface Piece {
  index: number;
  node: HTMLElement;
  img: HTMLImageElement | null;
  kind: Kind;
  label: string;
  title: string;
  w: number;
  h: number;
  corner: number;
  reach: number;
  inline: boolean;
  body: Body | null;
  px: number;
  py: number;
  pa: number;
  rx: number;
  ry: number;
  ra: number;
  scale: number;
  spawned: boolean;
  spawnAt: number;
  entry: Point | null;
  lane: number;
  grow: boolean;
  transform: string;
  z: number;
  mono: boolean;
  mass: number;
  flung: number;
}

interface Geometry {
  w: number;
  h: number;
  fw: number;
  bottom: number;
  corner: number;
  font: number;
  inset: number;
}

interface Drag {
  id: number;
  piece: Piece;
  constraint: Constraint | null;
  ox: number;
  oy: number;
  sx: number;
  sy: number;
  time: number;
  moved: boolean;
  touch: boolean;
}

interface Tap {
  id: number;
  x: number;
  y: number;
  time: number;
}

interface Controller {
  sync: () => void;
  drop: () => void;
  shake: (strength?: number) => void;
  pop: (x: number, y: number, strength?: number) => void;
  destroy: () => void;
}

const STEP = 1000 / 120;
const WALL = 640;
const ENTERING_CATEGORY = 0x0002;
const SIDES: Side[] = ["top", "bottom", "left", "right"];
const SHAPES: TumbleWallShape[] = ["circle", "square", "card", "chip", "mixed"];
const FRAMES: TumbleWallFrame[] = ["none", "border", "polaroid"];
const ENTRANCES: TumbleWallEntrance[] = ["rain", "burst", "drop", "none"];
const MIXED: Kind[] = ["circle", "square", "card"];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const finite = (value: number, fallback: number) =>
  Number.isFinite(value) ? value : fallback;
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};
const kindAt = (shape: TumbleWallShape, index: number): Kind =>
  shape === "mixed"
    ? MIXED[Math.floor(hash(index * 7.31 + 2.1) * 3) % 3]
    : shape;

const defaultItems: TumbleWallItem[] = [
  {
    src: "https://pro.reactbits.dev/demo-media/portrait-sienna.webp",
    alt: "Studio portrait with short natural hair and a burnt-orange top",
    title: "Sienna",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/portrait-indigo.webp",
    alt: "Studio portrait with short dark hair and a cobalt jacket",
    title: "Indigo",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/portrait-olive.webp",
    alt: "Studio portrait with a dark bob and an olive top",
    title: "Olive",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/portrait-silver.webp",
    alt: "Studio portrait with cropped grey hair and a black shirt",
    title: "Silver",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/portrait-ochre.webp",
    alt: "Studio portrait with curly dark hair and an ochre knit",
    title: "Ochre",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/portrait-rose.webp",
    alt: "Studio portrait with curly red hair and burgundy clothing",
    title: "Rose",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/portrait-teal.webp",
    alt: "Studio portrait with a shaved head and a teal jacket",
    title: "Teal",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/portrait-pearl.webp",
    alt: "Studio portrait with long black hair and an ivory shirt",
    title: "Pearl",
  },
];

const subscribeToMotion = (notify: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};

const readMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const structureOf = (s: Settings) =>
  [
    s.count,
    s.shape,
    s.size,
    s.sizeVariance,
    s.fill,
    s.radius,
    s.frame,
    s.frameWidth,
    s.showTitles,
    s.items
      .map((item) => `${item.src ?? ""}|${item.title ?? ""}|${item.alt ?? ""}`)
      .join("\n"),
  ].join("~");

const physicsOf = (s: Settings) =>
  [
    s.gravity,
    s.gravityX,
    s.bounce,
    s.friction,
    s.airFriction,
    s.contain,
    s.paused,
    s.draggable,
    s.drift,
  ].join(",");

const gravityOf = (s: Settings) => ({
  x: clamp(finite(s.gravityX, 0), -3, 3),
  y: clamp(finite(s.gravity, 1), -3, 3),
});

const sideFor = (s: Settings): Side | null => {
  const g = gravityOf(s);
  if (Math.abs(g.y) >= Math.abs(g.x) && Math.abs(g.y) > 0.05)
    return g.y > 0 ? "top" : "bottom";
  if (Math.abs(g.x) > 0.05) return g.x > 0 ? "left" : "right";
  return null;
};

const downOf = (s: Settings): Point => {
  const g = gravityOf(s);
  const m = Math.hypot(g.x, g.y);
  return m > 0.05 ? { x: g.x / m, y: g.y / m } : { x: 0, y: 1 };
};

const inwardOf = (side: Side): Point =>
  side === "top"
    ? { x: 0, y: 1 }
    : side === "bottom"
      ? { x: 0, y: -1 }
      : side === "left"
        ? { x: 1, y: 0 }
        : { x: -1, y: 0 };

const areaOf = (kind: Kind, g: Geometry) =>
  kind === "circle"
    ? (Math.PI * g.w * g.w) / 4
    : kind === "chip"
      ? g.w * g.h - ((4 - Math.PI) * g.h * g.h) / 4
      : g.w * g.h - (4 - Math.PI) * g.corner * g.corner;

function createWall(
  stage: HTMLDivElement,
  tip: HTMLDivElement,
  settingsRef: { current: Settings },
  pickRef: { current: (index: number) => void },
): Controller {
  const engine = Engine.create({
    enableSleeping: true,
    positionIterations: 10,
    velocityIterations: 8,
    constraintIterations: 3,
  });
  const view = stage.ownerDocument.defaultView ?? window;
  const byNode = new Map<Element, Piece>();
  const watched: HTMLImageElement[] = [];
  let list: Piece[] = [];
  let walls: Record<Side, Body> | null = null;
  let gap: Side | null = null;
  let enterSide: Side | null = null;
  let entering = false;
  let width = 0;
  let height = 0;
  let unit = 1;
  let avgSpan = 80;
  let structure = "";
  let physics = "";
  let started = false;
  let seen = false;
  let ready = false;
  let visible = false;
  let destroyed = false;
  let clock = 0;
  let raf = 0;
  let last = 0;
  let acc = 0;
  // Vary each mounted wall without changing the server-rendered item order.
  let seed = Math.random() * 1_000_000;
  let zTop = 10;
  let laneKey = "";
  let lanePerm: number[] = [];
  let burstCenter: Point = { x: 0, y: 0 };
  let drag: Drag | null = null;
  let tap: Tap | null = null;
  let hovered: Piece | null = null;
  let focused: Piece | null = null;
  let tapped: Piece | null = null;
  let tapPiece: Piece | null = null;
  let tipPiece: Piece | null = null;
  let tapTimer = 0;
  let readyTimer = 0;
  let suppress = false;

  const settings = () => settingsRef.current;

  const itemOf = (target: EventTarget | null) => {
    const element = target as Element | null;
    return element && typeof element.closest === "function"
      ? element.closest<HTMLElement>("[data-tw-item]")
      : null;
  };

  const pieceOf = (target: EventTarget | null) => {
    const node = itemOf(target);
    return node ? (byNode.get(node) ?? null) : null;
  };

  const local = (event: PointerEvent): Point => {
    const box = stage.getBoundingClientRect();
    const sx = box.width > 0 && width > 0 ? box.width / width : 1;
    const sy = box.height > 0 && height > 0 ? box.height / height : 1;
    return {
      x: (event.clientX - box.left) / sx,
      y: (event.clientY - box.top) / sy,
    };
  };

  const pointOn = (side: Side, along: number, depth: number): Point =>
    side === "top"
      ? { x: along, y: -depth }
      : side === "bottom"
        ? { x: along, y: height + depth }
        : side === "left"
          ? { x: -depth, y: along }
          : { x: width + depth, y: along };

  const insideOf = (p: Piece, side: Side) => {
    const b = p.body;
    if (!b) return false;
    return side === "top"
      ? b.bounds.min.y >= 0
      : side === "bottom"
        ? b.bounds.max.y <= height
        : side === "left"
          ? b.bounds.min.x >= 0
          : b.bounds.max.x <= width;
  };

  const markEntered = () => {
    if (!gap) return;
    for (const p of list)
      if (p.body && insideOf(p, gap)) p.body.collisionFilter.category = 0x0001;
  };

  const clampInside = (
    p: Piece,
    x: number,
    y: number,
    arriving = p.body?.collisionFilter.category === ENTERING_CATEGORY,
  ): Point => {
    const r = p.kind === "circle" ? p.w / 2 : Math.min(p.w, p.h) / 2;
    const fx = finite(x, width / 2);
    const fy = finite(y, height / 2);
    const openSide = arriving || !settings().contain ? gap : null;
    return {
      x: clamp(
        fx,
        openSide === "left" ? -width * 2 : r,
        openSide === "right" ? width * 3 : Math.max(r, width - r),
      ),
      y: clamp(
        fy,
        openSide === "top" ? -height * 2 : r,
        openSide === "bottom" ? height * 3 : Math.max(r, height - r),
      ),
    };
  };

  const setGap = (side: Side | null) => {
    gap = side;
    if (!walls) return;
    // The entrance stays solid for pieces that have already crossed into the wall.
    for (const edge of SIDES)
      walls[edge].collisionFilter.mask =
        edge === side ? (settings().contain ? ~ENTERING_CATEGORY : 0) : 0xffffffff;
  };

  const desiredGap = (s: Settings) =>
    entering ? enterSide : s.contain ? null : sideFor(s);

  const makeWalls = () => {
    if (walls) Composite.remove(engine.world, Object.values(walls));
    const spanX = width * 7 + WALL * 2;
    const spanY = height * 7 + WALL * 2;
    const options = { isStatic: true, friction: 1, restitution: 0 };
    walls = {
      top: Bodies.rectangle(width / 2, -WALL / 2, spanX, WALL, options),
      bottom: Bodies.rectangle(width / 2, height + WALL / 2, spanX, WALL, options),
      left: Bodies.rectangle(-WALL / 2, height / 2, WALL, spanY, options),
      right: Bodies.rectangle(width + WALL / 2, height / 2, WALL, spanY, options),
    };
    Composite.add(engine.world, Object.values(walls));
    setGap(gap);
  };

  const createBody = (p: Piece, x: number, y: number, angle: number) => {
    const s = settings();
    const options = {
      angle,
      restitution: clamp(finite(s.bounce, 0.3), 0, 0.95),
      friction: clamp(finite(s.friction, 0.3), 0, 1),
      frictionStatic: 0.7,
      frictionAir: clamp(finite(s.airFriction, 0.012), 0, 0.2),
      density: 0.0012,
      sleepThreshold: 45,
    };
    if (p.kind === "circle") return Bodies.circle(x, y, p.w / 2, options, 40);
    const corner =
      p.kind === "chip"
        ? p.h / 2 - 0.25
        : Math.min(p.corner, Math.min(p.w, p.h) / 2 - 0.25);
    return Bodies.rectangle(
      x,
      y,
      p.w,
      p.h,
      corner > 0.75 ? { ...options, chamfer: { radius: corner } } : options,
    );
  };

  const geometryOf = (
    p: Piece,
    base: number,
    nominal: number,
    measured: number | null,
  ): Geometry => {
    const s = settings();
    const ratio = base / nominal;
    if (p.kind === "chip") {
      const h = Math.max(18, base * 0.4);
      const font = h * 0.38;
      const inset = h * 0.1;
      const lead = p.img ? inset + (h - inset * 2) + font * 0.62 : font * 1.15;
      return {
        w: measured ?? lead + p.label.length * font * 0.56 + font * 1.1,
        h,
        fw: 0,
        bottom: 0,
        corner: h / 2,
        font,
        inset,
      };
    }
    const fw =
      s.frame === "none" ? 0 : clamp(finite(s.frameWidth, 6), 0, 48) * ratio;
    const radius = clamp(finite(s.radius, 18), 0, 480) * ratio;
    const w = p.kind === "card" ? base * 0.84 : base;
    if (s.frame === "polaroid" && p.kind !== "circle") {
      const inner = Math.max(4, w - fw * 2);
      const bottom = Math.max(fw * 3, w * 0.19);
      const h = fw + inner * (p.kind === "card" ? 4 / 3 : 1) + bottom;
      return {
        w,
        h,
        fw,
        bottom,
        corner: Math.min(radius, w / 2),
        font: clamp(bottom * 0.36, 8, 18),
        inset: 0,
      };
    }
    const h = p.kind === "card" ? (w * 4) / 3 : w;
    return {
      w,
      h,
      fw,
      bottom: fw,
      corner: p.kind === "circle" ? w / 2 : Math.min(radius, Math.min(w, h) / 2),
      font: 12,
      inset: 0,
    };
  };

  const applyChip = (p: Piece, g: Geometry) => {
    const style = p.node.style;
    style.setProperty("--tw-h", `${g.h.toFixed(2)}px`);
    style.setProperty("--tw-f", `${g.font.toFixed(2)}px`);
    style.setProperty("--tw-p", `${g.inset.toFixed(2)}px`);
    style.setProperty("--tw-r", `${(g.h / 2).toFixed(2)}px`);
    style.removeProperty("--tw-w");
  };

  const measureAll = () => {
    const s = settings();
    const nominal = clamp(finite(s.size, 116), 16, 480);
    const variance = clamp(finite(s.sizeVariance, 0.4), 0, 1);
    const budget =
      clamp(finite(s.fill, 0.4), 0.05, 0.85) *
      Math.max(1, width) *
      Math.max(1, Math.min(height, width * 1.4));
    const limit = Math.max(24, Math.min(width, height) * 0.46);
    const bases = list.map(
      (p) =>
        nominal *
        clamp(1 + variance * (hash(p.index * 3.17 + 0.41) - 0.5) * 0.9, 0.5, 1.5),
    );
    const measured: (number | null)[] = list.map(() => null);
    const shapes = (k: number) =>
      list.map((p, i) => geometryOf(p, bases[i] * k, nominal, measured[i]));
    const fitFor = (geometries: Geometry[]) => {
      const area = geometries.reduce(
        (sum, g, i) => sum + areaOf(list[i].kind, g),
        0,
      );
      let k = Math.sqrt(budget / Math.max(1, area));
      for (let i = 0; i < geometries.length; i += 1) {
        const g = geometries[i];
        const span = list[i].kind === "chip" ? g.h : Math.max(g.w, g.h);
        k = Math.min(k, limit / Math.max(1, span));
        if (list[i].kind === "chip") k = Math.min(k, (width * 0.9) / Math.max(1, g.w));
      }
      return k;
    };
    let k = Math.min(1, fitFor(shapes(1)));
    const chips = list.some((p) => p.kind === "chip");
    for (let pass = 0; chips && pass < 3; pass += 1) {
      const geometries = list.map((p, i) =>
        geometryOf(p, bases[i] * k, nominal, null),
      );
      list.forEach((p, i) => {
        if (p.kind === "chip") applyChip(p, geometries[i]);
      });
      list.forEach((p, i) => {
        measured[i] =
          p.kind === "chip"
            ? Math.ceil(
                finite(parseFloat(view.getComputedStyle(p.node).width), p.node.offsetWidth) + 0.5,
              )
            : null;
      });
      if (pass === 2) break;
      const next = k * Math.min(1, fitFor(shapes(k)));
      if (next > k * 0.985) break;
      k = next;
    }
    const finals = shapes(k);
    let spanSum = 0;
    list.forEach((p, i) => {
      const g = finals[i];
      const style = p.node.style;
      const w = p.kind === "chip" ? Math.min(g.w, width * 0.92) : g.w;
      p.w = w;
      p.h = g.h;
      p.corner = g.corner;
      p.reach = p.kind === "circle" ? w / 2 : Math.hypot(w, g.h) / 2;
      p.inline =
        p.kind === "chip" ||
        (s.frame === "polaroid" && p.kind !== "circle" && s.showTitles);
      style.setProperty("--tw-w", `${w.toFixed(2)}px`);
      style.setProperty("--tw-h", `${g.h.toFixed(2)}px`);
      style.setProperty("--tw-fw", `${g.fw.toFixed(2)}px`);
      style.setProperty("--tw-b", `${g.bottom.toFixed(2)}px`);
      style.setProperty("--tw-f", `${g.font.toFixed(2)}px`);
      style.setProperty("--tw-p", `${g.inset.toFixed(2)}px`);
      style.setProperty(
        "--tw-r",
        p.kind === "circle" ? "50%" : `${g.corner.toFixed(2)}px`,
      );
      style.setProperty(
        "--tw-ri",
        p.kind === "circle"
          ? "50%"
          : `${Math.max(1.5, g.corner - g.fw).toFixed(2)}px`,
      );
      spanSum += Math.max(w, g.h);
    });
    avgSpan = list.length ? spanSum / list.length : 80;
  };

  const place = (p: Piece, alpha: number) => {
    const b = p.body;
    if (!b) return;
    const x = p.px + (b.position.x - p.px) * alpha;
    const y = p.py + (b.position.y - p.py) * alpha;
    const a = p.pa + (b.angle - p.pa) * alpha;
    p.rx = x;
    p.ry = y;
    p.ra = a;
    const scaled = Math.abs(p.scale - 1) > 0.0005;
    const t = `translate3d(${(x - p.w / 2).toFixed(2)}px,${(y - p.h / 2).toFixed(2)}px,0) rotate(${a.toFixed(4)}rad)${scaled ? ` scale(${p.scale.toFixed(4)})` : ""}`;
    if (t !== p.transform) {
      p.transform = t;
      p.node.style.transform = t;
    }
  };

  const placeTip = () => {
    const p = tipPiece;
    if (!p || !p.body) return;
    const c = Math.abs(Math.cos(p.ra));
    const n = Math.abs(Math.sin(p.ra));
    const extent =
      (p.kind === "circle" ? p.w / 2 : (p.w * n + p.h * c) / 2) * p.scale;
    // Keep labels inside the compact homepage strip, including during dragging.
    const above = p.ry > height / 2;
    const top = above ? p.ry - extent - 10 - tip.offsetHeight : p.ry + extent + 10;
    const y = clamp(top, 4, Math.max(4, height - tip.offsetHeight - 4));
    const inset = tip.offsetWidth / 2 + 4;
    const x = clamp(p.rx, inset, Math.max(inset, width - inset));
    tip.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translateX(-50%)`;
  };

  const targetOf = (p: Piece) => {
    const lift = clamp(finite(settings().hoverScale, 1.06), 1, 1.4);
    if (drag?.piece === p) return lift * 1.025;
    if (hovered === p || focused === p || tapped === p) return lift;
    return 1;
  };

  const raise = (p: Piece, on: boolean) => {
    p.node.style.zIndex = on ? String(zTop + 1) : p.z ? String(p.z) : "";
  };

  const refresh = () => {
    const s = settings();
    for (const p of list) {
      const active = drag?.piece === p || hovered === p || focused === p;
      if (active !== p.mono) {
        p.mono = active;
        if (active) p.node.style.setProperty("--tw-mono", "0");
        else p.node.style.removeProperty("--tw-mono");
      }
    }
    const candidate = drag?.piece ?? hovered ?? focused ?? tapped;
    const next =
      candidate && s.showTitles && !candidate.inline && candidate.title
        ? candidate
        : null;
    if (next !== tipPiece) {
      tipPiece = next;
      if (next) {
        tip.textContent = next.title;
        placeTip();
        tip.style.opacity = "1";
      } else tip.style.opacity = "0";
    }
    schedule();
  };

  const laneFor = (k: number, lanes: number) => {
    const cycle = Math.floor(k / lanes);
    const key = `${lanes}:${cycle}:${seed}`;
    if (key !== laneKey) {
      laneKey = key;
      lanePerm = Array.from({ length: lanes }, (_, i) => i).sort(
        (a, b) =>
          hash(a * 7.7 + seed + cycle * 13.1) -
          hash(b * 7.7 + seed + cycle * 13.1),
      );
    }
    return lanePerm[k % lanes];
  };

  const crowded = (point: Point, p: Piece) =>
    list.some(
      (q) =>
        q !== p &&
        q.body !== null &&
        Math.hypot(q.body.position.x - point.x, q.body.position.y - point.y) <
          q.reach + p.reach,
    );

  const rainEntry = (p: Piece, side: Side): Point => {
    const along = side === "top" || side === "bottom" ? width : height;
    const lanes = Math.max(1, Math.floor(along / Math.max(avgSpan * 1.05, 1)));
    const lane = laneFor(p.lane, lanes);
    const jitter = (hash(p.lane * 9.7 + seed) - 0.5) * 0.55;
    const at = clamp(
      ((lane + 0.5 + jitter) * along) / lanes,
      Math.min(p.reach, along / 2),
      Math.max(along / 2, along - p.reach),
    );
    let depth = p.reach + 2;
    for (let tries = 0; tries < 10; tries += 1) {
      const point = pointOn(side, at, depth);
      if (!crowded(point, p)) return point;
      depth += p.reach * 2 + 4;
    }
    return pointOn(side, at, depth);
  };

  const freeEntry = (p: Piece): Point => {
    for (let tries = 0; tries < 16; tries += 1) {
      const point = {
        x: p.reach + hash(p.index * 3.3 + tries * 1.7 + seed) * Math.max(1, width - p.reach * 2),
        y: p.reach + hash(p.index * 5.1 + tries * 2.3 + seed) * Math.max(1, height - p.reach * 2),
      };
      if (!crowded(point, p)) return point;
    }
    return { x: width / 2, y: height / 2 };
  };

  const spawn = (p: Piece) => {
    const s = settings();
    const root = Math.sqrt(unit);
    const amount = clamp(finite(s.spin, 0.5), 0, 2);
    const r1 = hash(p.lane * 1.91 + seed * 3.1);
    const r2 = hash(p.lane * 4.37 + seed * 1.3);
    const r3 = hash(p.lane * 2.63 + seed * 0.7);
    let point: Point;
    let vx = 0;
    let vy = 0;
    if (p.entry) {
      point = p.entry;
      if (p.grow) {
        const dx = point.x - burstCenter.x;
        const dy = point.y - burstCenter.y;
        const m = Math.hypot(dx, dy) || 1;
        const down = downOf(s);
        const speed = (2.4 + r1 * 2.6) * root;
        const kick = sideFor(s) ? 3.2 * root : 0;
        vx = (dx / m) * speed - down.x * kick;
        vy = (dy / m) * speed - down.y * kick;
      } else {
        const down = downOf(s);
        vx = down.x * 0.5;
        vy = down.y * 0.5;
      }
    } else {
      const side = enterSide ?? "top";
      point = rainEntry(p, side);
      const inward = inwardOf(side);
      const speed = (1.6 + r1 * 1.4) * root;
      const drift = (r2 - 0.5) * 1.4;
      vx = inward.x * speed - inward.y * drift;
      vy = inward.y * speed + inward.x * drift;
    }
    const angle = (r3 - 0.5) * 1.1 * amount;
    const body = createBody(p, point.x, point.y, angle);
    Body.setVelocity(body, { x: vx, y: vy });
    Body.setAngularVelocity(body, (r2 - 0.5) * 0.12 * amount);
    Composite.add(engine.world, body);
    p.body = body;
    if (gap && !insideOf(p, gap)) body.collisionFilter.category = ENTERING_CATEGORY;
    p.spawned = true;
    p.px = point.x;
    p.py = point.y;
    p.pa = angle;
    if (p.grow && !s.reduced) p.scale = 0.2;
    p.transform = "";
    place(p, 1);
    p.node.style.visibility = "visible";
  };

  const clearBodies = () => {
    if (drag) endDrag(true);
    for (const p of list) {
      if (p.body) Composite.remove(engine.world, p.body);
      p.body = null;
      p.spawned = false;
      p.entry = null;
      p.grow = false;
      p.transform = "";
      p.node.style.visibility = "hidden";
    }
  };

  const shuffled = () =>
    list
      .map((p) => p.index)
      .sort((a, b) => hash(a * 3.7 + seed * 1.37) - hash(b * 3.7 + seed * 1.37));

  const scatter = (order: number[], side: Side, firstDepth: number) => {
    const horizontal = side === "top" || side === "bottom";
    const along = horizontal ? width : height;
    const cell = avgSpan * 1.16;
    const columns = Math.max(1, Math.floor(along / Math.max(cell, 1)));
    order.forEach((index, k) => {
      const p = list[index];
      const column = k % columns;
      const row = Math.floor(k / columns);
      const jitter = (hash(k * 5.3 + seed) - 0.5) * 0.5;
      const at = clamp(
        ((column + 0.5 + jitter) * along) / columns,
        Math.min(p.reach, along / 2),
        Math.max(along / 2, along - p.reach),
      );
      const depth =
        firstDepth - row * cell - (hash(k * 2.9 + seed) - 0.5) * cell * 0.3;
      p.entry = pointOn(side, at, -depth);
      p.lane = k;
      p.grow = false;
    });
  };

  const cluster = (order: number[]) => {
    const s = settings();
    const down = downOf(s);
    const lift = sideFor(s) ? 0.08 : 0;
    burstCenter = {
      x: width / 2 - down.x * width * lift,
      y: height / 2 - down.y * height * lift,
    };
    const spacing = avgSpan * 0.58;
    order.forEach((index, k) => {
      const p = list[index];
      const angle = k * 2.39996 + seed;
      const r = spacing * Math.sqrt(k + 0.5);
      p.entry = {
        x: clamp(burstCenter.x + Math.cos(angle) * r, p.reach, Math.max(p.reach, width - p.reach)),
        y: clamp(burstCenter.y + Math.sin(angle) * r, p.reach, Math.max(p.reach, height - p.reach)),
      };
      p.lane = k;
    });
  };

  const settleNow = () => {
    const s = settings();
    const order = shuffled();
    const side = sideFor(s);
    entering = false;
    enterSide = null;
    if (side) {
      const across = side === "top" || side === "bottom" ? height : width;
      setGap(side);
      scatter(order, side, across - avgSpan * 0.62);
    } else {
      setGap(null);
      cluster(order);
    }
    for (const index of order) {
      const p = list[index];
      p.grow = false;
      spawn(p);
      if (p.body) {
        Body.setVelocity(p.body, { x: 0, y: 0 });
        Body.setAngularVelocity(p.body, 0);
      }
    }
    engine.gravity.x = gravityOf(s).x;
    engine.gravity.y = gravityOf(s).y;
    for (let i = 0; i < 1400; i += 1) {
      Engine.update(engine, STEP);
      markEntered();
      if (i > 120 && i % 20 === 0 && list.every((p) => !p.body || p.body.isSleeping))
        break;
    }
    if (side && list.every((p) => p.body?.collisionFilter.category !== ENTERING_CATEGORY))
      setGap(desiredGap(s));
    else if (side) {
      entering = true;
      enterSide = side;
    }
    for (const p of list) {
      if (!p.body) continue;
      p.px = p.body.position.x;
      p.py = p.body.position.y;
      p.pa = p.body.angle;
      p.scale = targetOf(p);
      place(p, 1);
    }
  };

  const begin = () => {
    const s = settings();
    started = true;
    seed += 1;
    laneKey = "";
    clearBodies();
    if (s.reduced || s.entrance === "none") {
      settleNow();
      refresh();
      return;
    }
    const side = sideFor(s);
    const order = shuffled();
    if (s.entrance === "burst" || !side) {
      entering = false;
      enterSide = null;
      setGap(desiredGap(s));
      cluster(order);
      order.forEach((index, k) => {
        const p = list[index];
        p.grow = true;
        p.spawnAt = clock + k * 16;
      });
      refresh();
      return;
    }
    entering = true;
    enterSide = side;
    setGap(side);
    if (s.entrance === "drop") {
      const across = side === "top" || side === "bottom" ? height : width;
      scatter(order, side, across * 0.55);
      for (const p of list) p.spawnAt = clock;
    } else {
      const stagger = clamp(finite(s.stagger, 55), 0, 1000);
      order.forEach((index, k) => {
        const p = list[index];
        p.entry = null;
        p.grow = false;
        p.lane = k;
        p.spawnAt = clock + k * stagger;
      });
    }
    refresh();
  };

  const maybeBegin = () => {
    if (started || destroyed || !seen || !ready || width <= 0 || height <= 0)
      return;
    if (!list.length) return;
    begin();
  };

  const imagesPending = () => list.some((p) => p.img !== null && !p.img.complete);

  const onImage = (event: Event) => {
    const img = event.currentTarget as HTMLImageElement;
    if (img.naturalWidth > 0) img.style.opacity = "1";
    if (!ready && !imagesPending()) {
      ready = true;
      maybeBegin();
    }
  };

  const watchImages = () => {
    for (const p of list) {
      const img = p.img;
      if (!img) continue;
      if (!watched.includes(img)) {
        watched.push(img);
        img.addEventListener("load", onImage);
        img.addEventListener("error", onImage);
      }
      if (img.complete && img.naturalWidth > 0) img.style.opacity = "1";
    }
    if (!ready && !imagesPending()) {
      ready = true;
      maybeBegin();
    }
  };

  const build = (preserve: boolean) => {
    const s = settings();
    if (drag) endDrag(true);
    const nodes = Array.from(
      stage.querySelectorAll<HTMLElement>("[data-tw-item]"),
    );
    const previous = new Map(list.map((p) => [p.index, p]));
    for (const p of list) if (p.body) Composite.remove(engine.world, p.body);
    byNode.clear();
    list = nodes.map((node, index) => {
      const old = previous.get(index);
      const piece: Piece = {
        index,
        node,
        img: node.querySelector("img"),
        kind: kindAt(s.shape, index),
        label: node.getAttribute("data-tw-label") ?? "",
        title: node.getAttribute("data-tw-title") ?? "",
        w: 0,
        h: 0,
        corner: 0,
        reach: 0,
        inline: false,
        body: null,
        px: 0,
        py: 0,
        pa: 0,
        rx: 0,
        ry: 0,
        ra: 0,
        scale: old?.scale ?? 1,
        spawned: false,
        spawnAt: old?.spawnAt ?? 0,
        entry: old?.entry ?? null,
        lane: old?.lane ?? index,
        grow: old?.grow ?? false,
        transform: "",
        z: old?.z ?? 0,
        mono: old?.mono ?? false,
        mass: 0,
        flung: 0,
      };
      byNode.set(node, piece);
      return piece;
    });
    hovered = hovered ? (list[hovered.index] ?? null) : null;
    focused = focused ? (list[focused.index] ?? null) : null;
    tapped = tapped ? (list[tapped.index] ?? null) : null;
    tipPiece = null;
    tip.style.opacity = "0";
    measureAll();
    const fresh: Piece[] = [];
    for (const p of list) {
      const old = previous.get(p.index);
      p.node.style.zIndex = p.z ? String(p.z) : "";
      if (preserve && old?.body && old.spawned) {
        const at = clampInside(
          p,
          old.body.position.x,
          old.body.position.y,
          old.body.collisionFilter.category === ENTERING_CATEGORY,
        );
        const body = createBody(p, at.x, at.y, old.body.angle);
        body.collisionFilter.category = old.body.collisionFilter.category;
        Body.setVelocity(body, Body.getVelocity(old.body));
        Body.setAngularVelocity(body, Body.getAngularVelocity(old.body));
        Composite.add(engine.world, body);
        p.body = body;
        p.spawned = true;
        p.px = at.x;
        p.py = at.y;
        p.pa = old.body.angle;
        p.node.style.visibility = "visible";
        place(p, 1);
      } else {
        p.node.style.visibility = "hidden";
        if (started && !(preserve && old && !old.spawned)) fresh.push(p);
      }
    }
    if (fresh.length) {
      const side = sideFor(s);
      const stagger = clamp(finite(s.stagger, 55), 0, 1000);
      fresh.forEach((p, k) => {
        p.spawnAt = clock + k * Math.max(stagger, 24);
        p.lane = list.length + k;
        if (side) {
          p.entry = null;
          p.grow = false;
        } else {
          p.entry = freeEntry(p);
          p.grow = true;
        }
      });
      if (side) {
        entering = true;
        enterSide = enterSide ?? side;
        setGap(enterSide);
      }
    }
    watchImages();
    refresh();
  };

  const measure = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (w <= 0 || h <= 0) return false;
    if (Math.abs(w - width) < 0.5 && Math.abs(h - height) < 0.5) return false;
    width = w;
    height = h;
    unit = clamp(Math.min(width, height) / 560, 0.45, 1.6);
    makeWalls();
    return true;
  };

  const respawn = (p: Piece) => {
    const s = settings();
    if (p.body) Composite.remove(engine.world, p.body);
    p.body = null;
    p.spawned = false;
    p.entry = null;
    p.grow = false;
    p.node.style.visibility = "hidden";
    p.spawnAt = clock;
    entering = true;
    enterSide = sideFor(s) ?? "top";
    setGap(enterSide);
  };

  const applyPhysics = () => {
    const s = settings();
    const restitution = clamp(finite(s.bounce, 0.3), 0, 0.95);
    const friction = clamp(finite(s.friction, 0.3), 0, 1);
    const frictionAir = clamp(finite(s.airFriction, 0.012), 0, 0.2);
    for (const p of list) {
      const b = p.body;
      if (!b) continue;
      b.restitution = restitution;
      b.friction = friction;
      b.frictionAir = frictionAir;
      Sleeping.set(b, false);
    }
    if (s.paused && drag?.constraint) endDrag(true);
    setGap(desiredGap(s));
  };

  const step = (s: Settings) => {
    clock += STEP;
    for (const p of list)
      if (!p.spawned && p.spawnAt <= clock) spawn(p);
    for (const p of list) {
      const b = p.body;
      if (!b) continue;
      p.px = b.position.x;
      p.py = b.position.y;
      p.pa = b.angle;
    }
    const g = gravityOf(s);
    engine.gravity.x = g.x;
    engine.gravity.y = g.y;
    const drift = s.reduced ? 0 : clamp(finite(s.drift, 0), 0, 2);
    if (drift > 0) {
      const t = clock;
      const strength = 4e-5 * drift * unit;
      for (const p of list) {
        const b = p.body;
        if (!b) continue;
        const phase = p.index * 1.73;
        Body.applyForce(b, b.position, {
          x:
            b.mass *
            strength *
            (Math.sin(t * 0.00071 + phase) + 0.5 * Math.sin(t * 0.0013 + phase * 2.1)),
          y:
            b.mass *
            strength *
            (Math.cos(t * 0.00063 + phase * 1.4) + 0.5 * Math.cos(t * 0.0011 + phase * 0.7)),
        });
      }
    }
    if (drag?.piece.body) Sleeping.set(drag.piece.body, false);
    Engine.update(engine, STEP);
    markEntered();
    const loose = 38 * Math.sqrt(unit) + 8;
    const calm = 24 * Math.sqrt(unit) + 4;
    for (const p of list) {
      const b = p.body;
      if (!b || b.isSleeping) continue;
      const limit = p.flung > clock || drag?.piece === p ? loose : calm;
      if (
        !Number.isFinite(b.position.x) ||
        !Number.isFinite(b.position.y) ||
        b.position.x < -width * 2.5 ||
        b.position.x > width * 3.5 ||
        b.position.y < -height * 2.5 ||
        b.position.y > height * 3.5
      ) {
        respawn(p);
        continue;
      }
      if (p.kind === "circle") {
        const spinning = Body.getAngularVelocity(b);
        if (spinning !== 0) Body.setAngularVelocity(b, spinning * 0.996);
      }
      const speed = Body.getSpeed(b);
      if (speed > limit) {
        const v = Body.getVelocity(b);
        Body.setVelocity(b, { x: (v.x * limit) / speed, y: (v.y * limit) / speed });
      }
    }
    if (entering && enterSide && list.every((p) => p.spawned)) {
      if (list.every((p) => p.body?.collisionFilter.category !== ENTERING_CATEGORY)) {
        entering = false;
        enterSide = null;
      }
    }
    setGap(desiredGap(s));
  };

  const tickScales = (dt: number, s: Settings) => {
    const k = s.reduced ? 1 : 1 - Math.exp(-dt * 15);
    for (const p of list) {
      if (!p.spawned) continue;
      const target = targetOf(p);
      const d = target - p.scale;
      p.scale = Math.abs(d) < 0.0006 ? target : p.scale + d * k;
    }
  };

  const needsFrame = (s: Settings) => {
    if (destroyed || !visible || document.hidden) return false;
    if (drag) return true;
    for (const p of list)
      if (p.spawned && Math.abs(targetOf(p) - p.scale) > 0.0006) return true;
    if (s.paused || !started) return false;
    if (list.some((p) => !p.spawned)) return true;
    if (!s.reduced && finite(s.drift, 0) > 0) return true;
    return list.some((p) => p.body !== null && !p.body.isSleeping);
  };

  const frame = (time: number) => {
    raf = 0;
    if (destroyed) return;
    const dt =
      last && time - last < 100
        ? Math.min(Math.max((time - last) / 1000, 0), 0.05)
        : 1 / 60;
    last = time;
    const s = settings();
    let alpha = 1;
    if (!s.paused && started) {
      acc += dt * 1000;
      let steps = 0;
      while (acc >= STEP && steps < 6) {
        step(s);
        acc -= STEP;
        steps += 1;
      }
      if (steps >= 6) acc = 0;
      alpha = acc / STEP;
    }
    tickScales(dt, s);
    for (const p of list) if (p.spawned) place(p, alpha);
    placeTip();
    if (needsFrame(s)) raf = requestAnimationFrame(frame);
    else {
      last = 0;
      acc = 0;
      for (const p of list) if (p.spawned) place(p, 1);
      placeTip();
    }
  };

  function schedule() {
    if (!raf && needsFrame(settings())) raf = requestAnimationFrame(frame);
  }

  function endDrag(cancelled: boolean) {
    const d = drag;
    if (!d) return;
    drag = null;
    if (d.constraint) Composite.remove(engine.world, d.constraint);
    const p = d.piece;
    const b = p.body;
    const s = settings();
    if (b && p.mass > 0) Body.setMass(b, p.mass);
    p.node.style.removeProperty("--tw-lift");
    p.node.style.cursor = "";
    stage.style.cursor = "";
    if (b) {
      Sleeping.set(b, false);
      if (!cancelled && d.moved && !s.paused) {
        if (s.reduced) {
          Body.setVelocity(b, { x: 0, y: 0 });
          Body.setAngularVelocity(b, 0);
        } else {
          const k = clamp(finite(s.throwStrength, 1), 0, 3);
          const v = Body.getVelocity(b);
          let vx = v.x * k;
          let vy = v.y * k;
          const m = Math.hypot(vx, vy);
          const max = 34 * Math.sqrt(unit) + 8;
          if (m > max) {
            vx *= max / m;
            vy *= max / m;
          }
          Body.setVelocity(b, { x: vx, y: vy });
          Body.setAngularVelocity(
            b,
            clamp(Body.getAngularVelocity(b) * Math.min(1, k), -0.32, 0.32),
          );
          p.flung = clock + 700;
        }
      }
    }
    if (d.moved) {
      suppress = true;
      window.setTimeout(() => {
        suppress = false;
      }, 0);
    }
    if (stage.hasPointerCapture(d.id)) stage.releasePointerCapture(d.id);
    raise(p, hovered === p || focused === p);
    refresh();
  }

  const hop = (p: Piece) => {
    const s = settings();
    const b = p.body;
    const force = clamp(finite(s.popForce, 1), 0, 3);
    if (!b || s.reduced || s.paused || force <= 0) return;
    const down = downOf(s);
    const v = Body.getVelocity(b);
    const lift = 6.4 * force * Math.sqrt(unit);
    const side = (hash(clock * 0.37 + p.index) - 0.5) * 2.4 * Math.sqrt(unit);
    Body.setVelocity(b, {
      x: v.x * 0.3 - down.x * lift - down.y * side,
      y: v.y * 0.3 - down.y * lift + down.x * side,
    });
    Body.setAngularVelocity(
      b,
      (hash(clock * 0.11 + p.index * 1.3) - 0.5) * 0.16 * force,
    );
    Sleeping.set(b, false);
    schedule();
  };

  const popAt = (x: number, y: number, strength: number) => {
    const s = settings();
    if (s.reduced || s.paused || !(strength > 0)) return;
    const down = downOf(s);
    const reach = avgSpan * 2.8;
    for (const p of list) {
      const b = p.body;
      if (!b || !p.spawned) continue;
      const dx = b.position.x - x;
      const dy = b.position.y - y;
      const distance = Math.max(0, Math.hypot(dx, dy) - p.reach * 0.8);
      if (distance > reach) continue;
      const falloff = (1 - distance / reach) ** 1.5;
      const side = clamp((dx * -down.y + dy * down.x) / reach, -1, 1);
      const nx = -down.x - down.y * side * 1.2;
      const ny = -down.y + down.x * side * 1.2;
      const m = Math.hypot(nx, ny) || 1;
      const speed = 11 * strength * Math.sqrt(unit) * falloff;
      const v = Body.getVelocity(b);
      Body.setVelocity(b, {
        x: v.x * 0.4 + (nx / m) * speed,
        y: v.y * 0.4 + (ny / m) * speed,
      });
      Body.setAngularVelocity(
        b,
        Body.getAngularVelocity(b) + side * falloff * 0.12 * strength,
      );
      Sleeping.set(b, false);
    }
    schedule();
  };

  const shakeAll = (strength: number) => {
    const s = settings();
    if (s.reduced || s.paused || !(strength > 0)) return;
    const down = downOf(s);
    const k = clamp(strength, 0, 3) * Math.sqrt(unit);
    for (const p of list) {
      const b = p.body;
      if (!b) continue;
      const v = Body.getVelocity(b);
      const sway = (hash(p.index * 4.1 + clock * 0.01) - 0.5) * 7 * k;
      const lift = (3.5 + hash(p.index * 2.2 + clock * 0.02) * 4.5) * k;
      Body.setVelocity(b, {
        x: v.x + sway - down.x * lift,
        y: v.y - down.y * lift + down.x * sway * 0.2,
      });
      Body.setAngularVelocity(
        b,
        Body.getAngularVelocity(b) + (hash(p.index * 6.7 + clock) - 0.5) * 0.2 * k,
      );
      Sleeping.set(b, false);
    }
    schedule();
  };

  const nudge = (p: Piece, dx: number, dy: number) => {
    const s = settings();
    const b = p.body;
    if (!b) return;
    if (s.paused || s.reduced) {
      const distance = 18 * Math.sqrt(unit);
      const at = clampInside(p, b.position.x + dx * distance, b.position.y + dy * distance);
      Body.setPosition(b, at);
      Body.setVelocity(b, { x: 0, y: 0 });
      p.px = at.x;
      p.py = at.y;
      place(p, 1);
      placeTip();
      Sleeping.set(b, false);
      schedule();
      return;
    }
    const v = Body.getVelocity(b);
    const k = 5.5 * Math.sqrt(unit);
    Body.setVelocity(b, { x: v.x + dx * k, y: v.y + dy * k * (dy < 0 ? 1.35 : 1) });
    Body.setAngularVelocity(b, Body.getAngularVelocity(b) + dx * 0.04);
    Sleeping.set(b, false);
    schedule();
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!event.isPrimary || drag) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const s = settings();
    const p = pieceOf(event.target);
    const at = local(event);
    if (p && p.body && p.spawned && s.draggable) {
      const b = p.body;
      zTop += 1;
      p.z = zTop;
      p.node.style.zIndex = String(zTop + 1);
      let constraint: Constraint | null = null;
      if (!s.paused) {
        constraint = Constraint.create({
          pointA: { x: at.x, y: at.y },
          bodyB: b,
          pointB: { x: at.x - b.position.x, y: at.y - b.position.y },
          length: 0,
          stiffness: clamp(finite(s.dragStiffness, 0.2), 0.02, 0.9),
          damping: 0.08,
        });
        Composite.add(engine.world, constraint);
      }
      Sleeping.set(b, false);
      p.mass = b.mass;
      Body.setMass(b, b.mass * 0.3);
      drag = {
        id: event.pointerId,
        piece: p,
        constraint,
        ox: at.x - b.position.x,
        oy: at.y - b.position.y,
        sx: at.x,
        sy: at.y,
        time: performance.now(),
        moved: false,
        touch: event.pointerType !== "mouse",
      };
      tap = null;
      p.node.style.setProperty("--tw-lift", "1");
      p.node.style.cursor = "grabbing";
      stage.style.cursor = "grabbing";
      stage.setPointerCapture(event.pointerId);
      refresh();
      return;
    }
    tap = { id: event.pointerId, x: at.x, y: at.y, time: performance.now() };
    tapPiece = p && p.spawned ? p : null;
  };

  const showTapped = (p: Piece) => {
    tapped = p;
    window.clearTimeout(tapTimer);
    tapTimer = window.setTimeout(() => {
      if (tapped === p) {
        tapped = null;
        refresh();
      }
    }, 1600);
    refresh();
  };

  const onPointerMove = (event: PointerEvent) => {
    const d = drag;
    if (d && event.pointerId === d.id) {
      const at = local(event);
      if (!d.moved && Math.hypot(at.x - d.sx, at.y - d.sy) > 6) d.moved = true;
      const x = clamp(at.x, 0, width);
      const y = clamp(at.y, 0, height);
      const b = d.piece.body;
      if (d.constraint) {
        d.constraint.pointA = { x, y };
        if (b) Sleeping.set(b, false);
      } else if (b) {
        const target = clampInside(d.piece, x - d.ox, y - d.oy);
        Body.setPosition(b, target);
        Body.setVelocity(b, { x: 0, y: 0 });
        d.piece.px = target.x;
        d.piece.py = target.y;
        place(d.piece, 1);
        placeTip();
      }
      schedule();
      return;
    }
    if (tap && event.pointerId === tap.id) {
      const at = local(event);
      if (Math.hypot(at.x - tap.x, at.y - tap.y) > 8) tap = null;
    }
    if (event.pointerType === "touch") return;
    const p = pieceOf(event.target);
    const next = p && p.spawned ? p : null;
    if (next !== hovered) {
      if (hovered) raise(hovered, focused === hovered);
      hovered = next;
      if (next) raise(next, true);
      refresh();
    }
  };

  const onPointerUp = (event: PointerEvent) => {
    const d = drag;
    if (d && event.pointerId === d.id) {
      const quick = !d.moved && performance.now() - d.time < 450;
      endDrag(false);
      if (quick) {
        hop(d.piece);
        if (d.touch) showTapped(d.piece);
      }
      return;
    }
    const t = tap;
    if (t && event.pointerId === t.id) {
      tap = null;
      if (performance.now() - t.time > 600) return;
      if (tapPiece) {
        hop(tapPiece);
        if (event.pointerType !== "mouse") showTapped(tapPiece);
      } else popAt(t.x, t.y, clamp(finite(settings().popForce, 1), 0, 3));
    }
  };

  const onPointerCancel = (event: PointerEvent) => {
    if (drag && event.pointerId === drag.id) endDrag(true);
    if (tap && event.pointerId === tap.id) tap = null;
  };

  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType === "touch" || drag) return;
    if (hovered) {
      raise(hovered, focused === hovered);
      hovered = null;
      refresh();
    }
  };

  const onClick = (event: MouseEvent) => {
    const node = itemOf(event.target);
    if (!node) return;
    if (suppress) {
      suppress = false;
      event.preventDefault();
      return;
    }
    const p = byNode.get(node);
    if (!p) return;
    if (event.detail === 0) hop(p);
    pickRef.current(p.index);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && drag) {
      endDrag(true);
      return;
    }
    const p = pieceOf(event.target);
    if (!p) return;
    const direction =
      event.key === "ArrowLeft"
        ? [-1, 0]
        : event.key === "ArrowRight"
          ? [1, 0]
          : event.key === "ArrowUp"
            ? [0, -1]
            : event.key === "ArrowDown"
              ? [0, 1]
              : null;
    if (!direction) return;
    event.preventDefault();
    nudge(p, direction[0], direction[1]);
  };

  const onFocusIn = (event: FocusEvent) => {
    const node = itemOf(event.target);
    const p = node ? byNode.get(node) : undefined;
    if (!node || !p) return;
    let keyboard = true;
    try {
      keyboard = node.matches(":focus-visible");
    } catch {
      keyboard = true;
    }
    if (!keyboard) return;
    node.style.outline = "2px solid currentColor";
    node.style.outlineOffset = "3px";
    focused = p;
    raise(p, true);
    refresh();
  };

  const onFocusOut = (event: FocusEvent) => {
    const node = itemOf(event.target);
    if (!node) return;
    node.style.outline = "";
    node.style.outlineOffset = "";
    const p = byNode.get(node);
    if (p && focused === p) {
      focused = null;
      raise(p, hovered === p);
      refresh();
    }
  };

  const onScroll = () => {
    if (stage.scrollTop || stage.scrollLeft) {
      stage.scrollTop = 0;
      stage.scrollLeft = 0;
    }
  };

  const onBlur = () => {
    if (drag) endDrag(true);
  };

  const onVisibility = () => {
    last = 0;
    schedule();
  };

  const markSeen = () => {
    if (seen) return;
    seen = true;
    if (!ready)
      readyTimer = window.setTimeout(() => {
        ready = true;
        maybeBegin();
      }, 1500);
    maybeBegin();
  };

  const resizeObserver = new ResizeObserver(() => {
    if (!measure()) return;
    build(true);
    maybeBegin();
    schedule();
  });

  const intersection = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        visible = entry.isIntersecting;
        if (
          entry.isIntersecting &&
          (entry.intersectionRatio >= 0.15 ||
            entry.intersectionRect.height >
              (entry.rootBounds?.height ?? window.innerHeight) * 0.3)
        )
          markSeen();
      }
      schedule();
    },
    { threshold: [0, 0.05, 0.15, 0.3, 0.6] },
  );

  stage.addEventListener("pointerdown", onPointerDown);
  stage.addEventListener("pointermove", onPointerMove);
  stage.addEventListener("pointerup", onPointerUp);
  stage.addEventListener("pointercancel", onPointerCancel);
  stage.addEventListener("lostpointercapture", onPointerCancel);
  stage.addEventListener("pointerleave", onPointerLeave);
  stage.addEventListener("click", onClick);
  stage.addEventListener("keydown", onKeyDown);
  stage.addEventListener("focusin", onFocusIn);
  stage.addEventListener("focusout", onFocusOut);
  stage.addEventListener("scroll", onScroll);
  view.addEventListener("blur", onBlur);
  document.addEventListener("visibilitychange", onVisibility);

  measure();
  structure = structureOf(settings());
  physics = physicsOf(settings());
  build(false);
  resizeObserver.observe(stage);
  intersection.observe(stage);
  const onFonts = () => {
    if (!destroyed && list.some((p) => p.kind === "chip")) build(true);
  };
  stage.ownerDocument.fonts?.addEventListener("loadingdone", onFonts);
  stage.ownerDocument.fonts?.ready.then(onFonts);

  return {
    sync: () => {
      const s = settings();
      const nextStructure = structureOf(s);
      if (nextStructure !== structure) {
        structure = nextStructure;
        build(true);
        maybeBegin();
      }
      const nextPhysics = physicsOf(s);
      if (nextPhysics !== physics) {
        physics = nextPhysics;
        applyPhysics();
      }
      refresh();
    },
    drop: () => {
      if (!seen || !ready) return;
      begin();
      schedule();
    },
    shake: (strength = 1) => shakeAll(strength),
    pop: (x, y, strength) =>
      popAt(x, y, clamp(finite(strength ?? settings().popForce, 1), 0, 3)),
    destroy: () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(tapTimer);
      window.clearTimeout(readyTimer);
      resizeObserver.disconnect();
      intersection.disconnect();
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", onPointerUp);
      stage.removeEventListener("pointercancel", onPointerCancel);
      stage.removeEventListener("lostpointercapture", onPointerCancel);
      stage.removeEventListener("pointerleave", onPointerLeave);
      stage.removeEventListener("click", onClick);
      stage.removeEventListener("keydown", onKeyDown);
      stage.removeEventListener("focusin", onFocusIn);
      stage.removeEventListener("focusout", onFocusOut);
      stage.removeEventListener("scroll", onScroll);
      view.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      stage.ownerDocument.fonts?.removeEventListener("loadingdone", onFonts);
      for (const img of watched) {
        img.removeEventListener("load", onImage);
        img.removeEventListener("error", onImage);
      }
      if (drag?.constraint) Composite.remove(engine.world, drag.constraint);
      drag = null;
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      list = [];
      byNode.clear();
    },
  };
}

const shadowOf = (amount: number) =>
  amount <= 0
    ? "none"
    : `0 1px 1.5px rgb(0 0 0 / ${(0.16 * amount).toFixed(3)}), 0 4px 8px -2px rgb(0 0 0 / ${(0.16 * amount).toFixed(3)}), 0 12px 26px -8px rgb(0 0 0 / ${(0.3 * amount).toFixed(3)})`;

const liftOf = (amount: number) => {
  const a = Math.max(amount, 0.4);
  return `0 22px 40px -12px rgb(0 0 0 / ${(0.42 * a).toFixed(3)}), 0 8px 16px -6px rgb(0 0 0 / ${(0.2 * a).toFixed(3)})`;
};

const visuallyHidden: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export const TumbleWall = forwardRef<TumbleWallHandle, TumbleWallProps>(
  function TumbleWall(
    {
      items = defaultItems,
      count = 24,
      shape = "circle",
      size = 116,
      sizeVariance = 0.4,
      fill = 0.4,
      radius = 18,
      frame = "none",
      frameWidth = 6,
      frameColor = "#FFFFFF",
      textColor = "#0A0A0A",
      backgroundColor = "transparent",
      shadow = 0.5,
      showTitles = true,
      monochrome = false,
      hoverScale = 1.06,
      gravity = 1,
      gravityX = 0,
      bounce = 0.32,
      friction = 0.3,
      airFriction = 0.012,
      spin = 0.5,
      drift = 0,
      entrance = "rain",
      stagger = 55,
      draggable = true,
      dragStiffness = 0.2,
      throwStrength = 1,
      popForce = 1,
      contain = true,
      paused = false,
      ariaLabel = "Photo pile",
      onSelect,
      className,
      style,
    },
    ref,
  ) {
    const stageRef = useRef<HTMLDivElement>(null);
    const tipRef = useRef<HTMLDivElement>(null);
    const controllerRef = useRef<Controller | null>(null);
    const reduced = useSyncExternalStore(subscribeToMotion, readMotion, () => false);
    const hintId = useId();
    const source = items;
    const total = source.length
      ? clamp(Math.round(finite(count, 24)), 1, 80)
      : 0;
    const safeShape = SHAPES.includes(shape) ? shape : "circle";
    const safeFrame = FRAMES.includes(frame) ? frame : "none";
    const safeEntrance = ENTRANCES.includes(entrance) ? entrance : "rain";

    const settings: Settings = {
      items: source,
      count: total,
      shape: safeShape,
      size,
      sizeVariance,
      fill,
      radius,
      frame: safeFrame,
      frameWidth,
      showTitles,
      hoverScale,
      gravity,
      gravityX,
      bounce,
      friction,
      airFriction,
      spin,
      drift,
      entrance: safeEntrance,
      stagger,
      draggable,
      dragStiffness,
      throwStrength,
      popForce,
      contain,
      paused,
      reduced,
    };
    const settingsRef = useRef(settings);
    const pickRef = useRef((index: number) => {
      onSelect?.(source[index % source.length], index);
    });

    useEffect(() => {
      settingsRef.current = settings;
      pickRef.current = (index: number) => {
        if (source.length) onSelect?.(source[index % source.length], index);
      };
      controllerRef.current?.sync();
    });

    useEffect(() => {
      const stage = stageRef.current;
      const tip = tipRef.current;
      if (!stage || !tip) return;
      const controller = createWall(stage, tip, settingsRef, pickRef);
      controllerRef.current = controller;
      return () => {
        controller.destroy();
        controllerRef.current = null;
      };
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        drop: () => controllerRef.current?.drop(),
        shake: (strength?: number) => controllerRef.current?.shake(strength),
        pop: (x: number, y: number, strength?: number) =>
          controllerRef.current?.pop(x, y, strength),
      }),
      [],
    );

    const backgroundValue = backgroundColor.trim().toLowerCase();
    const transparent =
      backgroundValue === "transparent" || backgroundValue === "";
    const shadowAmount = clamp(finite(shadow, 0.5), 0, 1);
    const placeholder = "color-mix(in oklch, currentColor 10%, transparent)";
    const chipPlaceholder = `color-mix(in oklch, ${textColor} 12%, transparent)`;
    const imageStyle: CSSProperties = {
      display: "block",
      width: "100%",
      height: "100%",
      objectFit: "cover",
      opacity: 0,
      transition: "opacity 0.5s ease, filter 0.45s ease",
      filter: monochrome ? "grayscale(var(--tw-mono, 1))" : undefined,
      pointerEvents: "none",
      userSelect: "none",
    };
    const liftStyle: CSSProperties = {
      position: "absolute",
      inset: 0,
      zIndex: -1,
      borderRadius: "inherit",
      boxShadow: liftOf(shadowAmount),
      opacity: "var(--tw-lift, 0)",
      transition: "opacity 0.3s ease",
      pointerEvents: "none",
    };

    const nodes: ReactNode[] = [];
    for (let index = 0; index < total; index += 1) {
      const item = source[index % source.length];
      const kind = kindAt(safeShape, index);
      const label = item.title ?? item.alt ?? "";
      const name =
        [item.title, item.alt].filter(Boolean).join(", ") || `Item ${index + 1}`;
      const chip = kind === "chip";
      const framed = !chip && safeFrame !== "none";
      const caption =
        safeFrame === "polaroid" && kind !== "circle" && showTitles && item.title;
      const itemStyle: CSSProperties = {
        position: "absolute",
        left: 0,
        top: 0,
        boxSizing: "border-box",
        display: chip ? "flex" : "block",
        alignItems: chip ? "center" : undefined,
        gap: chip && item.src ? "calc(var(--tw-f, 13px) * 0.62)" : undefined,
        width: chip ? "var(--tw-w, max-content)" : "var(--tw-w, 0px)",
        height: "var(--tw-h, 0px)",
        margin: 0,
        padding: chip
          ? item.src
            ? "0 calc(var(--tw-f, 13px) * 1.1) 0 var(--tw-p, 4px)"
            : "0 calc(var(--tw-f, 13px) * 1.1) 0 calc(var(--tw-f, 13px) * 1.15)"
          : framed
            ? "var(--tw-fw, 0px) var(--tw-fw, 0px) var(--tw-b, 0px)"
            : 0,
        border: 0,
        borderRadius: "var(--tw-r, 0px)",
        background: chip || framed ? frameColor : "none",
        color: "inherit",
        font: "inherit",
        fontSize: chip ? "var(--tw-f, 13px)" : undefined,
        fontWeight: chip ? 500 : undefined,
        lineHeight: chip ? 1 : undefined,
        letterSpacing: chip ? "-0.01em" : undefined,
        whiteSpace: chip ? "nowrap" : undefined,
        textAlign: "left",
        textDecoration: "none",
        cursor: draggable ? "grab" : "pointer",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTapHighlightColor: "transparent",
        visibility: "hidden",
        willChange: "transform",
        boxShadow: shadowOf(shadowAmount),
      };
      const content = chip ? (
        <>
          {item.src ? (
            <span
              style={{
                position: "relative",
                flex: "none",
                width: "calc(var(--tw-h, 40px) - var(--tw-p, 4px) * 2)",
                height: "calc(var(--tw-h, 40px) - var(--tw-p, 4px) * 2)",
                borderRadius: "50%",
                overflow: "hidden",
                background: chipPlaceholder,
                pointerEvents: "none",
              }}
            >
              <img
                src={item.src}
                alt=""
                draggable={false}
                decoding="async"
                style={imageStyle}
              />
            </span>
          ) : null}
          <span
            style={{
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: textColor,
              pointerEvents: "none",
            }}
          >
            {label}
          </span>
          <span aria-hidden="true" style={liftStyle} />
        </>
      ) : (
        <>
          <span
            style={{
              position: "relative",
              display: "block",
              width: "100%",
              height: "100%",
              overflow: "hidden",
              borderRadius: "var(--tw-ri, 0px)",
              background: item.src ? placeholder : frameColor,
              pointerEvents: "none",
            }}
          >
            {item.src ? (
              <img
                src={item.src}
                alt=""
                draggable={false}
                decoding="async"
                style={imageStyle}
              />
            ) : (
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: "100%",
                  height: "100%",
                  padding: "0 10%",
                  boxSizing: "border-box",
                  color: textColor,
                  fontSize: "calc(var(--tw-w, 100px) * 0.12)",
                  fontWeight: 500,
                  lineHeight: 1.15,
                  textAlign: "center",
                }}
              >
                {label}
              </span>
            )}
            {safeFrame === "none" ? (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "inherit",
                  boxShadow:
                    "inset 0 0 0 1px color-mix(in oklch, currentColor 14%, transparent)",
                }}
              />
            ) : null}
          </span>
          {caption ? (
            <span
              style={{
                position: "absolute",
                left: "var(--tw-fw, 0px)",
                right: "var(--tw-fw, 0px)",
                bottom: 0,
                height: "var(--tw-b, 0px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                color: textColor,
                opacity: 0.72,
                fontSize: "var(--tw-f, 12px)",
                fontWeight: 500,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              {item.title}
            </span>
          ) : null}
          <span aria-hidden="true" style={liftStyle} />
        </>
      );
      const shared = {
        "data-tw-item": index,
        "data-tw-title": item.title ?? "",
        "data-tw-label": chip ? label : undefined,
        "aria-label": name,
        "aria-describedby": hintId,
        draggable: false,
        style: itemStyle,
      };
      nodes.push(
        item.href ? (
          <a key={index} href={item.href} {...shared}>
            {content}
          </a>
        ) : (
          <button key={index} type="button" {...shared}>
            {content}
          </button>
        ),
      );
    }

    return (
      <div
        role="group"
        aria-label={ariaLabel}
        className={cn(
          "relative isolate h-full min-h-[360px] w-full overflow-hidden",
          className,
        )}
        style={{
          backgroundColor: transparent ? undefined : backgroundColor,
          ...style,
        }}
      >
        <div
          ref={stageRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            overflow: "hidden",
            touchAction: "pan-y",
          }}
        >
          {nodes}
        </div>
        <div
          ref={tipRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            zIndex: 1,
            padding: "5px 9px",
            borderRadius: 8,
            background: frameColor,
            color: textColor,
            fontSize: 12,
            lineHeight: "16px",
            fontWeight: 500,
            letterSpacing: "-0.005em",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            opacity: 0,
            transition: "opacity 0.18s ease",
            boxShadow: "0 6px 18px -6px rgb(0 0 0 / 0.35)",
            willChange: "transform, opacity",
          }}
        />
        <span id={hintId} style={visuallyHidden}>
          {draggable ? "Drag to throw. Arrow keys nudge." : "Arrow keys nudge."}
        </span>
      </div>
    );
  },
);

TumbleWall.displayName = "TumbleWall";

export default TumbleWall;

