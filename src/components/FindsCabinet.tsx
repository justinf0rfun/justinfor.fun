import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, AnimatePresence, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform, useVelocity, type MotionValue } from "motion/react";
import { finds, findDrawers, inDrawer, type Find } from "../data/finds";
import { cardPose, cardSpring, clampCard, drawerSpring, fanLayout, followFind, indexSpring, stackLift } from "../lib/finds-motion";
import FindsScrubber from "./FindsScrubber";
import FindsReadTab from "./FindsReadTab";
import FindsReader from "./FindsReader";
import { scrubVelocity } from "../lib/finds-scrubber";
import { createDrawerTransfer } from "../lib/finds-drawer-transfer";
import { paperArrival } from "../lib/drawer-flight";
import { stepSound } from "../lib/step-sound";
import "./finds/FindsCabinet.css";

function Paper({ note, index, position, speed, spread, arrival, hover, selected, reading, onPick, onHover }: {
  note: Find; index: number; position: MotionValue<number>; speed: MotionValue<number>; spread: MotionValue<number>; arrival: MotionValue<number>; hover: number | null;
  selected: boolean; reading: boolean; onPick: () => void; onHover: (index: number) => void;
}) {
  const reduced = useReducedMotion();
  const phase = useTransform(() => paperArrival(arrival.get(), index - position.get()));
  const x = useTransform(() => cardPose(index, position.get(), hover, 0, spread.get()).x * phase.get());
  const targetY = useTransform(() => cardPose(index, position.get(), hover, reduced ? 0 : speed.get()).y);
  const springY = useSpring(targetY, cardSpring);
  const y = useTransform(() => (reduced ? targetY.get() : springY.get()) * stackLift(index - position.get(), spread.get()) * phase.get());
  const z = useTransform(() => cardPose(index, position.get(), hover, 0, spread.get()).z * phase.get());
  const size = useTransform(phase, value => .96 + value * .04);
  const turn = useTransform(() => (1 - phase.get()) * Math.sign(index - position.get()) * 4);
  const readingFade = useMotionValue(reading && selected ? 0 : 1);
  const opacity = useTransform(() => readingFade.get() * Math.min(1, phase.get() * 2));
  useLayoutEffect(() => {
    const target = reading && selected ? 0 : 1;
    if (readingFade.get() === target) return;
    const control = animate(readingFade, target, { duration: reduced ? 0 : .16 });
    return () => control.stop();
  }, [readingFade, reading, selected, reduced]);
  return <motion.button type="button" className="finds-paper" data-find-card={note.id} data-find-mock={note.mock} aria-label={`${selected ? "Read" : "Select"} ${note.title}`}
    aria-pressed={selected} style={{ x, y, z, opacity, scale: size, rotateZ: turn }} onClick={onPick}
    onPointerEnter={event => { if (event.pointerType === "mouse") onHover(index); }}>
    {selected && <span className="finds-selection-dot" data-find-selection-dot aria-hidden="true" />}
    <span className="finds-paper-number">{note.number}<span> / Finds</span></span>
    <span className="finds-paper-heading">{note.title}</span>
    <span className="finds-paper-source">{note.mock ? "Card index" : `@${note.snapshot.authorHandle}`}</span>
  </motion.button>;
}

