import { animate } from "motion";

export function mountDockScroll(dock: HTMLElement) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const touch = matchMedia("(hover: none) and (pointer: coarse)");
  const wrap = dock.parentElement;
  const pinAnchor = () => {
    wrap?.style.removeProperty("--dock-anchor-top");
    if (!wrap || !touch.matches) return;
    // Embedded browsers can resize even svh when their native toolbar collapses.
    const top = getComputedStyle(wrap).top;
    if (Number.isFinite(Number.parseFloat(top))) wrap.style.setProperty("--dock-anchor-top", top);
  };
  pinAnchor();
  let animation: ReturnType<typeof animate> | undefined;
  const scrollLimit = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const position = () => Math.max(0, Math.min(window.scrollY, scrollLimit()));
  let viewportWidth = window.innerWidth;
  let limit = scrollLimit();
  let previous = position();
  let travel = 0;
  let compact = false;
  let frame = 0;

  const setCompact = (next: boolean) => {
    if (next === compact) return;
    compact = next;
    animation = animate(dock, { transform: `scale(${compact ? 0.84 : 1})` }, {
      type: "spring", stiffness: 170, damping: 26, mass: 1,
      restDelta: 0.001, restSpeed: 0.01,
    });
  };
  const resetTracking = () => {
    previous = position();
    travel = 0;
    limit = scrollLimit();
  };
  const onResize = () => {
    const nextLimit = scrollLimit();
    if (window.innerWidth !== viewportWidth) {
      viewportWidth = window.innerWidth;
      pinAnchor();
      resetTracking();
    } else {
      // Keep real scroll intent while browser chrome changes only the viewport height.
      const y = position();
      previous = previous >= limit - 1 && y >= limit - 1 ? y : Math.min(previous, nextLimit);
    }
    limit = nextLimit;
  };
  const update = () => {
    frame = 0;
    const y = position();
    const delta = y - previous;
    previous = y;
    if (reduced.matches || document.documentElement.style.overflow === "hidden") {
      travel = 0;
      return;
    }
    if (y <= 48 || dock.querySelector(":focus-visible")) {
      travel = 0;
      setCompact(false);
      return;
    }
    if (!delta) return;
    if (Math.sign(delta) !== Math.sign(travel)) travel = 0;
    travel += delta;
    if (travel >= 32) setCompact(true);
    else if (travel <= -20) setCompact(false);
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const onFocus = () => {
    if (dock.querySelector(":focus-visible")) setCompact(false);
    resetTracking();
  };
  const restore = () => {
    compact = false;
    animation = animate(dock, { transform: "scale(1)" }, { duration: 0 });
    resetTracking();
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  window.visualViewport?.addEventListener("resize", onResize);
  window.addEventListener("pageshow", restore);
  reduced.addEventListener("change", restore);
  touch.addEventListener("change", pinAnchor);
  dock.addEventListener("focusin", onFocus);
  dock.addEventListener("focusout", resetTracking);

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.visualViewport?.removeEventListener("resize", onResize);
    window.removeEventListener("pageshow", restore);
    reduced.removeEventListener("change", restore);
    touch.removeEventListener("change", pinAnchor);
    dock.removeEventListener("focusin", onFocus);
    dock.removeEventListener("focusout", resetTracking);
    animation?.stop();
    dock.style.removeProperty("transform");
    wrap?.style.removeProperty("--dock-anchor-top");
  };
}
