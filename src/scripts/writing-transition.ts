import { animate, type AnimationPlaybackControlsWithThen } from "motion";

type WritingState = "closed" | "opening" | "open" | "closing";

interface WritingSource {
  folder: HTMLElement;
  items: HTMLElement[];
}

interface Pose {
  x: number;
  y: number;
  scale: number;
  rotate: number;
}

interface Size {
  width: number;
  height: number;
}

const paperSpring = { type: "spring", duration: 0.42, bounce: 0.08 } as const;
const homeSpring = { type: "spring", duration: 0.38, bounce: 0.06 } as const;
const easeOut = [0.23, 1, 0.32, 1] as const;

const transformFor = ({ x, y, scale, rotate }: Pose) =>
  `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotate}deg)`;

const sizeOf = (element: HTMLElement): Size => {
  const style = getComputedStyle(element);
  return {
    width: Number.parseFloat(style.width),
    height: Number.parseFloat(style.height),
  };
};

const poseOf = (element: HTMLElement, size: Size): Pose => {
  const rect = element.getBoundingClientRect();
  const matrix = new DOMMatrix(getComputedStyle(element).transform);
  return {
    x: rect.left + rect.width / 2 - size.width / 2,
    y: rect.top + rect.height / 2 - size.height / 2,
    scale: Math.hypot(matrix.a, matrix.b),
    rotate: (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI,
  };
};

const readingPose = (target: HTMLElement, size: Size): Pose => {
  const rect = target.getBoundingClientRect();
  const scale = Math.min(
    (rect.width * 0.32) / size.width,
    (Math.max(rect.height, 76) * 1.25) / size.height,
    1.35,
  );
  return {
    x: rect.left + rect.width / 2 - size.width / 2,
    y: rect.top + rect.height / 2 - size.height / 2,
    scale,
    rotate: 0,
  };
};

/** Carries the folder's paper into the Writing list and back again. */
export function createWritingTransition(overlay: HTMLElement) {
  const target = overlay.querySelector<HTMLElement>("[data-writing-paper-target]");
  const reveals = [
    ...overlay.querySelectorAll<HTMLElement>("[data-writing-reveal]"),
  ];
  const layer = document.createElement("div");
  layer.className = "writing-flight-layer";
  document.body.appendChild(layer);

  let state: WritingState = "closed";
  let generation = 0;
  let source: WritingSource | null = null;
  let paper: HTMLElement | null = null;
  let flight: AnimationPlaybackControlsWithThen | null = null;

  const setState = (next: WritingState) => {
    state = next;
    overlay.dataset.writingState = next;
    const visible = next !== "closed";
    overlay.classList.toggle("is-open", visible);
    overlay.setAttribute("aria-hidden", String(!visible));
    overlay.inert = !visible;
  };

  const clearPaper = () => {
    flight?.stop();
    flight = null;
    paper?.remove();
    paper = null;
  };

  const makePaper = (item: HTMLElement, size: Size, pose: Pose) => {
    const node = item.cloneNode(true) as HTMLElement;
    node.removeAttribute("data-folder-item");
    node.classList.add("writing-flight");
    Object.assign(node.style, {
      position: "fixed",
      inset: "0 auto auto 0",
      width: `${size.width}px`,
      height: `${size.height}px`,
      margin: "0",
      opacity: "1",
      pointerEvents: "none",
      transform: transformFor(pose),
      transformOrigin: "center",
      willChange: "transform, opacity, filter",
    });
    layer.appendChild(node);
    return node;
  };

  const hideReveals = () =>
    reveals.forEach((item) =>
      animate(item, { opacity: 0, transform: "translate3d(0, 8px, 0)" }, { duration: 0 }),
    );

  const open = async (nextSource: WritingSource) => {
    if (!target || !nextSource.items[0]) return false;
    const run = ++generation;
    source = nextSource;
    clearPaper();
    hideReveals();

    const item = source.items[0];
    const size = sizeOf(item);
    const start = poseOf(item, size);
    const end = readingPose(target, size);
    paper = makePaper(item, size, start);
    source.folder.classList.add("is-writing-source-hidden");
    setState("opening");

    flight = animate(paper, { transform: transformFor(end) }, paperSpring);
    reveals.forEach((reveal, index) =>
      animate(
        reveal,
        { opacity: 1, transform: "translate3d(0, 0, 0)" },
        { duration: 0.24, ease: easeOut, delay: 0.1 + index * 0.045 },
      ),
    );
    const fade = animate(
      paper,
      { opacity: 0, filter: "blur(2px)" },
      { duration: 0.14, ease: easeOut, delay: 0.27 },
    );

    await Promise.all([
      flight.finished.catch(() => undefined),
      fade.finished.catch(() => undefined),
    ]);
    if (run !== generation || state !== "opening") return false;
    source.folder.classList.add("is-landed");
    clearPaper();
    setState("open");
    return true;
  };

  const close = async () => {
    if (!source || !target || !source.items[0] || state === "closed") return false;
    const run = ++generation;
    const item = source.items[0];
    const size = sizeOf(item);
    const start = readingPose(target, size);
    const end = poseOf(item, size);

    clearPaper();
    paper = makePaper(item, size, start);
    paper.style.opacity = "0";
    paper.style.filter = "blur(2px)";
    source.folder.classList.remove("is-landed");
    setState("closing");

    reveals.forEach((reveal, index) =>
      animate(
        reveal,
        { opacity: 0, transform: "translate3d(0, 6px, 0)" },
        { duration: 0.14, ease: easeOut, delay: index * 0.018 },
      ),
    );
    await animate(
      paper,
      { opacity: 1, filter: "blur(0px)" },
      { duration: 0.1, ease: easeOut },
    ).finished.catch(() => undefined);

    flight = animate(paper, { transform: transformFor(end) }, homeSpring);
    await flight.finished.catch(() => undefined);
    if (run !== generation || state !== "closing") return false;

    source.folder.classList.remove("is-writing-source-hidden");
    clearPaper();
    setState("closed");
    return true;
  };

  setState("closed");
  return { open, close };
}
