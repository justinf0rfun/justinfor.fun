// Adapted from Skullet's ProfileDemo (MIT); see HomeChat.LICENSE.
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Skeleton } from "skullet/react";
import "./XProfileLink.css";

export default function XProfileLink() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const hovering = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open || ready || reduced) return;
    // Play the demo's entrance once; subsequent hovers show the cached profile immediately.
    const timer = window.setTimeout(() => setReady(true), 550);
    return () => window.clearTimeout(timer);
  }, [open, ready, reduced]);

  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      const root = rootRef.current;
      const card = cardRef.current;
      if (!root || !card) return;
      const anchor = root.getBoundingClientRect();
      const width = card.offsetWidth;
      card.style.left = `${Math.max(16, Math.min(anchor.left - 16, window.innerWidth - width - 16)) - anchor.left}px`;
      card.dataset.side = window.innerHeight - anchor.bottom < card.offsetHeight + 24 ? "top" : "bottom";
    };
    position();
    window.addEventListener("resize", position);
    return () => window.removeEventListener("resize", position);
  }, [open]);

  return <div ref={rootRef} className="intro-x-profile"
    onPointerEnter={event => {
      if (event.pointerType !== "mouse") return;
      hovering.current = true;
      setOpen(true);
    }}
    onPointerLeave={event => {
      hovering.current = false;
      if (!event.currentTarget.contains(document.activeElement)) setOpen(false);
    }}
    onFocus={event => {
      if (!event.target.matches(":focus-visible")) return;
      setReady(true);
      setOpen(true);
    }}
    onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget) && !hovering.current) setOpen(false);
    }}
    onKeyDown={event => {
      if (event.key !== "Escape" || !open) return;
      event.stopPropagation();
      linkRef.current?.focus({ preventScroll: true });
      setOpen(false);
    }}>
    <a ref={linkRef} href="https://x.com/justinforfun" target="_blank" rel="noopener noreferrer"
      aria-expanded={open} aria-controls={open ? id : undefined}>X</a>
    {open && <div ref={cardRef} id={id} className="intro-x-card" role="group" aria-label="Justin on X">
      <Skeleton loading={!ready && !reduced} label="Loading X profile">
        <div className="intro-x-card-row">
          <img src="/justin-avatar.png" alt="" width={36} height={36} />
          <div className="intro-x-identity"><span>Justin</span><span>@justinforfun</span></div>
          <a className="intro-x-follow" href="https://x.com/intent/user?screen_name=justinforfun"
            target="_blank" rel="noopener noreferrer" aria-label="Follow Justin on X">Follow</a>
        </div>
      </Skeleton>
    </div>}
  </div>;
}
