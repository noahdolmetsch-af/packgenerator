// «Haken-Analysen an einem Ort» (Noah 27.11.2026 «1a 2a 3a 4a 5a», Paket A): the numbers behind «Tagestotal» and «Wochenpensum» (src/lib/flow/hakenzahlen.js).
import { describe, it, expect } from 'vitest';
import { perDay, dayCount, dayTotals, weekCount, weekTotals, placeOf, percent, DAY_WINDOW, MAX_WEEKS } from '../src/lib/flow/hakenzahlen.js';

const TODAY = '2026-11-25'; // a Wednesday: this week is Mon 23.11., last week Mon 16.11.
const u = (day, min, q = 'gemessen') => ({ day, min, minQuelle: q });

describe('Haken-Analysen: day total', () => {
  it('adds the minutes of a day and keeps the estimated part apart', () => {
    const by = perDay([u('2026-11-20', 30), u('2026-11-20', 45, 'ca.'), u('2026-11-21', 0), u('2026-11-22', null, null)]);
    expect(by.get('2026-11-20')).toEqual({ min: 75, ca: 45 });
    expect(by.has('2026-11-21')).toBe(false);
    expect(by.has('2026-11-22')).toBe(false);
  });

  it('shows the span up to 90 days, never more', () => {
    expect(dayCount(10)).toBe(10);
    expect(dayCount(90)).toBe(90);
    expect(dayCount(365)).toBe(DAY_WINDOW);
    expect(dayTotals([], TODAY, 365).days).toHaveLength(90);
  });

  it('lists the days oldest first, ends today and marks the weekend', () => {
    const r = dayTotals([u(TODAY, 20)], TODAY, 10);
    expect(r.days).toHaveLength(10);
    expect(r.days[9]).toMatchObject({ day: TODAY, min: 20, today: true });
    expect(r.days.find((d) => d.day === '2026-11-21').weekend).toBe(true); // a Saturday
    expect(r.days.find((d) => d.day === '2026-11-20').weekend).toBe(false);
  });

  it('takes the typical day as the median of the training days, the longest and the free days', () => {
    const units = [u('2026-11-24', 60), u('2026-11-23', 30), u('2026-11-20', 120), u('2026-11-18', 45), u('2026-11-17', 75), u('2026-10-01', 369)];
    const r = dayTotals(units, TODAY, 10);
    expect(r.trained).toBe(6);
    expect(r.typical).toBe(68); // 30 45 60 75 120 369 → (60 + 75) / 2, rounded
    expect(r.longest).toEqual({ day: '2026-10-01', min: 369 });
    expect(r.todayMin).toBe(0);
    expect(r.free).toBe(0); // yesterday was a training day
    expect(dayTotals([u('2026-11-20', 60), u('2026-11-19', 60)], TODAY, 10).free).toBe(4); // 21, 22, 23, 24
  });

  it('gives no typical day under 5 training days', () => {
    const r = dayTotals([u('2026-11-24', 60), u('2026-11-23', 30)], TODAY, 10);
    expect(r.typical).toBeNull();
    expect(r.trained).toBe(2);
  });

  it('does not count a day older than 90 days', () => {
    const r = dayTotals([u('2026-08-01', 500), u('2026-11-24', 20)], TODAY, 10);
    expect(r.trained).toBe(1);
    expect(r.longest).toEqual({ day: '2026-11-24', min: 20 });
  });
});

describe('Haken-Analysen: week volume', () => {
  it('shows at least 12 weeks and at most a year, the running week last', () => {
    expect(weekCount(10)).toBe(12);
    expect(weekCount(30)).toBe(12);
    expect(weekCount(90)).toBe(13);
    expect(weekCount(365)).toBe(MAX_WEEKS);
    const r = weekTotals([], TODAY, 10);
    expect(r.weeks).toHaveLength(12);
    expect(r.weeks.at(-1)).toMatchObject({ key: '2026-11-23', current: true });
    expect(r.weeks[0].key).toBe('2026-09-07');
  });

  it('counts Monday to Sunday and compares with last week at the same weekday', () => {
    const units = [u('2026-11-23', 60), u('2026-11-25', 30), u('2026-11-26', 100), u('2026-11-16', 90), u('2026-11-19', 60), u('2026-11-22', 45), u('2026-11-12', 120), u('2026-11-09', 40)];
    const r = weekTotals(units, TODAY, 10);
    expect(r.dayIdx).toBe(2);
    expect(r.cur).toBe(90); // Thursday 26.11. lies after today and is not counted
    expect(r.prev).toBe(195); // 16.11. 90 + 19.11. 60 + 22.11. 45
    expect(r.prevSame).toBe(90); // Mon 16.11. to Wed 18.11.
    expect(r.prev2).toBe(160);
  });

  it('takes the mean of the 12 full weeks, only with 4 weeks of movement', () => {
    const few = weekTotals([u('2026-11-16', 600), u('2026-11-09', 300)], TODAY, 10);
    expect(few.mean).toBeNull();
    const units = ['2026-11-16', '2026-11-09', '2026-11-02', '2026-10-26'].map((d) => u(d, 360));
    const r = weekTotals(units, TODAY, 10);
    expect(r.mean).toBe(120); // 1440 min over 12 weeks
  });

  it('keeps the estimated minutes apart', () => {
    const r = weekTotals([u('2026-11-24', 60), u('2026-11-24', 30, 'ca.')], TODAY, 10);
    expect(r.weeks.at(-1)).toMatchObject({ min: 90, ca: 30 });
  });

  it('says where a value stands against the mean', () => {
    expect(placeOf(100, 100)).toBe('on');
    expect(placeOf(109, 100)).toBe('on');
    expect(placeOf(111, 100)).toBe('above');
    expect(placeOf(89, 100)).toBe('below');
    expect(placeOf(50, null)).toBeNull();
    expect(percent(66, 100)).toBe(-34);
    expect(percent(10, 0)).toBeNull();
  });
});
