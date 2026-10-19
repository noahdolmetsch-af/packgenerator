// Paket Q #74: tip of the week and a wall that follows the time of day.
import { describe, it, expect } from 'vitest';
import { weekTip, byTime, partOf, weekIndex } from '../src/lib/clear/tipweek.js';
import { TIPS } from '../src/lib/tips.js';
import { TILE } from '../src/lib/home/tiles.js';
import { TIME_TILES } from '../src/lib/clear/tipweek.js';

describe('tip of the week', () => {
  it('stays the same Monday to Sunday and changes the next week', () => {
    const mon = weekTip(TIPS, '2026-10-19');
    expect(weekTip(TIPS, '2026-10-25')).toBe(mon);
    expect(weekTip(TIPS, '2026-10-26')).not.toBe(mon);
    expect(weekIndex('2026-10-26') - weekIndex('2026-10-19')).toBe(1);
  });
  it('only tips that lead to a page; unused first', () => {
    const t = weekTip(TIPS, '2026-10-19');
    expect(t.go.href).toBeTruthy();
    const used = new Set(TIPS.filter((x) => x.go?.href && x.id !== 'blocks').map((x) => x.id));
    expect(weekTip(TIPS, '2026-10-19', used).id).toBe('blocks');
  });
});

describe('wall by time of day', () => {
  const wall = [{ id: 'trip' }, { id: 'important' }, { id: 'morningcheck' }, { id: 'week' }];
  it('morning tiles to the front in the morning', () => {
    expect(byTime(wall, 7).map((x) => x.id)).toEqual(['morningcheck', 'trip', 'important', 'week']);
  });
  it('evening tiles in the evening, nothing changes at midday or when off', () => {
    expect(byTime(wall, 20).map((x) => x.id)).toEqual(['morningcheck', 'trip', 'week', 'important']);
    expect(byTime(wall, 13)).toBe(wall);
    expect(byTime(wall, 7, false)).toBe(wall);
    expect(partOf(4)).toBe('day');
  });
  it('names only tiles that exist', () => {
    for (const id of Object.values(TIME_TILES).flat()) expect(TILE[id], id).toBeTruthy();
  });
});
