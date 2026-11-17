import { hover } from "motion";

// Removing the composer can generate pointerenter without any mouse movement.
export function folderHover(element: HTMLElement, start: () => void | (() => void)) {
  return hover(element, () => {
    if (!document.querySelector('.home-dock[data-email-returning="true"]')) return start();
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
