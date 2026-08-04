# Portfolio Site Template

A small personal portfolio built with [Astro](https://astro.build), Tailwind CSS 4, and [Motion](https://motion.dev). Your stuff lives in little folders — travel photos, projects, writing — that open up into full collections.

> [!NOTE]
> This is an experiment. There are a lot of edge cases where it's not perfect, so expecta lot of rough edges. I have not tested this on phones, just made this, thought it looked good and deployed. If anyone wants to polish this - send a pr.

## Deploy

Deploy to Cloudflare Workers from your machine:

```sh
pnpm install
pnpm run deploy
```

## Getting Started

```sh
pnpm install
pnpm dev
```

The site runs at `localhost:4321`.

## Make It Yours

- **`src/data/collections.ts`** — the folders on the homepage and everything inside them. Items can be images, project logos with labels, or short notes.
- **`src/components/About.astro`** — your name, photo, and intro.
- **`src/layouts/Layout.astro`** — page title, meta, and global chrome.

## Commands

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `pnpm install`    | Install dependencies                         |
| `pnpm dev`        | Start local dev server at `localhost:4321`   |
| `pnpm build`      | Build the production site to `./dist/`       |
| `pnpm preview`    | Preview the build locally before deploying   |
| `pnpm run deploy` | Build and deploy to Cloudflare Workers       |

## License

MIT
