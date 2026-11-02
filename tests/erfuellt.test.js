// «Erfüllte Träume» (Träume und Neuland N17): a dream counts as fulfilled once its trip has its debrief. Fictional data.
import { describe, it, expect } from 'vitest';
import { fulfilledDreams, fulfilledIn } from '../src/lib/dreams/erfuellt.js';

const P = 'test_data_gtp_';
const dreams = [
  { id: 'a', title: `${P}Furka`, tripId: 't1' },
  { id: 'b', title: `${P}Jura`, tripId: 't2' },
  { id: 'c', title: `${P}Süden`, tripId: 't3' },
  { id: 'd', title: `${P}Norden` },
  { id: 'e', title: `${P}Weg`, tripId: 'gone' },
];
const trips = [
  { id: 't1', startDate: '2026-07-03', days: 3, status: 'done' },
  { id: 't2', startDate: '2025-08-10', days: 1, status: 'done' },
  { id: 't3', startDate: '2026-09-01', days: 2, status: 'done' },
];
const debriefs = [{ tripId: 't1', status: 'done' }, { tripId: 't2', status: 'done' }, { tripId: 't3', status: 'draft' }];

describe('fulfilled dreams (N17)', () => {
  it('counts only dreams whose trip has its debrief, newest first, with the last day', () => {
    const list = fulfilledDreams(dreams, trips, debriefs, '2026-10-27');
    expect(list.map((x) => [x.dream.id, x.day])).toEqual([['a', '2026-07-05'], ['b', '2025-08-10']]);
    expect(fulfilledIn(list, 2026).map((x) => x.dream.id)).toEqual(['a']);
    expect(fulfilledDreams([], trips, debriefs, '2026-10-27')).toEqual([]);
  });
});
