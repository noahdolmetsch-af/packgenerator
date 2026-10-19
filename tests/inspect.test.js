// «Velo-Inspektion» (Noah 19.10.2026 «1a 2a 3a 4a 5a»): checklist, own points and areas, due rules with
// rain and trail weights, chain trend, what a finished inspection writes. Fictional data only.
import { describe, it, expect } from 'vitest';
import { ITEMS, ITEM, AREAS, LEVELS, LINKS, WHO } from '../src/lib/inspect/items.js';
import { TORQUE } from '../src/lib/spick.js';
import { PART } from '../src/lib/care.js';
import {
  normList, areasOf, allPoints, checklist, pointsIn, renamePoint, deletePoint, addPoint, movePoint, setArea, renameArea, addArea, deleteArea, moveArea, listChanged,
  bikeSettings, rideKind, loadSince, lastOf, levelState, afterRain, inspectState, readValue, valueState, chainTrend, finishPlan, progress, setResult, FACTOR, addDays,
} from '../src/lib/inspect/inspect.js';
import { parseRain, mergeRain, wetSet, rainStale, rainUrl } from '../src/lib/inspect/rain.js';

const TODAY = '2026-10-19';

describe('the template', () => {
  it('every point is complete and points at things that exist', () => {
    const areas = new Set(AREAS.map((a) => a.id));
    const torque = new Set(TORQUE.map((x) => x.key));
    const ids = new Set();
    for (const p of ITEMS) {
      expect(ids.has(p.id), p.id).toBe(false);
      ids.add(p.id);
      expect(areas.has(p.area), p.id).toBe(true);
      expect(LEVELS.some((l) => l.key === p.level), p.id).toBe(true);
      expect(p.steps.length, p.id).toBeGreaterThan(0);
      expect(WHO.some((w) => w.key === p.who), p.id).toBe(true);
      for (const k of p.torque ?? []) expect(torque.has(k), `${p.id} ${k}`).toBe(true);
      for (const k of p.links) expect(LINKS[k], `${p.id} ${k}`).toBeTruthy();
      if (p.part) expect(PART[p.part], `${p.id} ${p.part}`).toBeTruthy();
    }
    for (const l of Object.values(LINKS)) expect(l.url).toMatch(/^https:\/\//);
  });
  it('each level has points; the bigger level holds the smaller', () => {
    const q = checklist(null, 'quick', 'gravel').flatMap((g) => g.points).length;
    const m = checklist(null, 'monthly', 'gravel').flatMap((g) => g.points).length;
    const f = checklist(null, 'full', 'gravel').flatMap((g) => g.points).length;
    expect(q).toBeGreaterThan(2);
    expect(m).toBeGreaterThan(q);
    expect(f).toBeGreaterThan(m);
  });
  it('a road bike without fork gets no suspension points; a full suspension gets the linkage', () => {
    const road = checklist(null, 'full', 'road', () => false).flatMap((g) => g.points).map((p) => p.id);
    expect(road).not.toContain('sag');
    expect(road).not.toContain('dropper');
    const mtb = checklist(null, 'full', 'mtb', () => true).flatMap((g) => g.points).map((p) => p.id);
    expect(mtb).toContain('linkage');
    expect(mtb).toContain('sag');
  });
});

describe('own checklist (rule 18 and «Gruppen überall»)', () => {
  it('rename, delete, add and move points; Standard comes back', () => {
    let l = renamePoint(null, 'pressure', 'Luftdruck messen');
    expect(allPoints(l).find((p) => p.id === 'pressure').name).toBe('Luftdruck messen');
    l = renamePoint(l, 'pressure', '');
    expect(allPoints(l).find((p) => p.id === 'pressure').name).toBeNull();
    l = deletePoint(l, 'wash');
    expect(allPoints(l).some((p) => p.id === 'wash')).toBe(false);
    const r = addPoint(l, { name: 'test_data_ip_Klingel', area: 'extras', level: 'quick' }, 1);
    expect(r.id).toBeTruthy();
    expect(checklist(r.list, 'quick', 'road').flatMap((g) => g.points).some((p) => p.id === r.id)).toBe(true);
    const before = pointsIn(r.list, 'extras').map((p) => p.id);
    const moved = movePoint(r.list, 'extras', before.length - 1, 0);
    expect(pointsIn(moved, 'extras')[0].id).toBe(r.id);
    const gone = deletePoint(moved, r.id);
    expect(allPoints(gone).some((p) => p.id === r.id)).toBe(false);
    expect(listChanged(null)).toBe(false);
    expect(listChanged(gone)).toBe(true);
    expect(addPoint(null, { name: '  ' }).id).toBeNull();
  });
  it('areas: rename, add, reorder; delete hands the points to «Ohne Gruppe» or another area', () => {
    let l = renameArea(null, 'extras', 'Zubehör');
    expect(areasOf(l).find((a) => a.id === 'extras').name).toBe('Zubehör');
    const r = addArea(l, 'test_data_ia_Werkstatt', 2);
    l = r.list;
    expect(areasOf(l).at(-1).id).toBe(r.id);
    l = moveArea(l, areasOf(l).length - 1, 0);
    expect(areasOf(l)[0].id).toBe(r.id);
    const lights = deleteArea(l, 'extras', null);
    expect(areasOf(lights).some((a) => a.id === 'extras')).toBe(false);
    expect(allPoints(lights).find((p) => p.id === 'lights').area).toBe('');
    expect(checklist(lights, 'monthly', 'road').at(-1).area.id).toBe('');
    const to = deleteArea(l, 'extras', r.id);
    expect(allPoints(to).find((p) => p.id === 'lights').area).toBe(r.id);
    const own = deleteArea(to, r.id, null);
    expect(areasOf(own).some((a) => a.id === r.id)).toBe(false);
    expect(allPoints(own).find((p) => p.id === 'lights').area).toBe('');
    expect(normList(null).areasGone).toEqual([]);
  });
  it('setArea: back to its own area removes the mark', () => {
    const l = setArea(null, 'lights', 'frame');
    expect(allPoints(l).find((p) => p.id === 'lights').area).toBe('frame');
    expect(normList(setArea(l, 'lights', 'extras')).moved).toEqual({});
  });
});

describe('when an inspection is due (3a)', () => {
  const bike = { id: 'b1', km: 3000 };
  const done = (date, level, km = null) => ({ id: `i-${date}`, bikeId: 'b1', date, level, km, done: true, results: [] });
  const ride = (date, km, type = '') => ({ id: `r-${date}-${km}`, bikeId: 'b1', date, km, kind: 'ride', state: 'counted', type });

  it('settings: standard intervals, own ones, switched off', () => {
    expect(bikeSettings({}).every.full).toEqual({ km: 1500, days: 90 });
    expect(bikeSettings({ inspect: { every: { monthly: { km: 800, days: null } } } }).every.monthly).toEqual({ km: 800, days: null });
    expect(bikeSettings({ inspect: { factors: false } }).factors).toBe(false);
  });
  it('ride kinds from the Strava type, else from the bike', () => {
    expect(rideKind({ type: 'Mountain Bike Ride' })).toBe('trail');
    expect(rideKind({ type: 'Gravel Ride' })).toBe('gravel');
    expect(rideKind({ type: 'Ride' }, 'mtb')).toBe('trail');
    expect(rideKind({ type: 'Road' }, 'mtb')).toBe('');
  });
  it('weights: rain ×1.5, trail ×1.3, both together; off counts plain km', () => {
    const entries = [ride('2026-10-02', 100, 'Mountain Bike Ride'), ride('2026-10-03', 100, 'Ride'), ride('2026-09-01', 50)];
    const wet = new Set(['2026-10-02']);
    const l = loadSince(entries, 'b1', '2026-10-01', { wetDays: wet });
    expect(l.km).toBe(200);
    expect(l.load).toBe(Math.round(100 * FACTOR.wet * FACTOR.trail + 100));
    expect(l.wet).toBe(1);
    expect(l.trail).toBe(1);
    expect(loadSince(entries, 'b1', '2026-10-01', { wetDays: wet, factors: false }).load).toBe(200);
  });
  it('never inspected: no reminder; at the start of the season the full one is suggested', () => {
    expect(levelState(bike, 'full', { today: TODAY }).due).toBe(false);
    expect(levelState(bike, 'full', { today: TODAY }).never).toBe(true);
    const spring = levelState(bike, 'full', { today: '2026-03-20' });
    expect(spring.due).toBe(true);
    expect(spring.by).toBe('season');
  });
  it('due by days, by weighted km; a full one counts for the monthly one', () => {
    const ins = [done('2026-07-01', 'full')];
    const st = levelState(bike, 'full', { inspections: ins, today: TODAY });
    expect(st.due).toBe(true);
    expect(st.by).toBe('days');
    expect(lastOf(ins, 'b1', 'monthly')).toBe(ins[0]);
    const recent = [done('2026-10-01', 'monthly')];
    const entries = [ride('2026-10-05', 300, 'Mountain Bike Ride'), ride('2026-10-06', 100)];
    const wet = new Set(['2026-10-05']);
    const m = levelState(bike, 'monthly', { inspections: recent, entries, wetDays: wet, today: TODAY });
    expect(m.load.km).toBe(400);
    expect(m.due).toBe(true);
    expect(m.by).toBe('km');
    expect(m.extra).toBeGreaterThan(0);
    const plain = levelState({ ...bike, inspect: { factors: false } }, 'monthly', { inspections: recent, entries, wetDays: wet, today: TODAY });
    expect(plain.due).toBe(false);
    expect(plain.soon).toBe(true);
  });
  it('no rides in the ledger: the km difference counts; switched off: never due', () => {
    const st = levelState({ id: 'b1', km: 5000 }, 'full', { inspections: [done('2026-10-01', 'full', 3000)], today: TODAY });
    expect(st.due).toBe(true);
    expect(st.load.km).toBe(2000);
    expect(levelState({ id: 'b1', inspect: { off: true } }, 'full', { inspections: [done('2026-01-01', 'full')], today: TODAY }).due).toBe(false);
  });
  it('after rain: a hint for a rainy ride in the last 3 days, gone after an inspection that day', () => {
    const entries = [ride('2026-10-18', 40)];
    const wet = new Set(['2026-10-18']);
    expect(afterRain(bike, { entries, wetDays: wet, today: TODAY })).toEqual({ day: '2026-10-18', n: 1 });
    expect(afterRain(bike, { entries, wetDays: wet, today: TODAY, inspections: [done('2026-10-18', 'quick')] })).toBeNull();
    expect(afterRain(bike, { entries, wetDays: new Set(), today: TODAY })).toBeNull();
    const st = inspectState(bike, { entries, wetDays: wet, today: TODAY, inspections: [{ id: 'd', bikeId: 'b1', date: TODAY, level: 'full', done: false }] });
    expect(st.draft.id).toBe('d');
  });
});

describe('values and trend', () => {
  it('reads typed values', () => {
    expect(readValue('0,35')).toBe(0.35);
    expect(readValue('1.6 mm')).toBe(1.6);
    expect(readValue('')).toBeNull();
    expect(Number.isNaN(readValue('abc'))).toBe(true);
  });
  it('value states: high is worn (chain), low is worn (rotor)', () => {
    expect(valueState(ITEM.chainwear.measure, 0.3)).toBe('ok');
    expect(valueState(ITEM.chainwear.measure, 0.45)).toBe('warn');
    expect(valueState(ITEM.chainwear.measure, 0.5)).toBe('worn');
    expect(valueState(ITEM.rotorF.measure, 1.7)).toBe('ok');
    expect(valueState(ITEM.rotorF.measure, 1.55)).toBe('warn');
    expect(valueState(ITEM.rotorF.measure, 1.4)).toBe('worn');
    expect(valueState(ITEM.pressure.measure, 2)).toBeNull();
  });
  it('chain trend after the last replacement', () => {
    const part = { history: [
      { action: 'check', value: 0.4, km: 100 },
      { action: 'replace', km: 1000 },
      { action: 'check', value: 0.1, km: 1200 },
      { action: 'check', value: 0.3, km: 2200 },
    ] };
    expect(chainTrend(part, 0.5)).toEqual({ kmLeft: 1000, perKkm: 0.2 });
    expect(chainTrend({ history: [{ action: 'check', value: 0.1, km: 10 }] })).toBeNull();
  });
});

describe('a finished inspection', () => {
  it('writes part entries (value only in the part unit) and problems for fix and shop', () => {
    const insp = { id: 'i1', bikeId: 'b1', date: TODAY, level: 'full', km: 1234, results: [
      { id: 'chainwear', state: 'ok', value: 0.3 },
      { id: 'padsF', state: 'fix', value: 0.9, note: 'test_data_ip_links abgefahren' },
      { id: 'hoses', state: 'shop', photos: ['data:image/jpeg;base64,xx'] },
      { id: 'wash', state: 'skip' },
    ] };
    const pts = allPoints(null);
    const plan = finishPlan(insp, pts, { partUnit: (k) => PART[k]?.unit ?? '', name: (p) => p.std });
    const chain = plan.parts.find((x) => x.key === 'chain');
    expect(chain.entry).toMatchObject({ action: 'check', result: 'ok', value: 0.3, km: 1234, inspectionId: 'i1' });
    const pads = plan.parts.find((x) => x.key === 'padsF');
    expect(pads.entry.value).toBeUndefined();
    expect(pads.entry.note).toContain('0,9 mm');
    expect(pads.entry.result).toBe('needed');
    expect(plan.problems).toEqual([
      expect.objectContaining({ fix: 'self', part: 'padsF', text: expect.stringContaining('abgefahren') }),
      expect.objectContaining({ fix: 'shop', photo: 'data:image/jpeg;base64,xx' }),
    ]);
  });
  it('progress and results', () => {
    const pts = allPoints(null).slice(0, 4);
    let i = setResult({ results: [] }, pts[0].id, { state: 'ok' });
    i = setResult(i, pts[0].id, { note: 'x' });
    expect(i.results).toEqual([{ id: pts[0].id, state: 'ok', note: 'x' }]);
    expect(progress(i, pts)).toEqual({ done: 1, total: 4 });
  });
});

describe('rain at the home place', () => {
  it('parses, merges, keeps a year, marks rainy days', () => {
    const fresh = parseRain({ daily: { time: ['2026-10-17', '2026-10-18'], precipitation_sum: [0.2, 6.4] } });
    expect(fresh).toEqual({ '2026-10-17': 0.2, '2026-10-18': 6.4 });
    const merged = mergeRain({ '2024-01-01': 3, '2026-10-17': 9 }, fresh, TODAY);
    expect(merged).toEqual(fresh);
    expect([...wetSet(merged)]).toEqual(['2026-10-18']);
    expect(parseRain(null)).toEqual({});
  });
  it('fetches again after 12 hours or for another place', () => {
    const place = { lat: 47.1, lon: 8.5 };
    const now = Date.parse('2026-10-19T12:00:00Z');
    expect(rainStale(null, place, now)).toBe(true);
    expect(rainStale({ lat: 47.1, lon: 8.5, at: '2026-10-19T06:00:00Z' }, place, now)).toBe(false);
    expect(rainStale({ lat: 47.1, lon: 8.5, at: '2026-10-18T06:00:00Z' }, place, now)).toBe(true);
    expect(rainStale({ lat: 46, lon: 8.5, at: '2026-10-19T06:00:00Z' }, place, now)).toBe(true);
    expect(rainUrl(place)).toContain('past_days=92');
    expect(addDays(TODAY, 3)).toBe('2026-10-22');
  });
});

describe('parts hidden on a bike (Paket I)', () => {
  it('a hidden part hides its points', () => {
    const ids = checklist(null, 'full', 'gravel', (k) => k !== 'rotorF' && k !== 'fork').flatMap((g) => g.points).map((p) => p.id);
    expect(ids).not.toContain('rotorF');
    expect(ids).toContain('rotorR');
    expect(ids).not.toContain('sag');
  });
});
