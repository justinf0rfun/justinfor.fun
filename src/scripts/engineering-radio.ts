import { engineeringChannel, engineeringSources, engineeringTime } from "../lib/engineering-blogs.mjs";

const stations = [{ id: "all", name: "All stations" }, ...engineeringSources];
const sweepStart = -135;
const step = 270 / (stations.length - 1);
const clampStation = (index: number) => Math.max(0, Math.min(stations.length - 1, index));
const connectionTime = 460;
const waveSettleTime = 210;
const tuningMotion = { duration: 190, easing: "cubic-bezier(.23,1,.32,1)" };

export function mountEngineeringRadio(root: HTMLDialogElement) {
  const trigger = document.querySelector<HTMLButtonElement>("[data-engineering-open]")!;
  const dock = trigger.closest<HTMLElement>(".home-dock")!;
  const close = root.querySelector<HTMLButtonElement>("[data-engineering-close]")!;
  const output = root.querySelector<HTMLElement>("[data-engineering-output]")!;
  const scroll = root.querySelector<HTMLElement>("[data-engineering-scroll]")!;
  const list = root.querySelector<HTMLOListElement>("[data-engineering-items]")!;
  const items = [...list.querySelectorAll<HTMLElement>("[data-engineering-article]")];
  const hasMore = items.some(item => !item.hasAttribute("data-engineering-latest"));
  const archive = items.map(item => ({ item, date: Date.parse(item.querySelector("time")!.dateTime) }))
    .sort((a, b) => b.date - a.date).map(({ item }) => item);
  const dial = root.querySelector<HTMLElement>("[data-engineering-dial]")!;
  const readout = root.querySelector<HTMLElement>("[data-engineering-readout]")!;
  const readoutChannel = root.querySelector<HTMLElement>("[data-engineering-channel]")!;
  const status = root.querySelector<HTMLElement>("[data-engineering-status]")!;
  const paper = root.querySelector<HTMLElement>("[data-engineering-paper]")!;
  const paperChannel = root.querySelector<HTMLElement>("[data-engineering-paper-channel]")!;
  const paperHeading = root.querySelector<HTMLElement>("[data-engineering-paper-heading]")!;
  const commandForm = root.querySelector<HTMLFormElement>("[data-engineering-command-form]")!;
  const commandInput = root.querySelector<HTMLInputElement>("[data-engineering-command]")!;
  const commandFeedback = root.querySelector<HTMLElement>("[data-engineering-command-feedback]")!;
  const commandOutput = root.querySelector<HTMLElement>("[data-engineering-command-output]")!;
  const more = root.querySelector<HTMLButtonElement>("[data-engineering-more]")!;
  const reset = root.querySelector<HTMLButtonElement>("[data-engineering-reset]")!;
  const empty = root.querySelector<HTMLElement>("[data-engineering-empty]")!;
  const ticks = [...dial.querySelectorAll<HTMLElement>("[data-engineering-tick]")];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let active = 0;
  let settledStation = 0;
  let expanded = false;
  let allTop = 0;
  let flip: Animation | undefined;
  let commandMotion: Animation | undefined;
  let paperMotion: Animation | undefined;
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

  function resetTuningMotion() {
    settleWave();
    settledStation = active;
    flip?.cancel();
    commandMotion?.cancel();
    paperMotion?.cancel();
  }

  function lockStation() {
    settleWave();
    if (active === settledStation) return;
    settledStation = active;
    if (!active || !root.open || reduced.matches || !root.hasAttribute("data-has-signal")) return;

    commandMotion = commandOutput.animate([
      { color: "var(--radio-ink)", filter: "brightness(1)" },
      { color: "var(--radio-signal)", filter: "brightness(1.12)", offset: .35 },
      { color: "var(--radio-ink)", filter: "brightness(1)" },
    ], tuningMotion);
    paperMotion = paper.animate([
      { transform: "translateY(18px)", opacity: .8 },
      { transform: "translateY(0)", opacity: 1 },
    ], tuningMotion);
  }

  function pulseWave(level: number) {
    if (reduced.matches || root.dataset.phase !== "tuned") return;
    root.style.setProperty("--radio-wave-level", String(level));
    root.toggleAttribute("data-searching", true);
    window.clearTimeout(waveTimer);
    waveTimer = window.setTimeout(lockStation, waveSettleTime);
  }

  function tuneIn() {
    root.dataset.phase = "tuned";
    output.inert = dial.inert = reset.inert = commandForm.inert = false;
    paint();
  }

  function placeAboveDock() {
    const distance = window.innerHeight - dock.getBoundingClientRect().top;
    root.style.setProperty("--radio-bottom", `${distance + 10}px`);
  }

  function open(event?: MouseEvent) {
    if (root.open) return;
    window.clearTimeout(connectionTimer);
    resetTuningMotion();
    restoreFocus = !event || event.detail === 0;
    root.dataset.phase = "connecting";
    status.textContent = "Tuning…";
    output.inert = dial.inert = reset.inert = commandForm.inert = true;
    placeAboveDock();
    root.showModal();
    trigger.setAttribute("aria-expanded", "true");
    if (reduced.matches) tuneIn();
    else connectionTimer = window.setTimeout(tuneIn, connectionTime);
  }

  reduced.addEventListener("change", resetTuningMotion);
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
    resetTuningMotion();
    commandInput.value = "";
    commandFeedback.hidden = true;
    delete root.dataset.phase;
    trigger.setAttribute("aria-expanded", "false");
    if (restoreFocus) trigger.focus({ preventScroll: true });
    if (location.hash === `#${root.id}`) history.replaceState(history.state, "", location.pathname + location.search);
  });

  function paint() {
    const station = stations[active];
    const code = active ? `CH ${engineeringChannel(active)}` : "";
    root.dataset.view = active ? "station" : expanded ? "archive" : "guide";
    commandOutput.textContent = active ? `tune ${engineeringChannel(active)}` : expanded ? "recent" : "stations";
    commandFeedback.hidden = true;
    let found = false;
    items.forEach((item) => {
      item.hidden = active === 0
        ? !expanded && !item.hasAttribute("data-engineering-latest")
        : item.dataset.engineeringArticle !== station.id;
      found ||= !item.hidden;
    });
    empty.hidden = found;
    if (!found) empty.textContent = active === 0 ? "Articles are temporarily unavailable." : `${station.name} is temporarily unavailable.`;
    root.toggleAttribute("data-has-signal", found);
    if (root.dataset.phase === "tuned") status.textContent = found ? "Signal locked" : "No signal";
    paperHeading.textContent = active ? station.name : expanded ? "Recent articles" : "Station guide";
    paperChannel.textContent = readoutChannel.textContent = code;
    paperChannel.hidden = readoutChannel.hidden = !active;
    more.hidden = active !== 0 || !hasMore;
    more.setAttribute("aria-expanded", String(expanded));
    more.firstChild!.textContent = expanded ? "Fewer articles " : "More articles ";
    reset.hidden = active === 0;
    readout.textContent = station.name;
    dial.style.setProperty("--dial-angle", `${sweepStart + active * step}deg`);
    setFrequency(active);
    dial.setAttribute("aria-valuenow", String(active));
    dial.setAttribute("aria-valuetext", code ? `${code} · ${station.name}` : station.name);
    ticks.forEach((tick, index) => tick.toggleAttribute("data-current", index === active));
    formatTimes();
  }

  function tune(next: number, focusPaper = false) {
    if (next === active) return;
    if (active === 0) allTop = scroll.scrollTop;
    const direction = Math.sign(next - active);
    flip?.cancel();
    commandMotion?.cancel();
    paperMotion?.cancel();
    active = next;
    if (!active) settledStation = 0;
    if (next === 0 && document.activeElement === reset) dial.focus({ preventScroll: true });
    paint();
    scroll.scrollTop = next === 0 ? allTop : 0;
    if (focusPaper) paperHeading.parentElement!.focus({ preventScroll: true });

    if (!reduced.matches) {
      if (!drag) pulseWave(.65);
      flip = readout.parentElement!.animate([
        { transform: `perspective(60px) translateY(${direction * 6}px) rotateX(${direction * -55}deg)`, opacity: 0 },
        { transform: "perspective(60px) translateY(0) rotateX(0deg)", opacity: 1 },
      ], tuningMotion);
    }
  }

  function showAll(recent: boolean) {
    const orderChanged = recent !== expanded;
    if (orderChanged) {
      expanded = recent;
      list.append(...(recent ? archive : items));
    }
    if (active) tune(0);
    else if (orderChanged) paint();
    if (orderChanged) scroll.scrollTop = 0;
  }

  commandForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!root.open || root.dataset.phase !== "tuned") return;
    const request = commandInput.value.trim().toLowerCase();
    commandInput.value = "";
    commandInput.focus({ preventScroll: true });
    if (!request) return;

    const channelRange = `01–${engineeringChannel(stations.length - 1)}`;
    let reply = "";
    if (request === "stations" || request === "recent") {
      showAll(request === "recent");
    } else if (request === "help") {
      reply = `stations · tune ${channelRange} · recent · help`;
    } else if (/^tune(?:\s|$)/.test(request)) {
      const channel = Number(/^tune\s+(\d{1,2})$/.exec(request)?.[1]);
      if (channel > 0 && channel < stations.length) tune(channel);
      else reply = `Enter a channel from ${channelRange}. Try tune 04.`;
    } else {
      reply = "Unknown command. Type help for commands.";
    }
    commandFeedback.textContent = reply;
    commandFeedback.hidden = !reply;
  });

  list.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-engineering-tune]");
    if (!button) return;
    const next = stations.findIndex(({ id }) => id === button.dataset.engineeringTune);
    if (next > 0) tune(next, document.activeElement === button);
  });
  reset.addEventListener("click", () => tune(0));
  more.addEventListener("click", () => {
    showAll(!expanded);
    if (document.activeElement === more) paperHeading.parentElement!.focus({ preventScroll: true });
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
