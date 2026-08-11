import { folderPreviewUses } from "./uses";
import { musicTracks, type MusicTrack } from "./music";

/* Shape overrides for how an item hangs inside a folder. Sizes are % of the
   folder's width; `top` is how far down it's pushed. */
export type Shape = { w?: number; ratio?: string; top?: number };
type MusicPreview = Pick<MusicTrack, "slug" | "title" | "artist" | "previewUrl">;

export type CollectionItem =
  | string
  | ({ src: string; motion?: string; music?: MusicPreview } & Shape)
  | ({ logo: string; label?: string } & Shape)
  | ({ note: string; body?: string[] } & Shape);

export interface Collection {
  slug: string;
  title: string;
  meta: string;
  items: CollectionItem[];
  layout?: "carousel" | "uses" | "projects" | "music";
}

export const collections: Collection[] = [
  {
    slug: "what-i-use",
    title: "What I Use",
    meta: "Tools I use every day",
    layout: "uses",
    items: folderPreviewUses.map(({ logo, name }) => ({ logo, label: name })),
  },
  {
    slug: "projects",
    title: "Projects",
    meta: "2 shipped projects",
    layout: "projects",
    items: [
      {
        src: "/projects/huoban-cover.png",
        w: 38,
        ratio: "1200/630",
        top: 8,
      },
      {
        src: "/projects/gson-cover.png",
        w: 42,
        ratio: "1200/630",
        top: 4,
      },
    ],
  },
  {
    slug: "music",
    title: "Music",
    meta: `${musicTracks.length} tracks on repeat`,
    layout: "music",
    items: musicTracks.map((track) => ({
      src: track.artwork,
      motion: track.motionArtwork,
      music: {
        slug: track.slug,
        title: track.title,
        artist: track.artist,
        previewUrl: track.previewUrl,
      },
      w: 34,
      ratio: "1/1",
      top: 5,
    })),
  },
  {
    slug: "writing",
    title: "Writing",
    meta: "23 posts",
    items: [
      {
        note: "How tanstack start became my default framework",
        body: [
          "Personally I have always been picky about my tech stack, but I saw a tweet from Kitze stating - 'It doesn't matter anymore'",
          "As much as I disagreed with the statement, it's actually true.",
          "Nobody's writing code the way they used to, just throw something at your agent and let it figure out.",
          "But this meant everytime I made a new project - the stack was quite random",
          "I had to ground my agent with this little oss template I made - agent first.",
        ],
      },
      {
        note: "Shipping a side project in a weekend",
        body: [
          "The trick isn't working faster. It's deciding smaller. A weekend project survives on the ruthlessness of what you refuse to build.",
          "No auth, no settings page, no dark mode, no database if a JSON file will limp through. Every one of those is a weekend on its own, disguised as an afternoon.",
          "What you get in exchange is the thing that actually matters: something real in front of real people while you still care about it. Momentum compounds; polish can be retrofitted onto momentum, but momentum can't be retrofitted onto polish.",
        ],
      },
      {
        note: "The unreasonable effectiveness of boring CSS",
        body: [
          "Grid, custom properties, container queries, :has(). The platform quietly shipped almost everything we used to need tooling for, and it did it while nobody was updating their assumptions.",
          "The most maintainable stylesheets I've worked in lately are the most boring ones. Plain selectors, custom properties as the API, media queries doing what they were designed to do.",
          "Boring is a feature. Boring means the next person - including future you - reads it without a decoder ring.",
        ],
      },
      {
        note: "Notes on building for the edge",
        body: [
          "The mental model shift is small but real: your code doesn't live somewhere, it lives everywhere, and it starts cold in under a millisecond.",
          "That kills a whole category of pattern - the warm in-memory cache, the connection pool, the singleton that assumes it survives between requests - and replaces it with something honest: state lives in storage, compute is disposable.",
          "Once the model clicks, the constraint feels like a gift. Systems built this way have nothing to leak, nothing to drain, and nothing to restart at 3am.",
        ],
      },
    ],
  },
  {
    slug: "x-threads",
    title: "X Threads",
    meta: "Thoughts shared on X",
    items: [
      "https://picsum.photos/seed/delta/900/1200",
      "https://picsum.photos/seed/epsilon/1200/900",
      "https://picsum.photos/seed/zeta/1000/1000",
      "https://picsum.photos/seed/eta/1200/800",
      "https://picsum.photos/seed/theta/900/1200",
      "https://picsum.photos/seed/iota/1200/900",
    ],
  },
];

/* A stack of identically-shaped cards reads as a template. Cycling shapes and
   hanging them at different heights makes a folder look like real things stuffed
   into it. Photos vary the most; logos want to stay square and paper stays
   portrait, so those cycles only vary width and how far they're pushed in. */
const SHAPES = {
  photo: [
    { w: 31.28, ratio: "4/5", top: 5 },
    { w: 40.48, ratio: "4/3", top: 9 },
    { w: 34.04, ratio: "1/1", top: 4 },
    { w: 38.64, ratio: "3/2", top: 10 },
    { w: 29.44, ratio: "3/4", top: 6 },
  ],
  logo: [
    { w: 28.8, ratio: "1/1", top: 6 },
    { w: 32, ratio: "1/1", top: 10 },
    { w: 27.2, ratio: "1/1", top: 4 },
    { w: 30.4, ratio: "1/1", top: 12 },
  ],
  /* Pages, not cards: same-ish widths but genuinely different heights, like a
     sheaf of manuscripts rather than a template. */
  note: [
    { w: 33, ratio: "3/4.6", top: 3 },
    { w: 36, ratio: "3/3.8", top: 10 },
    { w: 32, ratio: "3/5", top: 1 },
    { w: 35, ratio: "3/4.2", top: 12 },
  ],
};

export type Card = ReturnType<typeof normalise>[number];

/** Resolves the loose authoring format into a kind plus a concrete shape. */
export function normalise(items: CollectionItem[]) {
  return items.map((item, i) => {
    const value = typeof item === "string" ? { src: item } : item;
    const kind = "logo" in value ? "logo" : "note" in value ? "note" : "photo";
    const cycle = SHAPES[kind];
    return { kind, ...cycle[i % cycle.length], ...value } as {
      kind: "photo" | "logo" | "note";
      w: number;
      ratio: string;
      top: number;
      src?: string;
      motion?: string;
      logo?: string;
      label?: string;
      note?: string;
      body?: string[];
      music?: MusicPreview;
    };
  });
}

export const findCollection = (slug: string) =>
  collections.find((c) => c.slug === slug);
