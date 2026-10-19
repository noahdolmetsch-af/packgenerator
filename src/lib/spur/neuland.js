/**
 * Paket S «Reise-Spur» (spec 6, tie to Paket M «Neuland»): the land you rode through, from the lines.
 * The world is cut into squares (map tiles at zoom NEU_Z, about 2.4 × 2.4 km in Switzerland); every
 * square a line passes counts as ridden. «Neu» on a tour: squares no earlier line touched.
 * Pure, tested in tests/spur.test.js.
 */
import { merc } from './mapmath.js';
import { distKm } from './polyline.js';

export const NEU_Z = 14;

/** The squares «x/y» (at zoom z) a line passes; points are filled in every ~300 m. */
export function cellsOf(line, z = NEU_Z, into = new Set()) {
  const n = 2 ** z;
  const add = (p) => {
    const m = merc(p);
    into.add(`${Math.floor(m.x * n)}/${Math.floor(m.y * n)}`);
  };
  for (let i = 0; i < (line?.length ?? 0); i++) {
    add(line[i]);
    if (i) {
      const steps = Math.floor(distKm(line[i - 1], line[i]) / 0.3);
      for (let s = 1; s <= steps; s++) {
        const u = s / (steps + 1);
        add([line[i - 1][0] + (line[i][0] - line[i - 1][0]) * u, line[i - 1][1] + (line[i][1] - line[i - 1][1]) * u]);
      }
    }
  }
  return into;
}

/**
 * Neuland of all lines: { all: Set, byDay: Map(day → Set of new squares) }.
 * lines: [{ day, pts }] of every tour and ride, any order; earlier days come first.
 */
export function neuland(lines, z = NEU_Z) {
  const all = new Set();
  const byDay = new Map();
  for (const l of [...lines].sort((a, b) => String(a.day).localeCompare(String(b.day)))) {
    const mine = cellsOf(l.pts, z);
    const fresh = byDay.get(l.day) ?? new Set();
    for (const c of mine) if (!all.has(c)) fresh.add(c);
    for (const c of mine) all.add(c);
    byDay.set(l.day, fresh);
  }
  return { all, byDay };
}

/** Square «x/y» at zoom z → its corners [[n, w], [s, e]] in lat/lon. */
export function cellBounds(cell, z = NEU_Z) {
  const [x, y] = cell.split('/').map(Number);
  const n = 2 ** z;
  const lon = (v) => (v / n) * 360 - 180;
  const lat = (v) => {
    const k = Math.PI - (2 * Math.PI * v) / n;
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(k) - Math.exp(-k)));
  };
  return [[lat(y), lon(x)], [lat(y + 1), lon(x + 1)]];
}
