export function mountAiAppLinks(root: HTMLElement) {
  let cancelPending = () => {};
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (/Mac/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

  root.querySelectorAll<HTMLAnchorElement>("[data-ai-app]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (mobile && link.hasAttribute("data-ai-desktop-only")) return;
      event.preventDefault();
      cancelPending();

      const stop = () => {
        clearTimeout(timer);
        window.removeEventListener("blur", stop);
        window.removeEventListener("pagehide", stop);
        document.removeEventListener("visibilitychange", onVisibility);
        cancelPending = () => {};
      };
      const onVisibility = () => { if (document.hidden) stop(); };
      const web = () => { stop(); window.location.assign(link.href); };
      // shortcut: focus loss cannot prove app launch; replace this heuristic when providers offer HTTPS app handoff.
      const timer = setTimeout(() => {
        if (!document.hidden && document.hasFocus()) web();
        else stop();
      }, 2000);
      cancelPending = stop;
      window.addEventListener("blur", stop);
      window.addEventListener("pagehide", stop);
      document.addEventListener("visibilitychange", onVisibility);
      try { window.location.assign(link.dataset.aiApp!); }
      catch { web(); }
    });
  });
}
