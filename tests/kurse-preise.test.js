import { describe, it, expect } from 'vitest';
import { preiseChf, ladeJournalPreise, titelText, schlussAm, ladeTitelReihe } from '../src/lib/kurse/preise.js';
import { standardJournal, neuesDepot, neuerEintrag } from '../src/lib/kurse/journal.js';

const reihe = (id, currency, close, extra = {}) => ({ id, currency, last: { day: '2026-11-20', close }, points: [['2026-11-20', close]], ...extra });
// gold 2000 dollars an ounce, dollar 0.8 francs: about 51 440 francs a kilogram
const reihen = { gold: reihe('gold', 'USD', 2000), usdchf: reihe('usdchf', 'CHF', 0.8), 'y:NESN.SW': reihe('y:NESN.SW', 'CHF', 90, { name: 'Nestlé' }), 'y:AAPL': reihe('y:AAPL', 'USD', 200) };

describe('prices of a journal', () => {
  it('gives francs per gram for gold and francs per piece for titles in any currency', () => {
    const p = preiseChf(['gold', 'NESN.SW', 'AAPL'], reihen);
    expect(p.gold).toBeGreaterThan(50);
    expect(p.gold).toBeLessThan(53);
    expect(p['NESN.SW']).toBe(90);
    expect(p.AAPL).toBeCloseTo(160, 6);
  });
  it('says null where the series or the rate is missing (nothing is guessed)', () => {
    const p = preiseChf(['gold', 'NESN.SW', 'ROG.SW', 'SAP.DE'], { gold: reihen.gold, 'y:SAP.DE': reihe('y:SAP.DE', 'EUR', 100) });
    expect(p.gold).toBeNull(); // no dollar rate
    expect(p['NESN.SW']).toBeNull();
    expect(p['ROG.SW']).toBeNull();
    expect(p['SAP.DE']).toBeNull(); // no euro rate
  });
  it('fetches only the symbols of the entries, and the rates they need', async () => {
    let s = neuesDepot(standardJournal(), { name: 'D' }, 'd').state;
    s = neuerEintrag(s, 'd', { art: 'kauf', titel: 'aapl', tag: '2025-01-02', menge: 1, preis: 1 }, 'e1').state;
    s = neuerEintrag(s, 'd', { art: 'kauf', titel: 'gold', tag: '2025-01-02', menge: 1, preis: 1 }, 'e2').state;
    const asked = [];
    const lade = async (id) => (asked.push(id), reihe(id, id === 'y:AAPL' ? 'USD' : 'CHF', 1));
    const next = await ladeJournalPreise(s, { gold: reihen.gold, usdchf: reihen.usdchf }, { lade });
    expect(asked).toEqual(['y:AAPL']); // gold and the dollar rate are the page's own
    expect(next['y:AAPL']).toBeTruthy();
  });
  it('names a title', () => {
    expect(titelText('gold', reihen, (v) => `[${v}]`)).toBe('[Gold]');
    expect(titelText('NESN.SW', reihen)).toBe('Nestlé');
    expect(titelText('ROG.SW', reihen)).toBe('ROG.SW');
  });
});

describe('the close of a day', () => {
  const serie = (id, currency, points, extra = {}) => ({ id, currency, last: { day: points.at(-1)[0], close: points.at(-1)[1] }, points, ...extra });
  const r = {
    // Friday 2026-10-30 and Monday 2026-11-02; the dollar was 0.80 on Friday and 0.90 on Monday
    'y:AAPL': serie('y:AAPL', 'USD', [['2026-10-29', 190], ['2026-10-30', 200], ['2026-11-02', 210]]),
    usdchf: serie('usdchf', 'CHF', [['2026-10-30', 0.8], ['2026-11-02', 0.9]]),
    'y:NESN.SW': serie('y:NESN.SW', 'CHF', [['2026-10-30', 90], ['2026-11-02', 91]]),
    gold: serie('gold', 'USD', [['2026-10-30', 4000], ['2026-11-02', 4100]]),
  };
  it('uses the close of that day and the exchange rate of the same day', () => {
    expect(schlussAm('AAPL', '2026-10-30', r)).toEqual({ preis: 160, tag: '2026-10-30' });
    expect(schlussAm('AAPL', '2026-11-02', r).preis).toBeCloseTo(189, 6);
    expect(schlussAm('NESN.SW', '2026-11-02', r)).toEqual({ preis: 91, tag: '2026-11-02' });
  });
  it('takes the last trading day before a weekend and says which day it was', () => {
    expect(schlussAm('NESN.SW', '2026-11-01', r)).toEqual({ preis: 90, tag: '2026-10-30' });
    expect(schlussAm('AAPL', '2026-11-01', r)).toEqual({ preis: 160, tag: '2026-10-30' });
  });
  it('gives francs per gram for gold with the dollar of that day', () => {
    const g = schlussAm('gold', '2026-10-30', r);
    expect(g.tag).toBe('2026-10-30');
    expect(g.preis).toBeCloseTo(((4000 / 31.1034768) * 0.8), 4);
  });
  it('says null instead of guessing: day before the series, too old, no rate, no series', () => {
    expect(schlussAm('NESN.SW', '2026-10-01', r)).toBeNull();
    expect(schlussAm('NESN.SW', '2026-11-30', r)).toBeNull(); // the last close is older than 14 days
    expect(schlussAm('AAPL', '2026-10-30', { 'y:AAPL': r['y:AAPL'] })).toBeNull(); // no dollar rate
    expect(schlussAm('ROG.SW', '2026-10-30', r)).toBeNull();
    expect(schlussAm('NESN.SW', 'kein Tag', r)).toBeNull();
  });
  it('counts pence as pounds', () => {
    const p = { 'y:SHEL.L': serie('y:SHEL.L', 'GBp', [['2026-10-30', 2500]]), 'y:GBPCHF=X': serie('y:GBPCHF=X', 'CHF', [['2026-10-30', 1.1]]) };
    expect(schlussAm('SHEL.L', '2026-10-30', p).preis).toBeCloseTo(27.5, 6);
  });
  it('fetches the series of one title and its rate, not gold', async () => {
    const asked = [];
    const lade = async (id) => (asked.push(id), serie(id, id === 'y:AAPL' ? 'USD' : 'CHF', [['2026-10-30', 1]]));
    const next = await ladeTitelReihe('AAPL', { gold: r.gold, usdchf: r.usdchf }, { lade });
    expect(asked).toEqual(['y:AAPL']);
    expect(next['y:AAPL']).toBeTruthy();
    expect(await ladeTitelReihe('gold', { x: 1 }, { lade })).toEqual({ x: 1 });
  });
});
