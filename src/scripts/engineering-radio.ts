import { engineeringSources, engineeringTime } from "../lib/engineering-blogs.mjs";

const stations = [{ id: "all", name: "All sources" }, ...engineeringSources];
const sweepStart = -135;
const step = 270 / (stations.length - 1);
const clampStation = (index: number) => Math.max(0, Math.min(stations.length - 1, index));

export function mountEngineeringRadio(root: HTMLElement) {
  const items = [...root.querySelectorAll<HTMLElement>("[data-engineering-article]")];
  const latestCount = items.filter(item => item.hasAttribute("data-engineering-latest")).length;
  const dial = root.querySelector<HTMLElement>("[data-engineering-dial]")!;
  const readout = root.querySelector<HTMLElement>("[data-engineering-readout]")!;
  const more = root.querySelector<HTMLButtonElement>("[data-engineering-more]")!;
  const reset = root.querySelector<HTMLButtonElement>("[data-engineering-reset]")!;
  const empty = root.querySelector<HTMLElement>("[data-engineering-empty]")!;
  const ticks = [...dial.querySelectorAll<HTMLElement>("[data-engineering-tick]")];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const compact = matchMedia("(width < 75rem)");
  let active = 0;
  let expanded = false;
  let allTop = 0;
  let locked: HTMLElement | null = null;
  let flip: Animation | undefined;
  let drag: { id: number; centerX: number; centerY: number; angle: number; position: number; travel: number } | null = null;

  if (!items.length) {
    root.querySelector<HTMLElement>(".engineering-tuner")!.hidden = true;
    return;
  }

  const formatTimes = () => root.querySelectorAll<HTMLTimeElement>("time[datetime]").forEach((time) => {
    time.textContent = engineeringTime(time.dateTime);
  });
  setInterval(formatTimes, 60_000);

  function paint() {
    const station = stations[active];
    root.toggleAttribute("data-engineering-preview", active === 0 && !expanded);
    let found = false;
    items.forEach((item) => {
      item.hidden = active === 0
        ? !expanded && !item.hasAttribute("data-engineering-latest")
        : item.dataset.engineeringArticle !== station.id;
      found ||= !item.hidden;
      item.toggleAttribute("data-locked", item === locked);
      item.querySelector("[data-engineering-tune]")?.setAttribute("aria-pressed", String(active !== 0 && !item.hidden));
    });
    empty.hidden = found;
    if (!found) empty.textContent = `${station.name} is temporarily unavailable.`;
    const previewCount = compact.matches ? Math.min(3, latestCount) : latestCount;
    more.hidden = active !== 0 || items.length <= previewCount;
    more.setAttribute("aria-expanded", String(expanded));
    more.firstChild!.textContent = expanded ? "Fewer articles " : "More articles ";
    reset.hidden = active === 0;
    readout.textContent = station.name;
    dial.style.setProperty("--dial-angle", `${sweepStart + active * step}deg`);
    dial.setAttribute("aria-valuenow", String(active));
    dial.setAttribute("aria-valuetext", station.name);
    ticks.forEach((tick, index) => tick.toggleAttribute("data-current", index === active));
    formatTimes();
  }

  function tune(next: number, anchor: HTMLElement | null = null) {
    if (next === active) return;
    const fromAll = active === 0;
    if (fromAll) allTop = root.getBoundingClientRect().top;
    const anchorTop = anchor?.getBoundingClientRect().top;
    const direction = Math.sign(next - active);
    flip?.cancel();
    active = next;
    locked = anchor;
    if (next === 0 && document.activeElement === reset) dial.focus({ preventScroll: true });
    paint();

    if (anchor && anchorTop !== undefined) {
      window.scrollBy({ top: anchor.getBoundingClientRect().top - anchorTop, behavior: "instant" });
    } else if (next === 0 && !fromAll) {
      window.scrollBy({ top: root.getBoundingClientRect().top - allTop, behavior: "instant" });
    }

    if (!reduced.matches) {
      flip = readout.animate([
        { transform: `perspective(60px) translateY(${direction * 6}px) rotateX(${direction * -55}deg)`, opacity: 0 },
        { transform: "perspective(60px) translateY(0) rotateX(0deg)", opacity: 1 },
      ], { duration: 190, easing: "cubic-bezier(.23,1,.32,1)" });
    }
  }

  root.querySelector("[data-engineering-items]")!.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-engineering-tune]");
    if (!button) return;
    const next = stations.findIndex(({ id }) => id === button.dataset.engineeringTune);
    if (next > 0) tune(next === active ? 0 : next, next === active ? null : button.closest<HTMLElement>("[data-engineering-article]"));
  });
  reset.addEventListener("click", () => tune(0));
  more.addEventListener("click", () => {
    expanded = !expanded;
    paint();
    if (!expanded) more.scrollIntoView({ block: "nearest", behavior: "instant" });
  });
  compact.addEventListener("change", paint);

  const centerStation = () => active === 0 ? 1 : 0;
  dial.addEventListener("keydown", (event) => {
    const positions: Record<string, number> = {
      ArrowRight: active + 1, ArrowUp: active + 1, ArrowLeft: active - 1, ArrowDown: active - 1,
      Home: 0, End: stations.length - 1, Enter: centerStation(), " ": centerStation(),
    };
    if (!(event.key in positions)) return;
    event.preventDefault();
    tune(clampStation(positions[event.key]));
  });

  const angleAt = (x: number, y: number) => Math.atan2(x, -y) * 180 / Math.PI;
  dial.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || drag) return;
    const rect = dial.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2, centerY = rect.top + rect.height / 2;
    drag = { id: event.pointerId, centerX, centerY, angle: angleAt(event.clientX - centerX, event.clientY - centerY), position: active, travel: 0 };
    dial.setPointerCapture(event.pointerId);
    dial.setAttribute("data-dragging", "");
  });
  dial.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const x = event.clientX - drag.centerX, y = event.clientY - drag.centerY;
    if (Math.hypot(x, y) < 12) return;
    const angle = angleAt(x, y);
    const delta = ((angle - drag.angle + 540) % 360) - 180;
    drag.travel += Math.abs(delta);
    drag.angle = angle;
    drag.position = clampStation(drag.position + delta / step);
    if (drag.travel >= 5) tune(Math.round(drag.position));
  });
  dial.addEventListener("pointerup", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const { centerX, centerY, travel } = drag;
    drag = null;
    dial.removeAttribute("data-dragging");
    if (travel >= 5) return;
    const x = event.clientX - centerX, y = event.clientY - centerY;
    const onTrack = Math.hypot(x, y) > dial.offsetWidth * .33;
    tune(onTrack ? clampStation(Math.round((angleAt(x, y) - sweepStart) / step)) : centerStation());
  });
  dial.addEventListener("lostpointercapture", () => {
    drag = null;
    dial.removeAttribute("data-dragging");
  });
  paint();
}
