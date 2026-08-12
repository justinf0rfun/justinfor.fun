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

The homepage contribution calendar reads GitHub data through the Worker. Add a
`GITHUB_TOKEN` secret to the `justinfor-fun` Worker before deploying. The token
is never sent to the browser. Wrangler provisions the KV namespace declared in
`wrangler.jsonc`, and the included Cron Trigger refreshes it daily at 00:17 UTC.

For local Worker development, place the token in an ignored `.dev.vars` file:

```ini
GITHUB_TOKEN=github_pat_...
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
