import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the app from https://<user>.github.io/packgenerator/.
// A Vercel preview (one per pull request, so Noah can test before he merges) serves it from the root.
const vercel = !!process.env.VERCEL;
const base = vercel ? '/' : '/packgenerator/';

import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  base,
  preview: { host: "127.0.0.1" },
  server: { host: "0.0.0.0", allowedHosts: ["terminal.local"] },
  // Replaces __APP_VERSION__ in the code with the version from package.json.
  define: { __APP_VERSION__: JSON.stringify(pkg.version), __PREVIEW__: JSON.stringify(vercel) },
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
        // v0.41.0 (Noah 5): a GPX file shared from another app ("Teilen an Pack Generator") opens the
        // ride upload. A file needs POST with multipart/form-data; the service worker answers that POST
        // (public/share-target.js): a file goes to #/debrief/ride/shared, text and links still go to
        // the Inbox quick note as ?title=…&text=…&url=… (the GET of v0.19.3).
        share_target: {
          action: `${base}share-target`,
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [{ name: 'ride', accept: ['.gpx', '.tcx', 'application/gpx+xml', 'application/vnd.garmin.tcx+xml', 'application/xml', 'text/xml'] }],
          },
        },
      },
      workbox: {
        // Everything the app needs is stored on the device at install time.
        // v0.44.1 (AP22): the Latin fonts too (about 350 KB), else offline the app falls back to the system font.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}', '**/*-latin-*.woff2'],
        // v0.41.0: the small handler for the shared file (POST), loaded before Workbox's own routes.
        importScripts: ['share-target.js'],
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
