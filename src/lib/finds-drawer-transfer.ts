import { animate, motionValue, type AnimationPlaybackControlsWithThen, type MotionValue } from "motion";
import { drawerFlightDuration, drawerFlightPose, type DrawerFlightPose } from "./drawer-flight";

// Disposable copies carry the current 3D presentation; the real cards keep their gestures.
export function createDrawerTransfer(root: HTMLElement, arrival: MotionValue<number>) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let pending: { drawer: string; id: string } | null = null;
  let traveler: HTMLElement | null = null, outgoing: HTMLElement | null = null, covered: HTMLElement | null = null;
  let controls: AnimationPlaybackControlsWithThen[] = [], generation = 0;
  const axes = { x: motionValue(0), y: motionValue(0), scale: motionValue(1), rotate: motionValue(0), tilt: motionValue(0) };
  const draw = () => { if (traveler) traveler.style.transform = `translate3d(${axes.x.get()}px,${axes.y.get()}px,0) rotate(${axes.rotate.get()}deg) rotateX(${axes.tilt.get()}deg) scale(${axes.scale.get()})`; };
  const stop = () => { for (const control of controls) control.stop(); controls = []; };
  const reveal = () => { covered?.removeAttribute("data-drawer-covered"); covered = null; };
  const finish = () => {
    ++generation; pending = null; stop(); reveal(); traveler?.remove(); outgoing?.remove(); traveler = outgoing = null;
    arrival.jump(1); root.dataset.drawerPhase = "idle";
  };
  const takeOver = () => {
    if (root.dataset.drawerPhase !== "moving") return;
    const run = ++generation; pending = null; stop(); reveal(); outgoing?.remove(); outgoing = null;
    root.dataset.drawerPhase = "settling";
    if (traveler) controls.push(animate(traveler, { opacity: 0 }, { duration: .06 }));
    controls.push(animate(arrival, 1, { duration: .12, ease: [.22, 1, .36, 1] }));
    void Promise.all(controls.map(control => control.finished.catch(() => undefined))).then(() => { if (run === generation) finish(); });
  };
  const mouth = (id: string) => {
    const rect = root.querySelector(`[data-find-drawer="${id}"]`)!.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + 12 };
  };
  const copyFan = (lead?: string) => {
    const rail = root.querySelector<HTMLElement>("[data-finds-rail]")!;
    const rect = rail.getBoundingClientRect(), copy = rail.cloneNode(true) as HTMLElement;
    for (const card of copy.querySelectorAll<HTMLElement>("[data-find-card]")) {
      if (lead ? card.dataset.findCard !== lead : card.hasAttribute("data-drawer-covered")) card.remove();
      else if (lead) Object.assign(card.style, { transform: "translate3d(0px,160px,0px)", opacity: "1", visibility: "visible" });
    }
    for (const element of [copy, ...copy.querySelectorAll<HTMLElement>("*")]) {
      element.removeAttribute("id");
      for (const attribute of [...element.attributes]) if (attribute.name.startsWith("data-")) element.removeAttribute(attribute.name);
    }
    copy.classList.add("finds-drawer-copy"); copy.setAttribute("aria-hidden", "true"); copy.inert = true;
    const style = getComputedStyle(rail);
    for (const token of ["--finds-paper", "--finds-ink", "--finds-rule", "--finds-muted"]) copy.style.setProperty(token, style.getPropertyValue(token));
    Object.assign(copy.style, { position: "fixed", left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, margin: "0", padding: "0", pointerEvents: "none" });
    document.body.append(copy); return copy;
  };
  const prepare = (from: string, drawer: string, id: string) => {
    ++generation; stop(); outgoing?.remove(); outgoing = null;
    if (reduced.matches) { finish(); return; }
    outgoing = copyFan(); outgoing.dataset.findsDrawerGhost = "";
    const rect = outgoing.getBoundingClientRect(), destination = mouth(from);
    controls.push(animate(outgoing, { x: destination.x - rect.left - rect.width / 2, y: destination.y - rect.top - rect.height / 2, scale: .08, opacity: 0 }, { duration: .3, ease: [.4, 0, .2, 1] }));
    reveal(); pending = { drawer, id }; arrival.jump(0); root.dataset.drawerPhase = "moving";
  };
  const commit = () => {
    if (!pending) return;
    const run = generation, next = pending; pending = null;
    const compact = matchMedia("(max-width:700px)").matches, retarget = !!traveler;
    const duration = drawerFlightDuration(compact, retarget);
    const fresh = copyFan(next.id), paper = fresh.querySelector<HTMLElement>(".finds-paper")!;
    const rect = fresh.getBoundingClientRect(), lead = paper.getBoundingClientRect();
    const center = { x: lead.left + lead.width / 2, y: lead.top + lead.height / 2 };
    if (traveler) {
      traveler.querySelector(".finds-rail-plane")!.replaceChildren(paper);
      fresh.remove();
    } else {
      traveler = fresh; traveler.dataset.findsDrawerTraveler = "";
      traveler.style.transformOrigin = `${center.x - rect.left}px ${center.y - rect.top}px`;
      const source = mouth(next.drawer), dx = source.x - center.x, dy = source.y - center.y;
      axes.x.jump(dx); axes.y.jump(dy); axes.scale.jump(compact ? .28 : .22); axes.rotate.jump(0); axes.tilt.jump(0); draw();
    }
    covered = root.querySelector<HTMLElement>(`[data-find-card="${next.id}"]`);
    covered?.setAttribute("data-drawer-covered", "");
    traveler.style.opacity = "1";
    const start = Object.fromEntries(Object.entries(axes).map(([key, axis]) => [key, axis.get()])) as DrawerFlightPose;
    const velocity = retarget ? Object.fromEntries(Object.entries(axes).map(([key, axis]) => [key, axis.getVelocity()])) as DrawerFlightPose : undefined;
    controls.push(animate(0, 1, { duration, ease: "linear", onUpdate: progress => {
      const pose = drawerFlightPose(progress, start, compact, velocity);
      for (const key of Object.keys(axes) as (keyof DrawerFlightPose)[]) axes[key].set(pose[key]);
      draw();
    } }));
    controls.push(animate(arrival, 1, { duration: duration * (retarget ? .75 : .6), delay: duration * (retarget ? .15 : .38), ease: "linear" }));
    void Promise.all(controls.map(control => control.finished.catch(() => undefined))).then(async () => {
      if (run !== generation) return;
      reveal();
      if (traveler) {
        const fade = animate(traveler, { opacity: 0 }, { duration: .06 }); controls.push(fade);
        await fade.finished.catch(() => undefined);
      }
      if (run === generation) finish();
    });
  };
  const interrupt = () => { if (root.dataset.drawerPhase !== "idle") finish(); };
  const hidden = () => { if (document.hidden) interrupt(); };
  const preference = () => { if (reduced.matches) interrupt(); };
  document.addEventListener("scroll", interrupt, true); document.addEventListener("visibilitychange", hidden);
  reduced.addEventListener("change", preference);
  root.dataset.drawerPhase = "idle";
  return { prepare, commit, finish, takeOver, dispose() {
    finish(); Object.values(axes).forEach(axis => axis.destroy());
    document.removeEventListener("scroll", interrupt, true); document.removeEventListener("visibilitychange", hidden);
    reduced.removeEventListener("change", preference);
  } };
}
