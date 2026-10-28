// «332 Use Cases sichtbar machen» (Noah 24.10.2026 «1a 2b 3a 4 nein 5b»): every function of the catalogue
// has a home page, and the list of functions not yet visible there may only get shorter.
import { describe, it, expect } from 'vitest';
import { FEATURES } from '../src/lib/features.js';
import { HOME, GAPS, WHY } from '../src/lib/know/heimat.js';
import { WHEN } from '../src/lib/know/wann.js';
import { SPOT } from '../src/lib/know/spot.js';

// Measured 24.10.2026 on 0.181.4. Lower this number whenever a package makes functions visible;
// never raise it: a new function comes with a visible place on its home page.
// 263 after merging 0.182–0.186 (tennis page, yoga classes and good day came before this guard); 249 after «Alltag sichtbar»; 228 after «Touren sichtbar»;
// 233 after merging 0.187–0.189 and «Touren ohne Überraschung» part 2, built before this guard: dress rehearsal, good night,
// arrive well, «see the effect» and «pack by need» show only in their situation; 234: «History and progress» lives on each
// sport's page since «Aktiv neu» (0.187.0); 217 after «Live-Karte, Rennen und Packen sichtbar»; 206 after «Velos sichtbar»; 170 after «Ich, Werkzeuge und Berg sichtbar»; 165 after «Notizen sichtbar»; 161 after Material, Touren and Listen; 151 after «Aktiv sichtbar»; 147 after «Packen sichtbar 2»; 142 after «Unterwegs sichtbar»; 116 after «Namen überall» (names, Rückblick, Material and Touren links); 111 after Auswerten tiles, Abfahrt jumps and Webcams; 77 after «Noahs Liste sichtbar»; 57 after the 20 «deep» ones (names, short lines, Trello jump, a sport page and the rides page as home); 53 after ozone on Wetter, ice and wet chain on the push page, receipts in the workshop.
const MAX_GAPS = 49;

describe('home pages of the functions', () => {
  it('every function of the catalogue has a home page, and no home is left over', () => {
    const ids = FEATURES.map((f) => f.id);
    expect(ids.filter((id) => !HOME[id]), 'functions without a home in src/lib/know/heimat.js').toEqual([]);
    expect(Object.keys(HOME).filter((id) => !ids.includes(id)), 'homes of functions that no longer exist').toEqual([]);
    for (const [id, href] of Object.entries(HOME)) expect(href, id).toMatch(/^#\//);
  });

  it('the gaps name existing functions with a known why', () => {
    for (const [id, why] of Object.entries(GAPS)) {
      expect(HOME[id], id).toBeTruthy();
      expect(Object.keys(WHY), id).toContain(why);
    }
  });

  it('a function that shows only in its situation says when, in the catalogue (Noah 27.10.2026 «2a»)', () => {
    const when = Object.keys(GAPS).filter((id) => GAPS[id] === 'when').sort();
    expect(Object.keys(WHEN).sort()).toEqual(when);
    for (const id of when) expect(WHEN[id], id).toMatch(/\.$/);
  });

  it('a function inside a window or a fold has its spot, which the catalogue lights up (Noah 27.10.2026 «c»)', () => {
    expect(Object.keys(SPOT).sort()).toEqual(Object.keys(GAPS).filter((id) => GAPS[id] === 'spot').sort());
    for (const [id, steps] of Object.entries(SPOT)) for (const st of steps) expect(st.sel || st.text || st.aria, id).toBeTruthy();
  });

  it('the list of gaps only gets shorter', () => {
    expect(Object.keys(GAPS).length).toBeLessThanOrEqual(MAX_GAPS);
  });
});
