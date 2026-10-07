import { describe, it, expect } from 'vitest';
import { openTodos, bikeGuessed, backupAfterTrip } from '../src/lib/todos.js';

describe('open to-dos on the start page', () => {
  const bikes = [{ id: 'a', weightG: 9000, weightNote: '9 kg from Strava (estimate). Weigh it.' }, { id: 'b', weightG: 10100, weightNote: '' }, { id: 'c', weightG: null }];
  const items = [{ id: 'i1', ownership: 'owned' }, { id: 'i2', ownership: 'owned', reviewedAt: '2026-10-01', favorite: true }, { id: 'w', ownership: 'wishlist' }];
  it('lists what is still a guess', () => {
    expect(bikes.map(bikeGuessed)).toEqual([true, false, true]);
    const rows = openTodos({ bikes, items, pace: { mine: false }, debriefs: [], trips: [{ id: 'demo-303' }] });
    expect(rows.map((r) => [r.key, r.n])).toEqual([['bikes', 2], ['pace', 0], ['check', 1], ['trip', 0]]);
  });
  it('rows disappear once done; demo debriefs do not count', () => {
    const done = openTodos({ bikes: [bikes[1]], items: [items[1]], pace: { mine: true }, trips: [{ id: 't1' }, { id: 'demo-1' }], debriefs: [{ tripId: 't1', status: 'done' }] });
    expect(done).toEqual([]);
    expect(openTodos({ trips: [{ id: 'demo-1' }], debriefs: [{ tripId: 'demo-1', status: 'done' }], pace: { mine: true } }).map((r) => r.key)).toEqual(['trip']);
    expect(openTodos({ items: [{ id: 'x', ownership: 'owned', reviewedAt: 'x' }], pace: { mine: true }, trips: [{ id: 't' }], debriefs: [{ tripId: 't', status: 'done' }] }).map((r) => r.key)).toEqual(['favourites']);
  });
  it('a backup is due after a trip debrief newer than the last backup', () => {
    const d = [{ status: 'done', doneAt: '2026-10-08T18:00:00Z' }];
    expect(backupAfterTrip('2026-10-07T10:00:00Z', d)).toBe(true);
    expect(backupAfterTrip('2026-10-09T10:00:00Z', d)).toBe(false);
    expect(backupAfterTrip(null, [])).toBe(false);
  });
});
