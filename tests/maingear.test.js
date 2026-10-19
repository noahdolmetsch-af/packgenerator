// «Ausrüstung» (mockup AU1, Noah 15.10.2026 «1-5a»): main equipment per sport, its counter and care.
// Fictional data only; dates as calendar days.
import { describe, it, expect } from 'vitest';
import { sportsOf, careSuggest, unitSuggest, mainOf, markOf, usesOf, countOf, careState, careDone, addUse, rowOf, equipmentRows, groupsOf, dueCare, seasonStart } from '../src/lib/maingear.js';
import { seedActs } from '../src/lib/flow.js';

const TODAY = '2026-10-15';
const acts = seedActs();
const ski = { id: 'test_ski', name: 'Tourenski Test', category: 'other', ownership: 'owned', main: { sport: 'dom:ski', unit: 'uses', since: '2025-11-01', care: [{ id: 'wax', name: 'Wax the base', every: 3, unit: 'uses' }, { id: 'edge', name: 'Sharpen the edges', every: 365, unit: 'days' }] } };
const racket = { id: 'test_racket', name: 'Schläger Test', ownership: 'owned', main: { sport: 'act:tennis', unit: 'hours', since: '2026-01-01', care: [{ id: 'str', name: 'Restring', every: 2, unit: 'hours' }] } };
const trips = [
  { id: 't1', domain: 'ski', startDate: '2026-01-10', days: 1, entries: [{ itemId: 'test_ski' }] },
  { id: 't2', domain: 'ski', startDate: '2026-02-14', days: 2, entries: [{ itemId: 'test_ski' }] },
  { id: 't3', domain: 'ski', startDate: '2026-03-01', days: 1, entries: [] }, // without the skis
  { id: 't4', domain: 'bikepacking', startDate: '2026-03-02', days: 1, entries: [{ itemId: 'test_ski' }] }, // another area
  { id: 't5', domain: 'ski', startDate: '2026-12-01', days: 1, entries: [{ itemId: 'test_ski' }] }, // still to come
];
const log = [
  { actId: 'tennis', day: '2026-09-01', min: 60 },
  { actId: 'tennis', day: '2026-10-01', min: 90 },
  { actId: 'yoga', day: '2026-10-02', min: 60 },
];

describe('the sports', () => {
  it('areas with a sport first, then Aktiv without the bike ones', () => {
    const keys = sportsOf(acts).map((s) => s.key);
    expect(keys.slice(0, 2)).toEqual(['dom:ski', 'dom:hiking']);
    expect(keys).toContain('act:tennis');
    expect(keys).not.toContain('act:bike');
    expect(keys).not.toContain('act:spin');
    expect(keys).not.toContain('dom:bikepacking');
  });
  it('suggests care and a counter by sport and name', () => {
    expect(careSuggest('dom:ski', 'Felle Test')[0]).toMatchObject({ every: 20, unit: 'uses' });
    expect(careSuggest('dom:ski', 'LVS Test')[0]).toMatchObject({ every: 365, unit: 'days' });
    expect(careSuggest('act:tennis', 'Schläger')[0].unit).toBe('hours');
    expect(careSuggest('act:meditation', 'Kissen')).toEqual([]);
    expect(unitSuggest('act:tennis')).toBe('hours');
    expect(unitSuggest('act:run', 'Laufschuhe')).toBe('km');
    expect(unitSuggest('dom:ski', 'Ski')).toBe('uses');
  });
});

describe('the counter', () => {
  it('counts the past trips of the area with the item, days as uses', () => {
    const u = usesOf(ski, { trips, today: TODAY });
    expect(u.map((x) => x.day)).toEqual(['2026-01-10', '2026-02-14']);
    expect(countOf(u, 'uses')).toBe(3);
  });
  it('counts the hours of the activity in Aktiv', () => {
    const u = usesOf(racket, { log, today: TODAY });
    expect(countOf(u, 'hours')).toBe(2.5);
    expect(countOf(u, 'uses')).toBe(2);
  });
  it('adds uses by hand; nothing before «since» counts', () => {
    const m = addUse(mainOf(ski), { day: '2026-03-20' });
    const u = usesOf({ ...ski, main: m }, { trips, today: TODAY });
    expect(countOf(u, 'uses')).toBe(4);
    const late = { ...ski, main: { ...ski.main, since: '2026-02-01' } };
    expect(countOf(usesOf(late, { trips, today: TODAY }), 'uses')).toBe(2);
  });
});

describe('care', () => {
  it('is due when its interval is used up, and starts again when done', () => {
    const st = careState(ski, { trips, today: TODAY });
    expect(st.find((c) => c.care.id === 'wax').state).toBe('due');
    expect(st.find((c) => c.care.id === 'edge').state).toBe('soon'); // 348 of 365 days since 1 Nov 2025
    const done = { ...ski, main: careDone(mainOf(ski), 'wax', TODAY) };
    expect(careState(done, { trips, today: TODAY }).find((c) => c.care.id === 'wax').state).toBe('ok');
  });
  it('a step in days counts from its last day done', () => {
    const st = careState(ski, { trips, today: '2026-09-20' }).find((c) => c.care.id === 'edge');
    expect(st.used).toBe(323);
    expect(st.state).toBe('soon'); // 323 / 365 ≥ 0.8
  });
  it('lists what is due over all equipment, most overdue first', () => {
    const rows = equipmentRows([ski, racket, { id: 'x', name: 'Plain' }], { trips, log, today: TODAY });
    expect(rows.map((r) => r.item.id)).toEqual(['test_ski', 'test_racket']);
    expect(dueCare(rows).map((d) => d.care.id)).toEqual(['str', 'wax']); // 3/3 = 1, 2.5/2 = 1.25 → racket first
  });
});

describe('the page', () => {
  it('groups by sport, the sports without equipment stay visible', () => {
    const rows = equipmentRows([ski, racket], { trips, log, today: TODAY });
    const { groups, empty } = groupsOf(rows, sportsOf(acts));
    expect(groups.map((g) => g.sport.key)).toEqual(['dom:ski', 'act:tennis']);
    expect(empty.map((s) => s.key)).toContain('act:yoga');
  });
  it('a season of ski touring starts in October', () => {
    expect(seasonStart('dom:ski', '2026-10-15')).toBe('2026-10-01');
    expect(seasonStart('dom:ski', '2026-03-01')).toBe('2025-10-01');
    expect(seasonStart('act:tennis', '2026-03-01')).toBe('2026-01-01');
    const r = rowOf(ski, { trips, today: '2026-03-01' });
    expect(r.season).toBe(3);
    expect(r.last).toBe('2026-02-14');
  });
  it('the sheet keeps the log and the care done when the mark changes', () => {
    const m = addUse(careDone(mainOf(ski), 'wax', TODAY), { day: TODAY });
    const next = markOf(m, { sport: 'dom:ski', unit: 'uses', care: [{ id: 'wax', name: 'Wax the base', every: 8, unit: 'uses' }, { name: '  ', every: 3 }] });
    expect(next.care).toHaveLength(1);
    expect(next.log).toHaveLength(1);
    expect(next.done.wax.day).toBe(TODAY);
    expect(next.since).toBe('2025-11-01');
  });
});
