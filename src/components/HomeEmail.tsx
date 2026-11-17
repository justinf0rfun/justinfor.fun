// Adapted from LauraBeatris/laurabeatris.com/components/email-me.tsx; see email-composer/SOURCE.md.
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PlaneShape, SendButton, type SendStatus } from "./email-composer/SendButton";
import { emailPaperPose, emailReturnFrames, hasEmailDraft, hasText, isEmailAddress, MAX_EMAIL_LENGTH, MAX_MESSAGE_LENGTH, MAX_SUBJECT_LENGTH, type EmailPoint } from "../lib/email-composer";
import "./email-composer/composer.css";

const SHEET = "(max-width: 639.98px), (pointer: coarse) and (max-height: 520px)";

export default function HomeEmail() {
  const [isOpen, setIsOpen] = useState(false), [sheet, setSheet] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [status, setStatus] = useState<SendStatus>("idle"), [error, setError] = useState<string | null>(null);
  const [shortcutDown, setShortcutDown] = useState(false), [recipient, setRecipient] = useState("");
  const [hasDraft, setHasDraft] = useState(false), [complete, setComplete] = useState(false);
  const [flight, setFlight] = useState<{ from: EmailPoint; to: EmailPoint; compact: boolean } | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null), panel = useRef<HTMLDivElement>(null), backdrop = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null), wanted = useRef(false);
  const closing = useRef<ReturnType<typeof setTimeout> | undefined>(undefined), releasing = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const preview = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hoverReset = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const plane = useRef<SVGSVGElement>(null), returnAnimation = useRef<Animation | null>(null), dockResponse = useRef<Animation | null>(null);
  const generation = useRef(0);
  const drag = useRef<{ startY: number; lastY: number; lastAt: number; velocity: number; height: number } | null>(null);

  function cancelReturn() {
    ++generation.current; returnAnimation.current?.cancel(); returnAnimation.current = null;
    dockResponse.current?.cancel(); dockResponse.current = null;
    clearTimeout(noteTimer.current); setFlight(null); setComplete(false);
    clearTimeout(hoverReset.current);
    document.querySelector<HTMLElement>(".home-dock")?.removeAttribute("data-email-returning");
  }

  function measurePaper() {
    const dock = document.querySelector<HTMLElement>(".home-dock"), node = panel.current, button = trigger.current;
    if (!node || !dock || !button) return;
    const resting = getComputedStyle(node).visibility === "hidden";
    if (resting) node.style.transition = "none";
    const link = button.getBoundingClientRect(), bounds = dock.getBoundingClientRect();
    const width = Math.min(384, window.innerWidth - 32);
    const left = Math.max(16, Math.min(window.innerWidth - width - 16, link.right + 13 - width));
    const bottom = window.innerHeight - bounds.top + 12;
    node.style.setProperty("--composer-left", `${left}px`);
    node.style.setProperty("--composer-bottom", `${bottom}px`);
    node.style.setProperty("--composer-max-height", `${Math.max(160, bounds.top - 28)}px`);
    const height = node.offsetHeight;
    const pose = emailPaperPose({ left, top: window.innerHeight - bottom - height, width, height }, link);
    for (const [key, value] of Object.entries(pose)) node.style.setProperty(`--paper-${key}`, `${value}px`);
    node.style.transformOrigin = `${link.left + link.width / 2 - left}px 100%`;
    if (resting) { node.getBoundingClientRect(); node.style.transition = ""; }
  }

  function change(next: boolean, restoreFocus: "visible" | "quiet" | false = "visible") {
    cancelReturn();
    wanted.current = next;
    clearTimeout(closing.current); clearTimeout(preview.current);
    if (next) { setStatus("idle"); window.dispatchEvent(new CustomEvent("home-email-opening")); }
    else {
      const dock = document.querySelector<HTMLElement>(".home-dock");
      if (dock) dock.dataset.emailReturning = "true";
      hoverReset.current = setTimeout(() => dock?.removeAttribute("data-email-returning"), 360);
      setShortcutDown(false); drag.current = null;
      if (panel.current) { panel.current.style.transition = ""; panel.current.style.transform = ""; }
      if (backdrop.current) { backdrop.current.style.transition = ""; backdrop.current.style.opacity = ""; }
      closing.current = setTimeout(() => setStatus("idle"), 240);
      if (restoreFocus && panel.current?.contains(document.activeElement)) requestAnimationFrame(() => {
        if (!wanted.current && trigger.current) {
          if (restoreFocus === "quiet") trigger.current.dataset.emailFocusRestored = "true";
          else delete trigger.current.dataset.emailFocusRestored;
          trigger.current.focus({ preventScroll: true });
        }
      });
    }
    window.dispatchEvent(new CustomEvent("home-email-change", { detail: next }));
    measurePaper();
    if (next) {
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const dock = document.querySelector<HTMLElement>(".home-dock");
        dockResponse.current = dock?.animate([{ translate: "0 0" }, { translate: "0 2px", offset: .45 }, { translate: "0 0" }], { duration: 280, easing: "cubic-bezier(.22,1,.36,1)" }) ?? null;
      }
    }
    setIsOpen(next);
  }

  function receive() {
    setComplete(true);
    const icon = trigger.current?.querySelector<HTMLElement>(".email-icons");
    if (icon && !matchMedia("(prefers-reduced-motion: reduce)").matches) dockResponse.current = icon.animate([
      { transform: "translateY(0) scale(1)" }, { transform: "translateY(2px) scale(.9,1.08)", offset: .4 }, { transform: "translateY(0) scale(1)" },
    ], { duration: 280, easing: "cubic-bezier(.22,1,.36,1)" });
    noteTimer.current = setTimeout(() => setComplete(false), 1400);
  }

  function flyHome(button: HTMLButtonElement) {
    if (!wanted.current || !trigger.current) return;
    const source = button.getBoundingClientRect(), destination = trigger.current.querySelector(".email-icons")!.getBoundingClientRect();
    const compact = matchMedia(SHEET).matches, focused = document.activeElement as HTMLElement | null;
    change(false, "quiet");
    if (compact) focused?.blur();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { receive(); return; }
    setFlight({ from: { x: source.left + source.width / 2, y: source.top + source.height / 2 }, to: { x: destination.left + destination.width / 2, y: destination.top + destination.height / 2 }, compact });
  }

  useLayoutEffect(() => {
    if (!flight || !plane.current) return;
    clearTimeout(hoverReset.current);
    const token = ++generation.current;
    const animation = plane.current.animate(emailReturnFrames(flight.from, flight.to, flight.compact), { duration: flight.compact ? 520 : 720, easing: "cubic-bezier(.32,0,.2,1)", fill: "both" });
    returnAnimation.current = animation;
    animation.finished.then(() => {
      if (token !== generation.current) return;
      document.querySelector<HTMLElement>(".home-dock")?.removeAttribute("data-email-returning");
      returnAnimation.current = null; setFlight(null); receive();
    }, () => {});
    return () => { animation.cancel(); if (returnAnimation.current === animation) returnAnimation.current = null; };
  }, [flight]);

  useLayoutEffect(() => {
    const button = trigger.current;
    if (!button) return;
    button.dataset.draft = String(hasDraft); button.dataset.previewComplete = String(complete);
    button.setAttribute("aria-label", isOpen ? "Close email" : hasDraft ? "Email me, continue draft" : "Email me");
  }, [hasDraft, complete, host, isOpen]);

  useEffect(() => {
    const button = document.querySelector<HTMLButtonElement>("[data-home-email-trigger]");
    if (!button) return;
    trigger.current = button; setRecipient(button.dataset.emailAddress ?? ""); setHost(document.body); button.disabled = false;
    const media = matchMedia(SHEET), resize = () => setSheet(media.matches);
    const toggle = (event: MouseEvent) => change(!wanted.current, event.detail === 0 ? "visible" : "quiet");
    const close = () => { if (wanted.current) change(false, false); else cancelReturn(); };
    const guide = (event: Event) => { if ((event as CustomEvent<boolean>).detail) close(); };
    const chat = document.querySelector("[data-home-chat-trigger]");
    let width = window.innerWidth;
    const interrupt = () => { if (returnAnimation.current) cancelReturn(); };
    const cancelKey = (event: globalThis.KeyboardEvent) => {
      trigger.current?.removeAttribute("data-email-focus-restored");
      if (event.key === "Escape") interrupt();
    };
    const resized = () => { if (width !== window.innerWidth) interrupt(); width = window.innerWidth; };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = () => { if (reduced.matches) returnAnimation.current?.finish(); };
    resize(); media.addEventListener("change", resize); button.addEventListener("click", toggle);
    chat?.addEventListener("click", close);
    for (const event of ["home-moments-opening", "inspired-opening", "ride-coupon-opening"]) window.addEventListener(event, close);
    window.addEventListener("home-chat-guide-state", guide);
    window.addEventListener("pointerdown", interrupt); window.addEventListener("scroll", interrupt, { passive: true }); window.addEventListener("resize", resized);
    window.addEventListener("keydown", cancelKey);
    reduced.addEventListener("change", reduce);
    return () => {
      ++generation.current; returnAnimation.current?.cancel(); dockResponse.current?.cancel(); clearTimeout(noteTimer.current);
      clearTimeout(hoverReset.current);
      clearTimeout(closing.current); clearTimeout(releasing.current); clearTimeout(preview.current);
      button.removeEventListener("click", toggle); chat?.removeEventListener("click", close); media.removeEventListener("change", resize);
      for (const event of ["home-moments-opening", "inspired-opening", "ride-coupon-opening"]) window.removeEventListener(event, close);
      window.removeEventListener("home-chat-guide-state", guide);
      window.removeEventListener("pointerdown", interrupt); window.removeEventListener("scroll", interrupt); window.removeEventListener("resize", resized); reduced.removeEventListener("change", reduce);
      window.removeEventListener("keydown", cancelKey);
      button.disabled = true; button.setAttribute("aria-expanded", "false"); delete button.dataset.open; delete button.dataset.draft; delete button.dataset.previewComplete; delete button.dataset.emailFocusRestored;
      const dock = document.querySelector<HTMLElement>(".home-dock");
      dock?.removeAttribute("data-email-open"); dock?.removeAttribute("data-email-returning");
      window.dispatchEvent(new CustomEvent("home-email-change", { detail: false }));
    };
  }, []);

  useLayoutEffect(() => {
    trigger.current?.setAttribute("aria-expanded", String(isOpen));
    if (trigger.current) trigger.current.dataset.open = String(isOpen);
    const dock = document.querySelector<HTMLElement>(".home-dock");
    if (dock) dock.dataset.emailOpen = String(isOpen);
    if (!isOpen) return;
    measurePaper(); window.addEventListener("resize", measurePaper);
    return () => window.removeEventListener("resize", measurePaper);
  }, [isOpen, host, sheet]);

  useLayoutEffect(() => {
    if (!isOpen || !sheet) return;
    const main = document.querySelector<HTMLElement>(".home-content"), dock = document.querySelector<HTMLElement>(".home-dock");
    const overflow = document.documentElement.style.overflow, mainInert = main?.inert, dockInert = dock?.inert;
    document.documentElement.style.overflow = "hidden";
    if (main) main.inert = true;
    if (dock) dock.inert = true;
    return () => {
      document.documentElement.style.overflow = overflow;
      if (main) main.inert = !!mainInert;
      if (dock) dock.inert = !!dockInert;
    };
  }, [isOpen, sheet]);

  useEffect(() => {
    const viewport = window.visualViewport, node = panel.current;
    if (!viewport || !node) return;
    const follow = () => {
      node.style.setProperty("--keyboard-inset", `${Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop))}px`);
      node.style.setProperty("--visible-height", `${Math.round(viewport.height)}px`);
    };
    follow(); viewport.addEventListener("resize", follow); viewport.addEventListener("scroll", follow);
    return () => { viewport.removeEventListener("resize", follow); viewport.removeEventListener("scroll", follow); };
  }, [host]);

  useEffect(() => {
    if (!isOpen) return;
    const fields = form.current?.elements, from = fields?.namedItem("from") as HTMLInputElement | null;
    const message = fields?.namedItem("message") as HTMLTextAreaElement | null;
    (matchMedia(SHEET).matches ? panel.current : from?.value ? message : from)?.focus({ preventScroll: true });
    // Keyboard-driven viewport changes must not steal focus from the field being edited.
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const outside = (event: Event) => {
      const target = event.target as Node;
      if (!sheet && !panel.current?.contains(target) && !trigger.current?.contains(target)) change(false, false);
    };
    const key = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); change(false); }
      if (event.key !== "Tab" || !sheet || !panel.current) return;
      const stops = [...panel.current.querySelectorAll<HTMLElement>('button:not([aria-disabled="true"]), input, textarea')].filter(el => el.getClientRects().length > 0);
      const first = stops[0], last = stops.at(-1);
      const outsideStops = !stops.includes(document.activeElement as HTMLElement);
      if (event.shiftKey && (document.activeElement === first || outsideStops)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || outsideStops)) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("click", outside); window.addEventListener("keydown", key);
    return () => { document.removeEventListener("click", outside); window.removeEventListener("keydown", key); };
  }, [isOpen, sheet]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.metaKey || event.ctrlKey) {
      event.preventDefault(); setShortcutDown(true); clearTimeout(releasing.current);
      releasing.current = setTimeout(() => setShortcutDown(false), 160); form.current?.requestSubmit();
    } else if (event.target instanceof HTMLInputElement) {
      event.preventDefault(); const order = ["from", "subject", "message"];
      (form.current?.elements.namedItem(order[order.indexOf(event.target.name) + 1]) as HTMLElement | null)?.focus();
    }
  }

  function handleDragStart(event: PointerEvent<HTMLDivElement>) {
    if (!sheet || event.pointerType === "mouse" || (event.target as Element).closest("button, a")) return;
    drag.current = { startY: event.clientY, lastY: event.clientY, lastAt: event.timeStamp, velocity: 0, height: panel.current?.offsetHeight ?? 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function handleDragMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || !panel.current) return;
    const elapsed = event.timeStamp - current.lastAt;
    if (elapsed > 0) current.velocity = (event.clientY - current.lastY) / elapsed;
    current.lastY = event.clientY; current.lastAt = event.timeStamp;
    const pulled = event.clientY - current.startY;
    panel.current.style.transition = "none";
    panel.current.style.transform = `translateY(${pulled >= 0 ? pulled : -8 * Math.log1p(-pulled / 8)}px)`;
    if (backdrop.current && current.height > 0) {
      backdrop.current.style.transition = "none";
      backdrop.current.style.opacity = String(1 - Math.min(Math.max(pulled / current.height, 0), 1));
    }
  }
  function handleDragEnd(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current; drag.current = null;
    if (!current || !panel.current) return;
    panel.current.style.transition = ""; panel.current.style.transform = "";
    if (backdrop.current) { backdrop.current.style.transition = ""; backdrop.current.style.opacity = ""; }
    const pulled = event.clientY - current.startY;
    if (event.type === "pointerup" && (pulled > 96 || (pulled > 16 && event.timeStamp - current.lastAt < 80 && current.velocity > .5))) change(false, "quiet");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending" || status === "sent") return;
    const fields = event.currentTarget.elements, from = fields.namedItem("from") as HTMLInputElement, message = fields.namedItem("message") as HTMLTextAreaElement;
    if (!isEmailAddress(from.value.trim())) { setError("Add your email so I can write back."); from.focus(); return; }
    if (!hasText(message.value)) { setError("Write a message first."); message.focus(); return; }
    setError(null); setStatus("sending");
    // Preview the original animation locally; keep the draft and never deliver it.
    preview.current = setTimeout(() => { if (wanted.current) setStatus("sent"); }, 700);
  }

  const locked = status === "sending" || status === "sent";
  return host && createPortal(<div className="home-email-layer">
    <div ref={backdrop} aria-hidden="true" data-open={isOpen} onClick={() => change(false, "quiet")} className="home-email-composer-backdrop" />
    <div ref={panel} id="home-email" role="dialog" aria-label="Email Justin" aria-describedby="home-email-preview" aria-modal={sheet && isOpen} tabIndex={-1} data-open={isOpen} inert={!isOpen} onKeyDown={handleKeyDown} className="home-email-composer">
      <div onPointerDown={handleDragStart} onPointerMove={handleDragMove} onPointerUp={handleDragEnd} onPointerCancel={handleDragEnd} className="home-email-composer-header">
        <span aria-hidden="true" className="home-email-composer-grabber" />
        <div className="home-email-recipient"><img src="/justin-avatar.png" width="32" height="32" alt="" /><div><h2>Write to Justin</h2><span>{recipient}</span></div></div>
        <button type="button" onClick={event => change(false, event.detail === 0 ? "visible" : "quiet")} aria-label="Close email" className="home-email-close relative inline-flex size-6 items-center justify-center rounded-full text-muted transition-transform active:scale-95"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" /></svg></button>
      </div>
      <form ref={form} noValidate aria-busy={status === "sending"} onSubmit={handleSubmit} onInput={() => {
        const fields = form.current!.elements;
        setHasDraft(hasEmailDraft((fields.namedItem("from") as HTMLInputElement).value, (fields.namedItem("subject") as HTMLInputElement).value, (fields.namedItem("message") as HTMLTextAreaElement).value));
      }} className="flex min-h-0 flex-1 flex-col">
        <div data-locked={locked} className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain transition-opacity duration-200 data-[locked=true]:opacity-50">
          <Row label="From"><input name="from" readOnly={locked} type="email" inputMode="email" autoComplete="email" autoCapitalize="off" autoCorrect="off" enterKeyHint="next" spellCheck={false} maxLength={MAX_EMAIL_LENGTH} placeholder="you@example.com" className={FIELD} /></Row>
          <Row label="Subject"><input name="subject" readOnly={locked} type="text" autoComplete="off" enterKeyHint="next" maxLength={MAX_SUBJECT_LENGTH} placeholder="Optional" className={FIELD} /></Row>
          <textarea name="message" readOnly={locked} aria-label="Message" rows={6} maxLength={MAX_MESSAGE_LENGTH} placeholder="What's on your mind?" className={`${FIELD} home-email-composer-message min-h-24 resize-none overscroll-contain border-t border-border px-4 py-3 leading-relaxed`} />
        </div>
        <div className="home-email-footer">
          {error ? <p role="alert" className="home-email-composer-alert min-w-0 text-pretty text-[13px] leading-snug text-muted">{error}</p> : <div className="home-email-actions-note"><span>Preview only</span><SendHint spent={locked} pressed={shortcutDown} /></div>}
          <SendButton status={status} onFlight={flyHome} />
        </div>
        <p id="home-email-preview" className="sr-only">This is a preview. No email is sent. Your draft stays on this page until you leave.</p>
      </form>
    </div>
    {flight && <svg ref={plane} className="home-email-flight" data-email-flight aria-hidden="true" viewBox="-16 -16 32 32" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `translate3d(${flight.from.x}px,${flight.from.y}px,0)` }}><PlaneShape /></svg>}
    <p aria-live="polite" className="sr-only">{complete ? "Preview complete. No email was sent." : locked && isOpen ? "Previewing the send animation" : ""}</p>
  </div>, host);
}

const FIELD = "min-w-0 flex-1 bg-transparent text-base outline-none placeholder:opacity-60";
function Row({ label, children }: { label: string; children: ReactNode }) {
  return <label className="home-email-composer-row"><span>{label}</span>{children}</label>;
}
function KeyGlyph({ d }: { d: string }) {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}
function SendHint({ spent, pressed }: { spent: boolean; pressed: boolean }) {
  const apple = /Mac|iPhone|iPad/.test(navigator.platform);
  return <p aria-hidden="true" data-spent={spent} className="home-email-composer-hint items-center gap-1 font-mono text-xs text-muted">
    <kbd data-pressed={pressed} className="home-email-composer-key">{apple ? <KeyGlyph d="M9 9V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V9Z" /> : "Ctrl"}</kbd>
    <kbd data-pressed={pressed} className="home-email-composer-key"><KeyGlyph d="M20 5v6a4 4 0 0 1-4 4H5M9 10.5 4.5 15 9 19.5" /></kbd>
  </p>;
}
