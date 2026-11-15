import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { drawerSpring } from "../lib/finds-motion";
import { readTabOffset, readTabShouldOpen } from "../lib/finds-read-tab";

const readReduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const subscribe = (notify: () => void) => {
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

export default function FindsReadTab({ number, reading, onGrab, onOpen }: {
  number: string; reading: boolean; onGrab: () => void; onOpen: () => void;
}) {
  const element = useRef<HTMLButtonElement>(null), reduced = useSyncExternalStore(subscribe, readReduced, () => false);
  const y = useMotionValue(0), pitch = useTransform(y, [0, 64], [0, -7]);
  const gesture = useRef<{ pointer: number; x: number; y: number; start: number; moved: boolean; pulling: boolean } | null>(null);
  const [pressed, setPressed] = useState(false);
  const callbacks = useRef({ onGrab, onOpen });
  useLayoutEffect(() => { callbacks.current = { onGrab, onOpen }; });
  const release = (cancelled: boolean, event?: { pointerId: number; clientY: number }) => {
    const current = gesture.current;
    if (!current || (event && current.pointer !== event.pointerId)) return;
    gesture.current = null; setPressed(false);
    if (element.current?.hasPointerCapture(current.pointer)) element.current.releasePointerCapture(current.pointer);
    if (!cancelled && readTabShouldOpen((event?.clientY ?? current.y) - current.y, current.moved, current.pulling)) callbacks.current.onOpen();
    else animate(y, 0, reduced ? { duration: 0 } : drawerSpring);
  };
  useLayoutEffect(() => { release(true); if (!reading) y.jump(0); }, [reading, reduced, y]);
  useEffect(() => {
    const cancel = () => release(true), hidden = () => { if (document.hidden) cancel(); };
    const stage = element.current?.closest("[data-x-bookmarks-stage]");
    const observer = new MutationObserver(() => { if (stage?.getAttribute("aria-hidden") === "true" || stage?.getAttribute("data-x-bookmarks-state") === "closing") { cancel(); y.jump(0); } });
    if (stage) observer.observe(stage, { attributes: true, attributeFilter: ["aria-hidden", "data-x-bookmarks-state"] });
    window.addEventListener("blur", cancel); window.addEventListener("resize", cancel); document.addEventListener("visibilitychange", hidden);
    return () => {
      observer.disconnect(); window.removeEventListener("blur", cancel); window.removeEventListener("resize", cancel); document.removeEventListener("visibilitychange", hidden);
      const current = gesture.current; gesture.current = null; y.stop();
      if (current && element.current?.hasPointerCapture(current.pointer)) element.current.releasePointerCapture(current.pointer);
    };
  }, [y, reduced]);
  return <div className="finds-open-row">
    <motion.button ref={element} type="button" className="finds-read-tab" aria-label="Read this card" data-pressed={pressed}
      style={{ y, rotateX: reduced ? 0 : pitch, transformPerspective: 500 }} animate={{ opacity: reading ? 0 : 1 }} transition={{ duration: reduced ? 0 : .12 }}
      onClick={event => { if (event.detail === 0) { release(true); onOpen(); } }} onBlur={() => release(true)}
      onKeyDownCapture={event => { if (["ArrowLeft", "ArrowRight", "Home", "End", "Escape"].includes(event.key)) release(true); }}
      onPointerDown={event => {
        if (event.button !== 0 || gesture.current || reading) return;
        // Safari's default mouse focus would blur the tab and cancel this gesture.
        event.preventDefault();
        callbacks.current.onGrab(); y.stop();
        gesture.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, start: y.get(), moved: false, pulling: false };
        setPressed(true); event.currentTarget.focus({ preventScroll: true }); event.currentTarget.setPointerCapture(event.pointerId);
      }} onPointerMove={event => {
        const current = gesture.current; if (!current || current.pointer !== event.pointerId) return;
        const dx = event.clientX - current.x, dy = event.clientY - current.y;
        if (!current.moved && Math.hypot(dx, dy) < 6) return;
        if (!current.moved) { current.moved = true; current.pulling = dy > Math.abs(dx); }
        if (current.pulling) y.set(readTabOffset(current.start + dy));
      }} onPointerUp={event => release(false, event)} onPointerCancel={event => release(true, event)}
      onLostPointerCapture={event => { if (event.target === event.currentTarget) release(true, event); }}>
      <span className="finds-read-tab-print" aria-hidden="true"><span>READ</span><span>{number}</span></span>
      <span className="finds-read-tab-label">Pull to read</span>
      <span className="finds-read-tab-grip" aria-hidden="true" />
    </motion.button>
  </div>;
}
