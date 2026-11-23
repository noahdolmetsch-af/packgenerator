// «Kursblick»: invented price series for the tests and the screenshots (a seeded random walk, no real prices).
import { addDays } from '../../src/lib/kurse/rechnen.js';

function walk(seed, start, end, last, endValue, drift = 0.0002, vol = 0.011) {
  let s = seed;
  const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296) - 0.5;
  const out = [];
  let v = 1;
  for (let day = start; day <= end; day = addDays(day, 1)) {
    const dow = new Date(`${day}T00:00:00Z`).getUTCDay();
    if (dow === 0 || dow === 6) continue;
    v *= 1 + drift + rnd() * vol * 2;
    out.push([day, v]);
  }
  const k = endValue / out[out.length - 1][1];
  return out.filter((p) => p[0] <= last).map(([d, x]) => [d, Math.round(x * k * 100) / 100]);
}

const LAST = '2026-11-20'; // a Friday: the close of the day before «today» (Saturday 21.11.2026 in the tests' world)
export const FIXTURE = {
  gold: { id: 'gold', currency: 'USD', unit: 'oz', source: 'stooq', points: walk(11, '1986-01-02', LAST, LAST, 3800, 0.0004) },
  smi: { id: 'smi', currency: 'CHF', unit: 'points', source: 'yahoo', points: walk(23, '1990-07-09', LAST, LAST, 12400, 0.0003) },
  usdchf: { id: 'usdchf', currency: 'CHF', unit: 'rate', source: 'yahoo', points: walk(37, '1986-01-02', LAST, LAST, 0.8, -0.0002, 0.004) },
};

export const answer = (id, fetchedAt = new Date().toISOString()) => {
  const f = FIXTURE[id];
  const [day, close] = f.points[f.points.length - 1];
  return { ...f, since: f.points[0][0], last: { day, close }, fetchedAt };
};

/**
 * A title of the person («y:SYMBOL»): a series of its own from the symbol, invented. A symbol that starts with «NOPE» is
 * unknown to the service (a typo the test makes on purpose).
 */
export function titelAnswer(id, fetchedAt = new Date().toISOString()) {
  const sym = id.slice(2);
  if (sym.startsWith('NOPE')) return null;
  const h = [...sym].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 100003, 7);
  const points = walk(h, '2012-01-02', LAST, LAST, 20 + (h % 900), 0.0003, 0.012);
  const [day, close] = points[points.length - 1];
  return { id, currency: /-USD$|=F$|^(URA|GDX)$/.test(sym) ? 'USD' : 'CHF', unit: 'price', source: 'yahoo', since: points[0][0], last: { day, close }, fetchedAt, points };
}
