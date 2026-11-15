// Adapted from Bencho Card Stack, MIT © 2026 Lorenzo Cabra. See bencho/LICENSE.
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import type { Belief } from "../data/beliefs";
import { ABOVE, AUTOPLAY_DELAY, BEAT, CARD_H, CARD_W, PIVOT, STAGE_H, STAGE_W, VIEW_AT, VIEW_IN, VIEW_OUT, canAutoplay, fitPaper, nextSticker, promoteSticker, springStep, stackPose, stickerSwipe } from "../lib/belief-deck";
import BeliefSticker from "./BeliefSticker";
import "./BeliefDeck.css";

const subscribe = (notify: () => void) => {
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
const readReduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function useStackSpring(target: number, instant: boolean) {
  const [at, setAt] = useState(target);
  const current = useRef(target), velocity = useRef(0);
  useEffect(() => {
    if (instant) { current.current = target;velocity.current = 0;setAt(target);return; }
    let raf = 0, previous = 0;
    const tick = (time: number) => {
      const dt = previous ? Math.min(2.5, Math.max(0, (time - previous) / 16.67)) : 1;
      previous = time;
      const next = springStep(current.current, velocity.current, target, dt);
      current.current = next.value;velocity.current = next.velocity;setAt(next.value);
      if (!next.settled) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, instant]);
  return at;
}

type Pose = ReturnType<typeof stackPose>;
function StackCard({ item, id, slot, count, on, near, viewing, instant, shuffle, ready, faces, poses, reach, pick }: {
  item: Belief; id: number; slot: number; count: number; on: boolean; near: number | null; viewing: number | undefined;
  instant: boolean; shuffle: boolean; ready: boolean; faces: React.RefObject<(HTMLSpanElement | null)[]>; poses: React.RefObject<Pose[]>;
  reach: (slot: number) => void; pick: (id: number, instant?: boolean) => void;
}) {
  const [lit, setLit] = useState(false);
  useEffect(() => {
    const delay = instant ? 0 : (on ? count - 1 - slot : slot) * BEAT;
    if (!delay) { setLit(on);return; }
    const timer = setTimeout(() => setLit(on), delay);
    return () => clearTimeout(timer);
  }, [on, slot, count, instant]);
  const progress = useStackSpring(lit ? 100 : 0, instant);
  const pose = stackPose(slot, count, progress);
  poses.current[slot] = pose;
  const size = fitPaper(item.width, item.height, CARD_W, CARD_H);
  return <figure className="belief-card" data-sticker-card={id} data-front={slot === count - 1} data-shuffle={shuffle || undefined}
    role={ready ? "button" : undefined} tabIndex={!ready || viewing === id ? -1 : 0} aria-label={ready ? `Inspect ${item.label}` : undefined} aria-describedby={ready ? "belief-deck-help" : undefined}
    style={{ left: `${(STAGE_W - CARD_W) / 2}em`, top: `${ABOVE - CARD_H / 2}em`, width: `${CARD_W}em`, height: `${CARD_H}em`,
      transformOrigin: `50% ${CARD_H / 2 + PIVOT}em`, transform: `translate(0em, ${pose.y.toFixed(2)}em) rotate(${pose.angle.toFixed(3)}deg)`,
      visibility: viewing === id ? "hidden" : undefined, zIndex: slot } as CSSProperties}
    onPointerEnter={event => { if (event.pointerType === "mouse") reach(slot); }}
    onPointerDown={event => { if (event.button === 0 && event.pointerType !== "touch") pick(id); }}
    onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault();pick(id, true); } }}>
    <span className="belief-face" data-cutout={!!item.cutout} data-lift={on && near === slot && viewing === undefined || undefined} style={{ scale: pose.scale }}>
      <span ref={element => { faces.current[slot] = element; }} className="belief-picture" style={{ width: `${size.width}em`, height: `${size.height}em` }}>
        <img src={item.src} alt={item.alt} width={item.width} height={item.height} loading="lazy" crossOrigin="anonymous" draggable={false} />
      </span>
    </span>
    <figcaption className="belief-card-credit"><a href={item.href} target="_blank" rel="noopener noreferrer">{item.source}</a></figcaption>
  </figure>;
}

