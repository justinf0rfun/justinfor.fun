type MusicTarget = HTMLElement & {
  dataset: DOMStringMap & {
    musicTrack?: string;
    previewUrl?: string;
  };
};

type ActivePreview = {
  target: MusicTarget;
  audio: HTMLAudioElement;
};

type PreviewPlayer = {
  audio: HTMLAudioElement;
  ready: Promise<void>;
};

const players = new Map<string, PreviewPlayer>();
const mountedTargets = new WeakSet<MusicTarget>();
const preloadRoots = new WeakSet<ParentNode>();
let active: ActivePreview | null = null;
let request = 0;

const getPlayer = (target: MusicTarget) => {
  const src = target.dataset.previewUrl;
  if (!src) return null;

  const cached = players.get(src);
  if (cached) return cached;

  const audio = new Audio();
  audio.loop = true;
  const ready = fetch(src, { credentials: "omit", mode: "cors" })
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to preload music preview: ${response.status}`);
      return response.blob();
    })
    .then((blob) => {
      audio.src = URL.createObjectURL(blob);
      audio.load();
    })
    .catch(() => {
      audio.preload = "auto";
      audio.src = src;
      audio.load();
    });

  const player = { audio, ready };
  players.set(src, player);
  return player;
};

const setState = (target: MusicTarget, state: "idle" | "loading" | "playing" | "blocked") => {
  target.dataset.musicState = state;
  const action = target.querySelector<HTMLButtonElement>("[data-music-action]");
  if (action) {
    const title = target.dataset.musicTitle ?? "track";
    action.setAttribute("aria-label", `${state === "playing" ? "Pause" : "Play"} ${title}`);
  }
};

const pause = (target = active?.target) => {
  if (!target || target !== active?.target) return;
  request += 1;
  active.audio.pause();
  setState(target, "idle");
};

export const pauseMusicPreviews = () => pause();

const play = async (target: MusicTarget) => {
  const slug = target.dataset.musicTrack;
  const player = getPlayer(target);
  if (!slug || !player) return;

  if (active && active.target !== target) pause(active.target);
  const currentRequest = ++request;
  active = { target, audio: player.audio };
  setState(target, "loading");

  try {
    await player.ready;
    if (currentRequest !== request || active?.target !== target) return;

    await player.audio.play();
    if (currentRequest !== request || active?.target !== target) {
      player.audio.pause();
      return;
    }
    setState(target, "playing");
  } catch {
    if (currentRequest === request && active?.target === target) setState(target, "blocked");
  }
};

const toggle = (target: MusicTarget) => {
  if (target === active?.target && !active.audio.paused) pause(target);
  else void play(target);
};

const preloadHomeFolder = (targets: MusicTarget[]) => {
  targets.forEach(getPlayer);
};

const preloadUpcomingTracks = (targets: MusicTarget[]) => {
  if (!("IntersectionObserver" in window)) {
    targets.slice(0, 2).forEach(getPlayer);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        getPlayer(entry.target as MusicTarget);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px 100% 0px" },
  );

  targets.forEach((target) => observer.observe(target));
};

export const mountMusicPreviews = (root: ParentNode = document) => {
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const targets = [...root.querySelectorAll<MusicTarget>("[data-music-track]")];

  targets.forEach((target) => {
    if (mountedTargets.has(target)) return;
    mountedTargets.add(target);
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

  if (preloadRoots.has(root)) return;
  preloadRoots.add(root);

  const folder = root.querySelector("[data-music-folder]");
  if (folder) {
    preloadHomeFolder(targets.filter((target) => target.closest("[data-music-folder]")));
  } else {
    preloadUpcomingTracks(targets);
  }
};

addEventListener("pagehide", () => pause());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
