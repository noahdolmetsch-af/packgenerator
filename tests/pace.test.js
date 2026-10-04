import { describe, it, expect } from 'vitest';
import { rideTiming, learnPace, paceOf, guessFor } from '../src/lib/pace.js';
import { ridingHours } from '../src/lib/route.js';

/** A straight ride north: one point every 10 s at the given km/h, with a pause in the middle. */
function gpx({ kmh = 20, minutes = 60, pauseMin = 0, climbPerPoint = 0 } = {}) {
  const pts = [];
  let lat = 47;
  let t = Date.parse('2026-05-09T06:00:00Z');
  let ele = 400;
  const step = (kmh / 3600) * 10 / 111.195; // degrees of latitude per 10 s
  const n = (minutes * 60) / 10;
  for (let i = 0; i <= n; i++) {
    if (i === Math.floor(n / 2) && pauseMin) {
      for (let k = 0; k < pauseMin * 6; k++) (t += 10000), pts.push({ lat, t, ele });
    }
    pts.push({ lat, t, ele });
    lat += step;
    t += 10000;
    ele += climbPerPoint;
  }
  return `<gpx><trk><name>Test ride</name><trkseg>${pts.map((p) => `<trkpt lat="${p.lat}" lon="8"><ele>${p.ele}</ele><time>${new Date(p.t).toISOString()}</time></trkpt>`).join('')}</trkseg></trk></gpx>`;
}

describe('your pace (v0.19.0)', () => {
  it('reads km, moving time and stops from a recorded ride', () => {
    const r = rideTiming(gpx({ kmh: 24, minutes: 120, pauseMin: 30 }));
    expect(r.km).toBeCloseTo(48, 0);
    expect(r.movingH).toBeCloseTo(2, 1);
    expect(r.totalH).toBeCloseTo(2.5, 1);
    expect(r.date).toBe('2026-05-09');
    expect(r.name).toBe('Test ride');
  });
  it('gives nothing for a planned route without times', () => {
    expect(rideTiming('<gpx><trk><trkseg><trkpt lat="47" lon="8"></trkpt><trkpt lat="47.1" lon="8"></trkpt></trkseg></trk></gpx>')).toBe(null);
  });
  it('learns a factor on the standard guess and leaves out unticked rides', () => {
    // The standard guess for 100 km and 1200 m is 100/16 + 1200/600 = 8.25 h; this rider needs 6.6 h.
    const rides = [
      { km: 100, gainM: 1200, movingH: 6.6, totalH: 8.25 },
      { km: 50, gainM: 600, movingH: 3.3, totalH: 4.125 },
      { km: 200, gainM: 0, movingH: 1, totalH: 1, use: false },
      { km: 10, gainM: 0, movingH: 1, totalH: 1 }, // too short
    ];
    const p = learnPace(rides);
    expect(p).toMatchObject({ kmh: 20, climbMh: 750, factor: 0.8, stops: 1.25, n: 2 });
    expect(guessFor(rides[0], p)).toBeCloseTo(6.6, 5);
    expect(learnPace([])).toBe(null);
  });
  it('uses your pace for the riding hours when learned, else the standard', () => {
    const route = { km: 112, gainM: 4140 };
    expect(ridingHours(route, 1)).toBe(14);
    expect(paceOf(null)).toMatchObject({ kmh: 16, climbMh: 600, mine: false });
    const mine = paceOf({ kmh: 28.5, climbMh: 1070, stops: 1.34, n: 8 });
    expect(mine.mine).toBe(true);
    expect(ridingHours(route, 1, mine)).toBe(8);
  });
});

import { templateHints, applyTemplateHint } from '../src/lib/debrief.js';
describe('templates learn from 3 debriefs (v0.19.0)', () => {
  const items = [{ id: 'A', name: 'Down jacket' }, { id: 'B', name: 'Warm gloves', defaultBag: 'frame' }, { id: 'C', name: 'Tool' }];
  const tpl = { id: 'tpl', name: 'Bikepacking', entries: [{ itemId: 'A', slot: 'seat', qty: 1 }, { itemId: 'C', slot: 'frame', qty: 1 }] };
  const trips = ['2024-06-15', '2025-09-06', '2026-10-15'].map((d, n) => ({ id: `t${n}`, title: `Trip ${n}`, startDate: d, entries: [{ itemId: 'A' }, { itemId: 'C' }] }));
  const deb = (n, items, missing = []) => ({ tripId: `t${n}`, status: 'done', items, missing });
  it('suggests nothing before the third debrief', () => {
    expect(templateHints(tpl, trips, [deb(0, { A: 'unused' }), deb(1, { A: 'unused' })], items)).toEqual([]);
  });
  it('takes out what was never used and puts in what was missing twice', () => {
    const ds = [deb(0, { A: 'unused' }, [{ id: 'm1', name: 'Warm gloves', itemId: 'B' }]), deb(1, { A: 'unused' }), deb(2, { A: 'unused' }, [{ id: 'm2', name: 'Warm gloves', itemId: 'B' }])];
    const h = templateHints(tpl, trips, ds, items);
    expect(h.map((x) => x.id)).toEqual(['out:A', 'in:B']);
    expect(h[1].why).toBe('Missing on Trip 2, Trip 0.');
    const t2 = applyTemplateHint(applyTemplateHint(tpl, h[0], items), h[1], items);
    expect(t2.entries).toEqual([{ itemId: 'C', slot: 'frame', qty: 1 }, { itemId: 'B', slot: 'frame', qty: 1 }]);
  });
  it('keeps an item that was used once on its last 3 trips', () => {
    const ds = [deb(0, { A: 'unused' }), deb(1, {}), deb(2, { A: 'unused' })];
    expect(templateHints(tpl, trips, ds, items)).toEqual([]);
  });
});
