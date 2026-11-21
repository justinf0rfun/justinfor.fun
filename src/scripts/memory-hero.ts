const clamp = (value: number) => Math.min(1, Math.max(0, value));
const round = (value: number) => Math.round(value * 100) / 100;
const easeInOut = (t: number) => t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

const refractionMap = () => {
  const canvas = document.createElement("canvas");
  const size = 160;
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return "";
  const image = context.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = 2 * (x + .5) / size - 1;
      const dy = 2 * (y + .5) / size - 1;
      const radius = Math.hypot(dx, dy);
      const edge = radius < 1 ? clamp((radius - .84) / .16) ** 2 : 0;
      const offset = (y * size + x) * 4;
      image.data[offset] = Math.round(128 - dx * edge * 127);
      image.data[offset + 1] = Math.round(128 - dy * edge * 127);
      image.data[offset + 2] = 128;
      image.data[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  return canvas.toDataURL();
};

export function mountMemoryHero(stage: HTMLElement, reduced: MediaQueryList) {
  const scene = stage.querySelector<HTMLElement>("[data-memory-scene]")!;
  const lens = scene.querySelector<HTMLElement>("[data-memory-lens]")!;
  const hud = scene.querySelector<HTMLElement>("[data-memory-spacing-hud]")!;
  const hLabel = hud.querySelector<HTMLElement>("[data-memory-h]")!;
  const vLabel = hud.querySelector<HTMLElement>("[data-memory-v]")!;
  const filter = scene.querySelector<SVGFilterElement>("filter")!;
  const map = filter.querySelector<SVGFEImageElement>("feImage")!;
  const displacement = filter.querySelector<SVGFEDisplacementMapElement>("feDisplacementMap")!;
  const browse = scene.querySelector<HTMLAnchorElement>("[data-memory-browse]")!;
  const archive = stage.querySelector<HTMLElement>(".memory-archive")!;
  const tiles = [...scene.querySelectorAll<HTMLElement>("[data-memory-tile]")].map((element) => {
    const column = Number(element.dataset.x);
    const row = Number(element.dataset.y);
    return { element, column, row, delay: Math.hypot(column, row) * 35,
      x: 0, y: 0, size: 1, vx: 0, vy: 0, vs: 0, pose: "" };
  });
  const overlay = stage.dataset.memoryStage === "overlay";
  const scroller = overlay ? stage : window;
  const desktopGlass = matchMedia("(min-width: 641px) and (pointer: fine)");
  let width = 0, height = 0, tileWidth = 0, diameter = 0;
  let h = 1, v = 1, frame = 0, last = 0;
  let touch: number | null = null;
  let autoAt = Infinity;
  let wakeTimer = 0;
  let glide: { start: number; end: number; fromH: number; fromV: number; toH: number; toV: number } | null = null;
  let samples = [{ time: 0, h: 1, v: 1 }];

  const scrollY = () => overlay ? stage.scrollTop : window.scrollY;
  const onScreen = () => stage.classList.contains("is-open") && !document.hidden && scrollY() < height * .75;
  const request = () => {
    window.clearTimeout(wakeTimer);
    if (!frame && onScreen()) {
      last = performance.now();
      frame = requestAnimationFrame(paint);
    }
  };

  const bounds = () => {
    const inset = Math.max(33, .06 * width);
    return { left: inset, top: 100, width: Math.max(1, width - inset * 2), height: Math.max(1, height - 150) };
  };

  const setSpacing = (horizontal: number, vertical: number, now: number) => {
    if (horizontal === h && vertical === v && scene.hasAttribute("data-memory-spacing-active")) return;
    h = horizontal;
    v = vertical;
    samples.push({ time: now, h, v });
    const input = bounds();
    hud.style.setProperty("--hud-x", `${input.left + (h - .1) / 2.9 * input.width}px`);
    hud.style.setProperty("--hud-y", `${input.top + (1 - (v - .1) / 2.9) * input.height}px`);
    hLabel.textContent = h.toFixed(2);
    vLabel.textContent = v.toFixed(2);
    scene.setAttribute("data-memory-spacing-active", "");
  };

  function paint(now: number, snap = false) {
    frame = 0;
    if (!onScreen() && !snap) return;
    if (!reduced.matches && now >= autoAt && !glide) {
      const end = now + 1050 + Math.random() * 500;
      glide = { start: now, end, fromH: h, fromV: v,
        toH: .3 + Math.random() * 1.9, toV: .35 + Math.random() * 1.65 };
      autoAt = end + 1200 + Math.random() * 900;
    }
    if (glide) {
      const t = easeInOut(clamp((now - glide.start) / (glide.end - glide.start)));
      setSpacing(round(glide.fromH + (glide.toH - glide.fromH) * t),
        round(glide.fromV + (glide.toV - glide.fromV) * t), now);
      if (now >= glide.end) glide = null;
    }

    while (samples.length > 1 && samples[1].time < now - 370) samples.shift();
    const pitch = tileWidth + 17;
    const dt = Math.min(.04, Math.max(0, (now - last) / 1000));
    const steps = Math.max(1, Math.ceil(dt * 120));
    const step = dt / steps;
    last = now;
    let moving = false;
    for (const tile of tiles) {
      const target = samples.findLast((sample) => sample.time <= now - tile.delay) ?? samples[0];
      const x = tile.column * pitch * target.h;
      const y = tile.row * pitch * target.v;
      const size = Math.min(1.25, Math.max(.08, Math.min(target.h, target.v)));
      if (snap || reduced.matches) {
        tile.x = x; tile.y = y; tile.size = size;
        tile.vx = tile.vy = tile.vs = 0;
      } else {
        for (let i = 0; i < steps; i++) {
          tile.vx += (170 * (x - tile.x) - 16 * tile.vx) * step;
          tile.vy += (170 * (y - tile.y) - 16 * tile.vy) * step;
          tile.vs += (170 * (size - tile.size) - 16 * tile.vs) * step;
          tile.x += tile.vx * step;
          tile.y += tile.vy * step;
          tile.size += tile.vs * step;
        }
        moving ||= Math.abs(x - tile.x) + Math.abs(y - tile.y) + Math.abs(size - tile.size) * tileWidth > .05;
      }
      const pose = `translate(-50%, -50%) translate(${tile.x.toFixed(2)}px, ${tile.y.toFixed(2)}px) scale(${tile.size.toFixed(4)})`;
      if (pose !== tile.pose) {
        tile.pose = pose;
        tile.element.style.transform = pose;
      }
    }
    if (!onScreen()) return;
    if (moving || glide || now - samples.at(-1)!.time < 370) {
      frame = requestAnimationFrame(paint);
    } else if (Number.isFinite(autoAt)) {
      wakeTimer = window.setTimeout(request, Math.max(0, autoAt - now));
    }
  }

  const updateScene = () => {
    const y = scrollY();
    const p = !reduced.matches && height ? y / height : 0;
    const travel = easeInOut(clamp(p / .6375));
    const home = width <= 640 ? height - 247 + diameter / 2 : height - 85;
    const centered = home + (height / 2 - home) * travel;
    const scale = 1 + (Math.min(1, .7 * Math.min(width, height) / diameter) - 1) * travel;
    lens.style.setProperty("--memory-lens-center", `${centered}px`);
    lens.style.setProperty("--memory-lens-scale", String(scale));
    lens.style.setProperty("--memory-lens-angle", `${travel * 90}deg`);
    lens.style.setProperty("--memory-lens-opacity", String(1 - easeInOut(clamp((p - .6375) / .1125))));
    scene.style.setProperty("--memory-copy-y", `${centered - home}px`);
    scene.style.setProperty("--memory-copy-opacity", String(1 - smoothstep(clamp(p / .3))));
    scene.style.setProperty("--memory-sheet-opacity", String(1 - easeInOut(clamp(p / .55))));
    scene.toggleAttribute("data-memory-at-start", p < .01);
    browse.inert = p > .28;
    request();
  };

  const measure = () => {
    width = scene.clientWidth;
    height = scene.clientHeight;
    tileWidth = tiles[0].element.offsetWidth;
    diameter = lens.offsetWidth;
    if (desktopGlass.matches && diameter && navigator.userAgent.includes("Chrome/")) {
      if (!map.getAttribute("href")) {
        const data = refractionMap();
        if (data) map.setAttribute("href", data);
      }
      if (map.getAttribute("href")) {
        for (const node of [filter, map]) {
          node.setAttribute("width", String(diameter));
          node.setAttribute("height", String(diameter));
        }
        displacement.setAttribute("scale", String(diameter * .096));
        lens.setAttribute("data-refract", "");
      }
    }
    cancelAnimationFrame(frame);
    paint(performance.now(), true);
    updateScene();
  };

  const reset = () => {
    glide = null;
    autoAt = reduced.matches ? Infinity : performance.now() + 900;
    touch = null;
    h = v = 1;
    samples = [{ time: 0, h, v }];
    scene.removeAttribute("data-memory-spacing-active");
    if (reduced.matches) setSpacing(1, 1, performance.now());
    measure();
  };

  const follow = (event: PointerEvent) => {
    if (!onScreen() || scrollY() > height * .55) return;
    const rect = scene.getBoundingClientRect();
    const input = bounds();
    glide = null;
    autoAt = Infinity;
    setSpacing(round(.1 + 2.9 * clamp((event.clientX - rect.left - input.left) / input.width)),
      round(.1 + 2.9 * clamp(1 - (event.clientY - rect.top - input.top) / input.height)), performance.now());
    request();
  };

  const release = () => {
    touch = null;
    autoAt = reduced.matches ? Infinity : performance.now() + 6000;
    request();
  };

  scene.addEventListener("pointermove", (event) => {
    if (event.pointerType === "mouse" || touch === event.pointerId) follow(event);
  });
  scene.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.pointerType !== "touch" || (event.target as Element).closest("a, button")) return;
    touch = event.pointerId;
    scene.setPointerCapture(touch);
    follow(event);
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"] as const) {
    scene.addEventListener(type, (event) => { if (event.pointerId === touch) release(); });
  }
  scene.addEventListener("pointerleave", () => { if (touch === null) release(); });
  window.addEventListener("blur", release);

  browse.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    archive.focus({ preventScroll: true });
    archive.scrollIntoView({ behavior: reduced.matches ? "instant" : "smooth" });
  });

  scroller.addEventListener("scroll", updateScene, { passive: true });
  stage.addEventListener("memory-layout", reset);
  document.addEventListener("visibilitychange", request);
  reduced.addEventListener("change", reset);
  desktopGlass.addEventListener("change", measure);
  new ResizeObserver(measure).observe(scene);
  reset();
}
