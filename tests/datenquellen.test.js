// «Meine Datenquellen» (Tour A–Z, Schritt 0, PR B): the rows of the page (src/lib/quellen/quellen.js). Fictional data.
import { describe, it, expect } from 'vitest';
import { quellenRows, allEmpty, missingDays, LIMITS } from '../src/lib/quellen/quellen.js';

const today = '2026-11-07';
const days = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => `2026-11-${String(from + i).padStart(2, '0')}`);
const rowOf = (rows, key) => rows.find((r) => r.key === key);

describe('quellenRows', () => {
  it('nothing connected and nothing held: off and empty, limits stay; the page offers to connect', () => {
    const rows = quellenRows({}, today);
    expect(rows.map((r) => r.key)).toEqual(['fitbit', 'strava', 'check', 'touren', 'velos', ...LIMITS]);
    expect(rowOf(rows, 'fitbit').state).toBe('off');
    expect(rowOf(rows, 'strava').state).toBe('off');
    expect(rowOf(rows, 'check').state).toBe('empty');
    expect(rowOf(rows, 'wetter').state).toBe('limit');
    expect(allEmpty(rows)).toBe(true);
  });
  it('Fitbit: days without values in the last 14 days are a gap; complete days are ok', () => {
    const f = { on: true, count: 90, last: '2026-11-06' };
    expect(rowOf(quellenRows({ fitbit: { ...f, days: days(1, 6) } }, today), 'fitbit')).toMatchObject({ state: 'gap', gap: { n: 8, of: 14 }, n: 90 });
    expect(rowOf(quellenRows({ fitbit: { ...f, days: [...days(1, 6), ...days(24, 31).map((d) => d.replace('2026-11', '2026-10'))] } }, today), 'fitbit').state).toBe('ok');
  });
  it('Fitbit not connected anymore but days held: still shown, not «off»', () => {
    expect(rowOf(quellenRows({ fitbit: { on: false, count: 40, last: '2026-09-01', days: [] } }, today), 'fitbit').state).toBe('ok');
  });
  it('Strava: no news for more than 7 days is «old» with the days', () => {
    const r = rowOf(quellenRows({ strava: { on: true, lastSync: '2026-10-25T07:00:00.000Z', count: 142 } }, today), 'strava');
    expect(r).toMatchObject({ state: 'old', n: 142 });
    expect(r.gap.days).toBeGreaterThan(7);
    expect(rowOf(quellenRows({ strava: { on: true, lastSync: '2026-11-06T07:00:00.000Z', count: 5 } }, today), 'strava').state).toBe('ok');
  });
  it('«Wi gaht\'s?»: a gap only when there are answers at all', () => {
    expect(rowOf(quellenRows({ check: { count: 0, days: [] } }, today), 'check').state).toBe('empty');
    expect(rowOf(quellenRows({ check: { count: 12, last: '2026-11-06', days: days(1, 6) } }, today), 'check')).toMatchObject({ state: 'gap', gap: { n: 8, of: 14 } });
  });
  it('tours and bikes carry their companion numbers', () => {
    const rows = quellenRows({ trips: { trips: 14, debriefs: 11 }, bikes: { bikes: 3, maintenance: 28 } }, today);
    expect(rowOf(rows, 'touren')).toMatchObject({ state: 'ok', n: 14, gap: { debriefs: 11, without: 3 } });
    expect(rowOf(rows, 'velos')).toMatchObject({ state: 'ok', n: 3, gap: { maintenance: 28 } });
    expect(allEmpty(rows)).toBe(false);
  });
  it('every source with a place has a link; the limits have none', () => {
    const rows = quellenRows({}, today);
    expect(rows.filter((r) => r.state !== 'limit').every((r) => /^#\//.test(r.href))).toBe(true);
    expect(rows.filter((r) => r.state === 'limit').every((r) => r.href === null)).toBe(true);
  });
});

describe('missingDays', () => {
  it('counts the last days without today', () => {
    expect(missingDays(days(1, 6), today, 14)).toEqual({ n: 8, of: 14 });
    expect(missingDays([], today, 3)).toEqual({ n: 3, of: 3 });
    expect(missingDays(['2026-11-06', '2026-11-05', '2026-11-04'], today, 3)).toBe(null);
  });
});
