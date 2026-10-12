import { mount } from 'svelte';
// Keep the typefaces available offline and independent of Google Fonts.
// v0.30.1 (Noah B1): the full sets with their unicode ranges (before: only "latin", without a range),
// so letters like č, ł, ő, ș in an item name come from the chosen font too instead of the phone's own font
// in the middle of the name. The browser only loads a set when a page uses one of its letters.
// v0.97.0 Design-Refresh R1 (G1 neu, Noah 11.10 23:10): one font for the whole app, chosen under
// Ich › Darstellung; Inter by default, the condensed title face is gone. The service worker keeps the
// latin files of all eight offline (vite.config.js).
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/fira-sans/400.css';
import '@fontsource/fira-sans/500.css';
import '@fontsource/fira-sans/600.css';
import '@fontsource/fira-sans/700.css';
import '@fontsource/source-sans-3/400.css';
import '@fontsource/source-sans-3/600.css';
import '@fontsource/source-sans-3/700.css';
import '@fontsource/nunito-sans/400.css';
import '@fontsource/nunito-sans/600.css';
import '@fontsource/nunito-sans/700.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import './app.css';
// v0.72.0 (D3a): the invisible 44 px tap area of the small buttons on a touch screen
import './lib/ui/touch.css';
import App from './App.svelte';
import { db } from './lib/db.js';
import { tidyData } from './lib/tidy.js';
import { settling } from './lib/settled.js';
import { applyClock } from './lib/demo.js';
import { trackChanges } from './lib/backup.js';
import { folderBackupSupported, watchForChanges } from './lib/folderBackup.js';
import { initTheme } from './lib/theme.svelte.js';
import { takeReturn, watchAutoFetch } from './lib/strava/client.svelte.js';

// v0.46.0 (Noah 4b, 5a): the colour world and light or dark, before the first paint of the app.
// v0.97.0: also the font and the text size (Ich › Darstellung).
initTheme();

// Demo day: the app acts as if it were another day (only while a demo runs).
applyClock();

// v0.34.0 (L10): remember when the data last changed, so a backup file can say newer or older.
trackChanges(db);

// v0.94.0 «Kachel-Wand»: the automatic backup into a chosen folder watches from the start, on every
// page (before, «Your data» on Today started it; it lives under Me now).
if (folderBackupSupported) watchForChanges(db, null);

// A pull-request preview (Vercel) says so on every page: it has its own, separate data.
if (__PREVIEW__) {
  const de = (() => { try { return localStorage.getItem('lang') === 'de'; } catch { return false; } })();
  const bar = document.createElement('div');
  bar.setAttribute('role', 'note');
  bar.textContent = de ? 'Vorschau zum Testen: eigene Daten, nicht deine echte App.' : 'Test preview: separate data, not your real app.';
  bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9999;padding:4px 12px calc(4px + env(safe-area-inset-bottom,0px));background:#7a5a00;color:#fff;font:600 13px/1.4 system-ui,sans-serif;text-align:center;pointer-events:none';
  document.body.appendChild(bar);
}

// v0.115.0 «Strava-Verbindung»: back from the Strava login, the address carries this device's key once
// (#…&strava=connected&key=…): stored in localStorage and taken out of the address before the app reads it.
takeReturn();
window.addEventListener('hashchange', () => takeReturn());

// Svelte renders the App component into <div id="app"> in index.html.
mount(App, { target: document.getElementById('app') });

// Ask the browser to keep our data even when the device runs low on space.
// Without this, a browser may delete website data it considers unimportant.
navigator.storage?.persist?.();

// One-time fixes for older data (brand/model split, bag list and bike setups).
settling(() => tidyData(db))
  .catch((err) => console.warn('tidyData', err))
  // v0.115.0 (decision 1a): fetch new rides from Strava when the app opens or comes back, at most every
  // 15 minutes, only on a device with a Strava key and «Automatisch beim Öffnen» on.
  .finally(() => watchAutoFetch());
