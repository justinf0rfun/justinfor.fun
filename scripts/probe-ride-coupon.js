(async () => {
  const waitFor = async (condition, message) => {
    const until = performance.now() + 12_000;
    while (!condition()) { if (performance.now() > until) throw Error(message); await new Promise(resolve => setTimeout(resolve, 40)); }
  };
  const assert = (value, message) => { if (!value) throw Error(message); };
  const host = document.querySelector("[data-ride-coupon]");
  assert(host, "Run this probe on the homepage.");
  await waitFor(() => host.dataset.ready === "true", "The original pack should become ready.");
  const frame = host.querySelector("iframe"), originalWindow = frame.contentWindow, child = frame.contentDocument;
  await waitFor(() => child.body.dataset.phase === "idle", "The entrance should settle before the interaction checks.");
  window.dispatchEvent(new MessageEvent("message", { origin: location.origin, source: window, data: { type: "ride-pack", event: "open" } }));
  assert(host.dataset.expanded === "false", "Another window must not open the pack.");
  child.getElementById("hit").click();
  await waitFor(() => host.matches(":modal"), "Releasing the native wrapper should enter the foreground stage.");
  const bounds = host.getBoundingClientRect();
  assert(Math.abs(bounds.width - innerWidth) < 1 && Math.abs(bounds.height - innerHeight) < 1, "The stage must fill the screen.");
  assert(frame.contentWindow.innerWidth === innerWidth && frame.contentWindow.innerHeight === innerHeight, "The animation must use the real viewport dimensions.");
  assert(getComputedStyle(host.querySelector(".ride-coupon-frame")).clipPath === "none", "There must be no small clipping rectangle during the reveal.");
  await waitFor(() => child.body.dataset.phase === "spread", "The original launch should reveal all five cards.");
  assert(frame.contentWindow === originalWindow && frame.contentDocument === child, "The original runtime should survive presentation changes.");
  const cards = [...child.querySelectorAll(".card")];
  assert(cards.length === 5, "All five original cards should be present.");
  assert(cards.map(card => card.dataset.card).sort().join(",") === "blip,cubit,facet,nova,ringo", "Card identities must remain stable while shuffled.");
  const targets = JSON.parse(new URL(frame.src).searchParams.get("links") || "{}");
  assert(cards.every(card => targets[card.dataset.card] ? card.getAttribute("href") === targets[card.dataset.card] : !card.hasAttribute("href")), "Each card should use its configured offer link.");
  assert(cards.every(card => card.querySelector('.name img[alt="DiDi"]')), "Every card should show the DiDi logo in its title.");
  assert(!host.querySelector("[data-ride-close]").matches(":focus-visible"), "Opening must not force a ring onto Close.");
  assert(getComputedStyle(document.documentElement).overflow === "hidden", "The homepage should stay still behind the full-screen scene.");
  host.querySelector("[data-ride-close]").click();
  await waitFor(() => host.dataset.expanded === "false" && child.body.dataset.phase === "idle", "Close should restore a floating pack.");
  assert(!host.matches(":modal") && frame.contentDocument === child, "Closing must keep the frame and release the modal.");
  return { passed: true, fullViewport: true, originalCards: 5, noClipBox: true, noForcedCloseRing: true, configuredLinks: true, didiLogos: true, resetWithoutReload: true };
})();
