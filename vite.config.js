import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the app from https://<user>.github.io/packgenerator/
const base = '/packgenerator/';

import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  base,
  // Replaces __APP_VERSION__ in the code with the version from package.json.
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  // v0.21.0: Vitest runs the unit tests only; the browser test in tests/e2e runs with `npm run e2e`.
  test: { include: ['tests/*.test.js'] },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate', // a new version replaces the old one on the next start
      includeAssets: ['icons/*.svg', 'icons/*.png'],
      manifest: {
        name: 'Pack Generator',
        short_name: 'Pack',
        description: 'Gear inventory, packing and debriefs. Works offline.',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#D9DED4',
        theme_color: '#0F2E27',
        icons: [
          { src: 'icons/app-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/app-512.png', sizes: '512x512', type: 'image/png' },
        ],
        // Quick note (v0.19.3, answer 3a): long-press the app icon → "New note"; and Pack Generator
        // in the Android share sheet (text and links; a photo is added in the note itself).
        shortcuts: [{ name: 'New note', short_name: 'Note', url: `${base}#/inbox/new`, icons: [{ src: 'icons/app-192.png', sizes: '192x192' }] }],
        share_target: { action: base, method: 'GET', params: { title: 'title', text: 'text', url: 'url' } },
      },
      workbox: {
        // Everything the app needs is stored on the device at install time.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        runtimeCaching: [
          {
            // Trail Journal fonts: cached after the first online visit.
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
});
