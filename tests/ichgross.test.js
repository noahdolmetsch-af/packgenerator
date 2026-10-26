// Einzelideen «Ich» 27, 32, 33, 35 of the 996 ideas (Noah 26.10.2026 «1a 2a 3a 4a 5a»):
// last tool results, own fuel numbers for one trip, everything hidden in one look, what depends on a connection.
import { describe, it, expect } from 'vitest';
import { resultsOf, withResult, withoutResult, toolOfHash, RESULTS_MAX, RESULT_MAX_BYTES } from '../src/lib/ichideen/results.js';
import { tripOwnOf, fuelForTrip, tripDiff, valuesOf } from '../src/lib/fuel.js';
import { hiddenGroups, hiddenCount, HIDDEN_GROUPS } from '../src/lib/ichideen/hidden.js';
import { DEPENDS, gapOf, daysSince } from '../src/lib/ichideen/depends.js';
import DE from '../src/lib/i18n/de/index.js';

const file = (name, at, tool = 'pdf') => ({ name, type: 'application/pdf', size: 10, tool, at, data: 'data:application/pdf;base64,AA==' });

describe('27 last results of the tools', () => {
  it('keeps the newest five, one per name and tool', () => {
    let list = [];
    for (let i = 1; i <= 7; i++) list = withResult(list, file(`f${i}.pdf`, `2026-10-2${i}T10:00:00Z`), `r${i}`);
    expect(list.length).toBe(RESULTS_MAX);
    expect(list[0].name).toBe('f7.pdf');
    list = withResult(list, file('f7.pdf', '2026-10-28T10:00:00Z'), 'again');
    expect(list.filter((r) => r.name === 'f7.pdf').map((r) => r.id)).toEqual(['again']);
  });
  it('leaves out a file that is too big, and cleans a stored list', () => {
    expect(withResult([], { ...file('big.pdf', 'x'), size: RESULT_MAX_BYTES + 1 })).toEqual([]);
    const stored = { list: [file('a.pdf', '2026-10-01'), { id: 'x', name: 'b', data: 'nope' }].map((r, i) => ({ id: `i${i}`, ...r })) };
    expect(resultsOf(stored).map((r) => r.name)).toEqual(['a.pdf']);
    expect(withoutResult([{ id: 'a' }, { id: 'b' }], 'a')).toEqual([{ id: 'b' }]);
  });
  it('knows the tool of the page', () => {
    expect(toolOfHash('#/me/tools/pdf')).toBe('pdf');
    expect(toolOfHash('#/me/tools')).toBe('');
  });
});

describe('32 own numbers for one trip', () => {
  it('counts only for that trip; the standard stays', () => {
    const setting = { carbsGh: 60 };
    const trip = { fuelOwn: { carbsGh: 90, bogus: 3 } };
    expect(tripOwnOf(trip)).toEqual({ carbsGh: 90 });
    expect(fuelForTrip(setting, trip).carbsGh).toBe(90);
    expect(setting.carbsGh).toBe(60);
    expect(fuelForTrip(setting, {})).toBe(setting);
    expect(tripDiff(setting, trip)).toEqual([{ key: 'carbsGh', own: 90, std: valuesOf(setting).carbsGh }]);
    expect(tripDiff(setting, { fuelOwn: {} })).toEqual([]);
  });
});

describe('33 everything hidden in one look', () => {
  it('gathers the hidden things by group and never names a typed name through t()', () => {
    const groups = hiddenGroups({
      cfg: { menu: { hide: ['races'], names: {} }, tabs: {}, pages: {} },
      places: [{ key: 'races', label: 'Races' }],
      acts: [{ id: 'a1', name: 'Mein Bouldern', paused: true }, { id: 'a2', name: 'Run', paused: false }],
      logs: { a1: 4 },
      suggestOff: ['buy'],
      areas: [{ key: 'buy', label: 'Ideas to buy' }],
    });
    expect(groups.map((g) => g.key)).toEqual(['menu', 'acts', 'suggest']);
    expect(hiddenCount(groups)).toBe(3);
    const act = groups.find((g) => g.key === 'acts').rows[0];
    expect(act).toMatchObject({ name: 'Mein Bouldern', tr: false, dataN: 4 });
    expect(hiddenGroups({})).toEqual([]);
  });
  it('every group title speaks German', () => {
    for (const g of HIDDEN_GROUPS) expect(DE[g.title], g.title).toBeTruthy();
  });
});

describe('35 what depends on a connection', () => {
  it('names the pages of each connection in German', () => {
    for (const [k, rows] of Object.entries(DEPENDS)) for (const r of rows) {
      expect(r.href, k).toMatch(/^#\//);
      expect(DE[r.label], r.label).toBeTruthy();
    }
  });
  it('finds a gap only for a connection that is on', () => {
    expect(daysSince('2026-10-16T08:00:00Z', '2026-10-26')).toBe(10);
    expect(gapOf('strava', { on: true, last: '2026-10-16', today: '2026-10-26' })).toEqual({ kind: 'old', days: 10 });
    expect(gapOf('strava', { on: true, last: '2026-10-24', today: '2026-10-26' })).toBeNull();
    expect(gapOf('strava', { on: false, last: '2026-10-01', today: '2026-10-26' })).toBeNull();
    expect(gapOf('fitbit', { on: true, days: ['2026-10-25', '2026-10-24'], today: '2026-10-26', of: 3 })).toEqual({ kind: 'days', n: 1, of: 3 });
  });
});
