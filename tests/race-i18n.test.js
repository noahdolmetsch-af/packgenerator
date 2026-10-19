// Paket U «Rennen»: every text of the race pages has a German entry with the same {placeholders}.
// Reads the t('…') / tn(…) literals, the explanation attributes (what/why/from) and the label fields of
// the race libs straight from the source, so a new text without German fails here.
import { describe, it, expect } from 'vitest';
import de from '../src/lib/i18n/de/index.js';
import { PARTS } from '../src/lib/race/parts.js';
import { ASSUMPTIONS, ASSUME_GROUPS, OWN_KINDS, WAYS } from '../src/lib/race/strategy.js';
import { CASES } from '../src/lib/race/overview.js';
import { SAMPLE_TASKS } from '../src/lib/race/sample.js';
import { TOURS, TOUR_NAMES } from '../src/lib/tour.js';

const src = import.meta.glob(['../src/lib/race/**/*.{svelte,js}', '../src/pages/Race.svelte'], { eager: true, query: '?raw', import: 'default' });
const ph = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

function keysOf(text) {
  const out = new Set();
  const lit = `'((?:[^'\\\\]|\\\\.)*)'`;
  for (const m of text.matchAll(new RegExp(`\\bt\\(\\s*${lit}`, 'g'))) out.add(m[1]);
  for (const m of text.matchAll(new RegExp(`\\btn\\([^,]+,\\s*${lit}\\s*,\\s*${lit}`, 'g'))) (out.add(m[1]), out.add(m[2]));
  for (const m of text.matchAll(/\b(?:what|why|from)="([^"]+)"/g)) out.add(m[1]);
  return [...out].map((k) => k.replace(/\\'/g, "'"));
}

describe('race pages in German', () => {
  it('every t() text of the race files has a German entry with the same placeholders', () => {
    const missing = [];
    for (const [file, text] of Object.entries(src)) {
      for (const k of keysOf(text)) {
        if (!(k in de)) missing.push(`${file.split('/').pop()}: ${k}`);
        else if (ph(k) !== ph(de[k])) missing.push(`${file.split('/').pop()}: placeholders of ${k}`);
      }
    }
    expect(missing).toEqual([]);
  });
  it('the labels of the race libs are in German', () => {
    const labels = [
      ...PARTS.flatMap((p) => [p.title, p.sub]),
      ...ASSUMPTIONS.map((a) => a.name),
      ...ASSUME_GROUPS.map((g) => g.name),
      ...OWN_KINDS.map((k) => k.name),
      ...WAYS.map((w) => w.name),
      ...CASES.map((c) => c.title),
      ...SAMPLE_TASKS.map((x) => x.text),
      'yours', 'your loaded rides', 'your rides', 'standard',
      TOUR_NAMES.race,
      ...TOURS.race.flatMap((s) => [s.title, s.text]),
    ];
    expect(labels.filter((k) => !de[k])).toEqual([]);
  });
});
