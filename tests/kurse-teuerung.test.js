// «Kursblick» Teuerung (K15): gold in the francs of another year. Invented index values only.
import { describe, it, expect } from 'vitest';
import { indexAm, realReihe, jahre, standardJahr } from '../src/lib/kurse/teuerung.js';

// prices rise 10 per year: 100 in the middle of 2010, 110 in 2011 …
const INDEX = [2010, 2011, 2012, 2013, 2014].map((y, i) => [`${y}-07-01`, 100 + i * 10]);

describe('index on a day', () => {
  it('is the value in the middle of a year and a straight line between two years', () => {
    expect(indexAm(INDEX, '2011-07-01')).toEqual({ wert: 110, geschaetzt: false });
    const mid = indexAm(INDEX, '2011-12-31'); // half a year later: 115 (rounded)
    expect(mid.wert).toBeGreaterThan(114.9);
    expect(mid.wert).toBeLessThan(115.1);
    expect(mid.geschaetzt).toBe(false);
  });
  it('before the first value it is the first; after the last it stays and says it is an estimate', () => {
    expect(indexAm(INDEX, '2009-01-01')).toEqual({ wert: 100, geschaetzt: false });
    expect(indexAm(INDEX, '2016-01-01')).toEqual({ wert: 140, geschaetzt: true });
    expect(indexAm(INDEX, '2014-07-01')).toEqual({ wert: 140, geschaetzt: false });
    expect(indexAm([], '2016-01-01')).toBeNull();
  });
});

describe('in the francs of a year', () => {
  // gold doubles in nominal francs while prices rise by a half from 2010 to the middle of 2013 (100 → 130, +30 %)
  const GOLD = [['2010-01-04', 1000], ['2010-07-01', 1000], ['2011-07-01', 1200], ['2013-07-01', 2000]];
  it('a price at the middle of the year of the base is unchanged', () => {
    const r = realReihe(GOLD, INDEX, 2010);
    expect(r.punkte[1]).toEqual(['2010-07-01', 1000]);
  });
  it('divides the rise of prices out', () => {
    const r = realReihe(GOLD, INDEX, 2010);
    expect(r.punkte[3][1]).toBeCloseTo(2000 * (100 / 130), 1);
    expect(r.nominal).toBeCloseTo(100, 9);
    expect(r.real).toBeCloseTo((2000 * (100 / 130) / punkt(r, 0) - 1) * 100, 1);
    expect(r.von).toBe('2010-01-04');
    expect(r.geschaetzt).toBe(false);
  });
  it('says when the last days use the last index value', () => {
    const r = realReihe([['2014-01-02', 1000], ['2016-03-01', 1000]], INDEX, 2014);
    expect(r.geschaetzt).toBe(true);
    expect(r.bisJahr).toBe(2014);
  });
  it('has nothing for a year the series does not reach, or without an index', () => {
    expect(realReihe(GOLD, INDEX, 2020)).toBeNull();
    expect(realReihe(GOLD, [], 2010)).toBeNull();
    expect(realReihe([], INDEX, 2010)).toBeNull();
  });
});
const punkt = (r, i) => r.punkte[i][1];

describe('the years to choose', () => {
  it('start the year after a series that starts late, up to last year', () => {
    expect(jahre([['2003-12-01', 1], ['2004-01-01', 1]], 2026).slice(0, 2)).toEqual([2004, 2005]);
    expect(jahre([['2003-01-02', 1], ['2004-01-01', 1]], 2026)[0]).toBe(2003);
    expect(jahre([['2003-01-02', 1]], 2026).at(-1)).toBe(2025);
    expect(jahre([], 2026)).toEqual([]);
  });
  it('offers twenty years back, but not before the series', () => {
    expect(standardJahr([2004, 2005, 2025], 2026)).toBe(2006);
    expect(standardJahr([2012, 2013, 2025], 2026)).toBe(2012);
    expect(standardJahr([], 2026)).toBe(2025);
  });
});
