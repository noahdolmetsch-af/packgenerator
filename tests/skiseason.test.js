import { describe, it, expect } from 'vitest';
import { SKI_SEASON_ITEMS, skiSeasonOf, skiSeasonState, showSkiSeason, skiSeasonCount, toggleSkiSeason } from '../src/lib/skiseason.js';

describe('Saisonstart-Check (v0.162.0)', () => {
  it('a day belongs to the winter that starts in its year from July on', () => {
    expect(skiSeasonOf('2026-10-15')).toBe('2026/27');
    expect(skiSeasonOf('2027-02-01')).toBe('2026/27');
    expect(skiSeasonOf('2027-07-01')).toBe('2027/28');
    expect(skiSeasonOf('2099-12-01')).toBe('2099/00');
  });
  it('shows in October and November only, unless hidden for this season', () => {
    expect(showSkiSeason(null, '2026-10-01')).toBe(true);
    expect(showSkiSeason(null, '2026-11-30')).toBe(true);
    expect(showSkiSeason(null, '2026-09-30')).toBe(false);
    expect(showSkiSeason(null, '2026-12-01')).toBe(false);
    expect(showSkiSeason({ season: '2026/27', done: {}, hidden: true }, '2026-10-20')).toBe(false);
    expect(showSkiSeason({ season: '2025/26', done: {}, hidden: true }, '2026-10-20')).toBe(true);
  });
  it('a new season starts empty, the same season keeps its ticks', () => {
    const old = { season: '2025/26', done: { lvs: '2025-10-03' }, hidden: false };
    expect(skiSeasonState(old, '2026-10-02').done).toEqual({});
    expect(skiSeasonState(old, '2025-11-02').done).toEqual({ lvs: '2025-10-03' });
  });
  it('a tick keeps its date, a second tap takes it away; the count follows', () => {
    let s = skiSeasonState(null, '2026-10-15');
    s = toggleSkiSeason(s, 'lvs', '2026-10-15');
    s = toggleSkiSeason(s, 'skins', '2026-10-16');
    expect(s.done).toEqual({ lvs: '2026-10-15', skins: '2026-10-16' });
    expect(skiSeasonCount(s)).toEqual({ done: 2, total: SKI_SEASON_ITEMS.length });
    s = toggleSkiSeason(s, 'lvs', '2026-10-17');
    expect(s.done).toEqual({ skins: '2026-10-16' });
  });
});
