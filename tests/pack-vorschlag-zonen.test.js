// «Dir fehlt» on #/pack/vorschlag (Gesamttest C10, 26.11.2026): the names of the missing layers and zones («Legs», «Hands», «Head», «Feet»)
// stood in English on the German page because the page printed row.name without t(). Every row of the onion check has a German name,
// and the page translates it.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import DE from '../src/lib/i18n/de/index.js';
import { ONION } from '../src/lib/wardrobe.js';

describe('Suggestion page: names of the missing pieces', () => {
  it('every row of the onion check has a German name', () => {
    for (const row of ONION) expect(DE[row.name], row.name).toBeTruthy();
  });
  it('the page translates the name of a gap', () => {
    const src = readFileSync(new URL('../src/pages/PackVorschlag.svelte', import.meta.url), 'utf8');
    expect(src).toContain('{t(g.name)}');
    expect(src).not.toContain('<span>{g.name}');
  });
});