type View = { id: number; from: string };
export default function BeliefDeck({ items }: { items: Belief[] }) {
  const root = useRef<HTMLElement>(null), stage = useRef<HTMLDivElement>(null);
  const flyer = useRef<HTMLDivElement>(null), tilt = useRef<HTMLDivElement>(null);
  const faces = useRef<(HTMLSpanElement | null)[]>([]), poses = useRef<Pose[]>([]);
  const [deck, setDeck] = useState(() => items.map((_, index) => index));
  const [view, setView] = useState<View | null>(null), [phase, setPhase] = useState("idle");
  const [active, setActive] = useState(0), [hover, setHover] = useState(false), [near, setNear] = useState<number | null>(null);
  const [shuffle, setShuffle] = useState(false), [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false), [visible, setVisible] = useState(false), [hidden, setHidden] = useState(false);
  const [covered, setCovered] = useState(false);
  const [previewFan, setPreviewFan] = useState(false);
  const [artReady, setArtReady] = useState(false);
  const [pressed, setPressed] = useState(false), [focused, setFocused] = useState(false), [activity, setActivity] = useState(0);
  const reduced = useSyncExternalStore(subscribe, readReduced, () => false);
  const instant = useRef(false), wanted = useRef<number | null>(null), closing = useRef(false), mounted = useRef(true);
  const current = useRef<View | null>(null), order = useRef(deck), flight = useRef<Animation | null>(null), follow = useRef(0);
  const touch = useRef<{ id: number; x: number; y: number; time: number; card?: number } | null>(null);
  const interaction = useRef(0);
  const poke = () => setActivity(++interaction.current);
  const actions = useRef<{ request: (id: number | null, immediate?: boolean, manual?: boolean) => void; step: (direction: number, immediate?: boolean) => void } | null>(null);
  const sizeOf = (id: number) => fitPaper(items[id].width, items[id].height, STAGE_W - 40, STAGE_H - 24);
  const poseOf = (slot: number, id: number) => {
    const bounds = stage.current?.getBoundingClientRect(), face = faces.current[slot]?.getBoundingClientRect();
    if (!bounds || !face || !bounds.width) return VIEW_AT;
    const k = bounds.width / STAGE_W, pose = poses.current[slot] ?? { angle: 0, scale: 1 };
    const paper = fitPaper(items[id].width, items[id].height, CARD_W, CARD_H), large = sizeOf(id);
    const x = (face.left + face.width / 2 - bounds.left - bounds.width / 2) / k;
    const y = (face.top + face.height / 2 - bounds.top - bounds.height / 2) / k;
    return `perspective(2000em) translate(${x.toFixed(2)}em, ${y.toFixed(2)}em) rotate(${pose.angle.toFixed(3)}deg) rotateY(0deg) scale(${(paper.width / large.width * pose.scale).toFixed(4)})`;
  };
  const open = (id: number) => {
    if (!mounted.current || current.current) return;
    const next = { id, from: poseOf(items.length - 1 - order.current.indexOf(id), id) };
    current.current = next;closing.current = false;setActive(id);setPhase("opening");setView(next);
  };
  const close = () => {
    const previous = current.current;
    if (!previous || closing.current) return;
    closing.current = true;setPhase("closing");
    const element = flyer.current, home = poseOf(items.length - 1, previous.id);
    const from = phase === "open" ? VIEW_AT : element ? getComputedStyle(element).transform : VIEW_AT;
    flight.current?.cancel();
    if (tilt.current) tilt.current.style.transform = "";
    const top = promoteSticker(order.current, previous.id);
    setShuffle(order.current[0] !== previous.id);order.current = top;setDeck(top);
    const done = () => {
      if (!mounted.current) return;
      current.current = null;closing.current = false;flight.current = null;
      setView(null);setShuffle(false);setPhase("idle");
      // Wait for the promoted deck's DOM before measuring the next departure.
      follow.current = requestAnimationFrame(() => {
        if (!mounted.current || current.current) return;
        if (wanted.current !== null) open(wanted.current);
        else if (instant.current) root.current?.querySelector<HTMLElement>(`[data-sticker-card="${previous.id}"]`)?.focus({ preventScroll: true });
      });
    };
    if (!element || reduced || instant.current) { done();return; }
    element.style.transform = from;
    const animation = element.animate([{ transform: from }, { transform: home }], { duration: VIEW_OUT, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
    flight.current = animation;animation.onfinish = done;
  };
  const request = (id: number | null, immediate = false, manual = true) => {
    if (root.current?.querySelector('[data-peeling="true"]')) return;
    instant.current = immediate;wanted.current = id;
    if (manual) poke();
    cancelAnimationFrame(follow.current);
    if (closing.current) return;
    if (current.current) { if (current.current.id !== id) close(); }
    else if (id !== null) open(id);
  };
  const step = (direction: number, immediate = false) => request(nextSticker(wanted.current ?? current.current?.id ?? active, direction, items.length), immediate);
  actions.current = { request, step };

  useLayoutEffect(() => {
    const element = flyer.current;
    if (!view || !element) return;
    element.style.transform = VIEW_AT;
    if (reduced || instant.current) { setPhase("open");if (instant.current) element.focus({ preventScroll: true });return; }
    const animation = element.animate([{ transform: view.from }, { transform: VIEW_AT }], {
      duration: VIEW_IN, easing: "cubic-bezier(.25,.8,.25,1)", fill: "both",
    });
    flight.current = animation;
    animation.onfinish = () => { if (mounted.current && flight.current === animation && !closing.current) setPhase("open"); };
    return () => animation.cancel();
  }, [view?.id]);

  useEffect(() => {
    mounted.current = true;setReady(true);
    const intersection = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio >= .35), { threshold: [0, .35] });
    if (root.current) intersection.observe(root.current);
    const visibility = () => setHidden(document.hidden);visibility();
    const release = () => { touch.current = null;setPressed(false);if (tilt.current) tilt.current.style.transform = ""; };
    const isCovered = () => document.documentElement.style.overflow === "hidden" || document.documentElement.dataset.inspiredOpen === "true" || !!document.querySelector('#home-chat[data-open="true"],.home-dock[data-moments-open="true"]');
    const cover = () => setCovered(isCovered());
    const covering = new MutationObserver(cover);
    covering.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "data-inspired-open"] });
    for (const element of document.querySelectorAll("#home-chat,.home-dock")) covering.observe(element, { attributes: true, attributeFilter: ["data-open", "data-moments-open"] });
    cover();
    const outside = (event: PointerEvent) => {
      if (!event.isTrusted || !current.current || isCovered() || !(event.target instanceof Element)) return;
      if (flyer.current?.contains(event.target) || event.target.closest("[data-sticker-card],[data-sticker-control],a")) return;
      actions.current?.request(null);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && current.current && !isCovered()) actions.current?.request(null, true); };
    const images = [...(root.current?.querySelectorAll<HTMLImageElement>(".belief-picture img") ?? [])];
    const loaded = () => setArtReady(images.every(image => image.complete && image.naturalWidth > 0));
    for (const image of images) { image.addEventListener("load", loaded);image.addEventListener("error", loaded); }
    loaded();
    document.addEventListener("visibilitychange", visibility);document.addEventListener("pointerdown", outside, true);document.addEventListener("keydown", escape);
    document.addEventListener("pointerup", release);document.addEventListener("pointercancel", release);window.addEventListener("blur", release);
    return () => {
      mounted.current = false;intersection.disconnect();covering.disconnect();flight.current?.cancel();cancelAnimationFrame(follow.current);
      document.removeEventListener("visibilitychange", visibility);document.removeEventListener("pointerdown", outside, true);document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerup", release);document.removeEventListener("pointercancel", release);window.removeEventListener("blur", release);
      for (const image of images) { image.removeEventListener("load", loaded);image.removeEventListener("error", loaded); }
    };
  }, []);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const preview = () => {
      clearTimeout(timer); setPreviewFan(false);
      if (document.documentElement.dataset.inspiredSource !== "bencho" || reduced) return;
      actions.current?.request(null, false, false);
      setPreviewFan(true); timer = setTimeout(() => setPreviewFan(false), 1400);
    };
    window.addEventListener("inspired-preview", preview); preview();
    return () => { clearTimeout(timer); window.removeEventListener("inspired-preview", preview); };
  }, [reduced]);
  useEffect(() => { if (reduced) flight.current?.finish(); }, [reduced]);
  const running = canAutoplay(visible && artReady, hidden, paused, hover || focused || pressed || covered, reduced, phase);
  useEffect(() => {
    if (!running) return;
    const revision = interaction.current;
    const timer = setTimeout(() => {
      if (revision !== interaction.current || closing.current) return;
      const id = current.current ? nextSticker(current.current.id, 1, items.length) : order.current[0];
      actions.current?.request(id, false, false);
    }, AUTOPLAY_DELAY);
    return () => clearTimeout(timer);
  }, [running, phase, active, activity, view?.id]);

  const pointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 || !event.isPrimary || !(event.target instanceof Element)) return;
    setPressed(true);poke();
    if (event.target.closest("[data-sticker-control],a")) return;
    const inspecting = !!flyer.current?.contains(event.target);
    const card = event.target.closest<HTMLElement>("[data-sticker-card]");
    if (!inspecting && !card) return;
    if (inspecting) {
      const box = flyer.current!.getBoundingClientRect();
      if (!reduced && phase === "open" && event.clientX >= box.right - 44 && event.clientY >= box.bottom - 44) return;
      event.stopPropagation();
    }
    if (event.pointerType !== "touch" && !inspecting) return;
    touch.current = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp, card: card ? Number(card.dataset.stickerCard) : undefined };
  };
  const pointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const start = touch.current;
    if (!start || start.id !== event.pointerId) return;
    const x = event.clientX - start.x, y = event.clientY - start.y;
    if (Math.abs(y) > 8 && Math.abs(y) > Math.abs(x)) { touch.current = null;setPressed(false);if (tilt.current) tilt.current.style.transform = "";return; }
    if (Math.abs(x) > 8 && tilt.current) tilt.current.style.transform = `translateX(${Math.max(-18, Math.min(18, x * .12))}px) rotateY(${Math.max(-6, Math.min(6, x * .05))}deg)`;
  };
  const pointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const start = touch.current;touch.current = null;setPressed(false);
    if (tilt.current) tilt.current.style.transform = "";
    if (!start || start.id !== event.pointerId || event.type === "pointercancel") return;
    const x = event.clientX - start.x, y = event.clientY - start.y;
    const direction = stickerSwipe(x, y, event.timeStamp - start.time);
    if (direction) step(direction < 0 ? 1 : -1);
    else if (Math.abs(x) < 12 && Math.abs(y) < 12) {
      if (start.card !== undefined) request(start.card);
      else { setPaused(value => !value);poke(); }
    }
  };
  const on = hover || previewFan || !!view || wanted.current !== null;
  const selected = view ? items[view.id] : items[active], large = sizeOf(view?.id ?? active);
  return <section ref={root} className="belief-notes belief-deck" style={{ "--stack-width": STAGE_W, "--stack-height": STAGE_H } as CSSProperties} data-sticker-deck data-ready={ready} data-phase={phase} data-active={active}
    data-target={wanted.current ?? "none"} data-viewing={view?.id ?? "none"} data-auto-running={running} data-autoplay-paused={paused} aria-label="Things I believe" aria-keyshortcuts="P"
    onPointerDownCapture={pointerDown} onPointerMoveCapture={pointerMove} onPointerUpCapture={pointerUp} onPointerCancelCapture={pointerUp}
    onFocusCapture={() => setFocused(!!root.current?.querySelector(":focus-visible"))}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false); }}
    onKeyDownCapture={event => {
      if (event.key.toLowerCase() === "p" && !event.metaKey && !event.ctrlKey && !event.altKey) { event.preventDefault();event.stopPropagation();setPaused(value => !value);poke(); }
      else if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && !(event.target instanceof Element && event.target.closest("a"))) { event.preventDefault();event.stopPropagation();step(event.key === "ArrowRight" ? 1 : -1, true); }
    }}>
    <p id="belief-deck-help" className="sr-only">Select a card to flip it into view. Swipe or use arrow keys to switch. Click outside or press Escape to return it. The lower right corner peels. Tap the inspected poster or press P to pause or resume automatic rotation.</p>
    <div className="belief-stack-viewport"><div className="belief-stage-fit">
      <div ref={stage} className="belief-stage" data-open={on} data-shuffle={shuffle || undefined}
        onPointerOver={event => { if (event.pointerType === "mouse") { instant.current = false;setHover(true); } }}
        onPointerOut={event => { if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;setHover(false);setNear(null); }}>
        <span className="belief-hit" aria-hidden="true" onPointerOver={() => setNear(null)} style={on ? { inset: 0 } : { left: `${(STAGE_W - CARD_W) / 2 - 10}em`, top: `${ABOVE - CARD_H / 2 - 35}em`, width: `${CARD_W + 20}em`, height: `${CARD_H + 55}em` }} />
        {items.map((item, id) => <StackCard key={item.id} item={item} id={id} slot={items.length - 1 - deck.indexOf(id)} count={items.length} on={on}
          near={near} viewing={view?.id} instant={reduced || instant.current} shuffle={shuffle} ready={ready} faces={faces} poses={poses} reach={setNear} pick={request} />)}
        {view && <div ref={flyer} className="belief-view" data-sticker-view role="group" tabIndex={0} aria-label={`${selected.label}. Selected sticker`} aria-describedby="belief-deck-help"
          style={{ left: `${(STAGE_W - large.width) / 2}em`, top: `${(STAGE_H - large.height) / 2}em`, width: `${large.width}em`, height: `${large.height}em`, transform: view.from }}
          onPointerMove={event => {
            if (!tilt.current || event.pointerType !== "mouse" || closing.current || reduced) return;
            const box = event.currentTarget.getBoundingClientRect();
            const x = Math.max(-1, Math.min(1, (event.clientX - box.left) / box.width * 2 - 1));
            const y = Math.max(-1, Math.min(1, (event.clientY - box.top) / box.height * 2 - 1));
            tilt.current.style.transform = `rotateX(${y * 6}deg) rotateY(${x * 6}deg)`;
          }} onPointerLeave={() => { if (tilt.current) tilt.current.style.transform = ""; }}>
          <div ref={tilt} className="belief-view-tilt">
            <div className="belief-view-face" aria-hidden="true"><img src={selected.src} alt="" width={selected.width} height={selected.height} crossOrigin="anonymous" draggable={false} /></div>
            <div className="belief-view-face" data-back><div className="belief-view-poster">
              {phase === "open" ? <BeliefSticker {...selected} reveal={false} /> : <img src={selected.src} alt={selected.alt} width={selected.width} height={selected.height} crossOrigin="anonymous" draggable={false} />}
            </div></div>
          </div>
        </div>}
      </div></div>
      {view && <button className="belief-put-back" type="button" data-sticker-control aria-label="Put sticker back" onClick={event => request(null, event.detail === 0)}><svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button>}
    </div>
    <div className="belief-deck-footer">
      <a className="belief-source" href={items[active].href} target="_blank" rel="noopener noreferrer">{items[active].source}<span aria-hidden="true">↗</span></a>
    </div>
    <span className="sr-only" role="status" aria-live="polite">{ready ? `${items[active].label}, ${active + 1} of ${items.length}${paused ? ". Automatic rotation paused" : ""}` : ""}</span>
    <noscript><style>{`.belief-deck #belief-deck-help{display:none}.belief-deck .belief-stack-viewport{height:auto;overflow:visible}.belief-deck .belief-stage-fit{position:relative;left:auto;top:auto;transform:none;width:100%;aspect-ratio:auto;container-type:normal}.belief-deck .belief-stage{font-size:inherit;position:relative;left:auto;top:auto;transform:none!important;width:auto!important;height:auto!important;display:grid;gap:32px;padding:20px}.belief-deck .belief-card{position:relative;left:auto!important;top:auto!important;transform:none!important;width:min(276px,100%)!important;height:auto!important;margin:auto}.belief-deck .belief-face{position:relative;display:block;scale:none!important;background:none;box-shadow:none;border-radius:0;overflow:visible}.belief-deck .belief-picture{position:relative;left:auto;top:auto;translate:none;width:100%!important;height:auto!important;filter:none!important}.belief-deck .belief-picture img{height:auto}.belief-deck .belief-card-credit{display:block}.belief-deck .belief-deck-footer{display:none}`}</style></noscript>
  </section>;
}
