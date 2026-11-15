(async () => {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const root = document.querySelector("#inspired-credits");
  const trigger = document.querySelector(".home-content [data-inspired-trigger]");
  assert(root && trigger, "Run this probe on the hydrated homepage.");
  trigger.scrollIntoView({ block: "center", behavior: "instant" });
  await wait(50);
  const original = scrollY;
  trigger.click();
  assert(root.matches(":popover-open"), "Credits should open.");
  assert(root.querySelectorAll("[data-inspired-pick]").length === 7, "All seven sources should be present.");
  root.querySelector('[data-inspired-pick="bencho"]').click();
  root.querySelector('[data-source="bencho"] [data-inspired-feature]').click();
  await wait(500);
  const mark = root.querySelector(".inspired-outline");
  assert(!mark.hidden && mark.getBoundingClientRect().width > 0, "The sticker deck should be marked.");
  assert(document.querySelector("[data-sticker-deck]").dataset.autoRunning === "false", "Credits should pause sticker autoplay.");
  if (innerWidth < 1200) {
    assert(root.dataset.view === "preview", "Mobile should collapse the source list.");
    const bar = root.querySelector(".inspired-bar").getBoundingClientRect(), target = mark.getBoundingClientRect();
    assert(bar.bottom < target.top || bar.top > target.bottom, "The source bar must leave the component unobstructed.");
    root.querySelector("[data-inspired-list]").click();
    assert(mark.hidden, "Returning to the list should retract the mark.");
    assert(root.querySelector(".inspired-thread").hasAttribute("hidden"), "The SVG thread must also retract.");
  }
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await wait(200);
  assert(!root.matches(":popover-open"), "Escape should close credits.");
  assert(Math.abs(scrollY - original) < 2, "Closing should restore the original scroll position.");
  assert(document.activeElement === trigger, "Closing should restore keyboard focus.");
  assert(!document.documentElement.dataset.inspiredOpen, "Closing should release the autoplay pause.");
  return { passed: true, sources: 7, mark: true, mobileBar: innerWidth < 1200, scrollAndFocusRestored: true };
})();
