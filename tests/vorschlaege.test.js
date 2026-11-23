import { describe, it, expect } from 'vitest';
import TOURS from '../src/lib/vorschlaege/data/netz.js';
import KANTONE from '../src/lib/vorschlaege/data/kantone.js';
import { FRAME, lv95, toXY, pathOf, ZURICH, countBy, sizes } from '../src/lib/vorschlaege/karte.js';
import { REGIONS, LEVELS, COND_STD, ARTS, artsOf, levelsOf, condOf, matchCond, matchTech, sortNear, nearKm, hoursOf, splitHours, snowOf, filterTours, splitNow, gridOf, densify, newShare, awayKm, whyOf, warnsOf, gpxOf } from '../src/lib/vorschlaege/regeln.js';

const by = (id) => TOURS.find((t) => t.id === id);

const PILOT = ['sm-33', 'sm-10711', 'sm-250', 'sm-636', 'sm-332'];
/** The five pilot tours in their old order (the other tests keep their numbers). */
const P = PILOT.map(by);
const ids = (o, list = TOURS) => filterTours(list, o).map((t) => t.id);

describe('Tourenvorschläge: die Daten', () => {
  it('hat 200 Touren, je mit Linie, Höhenprofil, Untergrund und Kanton', () => {
    expect(TOURS.length).toBe(200);
    expect(new Set(TOURS.map((t) => t.id)).size).toBe(200);
    for (const t of TOURS) {
      expect(t.line.length).toBeGreaterThan(20);
      expect(t.ele.length).toBe(t.cls.length);
      expect(t.ele.length).toBeGreaterThan(10);
      expect(t.single + t.unpaved + t.paved).toBeGreaterThanOrEqual(98);
      expect(REGIONS.map((r) => r.key)).toContain(t.region);
      expect(Number.isFinite(t.dz)).toBe(true);
      for (const l of levelsOf(t)) expect(LEVELS).toContain(l);
    }
  });
  it('die fünf Pilot-Touren bleiben mit ihren Nummern', () => {
    for (const id of PILOT) expect(by(id)).toBeTruthy();
    expect(by('sm-33').title).toBe('Winterthur → Hulftegg');
  });
  it('liegt in der Schweiz und verteilt sich auf viele Kantone', () => {
    for (const t of TOURS) {
      const [la, lo] = t.line[0];
      expect(la).toBeGreaterThan(45.7);
      expect(la).toBeLessThan(47.9);
      expect(lo).toBeGreaterThan(5.9);
      expect(lo).toBeLessThan(10.6);
    }
    const n = {};
    for (const t of TOURS) n[t.region] = (n[t.region] ?? 0) + 1;
    expect(Object.keys(n).length).toBeGreaterThanOrEqual(20);
    expect(by('sm-332').single).toBeGreaterThan(40);
  });
  it('alle offiziell schweren Etappen sind dabei, dazu die stärksten «mittel» (best, in Kantonen ohne schwere Tour) und mittlere mit viel Aufstieg', () => {
    const best = TOURS.filter((t) => t.best);
    expect(best.length).toBeGreaterThanOrEqual(5);
    for (const t of best) {
      expect(t.cond).toBe('medium');
      expect(TOURS.filter((x) => x.region === t.region && x.cond === 'difficult')).toEqual([]);
    }
    expect(TOURS.filter((t) => t.cond === 'difficult').length).toBeGreaterThanOrEqual(125);
    for (const t of TOURS.filter((x) => x.cond === 'medium' && !x.best && !PILOT.includes(x.id))) expect(t.up).toBeGreaterThanOrEqual(900);
  });
});

