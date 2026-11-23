// «Kursblick» (K-C): from series to numbers for the holdings and goals. Invented series only.
import { describe, it, expect } from 'vitest';
import { lies as liesB, neuerPosten } from '../src/lib/kurse/bestand.js';
import { lies as liesZ, neuesZiel } from '../src/lib/kurse/ziele.js';
import { titelIds, kursIds, ladeFehlende, goldKgJetzt, kontextVon, bewerteAlle, zielKontext } from '../src/lib/kurse/stand.js';

const ans = (id, close, currency = 'CHF') => ({ id, currency, last: { day: '2026-11-20', close }, points: [['2026-11-19', close], ['2026-11-20', close]], fetchedAt: '2026-11-21T06:00:00Z' });
const gold = { id: 'gold', last: { day: '2026-11-20', close: 3000 }, points: [['2026-11-20', 3000]] };
const usd = { id: 'usdchf', last: { day: '2026-11-20', close: 0.8 }, points: [['2026-11-20', 0.8]] };
const bestand = [
  { art: 'titel', symbol: 'abc.sw', menge: 10, einstand: 1000 },
  { art: 'titel', symbol: 'xyz', menge: 4, einstand: 400 },
  { art: 'titel', symbol: 'eur1', menge: 2 },
  { art: 'gold', menge: 500, einstand: 40000 },
  { art: 'hand', name: 'Mein Sparkonto', wert: 5000 },
].reduce((st, d, i) => neuerPosten(st, d, `p${i}`).state, liesB(null));
const ziele = [{ was: 'titel', symbol: 'abc.sw', wert: 150 }, { was: 'gold', wert: 90000 }].reduce((st, d, i) => neuesZiel(st, d, `z${i}`).state, liesZ(null));

describe('what to fetch', () => {
  it('the titles of positions and goals, once each', () => {
    expect(titelIds(bestand, ziele).sort()).toEqual(['y:ABC.SW', 'y:EUR1', 'y:XYZ']);
  });
  it('the rates the loaded titles need (dollar uses the dollar series, francs none)', () => {
    const reihen = { 'y:ABC.SW': ans('y:ABC.SW', 100), 'y:XYZ': ans('y:XYZ', 50, 'USD'), 'y:EUR1': ans('y:EUR1', 10, 'EUR') };
    expect(kursIds(bestand, reihen).sort()).toEqual(['usdchf', 'y:EURCHF=X']);
  });
  it('fetches what is missing and takes a failed title as null, never twice', async () => {
    const calls = [];
    const lade = async (id) => {
      calls.push(id);
      if (id === 'y:XYZ') throw new Error('unreachable');
      return ans(id, 10, id === 'y:EUR1' ? 'EUR' : 'CHF');
    };
    const r = await ladeFehlende(bestand, ziele, { gold, usdchf: usd }, { lade });
    expect(r['y:XYZ']).toBeNull();
    expect(r['y:ABC.SW'].last.close).toBe(10);
    expect(calls.filter((c) => c === 'y:EURCHF=X')).toHaveLength(1);
    expect(r['y:EURCHF=X']).toBeTruthy();
    const again = [];
    await ladeFehlende(bestand, ziele, r, { lade: async (id) => (again.push(id), ans(id, 1)) });
    expect(again).toEqual([]);
  });
});

describe('numbers', () => {
  const reihen = { gold: { ...gold, points: [['2026-11-20', 2400]] }, usdchf: usd, 'y:ABC.SW': ans('y:ABC.SW', 120), 'y:XYZ': ans('y:XYZ', 50, 'USD'), 'y:EUR1': null };
  it('gold in francs per kilogram from ounces and the dollar rate', () => {
    const kg = goldKgJetzt(reihen);
    expect(kg).toBeGreaterThan(0);
    expect(goldKgJetzt({})).toBeNull();
  });
  it('a title in francs, a title in dollars, a title that did not come', () => {
    expect(kontextVon(bestand.posten[0], reihen)).toEqual({ preis: 120, kurs: 1 });
    expect(kontextVon(bestand.posten[1], reihen)).toEqual({ preis: 50, kurs: 0.8 });
    expect(kontextVon(bestand.posten[2], reihen)).toEqual({ preis: null, kurs: null });
  });
  it('the whole holding: positions with a value count, the title that did not come is «open»', () => {
    const { zeilen, summe } = bewerteAlle(bestand, reihen);
    expect(zeilen[0].b.wert).toBe(1200);
    expect(zeilen[1].b.wert).toBeCloseTo(160, 9);
    expect(zeilen[2].b.grund).toBe('preis');
    expect(summe.offen).toBe(1);
    expect(summe.wert).toBeGreaterThan(6000);
  });
  it('what the goals are checked against', () => {
    const ctx = zielKontext(bestand, ziele, reihen);
    expect(ctx.titel).toEqual({ 'ABC.SW': 120 });
    expect(ctx.goldKg).toBeGreaterThan(0);
    expect(ctx.smi).toBeNull();
    expect(ctx.bestand).toBeGreaterThan(0);
    expect(zielKontext(liesB(null), ziele, reihen).bestand).toBeNull();
  });
});
