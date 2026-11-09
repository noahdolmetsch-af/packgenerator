// «Tour-Pfad» (Tour von A bis Z, Schritt 1): the words of the path (lib/tourpfad/saetze.js) over the rule (stand.js). Fictional data.
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { lang, loadDe } from '../src/lib/i18n.svelte.js';
import DE from '../src/lib/i18n/de/index.js';
import { tourStand, PHASES } from '../src/lib/tourpfad/stand.js';
import { rowWords, PHASE_TITLE, phaseCount, headLine } from '../src/lib/tourpfad/saetze.js';
import { addDays } from '../src/lib/phase.js';

const D0 = '2026-10-14';
const es = (n, packed = 0) => Array.from({ length: n }, (_, k) => ({ itemId: `i${k}`, slot: 'seat', qty: 1, packed: k < packed }));
const trip = (extra = {}) => ({ id: 'test_data_t1', title: 'test_data_ Jura', domain: 'bikepacking', bikeId: 'b1', startDate: addDays(D0, 10), days: 3, entries: es(32, 24), ready: [], status: 'planned', ...extra });
const NOT_GERMAN = /\b(the|and|your|not yet|packed|open)\b/i;

describe('Tour-Pfad: words', () => {
  beforeAll(loadDe);
  beforeEach(() => (lang.v = 'de'));
  afterEach(() => (lang.v = 'en'));
  const stand = tourStand(trip(), { today: D0 });
  const rows = stand.phases.flatMap((p) => p.rows);

  it('every row of the rule has a title and none falls back to its key', () => {
    for (const r of rows) {
      const w = rowWords(r);
      expect(w.title, r.key).toBeTruthy();
      expect(w.title, r.key).not.toBe(r.key);
    }
  });
  it('packing says how far it is, in German', () => {
    const w = rowWords(rows.find((r) => r.key === 'packen'));
    expect(w.line).toContain('24');
    expect(w.line).toContain('32');
    expect(w.line).toMatch(/gepackt/);
  });
  it('a row without data says what to do, not that it is fine', () => {
    for (const key of ['koerper', 'velo']) {
      const r = rows.find((x) => x.key === key);
      expect(r.state, key).toBe('open');
      expect(rowWords(r).line, key).toMatch(/Sieh dir/);
    }
  });
  it('the four phases have German titles and a head line', () => {
    expect(Object.keys(PHASE_TITLE())).toEqual(PHASES);
    expect(Object.values(PHASE_TITLE())).toEqual(['Planen', 'Vorbereiten', 'Unterwegs', 'Danach']);
    expect(headLine(stand)).toBe('Schritt 2 von 4 · Vorbereiten');
    expect(headLine(tourStand(trip(), { today: addDays(D0, 14), debriefDone: true }))).toMatch(/Fertig/);
    expect(headLine(tourStand(trip({ skipped: true }), { today: D0 }))).toMatch(/fällt aus/);
  });
  it('the count of a phase', () => {
    expect(phaseCount({ done: 3, total: 5 })).toBe('3 von 5');
    expect(phaseCount({ done: 0, total: 0 })).toBe('');
  });
  it('no line shows an English word in the German UI', () => {
    for (const r of rows) {
      const w = rowWords(r);
      expect(`${w.title} ${w.line}`, r.key).not.toMatch(NOT_GERMAN);
    }
  });
  it('the German list has every text of the page', () => {
    for (const k of ['Tour path', 'Go on with {title}', 'Planning|phase', 'Preparing', 'Afterwards']) expect(DE[k], k).toBeTruthy();
  });
});
