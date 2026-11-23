import { describe, it, expect } from 'vitest';
import { bagShotsOf, newBagShot, bagShotList } from '../src/lib/pack/bagshot.js';
import { bikePhotos } from '../src/lib/photo.js';
import { albumOf } from '../src/lib/wohl.js';

const row = (o) => newBagShot({ tripId: 'trip-1', slot: 'seat', name: 'Saddle bag', data: 'data:image/jpeg;base64,AAA', day: '2026-11-20', now: new Date('2026-11-20T10:00:00Z'), ...o });

describe('K1 bag photos', () => {
  it('makes a row with the bag marker and no bike', () => {
    const r = row({});
    expect(r).toMatchObject({ bagShot: true, bikeId: null, tripId: 'trip-1', slot: 'seat', name: 'Saddle bag', main: false, day: '2026-11-20' });
    expect(r.id).toMatch(/^bagshot-/);
    expect(r.addedAt).toBe('2026-11-20T10:00:00.000Z');
  });

  it('keeps the newest photo per bag and only for the trip', () => {
    const a = row({ now: new Date('2026-11-20T10:00:00Z') });
    const b = row({ now: new Date('2026-11-21T10:00:00Z'), data: 'data:image/jpeg;base64,BBB' });
    const other = row({ tripId: 'trip-2' });
    const frame = row({ slot: 'frame', name: 'Frame bag' });
    const by = bagShotsOf([a, b, other, frame, { id: 'x', bikeId: 'b1', tripId: 'trip-1', data: 'd' }], 'trip-1');
    expect(Object.keys(by).sort()).toEqual(['frame', 'seat']);
    expect(by.seat.data).toBe('data:image/jpeg;base64,BBB');
  });

  it('lists the bags with a photo in the order of the given bags', () => {
    const list = bagShotList([row({ slot: 'seat' }), row({ slot: 'frame', name: 'Frame bag' }), row({ slot: 'old', name: 'Old' })], 'trip-1', ['frame', 'bar', 'seat']);
    expect(list.map((x) => x.slot)).toEqual(['frame', 'seat', 'old']);
    expect(list[0].name).toBe('Frame bag');
  });

  it('never shows in the bike gallery or the album', () => {
    const r = row({});
    expect(bikePhotos({ id: 'b1' }, [r])).toEqual([]);
    expect(bikePhotos({ id: 'b1' }, [{ ...r, bikeId: null }])).toEqual([]);
    expect(albumOf([r])).toEqual([]);
  });

  it('ignores rows without a photo or a bag', () => {
    expect(bagShotsOf([{ ...row({}), data: '' }, { ...row({}), slot: '' }, null], 'trip-1')).toEqual({});
  });
});
