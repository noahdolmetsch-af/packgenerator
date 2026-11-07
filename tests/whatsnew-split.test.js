// Tempo «Was ist neu später laden» (Noah 05.11.2026 «a»): the start reads only the newest few versions in full and a short
// line for every version; the whole list and its German load with the pages that show it (src/lib/whatsnew-all.js).
// These tests keep the short lines in step with the full list and keep the archive out of the start.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { WHATS_NEW as NEU, NEWS_INDEX_ALL, pointCount, newerThan } from '../src/lib/whatsnew.js';
import { WHATS_NEW as ALL, DE_OLDER } from '../src/lib/whatsnew-full.js';
import { WHATS_NEW_ALT } from '../src/lib/whatsnew-alt.js';
import { ALT_INDEX } from '../src/lib/whatsnew-alt-index.js';
import { NEWS } from '../src/lib/news/index.gen.js';
import { NEWS_NEU, NEWS_INDEX } from '../src/lib/news/neu.gen.js';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const walk = (dir) =>
  readdirSync(new URL(dir, import.meta.url), { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(`${dir}${d.name}/`) : [`${dir}${d.name}`],
  );

describe('the short lines match the full list', () => {
  it('the hand-numbered index has one line per old version, same numbers', () => {
    expect(ALT_INDEX.map((i) => i.version)).toEqual(WHATS_NEW_ALT.map((e) => e.version));
    for (const [k, i] of ALT_INDEX.entries()) {
      const e = WHATS_NEW_ALT[k];
      expect(i.date, e.version).toBe(e.date);
      expect(i.np, e.version).toBe(e.points.length);
      expect(i.ns, e.version).toBe(e.small?.length ?? 0);
    }
  });
  it('the generated index covers every news file, newest first', () => {
    expect(NEWS_INDEX.length).toBe(NEWS.length);
    expect(NEWS_INDEX.map((i) => i.version)).toEqual(NEWS.map((e) => e.version));
  });
  it('the whole list is the news files plus the hand-numbered ones, in the order of the index', () => {
    expect(ALL.length).toBe(NEWS.length + WHATS_NEW_ALT.length);
    expect(ALL.map((e) => e.version)).toEqual(NEWS_INDEX_ALL.map((i) => i.version));
    expect(ALL.slice(0, NEU.length)).toEqual(NEU);
  });
  it('point counts of the short lines equal those of the entries', () => {
    for (const [k, e] of ALL.entries()) expect(pointCount(NEWS_INDEX_ALL[k]), e.version).toBe(e.points.length);
  });
});

describe('the start holds only the newest few', () => {
  it('WHATS_NEW at the start is the generated short list, not the whole one', () => {
    expect(NEU).toBe(NEWS_NEU);
    expect(NEU.length).toBeGreaterThan(0);
    expect(NEU.length).toBeLessThan(ALL.length);
  });
  it('newerThan works on the short lines and gives the same versions as the full list', () => {
    const from = ALL[Math.min(25, ALL.length - 1)].version;
    expect(newerThan(from).map((e) => e.version)).toEqual(newerThan(from, ALL).map((e) => e.version));
  });
  it('the German of the older versions comes with the list', () => {
    expect(Object.keys(DE_OLDER).length).toBeGreaterThan(1000);
  });
});

describe('only the pages of the list load the archive', () => {
  const FILES = walk('../src/').filter((f) => /\.(js|svelte)$/.test(f));
  const importers = (re) => FILES.filter((f) => new RegExp(re.source, 'm').test(readFileSync(new URL(f, import.meta.url), 'utf8')));
  it('whatsnew-all.js is imported by the list pages only', () => {
    const found = importers(/^\s*import .*from\s+['"][^'"]*whatsnew-all(\.js)?['"]/).map((f) => f.split('/').pop());
    expect(found.sort()).toEqual(['WasKommt.svelte', 'WasNeu.svelte', 'WhatsNew.svelte'].sort());
  });
  it('archiv.gen.js is imported only by whatsnew-full.js', () => {
    expect(importers(/^\s*import .*from\s+['"][^'"]*archiv\.gen(\.js)?['"]/).map((f) => f.split('/').pop())).toEqual(['whatsnew-full.js']);
  });
  it('the full index.gen.js is never imported by the app, only the generator writes it', () => {
    expect(importers(/^\s*import .*from\s+['"][^'"]*news\/index\.gen(\.js)?['"]/)).toEqual([]);
  });
  it('the start German file for the news stays small', () => {
    expect(read('../src/lib/i18n/de/whatsnew.js').length).toBeLessThan(40_000);
  });
});
