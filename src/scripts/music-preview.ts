type MusicTarget = HTMLElement & {
  dataset: DOMStringMap & {
    musicTrack?: string;
    previewUrl?: string;
  };
};

const audio = new Audio();
audio.loop = true;
audio.preload = "none";

const positions = new Map<string, number>();
let active: MusicTarget | null = null;
let request = 0;

const setState = (target: MusicTarget, state: "idle" | "loading" | "playing" | "blocked") => {
  target.dataset.musicState = state;
  const action = target.querySelector<HTMLButtonElement>("[data-music-action]");
  if (action) {
    const title = target.dataset.musicTitle ?? "track";
    action.setAttribute("aria-label", `${state === "playing" ? "Pause" : "Play"} ${title}`);
  }
};

const pause = (target = active) => {
  if (!target || target !== active) return;
  request += 1;
  const slug = target.dataset.musicTrack;
  if (slug && Number.isFinite(audio.currentTime)) positions.set(slug, audio.currentTime);
  audio.pause();
  setState(target, "idle");
};

const play = async (target: MusicTarget) => {
  const slug = target.dataset.musicTrack;
  const src = target.dataset.previewUrl;
  if (!slug || !src) return;

  if (active && active !== target) pause(active);
  const currentRequest = ++request;
  active = target;
  setState(target, "loading");

  if (audio.src !== src) {
    audio.src = src;
    audio.load();
    const savedPosition = positions.get(slug) ?? 0;
    if (savedPosition > 0) {
      audio.addEventListener(
        "loadedmetadata",
        () => {
          if (active === target) audio.currentTime = Math.min(savedPosition, audio.duration || savedPosition);
        },
        { once: true },
      );
    }
  }

  try {
    await audio.play();
    if (currentRequest !== request || active !== target) {
      audio.pause();
      return;
    }
    setState(target, "playing");
  } catch {
    if (currentRequest === request && active === target) setState(target, "blocked");
  }
};

const toggle = (target: MusicTarget) => {
  if (target === active && !audio.paused) pause(target);
  else void play(target);
};

export const mountMusicPreviews = (root: ParentNode = document) => {
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");

  root.querySelectorAll<MusicTarget>("[data-music-track]").forEach((target) => {
    target.dataset.musicState = "idle";

    target.addEventListener("pointerenter", () => {
      if (finePointer.matches) void play(target);
    });

    target.addEventListener("pointerleave", () => {
      if (finePointer.matches) pause(target);
    });

    target.querySelector<HTMLElement>("[data-music-action]")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggle(target);
    });
  });

  root.querySelectorAll<HTMLElement>("[data-music-folder]").forEach((folder) => {
    folder.addEventListener("click", (event) => {
      const target = (event.target as HTMLElement).closest<MusicTarget>("[data-music-track]");
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      toggle(target);
    });
  });
};

addEventListener("pagehide", () => pause());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
