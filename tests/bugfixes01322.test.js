// 0.161.0 «Bugfixes 0.132.2» (Durchklick 2, Noah «1b 2a 3a und wunschliste möglich 4a 5b"): the same
// number on every page. Fictional data only.
import { describe, it, expect } from 'vitest';
import { nextTrip } from '../src/lib/debrief.js';
import { homeTrips, testTrips } from '../src/lib/home/heute.js';
import { wornClothes, isOnMe } from '../src/lib/swap.js';
import { favoritesByDomain } from '../src/lib/domains.js';
import { favouriteCounts } from '../src/lib/gear.js';
import { periodStats } from '../src/lib/review/rueckblick.js';
import { hintsFor, logbookLine } from '../src/lib/sk/pages.js';

const today = '2026-10-15';

describe('B1/B2 (1b): a test trip counts nowhere', () => {
  const trips = [
    { id: 'a', title: 'In8daysTestRunde', startDate: '2026-10-23', days: 1 },
    { id: 'b', title: 'Jura loop', startDate: '2026-10-30', days: 1 },
    { id: 'c', title: 'Contest Ride', startDate: '2026-10-20', days: 1, archivedAt: '2026-10-14T10:00:00Z' },
  ];
  it('is never the next trip, on any page', () => {
    expect(nextTrip(trips, today).id).toBe('b');
    expect(nextTrip(trips.slice(0, 1), today)).toBeNull();
  });
  it('Today and the clean-up use the same rule', () => {
    expect(homeTrips(trips).map((x) => x.id)).toEqual(['b']);
    expect(testTrips(trips).map((x) => x.id)).toEqual(['a']);
  });
  it('the tile hints of Material and Velos see no next trip but the real one', () => {
    expect(hintsFor('gear', { trips: trips.slice(0, 1), items: [], settings: [] }, today).pack.quiet).toBeTruthy();
  });
});

describe('B1 (4a): on me is everything I wear', () => {
  const byId = {
    S1: { id: 'S1', name: 'Jersey', category: 'clothing', ownership: 'owned', layer: 'base', zone: 'upper' },
    W1: { id: 'W1', name: 'Watch', category: 'elec', ownership: 'owned' },
    H1: { id: 'H1', name: 'Hip bag', category: 'bags', ownership: 'owned' },
    B1: { id: 'B1', name: 'Pump', category: 'tools', ownership: 'owned' },
  };
  const trip = { entries: [{ itemId: 'S1', slot: 'body' }, { itemId: 'W1', slot: 'body' }, { itemId: 'H1', slot: 'hip' }, { itemId: 'B1', slot: 'seat' }, { itemId: 'X9', slot: 'body' }] };
  it('the card lists clothing first, then the rest on me; the bag item stays in its bag', () => {
    const w = wornClothes(trip, byId);
    expect(w.n).toBe(3);
    expect(w.zones.at(-1)).toMatchObject({ zone: 'gear' });
    expect(w.zones.at(-1).rows.map((r) => r.item.id).sort()).toEqual(['H1', 'W1']);
    expect([...w.ids].sort()).toEqual(['H1', 'S1', 'W1']);
  });
  it('the same set as the bike page and the new-trip button', () => {
    expect(trip.entries.filter((e) => byId[e.itemId] && isOnMe(e)).length).toBe(3);
  });
});

describe('B1 (3a): favourites are your own things, the wishlist on request', () => {
  const items = [
    { id: 'F1', name: 'Tent', favorite: true, ownership: 'owned', category: 'sleep' },
    { id: 'F2', name: 'Lamp', favorite: true, ownership: 'unclear', category: 'elec' },
    { id: 'F3', name: 'New bag', favorite: true, ownership: 'to-buy', category: 'bags' },
    { id: 'F4', name: 'Old mat', favorite: true, ownership: 'gone', category: 'sleep' },
  ];
  const ids = (g) => [...new Set(g.flatMap((x) => x.items.map((i) => i.id)))].sort();
  it('the page and the tile count the same', () => {
    expect(ids(favoritesByDomain(items))).toEqual(['F1', 'F2']);
    expect(favouriteCounts(items).inventory).toBe(2);
    expect(hintsFor('gear', { trips: [], items, settings: [] }, today).favs.text).toContain('2');
  });
  it('the wishlist comes in when switched on, gone never', () => {
    expect(ids(favoritesByDomain(items, { wishlist: true }))).toEqual(['F1', 'F2', 'F3']);
  });
});

describe('B1 (2a): the learnings of a period', () => {
  it('a learning without a date counts with its trip', () => {
    const trips = [{ id: 't1', title: 'Jura loop', startDate: '2026-09-01', days: 1, status: 'done', finished: '2026-09-01', entries: [] }];
    const learnings = [
      { id: 1, rule: 'Take gloves', tripId: 't1' },
      { id: 2, rule: 'Old one', source: 'import' },
      { id: 3, rule: 'Dated', createdAt: '2026-08-01T10:00:00Z' },
    ];
    const facts = [{ id: 't1', kind: 'trip', start: '2026-09-01', end: '2026-09-01', days: 1, rides: [], rain: {}, learnings: [learnings[0]], trip: trips[0] }];
    const s = periodStats(facts, learnings, '12m', today);
    expect(s.stats.find((x) => x.key === 'learnings').value).toBe(2);
  });
});

describe('B1: the logbook says what it holds', () => {
  it('trips and older entries, the same line on the tile and in the Rückblick', () => {
    expect(logbookLine(18, 30)).toBe('18 trips · 30 older entries');
    expect(logbookLine(1, 0)).toBe('1 trip');
  });
});
