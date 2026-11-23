import { describe, it, expect } from 'vitest';
import {
  mittelAm, mittelReihe, ampel, lage, liesRegel, regelFaktor, regelVorschlag, monatsAnfaenge, rueckblick, verteilung, widersprueche, REGEL_STANDARD, LAGE_MIN, liesRegeln, REGELN_KEY,
} from '../src/lib/kurse/signale.js';

/** A series of weekdays from a start day; `f(i)` is the close of day i. Invented numbers only. */
function reihe(n, f, start = '2020-01-01') {
  const d = new Date(`${start}T12:00:00Z`);
  const out = [];
  for (let i = 0; i < n; i++) {
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1);
    out.push([d.toISOString().slice(0, 10), f(i)]);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

describe('mittel', () => {
  const p = reihe(10, (i) => i + 1);
  it('averages the last n closes up to an index', () => {
    expect(mittelAm(p, 4, 5)).toBe(3);
    expect(mittelAm(p, 9, 3)).toBe(9);
  });
  it('says null while there are fewer than n closes', () => {
    expect(mittelAm(p, 3, 5)).toBeNull();
    expect(mittelAm(p, 20, 5)).toBeNull();
    expect(mittelAm(null, 0, 5)).toBeNull();
  });
  it('makes the whole line, shorter than the series', () => {
    const m = mittelReihe(p, 5);
    expect(m).toHaveLength(6);
    expect(m[0]).toEqual([p[4][0], 3]);
    expect(m[5][1]).toBe(8);
  });
});

describe('ampel', () => {
  it('is null without 200 closes', () => {
    expect(ampel(reihe(150, () => 100))).toBeNull();
  });
  it('is green when the price is above both means (a rising line)', () => {
    const a = ampel(reihe(400, (i) => 100 + i));
    expect(a.farbe).toBe('gruen');
    expect(a.ueber200).toBeGreaterThan(0);
    expect(a.ueber50).toBeGreaterThan(0);
  });
  it('is red when the price is below both means (a falling line)', () => {
    expect(ampel(reihe(400, (i) => 1000 - i)).farbe).toBe('rot');
  });
  it('is yellow in between: a long rise, then a dip below the short mean but above the long one', () => {
    const p = reihe(400, (i) => (i < 380 ? 100 + i : 480 - (i - 379) * 4));
    const a = ampel(p);
    expect(a.preis).toBeLessThan(a.m50);
    expect(a.preis).toBeGreaterThan(a.m200);
    expect(a.farbe).toBe('gelb');
  });
  it('can look at an earlier index', () => {
    const p = reihe(400, (i) => (i < 300 ? 100 + i : 400 - (i - 299) * 3));
    expect(ampel(p, 299).farbe).toBe('gruen');
    expect(ampel(p).farbe).not.toBe('gruen');
  });
  it('gives the distance to the means in percent', () => {
    const a = ampel(reihe(400, () => 100));
    expect(a.ueber50).toBe(0);
    expect(a.ueber200).toBe(0);
  });
});

describe('lage', () => {
  it('is null for a short or a flat series', () => {
    expect(lage(reihe(LAGE_MIN - 1, (i) => i))).toBeNull();
    expect(lage(reihe(500, () => 50))).toBeNull();
  });
  it('says teuer in the highest fifth, günstig in the lowest, mitte between', () => {
    const hoch = lage(reihe(500, (i) => i));
    expect(hoch.stufe).toBe('teuer');
    expect(hoch.p).toBe(1);
    const tief = lage(reihe(500, (i) => 500 - i));
    expect(tief.stufe).toBe('guenstig');
    expect(tief.p).toBe(0);
    const mitte = lage(reihe(500, (i) => (i === 499 ? 250 : i % 2 ? 0 : 500)));
    expect(mitte.stufe).toBe('mitte');
    expect(mitte.p).toBe(0.5);
  });
  it('looks only at the last 1260 days', () => {
    const p = reihe(2000, (i) => (i < 500 ? 1000 : 100 + (i % 50)));
    const l = lage(p);
    expect(l.tage).toBe(1260);
    expect(l.hoch).toBeLessThan(200);
  });
});

describe('Kaufregel', () => {
  const steigt = reihe(1500, (i) => 100 + i); // green, and very expensive at the end
  const faellt = reihe(1500, (i) => 2000 - i); // red, and cheap at the end
  it('falls back to the standard for anything broken', () => {
    expect(liesRegel(null)).toEqual(REGEL_STANDARD);
    expect(liesRegel({ grundbetrag: -5, rot: 3, teuer: 'x' })).toEqual(REGEL_STANDARD);
    expect(liesRegel({ grundbetrag: 500, rot: 2, teuer: 0.5 })).toEqual({ grundbetrag: 500, rot: 2, teuer: 0.5 });
  });
  it('halves the amount when very expensive and doubles it when red', () => {
    const r = { grundbetrag: 500, rot: 2, teuer: 0.5 };
    const a = regelVorschlag(steigt, steigt.length - 1, r);
    expect(a.gruende).toEqual(['teuer']);
    expect(a.betrag).toBe(250);
    const b = regelVorschlag(faellt, faellt.length - 1, r);
    expect(b.gruende).toEqual(['rot']);
    expect(b.betrag).toBe(1000);
  });
  it('multiplies both factors when both apply (red, and still in the highest fifth of five years)', () => {
    const p = reihe(1500, (i) => (i < 1000 ? 100 : i < 1480 ? 1000 : 1000 - (i - 1479) * 7.5));
    const f = regelFaktor(p, p.length - 1, { grundbetrag: 100, rot: 2, teuer: 1.5 });
    expect(f.gruende).toEqual(['rot', 'teuer']);
    expect(f.faktor).toBe(3);
    expect(regelVorschlag(p, p.length - 1, { grundbetrag: 100, rot: 2, teuer: 1.5 }).betrag).toBe(300);
  });
  it('uses the base amount when the series is too short to say anything', () => {
    const v = regelVorschlag(reihe(100, (i) => i + 1), 99, { grundbetrag: 300, rot: 2, teuer: 0.5 });
    expect(v.faktor).toBe(1);
    expect(v.betrag).toBe(300);
    expect(v.farbe).toBeNull();
  });
  it('can say «nothing» with the factor 0', () => {
    const v = regelVorschlag(steigt, steigt.length - 1, { grundbetrag: 500, rot: 1, teuer: 0 });
    expect(v.betrag).toBe(0);
    expect(v.menge).toBe(0);
  });
  it('gives pieces or grams for the suggestion', () => {
    const v = regelVorschlag(reihe(300, () => 50), 299, { grundbetrag: 500, rot: 1, teuer: 1 });
    expect(v.menge).toBe(10);
  });
});

describe('Rückblick', () => {
  it('finds the first trading day of each month', () => {
    const p = reihe(300, (i) => i + 1, '2024-01-01');
    const a = monatsAnfaenge(p);
    expect(p[a[0]][0]).toBe('2024-01-01');
    expect(a.every((i, k) => k === 0 || p[i][0].slice(0, 7) > p[a[k - 1]][0].slice(0, 7))).toBe(true);
    expect(monatsAnfaenge(p, 3)).toHaveLength(3);
  });
  it('leaves out a first month that starts late in the month', () => {
    const p = reihe(100, (i) => i + 1, '2024-01-17');
    expect(p[monatsAnfaenge(p)[0]][0]).toBe('2024-02-01');
  });
  it('is null without a base amount or a series', () => {
    expect(rueckblick(reihe(500, () => 1), { grundbetrag: 0, rot: 1, teuer: 1 })).toBeNull();
    expect(rueckblick([], { grundbetrag: 100 })).toBeNull();
  });
  it('compares the rule with always the same amount', () => {
    const p = reihe(1700, (i) => 100 + Math.round(30 * Math.sin(i / 60)) + i / 20);
    const r = rueckblick(p, { grundbetrag: 500, rot: 2, teuer: 0.5 });
    expect(r.monate.length).toBeLessThanOrEqual(60);
    expect(r.gleich.einbezahlt).toBe(500 * r.monate.length);
    expect(r.regel.einbezahlt).toBe(r.monate.reduce((s, z) => s + z.betrag, 0));
    expect(r.regel.wert).toBeCloseTo(r.regel.menge * p[p.length - 1][1], 6);
    expect(r.unterschied).toBeCloseTo(r.gleich.schnitt - r.regel.schnitt, 9);
  });
  it('with factor 1 everywhere the rule and «always the same» are the same', () => {
    const p = reihe(1700, (i) => 100 + i / 10);
    const r = rueckblick(p, { grundbetrag: 400, rot: 1, teuer: 1 });
    expect(r.regel.einbezahlt).toBe(r.gleich.einbezahlt);
    expect(r.regel.menge).toBeCloseTo(r.gleich.menge, 9);
    expect(r.unterschied).toBeCloseTo(0, 9);
  });
  it('buys nothing in a month when the factor is 0', () => {
    const p = reihe(1700, (i) => 100 + i / 10); // always expensive
    const r = rueckblick(p, { grundbetrag: 400, rot: 1, teuer: 0 });
    expect(r.monate.some((z) => z.betrag === 0)).toBe(true);
  });
});

describe('Verteilung', () => {
  const gruppen = [
    { id: 'gold', ziel: 10 },
    { id: 'aktien', ziel: 60 },
    { id: 'obl', ziel: 30 },
  ];
  it('works out shares, points and francs against the goals', () => {
    const v = verteilung(gruppen, { gold: 2000, aktien: 6000, obl: 2000 }, 2);
    expect(v.total).toBe(10000);
    const g = (id) => v.gruppen.find((x) => x.id === id);
    expect(g('gold').jetzt).toBe(20);
    expect(g('gold').abweichung).toBe(10);
    expect(g('gold').diff).toBe(1000); // sell 1000
    expect(g('gold').ok).toBe(false);
    expect(g('aktien').ok).toBe(true);
    expect(g('obl').diff).toBe(-1000); // buy 1000
    expect(v.summeZiel).toBe(100);
  });
  it('is within the band at the edge', () => {
    const v = verteilung([{ id: 'a', ziel: 50 }, { id: 'b', ziel: 50 }], { a: 5200, b: 4800 }, 2);
    expect(v.gruppen.every((g) => g.ok)).toBe(true);
  });
  it('copes with an empty portfolio, goals that do not add up to 100 and bad numbers', () => {
    const leer = verteilung(gruppen, {}, 2);
    expect(leer.total).toBe(0);
    expect(leer.gruppen[0].jetzt).toBe(0);
    expect(leer.gruppen[0].diff).toBe(0);
    const schief = verteilung([{ id: 'a', ziel: 150 }, { id: 'b', ziel: -5 }, { id: 'c', ziel: NaN }], { a: 100, b: 100, c: -50 }, 1);
    expect(schief.gruppen.map((g) => g.ziel)).toEqual([100, 0, 0]);
    expect(schief.gruppen[2].wert).toBe(0);
  });
  it('spots where a rule and a goal disagree', () => {
    const v = verteilung(gruppen, { gold: 2000, aktien: 6000, obl: 2000 }, 2);
    const w = widersprueche([
      { id: 't1', gruppe: 'gold', betrag: 150, faktor: 0.5 },
      { id: 't2', gruppe: 'obl', betrag: 50, faktor: 0.5 },
      { id: 't3', gruppe: 'obl', betrag: 100, faktor: 1 },
      { id: 't4', gruppe: 'aktien', betrag: 100, faktor: 2 },
      { id: 't5', gruppe: 'gold', betrag: 0, faktor: 0 },
      { id: 't6', gruppe: 'ohne-gruppe', betrag: 10, faktor: 1 },
    ], v);
    expect(w.map((x) => [x.id, x.art])).toEqual([['t1', 'kauft-ueber'], ['t2', 'kauft-wenig-unter']]);
  });
});

describe('Regeln im Speicher', () => {
  it('reads one rule per title and drops what is no rule', () => {
    expect(liesRegeln(null)).toEqual({});
    expect(liesRegeln([1, 2])).toEqual({});
    expect(liesRegeln({ gold: { grundbetrag: 300, rot: 2, teuer: 0.5 }, kaputt: 5, leer: null })).toEqual({ gold: { grundbetrag: 300, rot: 2, teuer: 0.5 } });
    expect(liesRegeln({ gold: { grundbetrag: -1, rot: 7 } })).toEqual({ gold: REGEL_STANDARD });
    expect(REGELN_KEY).toBe('kurse.regeln');
  });
});
