// «Tour» (Noah 19.10.2026 «1a 2 beides 3b 4 beides 5a»): the page of a finished tour, its keys, corrected
// values, joined tours, the list views (touren/tour.js) and the rows with them (touren/aktivitaeten.js).
import { describe, it, expect } from 'vitest';
import { parseKey, tourHref, withOwn, rowWithOwn, cleanOwn, parseDuration, durationText, parseNumber, joinActs, dropGroup, leaveGroup, patchGroup, groupOf, pageOpts, KPI_DEFAULT, KPI_MAX, calMonth, shiftMonth, monthsWith, miniPath, linesOf, profileOf, kpiOf } from '../src/lib/touren/tour.js';
import { tourRows } from '../src/lib/touren/aktivitaeten.js';
import { actRecord, KEEP } from '../src/lib/training.js';
import { encodePolyline } from '../src/lib/spur/polyline.js';

const act = (id, day, o = {}) => ({ ...actRecord({ id, startLocal: `${day}T08:00:00`, name: o.name ?? `Fahrt ${id}`, type: o.type ?? 'Ride', km: o.km ?? 40, hm: o.hm ?? 500, movingS: o.movingS ?? 7200 }), ...(o.own ? { own: o.own } : {}), ...(o.hidden ? { hidden: true } : {}) });

describe('keys and links', () => {
  it('a key names an activity, a joined tour or a trip', () => {
    expect(parseKey('a:123')).toEqual({ kind: 'a', id: '123' });
    expect(parseKey('t:test_trip')).toEqual({ kind: 't', id: 'test_trip' });
    expect(parseKey('x:1')).toBeNull();
    expect(tourHref('g:tg-1')).toBe('#/tour/g%3Atg-1');
  });
  it('the app keeps the own values and «hidden» when Strava sends the activity again', () => {
    expect(KEEP).toEqual(expect.arrayContaining(['own', 'hidden', 'note']));
  });
});

describe('3b: corrected values', () => {
  it('own km, Hm and time win; Strava’s stay visible; the speed is worked out again', () => {
    const a = withOwn(act('1', '2026-10-01', { own: { km: 50, name: 'Hausrunde', kind: 'run' } }));
    expect(a).toMatchObject({ km: 50, name: 'Hausrunde', kind: 'run', changed: ['km'], strava: { km: 40 }, spdAvg: null });
    expect(withOwn(act('2', '2026-10-01')).changed).toEqual([]);
  });
  it('an own value equal to Strava’s or empty is no change', () => {
    expect(cleanOwn({ km: 40, hm: null, movingS: '', name: 'x' }, { km: 40 })).toEqual({ name: 'x' });
  });
  it('a merged row takes the corrected values of its trip or joined tour', () => {
    const r = rowWithOwn({ km: 100, hm: 900, dauer: 4 * 3600, kmh: 25, changed: [], strava: {} }, { km: 120, movingS: 5 * 3600 });
    expect(r).toMatchObject({ km: 120, dauer: 5 * 3600, kmh: 24, changed: ['km', 'movingS'], strava: { km: 100, movingS: 4 * 3600 } });
  });
  it('reads the time and the numbers the way people type them', () => {
    expect(parseDuration('2:30')).toBe(9000);
    expect(parseDuration('2 h 05')).toBe(7500);
    expect(parseDuration('95')).toBe(5700);
    expect(parseDuration('')).toBeNull();
    expect(parseDuration('2:75')).toBeNaN();
    expect(durationText(9000)).toBe('2:30');
    expect(parseNumber('62,4')).toBe(62.4);
    expect(parseNumber("1'250")).toBe(1250);
    expect(parseNumber('abc')).toBeNaN();
  });
});

