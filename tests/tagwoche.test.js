// «Dein Tag und deine Woche» (Noah 27.11.2026 «1b 2a 3b 4a 5b»): src/lib/flow/tagwoche.js
import { describe, it, expect } from 'vitest';
import { dayLine, weekLine, mixLine, pauseLine, freeLine, rhythmLine, yearLine } from '../src/lib/flow/tagwoche.js';

const add = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const TODAY = '2026-11-19'; // Thursday
let id = 0;
const u = (day, actId, min = null, q = 'gemessen') => ({ id: `u${++id}`, day, actId, sport: actId, min, minQuelle: min ? q : null });
const run = (act, days, min) => days.map((n) => u(add(TODAY, n), act, min));

describe('Tag', () => {
  it('says lighter, usual or stronger against your typical day, with measured minutes', () => {
    const past = run('bike', [-30, -25, -20, -15, -10, -5, -2], 60);
    expect(dayLine([...past, u(TODAY, 'bike', 30)], TODAY)).toMatchObject({ kind: 'light', when: 'today', by: 'min', value: 30, typical: 60 });
    expect(dayLine([...past, u(TODAY, 'bike', 62)], TODAY).kind).toBe('usual');
    expect(dayLine([...past, u(TODAY, 'bike', 100)], TODAY).kind).toBe('strong');
  });

  it('counts the ticks when the minutes are only estimated, and takes yesterday when today is empty', () => {
    const past = [-30, -25, -20, -15, -10, -5, -2].flatMap((n) => [u(add(TODAY, n), 'gym', 60, 'ca.'), u(add(TODAY, n), 'sauna', 30, 'ca.')]);
    const t = dayLine([...past, u(TODAY, 'gym', 60, 'ca.'), u(TODAY, 'sauna', 30, 'ca.'), u(TODAY, 'yoga', 30, 'ca.')], TODAY);
    expect(t).toMatchObject({ kind: 'strong', by: 'n', value: 3, typical: 2 });
    expect(dayLine([...past, u(add(TODAY, -1), 'gym', 60, 'ca.')], TODAY)).toMatchObject({ when: 'yesterday', by: 'n' });
    expect(dayLine([], TODAY)).toBe(null);
  });
});

describe('Woche', () => {
  it('compares the week so far with the same stretch of the last four weeks', () => {
    const mon = '2026-11-16';
    const old = [1, 2, 3, 4].flatMap((w) => [u(add(mon, -7 * w), 'bike', 60), u(add(mon, -7 * w + 1), 'bike', 60)]);
    const cur = [u(mon, 'bike', 120), u(add(mon, 1), 'bike', 90), u(add(mon, 2), 'bike', 60)];
    expect(weekLine([...old, ...cur], TODAY)).toMatchObject({ kind: 'harder', by: 'min', cur: 270, mean: 120 });
    expect(weekLine([...old, u(mon, 'bike', 60), u(add(mon, 1), 'bike', 60)], TODAY).kind).toBe('similar');
    expect(weekLine([...old.slice(0, 4), ...cur], TODAY)).toBe(null); // fewer than three weeks with data
  });
  it('counts days when there are no measured minutes', () => {
    const mon = '2026-11-16';
    const old = [1, 2, 3, 4].map((w) => u(add(mon, -7 * w), 'gym', 60, 'ca.'));
    const cur = [u(mon, 'gym', 60, 'ca.'), u(add(mon, 1), 'gym', 60, 'ca.'), u(add(mon, 2), 'gym', 60, 'ca.')];
    expect(weekLine([...old, ...cur], TODAY)).toMatchObject({ kind: 'harder', by: 'days', cur: 3, mean: 1 });
  });
});

describe('Mix', () => {
  it('counts the days per kind and names how many activities have none', () => {
    const acts = [{ id: 'gym', art: 'strength' }, { id: 'bike', art: 'endurance' }, { id: 'yoga' }];
    const units = [u(add(TODAY, -1), 'gym'), u(add(TODAY, -2), 'gym'), u(add(TODAY, -3), 'bike'), u(add(TODAY, -3), 'yoga'), u(add(TODAY, -40), 'bike')];
    expect(mixLine(units, acts, TODAY)).toEqual({ kinds: [{ id: 'strength', days: 2 }, { id: 'endurance', days: 1 }], missing: 1, total: 3 });
    expect(mixLine([], acts, TODAY)).toBe(null);
  });
});

