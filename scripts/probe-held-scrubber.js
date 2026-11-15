// Run in the browser after a real fast drag, with the pointer held still and down.
(async () => {
  const dial = document.querySelector('.finds-scrubber');
  if (dial?.dataset.dragging !== "true") throw new Error("Start a real horizontal dial drag and hold the pointer still first.");
  const end = performance.now() + 700;
  while (performance.now() < end) await new Promise(requestAnimationFrame);
  if (dial.dataset.dragging !== "true") throw new Error("Keep the pointer down until the probe finishes.");
  const card = document.querySelector('[data-find-card][aria-pressed="true"]');
  const lift = new DOMMatrix(getComputedStyle(card).transform).m42;
  if (Math.abs(lift - 160) >= 1) throw new Error(`Stopped drag retained a velocity wave: lift ${lift}, expected 160.`);
  return { passed: true, holdSettles: true, selectedLift: lift };
})();
