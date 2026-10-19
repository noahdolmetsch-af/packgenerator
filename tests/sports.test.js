// Sportart statt Tourart SA1–SA3 (Noah 14.10.2026 «SA1–SA3 freigegeben», «1a 2a 3a 4b 5b»).
import { describe, it, expect } from 'vitest';
import { SPORTS, BIKE_SPORTS, CYCLING, areaOf, sportForArea, sportOf, orderSports, sportBikeId, ownSportBike, typeSport, wantsBikepacking, suggestSport, oldTripSuggestions } from '../src/lib/sports.js';
import { BIKEPACKING } from '../src/lib/domains.js';

// fictional bikes, in their order (bike.order)
const bikes = [
  { id: 'b-road', name: 'Rennvelo Blau', type: 'road', order: 1 },
  { id: 'b-grav', name: 'Gravel Grinder', type: 'gravel', order: 2 },
  { id: 'b-mtb', name: 'Bergziege', type: 'Full suspension', order: 3 },
];
const trip = (o) => ({ id: o.id ?? Math.random().toString(36), title: o.title ?? 'Tour', startDate: o.startDate ?? '2026-05-01', days: o.days ?? 1, bikeId: o.bikeId ?? 'b-road', entries: [], ...o });

describe('the sports list', () => {
  it('has the bike sports first, then ski touring and hiking; bike sports pack from the bike area', () => {
    expect(SPORTS.map((s) => s.key)).toEqual(['cycling', 'gravel', 'xc', 'downhill', 'bikepacking', 'ski', 'hiking']);
    for (const k of BIKE_SPORTS) expect(areaOf(k)).toBe(BIKEPACKING);
    expect(areaOf('ski')).toBe('ski');
    expect(areaOf('weekend')).toBe('weekend');
  });
  it('1a: a trip of the bike area starts as Fahrrad', () => {
    expect(sportForArea(BIKEPACKING)).toBe(CYCLING);
    expect(sportForArea(null)).toBe(CYCLING);
    expect(sportForArea('hiking')).toBe('hiking');
  });
  it('knows the sport of a trip; an older bike trip has none', () => {
    expect(sportOf(trip({ sport: 'gravel' }))).toBe('gravel');
    expect(sportOf(trip({}))).toBe(null);
    expect(sportOf({ domain: 'ski', packs: [] })).toBe('ski');
    expect(sportOf({ domain: 'weekend', packs: [] })).toBe(null);
    // a bike sport on a trip without a bike does not count
    expect(sportOf({ domain: 'hiking', packs: [], sport: 'gravel' })).toBe('hiking');
  });
  it('5b: the sports used most come first, a tie keeps the order', () => {
    const trips = [trip({ sport: 'gravel' }), trip({ sport: 'gravel' }), { domain: 'hiking', packs: [] }, trip({})];
    expect(orderSports(trips).map((s) => s.key)).toEqual(['gravel', 'hiking', 'cycling', 'xc', 'downhill', 'bikepacking', 'ski']);
    expect(orderSports([]).map((s) => s.key)).toEqual(SPORTS.map((s) => s.key));
  });
});

describe('2a: a standard bike per sport', () => {
  it('reads the sport from the bike type', () => {
    expect(typeSport({ type: 'Gravel' })).toBe('gravel');
    expect(typeSport({ type: 'hardtail' })).toBe('xc');
    expect(typeSport({ type: 'MTB' })).toBe('xc');
    expect(typeSport({ type: 'Enduro' })).toBe('downhill');
    expect(typeSport({ type: 'road' })).toBe(null);
  });
  it('a set bike first, else one whose type fits, else the general standard', () => {
    expect(sportBikeId('gravel', bikes, {}, 'b-road')).toBe('b-grav');
    expect(sportBikeId('xc', bikes, {}, 'b-road')).toBe('b-mtb');
    expect(sportBikeId('downhill', bikes, {}, 'b-road')).toBe('b-mtb'); // no downhill bike: the mountain bike
    expect(sportBikeId('cycling', bikes, {}, 'b-road')).toBe('b-road');
    expect(sportBikeId('bikepacking', bikes, {}, 'b-road')).toBe('b-road');
    expect(sportBikeId('bikepacking', bikes, { bikepacking: 'b-grav' }, 'b-road')).toBe('b-grav');
    expect(sportBikeId('gravel', bikes, { gravel: 'gone' }, 'b-road')).toBe('b-grav'); // a deleted bike is ignored
    expect(sportBikeId('ski', bikes, {}, 'b-road')).toBe('b-road');
  });
  it('marks only a sport’s own standard', () => {
    expect(ownSportBike('gravel', bikes, {}, 'b-grav')).toBe(true);
    expect(ownSportBike('gravel', bikes, {}, 'b-road')).toBe(false);
    expect(ownSportBike('cycling', bikes, {}, 'b-road')).toBe(false);
  });
});

describe('3a: the hint «Zu Bikepacking»', () => {
  it('shows for a day sport with a night only', () => {
    expect(wantsBikepacking('gravel', 'outdoor')).toBe(true);
    expect(wantsBikepacking('cycling', 'lodging')).toBe(true);
    expect(wantsBikepacking('gravel', 'none')).toBe(false);
    expect(wantsBikepacking('gravel', null)).toBe(false);
    expect(wantsBikepacking('bikepacking', 'outdoor')).toBe(false);
    expect(wantsBikepacking('hiking', 'lodging')).toBe(false);
  });
});

describe('4b: old trips by bike and days', () => {
  it('suggests Bikepacking for more days, else by the bike type, else Fahrrad', () => {
    expect(suggestSport(trip({ days: 2, bikeId: 'b-grav' }), bikes)).toBe('bikepacking');
    expect(suggestSport(trip({ bikeId: 'b-grav' }), bikes)).toBe('gravel');
    expect(suggestSport(trip({ bikeId: 'b-mtb' }), bikes)).toBe('xc');
    expect(suggestSport(trip({ bikeId: 'b-road' }), bikes)).toBe('cycling');
    expect(suggestSport(trip({ bikeId: 'unknown' }), bikes)).toBe('cycling');
  });
  it('lists only old bike trips without a sport, newest first', () => {
    const trips = [
      trip({ id: 'a', startDate: '2026-04-01' }),
      trip({ id: 'b', startDate: '2026-06-01', days: 3 }),
      trip({ id: 'c', sport: 'gravel' }),
      { id: 'd', domain: 'hiking', packs: [], startDate: '2026-07-01' },
      trip({ id: 'e', skipped: true }),
    ];
    expect(oldTripSuggestions(trips, bikes).map((r) => [r.trip.id, r.sport])).toEqual([['b', 'bikepacking'], ['a', 'cycling']]);
  });
});
