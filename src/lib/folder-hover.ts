import { hover } from "motion";

// Closing overlays can generate pointerenter without any mouse movement.
export function folderHover(element: HTMLElement, start: () => void | (() => void)) {
  return hover(element, () => {
    if (!document.querySelector('.home-dock[data-email-returning="true"], [data-music-returning="true"]')) return start();
    let stop: void | (() => void);
    const moved = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      element.removeEventListener("pointermove", moved);
      stop = start();
    };
    element.addEventListener("pointermove", moved);
    return () => { element.removeEventListener("pointermove", moved); stop?.(); };
  });
}
