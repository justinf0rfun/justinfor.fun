import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "motion/react";
import DotsCharacter from "./DotsCharacter";
import MomentsTimeline from "./MomentsTimeline";
import { momentCharacters, previewMoments } from "../data/moments";
import { flightTransform, momentsPlacement } from "../lib/home-moments";
import "./HomeMoments.css";

type Phase = "closed" | "opening" | "open" | "closing";
type Placement = ReturnType<typeof momentsPlacement>;

export default function HomeMoments() {
  const [phase, setPhase] = useState<Phase>("closed");
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [character, setCharacter] = useState(1);
  const [animateCharacter, setAnimateCharacter] = useState(true);
  const [dockResponse, setDockResponse] = useState(0);
  const [index, setIndex] = useState(previewMoments.length - 1);
  const panel = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const dockSlot = useRef<HTMLElement | null>(null);
  const dock = useRef<HTMLElement | null>(null);
  const wanted = useRef(false);
  const animation = useRef<Animation | null>(null);
  const sequence = useRef(0);
  const settleFlight = useRef<(() => void) | null>(null);
  const origin = useRef<DOMRect | null>(null);
  const restoreBackground = useRef<(() => void) | null>(null);
  const keyboard = useRef(false);
  const restoreFocus = useRef(false);
  const reduced = useReducedMotion();
  const reducedRef = useRef(!!reduced);
  reducedRef.current = !!reduced;
  const open = phase === "opening" || phase === "open";

  function roleSlot() {
    return [...(panel.current?.querySelectorAll<HTMLElement>(".moments-character") ?? [])]
      .find(element => element.getBoundingClientRect().width > 0);
  }

  function attach(target: HTMLElement) {
    if (!host) return;
    target.append(host);
    host.className = "home-moments-character";
    host.removeAttribute("style");
  }

  function measure() {
    if (!dock.current) return;
    const main = document.querySelector<HTMLElement>(".home-content");
    const next = momentsPlacement({ width: window.innerWidth, height: window.innerHeight }, main?.getBoundingClientRect().left ?? 0, dock.current.getBoundingClientRect());
    setPlacement(next);
    dock.current.style.setProperty("--moments-sheet-width", `${next.width}px`);
    dock.current.dataset.momentsMode = next.mode;
  }

  function change(next: boolean, fromKeyboard = false) {
    if (!host || !trigger.current || !dock.current) return;
    origin.current = host.getBoundingClientRect();
    wanted.current = next; keyboard.current = fromKeyboard;
    if (!next) restoreFocus.current = fromKeyboard || !!panel.current?.contains(document.activeElement);
    if (next) {
      window.dispatchEvent(new CustomEvent("home-moments-opening"));
      window.dispatchEvent(new CustomEvent("home-moments-change", { detail: true }));
      dock.current.style.transform = "scale(1)";
      measure();
      dock.current.dataset.momentsOpen = "true";
    }
    trigger.current.setAttribute("aria-expanded", String(next));
    setPhase(next ? "opening" : "closing");
  }

  useEffect(() => {
    const button = document.querySelector<HTMLButtonElement>("[data-home-moments-trigger]");
    const slot = document.querySelector<HTMLElement>("[data-home-moments-slot]");
    const homeDock = document.querySelector<HTMLElement>(".home-dock");
    if (!button || !slot || !homeDock) return;
    trigger.current = button; dockSlot.current = slot; dock.current = homeDock;
    const container = document.createElement("div"); container.className = "home-moments-character";
    slot.append(container);
    setHost(container); button.disabled = false;
    const toggle = (event: MouseEvent) => changeRef.current(!wanted.current, event.detail === 0);
    const hoverMotion = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const respond = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !hoverMotion.matches || wanted.current || homeDock.dataset.momentsOpen === "true") return;
      setDockResponse(value => value + 1);
    };
    const creditResponse = () => {
      if (document.documentElement.dataset.inspiredSource === "dots" && !wanted.current && !reducedRef.current) setDockResponse(value => value + 1);
    };
    const closeForCredits = () => { if (wanted.current) changeRef.current(false); };
    const resize = () => {
      measureRef.current();
      requestAnimationFrame(() => {
        if (!hostRef.current) return;
        if (animation.current) { settleFlight.current?.(); return; }
        if (!wanted.current) return;
        const target = roleSlotRef.current();
        if (target && !animation.current) attachRef.current(target);
      });
    };
    button.addEventListener("click", toggle);
    button.addEventListener("pointerenter", respond);
    window.addEventListener("inspired-preview", creditResponse);
    window.addEventListener("inspired-opening", closeForCredits);
    window.addEventListener("home-email-opening", closeForCredits);
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    return () => {
      ++sequence.current; animation.current?.cancel(); restoreBackground.current?.();
      button.removeEventListener("click", toggle); button.disabled = true;
      button.removeEventListener("pointerenter", respond);
      window.removeEventListener("inspired-preview", creditResponse);
      window.removeEventListener("inspired-opening", closeForCredits);
      window.removeEventListener("home-email-opening", closeForCredits);
      button.setAttribute("aria-expanded", "false");
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      delete slot.dataset.companionMounted; delete homeDock.dataset.momentsOpen; delete homeDock.dataset.momentsMode;
      homeDock.style.removeProperty("--moments-sheet-width");
      window.dispatchEvent(new CustomEvent("home-moments-change", { detail: false }));
      container.remove();
    };
  }, []);

  // Native Dock markup and the single WebGL host keep stable event listeners.
  const changeRef = useRef(change), measureRef = useRef(measure), roleSlotRef = useRef(roleSlot), attachRef = useRef(attach), hostRef = useRef(host);
  changeRef.current = change; measureRef.current = measure; roleSlotRef.current = roleSlot; attachRef.current = attach; hostRef.current = host;

  useLayoutEffect(() => {
    if (host && dockSlot.current) dockSlot.current.dataset.companionMounted = "true";
  }, [host]);

  useLayoutEffect(() => {
    if (!host || !dockSlot.current || (phase !== "opening" && phase !== "closing")) return;
    const opening = phase === "opening";
    const target = opening ? roleSlot() : dockSlot.current;
    if (!target) return;
    const token = ++sequence.current;
    const from = origin.current ?? host.getBoundingClientRect();
    animation.current?.cancel();
    const bounds = target.getBoundingClientRect();
    const size = opening ? bounds.width : 44;
    const destination = { left: bounds.left + (bounds.width - size) / 2, top: bounds.top + (bounds.height - size) / 2, width: size, height: size };
    document.body.append(host);
    host.className = "home-moments-character home-moments-traveler";
    Object.assign(host.style, { left: `${destination.left}px`, top: `${destination.top}px`, width: `${size}px`, height: `${size}px` });
    const { x, y, scale } = flightTransform(from, destination);
    const finish = () => {
      if (sequence.current !== token) return;
      animation.current?.cancel();
      animation.current = null;
      settleFlight.current = null;
      const destinationSlot = opening ? roleSlot() : dockSlot.current;
      if (destinationSlot) attach(destinationSlot);
      if (opening) {
        setPhase("open");
      } else {
        setPhase("closed");
        restoreBackground.current?.(); restoreBackground.current = null;
        if (dock.current) delete dock.current.dataset.momentsOpen;
        window.dispatchEvent(new CustomEvent("home-moments-change", { detail: false }));
        if (restoreFocus.current) trigger.current?.focus({ preventScroll: true });
      }
    };
    settleFlight.current = finish;
    if (reducedRef.current || keyboard.current) { finish(); return; }
    animation.current = host.animate([
      { transform: `translate(${x}px,${y}px) scale(${scale})` },
      { offset: 0.52, transform: `translate(${x * 0.45}px,${y * 0.45 - 32}px) scale(${scale + (1 - scale) * 0.65}) rotate(${opening ? -8 : 8}deg)` },
      { transform: "translate(0,0) scale(1) rotate(0deg)" },
    ], { duration: opening ? 580 : 440, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" });
    animation.current.finished.then(finish, () => {});
  }, [phase, host]);

  useEffect(() => {
    if (reduced && animation.current) settleFlight.current?.();
  }, [reduced]);

  useLayoutEffect(() => {
    if (phase === "closed") {
      restoreBackground.current?.(); restoreBackground.current = null;
      return;
    }
    if (phase === "closing" || placement?.mode !== "sheet" || restoreBackground.current) return;
    const main = document.querySelector<HTMLElement>(".home-content");
    const controls = [...(dock.current?.querySelectorAll<HTMLElement>(".dock-controls > *") ?? [])].filter(element => !element.matches("[data-home-moments-trigger]"));
    if (!main) return;
    const previous = main.inert, overflow = document.documentElement.style.overflow;
    const inert = controls.map(element => element.inert);
    main.inert = true; document.documentElement.style.overflow = "hidden";
    controls.forEach(element => { element.inert = true; });
    restoreBackground.current = () => {
      main.inert = previous; document.documentElement.style.overflow = overflow;
      controls.forEach((element, i) => { element.inert = inert[i]; });
    };
  }, [phase, placement?.mode]);

  useLayoutEffect(() => {
    if (phase === "open" && keyboard.current) closeButton.current?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    if (phase === "closed") return;
    if (placement?.mode === "side" && restoreBackground.current) {
      restoreBackground.current(); restoreBackground.current = null;
    }
    const outside = (event: PointerEvent) => {
      const target = event.target as Element;
      if (panel.current?.contains(target) || trigger.current?.contains(target)) return;
      change(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); change(false, true); }
      if (event.key !== "Tab" || placement?.mode !== "sheet") return;
      if (phase !== "open") { event.preventDefault(); trigger.current?.focus({ preventScroll: true }); return; }
      const stops = [...(panel.current?.querySelectorAll<HTMLElement>("button,input") ?? []), trigger.current!].filter(element => !element.closest('[aria-hidden="true"], [hidden]') && element.getBoundingClientRect().width > 0);
      const current = stops.indexOf(document.activeElement as HTMLElement);
      const next = (current + (event.shiftKey ? -1 : 1) + stops.length) % stops.length;
      event.preventDefault(); stops[next]?.focus({ preventScroll: true });
    };
    window.addEventListener("pointerdown", outside);
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("pointerdown", outside); window.removeEventListener("keydown", key); };
  }, [phase, placement?.mode, host]);

  useEffect(() => {
    if (dockSlot.current) {
      const poster = dockSlot.current.querySelector<HTMLImageElement>(":scope > img");
      if (poster) poster.src = `/moments-reference/${momentCharacters[character].image}`;
    }
  }, [character]);

  const style = placement ? { "--moments-left": `${placement.left}px`, "--moments-top": `${placement.top}px`, "--moments-width": `${placement.width}px`, "--moments-anchor": `${placement.anchor}px`, "--moments-max-height": `${placement.maxHeight}px` } as CSSProperties : undefined;
  return <>
    <section ref={panel} id="home-moments" className="home-moments-scene" data-phase={phase} data-mode={placement?.mode ?? "side"} style={style} hidden={phase === "closed"} inert={phase !== "open"} role={placement?.mode === "sheet" ? "dialog" : "region"} aria-modal={placement?.mode === "sheet" && phase !== "closed" ? true : undefined} aria-labelledby="home-moments-title">
      <header className="home-moments-header"><h2 id="home-moments-title">Moments</h2><button ref={closeButton} type="button" aria-label="收起碎碎念" onClick={event => change(false, event.detail === 0)}><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button></header>
      <MomentsTimeline moments={previewMoments} characterIndex={character} onCharacterChange={(next, animate) => { setCharacter(next); setAnimateCharacter(animate); }} onIndexChange={setIndex} externalCharacter presentation="dock" active={open} />
    </section>
    {host && createPortal(<DotsCharacter character={character} facing={-12 + index / (previewMoments.length - 1) * 24} animateSelection={animateCharacter} surface={phase === "closed" ? "dock" : phase === "open" ? "stage" : "travel"} response={dockResponse} />, host)}
  </>;
}
