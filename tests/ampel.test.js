// «Tour-Ampel» (Noah 05.11.2026, Touren 3a): the four lines before a trip. Fictional data only.
import { describe, it, expect } from 'vitest';
import { ampelRows, ampelHead, ampelShows, daysBetween } from '../src/lib/trip/ampel.js';

const trip = (startDate, extra = {}) => ({ id: 'T1', startDate, ...extra });
const stats = (packed, count) => ({ packed, count });
const row = (rows, key) => rows.find((r) => r.key === key);

describe('Tour-Ampel', () => {
  it('counts days by calendar, also over a month end', () => {
    expect(daysBetween('2026-11-05', '2026-11-05')).toBe(0);
    expect(daysBetween('2026-11-29', '2026-12-02')).toBe(3);
  });

  it('shows only for a planned, not yet started trip with something on the list', () => {
    expect(ampelShows(trip('2026-11-10'), stats(0, 5), '2026-11-05')).toBe(true);
    expect(ampelShows(trip('2026-11-05'), stats(0, 5), '2026-11-05')).toBe(true);
    expect(ampelShows(trip('2026-11-04'), stats(5, 5), '2026-11-05')).toBe(false);
    expect(ampelShows(trip('2026-11-10'), stats(0, 0), '2026-11-05')).toBe(false);
    expect(ampelShows(trip('2026-11-10', { skipped: true }), stats(1, 5), '2026-11-05')).toBe(false);
    expect(ampelShows(trip('2026-11-10', { finished: true }), stats(1, 5), '2026-11-05')).toBe(false);
    expect(ampelShows(null, stats(1, 5), '2026-11-05')).toBe(false);
    expect(ampelShows({ id: 'x' }, stats(1, 5), '2026-11-05')).toBe(false);
  });

  it('packed: green at 100 %, yellow far away or from 70 %, red only when close and under 70 %', () => {
    const at = (packed, start) => row(ampelRows({ trip: trip(start), stats: stats(packed, 10), today: '2026-11-05' }), 'pack');
    expect(at(10, '2026-11-06')).toMatchObject({ tone: 'ok', act: null });
    expect(at(9, '2026-11-06')).toMatchObject({ tone: 'wait', vars: { n: 90 }, act: 'pack' });
    expect(at(3, '2026-11-06')).toMatchObject({ tone: 'stop', vars: { n: 30 } });
    expect(at(3, '2026-11-20')).toMatchObject({ tone: 'wait' });
  });

  it('weather: grey without a forecast, yellow when it differs, green otherwise', () => {
    const w = (o) => row(ampelRows({ trip: trip('2026-11-10'), stats: stats(1, 2), today: '2026-11-05', ...o }), 'weather');
    expect(w({ forecast: false })).toMatchObject({ tone: 'none', act: null });
    expect(w({ forecast: true, wxGap: true })).toMatchObject({ tone: 'wait', act: 'weather' });
    expect(w({ forecast: true, wxGap: false })).toMatchObject({ tone: 'ok', act: null });
  });

  it('bike: no line without a bike; things to do, late, no data, nothing due', () => {
    const b = (care) => row(ampelRows({ trip: trip('2026-11-10'), stats: stats(1, 2), today: '2026-11-05', care }), 'bike');
    expect(b(null)).toBeUndefined();
    expect(b({ due: 1, open: 2 })).toMatchObject({ tone: 'wait', text: 'Bike: {n} things to do', vars: { n: 3 }, act: 'bike' });
    expect(b({ due: 1, open: 0 })).toMatchObject({ text: 'Bike: 1 thing to do' });
    expect(b({ due: 1, late: true, open: 0 })).toMatchObject({ tone: 'stop' });
    expect(b({ nodata: true })).toMatchObject({ tone: 'none', act: 'bike' });
    expect(b({})).toMatchObject({ tone: 'ok', act: null });
  });

  it('devices: no line without a charge list; yellow until all are charged', () => {
    const p = (charged) => row(ampelRows({ trip: trip('2026-11-10'), stats: stats(1, 2), today: '2026-11-05', charged }), 'power');
    expect(p(null)).toBeUndefined();
    expect(p({ done: 0, total: 0 })).toBeUndefined();
    expect(p({ done: 1, total: 3 })).toMatchObject({ tone: 'wait', vars: { done: 1, total: 3 }, act: 'power' });
    expect(p({ done: 3, total: 3 })).toMatchObject({ tone: 'ok', act: null });
  });

  it('the headline follows the worst line; grey lines do not count', () => {
    expect(ampelHead([{ tone: 'ok' }, { tone: 'none' }])).toBe('Ready to go');
    expect(ampelHead([{ tone: 'ok' }, { tone: 'wait' }])).toBe('Almost ready');
    expect(ampelHead([{ tone: 'wait' }, { tone: 'stop' }])).toBe('Not ready yet');
  });
});
