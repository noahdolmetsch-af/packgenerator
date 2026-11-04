// «Wegweiser statt Katalog» PR 12: «Good to know» per function (src/lib/wissen/), shown in «What you can do here».
import { describe, it, expect } from 'vitest';
import { WISSEN } from '../src/lib/wissen/index.js';
import { FEATURE } from '../src/lib/features.js';
import { ON_PAGES, pageContent } from '../src/lib/seiteninhalt.js';
import START_DE from '../src/lib/i18n/de/index.js';
// the tips' German loads with the card, not at the start (src/lib/wissen/texte-de.js, scripts/size-guard.mjs)
import DE from '../src/lib/wissen/texte-de.js';

describe('Good to know', () => {
  it('every text belongs to a function, is short and has German', () => {
    for (const [id, text] of Object.entries(WISSEN)) {
      expect(FEATURE[id], id).toBeTruthy();
      expect(text.length, id).toBeLessThanOrEqual(220);
      expect(DE[text] ?? START_DE[text], id).toBeTruthy(); // a function's own German file may hold its tip
    }
  });
  it('every function on a page with the card has its text there', () => {
    for (const p of ON_PAGES) {
      for (const r of pageContent(p, undefined, WISSEN)) {
        expect(r.know, `${r.id} on ${p}: add a text in src/lib/wissen/`).toBeTruthy();
        expect(r.know).toBe(WISSEN[r.id]);
      }
    }
  });
});
