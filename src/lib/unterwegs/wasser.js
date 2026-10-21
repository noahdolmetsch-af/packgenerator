/**
 * Paket K #322 «Wasser- und Essen-Rechner pro Tour»: how much to drink and eat on each day and on the
 * whole tour, against the bottles and the food in the packing list. Water and calories come from the
 * one energy rule (energie.js, Paket X): water per hour by the temperature (your Verpflegung values),
 * calories to eat from your carbohydrates per hour. A food item with «one per N hours» counts like in
 * the blocks of Unterwegs.
 * Pure functions, tested in tests/unterwegs-wasser.test.js.
 */
import { HOT_C } from '../blockplan.js';
import { valuesOf } from '../fuel.js';
import { waterLh, eatKcalH } from '../energie.js';

const r1 = (v) => Math.round(v * 10) / 10;

/**
 * days: [{ hours, hot (bool), temp (°C, the warmest riding hour, optional) }]; bottles: litres on the bike at
 * once; food: [{ id, name, perHours, qty }]; fuel: the Verpflegung setting (or null for the standard).
 * → { days: [{ hours, waterL, refills, kcal }], total: { hours, waterL, refills, kcal }, food: [{ id, name, need, have, short }] }
 */
export function waterFood({ days = [], bottles = 0, food = [], fuel = null } = {}) {
  const v = valuesOf(fuel);
  const eatH = eatKcalH(v);
  const rows = days.map((d) => {
    const h = Number.isFinite(d?.hours) && d.hours > 0 ? d.hours : 0;
    const temp = d?.hot ? Math.max(v.hotC, Number.isFinite(d?.temp) ? d.temp : -99) : Number.isFinite(d?.temp) ? Math.min(d.temp, HOT_C - 1) : null;
    const waterL = r1(h * waterLh(v, temp));
    const refills = bottles > 0 ? Math.max(0, Math.ceil(waterL / bottles - 1e-9) - 1) : null;
    return { hours: r1(h), waterL, refills, kcal: Math.round((h * eatH) / 50) * 50 };
  });
  const sum = (k) => rows.reduce((s, r) => s + (r[k] ?? 0), 0);
  const total = { hours: r1(sum('hours')), waterL: r1(sum('waterL')), refills: bottles > 0 ? sum('refills') : null, kcal: sum('kcal') };
  const list = food
    .filter((f) => f && f.perHours > 0)
    .map((f) => {
      const need = rows.reduce((s, r) => s + Math.floor(r.hours / f.perHours + 1e-9), 0);
      const have = Number.isFinite(f.qty) && f.qty > 0 ? f.qty : 1;
      return { id: f.id, name: f.name, need, have, short: Math.max(0, need - have) };
    });
  return { days: rows, total, food: list };
}

/** Is the day hot? The warmest hour of the saved forecast, else the trip weather word. */
export function hotDay(hours = [], tripWx = null) {
  const temps = (hours ?? []).map((h) => h?.temp).filter(Number.isFinite);
  if (temps.length) return Math.max(...temps) >= HOT_C;
  return /hot|heiss|warm/i.test(String(tripWx ?? ''));
}
