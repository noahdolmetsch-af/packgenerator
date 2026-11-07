import { describe, it, expect } from 'vitest';
import TOURS from '../src/lib/vorschlaege/data/pilot.js';
import { REGIONS, LEVELS, LEVELS_STD, levelsOf, matchLevels, hoursOf, splitHours, snowOf, filterTours, splitNow, gridOf, densify, newShare, awayKm, whyOf, warnsOf, gpxOf } from '../src/lib/vorschlaege/regeln.js';

const by = (id) => TOURS.find((t) => t.id === id);

describe('Tourenvorschläge: die Pilot-Daten', () => {
  it('hat 5 Touren, je mit Linie, Höhenprofil und Untergrund', () => {
    expect(TOURS.map((t) => t.id)).toEqual(['sm-33', 'sm-10711', 'sm-250', 'sm-636', 'sm-332']);
    for (const t of TOURS) {
      expect(t.line.length).toBeGreaterThan(20);
      expect(t.ele.length).toBe(t.cls.length);
      expect(t.ele.length).toBeGreaterThan(10);
      expect(t.single + t.unpaved + t.paved).toBeGreaterThanOrEqual(98);
      expect(REGIONS.map((r) => r.key)).toContain(t.region);
      for (const l of levelsOf(t)) expect(LEVELS).toContain(l);
    }
  });
  it('liegt in der Schweiz (Zürich und Graubünden)', () => {
    for (const t of TOURS) {
      const [la, lo] = t.line[0];
      expect(la).toBeGreaterThan(46.3);
      expect(la).toBeLessThan(47.6);
      expect(lo).toBeGreaterThan(8.3);
      expect(lo).toBeLessThan(10.2);
    }
    expect(by('sm-332').single).toBeGreaterThan(40);
  });
});

describe('Tourenvorschläge: Stufen', () => {
  it('«mittel und schwierig» (Standard): Kondition oder Technik reicht', () => {
    expect(filterTours(TOURS, { levels: LEVELS_STD }).length).toBe(5);
    // Flims: Kondition mittel, Technik leicht → bleibt; nur «leicht» zeigt Flims (Technik) und sonst nichts
    expect(filterTours(TOURS, { levels: ['easy'] }).map((t) => t.id)).toEqual(['sm-250']);
    expect(filterTours(TOURS, { levels: ['difficult'] }).map((t) => t.id)).toEqual(['sm-33', 'sm-332']);
    expect(filterTours(TOURS, { levels: [] })).toEqual([]);
  });
  it('eine Abfahrt hat keine Kondition, nur Technik', () => {
    const d = by('sm-10711');
    expect(levelsOf(d)).toEqual(['medium']);
    expect(matchLevels(d, new Set(['medium']))).toBe(true);
    expect(matchLevels(d, ['easy', 'difficult'])).toBe(false);
  });
  it('Region, Zeit und ausgeblendete Touren', () => {
    expect(filterTours(TOURS, { regions: ['zh'] }).map((t) => t.id)).toEqual(['sm-33', 'sm-10711']);
    expect(filterTours(TOURS, { regions: ['gr'], hidden: ['sm-250'] }).map((t) => t.id)).toEqual(['sm-636', 'sm-332']);
    expect(filterTours(TOURS, { maxHours: 1 }).map((t) => t.id)).toEqual(['sm-10711']);
    expect(filterTours(TOURS, { maxHours: 6 }).length).toBeGreaterThan(3);
  });
});

describe('Tourenvorschläge: Zeit', () => {
  it('rechnet mit deinem Tempo, sonst mit dem Standard, in 5-Minuten-Schritten', () => {
    const t = by('sm-250');
    const std = hoursOf(t);
    expect(std).toBeGreaterThan(2);
    expect(hoursOf(t, { kmh: 24, climbMh: 900 })).toBeLessThan(std);
    expect(Math.round(std * 60) % 5).toBe(0);
    expect(splitHours(2.75)).toEqual({ h: 2, min: 45 });
  });
});

describe('Tourenvorschläge: Schnee (Faustregel nach Monat und Höhe)', () => {
  it('Hulftegg (1004 m) im November kein Schnee, Flims (1861 m) möglich, Davos (2348 m) wahrscheinlich', () => {
    expect(snowOf(by('sm-33'), 11)).toBeNull();
    expect(snowOf(by('sm-250'), 11)).toBe('possible');
    expect(snowOf(by('sm-332'), 11)).toBe('likely');
    expect(snowOf(by('sm-332'), 7)).toBeNull();
    expect(snowOf(by('sm-33'), 1)).toBe('possible');
  });
  it('trennt «passt jetzt» und «heute nicht»', () => {
    const { fits, notNow } = splitNow(TOURS, 11);
    expect(fits.map((t) => t.id)).toEqual(['sm-33', 'sm-10711', 'sm-250']);
    expect(notNow.map((t) => t.id)).toEqual(['sm-636', 'sm-332']);
    expect(splitNow(TOURS, 7).notNow).toEqual([]);
  });
});

describe('Tourenvorschläge: neu für dich', () => {
  const t = by('sm-33');
  it('ohne eigene Fahrten kein Wert', () => {
    expect(gridOf([])).toBeNull();
    expect(newShare(t, null)).toBeNull();
  });
  it('eine Fahrt auf der ganzen Strecke: nichts neu; eine weit weg: alles neu', () => {
    const same = gridOf([densify(t.line, 50)]);
    expect(newShare(t, same)).toBe(0);
    const far = gridOf([[[46.0, 7.0], [46.01, 7.01]]]);
    expect(newShare(t, far)).toBe(1);
  });
  it('eine halbe Strecke gefahren: etwa die Hälfte neu', () => {
    const half = gridOf([densify(t.line.slice(0, Math.floor(t.line.length / 2)), 50)]);
    const s = newShare(t, half);
    expect(s).toBeGreaterThan(0.35);
    expect(s).toBeLessThan(0.65);
  });
  it('Abstand zum Wohnort', () => {
    expect(awayKm(t, null)).toBeNull();
    const km = awayKm(t, { lat: 47.3769, lon: 8.5417 });
    expect(km).toBeGreaterThan(10);
    expect(km).toBeLessThan(40);
  });
});

describe('Tourenvorschläge: «Warum dieser Vorschlag?» und Warnungen', () => {
  it('nennt Zeit, Schnee, Stufe, neu und Abstand', () => {
    const t = by('sm-332');
    const w = whyOf(t, { month: 11, maxHours: 3, pace: null, grid: gridOf([[[46.0, 7.0]]]), home: { lat: 47.38, lon: 8.54 } });
    expect(w.map((x) => x.k)).toEqual(['time', 'snow', 'level', 'new', 'away']);
    expect(w.find((x) => x.k === 'time').tone).toBe('warn');
    expect(w.find((x) => x.k === 'snow').state).toBe('likely');
    expect(w.find((x) => x.k === 'new').share).toBe(100);
  });
  it('eine ruhige Tour hat keine Warnung', () => {
    const t = by('sm-33');
    expect(warnsOf(t, 11)).toEqual([{ k: 'level' }]); // Kondition schwierig
    expect(warnsOf(by('sm-10711'), 11)).toEqual([]);
    expect(whyOf(by('sm-10711'), { month: 11 }).find((x) => x.k === 'snow').tone).toBe('ok');
  });
});

describe('Tourenvorschläge: GPX', () => {
  it('schreibt eine Spur mit Höhe', () => {
    const g = gpxOf(by('sm-33'));
    expect(g).toContain('<trkpt');
    expect(g).toContain('<ele>');
    expect(g).toContain('Winterthur');
  });
});
