import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import cloudflare from "@astrojs/cloudflare";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://astro.build/config
export default defineConfig({
  site: 'https://utongstart.co.kr',
  output: 'hybrid',
  adapter: cloudflare({
    platformProxy: { enabled: true }
  }),
  image: {
    service: {
      entrypoint: 'astro/assets/services/noop'
    }
  },
  integrations: [
    tailwind(),
    react(),
    mdx()
  ],
  vite: {
    plugins: [
      nodePolyfills(),
    ],
    ssr: {
      external: ['node:buffer']
    }
  }
});