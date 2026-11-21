// Wächter «Tote Adressen und doppelte Reiternamen» (Thread «App-Landkarte», Noah 21.11.2026 «a»):
// 1. Every address written out in the code (#/…) leads to a page. An unknown address does not fail: pageOf() falls back
//    to 'home', so the app quietly opens Heute and nobody notices (found: «#/velos» in the Weg zum Ziel).
// 2. Inside one place no two tabs or buttons under a tab carry the same German name for different pages (docs/namen.md:
//    one word per thing).
// The test reads the source as text: addresses written out in full, no template strings with a part still missing
// («#/tour/» + id is left alone). Both lists only get shorter.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pageOf, redirectOf, PLACE_TABS } from '../src/lib/nav.js';
import DE from '../src/lib/i18n/de/index.js';

const ROOT = new URL('../src', import.meta.url).pathname;

/** Written out in the code, but no real address: a word inside a sentence. Stay empty if possible. */
const NOT_ADDRESSES = [];

/** Names that two tabs of one place share on purpose or until the rename is decided: 'place: Name'. Only gets shorter. */
const KNOWN_SAME_NAME = ['analysis: Erkenntnisse'];

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

/** The text without comments (a comment may talk about «#/page»). */
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1').replace(/<!--[\s\S]*?-->/g, '');

// «#/…» written out in full, ended by a quote, «?» or «&»; «#/tour/» + id or «#/trip/${id}» does not end there
const ADDRESS = /['"`](#\/[\w\-/]*[\w-])(?=['"`?&])/g;

function addresses() {
  const found = new Map();
  for (const file of walk(ROOT)) {
    const text = stripComments(readFileSync(file, 'utf8'));
    for (const m of text.matchAll(ADDRESS)) {
      if (!found.has(m[1])) found.set(m[1], new Set());
      found.get(m[1]).add(file.slice(ROOT.length + 1));
    }
  }
  return found;
}

describe('every address in the code leads to a page (W1)', () => {
  const dead = [...addresses()]
    .filter(([h]) => h !== '#/' && pageOf(h) === 'home' && !redirectOf(h) && !NOT_ADDRESSES.includes(h))
    .map(([h, files]) => `${h}  (${[...files].join(', ')})`);

  it('has no dead address', () => {
    expect(dead, 'these open Heute without a word; write the real address').toEqual([]);
  });

  it('finds the addresses it should (a guard that reads nothing is no guard)', () => {
    const all = addresses();
    expect(all.size).toBeGreaterThan(200);
    expect(all.has('#/bikes')).toBe(true);
    expect(all.has('#/flow/rest')).toBe(true);
  });

  it('knows a dead address when it sees one', () => {
    expect(pageOf('#/velos')).toBe('home');
    expect(redirectOf('#/velos')).toBeNull();
    expect(pageOf('#/bikes')).toBe('bikes');
  });
});

describe('no tab name twice inside a place (W2)', () => {
  const de = (key) => DE[key] ?? key.replace(/\|[a-z]+$/, '');
  /** The names of the pages of a place: a tab with chips counts by its chips, a plain tab by itself. */
  const names = (place) => (PLACE_TABS[place] ?? []).flatMap((t) => (t.subs?.length ? t.subs : [t]).map((x) => ({ name: de(x.label), href: x.href })));
  const same = Object.keys(PLACE_TABS).flatMap((place) => {
    const list = names(place);
    return [...new Set(list.map((x) => x.name))]
      .filter((n) => new Set(list.filter((x) => x.name === n).map((x) => x.href)).size > 1)
      .map((n) => `${place}: ${n}`);
  });

  it('has no new double name', () => {
    expect(same.filter((x) => !KNOWN_SAME_NAME.includes(x)), 'rename one of them (docs/namen.md)').toEqual([]);
  });

  it('a listed double name that is gone leaves the list', () => {
    expect(KNOWN_SAME_NAME.filter((x) => !same.includes(x)), 'take these out of KNOWN_SAME_NAME').toEqual([]);
  });
});
