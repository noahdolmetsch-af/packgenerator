import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { db } from './lib/db.js';
import { tidyBrands } from './lib/brand.js';

// Svelte renders the App component into <div id="app"> in index.html.
mount(App, { target: document.getElementById('app') });

// Ask the browser to keep our data even when the device runs low on space.
// Without this, a browser may delete website data it considers unimportant.
navigator.storage?.persist?.();

// Older imports keep brand and model in one field; split them once.
tidyBrands(db).catch(() => {});
