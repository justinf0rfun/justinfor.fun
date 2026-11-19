import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

export function mountSayHiGuide(trigger: HTMLButtonElement, openChat: () => void) {
  const hand = document.querySelector<HTMLElement>("[data-chat-guide-hand]");
  const status = document.querySelector<HTMLElement>("[data-chat-guide-status]");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let scroll: gsap.core.Tween | undefined;
  let tap: gsap.core.Timeline | undefined;
  let active = false;
  let width = window.innerWidth;

  const sources = () => document.querySelectorAll<HTMLButtonElement>("[data-home-chat-guide]");
  const sync = () => sources().forEach(button => {
    button.disabled = active || trigger.disabled || !button.hasAttribute("data-guide-ready");
    if (active) button.setAttribute("aria-busy", "true");
    else button.removeAttribute("aria-busy");
  });
  const cancel = () => {
    if (!active) return;
    active = false;
    scroll?.kill(); tap?.kill();
    scroll = undefined; tap = undefined;
    if (hand) gsap.set(hand, { clearProps: "all" });
    gsap.set(trigger, { clearProps: "transform" });
    if (status) status.textContent = "";
    window.dispatchEvent(new CustomEvent("home-chat-guide-state", { detail: false }));
    sync();
  };
  const finish = () => {
    if (!active) return;
    cancel();
    openChat();
  };
  const pointAndTap = () => {
    if (!active) return;
    if (!hand || trigger.getAttribute("aria-expanded") === "true") { finish(); return; }
    const rect = trigger.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0 || getComputedStyle(trigger).visibility !== "visible") { cancel(); return; }
    const x = rect.left + rect.width * .6;
    const y = rect.top + rect.height * .5;
    // These coordinates and phases match the first tap in X's 5.3s CSS loop.
    gsap.set(hand, { display: "block", x: x - 24.9724, y: y - 25.2155 });
    const contact = 5.3 * .0772;
    const rippleEnd = 5.3 * .194;
    tap = gsap.timeline({ onComplete: finish });
    tap.to(trigger, { scale: .94, duration: .1, ease: "power2.out" }, contact - .1)
      .to(trigger, { scale: 1, duration: .15, ease: "power2.out" }, contact)
      .to(hand, { opacity: 0, duration: .12, ease: "power2.out" }, rippleEnd);
  };
  const onClick = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const source = event.target.closest<HTMLButtonElement>("[data-home-chat-guide]");
    if (!source || source.disabled || active || trigger.disabled) return;
    if (reduced.matches || event.detail === 0 || trigger.getAttribute("aria-expanded") === "true") { openChat(); return; }
    active = true; width = window.innerWidth;
    if (status) status.textContent = "Opening chat…";
    sync();
    window.dispatchEvent(new CustomEvent("home-chat-guide-state", { detail: true }));
    const bottom = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    if (Math.abs(bottom - window.scrollY) < 2) { pointAndTap(); return; }
    scroll = gsap.to(window, {
      duration: Math.min(1.1, Math.max(.45, Math.abs(bottom - window.scrollY) / 2400)),
      ease: "power2.inOut",
      scrollTo: { y: bottom, autoKill: true, onAutoKill: cancel },
      onComplete: pointAndTap,
    });
  };
  const onPointer = (event: Event) => {
    if (event.target instanceof Element && event.target.closest("[data-home-chat-guide]")) return;
    cancel();
  };
  const onKey = (event: KeyboardEvent) => {
    if (["Escape", "Tab", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) cancel();
  };
  const onResize = () => { if (window.innerWidth !== width) cancel(); };
  const onVisibility = () => { if (document.hidden) cancel(); };
  const onReduced = () => { if (active && reduced.matches) finish(); };
  const readiness = new MutationObserver(sync);
  readiness.observe(trigger, { attributes: true, attributeFilter: ["disabled"] });
  document.addEventListener("home-intro-ready", sync);
  document.addEventListener("click", onClick);
  document.addEventListener("pointerdown", onPointer, { passive: true });
  document.addEventListener("touchstart", onPointer, { passive: true });
  document.addEventListener("wheel", cancel, { passive: true });
  document.addEventListener("keydown", onKey);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("resize", onResize);
  window.addEventListener("pagehide", cancel);
  reduced.addEventListener("change", onReduced);
  sync();
  return () => {
    cancel(); readiness.disconnect();
    document.removeEventListener("home-intro-ready", sync);
    document.removeEventListener("click", onClick);
    document.removeEventListener("pointerdown", onPointer);
    document.removeEventListener("touchstart", onPointer);
    document.removeEventListener("wheel", cancel);
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pagehide", cancel);
    reduced.removeEventListener("change", onReduced);
    sources().forEach(button => { button.disabled = true; });
  };
}
