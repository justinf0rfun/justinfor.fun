(async () => {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const assert = (value, message) => { if (!value) throw Error(message); };
  const host = document.querySelector("[data-ride-coupon]");
  assert(host, "Run this probe on the homepage.");
  const frame = host.querySelector("iframe");
  const until = performance.now() + 5000;
  while (frame.contentDocument?.body?.dataset.phase !== "idle") {
    if (performance.now() > until) throw Error("Wait for the floating pack before checking entry.");
    await wait(30);
  }
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    assert(getComputedStyle(host).opacity === "1", "Reduced motion should show the pack immediately.");
    return { passed: true, reducedMotion: true };
  }
  let listener, timeout;
  const first = await new Promise((resolve, reject) => {
    timeout = setTimeout(() => reject(Error("The host missed the first drawn entrance pose.")), 3000);
    listener = event => {
      if (event.source !== frame.contentWindow || event.origin !== location.origin || event.data?.event !== "enter") return;
      requestAnimationFrame(() => resolve({
        opacity: getComputedStyle(host).opacity,
        clip: getComputedStyle(host.querySelector(".ride-coupon-frame")).clipPath,
        right: frame.getBoundingClientRect().right,
        transform: frame.contentDocument.getElementById("pack").style.transform,
      }));
    };
    addEventListener("message", listener);
    frame.contentWindow.holoPack.compact();
  }).finally(() => { clearTimeout(timeout); removeEventListener("message", listener); });
  assert(first.opacity === "1", "The original entrance must be visible before it settles.");
  assert(first.clip === "none", "The resting mask must not clip the entrance.");
  assert(Math.abs(first.right - innerWidth) < 1, "The entrance should reach the screen edge.");
  await wait(120);
  assert(frame.contentDocument.getElementById("pack").style.transform !== first.transform, "The visible original pose should keep rotating and moving.");
  return { passed: true, visibleFirstPose: true, originalMotion: true, unclippedEntry: true };
})();
