// Adapted from Lochie Axon's Skullet ChatDemo (MIT); see HomeChat.LICENSE.
// https://github.com/lochie/skullet/blob/main/site/src/demos/chat/index.tsx
import { useEffect, useLayoutEffect, useReducer, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { animate, AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { chatReducer, FOLLOW_UPS, initialChatState } from "../lib/home-chat";
import "./HomeChat.css";

function VoiceIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 10v4m4-8v12m4-15v18m4-14v10m4-7v4" /></svg>;
}

export default function HomeChat() {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const { open, mode, messages, step, replying, phase, voiceTurn } = state;
  const [mobile, setMobile] = useState(false);
  const [dock, setDock] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const voiceRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const logRef = useRef<HTMLUListElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; start: number; y: number; time: number; velocity: number } | null>(null);
  const dragAnimation = useRef<ReturnType<typeof animate> | null>(null);
  const dragged = useRef(false);
  const previousMode = useRef(mode);
  const wasOpen = useRef(false);
  const reduced = useReducedMotion();
  const next = FOLLOW_UPS[step];
  const turn = voiceTurn === null ? null : FOLLOW_UPS[voiceTurn];
  const dismiss = () => {
    dispatch({ type: "close" });
    triggerRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    const trigger = document.querySelector<HTMLButtonElement>("[data-home-chat-trigger]");
    const media = matchMedia("(max-width: 1023px)");
    triggerRef.current = trigger;
    setDock(document.querySelector<HTMLElement>(".home-dock"));
    const resize = () => setMobile(media.matches);
    const toggle = () => dispatch({ type: "toggle" });
    resize();
    if (trigger) trigger.disabled = false;
    trigger?.addEventListener("click", toggle);
    media.addEventListener("change", resize);
    return () => {
      trigger?.removeEventListener("click", toggle);
      media.removeEventListener("change", resize);
      dragAnimation.current?.stop();
      if (trigger) { trigger.disabled = true; trigger.setAttribute("aria-expanded", "false"); }
    };
  }, []);

  useLayoutEffect(() => {
    if (!dock) return;
    const wrap = dock.parentElement!;
    const controls = dock.querySelector<HTMLElement>(".dock-controls")!;
    const main = document.querySelector<HTMLElement>(".home-content")!;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    const wasInert = main.inert;
    let width = window.innerWidth;
    const measureAnchor = (resized = false) => {
      const anchor = resized ? window.innerHeight - 38 : Math.min(wrap.getBoundingClientRect().bottom, window.innerHeight - 16);
      wrap.style.setProperty("--chat-anchor-top", `${anchor}px`);
      dock.style.setProperty("--chat-max-height", `${Math.max(160, anchor - 24)}px`);
    };
    const resize = () => {
      // Arc's browser toolbar can resize height during scrolling; only re-anchor on a width change.
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      measureAnchor(true);
    };
    if (mobile) {
      dock.style.setProperty("--dock-rest-width", `${controls.scrollWidth + 28}px`);
      measureAnchor();
      dock.dataset.chatOpen = String(open);
      wrap.dataset.chatOpen = String(open);
      controls.inert = open;
      if (open) { main.inert = true; root.style.overflow = "hidden"; }
      window.addEventListener("resize", resize);
    } else {
      dragAnimation.current?.stop();
      dock.style.removeProperty("translate");
    }
    window.dispatchEvent(new CustomEvent("home-chat-change", { detail: mobile && open }));
    return () => {
      window.removeEventListener("resize", resize);
      if (mobile && open) { main.inert = wasInert; root.style.overflow = overflow; }
      controls.inert = false;
      delete dock.dataset.chatOpen;
      delete wrap.dataset.chatOpen;
      dock.style.removeProperty("--dock-rest-width");
      dock.style.removeProperty("--chat-max-height");
      wrap.style.removeProperty("--chat-anchor-top");
      drag.current = null;
      window.dispatchEvent(new CustomEvent("home-chat-change", { detail: false }));
    };
  }, [dock, mobile, open]);

  useLayoutEffect(() => {
    if (!dock || !mobile) return;
    dock.dataset.chatMode = mode;
    const measure = () => {
      if (!panelRef.current || !textRef.current || !logRef.current || mode !== "text") return;
      const header = panelRef.current.querySelector<HTMLElement>(".home-chat-header")!;
      const handle = panelRef.current.querySelector<HTMLElement>(".home-chat-handle")!;
      const composer = textRef.current.querySelector<HTMLElement>(".home-chat-composer")!;
      const style = getComputedStyle(logRef.current);
      const items = [...logRef.current.children] as HTMLElement[];
      const listHeight = items.filter(item => getComputedStyle(item).position !== "absolute").reduce((sum, item) => sum + item.offsetHeight, 0)
        + Math.max(0, items.length - 1) * Number.parseFloat(style.rowGap) + Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
      dock.style.setProperty("--chat-height", `${Math.max(280, header.offsetHeight + handle.offsetHeight + listHeight + composer.offsetHeight + 8)}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    logRef.current?.querySelectorAll("li").forEach((item) => observer.observe(item));
    return () => { observer.disconnect(); delete dock.dataset.chatMode; };
  }, [dock, mobile, open, mode, messages, replying]);

  useEffect(() => {
    triggerRef.current?.setAttribute("aria-expanded", String(open));
    if (!open) {
      if (wasOpen.current) triggerRef.current?.focus({ preventScroll: true });
      wasOpen.current = false; previousMode.current = mode; return;
    }
    wasOpen.current = true;
    const target = mode === "voice" ? backRef.current : previousMode.current === "voice" ? voiceRef.current : closeRef.current;
    target?.focus({ preventScroll: true });
    previousMode.current = mode;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !panelRef.current || getComputedStyle(panelRef.current).visibility !== "visible") return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (mode === "voice") dispatch({ type: "voice-exit" });
        else { dispatch({ type: "close" }); triggerRef.current?.focus({ preventScroll: true }); }
      }
      if (mobile && event.key === "Tab") {
        const buttons = [...panelRef.current.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")].filter(button => button.getClientRects().length > 0);
        const first = buttons[0], last = buttons.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, mode, mobile, dock]);

  useEffect(() => {
    if (!replying) return;
    const timer = window.setTimeout(() => dispatch({ type: "text-reply" }), 850);
    return () => window.clearTimeout(timer);
  }, [replying]);

  useEffect(() => {
    if (!open || mode !== "voice" || phase === "idle") return;
    const action = phase === "listening" ? "voice-think" : phase === "thinking" ? "voice-reply" : "voice-finish";
    const timer = window.setTimeout(() => dispatch({ type: action }), phase === "speaking" ? 2600 : 900);
    return () => window.clearTimeout(timer);
  }, [open, mode, phase]);

  useLayoutEffect(() => {
    if (open && mode === "text" && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, replying, open, mode, mobile]);

  const startDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (!mobile || !dock || drag.current) return;
    const y = Number.parseFloat(getComputedStyle(dock).translate.split(" ")[1]) || 0;
    dragAnimation.current?.stop();
    dragged.current = false;
    drag.current = { id: event.pointerId, start: event.clientY - y, y, time: event.timeStamp, velocity: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!dock || !current || current.id !== event.pointerId) return;
    const y = Math.max(0, event.clientY - current.start);
    current.velocity = (y - current.y) / Math.max(1, event.timeStamp - current.time);
    current.y = y; current.time = event.timeStamp;
    dock.style.translate = `0px ${y}px`;
  };
  const endDrag = (event: PointerEvent<HTMLButtonElement>, cancelled = false) => {
    const current = drag.current;
    if (!dock || !current || current.id !== event.pointerId) return;
    drag.current = null;
    dragged.current = current.y > 8 || cancelled;
    const velocity = event.timeStamp - current.time < 100 ? current.velocity : 0;
    if (!cancelled && (current.y > 80 || (current.y > 12 && velocity > .5))) {
      if (mode === "voice") dispatch({ type: "voice-exit" }); else dismiss();
    }
    const animation = animate(dock, { translate: "0px 0px" }, { type: "spring", duration: reduced ? 0 : .35, bounce: 0 });
    dragAnimation.current = animation;
    void animation.then(() => {
      if (!drag.current && dragAnimation.current === animation) dock.style.removeProperty("translate");
    });
  };

  const content = <LayoutGroup id="home-chat">
    <section ref={panelRef} id="home-chat" className="home-chat" data-open={open} data-mode={mode}
      role="dialog" aria-modal={mobile && open} aria-labelledby="home-chat-title" inert={!open}>
      <button type="button" className="home-chat-handle" aria-label={mode === "voice" ? "Return to text chat" : "Collapse chat"}
        onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={event => endDrag(event)} onPointerCancel={event => endDrag(event, true)}
        onClick={() => { if (dragged.current) { dragged.current = false; return; } mode === "voice" ? dispatch({ type: "voice-exit" }) : dismiss(); }}><span /></button>
      <header className="home-chat-header">
        {mode === "text" ? <motion.img layoutId={reduced ? undefined : "avatar"} src="/justin-avatar.png" alt="" width={38} height={38} transition={{ type: "spring", duration: .45, bounce: 0 }} /> :
          <button ref={backRef} type="button" className="home-chat-back" aria-label="Return to text chat" onClick={() => dispatch({ type: "voice-exit" })}>‹ <span>文字</span></button>}
        <div><h2 id="home-chat-title">Justin</h2><p>{mode === "voice" ? "Voice demo" : "Demo"}</p></div>
        <button ref={closeRef} type="button" className="home-chat-close" aria-label="Close chat" onClick={dismiss}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </header>
      <div ref={textRef} className="home-chat-text" hidden={mode !== "text"}>
        <ul ref={logRef} className="home-chat-messages" role="log" aria-label="Demo conversation" aria-live="polite" aria-relevant="additions">
          <AnimatePresence initial={false} mode="popLayout">
            {messages.map((message, i) => <motion.li key={i} className="home-chat-bubble" data-mine={message.mine}
              layout={reduced ? false : "position"} initial={{ opacity: 0, scale: reduced ? 1 : .96, originY: 1, originX: message.mine ? 1 : 0 }}
              animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduced ? 0 : .25, ease: "easeOut" }}>{message.text}</motion.li>)}
            {replying && <motion.li key="typing" className="home-chat-bubble home-chat-typing" aria-label="Justin is typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><span aria-hidden="true">•••</span></motion.li>}
          </AnimatePresence>
        </ul>
        <footer className="home-chat-composer">
          <p id="home-chat-prompt">{replying ? "Justin is typing…" : next?.ask ?? "Thanks for stopping by."}</p>
          <button type="button" className="home-chat-send" onClick={() => dispatch({ type: "send" })} disabled={!next || replying} aria-describedby="home-chat-prompt">Send</button>
          <button ref={voiceRef} type="button" className="home-chat-voice-entry" aria-label="Open voice demo" disabled={replying} onClick={() => dispatch({ type: "voice-enter" })}><VoiceIcon /></button>
        </footer>
      </div>
      {mode === "voice" && <div className="home-chat-voice" data-phase={phase}>
        <div className="home-chat-person"><motion.img layoutId={reduced ? undefined : "avatar"} src="/justin-avatar.png" alt="Justin" width={112} height={112} transition={{ type: "spring", duration: .45, bounce: 0 }} /></div>
        <div className="home-chat-wave" aria-hidden="true">{[0,1,2,3,4,5,6].map(i => <span key={i} style={{ animationDelay: `${-i * .13}s` }} />)}</div>
        <p className="home-chat-voice-state" role="status">{phase === "listening" ? "正在听 · 演示" : phase === "thinking" ? "正在思考 · 演示" : phase === "speaking" ? "正在回应 · 演示" : "Hi, I’m Justin."}</p>
        <p className="home-chat-transcript">{turn ? (phase === "speaking" || (phase === "idle" && step > voiceTurn!) ? turn.reply : turn.ask) : "有什么想聊的？"}</p>
        <div className="home-chat-voice-actions">
          <p>{phase === "idle" ? next?.ask ?? "Thanks for stopping by." : "可以随时停止，或返回文字对话"}</p>
          <button type="button" className="home-chat-voice-play" disabled={phase === "idle" && !next} onClick={() => dispatch({ type: phase === "idle" ? "voice-start" : "voice-stop" })}><VoiceIcon />{phase === "idle" ? "演示一轮" : "停止演示"}</button>
          <small>预设交互演示 · 不会录音或播放声音</small>
        </div>
      </div>}
    </section>
  </LayoutGroup>;

  return <>
    {mobile && dock ? createPortal(content, dock) : content}
    {mobile && open && createPortal(<button type="button" className="home-chat-backdrop" aria-label="Close chat" onClick={dismiss} />, document.body)}
  </>;
}
