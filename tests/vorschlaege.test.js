import { describe, it, expect } from 'vitest';
import TOURS from '../src/lib/vorschlaege/data/netz.js';
import KANTONE from '../src/lib/vorschlaege/data/kantone.js';
import { kmMarks, stepFor, lineKm, pointAtKm, nearestOnLine } from '../src/lib/spur/kmmarks.js';
import { fineOfTour, coarseOfTour, kmsOf, steepest, stretchOf } from '../src/lib/vorschlaege/steil.js';
import { FRAME, lv95, toXY, pathOf, ZURICH, countBy, sizes, tipPos, TIP } from '../src/lib/vorschlaege/karte.js';
import { crowKm, travelMin, anreiseOf, dayHours, fitsHalfDay, withinTravel, TRAVELS, ZURICH_HB } from '../src/lib/vorschlaege/anreise.js';
import { CELL, cellOf, cellsOf, wetterUrl, parseWetter, dayVerdict, rainBefore, wetTrail, technical, addDays, weekdayOf, dateOfChoice, verdictFor, bestDay, weekOf, sortByWeather, loadWetter, BEST_DAYS } from '../src/lib/vorschlaege/wetter.js';
import { freeToday, formFit, freeFit, bikeFit, doableToday, EASY_MAX_H } from '../src/lib/vorschlaege/passt.js';
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
    expect(w.map((x) => x.k)).toEqual(['time', 'trip', 'snow', 'level', 'new', 'away']);
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

describe('Tourenvorschläge: die Karte zeigt die Zahlen beim Hovern', () => {
  it('die Karte steht über dem Punkt, in der Mitte', () => {
    const p = tipPos([600, 400], [1200, 800]);
    expect(p.below).toBe(false);
    expect(p.left).toBe(600 - p.width / 2);
    expect(p.top).toBe(400 - TIP.gap - TIP.h);
  });
  it('am Rand rutscht sie in die Karte zurück, ganz oben darunter', () => {
    const l = tipPos([5, 400], [1200, 800]);
    expect(l.left).toBeGreaterThanOrEqual(4);
    const r = tipPos([1195, 400], [1200, 800]);
    expect(r.left + r.width).toBeLessThanOrEqual(1200 - 4);
    const top = tipPos([600, 20], [1200, 800]);
    expect(top.below).toBe(true);
    expect(top.top).toBeGreaterThan(20);
  });
  it('auf einer schmalen Karte wird sie schmaler, nie breiter als die Karte', () => {
    const p = tipPos([100, 300], [300, 500]);
    expect(p.width).toBeLessThanOrEqual(300 - 8);
    expect(p.left).toBeGreaterThanOrEqual(4);
  });
});

describe('Tourenvorschläge: km-Marken auf der Tourlinie', () => {
  it('die Schrittweite passt zur Länge', () => {
    expect(stepFor(4)).toBe(1);
    expect(stepFor(12)).toBe(5);
    expect(stepFor(44)).toBe(10);
    expect(stepFor(130)).toBe(20);
  });
  it('eine Marke alle 10 km, nicht ganz am Ende, in der Reihenfolge der Linie', () => {
    const t = by('sm-33');
    const marks = kmMarks(t.line);
    expect(marks.length).toBeGreaterThanOrEqual(2);
    expect(marks.map((m) => m.km)).toEqual(marks.map((_, i) => (i + 1) * stepFor(t.km)));
    expect(marks.at(-1).km).toBeLessThan(t.km + 1);
    for (const m of marks) expect(m.pos).toHaveLength(2);
  });
  it('ohne Linie gibt es keine Marken', () => {
    expect(kmMarks([])).toEqual([]);
    expect(kmMarks([[47, 8]])).toEqual([]);
  });
});

describe('Tourenvorschläge: Ort auf der Linie (Profil und Karte zeigen dieselbe Stelle)', () => {
  const t = by('sm-33');
  it('die Länge der Linie passt ungefähr zur Tour', () => {
    expect(lineKm(t.line)).toBeGreaterThan(t.km * 0.6);
    expect(lineKm(t.line)).toBeLessThan(t.km * 1.4);
  });
  it('Anfang und Ende der Linie sind ihre Endpunkte', () => {
    expect(pointAtKm(t.line, 0)).toEqual(t.line[0]);
    const end = pointAtKm(t.line, lineKm(t.line));
    expect(Math.abs(end[0] - t.line.at(-1)[0])).toBeLessThan(1e-3);
  });
  it('ein Punkt der Linie liegt bei seinem km und ist nicht entfernt', () => {
    const km = lineKm(t.line) / 2;
    const p = pointAtKm(t.line, km);
    const n = nearestOnLine(t.line, p);
    expect(Math.abs(n.km - km)).toBeLessThan(0.1);
    expect(n.away).toBeLessThan(0.05);
  });
  it('ein Punkt weit weg meldet seine Entfernung', () => {
    expect(nearestOnLine(t.line, [t.line[0][0] + 0.5, t.line[0][1]]).away).toBeGreaterThan(20);
  });
});

