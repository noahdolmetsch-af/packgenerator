// «Wegweiser statt Katalog» PR 4: «Next» after the debrief, «Fits here» on the saved debrief, «Good to know» on trip costs.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { passtHier } from '../src/lib/passthier.js';
import { FEATURE } from '../src/lib/features.js';
import { TOOLS } from '../src/lib/tools/tools.js';
import de from '../src/lib/i18n/de/wegweiser-rueckblick.js';

const between = readFileSync(new URL('../src/pages/Between.svelte', import.meta.url), 'utf8');

describe('Rückblick: the next step', () => {
  it('the saved debrief shows know-how, good decisions, meaning and the skill map', () => {
    expect(passtHier('debrief').map((f) => f.id)).toEqual(['f.knowhow', 'f.gooddecisions', 'f.meaning', 'f.skillmap']);
  });
  it('«Debrief finished» leads to «For next time» and trip costs', () => {
    const next = between.slice(between.indexOf('data-als-naechstes'), between.indexOf('data-section="back-home"'));
    for (const id of ['f.freinaechstes', 'f.tripcosts']) expect(next).toContain(`href="${FEATURE[id].href}"`);
  });
  it('trip costs says what is good to know, in German too', () => {
    const costs = TOOLS.find((x) => x.key === 'costs');
    expect(costs.know).toBeTruthy();
    expect(de[costs.know]).toBeTruthy();
  });
});
