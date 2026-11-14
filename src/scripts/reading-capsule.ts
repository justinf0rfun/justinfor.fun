import { animate } from "motion";

export function mountReadingCapsule() {
  const wrap = document.querySelector<HTMLElement>("[data-reading-wrap]");
  const title = document.querySelector<HTMLElement>(".article-prose h1");
  const capsule = document.querySelector<HTMLElement>("[data-reading-capsule]");
  const toggle = capsule?.querySelector<HTMLButtonElement>("[data-reading-toggle]");
  const toolbar = capsule?.querySelector<HTMLElement>("[data-reading-toolbar]");
  const chapters = capsule?.querySelector<HTMLElement>("[data-reading-chapters]");
  const surface = capsule?.querySelector<HTMLElement>("[data-reading-surface]");
  const brand = capsule?.querySelector<HTMLElement>("[data-reading-brand]");
  const mark = brand?.querySelector<HTMLElement>("[data-reading-dot]");
  const avatar = brand?.querySelector<HTMLElement>(".reading-back");
  const share = capsule?.querySelector<HTMLButtonElement>("[data-reading-share]");
  const shareSurface = share?.querySelector<HTMLElement>("[data-reading-share-surface]");
  const shareLabel = share?.querySelector<HTMLElement>("[data-reading-share-label]");
  if (!wrap || !title || !capsule || !toggle || !toolbar || !chapters || !surface || !brand || !mark || !avatar || !share || !shareSurface || !shareLabel) return;
  const mobile = matchMedia("(max-width: 47.999rem)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let flight: ReturnType<typeof animate> | undefined;
  let open = false;
  let visible: boolean | undefined;
  let frame = 0;
  let entrance: ReturnType<typeof animate>[] = [];
  let entryRun = 0;

  // DotsSubNav: falling circle, delayed surface expansion, then labels and CTA.
  const spread = { delay: 0.558, duration: 0.509, ease: [0.19045, 0.58992, 0, 0.93507] } as const;
  const label = { delay: 0.586, duration: 0.43, ease: [0.25, 0.1, 0.25, 1] } as const;
  // Matching calc()/var() slots are required by Motion's complex-value mixer.
  const circleSurface = "inset(0px calc(50% - 29px) calc(100% - 58px + var(--surface-menu-height, 0px) * 0) calc(50% - 29px) round 29px)";
  const fullSurface = "inset(0px calc(0% - 0px) calc(0% - 0px + var(--surface-menu-height, 0px) * 1) calc(0% - 0px) round 29px)";
  const moveShare = (progress: number) => {
    const stretch = progress <= 0 || progress >= 1 ? 0 : 32 * Math.sin(Math.PI * progress);
    share.style.transform = `translateX(calc(${-50 * (1 - progress)}cqw + ${29 * (1 - progress)}px))`;
    shareSurface.style.clipPath = `inset(0px 0px 0px ${32 - stretch}px round 999px)`;
    shareLabel.style.transform = `translateX(${-stretch / 2}px)`;
  };

  const setOpen = (next: boolean, restoreFocus = false) => {
    open = next;
    flight?.stop();
    capsule.toggleAttribute("data-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    chapters.inert = !open;
    chapters.setAttribute("aria-hidden", String(!open));
    const height = toolbar.offsetHeight + (open ? chapters.offsetHeight : 0);
    flight = animate(capsule, { height }, { type: "spring", duration: reduced.matches ? 0 : 0.38, bounce: 0 });
    if (restoreFocus) toggle.focus({ preventScroll: true });
    if (open) {
      const list = chapters.querySelector<HTMLElement>(".reading-chapters-scroll");
      const current = chapters.querySelector<HTMLElement>("[aria-current]");
      // Scroll the chapter list only; scrollIntoView would also move the clipped capsule.
      if (list && current) list.scrollTop += current.getBoundingClientRect().top - list.getBoundingClientRect().top - 8;
    }
  };

  const updateVisibility = () => {
    frame = 0;
    const next = mobile.matches && title.getBoundingClientRect().bottom <= 0;
    if (next === visible) return;
    const wasVisible = visible;
    visible = next;
    const run = ++entryRun;
    entrance.forEach((animation) => animation.stop());
    entrance = [];
    wrap.inert = true;
    wrap.setAttribute("aria-hidden", String(!visible));
    if (!visible) {
      const actions = document.querySelector<HTMLElement>("[data-article-actions]");
      if (actions?.matches(":popover-open")) actions.hidePopover();
      if (open) setOpen(false);
      if (!wasVisible || reduced.matches) wrap.removeAttribute("data-visible");
      else {
        const exit = animate(capsule, { opacity: 0 }, { duration: 0.15 });
        entrance = [exit];
        void exit.finished.then(() => { if (run === entryRun) wrap.removeAttribute("data-visible"); });
      }
      return;
    }

    // Match React's initial styles before exposing the DOM; delayed animate() resolves on a later frame.
    const instant = reduced.matches;
    capsule.toggleAttribute("data-entry-ready", instant);
    capsule.style.opacity = instant ? "1" : "0";
    capsule.style.transform = instant ? "translateY(0px)" : "translateY(-180px)";
    surface.style.clipPath = instant ? fullSurface : circleSurface;
    brand.style.transform = instant ? "translateX(0px)" : "translateX(calc((50cqw - 29px) * 1))";
    mark.style.transform = instant ? "scale(1)" : "scale(1.815)";
    mark.style.opacity = instant ? "0" : "1";
    avatar.style.opacity = instant ? "1" : "0";
    toggle.style.opacity = instant ? "1" : "0";
    share.style.opacity = instant ? "1" : "0";
    moveShare(instant ? 1 : 0);
    wrap.setAttribute("data-visible", "");
    if (instant) {
      wrap.inert = false;
      return;
    }

    entrance = [
      animate(capsule, { opacity: [0, 1] }, { duration: 0.08 }),
      animate(capsule, { transform: ["translateY(-180px)", "translateY(72px)", "translateY(0px)"] }, {
        delay: 0.085, duration: 1.0916, times: [0, 0.29286, 1],
        ease: [[0, 1, 0.68448, 1], [0.26245, 0, 0.08511, 1]],
      }),
      animate(surface, { clipPath: [circleSurface, fullSurface] }, spread),
      animate(brand, { transform: ["translateX(calc((50cqw - 29px) * 1))", "translateX(calc((50cqw - 29px) * 0))"] }, spread),
      animate(mark, { transform: ["scale(1.815)", "scale(1)"] }, { delay: 0.2, duration: 0.35, ease: [0.22, 1, 0.36, 1] }),
      animate(toggle, { opacity: [0, 1] }, { delay: 0.63, duration: 0.577, ease: [0.25, 0.1, 0.25, 1] }),
      animate(0, 1, { ...spread, ease: [0.14019, 0.48002, 0.29395, 0.9993], onUpdate: moveShare }),
      animate(share, { opacity: [0, 1] }, label),
    ];
    void Promise.all(entrance.map((animation) => animation.finished)).then(() => {
      if (run !== entryRun || !visible) return;
      capsule.setAttribute("data-entry-ready", "");
      entrance.push(
        animate(mark, { opacity: 0 }, { duration: 0.12 }),
        animate(avatar, { opacity: 1 }, { duration: 0.12 }),
      );
      wrap.inert = false;
    });
  };
  const scheduleVisibility = () => {
    if (!frame) frame = requestAnimationFrame(updateVisibility);
  };
  window.addEventListener("scroll", scheduleVisibility, { passive: true });
  window.addEventListener("resize", scheduleVisibility, { passive: true });
  window.addEventListener("pageshow", scheduleVisibility);

  toggle.addEventListener("click", () => {
    const actions = document.querySelector<HTMLElement>("[data-article-actions]");
    if (actions?.matches(":popover-open")) actions.hidePopover();
    setOpen(!open);
  });
  chapters.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("[data-reading-entry]") : null;
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setOpen(false);
    // Making the list inert cancels the link's default activation; navigate explicitly.
    window.location.hash = link.hash;
  });
  share.addEventListener("click", () => setOpen(false));
  document.addEventListener("pointerdown", (event) => {
    if (open && event.target instanceof Node && !capsule.contains(event.target)) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && open) setOpen(false, capsule.contains(document.activeElement));
  });
  capsule.addEventListener("focusout", (event) => {
    if (open && event.relatedTarget instanceof Node && !capsule.contains(event.relatedTarget)) setOpen(false);
  });
  mobile.addEventListener("change", () => { if (!mobile.matches) setOpen(false); updateVisibility(); });
  reduced.addEventListener("change", () => { visible = undefined; updateVisibility(); });
  new ResizeObserver(() => { if (open) setOpen(true); }).observe(chapters);
  updateVisibility();
}