describe('Tourenvorschläge: Höhenprofil aus den Höhen', () => {
  const t = by('sm-33');
  it('die km der Höhen liegen gleichmässig von 0 bis zur Länge', () => {
    const ks = kmsOf(t.ele, t.km);
    expect(ks[0]).toBe(0);
    expect(ks.at(-1)).toBeCloseTo(t.km, 6);
  });
  it('grobes und feines Profil haben für jede Höhe einen Punkt oder mehr', () => {
    expect(coarseOfTour(t)).toHaveLength(t.ele.length);
    expect(fineOfTour(t)).toBeTruthy();
  });
  it('ohne Höhen gibt es kein Profil', () => {
    expect(fineOfTour({ ele: [], km: 5 })).toBeNull();
    expect(coarseOfTour({})).toEqual([]);
  });
});

describe('Tourenvorschläge: die steilsten Stücke', () => {
  const flat = { km: 10, ele: Array.from({ length: 101 }, (_, i) => 500 + i) }; // 1 m per 100 m = 1 %
  it('eine flache Tour hat kein steiles Stück', () => {
    expect(steepest(flat)).toEqual([]);
    expect(steepest({ km: 0, ele: [] })).toEqual([]);
  });
  it('ein steiles Stück wird gefunden, mit km, Schnitt und Höhenmetern', () => {
    // km 4–5 climbs 150 m over 1 km = 15 %
    const ele = flat.ele.map((m, i) => (i < 40 ? 500 : i <= 50 ? 500 + (i - 40) * 15 : 650));
    const r = steepest({ km: 10, ele });
    expect(r).toHaveLength(1);
    expect(r[0].fromKm).toBeGreaterThanOrEqual(3.5);
    expect(r[0].toKm).toBeLessThanOrEqual(5.5);
    expect(r[0].avg).toBeGreaterThanOrEqual(12);
    expect(r[0].up).toBeGreaterThan(100);
  });
  it('höchstens drei Stücke, das steilste zuerst, ein Gefälle zählt nicht', () => {
    const ele = [];
    let m = 500;
    for (let i = 0; i <= 200; i++) {
      const up = [20, 60, 100, 140, 180].some((a) => i >= a && i < a + 5) ? 20 + [20, 60, 100, 140, 180].indexOf([20, 60, 100, 140, 180].find((a) => i >= a && i < a + 5)) : 0;
      m += up ? up : i > 190 ? -30 : 0;
      ele.push(m);
    }
    const r = steepest({ km: 20, ele });
    expect(r.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < r.length; i++) expect(r[i - 1].avg).toBeGreaterThanOrEqual(r[i].avg);
    expect(r.every((x) => x.up > 0)).toBe(true);
  });
  it('die Stücke der echten Touren sind plausibel (Prozent, km innerhalb der Tour)', () => {
    for (const t of TOURS) {
      for (const p of steepest(t)) {
        expect(p.fromKm).toBeGreaterThanOrEqual(0);
        expect(p.toKm).toBeLessThanOrEqual(t.km + 0.1);
        expect(p.avg).toBeGreaterThanOrEqual(12);
        expect(p.max).toBeGreaterThanOrEqual(p.avg);
      }
    }
  });
  it('das Stück auf der Linie beginnt und endet an Punkten der Linie', () => {
    const t = by('sm-33');
    const s = stretchOf(t.line, 5, 6, pointAtKm, 1);
    expect(s.length).toBeGreaterThanOrEqual(2);
    expect(nearestOnLine(t.line, s[0]).away).toBeLessThan(0.05);
    expect(nearestOnLine(t.line, s.at(-1)).away).toBeLessThan(0.05);
  });
});

