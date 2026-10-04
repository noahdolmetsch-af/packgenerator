import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { db } from './lib/db.js';
import { tidyData } from './lib/tidy.js';

// Svelte renders the App component into <div id="app"> in index.html.
mount(App, { target: document.getElementById('app') });

// Ask the browser to keep our data even when the device runs low on space.
// Without this, a browser may delete website data it considers unimportant.
navigator.storage?.persist?.();

// One-time fixes for older data (brand/model split, bag list and bike setups).
tidyData(db).catch((err) => console.warn('tidyData', err));
