import { describe, it, expect } from 'vitest';
import { isOver, nextTrip, toDebrief } from '../src/lib/debrief.js';

describe('end a trip on the ride day', () => {
  const trip = { id: 't1', title: 'Jura', startDate: '2026-10-05', days: 2, entries: [{ itemId: 'a' }] };
  it('a running trip is not over and is the next trip', () => {
    expect(isOver(trip, '2026-10-05')).toBe(false);
    expect(nextTrip([trip], '2026-10-05')?.id).toBe('t1');
    expect(toDebrief([trip], [], '2026-10-05')).toEqual([]);
  });
  it('ended early: wants its debrief now and is no longer the next trip', () => {
    const ended = { ...trip, finished: '2026-10-05' };
    expect(isOver(ended, '2026-10-05')).toBe(true);
    expect(nextTrip([ended], '2026-10-05')).toBeNull();
    expect(toDebrief([ended], [], '2026-10-05').map((x) => x.id)).toEqual(['t1']);
  });
});
