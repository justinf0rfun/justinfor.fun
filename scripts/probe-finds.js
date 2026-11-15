(async () => {
  const root = document.querySelector('[data-finds-ready="true"]');
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  assert(root, "Finds must finish hydrating before this probe runs.");
  const drawer = root.dataset.drawer, selected = root.dataset.selected;
  const until = async condition => {
    const deadline = performance.now() + 4000;
    while (!condition()) { assert(performance.now() < deadline, "Finds did not reach the expected state."); await new Promise(requestAnimationFrame); }
  };
  const click = selector => { const button = root.querySelector(selector); assert(button, selector); button.click(); };
  const select = async id => { if (root.dataset.selected !== id) click(`[data-find-card="${id}"]`); await until(() => root.dataset.selected === id); };
  const choose = async id => { click(`[data-find-drawer="${id}"]`); await until(() => root.dataset.drawer === id); };
  const settled = () => until(() => root.dataset.drawerPhase === "idle");
  const read = async () => { click('.finds-open-row button'); await until(() => root.dataset.reading === "true"); };
  const close = async () => { click('.finds-reader-toolbar button'); await until(() => !root.querySelector('[data-finds-reader]')); };
  await choose("all");
  const ids = [...root.querySelectorAll('[data-find-card][data-find-mock="false"]')].map(card => card.dataset.findCard);
  assert(new Set(ids).size === 4, "All four real sources must remain distinct.");
  await settled(); await select(ids[0]);
  const shared = root.querySelector(`[data-find-card="${ids[0]}"]`);
  await choose("learning");
  assert(root.querySelector(`[data-find-card="${ids[0]}"]`) === shared, "A shared selected card must retain its real node.");
  assert(document.querySelector('[data-finds-drawer-traveler]'), "A manual drawer choice re-extracts the main card even when its source is shared.");
  await settled();
  for (const id of ["engineering", "inbox", "all", "learning", "engineering"]) {
    await choose(id); await new Promise(requestAnimationFrame);
    assert(document.querySelectorAll('.finds-drawer-copy').length <= 2, "Rapid switching must not queue flying copies.");
  }
  await settled();
  assert(root.dataset.drawer === "engineering", "The last drawer choice wins.");
  assert(!document.querySelector('.finds-drawer-copy') && !root.querySelector('[data-drawer-covered]'), "A completed handoff must reveal the real cards and remove copies.");
  await choose("all");
  await select(ids[3]);
  await read();
  assert(root.querySelector('.finds-source-link').href.includes(ids[3]), "The media-only card must link to its original source.");
  assert(root.querySelector('.finds-source-text').textContent.includes("contains media"), "Do not invent the media-only post's content.");
  await close();
  await choose("learning");
  await select(ids[0]); await read();
  click(`[data-find-follow="${ids[2]}"]`); await until(() => root.dataset.selected === ids[2]);
  click(`[data-finds-article="${ids[2]}"] [data-find-follow="${ids[1]}"]`);
  await until(() => root.dataset.drawer === "engineering" && root.dataset.selected === ids[1]);
  await until(() => !root.querySelector('[data-finds-transfer]'));
  assert(root.querySelectorAll('.finds-trail button').length === 3, "The reading path must retain the route between sources.");
  root.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await until(() => !root.querySelector('[data-finds-reader]'));
  assert(root.closest('[data-x-bookmarks-stage]').classList.contains("is-open"), "First Escape returns to the drawer, not out of Finds.");
  await choose("inbox");
  assert(root.querySelectorAll('[data-find-card][data-find-mock="false"]').length === 1, "Unfiled retains the actual media-only source.");
  await choose(drawer); await select(selected);
  return { passed: true, sources: ids.length, sourcePreservation: true, connectedReading: true, crossDrawer: true, readingPath: true, escape: true, sharedCardPreserved: true, latestDrawerWins: true, noQueuedCopies: true };
})();
