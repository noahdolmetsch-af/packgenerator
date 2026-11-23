// «Kursblick» Vergleich (K11): up to five lines on base 100. Invented prices only.
import { describe, it, expect } from 'vitest';
import { aufHundert, umschalten, raster, MAX_LINIEN } from '../src/lib/kurse/vergleich.js';

const A = [['2026-01-02', 50], ['2026-02-02', 55], ['2026-03-02', 60], ['2026-04-01', 40]];
const B = [['2026-01-02', 1000], ['2026-02-02', 1100], ['2026-03-02', 1000], ['2026-04-01', 1200]];
const C = [['2026-03-02', 10], ['2026-04-01', 12]]; // starts later

describe('aufHundert', () => {
  it('starts every line at 100 on the same day, however different the prices are', () => {
    const r = aufHundert([{ id: 'a', points: A }, { id: 'b', points: B }], { n: 2, unit: 'm' });
    expect(r.ende).toBe('2026-04-01');
    expect(r.start).toBe('2026-02-01');
    for (const l of r.linien) {
      expect(l.von).toBe('2026-01-02'); // the close on or before the start day
      expect(l.points[0][1]).toBe(100);
    }
    expect(r.linien[0].points.map((p) => p[1])).toEqual([100, 110, 120, 80]);
    expect(r.linien[1].aenderung).toBe(20);
    expect(r.linien[0].aenderung).toBe(-20);
  });
  it('a series that starts later begins at its own first day and says so', () => {
    const r = aufHundert([{ id: 'a', points: A }, { id: 'c', points: C }], { n: 2, unit: 'm' });
    const c = r.linien.find((l) => l.id === 'c');
    expect(c.kurz).toBe(true);
    expect(c.von).toBe('2026-03-02');
    expect(c.points.map((p) => p[1])).toEqual([100, 120]);
    expect(r.linien.find((l) => l.id === 'a').kurz).toBe(false);
  });
  it('counts the period back from the latest last day of all series', () => {
    const late = [['2026-04-01', 5], ['2026-04-10', 6], ['2026-04-14', 7]];
    expect(aufHundert([{ id: 'a', points: A }, { id: 'l', points: late }], { n: 1, unit: 'w' }).start).toBe('2026-04-07');
  });
  it('leaves out series with fewer than two points, and answers empty without any', () => {
    expect(aufHundert([{ id: 'x', points: [['2026-01-02', 1]] }, { id: 'a', points: A }], { n: 1, unit: 'y' }).linien.map((l) => l.id)).toEqual(['a']);
    expect(aufHundert([], { n: 1, unit: 'y' })).toEqual({ start: '', ende: '', linien: [] });
    expect(aufHundert(null, { n: 1, unit: 'y' }).linien).toEqual([]);
  });
});

describe('umschalten', () => {
  it('adds and takes away; the sixth is not taken', () => {
    let w = [];
    for (const id of ['a', 'b', 'c', 'd', 'e']) w = umschalten(w, id).wahl;
    expect(w).toHaveLength(MAX_LINIEN);
    const r = umschalten(w, 'f');
    expect(r.voll).toBe(true);
    expect(r.wahl).toEqual(w);
    expect(umschalten(w, 'c').wahl).toEqual(['a', 'b', 'd', 'e']);
    expect(umschalten(w, 'c').voll).toBe(false);
  });
});

describe('raster: the lines on one row of days for the chart', () => {
  const linien = [
    { id: 'a', points: [['2026-01-05', 100], ['2026-01-06', 101], ['2026-01-07', 102], ['2026-01-09', 104]] },
    { id: 'b', points: [['2026-01-07', 100], ['2026-01-08', 99]] },
  ];
  it('uses every day any line has, a line is empty before its own first day and carries its last close over a day it has none', () => {
    const r = raster(linien);
    expect(r.days).toEqual(['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08', '2026-01-09']);
    expect(r.v.a).toEqual([100, 101, 102, 102, 104]);
    expect(r.v.b).toEqual([null, null, 100, 99, 99]);
  });
  it('keeps at most max days, the first and the last among them', () => {
    const pts = Array.from({ length: 1000 }, (_, i) => [new Date(Date.UTC(2020, 0, 1 + i)).toISOString().slice(0, 10), 100 + i]);
    const r = raster([{ id: 'x', points: pts }], 50);
    expect(r.days.length).toBeLessThanOrEqual(50);
    expect(r.days[0]).toBe(pts[0][0]);
    expect(r.days[r.days.length - 1]).toBe(pts[pts.length - 1][0]);
    expect(r.v.x).toHaveLength(r.days.length);
  });
  it('is empty without lines', () => {
    expect(raster([])).toEqual({ days: [], v: {} });
  });
});
