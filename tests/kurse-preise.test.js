import { describe, it, expect } from 'vitest';
import { preiseChf, ladeJournalPreise, titelText } from '../src/lib/kurse/preise.js';
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
