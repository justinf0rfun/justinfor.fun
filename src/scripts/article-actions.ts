import { animate, type AnimationPlaybackControlsWithThen } from "motion";
import { mountAiAppLinks } from "./ai-app-links";

export function mountArticleActions() {
  const actions = document.querySelector<HTMLElement>("[data-article-actions]");
  const dialog = document.querySelector<HTMLDialogElement>("[data-article-share]");
  const trigger = actions?.querySelector<HTMLButtonElement>("[data-article-share-open]");
  if (!actions || !dialog || !trigger) return;

  new ResizeObserver(() => {
    document.documentElement.style.setProperty("--article-actions-height", `${actions.offsetHeight}px`);
  }).observe(actions);

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const papers = dialog.querySelector<HTMLElement>("[data-share-papers]")!;
  const print = dialog.querySelector<HTMLElement>("[data-share-print]")!;
  const sheets = [...dialog.querySelectorAll<HTMLElement>("[data-share-sheet]")];
  let animations: AnimationPlaybackControlsWithThen[] = [];
  let closing = false;

  const stopAnimations = () => {
    animations.forEach((animation) => animation.stop());
    animations = [];
  };

  const openShare = () => {
    if (dialog.open) return;
    stopAnimations();
    dialog.showModal();
    const instant = reduced.matches;
    animations = [
      animate(dialog, { scale: [0.92, 1], opacity: [0, 1], y: [12, 0], filter: ["blur(4px)", "blur(0px)"] },
        instant ? { duration: 0 } : { type: "spring", duration: 0.42, bounce: 0.28 }),
      animate(papers, { opacity: [0, 1], y: [16, 0] },
        instant ? { duration: 0 } : { duration: 0.6, ease: [0.65, 0, 0.35, 1], delay: 0.14 }),
      ...sheets.map((sheet, index) => animate(sheet, {
        rotate: [0, index === 0 ? 2 : -2.5],
        x: [0, index === 0 ? 6 : -8],
        y: [0, index === 0 ? -5 : 3],
      }, instant ? { duration: 0 } : { duration: 0.6, ease: [0.65, 0, 0.35, 1], delay: 0.59 + index * 0.08 })),
      animate(print, { opacity: [0, 1], filter: ["blur(2px)", "blur(0px)"] },
        instant ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.5 }),
    ];
  };

  const closeShare = async () => {
    if (!dialog.open || closing) return;
    closing = true;
    stopAnimations();
    dialog.setAttribute("data-closing", "");
    const exit = animate(dialog, { opacity: 0, scale: 0.96, y: 8, filter: "blur(2px)" },
      { duration: reduced.matches ? 0 : 0.16, ease: [0.23, 1, 0.32, 1] });
    animations = [exit];
    await exit.finished;
    dialog.close();
    dialog.removeAttribute("data-closing");
    closing = false;
    trigger.focus({ preventScroll: true });
  };

  trigger.addEventListener("click", openShare);
  dialog.querySelector("[data-share-close]")?.addEventListener("click", () => void closeShare());
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); void closeShare(); });
  dialog.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const controls = [...dialog.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)")];
    const first = controls[0], last = controls.at(-1);
    if ((!event.shiftKey && document.activeElement === last) || (event.shiftKey && document.activeElement === first)) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus({ preventScroll: true });
    }
  });
  let backdropDown = false;
  const outsideDialog = (event: MouseEvent) => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  };
  dialog.addEventListener("pointerdown", (event) => { backdropDown = outsideDialog(event); });
  dialog.addEventListener("click", (event) => {
    if (backdropDown && outsideDialog(event)) void closeShare();
    backdropDown = false;
  });

  const ai = actions.querySelector<HTMLElement>("[data-article-ai]")!;
  const aiTrigger = ai.querySelector<HTMLButtonElement>("[data-article-ai-toggle]")!;
  const aiOptions = ai.querySelector<HTMLElement>("[data-article-ai-options]")!;
  mountAiAppLinks(aiOptions);
  let pinned = false;
  const setAi = (open: boolean) => {
    ai.toggleAttribute("data-open", open);
    aiTrigger.setAttribute("aria-expanded", String(open));
    aiOptions.inert = !open;
  };
  const closeAi = () => { pinned = false; setAi(false); };

  aiTrigger.addEventListener("click", () => { pinned = !pinned; setAi(pinned); });
  ai.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch" && matchMedia("(hover: hover) and (pointer: fine)").matches) setAi(true);
  });
  ai.addEventListener("pointerleave", () => {
    if (!pinned && !ai.contains(document.activeElement)) setAi(false);
  });
  ai.addEventListener("focusout", () => queueMicrotask(() => {
    if (!ai.contains(document.activeElement)) closeAi();
  }));
  document.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Node && !ai.contains(event.target)) closeAi();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !ai.hasAttribute("data-open")) return;
    if (ai.contains(document.activeElement)) aiTrigger.focus({ preventScroll: true });
    closeAi();
  });

  const markdown = actions.querySelector<HTMLTemplateElement>("[data-article-markdown]")!.content.textContent ?? "";
  const url = actions.dataset.articleUrl!;
  document.querySelectorAll<HTMLButtonElement>("[data-article-copy]").forEach((button) => {
    const status = button.closest("[data-copy-surface]")!.querySelector<HTMLElement>("[data-copy-status]")!;
    let reset: ReturnType<typeof setTimeout>;
    button.addEventListener("click", async () => {
      clearTimeout(reset);
      try {
        await navigator.clipboard.writeText(button.dataset.articleCopy === "link" ? url : markdown);
        button.setAttribute("data-copied", "");
        status.classList.add("sr-only");
        status.textContent = button.dataset.articleCopy === "link" ? "Link copied" : "Copied as Markdown";
      } catch {
        button.removeAttribute("data-copied");
        status.classList.remove("sr-only");
        status.textContent = "Couldn't copy. Please try again.";
      }
      reset = setTimeout(() => { button.removeAttribute("data-copied"); status.textContent = ""; status.classList.add("sr-only"); }, 2000);
    });
  });
}
