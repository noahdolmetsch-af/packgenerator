// v0.47.2 «Material-Ansichten»: fictional gear with eight debriefed trips, so every view of the Gear
// page has a known count. The clock stands on 9 October 2026 (home0460-fixture.js openHome).
//   Alle 24 · Meist genutzt 3 · Bewährt 2 · Lieblingssachen 2 · Nie gebraucht 3 · Ungewogen 2 · Wunschliste 2
import { base } from './home0460-fixture.js';

export const COUNTS = { all: 24, most: 3, proven: 2, fav: 2, never: 3, unweighed: 2, wish: 2 };
const P = 'test_data_gtp_';

const TRIPS = [
  ['t1', '2025-11-15', 2, 'none'],
  ['t2', '2026-01-10', 4, 'rain'],
  ['t3', '2026-03-07', 6, 'none'],
  ['t4', '2026-05-02', 12, 'none'],
  ['t5', '2026-06-13', 15, 'none'],
  ['t6', '2026-07-18', 17, 'none'],
  ['t7', '2026-08-22', 14, 'none'],
  ['t8', '2026-09-26', 8, 'none'],
];
// which item was on which trip ('all' = every trip)
const ON = {
  EL01: 'all', EL02: 'all', TO01: 'all', RA01: 'all',
  RA03: ['t4', 't5', 't6'], CO01: ['t4', 't5', 't6', 't7'], CO02: ['t4', 't5', 't6', 't7'], LX01: ['t5', 't6', 't7'], SL01: ['t4', 't6'],
};
// what the debrief of each trip said was not used
const UNUSED = {
  t1: ['TO01'], t2: ['TO01'], t3: [], t8: ['TO01'],
  t4: ['RA01', 'CO01', 'CO02', 'TO01'],
  t5: ['EL02', 'RA01', 'CO01', 'CO02', 'LX01', 'TO01'],
  t6: ['RA01', 'CO01', 'CO02', 'LX01', 'TO01'],
  t7: ['RA01', 'CO01', 'CO02', 'LX01', 'TO01'],
};

export function materialFixture() {
  const data = structuredClone(base);
  const T = data.tables;
  const it = (id, name, category, weightG, extra = {}) => ({ id, name, category, weightG, qty: 1, weightStatus: weightG == null ? 'missing' : 'measured', defaultBag: 'top', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...extra });
  T.items = T.items.map((i) => {
    if (i.id === 'EL01') return { ...i, favorite: true };
    if (i.id === 'HY01') return { ...i, weightG: null, weightStatus: 'missing' };
    if (i.id === 'RA01') return { ...i, brand: `${P}Bergwind`, priceChf: 349, boughtAt: '2024-03-15T10:00:00.000Z' };
    return i;
  });
  T.items.push(
    it('RA03', 'Wind vest', 'rain', 98, { altFor: 'RA01', defaultBag: 'seat' }),
    it('CO01', 'Gas stove', 'cook', 85),
    it('CO02', 'Titanium pot', 'cook', 102),
    it('EL04', 'Headphones', 'elec', null),
    it('WI01', 'Ultralight tarp', 'sleep', 300, { ownership: 'wishlist' }),
    it('WI02', 'Lighter pump', 'tools', 60, { ownership: 'to-buy' }),
  );
  T.trips = TRIPS.map(([id, date, min, rain]) => ({
    id: `${P}${id}`, title: `${P} Runde ${id}`, domain: 'bikepacking', startDate: date, days: 1, bikeId: 'bike-test', status: 'done',
    wx: { min, max: min + 8, rain },
    entries: Object.entries(ON).filter(([, w]) => w === 'all' || w.includes(id)).map(([itemId]) => ({ itemId, slot: 'seat', qty: 1, packed: true })),
    createdAt: `${date}T08:00:00.000Z`,
  }));
  T.debriefs = TRIPS.map(([id, date]) => ({
    tripId: `${P}${id}`, status: 'done', weather: 'planned', amount: 'right', bags: 'fine', note: '',
    items: Object.fromEntries((UNUSED[id] ?? []).map((x) => [x, 'unused'])), missing: [], applied: [], km: 60, kmApplied: 0, doneAt: `${date}T18:00:00.000Z`,
  }));
  return data;
}
