/** The same handoff as full-page Thoughts navigation, confined to the preview. */
export function createThoughtTransition(pane: HTMLElement) {
  let animation: Animation | undefined;
  let generation = 0;

  return async (swap: () => void, motion = true) => {
    const run = ++generation;
    const current = getComputedStyle(pane);
    const start = { opacity: current.opacity, transform: current.transform, filter: current.filter };
    animation?.cancel();
    if (!motion || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      swap();
      return;
    }

    animation = pane.animate([
      start,
      { opacity: 0, transform: "translateY(-8px)", filter: "blur(5px)" },
    ], { duration: 160, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" });
    await animation.finished.catch(() => undefined);
    if (run !== generation) return;
    animation.cancel();
    swap();
    animation = pane.animate([
      { opacity: 0, transform: "translateY(14px)", filter: "blur(5px)" },
      { opacity: 1, transform: "translateY(0)", filter: "blur(0px)" },
    ], { duration: 600, easing: "cubic-bezier(0.25, 1, 0.5, 1)" });
  };
}
