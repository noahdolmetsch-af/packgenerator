// Helper of the Wege-Wächter: every address «#/…» written out in the code (same reading as tests/links.test.js),
// without pages for people who have no app (shared list, card, sign-up, pay link, shop link). Sorted, so a run is the same each time.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../../src', import.meta.url).pathname;
const GUEST = /^#\/(share|karte|mitmachen|gruppe|spur-link|zahlen|laden)\//;
const ADDRESS = /['"`](#\/[\w\-/]*[\w-])(?=['"`?&])/g;

const walk = (dir, out = []) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      if (/[\\/]i18n$/.test(p)) continue; // German texts
      walk(p, out);
    } else if (/\.(svelte|js)$/.test(f)) out.push(p);
  }
  return out;
};
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1').replace(/<!--[\s\S]*?-->/g, '');

/** The addresses to open, sorted. */
export function adressen() {
  const found = new Set();
  for (const file of walk(ROOT)) for (const m of stripComments(readFileSync(file, 'utf8')).matchAll(ADDRESS)) found.add(m[1]);
  return [...found].filter((h) => h !== '#/' && !GUEST.test(h)).sort();
}