describe('Tourenvorschläge: Anreise (Schätzung)', () => {
  it('rechnet ÖV mit Velo und Auto aus der Luftlinie, in 5-Minuten-Schritten', () => {
    expect(travelMin(0, 'pt')).toBe(30);
    expect(travelMin(100, 'pt')).toBe(105);
    expect(travelMin(100, 'car')).toBe(105);
    expect(travelMin(20, 'car')).toBeLessThan(travelMin(20, 'pt'));
    for (const km of [3, 17, 66, 143]) expect(travelMin(km, 'pt') % 5).toBe(0);
    expect(crowKm([47, 8], [47, 8])).toBe(0);
    expect(Math.round(crowKm([47.0, 8.0], [48.0, 8.0]))).toBe(111);
  });
  it('ohne Wohnort ab Zürich Hauptbahnhof; eine Strecke kommt vom Ende zurück, eine Runde vom Start', () => {
    const one = by('sm-33'); // Winterthur → Hulftegg, Einweg
    const a = anreiseOf(one, null, 'pt');
    expect(a.fromHome).toBe(false);
    expect(a.outKm).toBeGreaterThan(10);
    expect(a.backKm).not.toBe(a.outKm);
    const loop = by('sm-332'); // Davos, Runde
    const b = anreiseOf(loop, { lat: ZURICH_HB.lat, lon: ZURICH_HB.lon }, 'pt');
    expect(b.fromHome).toBe(true);
    expect(b.out).toBe(b.back);
    expect(anreiseOf({ line: [] }, null)).toBeNull();
  });
  it('ganzer Tag und halber Tag', () => {
    const a = { out: 60, back: 90 };
    expect(dayHours(4, a)).toBe(6.5);
    expect(dayHours(4, null)).toBe(4);
    expect(fitsHalfDay(2, { out: 30, back: 30 })).toBe(true);
    expect(fitsHalfDay(4, a)).toBe(false);
  });
  it('Filter: die längste Anreise (hin oder zurück) bis x Minuten; ohne Wahl alle', () => {
    expect(withinTravel({ out: 60, back: 90 }, 60)).toBe(false);
    expect(withinTravel({ out: 60, back: 90 }, 120)).toBe(true);
    expect(withinTravel({ out: 60, back: 90 }, null)).toBe(true);
    const all = filterTours(TOURS, { conds: [] });
    const near = filterTours(TOURS, { conds: [], maxTravel: TRAVELS[0] });
    expect(near.length).toBeGreaterThan(0);
    expect(near.length).toBeLessThan(all.length);
    for (const t of near) {
      const a = anreiseOf(t, null, 'pt');
      expect(Math.max(a.out, a.back)).toBeLessThanOrEqual(60);
    }
    expect(filterTours(TOURS, { conds: [], maxTravel: 60, mode: 'car' }).length).toBeGreaterThanOrEqual(near.length);
  });
  it('«Warum dieser Vorschlag?» nennt die Anreise und den ganzen Tag', () => {
    const w = whyOf(by('sm-33'), { month: 11, mode: 'pt' }).find((x) => x.k === 'trip');
    expect(w.out).toBeGreaterThan(0);
    expect(w.day).toBeGreaterThan(w.out / 60);
    expect(typeof w.half).toBe('boolean');
    const far = whyOf(by('sm-332'), { month: 11, mode: 'pt' }).find((x) => x.k === 'trip');
    expect(far.half).toBe(false);
    expect(far.tone).toBe('warn');
  });
});

