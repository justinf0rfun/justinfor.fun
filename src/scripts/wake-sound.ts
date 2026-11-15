import { wakeSound } from "../lib/wake-sound";

export function mountWakeSound() {
  const gestures = ["pointerdown", "keydown", "touchend", "click"];
  const unlock = (event: Event) => { if (event.isTrusted) wakeSound.unlock(); };
  for (const type of gestures) document.addEventListener(type, unlock, true);
  return () => { for (const type of gestures) document.removeEventListener(type, unlock, true); };
}

export function mountTocSound(toc: HTMLElement) {
  const entries = [...toc.querySelectorAll<HTMLElement>("[data-toc-entry]")];
  const hover = matchMedia("(hover: hover) and (pointer: fine)");
  const listeners = entries.map((entry, index) => {
    const enter = (event: PointerEvent) => {
      if (event.isTrusted && event.pointerType === "mouse" && hover.matches && !document.hidden) {
        wakeSound.play(entries.length < 2 ? .5 : index / (entries.length - 1));
      }
    };
    entry.addEventListener("pointerenter", enter);
    return () => entry.removeEventListener("pointerenter", enter);
  });
  return () => { for (const remove of listeners) remove(); };
}
