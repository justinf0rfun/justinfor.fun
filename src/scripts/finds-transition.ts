import { animate, type AnimationPlaybackControlsWithThen } from "motion";
import { drawerSpring } from "../lib/finds-motion";

// Carry the actual wooden face instead of the old disposable paper flight.
export function createXBookmarksTransition(overlay: HTMLElement) {
  let source: HTMLElement | null = null, face: HTMLElement | null = null, twin: HTMLElement | null = null;
  let flight: AnimationPlaybackControlsWithThen | null = null, surface: AnimationPlaybackControlsWithThen | null = null;
  let generation = 0;
  const instant = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const setState = (state: string) => {
    overlay.dataset.xBookmarksState = state;
    overlay.classList.toggle("is-open", state !== "closed");
    overlay.setAttribute("aria-hidden", String(state === "closed")); overlay.inert = state === "closed";
  };
  const clear = () => { flight?.stop(); twin?.remove(); twin = null; overlay.classList.remove("is-arriving"); };
  const pose = (element: HTMLElement, base: DOMRect) => {
    const rect = element.getBoundingClientRect();
    return { x: rect.left - base.left, y: rect.top - base.top, scaleX: rect.width / base.width, scaleY: rect.height / base.height };
  };
  const makeTwin = (element = face) => {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    twin = element.cloneNode(true) as HTMLElement;
    twin.removeAttribute("data-folder-flap"); twin.className = "finds-entry-flight finds-drawer-face";
    Object.assign(twin.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, transform: "none" });
    document.body.append(twin); return rect;
  };
  return {
    async open(next: { folder: HTMLElement; items: HTMLElement[] }) {
      const run = ++generation; clear(); surface?.stop(); source = next.folder; face = source.querySelector("[data-folder-flap]");
      const base = makeTwin(); setState("opening"); overlay.classList.add("is-arriving");
      source.style.visibility = "hidden";
      surface = animate(overlay, { opacity: [0, 1] }, { duration: instant() ? 0 : .26 });
      const target = overlay.querySelector<HTMLElement>("[data-finds-home-target]");
      if (base && twin && target) {
        flight = animate(twin, { ...pose(target, base), opacity: 1 }, instant() ? { duration: 0 } : drawerSpring);
        await flight.finished.catch(() => undefined);
      }
      if (run !== generation) return false;
      clear(); source.classList.add("is-landed"); source.style.visibility = ""; setState("open");
      overlay.querySelector<HTMLButtonElement>("[data-x-bookmarks-close]")?.focus({ preventScroll: true }); return true;
    },
    async close() {
      const run = ++generation; clear(); surface?.stop(); setState("closing");
      const target = overlay.querySelector<HTMLElement>("[data-finds-home-target]");
      const base = target ? makeTwin(target) : null;
      overlay.classList.add("is-arriving");
      if (base && twin && face) flight = animate(twin, { ...pose(face, base), opacity: 1 }, instant() ? { duration: 0 } : drawerSpring);
      surface = animate(overlay, { opacity: 0 }, { duration: instant() ? 0 : .22 });
      await Promise.all([surface.finished.catch(() => undefined), flight?.finished.catch(() => undefined)]);
      if (run !== generation) return false;
      clear();
      source?.classList.remove("is-landed"); if (source) source.style.visibility = "";
      setState("closed"); source?.focus({ preventScroll: true }); return true;
    },
  };
}