describe('Tourenvorschläge: passt zu dir', () => {
  // 23.11.2026, 08:00 Zürich (UTC+1); Sonnenuntergang 16:30
  const OFF = 3600;
  const at = (h, m = 0) => Date.parse('2026-11-23T00:00:00Z') + (h * 60 + m) * 6e4 - OFF * 1000;
  const core = { offset: OFF, days: [{ date: '2026-11-23', set: at(16, 30), rise: at(7, 45) }] };
  const now = at(8, 0);

  it('freie Zeit: von jetzt plus Bereitmachen bis Sonnenuntergang', () => {
    const w = freeToday(core, [], [], now);
    expect(w.start).toBe(at(8, 30));
    expect(w.end).toBe(at(16, 30));
    expect(w.until).toBe('sunset');
    expect(w.hours).toBeCloseTo(8, 5);
  });
  it('freie Zeit: ein eigener Termin begrenzt das Fenster; ohne Wetterdaten gibt es keins', () => {
    const items = [{ kind: 'date', day: '2026-11-23', time: '12:00', mins: 60, title: 'Zahnarzt' }];
    const w = freeToday(core, [], items, now);
    expect(w.end).toBe(at(12, 0));
    expect(w.until).toBe('date');
    expect(w.hours).toBeCloseTo(3.5, 5);
    expect(freeToday(null, [], [], now)).toBeNull();
  });
  it('freie Zeit: ein Termin am Anfang schiebt den Start nach hinten', () => {
    const items = [{ kind: 'date', day: '2026-11-23', time: '08:00', mins: 120, title: 'Termin' }];
    const w = freeToday(core, [], items, now);
    expect(w.start).toBe(at(10, 0));
  });
  it('Form: Ruhe warnt immer, leicht warnt bei langen Touren, normal und bereit passen', () => {
    const long = by('sm-332');
    const t = TOURS.find((x) => hoursOf(x) <= EASY_MAX_H && (x.up ?? 0) <= 1200);
    expect(formFit(t, 'rest').tone).toBe('warn');
    expect(formFit(t, 'easy').tone).toBe('ok');
    expect(formFit(long, 'easy').tone).toBe('warn');
    expect(formFit(t, 'normal').key).toBe('fit');
    expect(formFit(t, 'hard').tone).toBe('ok');
    expect(formFit(t, null)).toBeNull();
  });
  it('freie Zeit gegen Tour: der ganze Tag (Fahrt plus Anreise) muss ins Fenster passen', () => {
    const t = by('sm-332');
    const small = freeFit(t, { hours: 1, end: at(10), until: 'date' });
    expect(small.tone).toBe('warn');
    const big = freeFit(t, { hours: 24, end: at(23), until: 'late' });
    expect(big.tone).toBe('ok');
    expect(freeFit(t, null)).toBeNull();
  });
  it('Velo: mit Mountainbike passt es, ohne warnt es, ohne Velos sagt es nichts', () => {
    expect(bikeFit([])).toBeNull();
    expect(bikeFit([{ id: 1, kind: 'mtb' }]).key).toBe('mtb');
    expect(bikeFit([{ id: 2, kind: 'road' }]).key).toBe('nomtb');
    expect(bikeFit([{ id: 3, kind: 'mtb', retired: true }])).toBeNull();
  });
  it('heute machbar: Ruhe sagt nein; mit Fenster zählt der ganze Tag; ohne Angaben ja', () => {
    const t = by('sm-332');
    expect(doableToday(t, {})).toBe(true);
    expect(doableToday(t, { level: 'rest' })).toBe(false);
    expect(doableToday(t, { level: 'hard', win: { hours: 1, end: at(10), until: 'date' } })).toBe(false);
    expect(doableToday(t, { level: 'hard', win: { hours: 24, end: at(23), until: 'late' } })).toBe(true);
  });
  it('«Warum dieser Vorschlag?» hat die Zeilen frei, Form und Velo nur, wenn die App sie kennt', () => {
    const t = by('sm-33');
    const ks = (c) => whyOf(t, { month: 11, ...c }).map((r) => r.k);
    expect(ks({})).not.toContain('free');
    expect(ks({})).not.toContain('form');
    expect(ks({})).not.toContain('bike');
    const all = ks({ win: { hours: 5, end: at(14), until: 'date' }, form: 'normal', bikes: [{ id: 1, kind: 'mtb' }] });
    expect(all).toEqual(expect.arrayContaining(['free', 'form', 'bike']));
    expect(all.indexOf('free')).toBeLessThan(all.indexOf('snow'));
  });
  it('filterTours: ok(t) engt zusätzlich ein', () => {
    const base = filterTours(TOURS, { conds: [] });
    const some = filterTours(TOURS, { conds: [], ok: (t) => t.region === 'gr' });
    expect(some.length).toBeGreaterThan(0);
    expect(some.length).toBeLessThan(base.length);
  });
});

