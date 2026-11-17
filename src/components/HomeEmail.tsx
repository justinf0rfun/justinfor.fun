// Adapted from LauraBeatris/laurabeatris.com/components/email-me.tsx; see email-composer/SOURCE.md.
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { SendButton, type SendStatus } from "./email-composer/SendButton";
import { hasText, isEmailAddress, MAX_EMAIL_LENGTH, MAX_MESSAGE_LENGTH, MAX_SUBJECT_LENGTH } from "../lib/email-composer";
import "./email-composer/composer.css";

const SHEET = "(max-width: 639.98px), (pointer: coarse) and (max-height: 520px)";

export default function HomeEmail() {
  const [isOpen, setIsOpen] = useState(false), [sheet, setSheet] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [status, setStatus] = useState<SendStatus>("idle"), [error, setError] = useState<string | null>(null);
  const [shortcutDown, setShortcutDown] = useState(false), [recipient, setRecipient] = useState("");
  const trigger = useRef<HTMLButtonElement | null>(null), panel = useRef<HTMLDivElement>(null), backdrop = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null), wanted = useRef(false);
  const closing = useRef<ReturnType<typeof setTimeout> | undefined>(undefined), releasing = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const preview = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const drag = useRef<{ startY: number; lastY: number; lastAt: number; velocity: number; height: number } | null>(null);

  function change(next: boolean, restoreFocus = true) {
    wanted.current = next;
    clearTimeout(closing.current); clearTimeout(preview.current);
    if (next) { setStatus("idle"); window.dispatchEvent(new CustomEvent("home-email-opening")); }
    else {
      setShortcutDown(false); drag.current = null;
      if (panel.current) { panel.current.style.transition = ""; panel.current.style.transform = ""; }
      if (backdrop.current) { backdrop.current.style.transition = ""; backdrop.current.style.opacity = ""; }
      closing.current = setTimeout(() => setStatus("idle"), 240);
      if (restoreFocus && panel.current?.contains(document.activeElement)) requestAnimationFrame(() => {
        if (!wanted.current) trigger.current?.focus({ preventScroll: true });
      });
    }
    window.dispatchEvent(new CustomEvent("home-email-change", { detail: next }));
    setIsOpen(next);
  }

  useEffect(() => {
    const button = document.querySelector<HTMLButtonElement>("[data-home-email-trigger]");
    if (!button) return;
    trigger.current = button; setRecipient(button.dataset.emailAddress ?? ""); setHost(document.body); button.disabled = false;
    const media = matchMedia(SHEET), resize = () => setSheet(media.matches);
    const toggle = () => change(!wanted.current);
    const close = () => { if (wanted.current) change(false, false); };
    const guide = (event: Event) => { if ((event as CustomEvent<boolean>).detail) close(); };
    const chat = document.querySelector("[data-home-chat-trigger]");
    resize(); media.addEventListener("change", resize); button.addEventListener("click", toggle);
    chat?.addEventListener("click", close);
    for (const event of ["home-moments-opening", "inspired-opening", "ride-coupon-opening"]) window.addEventListener(event, close);
    window.addEventListener("home-chat-guide-state", guide);
    return () => {
      clearTimeout(closing.current); clearTimeout(releasing.current); clearTimeout(preview.current);
      button.removeEventListener("click", toggle); chat?.removeEventListener("click", close); media.removeEventListener("change", resize);
      for (const event of ["home-moments-opening", "inspired-opening", "ride-coupon-opening"]) window.removeEventListener(event, close);
      window.removeEventListener("home-chat-guide-state", guide);
      button.disabled = true; button.setAttribute("aria-expanded", "false"); delete button.dataset.open;
      document.querySelector<HTMLElement>(".home-dock")?.removeAttribute("data-email-open");
      window.dispatchEvent(new CustomEvent("home-email-change", { detail: false }));
    };
  }, []);

  useLayoutEffect(() => {
    trigger.current?.setAttribute("aria-expanded", String(isOpen));
    if (trigger.current) trigger.current.dataset.open = String(isOpen);
    const dock = document.querySelector<HTMLElement>(".home-dock");
    if (dock) dock.dataset.emailOpen = String(isOpen);
    if (!isOpen || !panel.current || !dock || !trigger.current) return;
    const measure = () => {
      if (!panel.current || !trigger.current) return;
      const link = trigger.current.getBoundingClientRect(), bounds = dock.getBoundingClientRect();
      const width = Math.min(384, window.innerWidth - 32);
      const left = Math.max(16, Math.min(window.innerWidth - width - 16, link.right + 13 - width));
      panel.current.style.setProperty("--composer-left", `${left}px`);
      panel.current.style.setProperty("--composer-bottom", `${window.innerHeight - bounds.top + 12}px`);
      panel.current.style.setProperty("--composer-max-height", `${Math.max(160, bounds.top - 28)}px`);
      panel.current.style.transformOrigin = `${link.left + link.width / 2 - left}px 100%`;
    };
    measure(); window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
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
    if (event.type === "pointerup" && (pulled > 96 || (pulled > 16 && event.timeStamp - current.lastAt < 80 && current.velocity > .5))) change(false);
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
    <div ref={backdrop} aria-hidden="true" data-open={isOpen} onClick={() => change(false)} className="home-email-composer-backdrop" />
    <div ref={panel} id="home-email" role="dialog" aria-label="Email Justin" aria-describedby="home-email-preview" aria-modal={sheet && isOpen} tabIndex={-1} data-open={isOpen} inert={!isOpen} onKeyDown={handleKeyDown} className="home-email-composer">
      <div onPointerDown={handleDragStart} onPointerMove={handleDragMove} onPointerUp={handleDragEnd} onPointerCancel={handleDragEnd} className="home-email-composer-header relative flex h-12 shrink-0 items-center justify-between pl-4 pr-3">
        <span aria-hidden="true" className="home-email-composer-grabber" />
        <div className="flex items-baseline gap-3"><h2 className="text-sm font-medium">New message</h2><span className="text-xs text-muted">Preview only</span></div>
        <button type="button" onClick={() => change(false)} aria-label="Close email" className="home-email-close relative inline-flex size-6 items-center justify-center rounded-full text-muted transition-transform active:scale-95"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" /></svg></button>
      </div>
      <form ref={form} noValidate aria-busy={status === "sending"} onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div data-locked={locked} className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain transition-opacity duration-200 data-[locked=true]:opacity-50">
          <Row label="To" as="div"><span className="truncate font-mono text-[13px]">{recipient}</span></Row>
          <Row label="From"><input name="from" readOnly={locked} type="email" inputMode="email" autoComplete="email" autoCapitalize="off" autoCorrect="off" enterKeyHint="next" spellCheck={false} maxLength={MAX_EMAIL_LENGTH} placeholder="you@example.com" className={FIELD} /></Row>
          <Row label="Subject"><input name="subject" readOnly={locked} type="text" autoComplete="off" enterKeyHint="next" maxLength={MAX_SUBJECT_LENGTH} placeholder="Optional" className={FIELD} /></Row>
          <textarea name="message" readOnly={locked} aria-label="Message" rows={6} maxLength={MAX_MESSAGE_LENGTH} placeholder="What's on your mind?" className={`${FIELD} home-email-composer-message min-h-24 resize-none overscroll-contain border-t border-border px-4 py-3 leading-relaxed`} />
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 py-3 pl-4 pr-3">
          {error ? <p role="alert" className="home-email-composer-alert min-w-0 text-pretty text-[13px] leading-snug text-muted">{error}</p> : <SendHint spent={locked} pressed={shortcutDown} />}
          <SendButton status={status} onSent={() => { if (wanted.current) closing.current = setTimeout(() => change(false), 1400); }} />
        </div>
        <p id="home-email-preview" className="sr-only">This is a preview. No email is sent. Your draft stays on this page until you leave.</p>
        <p aria-live="polite" className="sr-only">{status === "sending" ? "Previewing the send animation" : status === "sent" ? "Preview complete. No email was sent." : ""}</p>
      </form>
    </div>
  </div>, host);
}

const FIELD = "min-w-0 flex-1 bg-transparent text-base outline-none placeholder:opacity-60 sm:text-sm";
function Row({ label, as: Tag = "label", children }: { label: string; as?: "label" | "div"; children: ReactNode }) {
  return <Tag className="home-email-composer-row flex h-11 shrink-0 items-center gap-3 border-t border-border px-4"><span className="w-14 shrink-0 text-sm text-muted">{label}</span>{children}</Tag>;
}
function KeyGlyph({ d }: { d: string }) {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}
function SendHint({ spent, pressed }: { spent: boolean; pressed: boolean }) {
  const apple = /Mac|iPhone|iPad/.test(navigator.platform);
  return <p aria-hidden="true" data-spent={spent} className="home-email-composer-hint items-center gap-1 font-mono text-xs text-muted">
    <kbd data-pressed={pressed} className="home-email-composer-key">{apple ? <KeyGlyph d="M9 9V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V9Z" /> : "Ctrl"}</kbd>
    <kbd data-pressed={pressed} className="home-email-composer-key"><KeyGlyph d="M20 5v6a4 4 0 0 1-4 4H5M9 10.5 4.5 15 9 19.5" /></kbd><span className="ml-1">to preview</span>
  </p>;
}
