// Adapted from Bubble Navbar's hover/selection layers. See bubble-navbar/SOURCE.md.
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { activeBubbleSpring, dockBubbleBounds, hoverBubbleSpring } from "../lib/dock-bubbles";
import "./DockBubbles.css";

type Id = "chat" | "moments" | "email" | "theme";
type Item = { id: Id; button: HTMLButtonElement };
const selectors: [Id, string][] = [["chat", "[data-home-chat-trigger]"], ["moments", "[data-home-moments-trigger]"], ["email", "[data-copy-email]"], ["theme", "[data-theme-dial]"]];

export default function DockBubbles() {
  const [track, setTrack] = useState<HTMLElement | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [hovered, setHovered] = useState<Id | null>(null), [active, setActive] = useState<Id | null>(null);
  const [pressed, setPressed] = useState<Id | null>(null);
  const [, resize] = useState(0);
  const keyboard = useRef(false);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const controls = document.querySelector<HTMLElement>(".home-dock .dock-controls");
    if (!controls) return;
    const targets = selectors.flatMap(([id, selector]) => {
      const button = controls.querySelector<HTMLButtonElement>(selector);
      if (!button) return [];
      button.dataset.dockBubbleItem = id;
      return [{ id, button }];
    });
    setTrack(controls); setItems(targets);
    const state = () => {
      const selected = targets.find(({ id, button }) => (id === "chat" || id === "moments") && button.getAttribute("aria-expanded") === "true");
      setActive(selected?.id ?? null);
      for (const { id, button } of targets) button.dataset.dockSelected = String(id === selected?.id);
    };
    state();
    const observer = new MutationObserver(state);
    const sizes = new ResizeObserver(() => resize(value => value + 1));
    sizes.observe(controls);
    const hover = matchMedia("(hover: hover) and (pointer: fine)");
    const cleanup: (() => void)[] = [];
    for (const { id, button } of targets) {
      observer.observe(button, { attributes: true, attributeFilter: ["aria-expanded", "disabled"] });
      sizes.observe(button);
      const enter = (event: PointerEvent) => {
        if (event.pointerType !== "mouse" || !hover.matches || button.disabled) return;
        keyboard.current = false; setHovered(id);
      };
      const leave = () => setHovered(value => value === id ? null : value);
      const focus = () => { if (button.matches(":focus-visible")) { keyboard.current = true; setHovered(id); } };
      const down = () => { if (!button.disabled) { keyboard.current = false; setPressed(id); } };
      button.addEventListener("pointerenter", enter); button.addEventListener("pointerleave", leave);
      button.addEventListener("focus", focus); button.addEventListener("blur", leave); button.addEventListener("pointerdown", down);
      cleanup.push(() => {
        button.removeEventListener("pointerenter", enter); button.removeEventListener("pointerleave", leave);
        button.removeEventListener("focus", focus); button.removeEventListener("blur", leave); button.removeEventListener("pointerdown", down);
        delete button.dataset.dockBubbleItem; delete button.dataset.dockSelected;
      });
    }
    const release = () => setPressed(null);
    const blur = () => { setHovered(null); release(); };
    const key = () => { keyboard.current = true; };
    const media = () => { if (!hover.matches) setHovered(null); };
    document.addEventListener("keydown", key, true);
    window.addEventListener("pointerup", release); window.addEventListener("pointercancel", release); window.addEventListener("blur", blur);
    hover.addEventListener("change", media);
    return () => {
      observer.disconnect(); sizes.disconnect(); cleanup.forEach(remove => remove());
      document.removeEventListener("keydown", key, true);
      window.removeEventListener("pointerup", release); window.removeEventListener("pointercancel", release); window.removeEventListener("blur", blur);
      hover.removeEventListener("change", media);
    };
  }, []);

  if (!track || !track.offsetWidth || !track.offsetHeight) return null;
  const bounds = (id: Id | null) => {
    const button = items.find(item => item.id === id)?.button;
    if (!button) return null;
    return dockBubbleBounds(button.getBoundingClientRect(), track.getBoundingClientRect(), { width: track.offsetWidth, height: track.offsetHeight });
  };
  const hoverId = hovered ?? pressed ?? active;
  const hoverBox = bounds(hoverId), activeBox = bounds(active);
  const instant = !!reduced || keyboard.current;
  return createPortal(<div className="dock-bubbles" data-dock-bubbles data-active={active ?? "none"} data-hover={hoverId ?? "none"} aria-hidden="true">
    <AnimatePresence initial={false}>
      {hoverBox && <motion.span key="hover" className="dock-bubble dock-bubble-hover" data-dock-bubble="hover"
        initial={{ ...hoverBox, opacity: 0 }} animate={{ ...hoverBox, opacity: 1, scale: pressed === hoverId ? .96 : 1 }}
        exit={{ opacity: 0, scale: .96, transition: { duration: instant ? 0 : .12 } }}
        transition={instant ? { duration: 0 } : { ...hoverBubbleSpring, opacity: { duration: .12 } }} />}
      {activeBox && <motion.span key="active" className="dock-bubble dock-bubble-active" data-dock-bubble="active"
        initial={{ ...activeBox, opacity: 0 }} animate={{ ...activeBox, opacity: 1, scale: pressed === active ? .96 : 1 }}
        exit={{ opacity: 0, scale: .96, transition: { duration: instant ? 0 : .12 } }}
        transition={instant ? { duration: 0 } : { ...activeBubbleSpring, opacity: { duration: .12 } }} />}
    </AnimatePresence>
  </div>, track);
}
