type HoloWindow = Window & { holoPack?: { full: () => void; compact: () => void } };

export function mountRideCoupon() {
  const root = document.querySelector<HTMLDialogElement>("[data-ride-coupon]");
  if (!root) return;
  const frame = root.querySelector<HTMLIFrameElement>("iframe")!;
  const close = root.querySelector<HTMLButtonElement>("[data-ride-close]")!;
  const title = root.querySelector<HTMLHeadingElement>("h2")!;
  let expanded = false;
  let started = false;
  let entranceDelayElapsed = false;
  const send = (command: string, details = {}) => frame.contentWindow?.postMessage({ type: "ride-pack-command", command, ...details }, location.origin);
  const covered = () => !!document.querySelector('.home-content[inert], #home-chat[data-open="true"], .home-dock[data-moments-open="true"], [data-uses-stage="overlay"][aria-hidden="false"], [data-projects-stage="overlay"][aria-hidden="false"], [data-music-stage="overlay"][aria-hidden="false"], [data-memory-stage="overlay"][aria-hidden="false"], [data-writing-stage="overlay"][aria-hidden="false"], [data-x-bookmarks-stage="overlay"][aria-hidden="false"]');

  function present(next: boolean, keyboard = false) {
    if (expanded === next || (next && covered())) return;
    expanded = next; root!.close(); root!.dataset.expanded = String(next); close.hidden = !next;
    title.autofocus = next;
    if (next) {
      window.dispatchEvent(new CustomEvent("ride-coupon-opening")); root!.showModal(); title.focus({ preventScroll: true });
      const controls = getComputedStyle(close);
      frame.contentDocument?.documentElement.style.setProperty("--host-safe-top", `${Math.max(0, parseFloat(controls.top) - 16)}px`);
      frame.contentDocument?.documentElement.style.setProperty("--host-safe-right", `${Math.max(0, parseFloat(controls.right) - 16)}px`);
      (frame.contentWindow as HoloWindow).holoPack?.full();
    } else {
      root!.show(); (frame.contentWindow as HoloWindow).holoPack?.compact();
      if (keyboard) frame.focus({ preventScroll: true });
    }
  }
  function sync() {
    const hidden = covered(); if (hidden && expanded) present(false);
    root!.dataset.covered = String(hidden);
    send("pause", { paused: hidden || document.hidden || document.documentElement.dataset.inspiredOpen === "true" });
    if (entranceDelayElapsed && !started && !hidden && !document.hidden && (frame.contentWindow as HoloWindow)?.holoPack) { started = true; send("start"); }
  }
  window.addEventListener("message", event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.type !== "ride-pack") return;
    if (event.data.event === "loaded") sync();
    if (event.data.event === "reset" && !expanded) { root!.dataset.ready = "false"; root!.inert = true; }
    if (event.data.event === "enter") { root!.dataset.ready = "true"; root!.dataset.entering = "true"; root!.inert = false; }
    if (event.data.event === "ready") { root!.dataset.ready = "true"; root!.dataset.entering = "false"; root!.inert = false; sync(); }
    if (event.data.event === "interact") { window.dispatchEvent(new CustomEvent("ride-coupon-opening")); send("pause", { paused: false }); }
    if (event.data.event === "released") present(true);
    if (event.data.event === "close") present(false, true);
    root!.dataset.phase = event.data.event;
  });
  close.addEventListener("click", event => present(false, event.detail === 0));
  root.addEventListener("cancel", event => { event.preventDefault(); present(false, true); });
  frame.addEventListener("load", sync);
  document.addEventListener("visibilitychange", sync);
  const footer = document.querySelector(".home-content .local-time-footer");
  if (footer) new IntersectionObserver(([entry]) => { root!.dataset.footer = String(entry.isIntersecting); }).observe(footer);
  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-inspired-open"] });
  for (const element of document.querySelectorAll('.home-content, #home-chat, .home-dock, [data-uses-stage], [data-projects-stage], [data-music-stage], [data-memory-stage], [data-writing-stage], [data-x-bookmarks-stage]')) {
    observer.observe(element, { attributes: true, attributeFilter: ["inert", "data-open", "data-moments-open", "aria-hidden"] });
  }
  window.setTimeout(() => { entranceDelayElapsed = true; sync(); }, 1000);
  sync();
}
