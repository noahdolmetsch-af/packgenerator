// SN2/SN4 «Seiten neu»: the state of every row of Rückblick, Logbuch and Vergangene Touren (review/state.js),
// from the one rule of tripstate.js. Fictional data only.
import { describe, it, expect } from 'vitest';
import { tripFacts } from '../src/lib/review/rueckblick.js';
import { factStates, factCounts, matchesState } from '../src/lib/review/state.js';

const TODAY = '2026-10-13';
const trip = (id, startDate, extra = {}) => ({ id, title: `test_data_gtp_ ${id}`, startDate, days: 1, bikeId: 'b1', entries: [{ itemId: 'x', packed: true }], ...extra });

describe('factStates', () => {
  const trips = [trip('open', '2026-10-07', { finished: '2026-10-07' }), trip('draft', '2026-10-05', { finished: '2026-10-05' }), trip('rated', '2026-10-06'), trip('nolist', '2026-10-03', { entries: [], finished: '2026-10-03' }), trip('ahead', '2026-10-20')];
  const debriefs = [{ tripId: 'rated', status: 'done' }, { tripId: 'draft', status: 'draft' }];
  const rides = [{ id: 'solo', name: 'test_data_gtp_ Abendrunde', date: '2026-10-04', km: 41, source: 'gpx' }];
  const facts = tripFacts({ trips, debriefs, rides, today: TODAY });
  const states = factStates(facts, { debriefs, rides, today: TODAY });

  it('only trips that happened, each Completed or Rated', () => {
    expect(Object.keys(states).sort()).toEqual(['draft', 'nolist', 'open', 'rated', 'solo']);
    expect(states.rated).toEqual({ state: 'rated', extra: null, open: false });
    expect(states.open).toMatchObject({ state: 'done', extra: { key: 'missing' }, open: true });
    expect(states.draft).toMatchObject({ state: 'done', extra: { key: 'draft' }, open: true });
    expect(states.nolist).toMatchObject({ state: 'done', open: false });
  });

  it('an uploaded ride on its own is Completed with «GPX» (rating it comes with TZ-3)', () => {
    expect(states.solo).toEqual({ state: 'done', extra: { key: 'gpx' }, open: false });
    const strava = factStates([{ id: 's', kind: 'ride', rides: [{ id: 's', source: 'strava' }] }]);
    expect(strava.s.extra).toEqual({ key: 'strava' });
  });

  it('counts and filters by state; rows without a state show only under «Alle»', () => {
    const rows = [...facts, { id: 'ev:1' }];
    expect(factCounts(rows, states)).toEqual({ all: 6, done: 4, rated: 1 });
    expect(rows.filter((r) => matchesState(states, r.id, 'rated')).map((r) => r.id)).toEqual(['rated']);
    expect(rows.filter((r) => matchesState(states, r.id, 'all'))).toHaveLength(6);
  });
});
