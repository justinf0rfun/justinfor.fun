import { animate, type AnimationPlaybackControlsWithThen } from "motion";

type ProjectState = "closed" | "opening" | "open" | "closing";

interface ProjectSource {
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

interface Flight {
  node: HTMLElement;
  control: AnimationPlaybackControlsWithThen;
}

const stageSpring = { type: "spring", duration: 0.55, bounce: 0.18 } as const;
const homeSpring = { type: "spring", duration: 0.5, bounce: 0.12 } as const;

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

const targetPose = (target: HTMLElement, size: Size): Pose => {
  const rect = target.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - size.width / 2,
    y: rect.top + rect.height / 2 - size.height / 2,
    scale: rect.width / size.width,
    rotate: 0,
  };
};

/**
 * Owns the Projects-only transition. Persistent folder and page content never
 * trade animation state; disposable clones are the only moving elements.
 */
export function createProjectsTransition(overlay: HTMLElement) {
  const targets = [
    ...overlay.querySelectorAll<HTMLElement>("[data-project-visual-target]"),
  ];
  const reveals = [
    ...overlay.querySelectorAll<HTMLElement>("[data-project-reveal]"),
  ];
  const layer = document.createElement("div");
  layer.className = "project-flight-layer";
  document.body.appendChild(layer);

  let state: ProjectState = "closed";
  let generation = 0;
  let source: ProjectSource | null = null;
  let flights: Flight[] = [];

  const clearLegacyStyles = () => {
    targets.forEach((target) => target.style.removeProperty("opacity"));
    reveals.forEach((item) => {
      item.style.removeProperty("opacity");
      item.style.removeProperty("transform");
    });
  };

  const setState = (next: ProjectState) => {
    state = next;
    overlay.dataset.projectState = next;
    const visible = next !== "closed";
    overlay.classList.toggle("is-open", visible);
    overlay.setAttribute("aria-hidden", String(!visible));
    overlay.inert = !visible;
  };

  const stopFlights = () => {
    flights.forEach(({ control, node }) => {
      control.stop();
      node.remove();
    });
    flights = [];
    layer.replaceChildren();
  };

  const makeFlight = (item: HTMLElement, size: Size, pose: Pose, index: number) => {
    const node = item.cloneNode(true) as HTMLElement;
    node.removeAttribute("data-folder-item");
    node.classList.add("project-flight");
    node.querySelectorAll("img").forEach((image) => (image.loading = "eager"));
    Object.assign(node.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: `${size.width}px`,
      height: `${size.height}px`,
      margin: "0",
      opacity: "1",
      pointerEvents: "none",
      transform: transformFor(pose),
      transformOrigin: "center",
      willChange: "transform",
      zIndex: String(index + 1),
    });
    layer.appendChild(node);
    return node;
  };

  const fly = (node: HTMLElement, pose: Pose, transition: object) =>
    animate(node, { transform: transformFor(pose) }, transition);

  const settleFlights = async (poses: Pose[]) => {
    flights.forEach(({ node, control }, index) => {
      control.stop();
      node.style.transform = transformFor(poses[index]);
    });
    // The first callback runs before paint. Waiting for the following callback
    // guarantees one painted frame at the exact destination before handoff.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  };

  const open = async (nextSource: ProjectSource) => {
    const run = ++generation;
    source = nextSource;
    stopFlights();
    clearLegacyStyles();

    const sizes = source.items.map(sizeOf);
    const startPoses = source.items.map((item, index) => poseOf(item, sizes[index]));
    const endPoses = source.items.map((item, index) =>
      targets[index] ? targetPose(targets[index], sizes[index]) : startPoses[index],
    );

    flights = source.items.map((item, index) => {
      const node = makeFlight(item, sizes[index], startPoses[index], index);
      return { node, control: fly(node, endPoses[index], stageSpring) };
    });

    source.folder.classList.add("is-project-source-hidden");
    setState("opening");

    await Promise.all(flights.map(({ control }) => control.finished.catch(() => undefined)));
    if (run !== generation || state !== "opening") return false;
    await settleFlights(endPoses);
    if (run !== generation || state !== "opening") return false;

    // One render transaction: the persistent targets replace the clones without
    // a frame where both (or neither) are painted.
    setState("open");
    source.folder.classList.add("is-landed");
    stopFlights();
    return true;
  };

  const close = async () => {
    if (!source || state === "closed") return true;
    const run = ++generation;
    const sizes = source.items.map(sizeOf);

    if (state === "open") {
      flights = source.items.map((item, index) => {
        const target = targets[index];
        const pose = target ? targetPose(target, sizes[index]) : poseOf(item, sizes[index]);
        const node = makeFlight(item, sizes[index], pose, index);
        return { node, control: fly(node, pose, { duration: 0 }) };
      });
    } else {
      flights.forEach(({ control, node }) => {
        const current = getComputedStyle(node).transform;
        control.stop();
        node.style.transform = current;
      });
    }

    source.folder.classList.remove("is-landed");
    setState("closing");
    const endPoses = source.items.map((item, index) => poseOf(item, sizes[index]));
    flights = flights.map(({ node }, index) => ({
      node,
      control: fly(node, endPoses[index], {
        ...homeSpring,
        delay: Math.abs(index - (source!.items.length - 1) / 2) * 0.03,
      }),
    }));

    await Promise.all(flights.map(({ control }) => control.finished.catch(() => undefined)));
    if (run !== generation || state !== "closing") return false;
    await settleFlights(endPoses);
    if (run !== generation || state !== "closing") return false;

    // The clones land, the real folder contents reappear, and the overlay leaves
    // in the same render transaction.
    stopFlights();
    source.folder.classList.remove("is-project-source-hidden", "is-landed");
    setState("closed");
    return true;
  };

  clearLegacyStyles();
  setState("closed");

  return { open, close };
}