describe('5a: joined tours', () => {
  const now = new Date('2026-10-19T20:00:00Z');
  it('joins activities; an activity is in one joined tour at most', () => {
    const { groups, id } = joinActs([], ['1', '2'], ' Jura ', now);
    expect(groups).toEqual([{ id, name: 'Jura', acts: ['1', '2'], at: now.toISOString() }]);
    const next = joinActs(groups, ['2', '3'], 'Neu', new Date('2026-10-19T21:00:00Z'));
    // the old one keeps only «1» and goes, the new one has 2 and 3
    expect(next.groups.map((g) => g.acts)).toEqual([['2', '3']]);
    expect(groupOf(next.groups, '3').name).toBe('Neu');
  });
  it('rename, take one out, take apart: the activities always stay', () => {
    const { groups, id } = joinActs([], ['1', '2', '3'], 'Jura', now);
    expect(patchGroup(groups, id, { name: 'Jura-Runde' })[0].name).toBe('Jura-Runde');
    expect(leaveGroup(groups, id, '3')[0].acts).toEqual(['1', '2']);
    expect(leaveGroup(leaveGroup(groups, id, '3'), id, '2')).toEqual([]);
    expect(dropGroup(groups, id)).toEqual([]);
  });
  it('a joined tour is one row with its name; a hidden activity is left out unless asked for', () => {
    const acts = [act('1', '2026-10-01', { km: 60 }), act('2', '2026-10-02', { km: 50 }), act('3', '2026-10-03', { hidden: true })];
    const { groups } = joinActs([], ['1', '2'], 'Zwei Tage Jura', now);
    const rows = tourRows(acts, { groups });
    expect(rows.map((r) => r.id)).toEqual([`g:${groups[0].id}`]);
    expect(rows[0]).toMatchObject({ name: 'Zwei Tage Jura', km: 110, n: 2, href: `#/tour/g%3A${groups[0].id}`, grp: { id: groups[0].id } });
    expect(tourRows(acts, { groups, showHidden: true }).find((r) => r.id === 'a:3').hidden).toBe(true);
  });
  it('a row shows the own name and the corrected km', () => {
    const rows = tourRows([act('1', '2026-10-01', { own: { name: 'Napf', km: 44 } })]);
    expect(rows[0]).toMatchObject({ name: 'Napf', km: 44, changed: ['km'], href: '#/tour/a%3A1' });
  });
  it('a Packmodus trip row opens the trip’s page', () => {
    const rows = tourRows([act('1', '2026-10-06')], { packed: [{ trip: { id: 'tr1', title: 'Napf', startDate: '2026-10-06', days: 1, entries: [] }, state: 'done' }] });
    expect(rows[0].href).toBe('#/tour/t%3Atr1');
  });
});

describe('the page and the list views', () => {
  it('the page choices with defaults', () => {
    expect(pageOpts(null)).toEqual({ mode: 'all', kpis: KPI_DEFAULT, list: 'rows' });
    expect(pageOpts({ mode: 'tabs', kpis: ['hf', 'nonsense', 'km'], list: 'cal' })).toEqual({ mode: 'tabs', kpis: ['hf', 'km'], list: 'cal' });
    expect(pageOpts({ kpis: ['km', 'hm', 'dauer', 'kmh', 'hf', 'w', 'tss', 'n'] }).kpis).toHaveLength(KPI_MAX);
    expect(kpiOf({ n: 3 }, 'n')).toBe(3);
  });
  it('the calendar: weeks from Monday, a tour on each of its days', () => {
    const weeks = calMonth([{ id: 'x', day: '2026-10-05', endDay: '2026-10-06' }], '2026-10');
    expect(weeks[0].slice(0, 3)).toEqual([null, null, null]); // 1.10.2026 is a Thursday
    expect(weeks[0][3].day).toBe('2026-10-01');
    const cells = weeks.flat().filter(Boolean);
    expect(cells.filter((c) => c.rows.length).map((c) => c.day)).toEqual(['2026-10-05', '2026-10-06']);
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(monthsWith([{ day: '2026-09-30', endDay: '2026-10-01' }])).toEqual(['2026-10', '2026-09']);
  });
  it('the lines and the small still line of a tile', () => {
    const line = encodePolyline([[47.0, 8.0], [47.01, 8.02], [47.02, 8.01]]);
    const lines = linesOf([{ id: '1', line }]);
    expect(lines).toHaveLength(1);
    expect(miniPath(lines, 120, 72)).toMatch(/^M[\d.]+,[\d.]+L/);
    expect(miniPath([], 120, 72)).toBe('');
    expect(linesOf([], { route: { line: [[47, 8], [47.1, 8.1]] } })[0].src).toBe('route');
  });
  it('the profile: the planned route, else the course of the activities along their km', () => {
    expect(profileOf([], { route: { profile: [[0, 500], [10, 800]] } })).toEqual([[0, 500], [10, 800]]);
    const p = profileOf([{ km: 20, prof: { pts: [[0, 400], [30, 700], [60, 500]] } }, { km: 10, prof: { pts: [[0, 500], [20, 600]] } }]);
    expect(p[0]).toEqual([0, 400]);
    expect(p[2]).toEqual([20, 500]);
    expect(p.at(-1)).toEqual([30, 600]);
  });
});
