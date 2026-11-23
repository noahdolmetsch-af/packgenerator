// «Kursblick» Ziele (K13): goals with a number. Invented numbers only.
import { describe, it, expect } from 'vitest';
import { lies, neuesZiel, aendereZiel, loescheZiel, schiebeZiel, pruefe, aktuell, ZIELE_KEY } from '../src/lib/kurse/ziele.js';

const leer = () => lies(null);
const mit = (...ds) => ds.reduce((st, d, i) => neuesZiel(st, d, `z${i}`).state, leer());

describe('goals', () => {
  it('keeps the setting key and reads nothing as empty, broken entries left out', () => {
    expect(ZIELE_KEY).toBe('kurse.ziele');
    expect(lies(undefined)).toEqual({ ziele: [] });
    const s = lies({ ziele: [{ id: 'a', was: 'gold', wert: 100000 }, { id: 'a', was: 'smi', wert: 1 }, { id: 'b', was: 'titel', symbol: 'no good', wert: 1 }, { id: 'c', was: 'smi', wert: 'x' }, { id: 'd', was: 'zzz', wert: 1 }] });
    expect(s.ziele.map((z) => z.id)).toEqual(['a']);
    expect(s.ziele[0].richtung).toBe('ueber');
  });
  it('adds, changes, deletes, moves', () => {
    let st = mit({ was: 'gold', wert: '120 000', richtung: 'ueber' }, { was: 'titel', symbol: 'abc.sw', wert: '80', richtung: 'unter', name: 'Kaufen' });
    expect(st.ziele[0]).toMatchObject({ id: 'z0', was: 'gold', wert: 120000, richtung: 'ueber' });
    expect(st.ziele[1]).toMatchObject({ symbol: 'ABC.SW', richtung: 'unter', name: 'Kaufen' });
    st = aendereZiel(st, 'z1', { wert: '75,5', richtung: 'ueber' }).state;
    expect(st.ziele[1]).toMatchObject({ wert: 75.5, richtung: 'ueber', symbol: 'ABC.SW' });
    expect(aendereZiel(st, 'nope', {}).error).toBe('gone');
    expect(schiebeZiel(st, 'z1', -1).ziele.map((z) => z.id)).toEqual(['z1', 'z0']);
    expect(schiebeZiel(st, 'z0', -1)).toBe(st);
    expect(loescheZiel(st, 'z0').ziele.map((z) => z.id)).toEqual(['z1']);
  });
  it('refuses a missing number and a wrong symbol', () => {
    expect(neuesZiel(leer(), { was: 'gold', wert: '' }).error).toBe('wert');
    expect(neuesZiel(leer(), { was: 'gold', wert: 'viel' }).error).toBe('wert');
    expect(neuesZiel(leer(), { was: 'titel', symbol: '??', wert: '5' }).error).toBe('symbol');
  });
});

describe('is it reached?', () => {
  const ueber = { was: 'gold', richtung: 'ueber', wert: 100 };
  const unter = { was: 'smi', richtung: 'unter', wert: 50 };
  it('over: at or above; under: at or below', () => {
    expect(pruefe(ueber, 100).erreicht).toBe(true);
    expect(pruefe(ueber, 120)).toMatchObject({ erreicht: true, abstand: 0 });
    expect(pruefe(ueber, 90)).toMatchObject({ erreicht: false, abstand: 10 });
    expect(pruefe(ueber, 90).pct).toBeCloseTo(11.11, 1);
    expect(pruefe(unter, 50).erreicht).toBe(true);
    expect(pruefe(unter, 60)).toMatchObject({ erreicht: false, abstand: 10 });
  });
  it('an unknown number is never reached', () => {
    expect(pruefe(ueber, null)).toMatchObject({ erreicht: false, jetzt: null, abstand: null });
  });
  it('reads the number a goal is about from what is known', () => {
    const ctx = { goldKg: 99000, smi: 12000, bestand: 40000, titel: { 'ABC.SW': 77 } };
    expect(aktuell({ was: 'gold' }, ctx)).toBe(99000);
    expect(aktuell({ was: 'smi' }, ctx)).toBe(12000);
    expect(aktuell({ was: 'bestand' }, ctx)).toBe(40000);
    expect(aktuell({ was: 'titel', symbol: 'ABC.SW' }, ctx)).toBe(77);
    expect(aktuell({ was: 'titel', symbol: 'XYZ' }, ctx)).toBeNull();
    expect(aktuell({ was: 'gold' }, {})).toBeNull();
  });
});
