import { animate } from "motion";

export function mountHomeNews(news: HTMLElement) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const glide = { duration: 0.2, ease: [0.65, 0, 0.35, 1] } as const;
  let animations: ReturnType<typeof animate>[] = [];
  let timer: ReturnType<typeof setTimeout>;
  let open: boolean | undefined;
  let frame = 0;
  const interrupt = () => {
    clearTimeout(timer);
    animations.forEach(animation => animation.stop());
    animations = [];
  };
  const reveal = (visible: boolean) => {
    news.toggleAttribute("data-open", visible);
    news.inert = !visible;
    news.setAttribute("aria-hidden", String(!visible));
  };
  const update = () => {
    frame = 0;
    const next = window.scrollY <= 8 || news.contains(document.activeElement);
    if (next === open) return;
    open = next;
    interrupt();
    if (reduced.matches) {
      news.style.width = "auto";
      animations = [animate(news, { opacity: next ? 1 : 0 }, { duration: 0 })];
      reveal(next);
    } else if (next) {
      animations = [animate(news, { opacity: 1 }, { duration: 0.1, ease: "easeOut" }), animate(news, { width: "auto" }, glide)];
      timer = setTimeout(() => reveal(true), 100);
    } else {
      reveal(false);
      timer = setTimeout(() => {
        animations = [
          animate(news, { width: 32 }, { ...glide, duration: 0.18 }),
          animate(news, { opacity: 0 }, { duration: 0.09, delay: 0.09, ease: "easeIn" }),
        ];
      }, 60);
    }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("pageshow", schedule);
  news.addEventListener("focusout", schedule);
  const onMotionChange = () => { open = undefined; update(); };
  reduced.addEventListener("change", onMotionChange);
  update();
  return () => {
    cancelAnimationFrame(frame);
    interrupt();
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("pageshow", schedule);
    news.removeEventListener("focusout", schedule);
    reduced.removeEventListener("change", onMotionChange);
  };
}
