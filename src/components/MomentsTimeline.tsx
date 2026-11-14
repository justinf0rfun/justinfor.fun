import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform, useVelocity, type MotionStyle, type MotionValue } from "motion/react";
import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { momentCharacters, type Moment } from "../data/moments";
import DotsCharacter from "./DotsCharacter";
import { MOBILE_MOMENT_STEP, bubblePosition, characterCenter, clamp, indexProgress, majorTickScale, minorTickScale, mobileClickIndex, nearestMoment, tickDivisions } from "../lib/moment-timeline";
import "./MomentsTimeline.css";

const ENTER = [0.19, 1, 0.22, 1] as const;
const EXIT = [0.22, 0.68, 0.3, 1] as const;
const FLAG = "M116 24c0 6.627-5.373 12-12 12H72c-6.627 0-12 5.373-12 12v22a2 2 0 1 1-4 0V48c0-6.627-5.373-12-12-12H12C5.373 36 0 30.627 0 24V12C0 5.373 5.373 0 12 0h92c6.627 0 12 5.373 12 12z";

function Chevron({ next = false }: { next?: boolean }) {
  return <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d={next ? "m7 4 6 6-6 6" : "m13 4-6 6 6 6"} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function RollingDate({ value, instant }: { value: string; instant: boolean }) {
  const previous = useRef(value);
  const direction = value >= previous.current ? 1 : -1;
  useEffect(() => { previous.current = value; }, [value]);
  return <span className="moments-date" aria-hidden="true">{value.split("").map((digit, i) => /\d/.test(digit) ?
    <span className="moments-digit" key={i}><AnimatePresence initial={false} custom={{ direction, instant }}>
      <motion.span key={digit} custom={{ direction, instant }} variants={{ enter: (state: { direction: number; instant: boolean }) => ({ y: state.instant ? 0 : `${state.direction * 100}%` }), leave: (state: { direction: number; instant: boolean }) => ({ y: state.instant ? 0 : `${state.direction * -100}%` }) }} initial="enter" animate={{ y: 0 }} exit="leave" transition={{ duration: instant ? 0 : 0.18, ease: ENTER }}>{digit}</motion.span>
    </AnimatePresence></span> : <span key={i}>{digit}</span>)}</span>;
}

function Tick({ at, pointer, growth, major, mobile = false }: { at: number; pointer: MotionValue<number>; growth: MotionValue<number>; major: boolean; mobile?: boolean }) {
  const scale = useTransform(() => major ? majorTickScale(at - pointer.get()) : mobile ? 1 : minorTickScale(at - pointer.get(), growth.get()));
  const radius = useTransform(scale, (value) => `9px / ${9 * value}px`);
  return <motion.span className={major ? "moments-major" : "moments-minor"} style={{ left: at, ...(major ? { scaleX: scale, borderRadius: radius } : { scaleY: scale }) }} />;
}

function Bubble({ moments, index, instant }: { moments: Moment[]; index: number; instant: boolean }) {
  const renderMessage = (item: Moment) => <>{item.message}<time className="moments-bubble-time" dateTime={item.time}>{item.time}</time>{item.reaction && <span className="moments-reaction" aria-hidden="true"><img src={`/moments-reference/${item.reaction}.png`} alt="" width="28" height="28" /></span>}</>;
  return <>
    {moments.map(item => <div className="moments-bubble moments-reserve" aria-hidden="true" key={item.id}>{renderMessage(item)}</div>)}
    <AnimatePresence initial={false}>
      <motion.div className="moments-bubble moments-bubble-live" key={moments[index].id} initial={{ opacity: 0, y: instant ? 0 : 96, scale: instant ? 1 : 0.88 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: instant ? 0 : -12, scale: instant ? 1 : 0.96, transition: { duration: instant ? 0 : 0.2, ease: EXIT } }} transition={{ duration: instant ? 0 : 0.44, ease: ENTER }}>{renderMessage(moments[index])}</motion.div>
    </AnimatePresence>
  </>;
}

interface Props {
  moments: Moment[];
  initialIndex?: number;
  characterIndex?: number;
  onCharacterChange?: (index: number, animate: boolean) => void;
  onIndexChange?: (index: number) => void;
  externalCharacter?: boolean;
  presentation?: "page" | "dock";
  active?: boolean;
}

export default function MomentsTimeline({ moments, initialIndex = moments.length - 1, ...props }: Props) {
  if (!moments.length) return null;
  return <Timeline {...props} moments={moments} initialIndex={clamp(initialIndex, 0, moments.length - 1)} />;
}

function Timeline({ moments, initialIndex, characterIndex, onCharacterChange, onIndexChange, externalCharacter = false, presentation = "page", active = true }: Props & { initialIndex: number }) {
  const contentId = useId();
  const stage = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const selected = useRef(initialIndex);
  const mobileTarget = useRef<number | null>(null);
  const scrollIdle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [index, setIndex] = useState(initialIndex);
  const [localCharacter, setCharacter] = useState(1);
  const character = characterIndex ?? localCharacter;
  const [width, setWidth] = useState(576);
  const [mobile, setMobile] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const [dragging, setDragging] = useState(false);
  const reduce = useReducedMotion();
  const instant = !!reduce || keyboard;
  const progress = useMotionValue(indexProgress(initialIndex, moments.length));
  const position = useSpring(progress, { stiffness: 400, damping: 34, mass: 0.65 });
  const travel = Math.max(0, width - 116);
  const x = useTransform(position, value => value * travel);
  const center = useTransform(x, value => characterCenter(value, width));
  const responsiveCenter = useTransform(position, value => `calc(58px + (100cqw - 116px) * ${value})`);
  const responsiveFlag = useTransform(position, value => `translateX(calc((100cqw - 116px) * ${value}))`);
  const bubbleX = useTransform(center, value => bubblePosition(value, width, index, moments.length));
  const velocity = useVelocity(x);
  const tilt = useSpring(0, { stiffness: 260, damping: 19, mass: 0.65 });
  const growth = useSpring(0, { stiffness: 500, damping: 36, mass: 0.6 });
  const mobileX = useMotionValue(initialIndex * MOBILE_MOMENT_STEP);
  const mobileRulerX = useTransform(mobileX, value => -value);
  const role = momentCharacters[character];
  const drag = useRef<{ id: number; startX: number; startY: number; startProgress: number; offset: number; moved: boolean; range: boolean; element: HTMLElement } | null>(null);
  const suppressClick = useRef(false);

  function updateIndex(next: number) {
    selected.current = next;
    setIndex(next);
    onIndexChange?.(next);
  }

  function choose(next: number, fromKeyboard = false) {
    next = clamp(next, 0, moments.length - 1);
    setKeyboard(fromKeyboard);
    updateIndex(next);
    const value = indexProgress(next, moments.length);
    progress.set(value);
    if (reduce || fromKeyboard) position.jump(value);
    if (mobile && scroller.current) {
      mobileTarget.current = next;
      scroller.current.scrollTo({ left: next * MOBILE_MOMENT_STEP, behavior: reduce || fromKeyboard ? "instant" : "smooth" });
    }
  }

  useMotionValueEvent(velocity, "change", value => tilt.set(dragging && !reduce ? clamp(-value * 0.018, -22, 22) : 0));

  useEffect(() => {
    const query = matchMedia("(max-width: 767px)");
    const sync = () => setMobile(query.matches);
    sync(); query.addEventListener("change", sync);
    const observer = new ResizeObserver(entries => { if (entries[0].contentRect.width > 0) setWidth(entries[0].contentRect.width); });
    if (stage.current) observer.observe(stage.current);
    return () => { query.removeEventListener("change", sync); observer.disconnect(); };
  }, []);

  useEffect(() => {
    if (mobile && scroller.current) {
      mobileTarget.current = null;
      scroller.current.scrollLeft = selected.current * MOBILE_MOMENT_STEP;
      mobileX.set(scroller.current.scrollLeft);
    }
  }, [mobile, mobileX]);

  useEffect(() => {
    let previousWidth = 0;
    const observer = new ResizeObserver(entries => {
      const nextWidth = entries[0].contentRect.width;
      if (nextWidth > 0 && previousWidth === 0 && scroller.current) {
        mobileTarget.current = selected.current;
        scroller.current.scrollLeft = selected.current * MOBILE_MOMENT_STEP;
        mobileX.set(scroller.current.scrollLeft);
      }
      previousWidth = nextWidth;
    });
    if (scroller.current) observer.observe(scroller.current);
    return () => observer.disconnect();
  }, [mobileX]);

  useEffect(() => {
    const blur = () => finishDrag(true);
    window.addEventListener("blur", blur);
    return () => { window.removeEventListener("blur", blur); clearTimeout(scrollIdle.current); };
  }, []);

  function startDrag(event: ReactPointerEvent<HTMLElement>, range = false) {
    if (!event.isPrimary || event.button !== 0 || moments.length < 2) return;
    const element = event.currentTarget;
    const slider = stage.current?.querySelector<HTMLElement>(".moments-slider");
    if (!slider) return;
    const rect = slider.getBoundingClientRect();
    const visualX = position.get() * travel;
    const local = event.clientX - rect.left;
    const inside = local >= visualX && local <= visualX + 116;
    drag.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, startProgress: position.get(), offset: !range || inside ? local - visualX : 58, moved: false, range, element };
    suppressClick.current = false;
    setKeyboard(false);
    element.setPointerCapture(event.pointerId);
    if (range) { event.preventDefault(); element.focus({ preventScroll: true }); }
  }

  function moveDrag(event: ReactPointerEvent<HTMLElement>) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    const threshold = current.range ? 3 : 6;
    if (!current.moved && Math.abs(dy) > threshold && Math.abs(dy) >= Math.abs(dx)) { finishDrag(true); return; }
    if (!current.moved && Math.abs(dx) <= threshold) return;
    current.moved = true;
    suppressClick.current = true;
    setDragging(true);
    growth.set(reduce ? 0 : 1);
    const rect = stage.current!.getBoundingClientRect();
    const value = clamp((event.clientX - rect.left - current.offset) / Math.max(1, travel), 0, 1);
    progress.set(value); position.jump(value);
    updateIndex(nearestMoment(value, moments.length));
  }

  function finishDrag(cancelled = false) {
    const current = drag.current;
    if (!current) return;
    drag.current = null;
    if (current.element.hasPointerCapture(current.id)) current.element.releasePointerCapture(current.id);
    setDragging(false); growth.set(0); tilt.set(0);
    if (current.moved) choose(nearestMoment(position.get(), moments.length));
    else if (current.range && !cancelled) {
      const slider = stage.current!.getBoundingClientRect();
      choose(nearestMoment((current.startX - slider.left - 58) / Math.max(1, travel), moments.length));
    } else { progress.set(indexProgress(selected.current, moments.length)); }
  }

  const dragEvents = { onPointerDown: (event: ReactPointerEvent<HTMLElement>) => startDrag(event), onPointerMove: moveDrag, onPointerUp: () => finishDrag(), onPointerCancel: () => finishDrag(true), onLostPointerCapture: () => finishDrag(true) };

  function characterButton(isMobile: boolean) {
    return <motion.button className="moments-character" type="button" aria-label={`当前角色 ${role.name}，点击切换角色`} style={isMobile ? undefined : { rotate: tilt }} {...(isMobile ? {} : dragEvents)} onClick={event => {
      if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; return; }
      const next = (character + 1) % momentCharacters.length;
      setKeyboard(event.detail === 0);
      setCharacter(next);
      onCharacterChange?.(next, event.detail !== 0);
    }}>
      {!externalCharacter && <DotsCharacter character={character} facing={-12 + indexProgress(index, moments.length) * 24} animateSelection={!instant} />}
    </motion.button>;
  }

  function flag(isMobile: boolean) {
    return <motion.div className="moments-flag" style={isMobile ? undefined : { transform: responsiveFlag }} {...(isMobile ? {} : dragEvents)}>
      <svg className="moments-flag-shape" viewBox="0 0 116 72" aria-hidden="true"><path d={FLAG} fill="currentColor" /></svg>
      <div className="moments-flag-content">
        <button type="button" aria-label="上一条动态" aria-disabled={index === 0} onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); if (selected.current > 0) choose(selected.current - 1, event.detail === 0); }}><Chevron /></button>
        <RollingDate value={moments[index].date} instant={instant} />
        <button type="button" aria-label="下一条动态" aria-disabled={index === moments.length - 1} onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); if (selected.current < moments.length - 1) choose(selected.current + 1, event.detail === 0); }}><Chevron next /></button>
      </div>
    </motion.div>;
  }

  function range(isMobile: boolean) {
    return <input id={`${contentId}-${isMobile ? "mobile" : "desktop"}`} className="moments-range" type="range" min="0" max={moments.length - 1} step="1" value={index} aria-label="按日期浏览动态" aria-valuetext={`${moments[index].date} ${moments[index].time}，${moments[index].message}`} aria-controls={contentId}
      onChange={event => { if (!drag.current) choose(Number(event.target.value), true); }}
      onKeyDown={event => { setKeyboard(true); if (event.key === "PageUp" || event.key === "PageDown") { event.preventDefault(); choose(selected.current + (event.key === "PageUp" ? 1 : -1), true); } }}
      {...(isMobile ? {} : { ...dragEvents, onPointerDown: (event: ReactPointerEvent<HTMLInputElement>) => startDrag(event, true) })} />;
  }

  const mobileTravel = Math.max(0, moments.length - 1) * MOBILE_MOMENT_STEP;
  const divisions = tickDivisions(travel, moments.length);
  const desktopTicks = Array.from({ length: Math.max(0, moments.length - 1) * divisions + 1 }, (_, i) => ({ at: i * travel / Math.max(1, (moments.length - 1) * divisions), major: i % divisions === 0 }));
  const mobileTicks = Array.from({ length: Math.max(0, moments.length - 1) * 11 + 1 }, (_, i) => ({ at: i * 16, major: i % 11 === 0 }));

  return <div role="region" data-ui="moments-timeline" data-presentation={presentation} className="moments-timeline" style={{ "--moment-color": role.color } as CSSProperties} aria-label="最近在想的日期时间轴">
    <div className="moments-desktop" ref={stage}>
      <div className="moments-stage">
        <motion.div className="moments-desktop-character" style={{ "--moment-center": responsiveCenter } as MotionStyle}>{characterButton(false)}</motion.div>
        <motion.div className="moments-bubble-slot" style={{ x: bubbleX }}><Bubble moments={moments} index={index} instant={instant} /></motion.div>
      </div>
      <div className="moments-slider">
        <div className="moments-ruler" aria-hidden="true">{desktopTicks.map((tick, i) => <Tick key={i} {...tick} pointer={x} growth={growth} />)}</div>
        {range(false)}{flag(false)}
      </div>
    </div>
    <div className="moments-mobile-scroll" ref={scroller} style={{ "--moment-travel": `${mobileTravel}px` } as CSSProperties}
      onScroll={() => {
        if (!active) return;
        const left = scroller.current!.scrollLeft;
        mobileX.set(left);
        const next = clamp(Math.round(left / MOBILE_MOMENT_STEP), 0, moments.length - 1);
        if (mobileTarget.current === null) { setKeyboard(false); updateIndex(next); progress.set(indexProgress(next, moments.length)); }
        else if (Math.abs(left - mobileTarget.current * MOBILE_MOMENT_STEP) < 1) mobileTarget.current = null;
        clearTimeout(scrollIdle.current);
        scrollIdle.current = setTimeout(() => { mobileTarget.current = null; }, 200);
      }} onPointerDown={() => { mobileTarget.current = null; }}>
      <div className="moments-mobile-track">
        {moments.map((item, i) => <span className="moments-snap" aria-hidden="true" key={item.id} style={{ left: i * MOBILE_MOMENT_STEP }} />)}
        <div className="moments-mobile-pinned">
          <div className="moments-mobile-message">{characterButton(true)}<div className="moments-mobile-bubble"><Bubble moments={moments} index={index} instant={instant} /></div></div>
          <div className="moments-slider" onClick={event => { if (!(event.target as Element).closest("button")) { const rect = event.currentTarget.getBoundingClientRect(); choose(mobileClickIndex(scroller.current!.scrollLeft, event.clientX - rect.left - rect.width / 2, moments.length)); } }}>
            <div className="moments-mobile-ruler-window" aria-hidden="true"><motion.div className="moments-mobile-ruler" style={{ x: mobileRulerX }}>{mobileTicks.map((tick, i) => <Tick key={i} {...tick} pointer={mobileX} growth={growth} mobile />)}</motion.div></div>
            {range(true)}{flag(true)}
          </div>
        </div>
      </div>
    </div>
    <span className="sr-only" id={contentId} aria-live="polite" aria-atomic="true">{moments[index].date} {moments[index].time}，{moments[index].message}</span>
  </div>;
}
