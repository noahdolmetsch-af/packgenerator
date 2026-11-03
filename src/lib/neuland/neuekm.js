/**
 * «Neue Kilometer» (Träume und Neuland N4, Noah 27.10.2026 «1-5 a»): per ride and per year, how many km
 * ran on roads you rode for the first time. Built on the heatmap lines (heat/heat.js heatLines), bike rides only.
 *
 * How: every line is walked in steps of STEP_M; a step is «known» when an earlier ride (or the same ride
 * more than a few steps back, e.g. out and back) passed within NEAR_M. Points sit in a grid of ~100 m
 * squares, so only the square and its 8 neighbours are searched. GPS jitter on a known road stays known;
 * a parallel road further than NEAR_M away counts as new.
 * Pure, tested in tests/neuekm.test.js.
 */
import { merc } from '../spur/mapmath.js';

export const STEP_M = 100;
export const NEAR_M = 60;
const Z = 18; // grid squares of about 100 m in Switzerland
const N = 2 ** Z;
const R = 6371000;
const toRad = Math.PI / 180;

function meters(a, b) {
  const dLat = (b[0] - a[0]) * toRad;
  const dLon = (b[1] - a[1]) * toRad * Math.cos(((a[0] + b[0]) / 2) * toRad);
  return Math.hypot(dLat, dLon) * R;
}

/** The line as points about STEP_M apart, each with the metres it stands for. → [[lat, lon, m], …] */
export function steps(pts, step = STEP_M) {
  const out = [];
  for (let i = 1; i < (pts?.length ?? 0); i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const d = meters(a, b);
    if (!(d > 0)) continue;
    const n = Math.max(1, Math.ceil(d / step));
    for (let s = 1; s <= n; s++) {
      const u = (s - 0.5) / n;
      out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, d / n]);
    }
  }
  return out;
}

/**
 * New km of every bike line. lines: heatLines() output (any order). → Map(line id → { km, newKm }).
 * Lines are taken oldest first; on the same day by id, so the result does not depend on the order given.
 */
export function newKmOf(lines = [], { near = NEAR_M, step = STEP_M } = {}) {
  const grid = new Map(); // «x/y» → [[lat, lon, lineNo, stepNo], …]
  const out = new Map();
  const bikes = lines.filter((l) => l?.kind === 'bike' && l.pts?.length > 1).sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : String(a.id).localeCompare(String(b.id))));
  const self = Math.ceil((near * 3) / step); // the last few steps of the same ride never count as «known»
  bikes.forEach((l, no) => {
    let all = 0;
    let fresh = 0;
    steps(l.pts, step).forEach((p, k) => {
      const m = merc(p);
      const gx = Math.floor(m.x * N);
      const gy = Math.floor(m.y * N);
      let known = false;
      for (let dx = -1; dx <= 1 && !known; dx++)
        for (let dy = -1; dy <= 1 && !known; dy++) {
          for (const q of grid.get(`${gx + dx}/${gy + dy}`) ?? []) {
            if ((q[2] !== no || q[3] < k - self) && meters(p, q) <= near) {
              known = true;
              break;
            }
          }
        }
      all += p[2];
      if (!known) fresh += p[2];
      const key = `${gx}/${gy}`;
      const cell = grid.get(key);
      if (cell) cell.push([p[0], p[1], no, k]);
      else grid.set(key, [[p[0], p[1], no, k]]);
    });
    out.set(l.id, { km: Math.round(all / 100) / 10, newKm: Math.round(fresh / 100) / 10 });
  });
  return out;
}

/**
 * What the card shows: { years: [{ year, km, newKm, share }] newest first, rides: the last `n` rides
 * with new km [{ id, day, name, km, newKm }] newest first }; share is 0…1.
 */
export function newKmSummary(lines = [], byId = newKmOf(lines), { n = 5 } = {}) {
  const years = new Map();
  const rides = [];
  for (const l of lines) {
    const r = byId.get(l.id);
    if (!r) continue;
    const y = years.get(l.year) ?? { year: l.year, km: 0, newKm: 0 };
    y.km += r.km;
    y.newKm += r.newKm;
    years.set(l.year, y);
    if (r.newKm >= 0.5) rides.push({ id: l.id, day: l.day, name: l.name ?? '', km: r.km, newKm: r.newKm });
  }
  const ys = [...years.values()]
    .map((y) => ({ year: y.year, km: Math.round(y.km), newKm: Math.round(y.newKm), share: y.km > 0 ? y.newKm / y.km : 0 }))
    .sort((a, b) => (a.year < b.year ? 1 : -1));
  rides.sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
  return { years: ys, rides: rides.slice(0, n) };
}
