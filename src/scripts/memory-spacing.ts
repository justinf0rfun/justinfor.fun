const bound = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

export function mountMemorySpacing(
  area: HTMLElement,
  stage: HTMLElement,
  reduced: MediaQueryList,
) {
  const rolls = area.querySelector<HTMLElement>(".memory-rolls")!;
  const pad = area.querySelector<HTMLButtonElement>("[data-memory-spacing-pad]")!;
  const hud = area.querySelector<HTMLElement>("[data-memory-spacing-hud]")!;
  const h = hud.querySelector<HTMLElement>("[data-memory-h]")!;
  const v = hud.querySelector<HTMLElement>("[data-memory-v]")!;
  const isOverlay = stage.dataset.memoryStage === "overlay";
  let targetH = 1, targetV = 1, spacingH = 1, spacingV = 1;
  let frame = 0, last = 0;
  let drag: { id: number; originX: number; originY: number; h: number; v: number } | null = null;

  const active = (show: boolean) => {
    area.toggleAttribute("data-memory-spacing-active", show);
    pad.setAttribute("aria-pressed", String(show));
  };

  const paint = (now: number) => {
    frame = 0;
    const mix = reduced.matches ? 1 : 1 - Math.exp(-Math.min(48, now - last) / 54);
    last = now;
    spacingH += (targetH - spacingH) * mix;
    spacingV += (targetV - spacingV) * mix;
    const moving = Math.abs(targetH - spacingH) > 0.002 || Math.abs(targetV - spacingV) > 0.002;
    if (moving) frame = requestAnimationFrame(paint);
    else {
      spacingH = targetH;
      spacingV = targetV;
    }
    if (spacingH === 1 && spacingV === 1) {
      area.style.removeProperty("--memory-h");
      area.style.removeProperty("--memory-v");
    } else {
      area.style.setProperty("--memory-h", String(spacingH));
      area.style.setProperty("--memory-v", String(spacingV));
    }
  };

  const set = (horizontal: number, vertical: number) => {
    targetH = bound(horizontal, 0.65, 1.85);
    targetV = bound(vertical, 0.65, 1.85);
    h.textContent = targetH.toFixed(2);
    v.textContent = targetV.toFixed(2);
    if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(paint);
    }
  };

  const point = (x: number, y: number) => {
    const rect = area.getBoundingClientRect();
    hud.style.setProperty("--hud-x", `${bound(x - rect.left, 0, rect.width)}px`);
    hud.style.setProperty("--hud-y", `${bound(y - rect.top, 0, rect.height)}px`);
  };

  const reset = () => {
    const held = drag;
    drag = null;
    if (held && area.hasPointerCapture(held.id)) area.releasePointerCapture(held.id);
    active(false);
    set(1, 1);
  };

  area.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0 || !(event.target instanceof Element)) return;
    const ownPad = pad.contains(event.target);
    const desktopGap = event.pointerType === "mouse" &&
      rolls.contains(event.target) && !event.target.closest("[data-memory-photo]");
    if (!ownPad && !desktopGap) return;
    event.preventDefault();
    area.setPointerCapture(event.pointerId);
    drag = { id: event.pointerId, originX: event.clientX, originY: event.clientY, h: spacingH, v: spacingV };
    point(event.clientX, event.clientY);
    set(drag.h, drag.v);
    active(true);
  });

  area.addEventListener("pointermove", (event) => {
    if (drag?.id !== event.pointerId) return;
    const range = Math.min(140, area.clientWidth * 0.3);
    point(event.clientX, event.clientY);
    set(drag.h + (event.clientX - drag.originX) / range, drag.v - (event.clientY - drag.originY) / range);
  });

  for (const type of ["pointerup", "pointercancel", "lostpointercapture"] as const) {
    area.addEventListener(type, (event) => { if (drag?.id === event.pointerId) reset(); });
  }

  const keyboardPoint = () => {
    const rect = pad.getBoundingClientRect();
    point(rect.left + rect.width / 2, rect.bottom);
    active(true);
  };

  pad.addEventListener("click", (event) => {
    if (event.detail !== 0) return;
    if (area.hasAttribute("data-memory-spacing-active")) reset();
    else keyboardPoint();
  });

  pad.addEventListener("keydown", (event) => {
    const dx = Number(event.key === "ArrowRight") - Number(event.key === "ArrowLeft");
    const dy = Number(event.key === "ArrowUp") - Number(event.key === "ArrowDown");
    if (dx || dy) {
      event.preventDefault();
      keyboardPoint();
      set(targetH + dx * 0.1, targetV + dy * 0.1);
    } else if (event.key === "Escape" && area.hasAttribute("data-memory-spacing-active")) {
      event.preventDefault();
      event.stopPropagation();
      reset();
    }
  });

  pad.addEventListener("blur", () => { if (!drag) reset(); });
  window.addEventListener("blur", reset);
  (isOverlay ? stage : window).addEventListener("scroll", () => { if (drag) reset(); }, { passive: true });
  stage.addEventListener("memory-layout", () => {
    reset();
    cancelAnimationFrame(frame);
    frame = 0;
    spacingH = spacingV = 1;
    area.style.removeProperty("--memory-h");
    area.style.removeProperty("--memory-v");
  });
  active(false);
  pad.hidden = false;
}
