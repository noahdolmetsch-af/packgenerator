// Termine buchen (mockups BU2 + BU3, Noah 14.10.2026 «BU1–BU5 freigegeben»): the page the people who
// book open from Noah's link (…/buchen/#<offer>). Its own small entry: no app data, no service worker.
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '../app.css';
import { mount } from 'svelte';
import { lang, loadDe } from '../lib/i18n.svelte.js';

if (lang.v === 'de') await loadDe();
const { default: Book } = await import('./Book.svelte');
mount(Book, { target: document.getElementById('app') });
