import { describe, it, expect } from 'vitest';
import { skiSeasonOf, skiSeasonState, showSkiSeason, seasonStartTasks, seasonStartDone, seasonStartCount } from '../src/lib/skiseason.js';
import { CARE_TASKS, careEntry } from '../src/lib/ski.js';

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
    expect(showSkiSeason({ season: '2026/27', hidden: true }, '2026-10-20')).toBe(false);
    expect(showSkiSeason({ season: '2025/26', hidden: true }, '2026-10-20')).toBe(true);
    expect(skiSeasonState({ season: '2025/26', hidden: true }, '2026-10-02').hidden).toBe(false);
  });
  it('the things are the start tasks of the season care: one list, a tick counts on both pages', () => {
    const tasks = seasonStartTasks(null);
    expect(tasks.map((x) => x.id)).toEqual(CARE_TASKS.filter((x) => x.phase === 'start').map((x) => x.id));
    expect(tasks.map((x) => x.id)).toContain('contact');
    expect(seasonStartTasks({ hidden: ['boots'], own: [{ id: 'own1', phase: 'start', task: 'Test-Ding' }] }).map((x) => x.id)).toEqual([...tasks.map((x) => x.id).filter((x) => x !== 'boots'), 'own1']);
    const lvs = tasks.find((x) => x.id === 'lvs');
    const entries = [careEntry(lvs, '2026-10-15', 0, 1), { ...careEntry(tasks[1], '2025-10-20', 0, 2) }];
    expect(seasonStartDone(lvs, entries, '2026-10-16').day).toBe('2026-10-15');
    expect(seasonStartDone(tasks[1], entries, '2026-10-16')).toBeNull(); // last season's tick does not count
    expect(seasonStartCount(tasks, entries, '2026-10-16')).toEqual({ done: 1, total: tasks.length });
  });
});
