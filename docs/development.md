# Development and verification

Use Node 22 and the pnpm version in `package.json`.

```sh
pnpm exec astro dev --background
```

Use `pnpm exec astro dev status`, `pnpm exec astro dev logs`, and `pnpm exec astro dev stop` to manage the server.

Run the repository checks from a fresh checkout or during development:

```sh
pnpm verify
```

This checks Vite cache isolation, builds the site once, typechecks, and runs the `scripts/check-*.mjs` checks under Node's test runner. The checks that read `dist/` start after the build finishes. If the development optimizer has already run, verification also checks that the build preserved every existing cached development JavaScript file.

For runtime checks, use `pnpm preview` to serve the Astro build or `pnpm exec wrangler dev` to serve the same build through the Cloudflare Worker. Use the Worker for the Engineering Radio feed, GitHub contribution API, and other Worker routes. See [local Worker configuration](../README.md#deploy).

## Development dependency cache

Keep the `isolate-vite-cache` plugin in `astro.config.mjs`. Astro's production prerender starts a Vite server too, so development, production prerender, and build must have separate optimizer directories. The plugin keys Vite's cache by both command and mode.

The previous shared `node_modules/.vite/deps` directory allowed production optimization to replace files used by the active development server. Its already-transformed imports and the browser's immutable dependency cache could then retain an older graph. React's development and production runtimes became mixed: `Invalid hook call` and `_jsxDEV is not a function` appeared, and React cleared the server-rendered introduction, tool icons, and chat during hydration.

Do not move or delete the cache directory while its development server is running. Clearing it can temporarily hide this problem but leaves existing transformed imports and browser cache entries pointing at a different dependency graph.

Run the cache diagnostic by itself when investigating the optimizer:

```sh
node scripts/check-vite-cache.mjs
```

The diagnostic resolves the three Vite configurations and requires distinct directories. With a warm development cache it also builds and compares the cached JavaScript files byte for byte. With a cold cache it checks the directory configuration. `pnpm verify` uses the diagnostic's `--build` option to create fresh build artifacts in both cases.

After configuration changes, check the actual browser after hydration: the introduction and tool icons must remain present, and Say hi must open the chat. Repeat after a production build and a warm dev-server restart. An HTTP 200 or successful server-rendered HTML check alone does not catch a React island that clears itself after hydration.

Vite caching reference: https://vite.dev/guide/dep-pre-bundling.html
