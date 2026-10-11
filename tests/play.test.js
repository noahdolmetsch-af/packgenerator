import { describe, it, expect } from 'vitest';
import { playFile, playDates, playDay, addDays } from '../src/lib/play.js';
import { validateBackup } from '../src/lib/backup.js';
import { isDemoFile } from '../src/lib/demo.js';

// v0.88.0 «Aufräumen und Ausprobieren»: the playground's own demo file.
describe('playground', () => {
  const today = '2026-10-30';
  it('counts calendar days across a month end', () => {
    expect(addDays(today, 2)).toBe('2026-11-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('a weekend trip starts the day after tomorrow; the days to play', () => {
    expect(playDates('weekend', today)).toEqual({ start: '2026-11-01', days: 2, pack: '2026-10-31', after: '2026-11-03' });
    expect(playDay('weekend', 'today', today)).toBe(null);
    expect(playDay('weekend', 'ride', today)).toBe('2026-11-01');
    expect(playDay('day', 'after', today)).toBe('2026-11-01');
    expect(playDay('empty', 'pack', today)).toBe(null);
  });
  it('makes a valid demo file, everything made up has «play-»', () => {
    for (const kind of ['weekend', 'day', 'empty']) {
      const f = playFile(kind, today);
      expect(validateBackup(f)).toEqual([]);
      expect(isDemoFile(f)).toBe(true);
      expect(f.demo.play).toBe(true);
      for (const rows of Object.values(f.tables)) for (const r of rows) expect(r.id).toMatch(/^(bag-)?play-/);
    }
    const w = playFile('weekend', today);
    expect(w.tables.trips[0]).toMatchObject({ id: 'play-trip', startDate: '2026-11-01', days: 2, bikeId: 'play-bike' });
    const ids = new Set(w.tables.items.map((i) => i.id));
    expect(w.tables.trips[0].entries.every((e) => ids.has(e.itemId))).toBe(true);
    expect(w.demo.days.map((d) => d.date)).toEqual(['2026-10-31', '2026-11-01', '2026-11-03']);
    expect(playFile('day', today).tables.trips[0].entries.every((e) => e.slot !== 'seat')).toBe(true);
    expect(playFile('empty', today).tables).toEqual({});
  });
});
