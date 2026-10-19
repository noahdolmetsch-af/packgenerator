// Paket U «Rennen» › Vorbereiten: the helpers of the part (src/lib/race/prep-lib.js) and its German texts.
import { describe, it, expect } from 'vitest';
import { showStd, keepStd, PAPER_ROWS, paperDue, whenOf, countByKind, kmOfKinds, packedOf, lineOf } from '../src/lib/race/prep-lib.js';
import { PAPERS } from '../src/lib/race/more.js';
import de from '../src/lib/i18n/de/rennen-vorbereiten.js';

const tr = (s) => ({ Registration: 'Anmeldung' })[s] ?? s;

describe('race prepare helpers', () => {
  it('shows the app rows in the language and keeps their keys until changed', () => {
    const rows = [{ id: 'a', text: 'Registration', std: true }, { id: 'b', text: 'Mine' }];
    const shown = showStd(rows, ['text'], tr);
    expect(shown.map((r) => r.text)).toEqual(['Anmeldung', 'Mine']);
    expect(keepStd(shown, rows, ['text'], tr)[0]).toMatchObject({ text: 'Registration', std: true });
    const changed = keepStd([{ ...shown[0], text: 'Anmeldung bis Mai' }, shown[1]], rows, ['text'], tr);
    expect(changed[0]).toMatchObject({ text: 'Anmeldung bis Mai', std: false });
    expect(changed[1]).toEqual({ id: 'b', text: 'Mine' });
  });
  it('has the paperwork of the app plus the beds, due from the start', () => {
    expect(PAPER_ROWS.length).toBe(PAPERS.length + 1);
    expect(PAPER_ROWS.at(-1).id).toBe('pp-hotels');
    expect(paperDue({ daysBefore: 14 }, '2027-06-20')).toBe('2027-06-06');
    expect(paperDue({ daysBefore: 14, due: '2027-05-01' }, '2027-06-20')).toBe('2027-05-01');
    expect(paperDue({ daysBefore: 14 }, '')).toBe('');
  });
  it('counts stops by kind and finds their km', () => {
    const pois = [{ kind: 'shop', km: 30 }, { kind: 'water', km: 10 }, { kind: 'shop', km: 5 }];
    expect(countByKind(pois, ['water', 'shop', 'bike'])).toEqual([{ kind: 'water', n: 1 }, { kind: 'shop', n: 2 }]);
    expect(kmOfKinds(pois, ['shop'])).toEqual([5, 30]);
  });
  it('lists each packed item once with its name', () => {
    const trip = { entries: [{ itemId: 'i1' }, { itemId: 'i1' }, { itemId: 'i2' }, { itemId: 'gone' }] };
    expect(packedOf(trip, [{ id: 'i1', name: 'Rear light' }, { id: 'i2', name: 'Whistle' }])).toEqual([{ id: 'i1', name: 'Rear light' }, { id: 'i2', name: 'Whistle' }]);
  });
  it('draws the weight line inside its box', () => {
    const l = lineOf([{ km: 0, kg: 20 }, { km: 50, kg: 24 }, { km: 100, kg: 21 }]);
    expect(l.d.startsWith('M4 86')).toBe(true);
    expect(l.x(100)).toBe(296);
    expect(l.y(24)).toBe(4);
    expect(lineOf([]).d).toBe('');
  });
  it('writes a weekday and a time', () => {
    const ms = new Date('2027-06-19T14:30:00').getTime();
    expect(whenOf(ms, 'en-GB')).toBe('Sat 14:30');
    expect(whenOf(NaN)).toBe('');
  });
  it('German texts keep their placeholders and use ss, not ß', () => {
    for (const [en, deText] of Object.entries(de)) {
      const ph = (s) => (s.match(/\{\w+\}/g) ?? []).sort().join();
      expect(ph(deText), en).toBe(ph(en));
      expect(deText.includes('ß'), en).toBe(false);
    }
  });
});
