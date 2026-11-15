import { createReturnSound } from "../lib/return-sound";

const modes = ["light", "dark", "system"] as const;
type ThemeMode = typeof modes[number];
const labels = { light: "Light", dark: "Dark", system: "System" };

export function mountThemeDial() {
  const button = document.querySelector<HTMLButtonElement>("[data-theme-dial]");
  const label = button?.querySelector<HTMLElement>("[data-theme-label]");
  const status = document.querySelector<HTMLElement>("[data-theme-status]");
  if (!button || !label || !status) return;
  const root = document.documentElement;
  const system = matchMedia("(prefers-color-scheme: dark)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let mode: ThemeMode = root.dataset.homeMode === "light" ? "light" : root.dataset.homeMode === "dark" ? "dark" : "system";
  let transition: ViewTransition | undefined;
  let generation = 0;
  let hint = 0;
  const sound = createReturnSound();
  const nextMode = () => modes[(modes.indexOf(mode) + 1) % modes.length];

  const apply = () => {
    root.dataset.homeMode = mode;
    root.dataset.homeTheme = mode === "system" ? (system.matches ? "dark" : "light") : mode;
    label.textContent = labels[mode];
    button.setAttribute("aria-label", `Theme: ${labels[mode]}. Switch to ${labels[nextMode()]}`);
  };

  button.addEventListener("click", (event) => {
    const run = ++generation;
    transition?.skipTransition();
    const previousTheme = root.dataset.homeTheme;
    mode = nextMode();
    try { localStorage.setItem("home-theme", mode); } catch {}
    if (event.isTrusted) void sound();
    button.toggleAttribute("data-instant", event.detail === 0);
    button.setAttribute("data-hint", "");
    status.textContent = `${labels[mode]} theme`;
    clearTimeout(hint);
    hint = window.setTimeout(() => button.removeAttribute("data-hint"), 1100);

    const nextTheme = mode === "system" ? (system.matches ? "dark" : "light") : mode;
    if (event.detail === 0 || reduced.matches || !document.startViewTransition || nextTheme === previousTheme) {
      apply();
      root.removeAttribute("data-theme-transition");
      return;
    }

    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.setAttribute("data-theme-transition", "");
    const current = document.startViewTransition(apply);
    transition = current;
    void current.ready.then(() => {
      if (run !== generation) return;
      root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] }, {
        duration: 360, easing: "cubic-bezier(.22,1,.36,1)", pseudoElement: "::view-transition-new(root)",
      });
    }).catch(() => { /* A newer click can skip a pending snapshot. */ });
    void current.finished.finally(() => {
      if (run !== generation) return;
      transition = undefined;
      root.removeAttribute("data-theme-transition");
    });
  });
  system.addEventListener("change", () => { if (mode === "system") apply(); });
  apply();
}
