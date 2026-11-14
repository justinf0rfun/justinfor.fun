# Development dependency cache

Keep the `isolate-vite-cache` plugin in `astro.config.mjs`. Astro's production prerender starts a Vite server too, so development, production prerender, and build must have separate optimizer directories. The plugin keys Vite's cache by both command and mode.

The previous shared `node_modules/.vite/deps` directory allowed production optimization to replace files used by the active development server. Its already-transformed imports and the browser's immutable dependency cache could then retain an older graph. React's development and production runtimes became mixed: `Invalid hook call` and `_jsxDEV is not a function` appeared, and React cleared the server-rendered introduction, tool icons, and chat during hydration.

Do not move or delete the cache directory while its development server is running. Clearing it can temporarily hide this problem but leaves existing transformed imports and browser cache entries pointing at a different dependency graph.

With Node 22:

```sh
node scripts/check-vite-cache.mjs
pnpm exec tsc --noEmit
```

The cache check resolves the three Vite configurations and requires distinct directories. If a development cache exists, it also runs a production build and verifies that every existing development JavaScript dependency remains byte-for-byte unchanged. This can run while the dev server is active.

After configuration changes, check the actual browser after hydration: the introduction and tool icons must remain present, and Say hi must open the chat. Repeat after a production build and a warm dev-server restart. An HTTP 200 or successful server-rendered HTML check alone does not catch a React island that clears itself after hydration.

Vite caching reference: https://vite.dev/guide/dep-pre-bundling.html
