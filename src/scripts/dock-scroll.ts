import { animate, motionValue, styleEffect } from "motion";

export function mountDockScroll(dock: HTMLElement) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const scale = motionValue(1);
  const clearStyle = styleEffect(dock, { scale });
  const position = () => Math.max(0, Math.min(
    window.scrollY,
    document.documentElement.scrollHeight - window.innerHeight,
  ));
  let previous = position();
  let travel = 0;
  let compact = false;
  let frame = 0;

  const setCompact = (next: boolean) => {
    if (next === compact) return;
    compact = next;
    animate(scale, compact ? 0.84 : 1, {
      type: "spring", stiffness: 600, damping: 42, mass: 1,
      restDelta: 0.001, restSpeed: 0.01,
    });
  };
  const resetTracking = () => {
    previous = position();
    travel = 0;
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
    scale.jump(1);
    resetTracking();
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  // Browser toolbar resizing and rubber-band scroll must not reverse the dock.
  window.addEventListener("resize", resetTracking);
  window.visualViewport?.addEventListener("resize", resetTracking);
  window.addEventListener("pageshow", restore);
  reduced.addEventListener("change", restore);
  dock.addEventListener("focusin", onFocus);
  dock.addEventListener("focusout", resetTracking);

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", resetTracking);
    window.visualViewport?.removeEventListener("resize", resetTracking);
    window.removeEventListener("pageshow", restore);
    reduced.removeEventListener("change", restore);
    dock.removeEventListener("focusin", onFocus);
    dock.removeEventListener("focusout", resetTracking);
    clearStyle();
    scale.destroy();
  };
}
