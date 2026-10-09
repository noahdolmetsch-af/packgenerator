// v0.58.0 R2 «Tempo + Logbuch»: fictional data on top of the R1 fixture (r1-fixture.js). Clock:
// Friday 9 October 2026. «Dein Tempo» starts with 4 rides that count (one short of the 5 that switch
// the riding-time guess to your own rule); a ski weekend and two Excel entries fill the Logbuch.
import { r1Data, P, D0, day } from './r1-fixture.js';

export { P, D0, day };

/** A recorded ride (GPX) going north at kmh, climbing gain metres; one point every 10 s. */
export function rideGpx({ name = 'Testfahrt', date = day(-1), kmh = 20, minutes = 150, gain = 900 } = {}) {
  const n = (minutes * 60) / 10;
  const step = ((kmh / 3600) * 10) / 111.195;
  let t = Date.parse(`${date}T07:00:00Z`);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    // climb steadily for the first half, then roll down again
    const ele = 400 + (i <= n / 2 ? (gain * i) / (n / 2) : gain - (gain * (i - n / 2)) / (n / 2));
    pts.push(`<trkpt lat="${(47 + i * step).toFixed(6)}" lon="8.5"><ele>${ele.toFixed(1)}</ele><time>${new Date(t).toISOString()}</time></trkpt>`);
    t += 10000;
  }
  return `<?xml version="1.0"?><gpx version="1.1" creator="test"><trk><name>${name}</name><trkseg>${pts.join('')}</trkseg></trk></gpx>`;
}

export function tempoData({ paceRides = 4 } = {}) {
  const data = r1Data();
  const T = data.tables;
  // the rides of «Dein Tempo»: the first paceRides recorded rides of 20 km or more
  const use = T.rides.filter((r) => r.km >= 20).slice(0, paceRides);
  const rides = use.map((r) => ({ id: r.id, name: r.name, date: r.date, km: r.km, gainM: r.gainM, movingH: r.movingH, totalH: r.totalH, use: true }));
  const std = rides.reduce((s, r) => s + r.km / 16 + r.gainM / 600, 0);
  const moving = rides.reduce((s, r) => s + r.movingH, 0);
  const f = moving / std;
  T.settings = [{ key: 'pace', value: { kmh: Math.round((16 / f) * 10) / 10, climbMh: Math.round(600 / f / 10) * 10, factor: Math.round(f * 100) / 100, stops: 1.15, n: rides.length, rides, updatedAt: `${day(-3)}T19:00:00.000Z` } }];
  // a ski weekend (another area, no bike) and one more old Excel entry
  T.trips.push({
    id: `${P}ski`, title: 'Skitour Hochgipfel', domain: 'ski', startDate: day(-200), days: 2, bikeId: null, packs: [{ key: 'pack', name: 'Backpack 30 L', volumeL: 30 }],
    entries: [{ itemId: 'EL01', slot: 'pack', qty: 1, packed: true }], ready: [], status: 'done', noDebrief: true, createdAt: `${day(-205)}T08:00:00.000Z`,
    wx: { min: -8, max: -2, rain: 'none' },
  });
  T.events.push({ id: `${P}ev3`, name: 'Brevet 300 aus der Liste', note: 'Nachts kalt', date: '2025-05-17', sortDate: '2025-05-17', source: 'excel' });
  return data;
}