describe('Tourenvorschläge: Stufen und Reihenfolge', () => {
  it('Standard: nur schwere Kondition (Noah 23.11.2026); Technik schränkt nur ein', () => {
    expect(COND_STD).toEqual(['difficult']);
    expect(ids({}, P)).toEqual(['sm-33', 'sm-332']);
    expect(ids({ conds: ['medium'] }, P)).toEqual(['sm-250', 'sm-636']);
    expect(ids({ conds: [] }, P).length).toBe(5);
    expect(ids({ techs: ['difficult'] }, P)).toEqual(['sm-332']);
    expect(ids({ conds: [], techs: ['medium'] }, P).sort()).toEqual(['sm-10711', 'sm-33', 'sm-636']);
  });
  it('eine Abfahrt hat keine Kondition: sie zählt als leicht und hat nur Technik', () => {
    const d = by('sm-10711');
    expect(levelsOf(d)).toEqual(['medium']);
    expect(condOf(d)).toBe('easy');
    expect(matchCond(d, ['difficult'], [])).toBe(false);
    expect(matchCond(d, ['easy'], [])).toBe(true);
    expect(matchTech(d, ['medium'])).toBe(true);
    expect(matchTech(d, ['difficult'])).toBe(false);
  });
  it('die stärkste Tour eines gewählten Kantons zeigt sich auch bei «schwer», sonst nicht', () => {
    const b = TOURS.find((t) => t.best);
    expect(ids({}).includes(b.id)).toBe(false);
    expect(ids({ regions: [b.region] })).toEqual([b.id]);
  });
  it('Kanton, Zeit und ausgeblendete Touren', () => {
    expect(ids({ regions: ['zh'], conds: [] }, P)).toEqual(['sm-10711', 'sm-33']); // nearest first
    expect(ids({ regions: ['gr'], conds: [], hidden: ['sm-250'] }, P)).toEqual(['sm-636', 'sm-332']);
    expect(ids({ maxHours: 1, conds: [] }, P)).toEqual(['sm-10711']);
    expect(ids({ maxHours: 6 }).length).toBeGreaterThan(10);
  });
  it('zuerst die Nächsten: ohne Wohnort ab Zürich Hauptbahnhof, mit Wohnort ab dort', () => {
    const list = sortNear(TOURS, null);
    for (let i = 1; i < list.length; i++) expect(list[i - 1].dz).toBeLessThanOrEqual(list[i].dz);
    expect(nearKm(by('sm-33'), null)).toBe(by('sm-33').dz);
    const home = { lat: 46.8, lon: 9.83 }; // Davos
    expect(sortNear(TOURS, home)[0].region).toBe('gr');
    expect(ids({}, TOURS)[0]).toBe(sortNear(TOURS, null).find((t) => t.cond === 'difficult').id);
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
    const { fits, notNow } = splitNow(P, 11);
    expect(fits.map((t) => t.id)).toEqual(['sm-33', 'sm-10711', 'sm-250']);
    expect(notNow.map((t) => t.id)).toEqual(['sm-636', 'sm-332']);
    expect(splitNow(P, 7).notNow).toEqual([]);
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

describe('Tourenvorschläge: Art und Start', () => {
    it('Art: Singletrail, Abfahrt, Schotter und Wege, Runde', () => {
    expect(artsOf(by('sm-332'))).toEqual(['trail', 'loop']);
    expect(artsOf(by('sm-10711'))).toEqual(['trail', 'downhill']);
    expect(artsOf(by('sm-33'))).toEqual(['gravel']);
    expect(artsOf(by('sm-636'))).toEqual(['gravel', 'loop']);
    for (const t of TOURS) for (const k of artsOf(t)) expect(ARTS).toContain(k);
  });
  it('filtert nach Art (eine genügt); ohne Wahl alle', () => {
    expect(ids({ conds: [], arts: ['downhill'] }, P)).toEqual(['sm-10711']);
    expect(ids({ conds: [], arts: ['trail'] }, P)).toEqual(['sm-10711', 'sm-332']);
    expect(ids({ conds: [], arts: ['loop', 'downhill'] }, P)).toEqual(['sm-10711', 'sm-250', 'sm-636', 'sm-332']);
    expect(ids({ conds: [], arts: [] }, P).length).toBe(5);
  });
  it('Start: bis x km vom Wohnort, ohne Wohnort kein Filter', () => {
    const home = { lat: 47.3769, lon: 8.5417 };
    expect(ids({ conds: [], maxAway: 30, home }, P)).toEqual(['sm-10711', 'sm-33']);
    expect(ids({ conds: [], maxAway: 30, home: null }, P).length).toBe(5);
    expect(ids({ conds: [], maxAway: 100, home }, P).length).toBeGreaterThanOrEqual(2);
  });
});

describe('Tourenvorschläge: die Karte', () => {
  it('rechnet Breite und Länge in das Landesnetz um (Zürich HB und Bern)', () => {
    const [e, n] = lv95(47.3779, 8.5403);
    expect(Math.abs(e - 2683260)).toBeLessThan(300);
    expect(Math.abs(n - 1247900)).toBeLessThan(300);
    const [be, bn] = lv95(46.9511, 7.4386);
    expect(Math.abs(be - 2600000)).toBeLessThan(300);
    expect(Math.abs(bn - 1200000)).toBeLessThan(100);
  });
  it('legt Zürich und jede Tour in den Rahmen 1440 × 900', () => {
    expect(FRAME.w).toBe(1440);
    expect(FRAME.h).toBe(900);
    expect(KANTONE.w).toBe(1440);
    expect(ZURICH[0]).toBeGreaterThan(700);
    expect(ZURICH[0]).toBeLessThan(900);
    for (const t of TOURS) {
      const [x, y] = toXY(t.line[0]);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(1440);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(900);
    }
    expect(pathOf(by('sm-33').line)).toMatch(/^M[\d.]+ [\d.]+L/);
  });
  it('hat für jeden Kanton der Touren eine Fläche und eine Beschriftung', () => {
    expect(Object.keys(KANTONE.paths).length).toBe(26);
    for (const t of TOURS) {
      expect(KANTONE.paths[t.region]).toBeTruthy();
      expect(KANTONE.labels[t.region]).toBeTruthy();
    }
    for (const r of REGIONS) expect(KANTONE.paths[r.key]).toBeTruthy();
  });
  it('zählt die Touren je Kanton, und die Zeichengrössen bleiben lesbar', () => {
    expect(countBy(P).gr).toBe(3);
    expect(countBy([]).gr).toBeUndefined();
    expect(sizes(1).dot).toBe(7);
    expect(sizes(0.27).dot).toBeGreaterThan(sizes(1).dot);
    expect(sizes(0.27).font).toBeGreaterThanOrEqual(13);
  });
});
