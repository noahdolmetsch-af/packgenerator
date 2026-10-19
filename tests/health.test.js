// Fitbit über Google Health, the app side (src/lib/health.js). Fictional values only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { restoreBackup, APP_ID } from '../src/lib/backup.js';
import { saveDays, syncHealth, rangeToFetch, normalOf, weekAzm, azmWeek, azmWeekOf, latest, addDays, HEALTH_KEY } from '../src/lib/health.js';

let n = 0;
const fresh = () => createDb(`health-test-${++n}`);

describe('health days', () => {
  it('the first fetch asks for 90 days, later from 3 days before the last day held', () => {
    expect(rangeToFetch(null, '2026-10-14')).toEqual({ from: '2026-07-17', to: '2026-10-14' });
    expect(rangeToFetch('2026-10-12', '2026-10-14')).toEqual({ from: '2026-10-09', to: '2026-10-14' });
    expect(rangeToFetch('2026-01-01', '2026-10-14').from).toBe('2026-07-17');
  });

  it('per value the newer source wins; values it does not have stay', async () => {
    const db = fresh();
    await saveDays(db, [{ date: '2026-10-13', restingHr: 51, steps: 4000 }], { src: 'file', at: 'a' });
    const changed = await saveDays(db, [{ date: '2026-10-13', steps: 8000, bogus: 1 }, { date: 'nope' }], { src: 'google', at: 'b' });
    expect(changed).toBe(1);
    expect(await db.healthDays.get('2026-10-13')).toEqual({ date: '2026-10-13', restingHr: 51, steps: 8000, src: 'google', at: 'b' });
    expect(await saveDays(db, [{ date: '2026-10-13', steps: 8000 }])).toBe(0);
  });

  it('a fetch keeps the days and remembers until when', async () => {
    const db = fresh();
    const asked = [];
    const c = async (step, { params }) => (asked.push({ step, ...params }), { days: [{ date: '2026-10-13', azm: 30 }] });
    await syncHealth(db, { c, now: new Date('2026-10-14T08:00:00') });
    expect(asked).toEqual([{ step: 'days', from: '2026-07-17', to: '2026-10-14' }]);
    expect((await db.settings.get(HEALTH_KEY)).value.until).toBe('2026-10-13');
  });

  it('dein Normal needs 7 values; the week starts on Monday', () => {
    const today = '2026-10-14'; // a Wednesday
    const rows = Array.from({ length: 10 }, (_, i) => ({ date: addDays(today, -10 + i), restingHr: 48 + (i % 3), azm: 10 }));
    expect(normalOf(rows, 'restingHr', today)).toBe(49);
    expect(normalOf(rows.slice(0, 5), 'restingHr', today)).toBeNull();
    expect(weekAzm(rows, today)).toBe(20); // Monday and Tuesday
    expect(latest(rows, 'azm', today).date).toBe('2026-10-13');
  });

  it('the one-time Fitbit file comes in as a backup «Zusammenführen»', async () => {
    const db = fresh();
    await db.items.put({ id: 'X1', name: 'Pump' });
    await restoreBackup(db, { app: APP_ID, schemaVersion: 12, exportedAt: 'x', tables: { healthDays: [{ date: '2026-10-01', restingHr: 50, src: 'file', at: 'x' }] } }, 'merge');
    expect(await db.healthDays.count()).toBe(1);
    expect(await db.items.count()).toBe(1);
  });

  it('the week of active zone minutes: Monday to Sunday, no value is not zero, later days are empty', () => {
    const rows = [{ date: '2026-10-11', azm: 99 }, { date: '2026-10-12', azm: 30 }, { date: '2026-10-14', azm: 0 }, { date: '2026-10-15', azm: 45 }, { date: '2026-10-16', azm: 7 }];
    const w = azmWeek(rows, '2026-10-15');
    expect(w.monday).toBe('2026-10-12');
    expect(w.days.map((d) => d.min)).toEqual([30, null, 0, 45, null, null, null]);
    expect(w.days.map((d) => d.future)).toEqual([false, false, false, false, true, true, true]);
    expect(w.sum).toBe(75);
    expect(w.any).toBe(true);
    expect(azmWeek([], '2026-10-15').any).toBe(false);
  });
  it('the weekly goal starts at 150 and keeps a changed number', () => {
    expect(azmWeekOf(null)).toBe(150);
    expect(azmWeekOf({ of: 200 })).toBe(200);
    expect(azmWeekOf({ of: -1 })).toBe(150);
  });
});
