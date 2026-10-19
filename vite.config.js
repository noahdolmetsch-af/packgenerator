import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
import { sizeGuard } from './scripts/size-guard.mjs';
import { viewportZoom } from './scripts/viewport-zoom.mjs';

// GitHub Pages serves the app from https://<user>.github.io/packgenerator/.
// A test link (a Vercel preview per pull request, or a Cloudflare Pages preview, so Noah can test
// before the merge) serves it from the root. Cloudflare Pages sets CF_PAGES=1 during its build.
const vercel = !!process.env.VERCEL || !!process.env.CF_PAGES;
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
  // «Grösse» (19.10.2026): vh and vw stay the screen size while the app is zoomed (scripts/viewport-zoom.mjs)
  css: { postcss: { plugins: [viewportZoom()] } },
  // Kleine Apps (Noah 14.10.2026): each small app is its own page …/apps/<key>/ with its own manifest
  // (public/apps/<key>/), so the phone installs it with its own icon; same bundle, same data.
  build: {
    rolldownOptions: {
      input: {
        main: 'index.html',
        meditation: 'apps/meditation/index.html',
        packliste: 'apps/packliste/index.html',
        velopflege: 'apps/velopflege/index.html',
        werkzeug: 'apps/werkzeug/index.html',
        // Termine buchen (BU2 + BU3): the page the people who book open, without the app
        buchen: 'buchen/index.html',
      },
      output: {
        // Tempo «Seiten später laden» (19.10.2026): pages load on their first visit (App.svelte PAGES), the rest
        // is split automatically. Only the icons go into one file, else each icon would be its own small file.
        codeSplitting: { groups: [{ name: 'icons', test: /node_modules[\\/]@lucide/ }] },
      },
    },
  },
  plugins: [
    svelte(),
    // Wächter: no JavaScript file over 3 MB (the offline store keeps up to 6 MiB per file)
    sizeGuard(),
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
            // Noah 19.10.2026 «2b»: a shared picture always goes to «Dokumente» (field "doc"); a TWINT screenshot
            // is chosen in Rechnungen instead («Choose a TWINT screenshot», QR6). P3b «Abgleich Handy–Computer»: a backup file (.json) shared to the app opens «Check import»
            files: [
              { name: 'ride', accept: ['.gpx', '.tcx', 'application/gpx+xml', 'application/vnd.garmin.tcx+xml', 'application/xml', 'text/xml'] },
              { name: 'backup', accept: ['.json', 'application/json'] },
              // Dokumente-PDF: photos and PDFs from the gallery or other apps go to «Dokumente» (field "doc")
              { name: 'doc', accept: ['image/jpeg', 'image/png', 'image/webp', 'image/*', 'application/pdf', '.pdf', '.jpg', '.jpeg', '.png'] },
            ],
          },
        },
      },
      workbox: {
        // Everything the app needs is stored on the device at install time.
        // v0.44.1 (AP22): the Latin fonts too (about 350 KB), else offline the app falls back to the system font.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}', '**/*-latin-*.woff2'],
        // v0.68.0: the one app bundle passed Workbox's default 2 MiB; without this it would not be stored
        // on the device and the app would not start offline. 4 MiB leaves room.
        // v0.135.0 «Paket 2» (Meditation, Timer, Training, Rechnungen): the bundle passed 4 MiB (about 4.4 MB);
        // 6 MiB keeps the app stored on the device and offline.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // v0.41.0: the small handler for the shared file (POST), loaded before Workbox's own routes.
        // Erinnerungen aufs Handy (Web-Push): show the messages of api/push.js and open the app on a tap.
        importScripts: ['share-target.js', 'push-sw.js'],
        // 19.10.2026: the server project «packgen» serves this app too; its service worker must never answer
        // /api/… (the Google and Strava logins come back to /api/…/callback and would land in the app instead).
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Paket L «Werkzeugkasten»: «Freistellen» loads its reader once from jsdelivr (the model itself is
            // kept by transformers.js in its own cache), «Bildformat» its HEIC reader; kept here so both work
            // offline afterwards.
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/(@huggingface\/transformers|onnxruntime-web|onnxruntime-common|heic2any)@/,
            handler: 'CacheFirst',
            options: { cacheName: 'pg-cutout-lib', expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            // Trail Journal fonts: cached after the first online visit.
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            // Paket J #161: the swisstopo map tiles you looked at stay for the mountains without the internet.
            urlPattern: /^https:\/\/wmts\.geo\.admin\.ch\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'swisstopo-tiles', expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 30 }, cacheableResponse: { statuses: [0, 200] } },
          },
          {
            // Paket S «Reise-Spur»: OpenStreetMap tiles seen once stay for the tour map offline (swisstopo: Paket J's «swisstopo-tiles»).
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'osm-tiles', expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 30 }, cacheableResponse: { statuses: [0, 200] } },
          },
          {
            // Paket L2 «Bilderkennung»: the recognition (MediaPipe script, WebAssembly, models; about 30 MB) is
            // NOT in the install-time cache; it is kept here after its first use, so it works offline after.
            urlPattern: /^https:\/\/(cdn\.jsdelivr\.net\/npm\/@mediapipe\/|storage\.googleapis\.com\/mediapipe-models\/)/,
            handler: 'CacheFirst',
            options: { cacheName: 'vision-models', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
    // Termine buchen (BU2 + BU3): the booking page is a plain web page for the people who book: no
    // manifest and no service worker (they should not install the app or get its offline files).
    {
      name: 'booking-page-plain',
      enforce: 'post',
      transformIndexHtml: {
        order: 'post',
        handler: (html) => (html.includes('<title>Termin buchen</title>') ? html.replace(/<link rel="manifest"[^>]*>/g, '').replace(/<script id="vite-plugin-pwa:register-sw"[^>]*><\/script>/g, '') : html),
      },
    },
    // Kleine Apps: a small app's page keeps only its own manifest (the PWA plugin adds the big app's one too).
    {
      name: 'mini-app-manifest',
      enforce: 'post',
      transformIndexHtml: {
        order: 'post',
        handler: (html) => (/apps\/[a-z]+\/manifest\.webmanifest/.test(html) ? html.replace(/<link rel="manifest" href="[^"]*\/manifest\.webmanifest">/g, (m) => (/apps\//.test(m) ? m : '')) : html),
      },
    },
  ],
});
