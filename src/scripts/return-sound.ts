import { createReturnSound } from "../lib/return-sound";

export function mountReturnSound() {
  const play = createReturnSound();
  let pending: (() => void) | undefined;
  let soundTimer: ReturnType<typeof setTimeout> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => { clearTimeout(deadline); clearTimeout(soundTimer); pending = undefined; };

  const onClick = (event: MouseEvent) => {
    if (!event.isTrusted || event.button !== 0 || event.defaultPrevented || !(event.target instanceof Element)) return;
    const control = event.target.closest<HTMLElement>("[data-parent-navigation]");
    if (!control) return;
    const playback = play();
    if (!(control instanceof HTMLAnchorElement) || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
      || (control.target && control.target !== "_self")) return;

    event.preventDefault();
    if (pending) return;
    const navigate = () => {
      if (pending !== navigate) return;
      cancel();
      window.location.assign(control.href);
    };
    pending = navigate;
    // Cross-document navigation tears down audio; let the 80ms click finish, capped at 120ms.
    deadline = setTimeout(navigate, 120);
    void playback.then((started) => {
      if (pending !== navigate) return;
      if (started) soundTimer = setTimeout(navigate, 80);
      else navigate();
    });
  };
  document.addEventListener("click", onClick);
  return () => { document.removeEventListener("click", onClick); cancel(); };
}
