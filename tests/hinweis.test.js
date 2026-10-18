// Hinweistexte HT1–HT2 (Noah 14.10.2026 «HT1–HT2 freigegeben», «1a 2b 3a»): every hint has its German,
// three situations, and each jump names an element that a page of the app really has.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { HINTS, hintOf } from '../src/lib/hints.js';
import { PAGES, setHint, hintShown, infoOf } from '../src/lib/pageinfo.js';
import DE from '../src/lib/i18n/de/index.js';

const files = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : f.endsWith('.svelte') ? [join(dir, f)] : []));
const SOURCE = files('src').map((f) => readFileSync(f, 'utf8')).join('\n');

describe('the hint cards', () => {
  it('every hint: a lead of two sentences, three situations, German for every text', () => {
    for (const [page, h] of Object.entries(HINTS)) {
      expect(h.lead, page).toHaveLength(2);
      expect(h.uses, page).toHaveLength(3);
      for (const s of [...h.lead, ...h.uses.flatMap((u) => [u[1], u[2]]), ...h.jumps.map((j) => j[0])]) expect(DE[s], s).toBeTruthy();
    }
  });
  it('every jump goes to an id that a page has; every hinted place also has its tips (3a)', () => {
    for (const h of Object.values(HINTS)) for (const [, id] of h.jumps) expect(SOURCE.includes(`id="${id}"`), id).toBe(true);
    for (const page of Object.keys(HINTS)) expect(PAGES[page], page).toBeTruthy();
    expect(hintOf('home')).toBeNull(); // HN0: Home has no hint
  });
  it('× folds a card to the line, the line opens it again (1a), per page', () => {
    const off = setHint(undefined, 'care', false);
    expect(hintShown(undefined, 'care')).toBe(true);
    expect(hintShown(off, 'care')).toBe(false);
    expect(hintShown(off, 'gear')).toBe(true);
    expect(hintShown(setHint(off, 'care', true), 'care')).toBe(true);
    expect(infoOf({ hintOff: 'x' }).hintOff).toEqual({});
  });
});
