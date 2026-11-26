import { engineeringSources, engineeringTime } from "../lib/engineering-blogs.mjs";

const stations = [{ id: "all", name: "All sources" }, ...engineeringSources];
const sweepStart = -135;
const step = 270 / (stations.length - 1);
const clampStation = (index: number) => Math.max(0, Math.min(stations.length - 1, index));
const connectionTime = 460;
const waveSettleTime = 210;

export function mountEngineeringRadio(root: HTMLDialogElement) {
  const trigger = document.querySelector<HTMLButtonElement>("[data-engineering-open]")!;
  const dock = trigger.closest<HTMLElement>(".home-dock")!;
  const close = root.querySelector<HTMLButtonElement>("[data-engineering-close]")!;
  const output = root.querySelector<HTMLElement>("[data-engineering-output]")!;
  const scroll = root.querySelector<HTMLElement>("[data-engineering-scroll]")!;
  const list = root.querySelector<HTMLOListElement>("[data-engineering-items]")!;
  const items = [...list.querySelectorAll<HTMLElement>("[data-engineering-article]")];
  const hasMore = items.some(item => !item.hasAttribute("data-engineering-latest"));
  const dial = root.querySelector<HTMLElement>("[data-engineering-dial]")!;
  const readout = root.querySelector<HTMLElement>("[data-engineering-readout]")!;
  const status = root.querySelector<HTMLElement>("[data-engineering-status]")!;
  const paperHeading = root.querySelector<HTMLElement>("[data-engineering-paper-heading]")!;
  const more = root.querySelector<HTMLButtonElement>("[data-engineering-more]")!;
  const reset = root.querySelector<HTMLButtonElement>("[data-engineering-reset]")!;
  const empty = root.querySelector<HTMLElement>("[data-engineering-empty]")!;
  const ticks = [...dial.querySelectorAll<HTMLElement>("[data-engineering-tick]")];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let active = 0;
  let expanded = false;
  let allTop = 0;
  let locked: HTMLElement | null = null;
  let flip: Animation | undefined;
  let connectionTimer = 0;
  let waveTimer = 0;
  let restoreFocus = false;
  let backdropPressed = false;
  let drag: { id: number; centerX: number; centerY: number; angle: number; position: number; travel: number } | null = null;

  root.style.setProperty("--radio-connect-time", `${connectionTime}ms`);
  if (!items.length) list.replaceChildren();
  dial.hidden = !items.length;

  const formatTimes = () => root.querySelectorAll<HTMLTimeElement>("time[datetime]").forEach((time) => {
    time.textContent = engineeringTime(time.dateTime);
  });
  setInterval(() => { if (root.open) formatTimes(); }, 60_000);

  function setFrequency(position: number) {
    root.style.setProperty("--radio-frequency", `${position / (stations.length - 1) * 100}%`);
  }

  function settleWave() {
    window.clearTimeout(waveTimer);
    root.removeAttribute("data-searching");
    root.style.removeProperty("--radio-wave-level");
  }

  function pulseWave(level: number) {
    if (reduced.matches || root.dataset.phase !== "tuned") return;
    root.style.setProperty("--radio-wave-level", String(level));
    root.toggleAttribute("data-searching", true);
    window.clearTimeout(waveTimer);
    waveTimer = window.setTimeout(settleWave, waveSettleTime);
  }

  function tuneIn() {
    root.dataset.phase = "tuned";
    output.inert = dial.inert = reset.inert = false;
    paint();
  }

  function placeAboveDock() {
    const distance = window.innerHeight - dock.getBoundingClientRect().top;
    root.style.setProperty("--radio-bottom", `${distance + 10}px`);
  }

  function open(event?: MouseEvent) {
    if (root.open) return;
    window.clearTimeout(connectionTimer);
    settleWave();
    restoreFocus = !event || event.detail === 0;
    root.dataset.phase = "connecting";
    status.textContent = "Tuning…";
    output.inert = dial.inert = reset.inert = true;
    placeAboveDock();
    root.showModal();
    trigger.setAttribute("aria-expanded", "true");
    if (reduced.matches) tuneIn();
    else connectionTimer = window.setTimeout(tuneIn, connectionTime);
  }

  reduced.addEventListener("change", settleWave);
  window.addEventListener("resize", () => { if (root.open) placeAboveDock(); });
  trigger.addEventListener("click", open);
  close.addEventListener("click", (event) => {
    restoreFocus ||= event.detail === 0;
    root.close();
  });
  root.addEventListener("cancel", () => { restoreFocus = true; });
  root.addEventListener("pointerdown", (event) => { backdropPressed = event.target === root; });
  root.addEventListener("click", (event) => {
    if (!backdropPressed || event.target !== root) return;
    const { left, right, top, bottom } = root.getBoundingClientRect();
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) root.close();
  });
  root.addEventListener("close", () => {
    if (root.open) return;
    window.clearTimeout(connectionTimer);
    settleWave();
    flip?.cancel();
    delete root.dataset.phase;
    trigger.setAttribute("aria-expanded", "false");
    if (restoreFocus) trigger.focus({ preventScroll: true });
    if (location.hash === `#${root.id}`) history.replaceState(history.state, "", location.pathname + location.search);
  });

  function paint() {
    const station = stations[active];
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
    if (!found) empty.textContent = active === 0 ? "Articles are temporarily unavailable." : `${station.name} is temporarily unavailable.`;
    root.toggleAttribute("data-has-signal", found);
    if (root.dataset.phase === "tuned") status.textContent = found ? "Signal locked" : "No signal";
    paperHeading.textContent = active !== 0 ? `Recent from ${station.name}` : expanded ? "Recent articles" : "Latest from each source";
    more.hidden = active !== 0 || !hasMore;
    more.setAttribute("aria-expanded", String(expanded));
    more.firstChild!.textContent = expanded ? "Fewer articles " : "More articles ";
    reset.hidden = active === 0;
    readout.textContent = station.name;
    dial.style.setProperty("--dial-angle", `${sweepStart + active * step}deg`);
    setFrequency(active);
    dial.setAttribute("aria-valuenow", String(active));
    dial.setAttribute("aria-valuetext", station.name);
    ticks.forEach((tick, index) => tick.toggleAttribute("data-current", index === active));
    formatTimes();
  }

  function tune(next: number, anchor: HTMLElement | null = null) {
    if (next === active) return;
    if (active === 0) allTop = scroll.scrollTop;
    const anchorTop = anchor ? anchor.getBoundingClientRect().top - scroll.getBoundingClientRect().top : 0;
    const direction = Math.sign(next - active);
    flip?.cancel();
    active = next;
    locked = anchor;
    if (next === 0 && document.activeElement === reset) dial.focus({ preventScroll: true });
    paint();

    scroll.scrollTop = anchor
      ? scroll.scrollTop + anchor.getBoundingClientRect().top - scroll.getBoundingClientRect().top - anchorTop
      : next === 0 ? allTop : 0;

    if (!reduced.matches) {
      if (!drag) pulseWave(.65);
      flip = readout.animate([
        { transform: `perspective(60px) translateY(${direction * 6}px) rotateX(${direction * -55}deg)`, opacity: 0 },
        { transform: "perspective(60px) translateY(0) rotateX(0deg)", opacity: 1 },
      ], { duration: 190, easing: "cubic-bezier(.23,1,.32,1)" });
    }
  }

  list.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-engineering-tune]");
    if (!button) return;
    const next = stations.findIndex(({ id }) => id === button.dataset.engineeringTune);
    if (next > 0) tune(next === active ? 0 : next, next === active ? null : button.closest<HTMLElement>("[data-engineering-article]"));
  });
  reset.addEventListener("click", () => tune(0));
  more.addEventListener("click", () => {
    expanded = !expanded;
    paint();
    if (!expanded) scroll.scrollTop = 0;
  });

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
    const movement = Math.abs(delta);
    drag.travel += movement;
    drag.angle = angle;
    drag.position = clampStation(drag.position + delta / step);
    if (drag.travel >= 5) {
      if (movement > 0) pulseWave(Math.min(1, .4 + movement / step));
      tune(Math.round(drag.position));
      setFrequency(drag.position);
    }
  });
  dial.addEventListener("pointerup", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const { centerX, centerY, travel } = drag;
    drag = null;
    dial.removeAttribute("data-dragging");
    if (travel >= 5) {
      setFrequency(active);
      return;
    }
    const x = event.clientX - centerX, y = event.clientY - centerY;
    const onTrack = Math.hypot(x, y) > dial.offsetWidth * .33;
    tune(onTrack ? clampStation(Math.round((angleAt(x, y) - sweepStart) / step)) : centerStation());
  });
  dial.addEventListener("lostpointercapture", () => {
    if (drag) setFrequency(active);
    drag = null;
    dial.removeAttribute("data-dragging");
  });
  paint();
  trigger.disabled = false;
  if (location.hash === `#${root.id}`) open();
}
