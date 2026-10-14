// SN2+ «SN2 plus»: fictional data on top of the R1 fixture (r1-fixture.js, clock Friday 9 October 2026).
// Every recorded ride also came from Strava (the ride ledger, with a made-up heart rate and sport type);
// the Gravel bike rides on gravel, the road bike on the road. The two-day «Herbsttour Hochland» was started
// from the template «Jura-Wochenende» (Armlinge and Hüttenschuhe in it). A ski weekend adds a second kind.
import { r1Data, P, D0, day } from './r1-fixture.js';

export { P, D0, day };

export const TPL = `${P}tpl-jura`;
export const HERBST = `${P}herbst`;

export function sn2plusData() {
  const data = r1Data();
  const T = data.tables;
  // the gravel bike has a fixed surface (answer 3: for rides without a sport type)
  T.bikes = T.bikes.map((b) => (b.id === 'bike-test' ? { ...b, surface: 'gravel' } : b));
  const tripOf = Object.fromEntries(T.trips.map((x) => [x.id, x]));
  T.kmBook = T.rides.map((r, n) => {
    const bikeId = tripOf[r.tripId]?.bikeId ?? 'bike-test';
    return {
      id: `${P}km-${n}`, bikeId, date: r.date, time: r.startAt, km: r.km, kind: 'ride', source: 'strava', name: r.name, device: '', serial: null, profile: '', sensors: [], gear: '',
      type: bikeId === 'bike-road' ? 'Ride' : 'Gravel Ride', stravaId: String(9000 + n), hrAvg: 128 + (n % 7) * 2, hrMax: 160 + (n % 5) * 3, by: 'gear', sure: 'likely', state: 'counted',
      reason: null, note: '', importId: null, inclusive: false, span: null, tripId: null, at: `${r.date}T19:00:00.000Z`,
    };
  });
  // the template the autumn trip came from (an older template: its entries only)
  T.settings.push({ key: 'templates', value: [{ id: TPL, name: 'Jura-Wochenende', entries: [{ itemId: 'LX01', slot: 'seat', qty: 1 }, { itemId: 'HY02', slot: 'frame', qty: 1 }, { itemId: 'EL01', slot: 'top', qty: 1 }], createdAt: `${day(-300)}T08:00:00.000Z`, updatedAt: `${day(-300)}T08:00:00.000Z` }] });
  T.trips = T.trips.map((x) => (x.id === HERBST ? { ...x, templateId: TPL } : x));
  // a second kind of trip for the Reiseart chips
  T.trips.push({
    id: `${P}ski`, title: 'Skitour Hochgipfel', domain: 'ski', startDate: day(-200), days: 2, bikeId: null, packs: [{ key: 'pack', name: 'Backpack 30 L', volumeL: 30 }],
    entries: [{ itemId: 'EL01', slot: 'pack', qty: 1, packed: true }], ready: [], status: 'done', noDebrief: true, createdAt: `${day(-205)}T08:00:00.000Z`, wx: { min: -8, max: -2, rain: 'none' },
  });
  return data;
}
