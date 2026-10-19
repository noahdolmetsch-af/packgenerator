// TR5–TR7 «Analysen anpassen»: hide, show, move and reset, one setting for all activities.
import { describe, it, expect } from 'vitest';
import { ANALYSES, anaState, keysOf, setShown, move, reset, groupOf } from '../src/lib/training/analyses.js';
import { entriesOf, kgOn, withEntry, cleanKg, latestOf } from '../src/lib/weight.js';
import { hasDetail, needDetail, DETAIL_V } from '../src/lib/training.js';
import { trimMore, trimClimbs } from '../api/strava.js';

describe('analyses', () => {
  it('starts with every analysis shown, in the first order; unknown keys are dropped', () => {
    const s = anaState({ hidden: ['grid', 'nope'], order: { act: ['best', 'nope', 'more'] } });
    expect(s.hidden).toEqual(['grid']);
    expect(s.order.act.slice(0, 2)).toEqual(['best', 'more']);
    expect(s.order.act).toHaveLength(ANALYSES.act.length);
    expect(keysOf(s, 'act')).not.toContain('grid');
    expect(keysOf(anaState(null), 'week')).toEqual(ANALYSES.week.map((a) => a.key));
  });
  it('hides, shows, moves among the shown ones and resets one group', () => {
    let s = anaState(null);
    s = setShown(s, 'pzbars', false);
    expect(keysOf(s, 'act').slice(0, 2)).toEqual(['more', 'cadence']);
    s = move(s, 'cadence', -1);
    expect(keysOf(s, 'act').slice(0, 2)).toEqual(['cadence', 'more']);
    expect(move(s, 'cadence', -1)).toBe(s);
    s = setShown(s, 'form', false);
    s = reset(s, ['act']);
    expect(s.hidden).toEqual(['form']);
    expect(keysOf(s, 'act')[0]).toBe('more');
    expect(groupOf('wkgtime')).toBe('weight');
  });
});

describe('weight', () => {
  it('keeps one entry per day, oldest first, and finds the weight of a day', () => {
    const e = entriesOf({ entries: [{ day: '2026-10-11', kg: 71.3 }, { day: '2026-09-01', kg: '72,4' }, { day: 'x', kg: 70 }, { day: '2026-10-01', kg: 10 }] });
    expect(e).toEqual([{ day: '2026-09-01', kg: 72.4 }, { day: '2026-10-11', kg: 71.3 }]);
    expect(kgOn(e, '2026-09-20')).toBe(72.4);
    expect(kgOn(e, '2026-08-01')).toBe(72.4);
    expect(kgOn([], '2026-08-01')).toBe(null);
    expect(latestOf(withEntry(e, '2026-10-12', 71))).toEqual({ day: '2026-10-12', kg: 71 });
    expect(withEntry(e, '2026-10-11', null)).toHaveLength(1);
    expect(cleanKg('')).toBe(null);
  });
});

describe('detail version 2', () => {
  it('fetches an older detail once more', () => {
    const acts = [{ id: '1', day: '2026-10-10', time: '08:00', hrAvg: 130, detail: '2026-10-10T10:00:00Z' }, { id: '2', day: '2026-10-09', time: '08:00', hrAvg: 130, detail: '2026-10-10T10:00:00Z', dv: DETAIL_V }];
    expect(hasDetail(acts[0])).toBe(false);
    expect(hasDetail(acts[1])).toBe(true);
    expect(needDetail(acts, '2026-10-14').map((a) => a.id)).toEqual(['1']);
  });
});

describe('server: more from the streams', () => {
  // 30 minutes riding at 1 s, 10 m per second, climbing in the first half; one break of 2 minutes
  const n = 1800;
  const time = Array.from({ length: n }, (_, i) => (i < 900 ? i : i + 120));
  const distance = time.map((_, i) => i * 10);
  const altitude = time.map((_, i) => (i < 900 ? 500 + i * 0.2 : 680));
  const heartrate = time.map((_, i) => (i < 900 ? 150 : 130));
  const watts = time.map((_, i) => (i < 900 ? 250 : 150));
  const cadence = time.map((_, i) => (i % 10 === 0 ? 0 : 85));
  const streams = { time: { data: time }, distance: { data: distance }, altitude: { data: altitude }, heartrate: { data: heartrate }, watts: { data: watts }, cadence: { data: cadence } };
  it('the cadence spread, one row per 5 km, the course, heart rate by power and the halves', () => {
    const m = trimMore(streams);
    expect(Object.keys(m.cHist)).toEqual(['80']);
    expect(m.secs5.map((r) => r.from)).toEqual([0, 5, 10, 15]);
    expect(m.secs5[0]).toMatchObject({ s: 500, hr: 150, w: 250 });
    expect(m.secs5[0].hm).toBeGreaterThan(90);
    expect(m.secs5[3]).toMatchObject({ hm: 0, hr: 130, w: 150 });
    expect(m.prof.pts.length).toBe(120);
    expect(m.prof.breaks).toEqual([[15, 17]]);
    expect(m.hw).toEqual({ '150|240': 899, '130|140': 899 });
    expect(m.halves[0]).toMatchObject({ w: 250, hr: 150 });
    expect(m.halves[1]).toMatchObject({ w: 150, hr: 130 });
    expect(trimMore(null)).toEqual({ cHist: null, secs5: null, prof: null, hw: null, halves: null });
  });
  it('the climbs: more than 3 % and 30 m up, with VAM; nothing about the route', () => {
    const c = trimClimbs([
      { name: 'test_data_gtp_ Rampe', moving_time: 600, average_watts: 260, device_watts: true, average_heartrate: 158.4, segment: { distance: 2000, average_grade: 7.04, elevation_high: 640, elevation_low: 500, start_latlng: [47, 8] } },
      { name: 'test_data_gtp_ Flach', moving_time: 300, segment: { distance: 3000, average_grade: 1, elevation_high: 520, elevation_low: 500 } },
    ]);
    expect(c).toEqual([{ name: 'test_data_gtp_ Rampe', km: 2, grade: 7, hm: 140, s: 600, w: 260, hr: 158, vam: 840 }]);
  });
});
