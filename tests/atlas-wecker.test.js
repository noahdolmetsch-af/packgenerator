import { describe, it, expect } from 'vitest';
import { wakeable, wakeDays, wakeRows } from '../src/lib/race/atlas-wecker.js';
import { buildList, pushOf, KINDS, PUSH_GROUPS } from '../src/lib/push/schedule.js';
import de from '../src/lib/i18n/de/index.js';

const race = (o) => ({ name: 'Testrennen Nord', date: '2027-06-12', registered: false, fav: true, ...o });
const TODAY = '2026-12-01';

describe('Anmelde-Wecker: the days of one race', () => {
  it('rings on the opening day and 3 days and 1 day before it closes', () => {
    const r = race({ opens: '2026-12-10', closes: '2026-12-20' });
    expect(wakeDays(r, TODAY)).toEqual([
      { day: '2026-12-10', kind: 'opens', back: 0 },
      { day: '2026-12-17', kind: 'closes', back: 3 },
      { day: '2026-12-19', kind: 'closes', back: 1 },
    ]);
  });
  it('leaves out days that have passed', () => {
    expect(wakeDays(race({ opens: '2026-11-18', closes: '2026-12-03' }), TODAY).map((w) => w.day)).toEqual(['2026-12-02']);
    expect(wakeDays(race({ opens: '2026-11-18', closes: '2026-12-01' }), TODAY)).toEqual([]);
  });
  it('keeps the opening when it falls on a closing day too', () => {
    const r = race({ opens: '2026-12-17', closes: '2026-12-20' });
    expect(wakeDays(r, TODAY).map((w) => `${w.day}:${w.kind}`)).toEqual(['2026-12-17:opens', '2026-12-19:closes']);
  });
  it('gives nothing to a registered race, or one without a registration day', () => {
    expect(wakeable(race({ opens: '2026-12-10', registered: true }), TODAY)).toBe(false);
    expect(wakeable(race({}), TODAY)).toBe(false);
    expect(wakeable(race({ opens: '2026-12-10' }), TODAY)).toBe(true);
  });
  it('picks only the races that have the alarm on', () => {
    const rows = [race({ name: 'A', opens: '2026-12-10', wecker: true }), race({ name: 'B', opens: '2026-12-10' }), race({ name: 'C', closes: '2026-11-01', wecker: true })];
    expect(wakeRows(rows, TODAY).map((r) => r.name)).toEqual(['A']);
  });
});

describe('Anmelde-Wecker: the push list', () => {
  const NOW = new Date(2026, 11, 1, 6, 0); // 1 Dec 2026, 06:00 on this device
  const data = (kinds, rows) => ({ trips: [], repairs: [], bikes: [], lastBackup: null, settings: { push: { on: true, kinds: { fog: false, ...kinds }, morning: false }, rennatlas: { rows } }, now: NOW });
  const rows = [race({ opens: '2026-12-03', closes: '2026-12-08', wecker: true }), race({ name: 'Ohne Wecker', opens: '2026-12-04' })];

  it('sends the alarm of a race at 08:00 and nothing for one without', () => {
    const { items } = buildList(data({ atlaswake: true }, rows));
    const mine = items.filter((i) => i.key.startsWith('atlaswake:'));
    expect(mine).toHaveLength(3);
    expect(mine.every((i) => i.url === '#/race')).toBe(true);
    expect(mine.map((i) => new Date(i.at).getHours())).toEqual([8, 8, 8]);
    expect(mine[0].body).toContain('Testrennen Nord');
  });
  it('sends nothing while the kind is off', () => {
    const { items } = buildList(data({}, rows));
    expect(items.some((i) => i.key.startsWith('atlaswake:'))).toBe(false);
  });
  it('is a switch with a German name in the fold «Rund um die Tour»', () => {
    expect(KINDS.some((k) => k.key === 'atlaswake')).toBe(true);
    expect(PUSH_GROUPS.find((g) => g.key === 'tour').keys).toContain('atlaswake');
    const k = KINDS.find((x) => x.key === 'atlaswake');
    expect(de[k.label]).toBeTruthy();
    expect(de[k.hint]).toBeTruthy();
    expect(pushOf(null).kinds.atlaswake).toBeFalsy();
  });
});
