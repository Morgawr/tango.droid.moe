import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://tango.droid.moe',
  integrations: [tailwind({
    applyBaseStyles: false,
  })],
});
