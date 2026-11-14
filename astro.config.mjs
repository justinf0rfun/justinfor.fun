// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import icon from 'astro-icon';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://justinfor.fun',
  redirects: {
    '/writing': '/thoughts',
    '/writing/[slug]': '/thoughts/[slug]'
  },

  vite: {
    plugins: [tailwindcss(), {
      name: 'isolate-vite-cache',
      // Astro prerender starts a production Vite server; keep it away from live dev dependencies.
      config: (_, { command, mode }) => ({ cacheDir: `node_modules/.vite/${command}-${mode}` })
    }],
    // ElasticSticker loads on scroll; optimize Three before the first lazy import.
    optimizeDeps: { include: ['three'] }
  },

  integrations: [icon(), react()]
});
