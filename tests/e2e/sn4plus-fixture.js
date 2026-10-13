// SN4+ «SN4 plus»: fictional data on top of the SN2+ fixture (sn2plus-fixture.js, clock Friday 9 October 2026).
// Both bikes get a type (Gravel, Rennvelo); most trips get a made-up route line from the same place (so some
// stretches are ridden several times), and some rides start in the afternoon or the evening.
import { sn2plusData, P, D0, day } from './sn2plus-fixture.js';

export { P, D0, day };

/** A made-up line from the home point (47.30, 8.50) going out in one direction, with a shared first part. */
function line(dir, len = 12) {
  const pts = [[47.3, 8.5], [47.305, 8.51], [47.31, 8.52]];
  for (let i = 1; i <= len; i++) pts.push([Math.round((47.31 + Math.sin(dir) * 0.01 * i) * 1e5) / 1e5, Math.round((8.52 + Math.cos(dir) * 0.012 * i) * 1e5) / 1e5]);
  return pts;
}

export function sn4plusData() {
  const data = sn2plusData();
  const T = data.tables;
  T.bikes = T.bikes.map((b) => ({ ...b, type: b.id === 'bike-road' ? 'road' : 'gravel' }));
  const DIRS = { herbst: 0.3, loop: 0.3, see: 1.6, pass: 2.6, huegel: 0.3, sommer: 4.2, fruehling: 0.3, abend: 5.2 };
  T.trips = T.trips.map((x) => {
    const k = x.id.replace(P, '');
    return DIRS[k] != null && x.route ? { ...x, route: { ...x.route, line: line(DIRS[k]) } } : x;
  });
  // start times: the evening ride in the evening, the lake ride in the afternoon (UTC, summer time: +2 h)
  const START = { abend: '16:30', see: '12:15' };
  T.rides = T.rides.map((r) => {
    const k = Object.keys(START).find((s) => r.id === `${P}ride-${s}-0`);
    return k ? { ...r, startAt: `${r.date}T${START[k]}:00.000Z` } : r;
  });
  return data;
}
