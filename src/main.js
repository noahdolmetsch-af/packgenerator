import { mount } from 'svelte';
// Keep the existing typefaces available offline and independent of Google Fonts.
// v0.30.1 (Noah B1): the full sets with their unicode ranges (before: only "latin", without a range),
// so letters like č, ł, ő, ș in an item name come from Fira Sans too instead of the phone's own font in
// the middle of the name. The browser only loads a set when a page uses one of its letters.
import '@fontsource/fira-sans/400.css';
import '@fontsource/fira-sans/500.css';
import '@fontsource/fira-sans/600.css';
import '@fontsource/fira-sans/700.css';
import '@fontsource/sofia-sans-extra-condensed/latin-600.css';
import '@fontsource/sofia-sans-extra-condensed/latin-700.css';
import '@fontsource/sofia-sans-extra-condensed/latin-800.css';
import '@fontsource/sofia-sans-extra-condensed/latin-900.css';
import './app.css';
import App from './App.svelte';
import { db } from './lib/db.js';
import { tidyData } from './lib/tidy.js';
import { applyClock } from './lib/demo.js';
import { trackChanges } from './lib/backup.js';
import { initTheme } from './lib/theme.svelte.js';

// v0.46.0 (Noah 4b, 5a): the colour world and light or dark, before the first paint of the app.
initTheme();

// Demo day: the app acts as if it were another day (only while a demo runs).
applyClock();

// v0.34.0 (L10): remember when the data last changed, so a backup file can say newer or older.
trackChanges(db);

// A pull-request preview (Vercel) says so on every page: it has its own, separate data.
if (__PREVIEW__) {
  const de = (() => { try { return localStorage.getItem('lang') === 'de'; } catch { return false; } })();
  const bar = document.createElement('div');
  bar.setAttribute('role', 'note');
  bar.textContent = de ? 'Vorschau zum Testen: eigene Daten, nicht deine echte App.' : 'Test preview: separate data, not your real app.';
  bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9999;padding:4px 12px calc(4px + env(safe-area-inset-bottom,0px));background:#7a5a00;color:#fff;font:600 13px/1.4 system-ui,sans-serif;text-align:center;pointer-events:none';
  document.body.appendChild(bar);
}

// Svelte renders the App component into <div id="app"> in index.html.
mount(App, { target: document.getElementById('app') });

// Ask the browser to keep our data even when the device runs low on space.
// Without this, a browser may delete website data it considers unimportant.
navigator.storage?.persist?.();

// One-time fixes for older data (brand/model split, bag list and bike setups).
tidyData(db).catch((err) => console.warn('tidyData', err));
