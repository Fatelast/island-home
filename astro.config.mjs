// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

const site = process.env.SITE_URL;

// https://astro.build/config
export default defineConfig({
  ...(site ? { site } : {}),
  devToolbar: {
    enabled: false,
  },
  integrations: [react()],
  vite: {
    resolve: {
      noExternal: ['animal-island-ui'],
    },
  },
  i18n: {
    locales: ['zh-CN', 'en'],
    defaultLocale: 'zh-CN',
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
});
