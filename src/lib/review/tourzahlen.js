/**
 * SN4h «In Zahlen» on Touren › Übersicht (Noah 13.10.2026 «SN4g–SN4i freigegeben», answer 2: all groups
 * open): the numbers of the blocks that come from SN2 plus and the Rückblick extras, now over the rows of
 * «Abgeschlossene Touren» (period, state chips and filters; only V6 «Zum Vorjahr» reads all trips).
 *
 * - T1 «Tempo über die Monate» and P1 «Puls und Leistung pro Monat»: valueMonths
 * - T2 «Pro Velo und Untergrund»: rowsGrid (werte.js paceGrid over the rows)
 * - T3 «Geplant und gefahren»: werte.js plannedRidden over the rows
 * - U2 «Abnutzung»: wearPerBike (ganz.js wearRows per bike, the km and Hm of its rows)
 * - C1 «Vergleichsgruppen»: compareGroups (ganz.js compareGroup)
 *
 * Health values are observation only: numbers, never a judgement. Unknown is null. Pure functions,
 * tested in tests/sn4g.test.js.
 */
import { TOUR_BLOCK_KEYS, TOUR_GROUP_KEYS } from './pastcols.js';
import { paceGrid } from './werte.js';
import { wearRows, compareGroup } from './ganz.js';

const pos = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10);
const mean = (xs) => (xs.length ? Math.round(xs.reduce((s, v) => s + v, 0) / xs.length) : null);

/** SN4h: the stored view of «In Zahlen» on Touren: { off, shut } (the groups always start open). */
export function tourViewOf(value) {
  const list = (x) => (Array.isArray(x) ? x.filter((k) => TOUR_BLOCK_KEYS.includes(k)) : []);
  return { off: list(value?.off), shut: list(value?.shut), open: [...TOUR_GROUP_KEYS], hide: [] };
}

/** The bike of a row: its trip's bike, else the bike of its ledger rides (rowValues bikeId). */
export const bikeOfRow = (row, vals = {}) => row?.trip?.bikeId ?? vals[row?.id]?.bikeId ?? null;

/**
 * T1 + P1: per month { ym, n, kmh, hrAvg, hrMax, wAvg, wMax }. kmh: km over moving hours of the rows with a
 * moving time; heart rate: the mean of the rows' Ø and the highest max; power only rows with a power meter.
 */
export function valueMonths(rows = [], months = [], vals = {}) {
  return months.map((ym) => {
    const rs = rows.filter((r) => r.start?.startsWith(ym));
    let km = 0;
    let h = 0;
    for (const r of rs) {
      const s = pos(vals[r.id]?.movingS);
      if (s && pos(r.km)) (km += r.km), (h += s / 3600);
    }
    const v = rs.map((r) => vals[r.id] ?? {});
    const hrMax = v.map((x) => pos(x.hrMax)).filter(Boolean);
    const wMax = v.map((x) => pos(x.wMax)).filter(Boolean);
    return {
      ym,
      n: rs.length,
      kmh: km && h ? r1(km / h) : null,
      hrAvg: mean(v.map((x) => pos(x.hrAvg)).filter(Boolean)),
      hrMax: hrMax.length ? Math.max(...hrMax) : null,
      wAvg: mean(v.map((x) => pos(x.wAvg)).filter(Boolean)),
      wMax: wMax.length ? Math.max(...wMax) : null,
    };
  });
}

/** The newest month with a value of key: { ym, v } or null. */
export function newestOf(months = [], key) {
  for (let i = months.length - 1; i >= 0; i--) if (months[i][key] != null) return { ym: months[i].ym, v: months[i][key] };
  return null;
}

/** T2: werte.js paceGrid over the rows (each row one ride with its bike, km, Hm, moving time, sport type and surface). */
export function rowsGrid(rows = [], vals = {}, bikes = []) {
  const rides = rows
    .map((r) => ({ bikeId: bikeOfRow(r, vals), km: pos(r.km), gainM: r.gainM ?? 0, movingH: pos(vals[r.id]?.movingS) ? vals[r.id].movingS / 3600 : pos(r.movingH), type: vals[r.id]?.sport ?? '', surface: vals[r.id]?.surface ?? null, use: true }))
    .filter((x) => x.bikeId && x.km && x.movingH);
  return paceGrid(rides, bikes);
}

/**
 * U2: per bike of the rows what they added to its parts: [{ bike, n, km, gainM, parts: wearRows() }],
 * most km first. Bikes that are not in the list (deleted) are left out.
 */
export function wearPerBike(rows = [], bikes = [], vals = {}) {
  const by = new Map();
  for (const r of rows) {
    const id = bikeOfRow(r, vals);
    const bike = id ? bikes.find((b) => b.id === id) : null;
    if (!bike) continue;
    const x = by.get(id) ?? { bike, n: 0, km: 0, gainM: 0 };
    x.n++;
    x.km += pos(r.km) ?? 0;
    x.gainM += pos(r.gainM) ?? 0;
    by.set(id, x);
  }
  return [...by.values()]
    .map((x) => ({ ...x, km: Math.round(x.km), gainM: Math.round(x.gainM), parts: wearRows(x.bike, { km: x.km, gainM: x.gainM }) }))
    .filter((x) => x.parts.length)
    .sort((a, b) => b.km - a.km);
}

/**
 * C1: the comparison groups of the Rückblick (Bikepacking, then each bike) with how many of the rows are
 * rated: [{ key, name, n, rated, last }] (last: the newest rated row's title). Every bike shows, also
 * without a trip (n 0); Bikepacking only when a row is one.
 */
export function compareGroups(rows = [], bikes = [], states = {}) {
  const out = new Map();
  for (const b of bikes.filter((b) => !b.archived)) out.set(`bike:${b.id}`, { key: `bike:${b.id}`, name: b.name ?? '', n: 0, rated: 0, last: null });
  for (const r of [...rows].sort((a, b) => (b.start ?? '').localeCompare(a.start ?? ''))) {
    const g = r.kind === 'trip' ? compareGroup(r.trip, bikes) : null;
    if (!g) continue;
    const x = out.get(g.key) ?? { key: g.key, name: g.name, n: 0, rated: 0, last: null };
    x.n++;
    if (states[r.id]?.state === 'rated') {
      x.rated++;
      x.last ??= r.title;
    }
    out.set(g.key, x);
  }
  const list = [...out.values()];
  return [...list.filter((x) => x.key === 'bikepacking'), ...list.filter((x) => x.key !== 'bikepacking').sort((a, b) => b.rated - a.rated || b.n - a.n || a.name.localeCompare(b.name))];
}
