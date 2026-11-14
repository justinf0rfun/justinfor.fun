// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import icon from 'astro-icon';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  redirects: {
    '/writing': '/thoughts',
    '/writing/[slug]': '/thoughts/[slug]'
  },

  vite: {
    plugins: [tailwindcss()],
    // ElasticSticker loads on scroll; optimize Three before the first lazy import.
    optimizeDeps: { include: ['three'] }
  },

  integrations: [icon(), react()]
});