describe('Tourenvorschläge: Wetter', () => {
  const day = (o = {}) => ({ date: '2026-11-24', code: 3, tmax: 12, tmin: 4, rain: 0, chance: 10, gust: 20, ...o });
  const tour = { id: 't', line: [[47.4, 8.5]], max: 900, single: 10, tech: 'easy' };
  const cell = cellOf(tour);
  const mk = (days, elevation = 500) => ({ [cell]: { elevation, days } });

  it('die Zelle ist der Start der Tour, alle Touren haben eine', () => {
    expect(cell).toBe(`${Math.round(47.4 / CELL)}:${Math.round(8.5 / CELL)}`);
    expect(cellOf({})).toBe(null);
    expect(TOURS.every((t) => cellOf(t))).toBe(true);
    const cells = cellsOf(TOURS);
    expect(cells.length).toBeGreaterThan(5);
    expect(cells.length).toBeLessThan(120);
    expect(cellsOf(TOURS)).toEqual(cells);
  });
  it('eine Anfrage für alle Zellen, ohne Wohnort', () => {
    const u = wetterUrl(cellsOf(TOURS));
    expect(u).toContain('past_days=2');
    expect(u).toContain('precipitation_sum');
    expect(u.length).toBeLessThan(4000);
  });
  it('parseWetter: eine Liste von Orten und ein einzelner Ort', () => {
    const one = { elevation: 450, daily: { time: ['2026-11-24'], weather_code: [3], temperature_2m_max: [10], temperature_2m_min: [2], precipitation_sum: [1.2], precipitation_probability_max: [30], wind_gusts_10m_max: [25] } };
    const r = parseWetter([one, one], ['1:1', '2:2']);
    expect(Object.keys(r)).toEqual(['1:1', '2:2']);
    expect(r['1:1'].days[0]).toEqual({ date: '2026-11-24', code: 3, tmax: 10, tmin: 2, rain: 1.2, chance: 30, gust: 25 });
    expect(Object.keys(parseWetter(one, ['9:9']))).toEqual(['9:9']);
    expect(parseWetter(null, ['1:1'])).toEqual({});
  });
  it('dayVerdict: Ampel nach Gewitter, Regen, Wind, Kälte oben und Hitze', () => {
    expect(dayVerdict(day(), tour, 500).level).toBe('good');
    expect(dayVerdict(day({ rain: 3 }), tour, 500)).toMatchObject({ level: 'fair', reasons: ['rain'] });
    expect(dayVerdict(day({ rain: 9 }), tour, 500)).toMatchObject({ level: 'bad', reasons: ['rain'] });
    expect(dayVerdict(day({ code: 95 }), tour, 500)).toMatchObject({ level: 'bad', reasons: ['thunder'] });
    expect(dayVerdict(day({ gust: 50 }), tour, 500)).toMatchObject({ level: 'fair', reasons: ['wind'] });
    expect(dayVerdict(day({ gust: 80 }), tour, 500)).toMatchObject({ level: 'bad', reasons: ['wind'] });
    expect(dayVerdict(day({ tmax: 34 }), tour, 500)).toMatchObject({ level: 'fair', reasons: ['hot'] });
    // 400 m höher als der Ort: 2,6 Grad kälter
    expect(dayVerdict(day({ tmax: 5 }), tour, 500).top).toBe(2.4);
    expect(dayVerdict(day({ tmax: 5 }), tour, 500)).toMatchObject({ level: 'fair', reasons: ['cold'] });
    expect(dayVerdict(day({ tmax: -1 }), tour, 500)).toMatchObject({ level: 'bad', reasons: ['cold'] });
    expect(dayVerdict(day({ rain: 9, gust: 50 }), tour, 500).reasons).toEqual(['rain', 'wind']);
    expect(dayVerdict(null, tour, 500)).toBe(null);
    expect(dayVerdict(day({ rain: null, gust: null, code: null }), tour, 500)).toBe(null);
  });
  it('nasse Wege: Regen der zwei Tage davor, rutschig nur bei Trail oder Technik', () => {
    const days = [day({ date: '2026-11-22', rain: 4 }), day({ date: '2026-11-23', rain: 3 }), day()];
    expect(rainBefore(days, 2)).toBe(7);
    expect(rainBefore(days, 0)).toBe(null);
    expect(technical({ single: 50 })).toBe(true);
    expect(technical({ single: 5, tech: 'medium' })).toBe(true);
    expect(technical({ single: 5, tech: 'easy' })).toBe(false);
    expect(wetTrail({ single: 60 }, days, 2)).toEqual({ mm: 7, state: 'slippery' });
    expect(wetTrail({ single: 0, tech: 'easy' }, days, 2)).toEqual({ mm: 7, state: 'fine' });
    expect(wetTrail({ single: 60 }, [day({ rain: 1 }), day({ rain: 1 }), day()], 2)).toBe(null);
  });
  it('Tage rechnen ohne Uhr', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30'); // Zeitumstellung
    expect(weekdayOf('2026-11-28')).toBe(6);
    expect(dateOfChoice('weekend', '2026-11-24')).toBe('2026-11-28');
    expect(dateOfChoice('weekend', '2026-11-28')).toBe('2026-11-28');
    expect(dateOfChoice('weekend', '2026-11-29')).toBe('2026-11-29');
    expect(dateOfChoice('tomorrow', '2026-11-30')).toBe('2026-12-01');
    expect(dateOfChoice('x', '2026-11-30')).toBe(null);
  });
  it('verdictFor, bestDay und weekOf: der beste Tag ist der erste gute, sonst der erste mit Vorsicht', () => {
    const days = ['24', '25', '26', '27', '28'].map((d, i) => day({ date: `2026-11-${d}`, rain: [9, 3, 0, 0, 0][i] }));
    const wx = mk(days);
    expect(verdictFor(tour, wx, 'today', '2026-11-24').level).toBe('bad');
    expect(verdictFor(tour, wx, 'tomorrow', '2026-11-24').level).toBe('fair');
    expect(verdictFor(tour, wx, 'weekend', '2026-11-24')).toMatchObject({ date: '2026-11-28', level: 'good' });
    expect(bestDay(tour, wx, '2026-11-24')).toMatchObject({ date: '2026-11-26', level: 'good' });
    const onlyFair = mk(days.map((d) => ({ ...d, rain: 3 })));
    expect(bestDay(tour, onlyFair, '2026-11-24')).toMatchObject({ date: '2026-11-24', level: 'fair' });
    expect(bestDay(tour, mk(days.map((d) => ({ ...d, rain: 12 }))), '2026-11-24')).toBe(null);
    expect(bestDay(tour, null, '2026-11-24')).toBe(null);
    expect(BEST_DAYS).toBe(10);
    const w = weekOf(tour, wx, '2026-11-24');
    expect(w.map((x) => x.level)).toEqual(['bad', 'fair', 'good', 'good', 'good']);
    expect(w[2].trail).toEqual({ mm: 12, state: 'fine' }); // 9 + 3 mm an den zwei Tagen davor
    expect(w[4].trail).toBe(null);
  });
  it('sortByWeather: gute Tage zuerst, schlechte und ohne Daten dahinter, stabil', () => {
    const a = { ...tour, id: 'a', line: [[47.4, 8.5]] };
    const b = { ...tour, id: 'b', line: [[46.0, 7.0]] };
    const c = { ...tour, id: 'c', line: [[47.4, 8.5]] };
    const wx = { [cellOf(a)]: { elevation: 500, days: [day({ rain: 9 })] }, [cellOf(b)]: { elevation: 500, days: [day()] } };
    expect(sortByWeather([a, b, c], wx, 'today', '2026-11-24').map((x) => x.id)).toEqual(['b', 'a', 'c']);
  });
  it('whyOf: die Zeile «weather» nur mit Vorhersage', () => {
    const t0 = by('sm-33');
    expect(whyOf(t0, { month: 11 }).some((x) => x.k === 'weather')).toBe(false);
    const w = whyOf(t0, { month: 11, weather: { today: { level: 'bad', reasons: ['rain'] }, best: { date: '2026-11-26' } } }).find((x) => x.k === 'weather');
    expect(w).toMatchObject({ tone: 'warn', level: 'bad', reasons: ['rain'] });
  });
  it('loadWetter: hält die Antwort drei Stunden, bei Ausfall die alte bis zu einem Tag', async () => {
    const rows = new Map();
    const db = { meta: { get: async (k) => rows.get(k), put: async (r) => rows.set(r.key, r) } };
    const two = [by('sm-33'), by('sm-10711')];
    const cells = cellsOf(two);
    const reply = () => cells.map(() => ({ elevation: 500, daily: { time: ['2026-11-24'], weather_code: [3], temperature_2m_max: [10], temperature_2m_min: [2], precipitation_sum: [0], precipitation_probability_max: [0], wind_gusts_10m_max: [20] } }));
    let n = 0;
    const fetcher = async () => { n++; return { ok: true, json: async () => (cells.length === 1 ? reply()[0] : reply()) }; };
    const t0 = 1_700_000_000_000;
    const first = await loadWetter(db, two, { fetcher, now: t0, online: true });
    expect(Object.keys(first)).toEqual(cells);
    await loadWetter(db, two, { fetcher, now: t0 + 2 * 36e5, online: true });
    expect(n).toBe(1);
    const down = async () => { throw new Error('offline'); };
    expect(await loadWetter(db, two, { fetcher: down, now: t0 + 5 * 36e5, online: true })).toEqual(first);
    expect(await loadWetter(db, two, { fetcher: down, now: t0 + 30 * 36e5, online: true })).toBe(null);
    expect(await loadWetter(db, [], { fetcher, now: t0 })).toBe(null);
  });
});