export default function FindsCabinet() {
  const [drawer, setDrawer] = useState("all"), [selected, setSelected] = useState(finds[0].id);
  const [reading, setReading] = useState(false), [trail, setTrail] = useState<string[]>([]);
  const [hover, setHover] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const soundEnabled = useRef(false), previousSelection = useRef(selected);
  const armSound = (event: { isTrusted: boolean }) => { if (event.isTrusted) soundEnabled.current = true; };
  const [handoff, setHandoff] = useState<{ token: number; note: Find; from: { x: number; y: number; scale: number }; to: { x: number; y: number; scale: number } } | null>(null);
  const transfer = useRef(0);
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null), rail = useRef<HTMLDivElement>(null), reader = useRef<HTMLElement>(null);
  const drag = useRef<{ x: number; y: number; start: number; moved: boolean; horizontal: boolean } | null>(null);
  const moved = useRef(false), wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flight = useRef<ReturnType<typeof animate> | null>(null), target = useRef(0);
  const position = useMotionValue(0);
  const speed = useVelocity(position);
  const spread = useMotionValue(1);
  const arrival = useMotionValue(1), drawerTransfer = useRef<ReturnType<typeof createDrawerTransfer> | null>(null);
  const [drawerRequest, setDrawerRequest] = useState(0);
  const notes = finds.filter(note => inDrawer(note, drawer));
  const current = finds.find(note => note.id === selected) ?? finds[0];
  const activeIndex = Math.max(0, notes.findIndex(note => note.id === selected));
  useEffect(() => {
    const changed = previousSelection.current !== selected; previousSelection.current = selected;
    if (changed && soundEnabled.current && !document.hidden && root.current?.closest(".x-bookmarks-stage.is-open")) stepSound.play();
  }, [selected]);
  useEffect(() => {
    const unlock = (event: Event) => { if (event.isTrusted) stepSound.unlock(); };
    const gestures = ["pointerdown", "keydown", "touchend"];
    for (const type of gestures) document.addEventListener(type, unlock, true);
    return () => { for (const type of gestures) document.removeEventListener(type, unlock, true); stepSound.stop(); };
  }, []);

  useMotionValueEvent(position, "change", value => {
    const note = notes[Math.round(clampCard(value, notes.length))];
    if (note) setSelected(note.id);
  });
  const move = (value: number, instant = false, velocity?: number) => {
    drawerTransfer.current?.takeOver();
    flight.current?.stop(); target.current = clampCard(value, notes.length);
    if (instant || reduced) position.set(target.current);
    else flight.current = animate(position, target.current, velocity === undefined ? indexSpring : { ...indexSpring, velocity });
  };
  const chooseDrawer = (id: string, noteId?: string) => {
    const next = finds.filter(note => inDrawer(note, id));
    const index = Math.max(0, next.findIndex(note => note.id === (noteId ?? selected)));
    if (wheelTimer.current) { clearTimeout(wheelTimer.current); wheelTimer.current = null; }
    drag.current = null; moved.current = false;
    flight.current?.stop(); position.jump(index); target.current = index; setDrawer(id); setSelected(next[index].id);
    setHover(null);
  };
  const switchDrawer = (id: string) => {
    setHandoff(null); setReading(false);
    const next = finds.filter(note => inDrawer(note, id));
    const nextId = next.find(note => note.id === selected)?.id ?? next[0].id;
    drawerTransfer.current?.prepare(drawer, id, nextId);
    chooseDrawer(id, nextId); setDrawerRequest(value => value + 1);
  };
  const open = (note: Find) => {
    drawerTransfer.current?.finish();
    if (!inDrawer(note, drawer)) chooseDrawer(note.topics[0], note.id);
    else move(notes.findIndex(item => item.id === note.id));
    setTrail(value => followFind(reading ? value : [], note.id)); setReading(true);
  };
  const close = () => {
    setReading(false); setHandoff(null);
    requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>(`[data-find-card="${selected}"]`)?.focus({ preventScroll: true }));
  };
  const follow = (id: string) => {
    const note = finds.find(item => item.id === id); if (!note) return;
    const nextDrawer = note.topics[0];
    if (drawer !== nextDrawer && !reduced) {
      const from = root.current?.querySelector(`[data-find-drawer="${nextDrawer}"]`)?.getBoundingClientRect();
      const to = reader.current?.getBoundingClientRect();
      if (from && to) setHandoff({ token: ++transfer.current, note,
        from: { x: from.left + from.width / 2 - 152, y: from.top + from.height / 2 - 206.5, scale: from.width / 304 },
        to: { x: to.left + to.width / 2 - 152, y: to.top + Math.min(to.height / 2, 260) - 206.5, scale: Math.min(.9, (to.width - 32) / 304) } });
    }
    open(note); chooseDrawer(nextDrawer, note.id);
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("finds-position") ?? "null");
      if (saved && findDrawers.some(item => item.id === saved.drawer) && finds.some(note => note.id === saved.id && inDrawer(note, saved.drawer))) chooseDrawer(saved.drawer, saved.id);
    } catch { /* A blocked or old session must not prevent browsing. */ }
    setReady(true);
    return () => { flight.current?.stop(); if (wheelTimer.current) clearTimeout(wheelTimer.current); };
  }, []);
  useEffect(() => {
    if (ready) try { sessionStorage.setItem("finds-position", JSON.stringify({ drawer, id: selected })); } catch { /* Browsing also works without storage. */ }
  }, [drawer, selected, ready]);
  useEffect(() => {
    if (!reading) return;
    reader.current?.scrollTo(0, 0); reader.current?.focus({ preventScroll: true });
  }, [reading, selected]);
  useLayoutEffect(() => {
    if (!root.current) return;
    const controller = createDrawerTransfer(root.current, arrival); drawerTransfer.current = controller;
    return () => { controller.dispose(); drawerTransfer.current = null; };
  }, [arrival]);
  useLayoutEffect(() => { drawerTransfer.current?.commit(); }, [drawerRequest]);
  useEffect(() => {
    const stage = root.current?.closest<HTMLElement>("[data-x-bookmarks-stage]");
    if (!stage) return;
    const observer = new MutationObserver(() => { if (stage.getAttribute("aria-hidden") === "true" || stage.dataset.xBookmarksState === "closing") { setReading(false); setHandoff(null); drawerTransfer.current?.finish(); soundEnabled.current = false; stepSound.stop(); } });
    observer.observe(stage, { attributes: true, attributeFilter: ["aria-hidden", "data-x-bookmarks-state"] });
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const element = rail.current;
    if (!element) return;
    let previousWidth = 0;
    const layout = () => {
      if (!element.clientWidth) return;
      if (previousWidth && previousWidth !== element.clientWidth) drawerTransfer.current?.finish();
      previousWidth = element.clientWidth;
      const next = fanLayout(element.clientWidth, matchMedia("(max-width:700px)").matches);
      spread.set(next.spread); element.style.setProperty("--finds-fan-scale", String(next.scale));
    };
    layout(); const observer = new ResizeObserver(layout); observer.observe(element);
    return () => observer.disconnect();
  }, [spread]);
  useEffect(() => {
    const element = rail.current;
    if (!element || reading) return;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) + Math.abs(event.deltaY) < 1) return;
      event.preventDefault();
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      move(target.current + delta * (event.deltaMode === 1 ? 16 : 1) / 240);
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
      wheelTimer.current = setTimeout(() => move(Math.round(target.current)), 120);
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => { element.removeEventListener("wheel", wheel); if (wheelTimer.current) clearTimeout(wheelTimer.current); };
  }, [drawer, reading, reduced]);

  return <div ref={root} className="finds-cabinet" data-finds-cabinet data-finds-ready={ready} data-reading={reading} data-drawer={drawer} data-selected={selected}
    onPointerDownCapture={armSound} onKeyDownCapture={armSound} onWheelCapture={armSound} onKeyDown={event => {
    const indexControl = (event.target as HTMLElement).closest<HTMLElement>(".finds-segments");
    if (event.key === "Escape" && reading) { event.preventDefault(); event.stopPropagation(); close(); }
    else if (!reading && (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || (indexControl && ["ArrowUp", "ArrowDown"].includes(event.key)))) {
      event.preventDefault(); event.stopPropagation();
      indexControl?.focus({ preventScroll: true });
      move(event.key === "Home" ? 0 : event.key === "End" ? notes.length - 1 : activeIndex + (["ArrowRight", "ArrowUp"].includes(event.key) ? 1 : -1));
    }
  }}>
    <div className="finds-workspace">
      <aside className="finds-cabinet-bank" aria-label="Finds drawers">
        <div className="finds-cabinet-top" aria-hidden="true" />
        <div className="finds-drawers">
          {findDrawers.map((item, index) => <button type="button" key={item.id} className="finds-drawer" data-find-drawer={item.id}
            aria-pressed={drawer === item.id} aria-label={`Open ${item.label} drawer`} onClick={() => switchDrawer(item.id)}>
            <span className="finds-drawer-box" aria-hidden="true"><span className="finds-drawer-papers" /></span>
            <motion.span className="finds-drawer-face" data-finds-home-target={index === 0 ? "" : undefined}
              animate={{ y: drawer === item.id ? 18 : 0, z: drawer === item.id ? 30 : 0 }} transition={reduced ? { duration: 0 } : drawerSpring}>
              <span className="finds-label-frame"><span>{item.label}</span><span className="finds-drawer-count">{finds.filter(note => inDrawer(note, item.id)).length.toString().padStart(2, "0")}</span></span>
              <span className="finds-metal-handle" aria-hidden="true" />
            </motion.span>
          </button>)}
        </div>
        <div className="finds-cabinet-foot" aria-hidden="true" />
        <p className="finds-bank-label">Justin’s card index <span>Est. 2026</span></p>
      </aside>

      <div className="finds-desk" inert={reading} onFocusCapture={event => { if (event.target.matches(":focus-visible")) drawerTransfer.current?.finish(); }}>
        <div ref={rail} className="finds-rail" data-finds-rail aria-label="Browse note cards" onPointerDown={event => {
          if (event.button !== 0) return;
          drawerTransfer.current?.takeOver();
          moved.current = false; drag.current = { x: event.clientX, y: event.clientY, start: position.get(), moved: false, horizontal: false };
        }} onPointerMove={event => {
          const gesture = drag.current; if (!gesture) return;
          const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
          if (!gesture.moved && Math.hypot(dx, dy) < 8) return;
          if (!gesture.moved) { gesture.horizontal = Math.abs(dx) > Math.abs(dy); gesture.moved = true; }
          if (!gesture.horizontal) return;
          event.currentTarget.setPointerCapture(event.pointerId); flight.current?.stop(); moved.current = true;
          position.set(clampCard(gesture.start - dx / 80, notes.length)); target.current = position.get();
        }} onPointerUp={event => {
          const gesture = drag.current; drag.current = null;
          if (gesture?.horizontal) { const projected = position.get() + position.getVelocity() * .12; move(Math.round(clampCard(projected, notes.length))); }
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }} onPointerCancel={() => { drag.current = null; move(Math.round(position.get())); }} onLostPointerCapture={event => { if (event.target === event.currentTarget && drag.current) { drag.current = null; move(Math.round(position.get())); } }}>
          <div className="finds-rail-scale"><div className="finds-rail-plane" onPointerLeave={() => setHover(null)}>
            {notes.map((note, index) => <Paper key={note.id} note={note} index={index} position={position} speed={speed} spread={spread} arrival={arrival} hover={hover} selected={note.id === selected} reading={reading} onHover={setHover} onPick={() => {
                if (moved.current) return;
                if (note.id === selected) open(note); else move(index);
              }} />)}
          </div></div>
        </div>
        <FindsScrubber key={`${drawer}:${drawerRequest}:${reading}`} notes={notes} position={position} activeIndex={activeIndex}
          onGrab={() => {
            drawerTransfer.current?.takeOver(); flight.current?.stop();
            position.jump(position.get());
            target.current = clampCard(position.get(), notes.length);
            if (wheelTimer.current) { clearTimeout(wheelTimer.current); wheelTimer.current = null; }
          }} onDrag={value => { position.set(value); target.current = clampCard(value, notes.length); }}
          onMove={value => move(value, false, scrubVelocity(position.get(), position.getVelocity(), notes.length))} />
        <FindsReadTab key={`${drawer}:${drawerRequest}:${selected}`} number={current.number} reading={reading}
          onGrab={() => {
            drawerTransfer.current?.finish(); flight.current?.stop();
            if (wheelTimer.current) { clearTimeout(wheelTimer.current); wheelTimer.current = null; }
            position.jump(activeIndex); target.current = activeIndex;
          }} onOpen={() => open(current)} />
      </div>

      <AnimatePresence initial={false}>
        {reading && <FindsReader ref={reader} key="reader" note={current} trail={trail} reduced={!!reduced} onClose={close} onFollow={follow} />}
      </AnimatePresence>
    </div>
    {handoff && <motion.div key={handoff.token} className="finds-paper finds-link-flight" aria-hidden="true" data-finds-transfer
      initial={{ ...handoff.from, opacity: 0, rotate: -8 }} animate={{ ...handoff.to, opacity: [0, 1, 1, 0], rotate: 0 }}
      transition={{ ...drawerSpring, opacity: { duration: .55, times: [0, .15, .7, 1] } }}
      onAnimationComplete={() => setHandoff(value => value?.token === handoff.token ? null : value)}>
      <span className="finds-paper-number">{handoff.note.number} / Finds</span><span className="finds-paper-heading">{handoff.note.title}</span>
    </motion.div>}
    <span className="sr-only" role="status" aria-live="polite">{findDrawers.find(item => item.id === drawer)?.label}: {current.title}, card {activeIndex + 1} of {notes.length}.</span>
  </div>;
}