describe('Pause und freie Tage', () => {
  it('finds the activity that rests longest against its own usual distance', () => {
    const yoga = [-60, -56, -52, -48, -44, -40, -36, -12].map((n) => u(add(TODAY, n), 'yoga'));
    const gym = [-9, -8, -6, -5, -3, -2, -1].map((n) => u(add(TODAY, n), 'gym'));
    const log = [...yoga, ...gym].map((x) => ({ id: x.id, actId: x.actId, day: x.day }));
    const p = pauseLine(log, [{ id: 'yoga' }, { id: 'gym' }], TODAY);
    expect(p.act.id).toBe('yoga');
    expect(p.since).toBe(12);
  });
  it('counts the free days of the last week and the longest stretch', () => {
    const units = [...run('bike', [-1, -3, -4, -20, -30, -31, -33], 30)];
    const f = freeLine(units, TODAY);
    expect(f.week).toBe(4);
    expect(f.longest).toBeGreaterThanOrEqual(15);
  });
});

describe('Takt und Jahr', () => {
  it('names the weekday that leads and the three hours most sessions begin in', () => {
    const wed = '2026-11-18';
    const units = [...[0, 7, 14, 21, 28, 35].map((n) => u(add(wed, -n), 'bike', 60)), ...[1, 3, 9, 12, 17, 26, 30].map((n) => u(add(TODAY, -n), 'gym'))];
    const timed = [...Array(10)].map((_, i) => ({ day: add(TODAY, -i), time: '10:30' }));
    const r = rhythmLine(units, timed, TODAY);
    expect(r.weekday).toBe(2);
    expect(r.slot).toEqual({ from: 9, n: 10, of: 10 });
    expect(rhythmLine(units.slice(0, 3), [], TODAY)).toBe(null);
  });
  it('compares this month so far with the same days of last year, only where last year has days', () => {
    const units = [u('2025-11-02', 'bike', 60), u('2025-11-05', 'bike', 60), u('2025-11-12', 'bike', 60), u('2025-11-25', 'bike', 60), u('2026-11-03', 'bike', 30), u('2026-11-10', 'bike', 30)];
    expect(yearLine(units, TODAY)).toMatchObject({ days: 2, daysBefore: 3, min: 60, minBefore: 180, by: 'min', toDay: 19 });
    expect(yearLine(units.slice(4), TODAY)).toBe(null);
  });
});

import { tagwocheRows } from '../src/lib/flow/tagwoche-text.js';
describe('Karte: Texte', () => {
  it('writes the rows in English, counts ticks without minutes and offers the kinds when they are missing', () => {
    const rows = tagwocheRows({
      day: { kind: 'strong', when: 'today', by: 'n', value: 3, typical: 2 },
      week: { kind: 'lighter', by: 'days', cur: 2, mean: 3.5 },
      mix: { kinds: [], missing: 2, total: 2 },
      free: { week: 3, longest: 5 },
      rhythm: { weekday: 0, days: 14, of: 40, slot: { from: 6, n: 8, of: 20 } },
      year: { days: 9, daysBefore: 6, min: 0, minBefore: 0, by: 'days', month: '11', toDay: 19 },
      loc: 'en',
    });
    const by = Object.fromEntries(rows.map((r) => [r.key, r]));
    expect(by.day.text).toContain('3 activities ticked');
    expect(by.week.text).toContain('2 days with movement');
    expect(by.mix.action.text).toContain('2 activities');
    expect(by.free.text).toContain('3 of the last 7 days');
    expect(by.rhythm.text).toContain('Monday');
    expect(by.rhythm.text).toContain('between 6 and 9');
    expect(by.year.text).toContain('9 days with movement');
  });
  it('gives no rows without facts', () => {
    expect(tagwocheRows({})).toEqual([]);
  });
});
