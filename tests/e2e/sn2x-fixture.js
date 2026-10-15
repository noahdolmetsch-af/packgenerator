// SN2x «SN2 extra»: fictional data on top of the SN2+ fixture (sn2plus-fixture.js, clock Friday 9 October 2026).
// - «Seerunde» (a day ride on Gravel Grau) gets a round route line, two notes on the way and one after the
//   trip, and a second, similar lake ride later («Zweite Seerunde», km and Hm within ±20 %) for «Vergleich».
// - «Drei-Täler-Loop» (3 days, nights in lodgings: Bikepacking) gets stage names and a daily check per day;
//   no other Bikepacking trip is like it, so «Vergleich» stays a quiet line.
// - «Herbsttour Hochland» keeps four points «Für nächstes Mal» (cold, dark, rain, every trip); the next trip
//   «Wochenende Hochland» is cold and dry, in daylight: only «cold» and «every trip» fit it.
// No activities table (the Training PR adds it): heart rate from the ride ledger, no power.
import { sn2plusData, P, D0, day, HERBST } from './sn2plus-fixture.js';

export { P, D0, day, HERBST };
export const SEE = `${P}see`;
export const SEE2 = `${P}see2`;
export const LOOP = `${P}loop`;
export const NEXT = `${P}next`;
export const POINTS = [
  { id: 'p1', text: 'Handschuhe zu dünn', when: 'cold' },
  { id: 'p2', text: 'Licht vergessen', when: 'dark' },
  { id: 'p3', text: 'Regenjacke dicker', when: 'rain' },
  { id: 'p4', text: 'Hütte vorher anrufen', when: 'any' },
];

export function sn2xData() {
  const data = sn2plusData();
  const T = data.tables;
  const see = T.trips.find((x) => x.id === SEE);
  // a round route line around a made-up lake
  const line = Array.from({ length: 40 }, (_, i) => {
    const a = (i / 39) * 2 * Math.PI;
    return [Math.round((47.2 + 0.08 * Math.sin(a)) * 1e5) / 1e5, Math.round((8.3 + 0.14 * Math.cos(a) - 0.14) * 1e5) / 1e5];
  });
  see.route = { ...see.route, line, start: { lat: line[0][0], lon: line[0][1] }, end: { lat: line.at(-1)[0], lon: line.at(-1)[1] } };
  const seeDay = see.startDate;
  T.notes.push(
    { id: `${P}n1`, at: `${seeDay}T08:40:00.000Z`, text: 'Nebel am See, Armlinge doch nicht nötig', photo: null, page: 'ride', tripId: SEE, bikeId: null, day: 0, status: 'open', to: null, sortedAt: null },
    { id: `${P}n2`, at: `${seeDay}T10:30:00.000Z`, text: 'Kette knackt bei Nässe', photo: null, page: 'ride', tripId: SEE, bikeId: null, day: 0, status: 'open', to: null, sortedAt: null },
    { id: `${P}n3`, at: `${seeDay}T18:30:00.000Z`, text: 'Sonnencreme fehlte, Nacken rot', photo: null, page: 'home', tripId: SEE, bikeId: null, status: 'open', to: null, sortedAt: null },
  );
  // a second lake ride, later, on the same bike: like the first one
  const ago = 30;
  T.trips.push({ ...structuredClone(see), id: SEE2, title: 'Zweite Seerunde', startDate: day(-ago), route: { ...see.route, km: 55, gainM: 440 }, createdAt: `${day(-ago - 5)}T08:00:00.000Z` });
  T.rides.push({ ...structuredClone(T.rides.find((r) => r.tripId === SEE)), id: `${P}ride-see2-0`, name: 'Zweite Seerunde', tripId: SEE2, date: day(-ago), startAt: `${day(-ago)}T08:00:00.000Z`, km: 55, gainM: 440, lossM: 440, movingH: 2.9, totalH: 3.3 });
  T.debriefs.push({ ...structuredClone(T.debriefs.find((d) => d.tripId === SEE)), tripId: SEE2, note: '', doneAt: `${day(-ago)}T18:00:00.000Z`, updatedAt: `${day(-ago)}T18:00:00.000Z` });
  // the three-day loop: named stages and a daily check on each day
  const loop = T.trips.find((x) => x.id === LOOP);
  loop.stages = { start: 'Talstadt', days: [{ km: 70, name: 'Bergdorf' }, { km: 145, name: 'Seeweiler' }, { km: null, name: 'Talstadt' }] };
  T.flowChecks = [0, 1, 2].map((n) => ({ day: day(-42 + n), sleep: 6 + n, energy: 8 - n * 2, mood: 7 + (n % 2), q: null, extra: null }));
  // «Für nächstes Mal» on the autumn trip
  T.debriefs = T.debriefs.map((d) => (d.tripId === HERBST ? { ...d, nextTime: POINTS } : d));
  // the next trip is cold and dry, in daylight
  T.trips = T.trips.map((x) => (x.id === NEXT ? { ...x, wx: { min: 2, max: 8, rain: 'none' }, dark: false } : x));
  return data;
}
