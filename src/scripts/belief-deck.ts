import { drawSticker, paperTransform, stickerPose, stickerSwipe, type PaperSize } from "../lib/belief-deck";

export function mountBeliefDeck(root: HTMLElement, select: (index: number) => void) {
  const stage = root.querySelector<HTMLElement>("[data-sticker-stage]")!;
  const cards = [...root.querySelectorAll<HTMLElement>("[data-sticker-card]")];
  const status = root.querySelector<HTMLElement>("[data-sticker-status]")!;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const hover = matchMedia("(hover: hover) and (pointer: fine)");
  const animations = new Map<number, Animation>();
  let order = cards.map((_, index) => index), fan = false;
  let gesture: { id: number; index: number; x: number; y: number; time: number; matrix: string; dragging: boolean } | undefined;
  const peeling = () => !!root.querySelector('[data-peeling="true"]');
  const stop = (index: number) => {
    const matrix = getComputedStyle(cards[index]).transform;
    animations.get(index)?.cancel();animations.delete(index);
    cards[index].style.transform = matrix;
    return matrix;
  };
  const layout = (instant = false, outgoing = -1, direction = -1) => {
    const sizes: PaperSize[] = cards.map(card => ({ width: card.offsetWidth, height: card.offsetHeight }));
    order.forEach((index, depth) => {
      if (gesture?.dragging && gesture.index === index) return;
      const card = cards[index], from = stop(index);
      const pose = stickerPose(depth, cards.length, sizes[index], sizes[order[0]], stage.clientWidth, fan);
      const target = paperTransform(pose), layer = cards.length - depth;
      card.style.transform = target;card.style.zIndex = String(layer);card.style.pointerEvents = "auto";
      if (instant || reduced.matches) return;
      const side = paperTransform({ x: direction * Math.min(110, stage.clientWidth * .3), y: -24, scale: .94, rotate: direction * 18, turn: direction * 24 });
      const flight = index === outgoing && !fan;
      if (flight) card.style.pointerEvents = "none";
      const animation = card.animate(flight ? [
        { transform: from, zIndex: cards.length + 2, offset: 0 },
        { transform: side, zIndex: cards.length + 2, offset: .42 },
        { transform: side, zIndex: layer, offset: .44 },
        { transform: target, zIndex: layer, offset: 1 },
      ] : [{ transform: from }, { transform: target }], {
        duration: flight ? 540 : fan ? 300 : 360, easing: "cubic-bezier(.22,1,.36,1)", fill: "both",
      });
      animations.set(index, animation);
      void animation.finished.then(() => { if (animations.get(index) === animation) { animations.delete(index);animation.cancel();card.style.pointerEvents = "auto"; } }).catch(() => {});
    });
  };
  const draw = (step = 1, direction = -1, instant = false) => {
    if (peeling()) return;
    const outgoing = order[0];order = drawSticker(order, step);fan = false;
    root.dataset.fanned = "false";
    cards.forEach((card, index) => { card.tabIndex = index === order[0] ? 0 : -1; });
    select(order[0]);layout(instant, outgoing, direction);
    status.textContent = `${cards[order[0]].dataset.stickerLabel}. ${order[0] + 1} of ${cards.length}`;
  };
  const resetGesture = () => {
    const previous = gesture;gesture = undefined;delete root.dataset.dragging;
    if (previous && root.hasPointerCapture(previous.id)) root.releasePointerCapture(previous.id);
    if (previous?.dragging) layout();
  };
  const lostCapture = (event: PointerEvent) => {
    // Taking over a touch releases the image's implicit capture, not the deck's.
    if (event.target === root && event.pointerId === gesture?.id) resetGesture();
  };
  const down = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || gesture || peeling() || !(event.target instanceof Element) || event.target.closest("a")) return;
    const card = event.target.closest<HTMLElement>("[data-sticker-card]");if (!card) return;
    const index = Number(card.dataset.stickerCard), depth = order.indexOf(index);
    if (depth > 0) return;
    const rect = card.querySelector<HTMLElement>("[data-sticker-art]")!.getBoundingClientRect();
    // The existing sticker owns only this corner; the deck owns the centre.
    if (!reduced.matches && card.querySelector("[data-peeling]") && event.clientX >= rect.right - 44 && event.clientY >= rect.bottom - 44) return;
    event.stopPropagation();
    gesture = { id: event.pointerId, index, x: event.clientX, y: event.clientY, time: event.timeStamp, matrix: "", dragging: false };
  };
  const move = (event: PointerEvent) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const x = event.clientX - gesture.x, y = event.clientY - gesture.y;
    if (!gesture.dragging) {
      if (Math.abs(y) > 8 && Math.abs(y) > Math.abs(x)) { gesture = undefined;return; }
      if (Math.abs(x) < 8) return;
      gesture.dragging = true;gesture.matrix = stop(gesture.index);
      root.setPointerCapture(event.pointerId);root.dataset.dragging = "true";fan = false;root.dataset.fanned = "false";layout();
    }
    event.preventDefault();event.stopPropagation();
    cards[gesture.index].style.transform = `translate3d(${x}px, ${-Math.min(12, Math.abs(x) * .06)}px, 0) rotate(${x * .045}deg) ${gesture.matrix}`;
  };
  const up = (event: PointerEvent) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const previous = gesture;gesture = undefined;delete root.dataset.dragging;
    if (root.hasPointerCapture(event.pointerId)) root.releasePointerCapture(event.pointerId);
    if (!previous.dragging) return;
    event.preventDefault();event.stopPropagation();
    const direction = event.type === "pointercancel" ? 0 : stickerSwipe(event.clientX - previous.x, event.clientY - previous.y, event.timeStamp - previous.time);
    if (direction) draw(1, direction);else layout();
  };
  const enter = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || !hover.matches || reduced.matches || gesture || peeling()) return;
    fan = true;root.dataset.fanned = "true";layout();
  };
  const leave = () => { if (gesture || peeling()) return;fan = false;root.dataset.fanned = "false";layout(); };
  const click = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const step = event.target.closest<HTMLElement>("[data-sticker-step]");
    if (step) { draw(Number(step.dataset.stickerStep), Number(step.dataset.stickerStep), event.detail === 0);return; }
    const pick = event.target.closest<HTMLElement>("[data-sticker-pick]");
    if (pick) { const depth = order.indexOf(Number(pick.dataset.stickerPick));if (depth > 0) draw(depth, -1, event.detail === 0); }
  };
  const key = (event: KeyboardEvent) => {
    if (!(event.target instanceof Element) || !event.target.closest("[data-sticker-card]") || peeling()) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();event.stopPropagation();draw(event.key === "ArrowRight" ? 1 : -1, -1, true);cards[order[0]].focus({ preventScroll: true });
  };
  const resize = () => { resetGesture();layout(true); };
  const preference = () => { fan = false;root.dataset.fanned = "false";resetGesture();layout(true); };
  root.addEventListener("pointerdown", down, true);root.addEventListener("pointermove", move, true);
  root.addEventListener("pointerup", up, true);root.addEventListener("pointercancel", up, true);
  root.addEventListener("lostpointercapture", lostCapture);root.addEventListener("pointerenter", enter);root.addEventListener("pointerleave", leave);
  root.addEventListener("click", click);root.addEventListener("keydown", key, true);
  window.addEventListener("blur", resetGesture);reduced.addEventListener("change", preference);hover.addEventListener("change", preference);
  const observer = new ResizeObserver(resize);observer.observe(stage);
  root.dataset.ready = "true";layout(true);
  return () => {
    observer.disconnect();animations.forEach(animation => animation.cancel());
    root.removeEventListener("pointerdown", down, true);root.removeEventListener("pointermove", move, true);
    root.removeEventListener("pointerup", up, true);root.removeEventListener("pointercancel", up, true);
    root.removeEventListener("lostpointercapture", lostCapture);root.removeEventListener("pointerenter", enter);root.removeEventListener("pointerleave", leave);
    root.removeEventListener("click", click);root.removeEventListener("keydown", key, true);
    window.removeEventListener("blur", resetGesture);reduced.removeEventListener("change", preference);hover.removeEventListener("change", preference);
  };
}
