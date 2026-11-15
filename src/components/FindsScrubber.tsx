import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { SCRUBBER_STEP, scrubPosition, scrubSnap } from "../lib/finds-scrubber";
import type { Find } from "../data/finds";

function Notch({ note, index, position, onMove }: { note: Find; index: number; position: MotionValue<number>; onMove: (value: number) => void }) {
  const x = useTransform(() => (index - position.get()) * SCRUBBER_STEP);
  const scaleY = useTransform(() => (5 + 9 / (1 + Math.abs(index - position.get()) * .8)) / 14);
  const opacity = useTransform(() => .18 + .72 / (1 + Math.abs(index - position.get()) * .5));
  return <motion.button type="button" tabIndex={-1} className="finds-scrubber-notch" data-find-segment={note.id} aria-label={`Select ${note.title}`} style={{ x }}
    onClick={event => { if (event.detail === 0) onMove(index); }}>
    <motion.span style={{ scaleY, opacity }} />
  </motion.button>;
}

export default function FindsScrubber({ notes, position, activeIndex, onGrab, onDrag, onMove }: {
  notes: Find[]; position: MotionValue<number>; activeIndex: number;
  onGrab: () => void; onDrag: (value: number) => void; onMove: (value: number) => void;
}) {
  const element = useRef<HTMLDivElement>(null), width = useRef(0);
  const gesture = useRef<{ pointer: number; x: number; y: number; start: number; moved: boolean; horizontal: boolean; tap: number | null } | null>(null);
  const [pressed, setPressed] = useState(false), [dragging, setDragging] = useState(false);
  const callbacks = useRef({ onGrab, onDrag, onMove }), wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useLayoutEffect(() => { callbacks.current = { onGrab, onDrag, onMove }; });
  const count = notes.length;
  const reset = () => {
    const current = gesture.current, wheeling = wheelTimer.current !== null; if (!current && !wheeling) return;
    if (wheelTimer.current) { clearTimeout(wheelTimer.current); wheelTimer.current = null; }
    gesture.current = null; setPressed(false); setDragging(false);
    if (current && element.current?.hasPointerCapture(current.pointer)) element.current.releasePointerCapture(current.pointer);
    const value = scrubSnap(position.get(), 0, count); position.jump(value); callbacks.current.onDrag(value);
  };
  useLayoutEffect(() => {
    const node = element.current; if (!node) return;
    width.current = node.clientWidth;
    const observer = new ResizeObserver(() => { if (width.current !== node.clientWidth) { reset(); width.current = node.clientWidth; } });
    let wheelStart = 0, wheelDelta = 0;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || gesture.current || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      if (!wheelTimer.current) { callbacks.current.onGrab(); wheelStart = position.get(); wheelDelta = 0; }
      else clearTimeout(wheelTimer.current);
      wheelDelta += event.deltaX * (event.deltaMode === 1 ? 16 : 1);
      callbacks.current.onDrag(scrubPosition(wheelStart, -wheelDelta, count));
      wheelTimer.current = setTimeout(() => { wheelTimer.current = null; callbacks.current.onMove(scrubSnap(position.get(), 0, count)); }, 120);
    };
    observer.observe(node);
    node.addEventListener("wheel", wheel, { passive: false });
    return () => {
      observer.disconnect(); const current = gesture.current; gesture.current = null;
      node.removeEventListener("wheel", wheel); if (wheelTimer.current) { clearTimeout(wheelTimer.current); wheelTimer.current = null; }
      if (current && node.hasPointerCapture(current.pointer)) node.releasePointerCapture(current.pointer);
    };
  }, [count, position]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) reset(); };
    window.addEventListener("blur", reset); document.addEventListener("visibilitychange", hidden);
    return () => { window.removeEventListener("blur", reset); document.removeEventListener("visibilitychange", hidden); };
  }, [count, position]);
  const release = (pointer: number, cancelled: boolean) => {
    const current = gesture.current; if (!current || current.pointer !== pointer) return;
    const velocity = position.getVelocity(); gesture.current = null; setPressed(false); setDragging(false);
    if (element.current?.hasPointerCapture(pointer)) element.current.releasePointerCapture(pointer);
    if (current.moved && !current.horizontal) { onMove(scrubSnap(position.get(), 0, count)); return; }
    onMove(cancelled ? scrubSnap(position.get(), 0, count) : current.moved ? scrubSnap(position.get(), velocity, count) : current.tap ?? scrubSnap(position.get(), 0, count));
  };
  return <div ref={element} className="finds-segments finds-scrubber" role="slider" tabIndex={0} aria-label="Card index" aria-orientation="horizontal"
    aria-valuemin={1} aria-valuemax={count} aria-valuenow={activeIndex + 1} aria-valuetext={`${activeIndex + 1} of ${count}: ${notes[activeIndex].title}`}
    data-pressed={pressed} data-dragging={dragging} onKeyDownCapture={event => { if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) reset(); }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) reset(); }} onPointerDown={event => {
      if (event.button !== 0 || gesture.current) return;
      if (wheelTimer.current) { clearTimeout(wheelTimer.current); wheelTimer.current = null; }
      onGrab(); const rect = event.currentTarget.getBoundingClientRect();
      const tick = (event.target as HTMLElement).closest<HTMLElement>("[data-find-segment]");
      const tap = tick ? notes.findIndex(note => note.id === tick.dataset.findSegment) : event.clientY > rect.top + 42 ? Math.round(position.get() + (event.clientX - rect.left - rect.width / 2) / SCRUBBER_STEP) : null;
      gesture.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, start: position.get(), moved: false, horizontal: false, tap };
      setPressed(true); event.currentTarget.focus({ preventScroll: true }); event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerMove={event => {
      const current = gesture.current; if (!current || current.pointer !== event.pointerId) return;
      const dx = event.clientX - current.x, dy = event.clientY - current.y;
      if (!current.moved && Math.hypot(dx, dy) < 6) return;
      if (!current.moved) { current.moved = true; current.horizontal = Math.abs(dx) > Math.abs(dy); }
      if (!current.horizontal) return;
      setDragging(true); onDrag(scrubPosition(current.start, dx, count));
    }} onPointerUp={event => release(event.pointerId, false)} onPointerCancel={event => release(event.pointerId, true)}
    onLostPointerCapture={event => { if (event.target === event.currentTarget) release(event.pointerId, true); }}>
    <div className="finds-scrubber-window" aria-hidden="true">
      <span className="finds-scrubber-grip"><i /><i /><i /></span>
      <span className="finds-index-count">{String(activeIndex + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
      <span className="finds-index-title">{notes[activeIndex].title}</span>
    </div>
    <div className="finds-scrubber-ruler" aria-hidden="true">
      {notes.map((note, index) => <Notch key={note.id} note={note} index={index} position={position} onMove={onMove} />)}
      <span className="finds-scrubber-pointer" />
    </div>
  </div>;
}
