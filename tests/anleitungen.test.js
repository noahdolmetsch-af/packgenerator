// «Anleitungen überall» (Noah 19.10.2026): a short guide on every page where you could get lost. Each guide
// is an «Einstieg» (AreaIntro) that starts as one line, all words in German, and each page really shows it.
import { describe, it, expect } from 'vitest';
import { GUIDE_INTROS, GUIDE_TIPS, GUIDE_LATER } from '../src/lib/guides.js';
import { INTROS } from '../src/lib/intro.js';
import { PAGES } from '../src/lib/pageinfo.js';
import DE from '../src/lib/i18n/de/index.js';

const pages = import.meta.glob('../src/pages/**/*.svelte', { eager: true, query: '?raw', import: 'default' });
const used = new Set(Object.values(pages).flatMap((src) => [...src.matchAll(/<AreaIntro place="([a-z]+)"/g)].map((m) => m[1])));

describe('the guides', () => {
  it('join the Einstieg and the tips without replacing one that was there', () => {
    for (const k of Object.keys(GUIDE_INTROS)) {
      expect(INTROS[k], k).toBe(GUIDE_INTROS[k]);
      expect(PAGES[k], k).toBe(GUIDE_TIPS[k]);
    }
    expect(Object.keys(GUIDE_TIPS).sort()).toEqual(Object.keys(GUIDE_INTROS).sort());
  });
  it('keep the page calm: one line first, three steps, three tips, a page below a place', () => {
    for (const [k, x] of Object.entries(GUIDE_INTROS)) {
      expect(x.folded, k).toBe(true);
      expect(x.page, k).toBe(true);
      expect(x.things, k).toHaveLength(3);
      expect(GUIDE_TIPS[k].tips.length, k).toBeGreaterThanOrEqual(3);
    }
  });
  it('speak German everywhere', () => {
    for (const [k, x] of Object.entries(GUIDE_INTROS)) {
      for (const s of [x.name, x.title, x.expect, ...x.things.flatMap((y) => [y.title, y.text])]) expect(DE[s], `${k}: ${s}`).toBeTruthy();
      for (const tip of GUIDE_TIPS[k].tips) for (const s of [tip.text, tip.button, tip.source].filter(Boolean)) expect(DE[s], `${k}: ${s}`).toBeTruthy();
    }
  });
  it('have unique tip ids', () => {
    const ids = Object.values(PAGES).flatMap((p) => p.tips.map((x) => x.id));
    for (const p of Object.values(GUIDE_TIPS)) for (const x of p.tips) expect(ids.filter((y) => y === x.id), x.id).toHaveLength(1);
  });
  it('show on their page; the pages of Paket 2/3 add the line on their own branch', () => {
    for (const k of Object.keys(GUIDE_INTROS)) if (!GUIDE_LATER.includes(k)) expect(used.has(k), k).toBe(true);
  });
});
