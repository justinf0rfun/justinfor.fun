type Box = { left: number; right: number; top: number; bottom: number };

export function inspiredGeometry(target: Box, anchor: Box, width: number, height: number) {
  const left = Math.max(6, target.left - 7), top = Math.max(6, target.top - 7);
  const right = Math.min(width - 6, target.right + 7), bottom = Math.min(height - 6, target.bottom + 7);
  const side = (target.top + target.bottom) / 2 > height / 2 ? "top" : "bottom";
  const visible = right > left && bottom > top && target.bottom > 0 && target.top < height;
  const fromLeft = (anchor.left + anchor.right) / 2 < (left + right) / 2;
  const x1 = fromLeft ? anchor.right : anchor.left, y1 = (anchor.top + anchor.bottom) / 2;
  const x2 = fromLeft ? left : right, y2 = (top + bottom) / 2;
  return { left, top, width: right - left, height: bottom - top, side, visible, x2, y2,
    path: `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}` };
}

export function mountInspiredCredits() {
  const root = document.querySelector<HTMLElement>("#inspired-credits");
  if (!root) return;
  const panel = root.querySelector<HTMLElement>(".inspired-panel")!;
  const bar = root.querySelector<HTMLElement>(".inspired-bar")!;
  const outline = root.querySelector<HTMLElement>(".inspired-outline")!;
  const thread = root.querySelector<SVGSVGElement>(".inspired-thread")!;
  const path = thread.querySelector("path")!, dot = thread.querySelector("circle")!;
  const status = root.querySelector<HTMLElement>("[data-inspired-status]")!;
  const picks = [...root.querySelectorAll<HTMLButtonElement>("[data-inspired-pick]")];
  const small = matchMedia("(max-width: 1199px)"), reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let opened = false, revision = 0, frame = 0, responseTimer = 0;
  let origin: HTMLElement | null = null, scroll = 0, selected = "";
  let target: HTMLElement | null = null, feature: HTMLAnchorElement | null = null;
  let exit: Animation | undefined;

  function previewSource(id: string | null) {
    clearTimeout(responseTimer);
    if (id) document.documentElement.dataset.inspiredSource = id;
    else delete document.documentElement.dataset.inspiredSource;
    window.dispatchEvent(new CustomEvent("inspired-preview", { detail: id }));
  }
  function hideMark() { outline.hidden = true; thread.setAttribute("hidden", ""); }
  hideMark();
  function draw() {
    frame = 0;
    if (!opened || !target || (small.matches && root!.dataset.view === "list")) { hideMark(); return; }
    const style = getComputedStyle(target);
    if (target.closest('[hidden], [aria-hidden="true"]') || style.visibility === "hidden" || Number(style.opacity) === 0) { hideMark(); return; }
    if (target.closest("[data-reading-capsule]:not([data-entry-ready])")) { hideMark(); return; }
    const rect = target.getBoundingClientRect();
    const anchor = small.matches ? bar : picks.find(pick => pick.dataset.inspiredPick === selected)!;
    let geometry = inspiredGeometry(rect, anchor.getBoundingClientRect(), innerWidth, innerHeight);
    root!.dataset.side = geometry.side;
    if (small.matches) geometry = inspiredGeometry(rect, bar.getBoundingClientRect(), innerWidth, innerHeight);
    outline.hidden = !geometry.visible; thread.toggleAttribute("hidden", !geometry.visible);
    if (!geometry.visible) return;
    Object.assign(outline.style, { left: `${geometry.left}px`, top: `${geometry.top}px`, width: `${geometry.width}px`, height: `${geometry.height}px` });
    path.setAttribute("d", geometry.path);
    dot.setAttribute("cx", String(geometry.x2)); dot.setAttribute("cy", String(geometry.y2));
  }
  const schedule = () => { if (opened && !frame) frame = requestAnimationFrame(draw); };

  function locate(link: HTMLAnchorElement) {
    // An open collection owns the viewport; use the normal page link to leave it first.
    if (document.querySelector('.home-content[inert]') || (document.body.classList.contains("home-surface") && origin?.closest('.is-open[aria-hidden="false"]'))) return null;
    const candidates = [...document.querySelectorAll<HTMLElement>(link.dataset.selector!)].filter(element => element.getBoundingClientRect().width > 0);
    return candidates.find(element => !element.closest('[hidden], [aria-hidden="true"]'))
      ?? candidates.find(element => element.closest("[data-reading-wrap]"))
      ?? (link.dataset.selector === "[data-home-news]" ? document.querySelector<HTMLElement>("[data-home-news]") : null);
  }
  function showFeature(link: HTMLAnchorElement) {
    if (link.getAttribute("aria-disabled") === "true") return false;
    const element = locate(link);
    if (!element) return false;
    if (target) observer.unobserve(target);
    feature = link; target = element; observer.observe(element);
    visibilityObserver.disconnect();
    for (let node: HTMLElement | null = element; node; node = node.parentElement) {
      visibilityObserver.observe(node, { attributes: true, attributeFilter: ["hidden", "aria-hidden", "class", "style", "data-entry-ready"] });
    }
    root!.querySelectorAll("[data-inspired-feature]").forEach(item => item.removeAttribute("aria-current"));
    link.setAttribute("aria-current", "true");
    const source = link.closest<HTMLElement>("[data-source]")!;
    const name = source.querySelector("strong")!.textContent!;
    const localName = link.dataset.label!;
    bar.querySelector(".inspired-bar-feature")!.textContent = localName;
    const original = source.querySelector<HTMLAnchorElement>(".inspired-links a")!;
    const barLink = bar.querySelector<HTMLAnchorElement>(".inspired-bar-origin")!;
    barLink.textContent = `${name} ↗`; barLink.href = original.href;
    root!.dataset.view = small.matches ? "preview" : "list";
    panel.setAttribute("aria-modal", "false");
    if (element.matches("[data-home-news]")) window.scrollTo({ top: 0, behavior: "instant" });
    else if (element.closest("[data-reading-wrap]")) {
      const title = document.querySelector<HTMLElement>(".article-prose h1");
      if (title && title.getBoundingClientRect().bottom >= 0) window.scrollTo({ top: scrollY + title.getBoundingClientRect().bottom + 16, behavior: "instant" });
    }
    else if (!element.closest(".home-dock-wrap, [data-reading-wrap]")) {
      const rect = element.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + (rect.top + rect.bottom) / 2 - innerHeight / 2, behavior: "instant" });
    }
    status.textContent = `${localName}. Credit: ${name}.`;
    previewSource(null); schedule();
    // Let scroll-triggered islands hydrate before asking their existing motion to respond.
    responseTimer = window.setTimeout(() => { if (opened && feature === link) previewSource(selected); }, reduced.matches ? 0 : 220);
    if (small.matches) bar.querySelector<HTMLButtonElement>("[data-inspired-list]")!.focus({ preventScroll: true });
    return true;
  }
  function select(id: string, inspect = !small.matches) {
    observer.disconnect(); observer.observe(panel);
    visibilityObserver.disconnect();
    selected = id; target = null; feature = null; hideMark(); previewSource(null);
    root!.querySelectorAll("[data-inspired-feature]").forEach(item => item.removeAttribute("aria-current"));
    status.textContent = "";
    picks.forEach(pick => {
      const active = pick.dataset.inspiredPick === id;
      pick.setAttribute("aria-expanded", String(active));
      document.getElementById(pick.getAttribute("aria-controls")!)!.hidden = !active;
    });
    if (!id) return;
    const source = root!.querySelector<HTMLElement>(`[data-source="${id}"]`)!;
    if (inspect) {
      const link = [...source.querySelectorAll<HTMLAnchorElement>("[data-inspired-feature]")].find(link => locate(link));
      if (link) showFeature(link);
    }
    const detail = source.getBoundingClientRect(), bounds = panel.getBoundingClientRect();
    if (detail.bottom > bounds.bottom - 20) panel.scrollTop += Math.min(detail.bottom - bounds.bottom + 20, detail.top - bounds.top - 12);
  }
  function list() {
    root!.dataset.view = "list"; panel.setAttribute("aria-modal", String(small.matches));
    if (small.matches) { visibilityObserver.disconnect(); target = null; feature = null; hideMark(); previewSource(null); }
    (picks.find(pick => pick.dataset.inspiredPick === selected) ?? picks[0]).focus({ preventScroll: true });
    schedule();
  }
  function open(trigger?: HTMLElement) {
    ++revision; exit?.cancel();
    path.getAnimations().forEach(animation => animation.cancel());
    if (!opened) {
      origin = trigger ?? null; scroll = window.scrollY; opened = true;
      window.dispatchEvent(new CustomEvent("inspired-opening"));
      root!.showPopover();
      document.documentElement.dataset.inspiredOpen = "true";
      document.querySelectorAll("[data-inspired-trigger]").forEach(button => button.setAttribute("aria-expanded", "true"));
    }
    list();
  }
  async function close(restore = true) {
    if (!opened) return;
    const version = ++revision;
    previewSource(null);
    if (!reduced.matches) {
      const surface = small.matches && root!.dataset.view === "preview" ? bar : panel;
      exit?.cancel();
      exit = surface.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(8px) scale(.98)" }], { duration: 140, easing: "ease-out" });
      path.animate([{ strokeDasharray: 1, strokeDashoffset: 0 }, { strokeDasharray: 1, strokeDashoffset: 1 }], { duration: 140, fill: "forwards" });
      await exit.finished.catch(() => {});
    }
    if (version !== revision) return;
    opened = false; target = null; feature = null; hideMark();
    observer.disconnect(); observer.observe(panel);
    visibilityObserver.disconnect();
    path.getAnimations().forEach(animation => animation.cancel());
    root!.hidePopover(); delete document.documentElement.dataset.inspiredOpen;
    document.querySelectorAll("[data-inspired-trigger]").forEach(button => button.setAttribute("aria-expanded", "false"));
    if (restore) { window.scrollTo({ top: scroll, behavior: "instant" }); origin?.focus({ preventScroll: true }); }
  }

  document.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;
    const trigger = event.target.closest<HTMLElement>("[data-inspired-trigger]");
    if (trigger) { event.preventDefault(); open(trigger); return; }
    if (opened && event.target.closest("[data-home-chat-trigger], [data-home-moments-trigger]")) { close(false); return; }
    if (!opened || !root!.contains(event.target)) return;
    if (event.target.closest("[data-inspired-close]")) { close(); return; }
    if (event.target.closest("[data-inspired-list]")) { list(); return; }
    const pick = event.target.closest<HTMLElement>("[data-inspired-pick]");
    if (pick) { select(selected === pick.dataset.inspiredPick ? "" : pick.dataset.inspiredPick!); return; }
    const link = event.target.closest<HTMLAnchorElement>("[data-inspired-feature]");
    if (link?.getAttribute("aria-disabled") === "true") { event.preventDefault(); return; }
    if (link && showFeature(link)) event.preventDefault();
  });
  document.addEventListener("keydown", event => {
    if (!opened) return;
    if (event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); close(); }
    if (event.key !== "Tab" || !small.matches || root!.dataset.view !== "list") return;
    const stops = [...panel.querySelectorAll<HTMLElement>("button, a[href]")].filter(element => element.getBoundingClientRect().height > 0);
    const at = stops.indexOf(document.activeElement as HTMLElement);
    if (at < 0 || (event.shiftKey && at === 0) || (!event.shiftKey && at === stops.length - 1)) {
      event.preventDefault(); stops[event.shiftKey ? stops.length - 1 : 0]?.focus({ preventScroll: true });
    }
  }, true);
  window.addEventListener("scroll", schedule, { passive: true });
  panel.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.visualViewport?.addEventListener("resize", schedule);
  small.addEventListener("change", () => { if (opened) list(); });
  window.addEventListener("home-moments-opening", () => close(false));
  window.addEventListener("home-chat-change", event => { if ((event as CustomEvent).detail) close(false); });
  const observer = new ResizeObserver(schedule);
  observer.observe(panel);
  const visibilityObserver = new MutationObserver(schedule);
  const phone = matchMedia("(max-width: 47.999rem)");
  const phoneFeatures = () => root.querySelectorAll<HTMLAnchorElement>("[data-phone-only]").forEach(link => {
    link.setAttribute("aria-disabled", String(!phone.matches)); link.tabIndex = phone.matches ? 0 : -1;
    link.querySelector(".inspired-see")!.textContent = phone.matches ? "See it here" : "On mobile";
  });
  phone.addEventListener("change", phoneFeatures); phoneFeatures();

  const url = new URL(location.href), id = url.searchParams.get("inspired");
  if (id && picks.some(pick => pick.dataset.inspiredPick === id)) {
    const part = Number(url.searchParams.get("part") ?? 0);
    url.searchParams.delete("inspired"); url.searchParams.delete("part"); history.replaceState(history.state, "", url);
    open(); select(id, false);
    const links = root.querySelectorAll<HTMLAnchorElement>(`[data-source="${id}"] [data-inspired-feature]`);
    requestAnimationFrame(() => { if (opened) showFeature(links[part] ?? links[0]); });
  }
}
