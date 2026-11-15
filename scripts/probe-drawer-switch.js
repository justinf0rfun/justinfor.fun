(async () => {
  const root = document.querySelector('[data-finds-ready="true"]');
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  assert(root, "Finds must finish hydrating first.");
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return { skipped: true, reason: "Reduced motion" };
  const frame = () => new Promise(requestAnimationFrame);
  const settled = async () => {
    const deadline = performance.now() + 3000;
    while (root.dataset.drawerPhase !== "idle") { assert(performance.now() < deadline, "Drawer switch did not settle."); await frame(); }
    assert(!document.querySelector('.finds-drawer-copy') && !root.querySelector('[data-drawer-covered]'), "Drawer switch left a copy or hidden real card.");
  };
  const select = async id => {
    root.querySelector(`[data-find-drawer="${id}"]`).click(); await frame(); await frame();
    assert(document.querySelector('[data-finds-drawer-traveler]'), `${id}: manual drawer click must launch a leading card, including the active / shared-card cases.`);
    await settled();
  };
  await settled();
  const initial = root.dataset.drawer;
  await select(initial);
  await select("all");
  const sharedId = "2089996330861224324";
  if (root.dataset.selected !== sharedId) {
    root.querySelector(`[data-find-card="${sharedId}"]`).click();
    const deadline = performance.now() + 3000;
    while (root.dataset.selected !== sharedId) { assert(performance.now() < deadline, "Could not select the shared source."); await frame(); }
  }
  const selected = root.dataset.selected;
  const node = root.querySelector(`[data-find-card="${selected}"]`);
  await select("learning");
  assert(root.dataset.selected === selected && root.querySelector(`[data-find-card="${selected}"]`) === node, "Shared card identity must not be remounted.");
  for (const id of ["inbox", "all", "learning", "all", "learning", "engineering", "inbox"]) await select(id);
  return { passed: true, activeDrawerReplay: true, upperRowFlight: true, sharedIdentity: true, lowerRowFlight: true, cleanup: true };
})();
