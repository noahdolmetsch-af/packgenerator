/**
 * Paket X «Energie» (Noah 19.10.2026): ONE rule for what a ride uses and what to eat and drink, for tour
 * planning, races, Unterwegs, the live map and the ride review. It replaces the old separate guesses
 * (250 kcal per hour on Unterwegs, 400 kcal per hour on a race, 0.5 l per hour in the blocks).
 *
 * - Used (burn): the effort on the flat by your speed (the usual MET values of cycling) × your weight,
 *   plus the climbing (rider and bike lifted, at about 25 % body efficiency). Cold below 5 °C and heat
 *   above 30 °C add a little (5 %).
 * - Eat: your carbohydrates per riding hour (Verpflegung, standard 60 g) as food, about 5 kcal per gram
 *   of carbohydrate with the rest of the food. Nobody eats all they use: the gap is normal.
 * - Drink: the one water rule of Verpflegung (fuel.js waterLh), by the temperature when you are there
 *   (the weather core) and the climbing.
 * Everything is a guess and a suggestion: your values under Verpflegung change it. Pure functions,
 * tested in tests/energie.test.js.
 */
import { STANDARD, valuesOf, waterLh } from './fuel.js';

export { waterLh };
/** Without a body weight in the app (Ich › Gewicht). */
export const KG_STD = 75;
/** Bike and luggage lifted with you on a climb. */
export const LOAD_KG_STD = 15;
/** Without a speed: a calm touring pace. */
export const KMH_STD = 18;
/** MET of cycling by average speed (km/h → MET), between the points straight lines. */
export const MET = [
  [8, 3.5],
  [16, 5],
  [20, 6.8],
  [25, 9],
  [30, 11],
  [40, 14],
];
/** Body efficiency on a climb. */
export const EFFICIENCY = 0.25;
/** kcal per gram of carbohydrate eaten, with the rest of the food. */
export const KCAL_PER_G_CARBS = 5;
export const COLD_C = 5;
export const HEAT_C = 30;

const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const r10 = (v) => Math.round(v / 10) * 10;
const r1 = (v) => Math.round(v * 10) / 10;

/** The MET at a speed. */
export function metAt(kmh) {
  const v = fin(kmh) && kmh > 0 ? kmh : KMH_STD;
  if (v <= MET[0][0]) return MET[0][1];
  for (let i = 1; i < MET.length; i++) {
    const [a, ma] = MET[i - 1];
    const [b, mb] = MET[i];
    if (v <= b) return ma + ((mb - ma) * (v - a)) / (b - a);
  }
  return MET.at(-1)[1];
}

/** The body weight in kg from the setting riderWeightG (grams), or null. */
export const riderKg = (g) => (fin(g) && g >= 30000 && g <= 250000 ? Math.round(g / 100) / 10 : null);

/** kcal used per riding hour. climbMh: metres up per riding hour. */
export function burnKcalH({ kg = KG_STD, kmh = KMH_STD, climbMh = 0, loadKg = LOAD_KG_STD, tempC = null } = {}) {
  const w = fin(kg) && kg > 0 ? kg : KG_STD;
  const load = fin(loadKg) && loadKg >= 0 ? loadKg : LOAD_KG_STD;
  const flat = metAt(kmh) * w;
  const climb = ((fin(climbMh) && climbMh > 0 ? climbMh : 0) * (w + load) * 9.81) / EFFICIENCY / 4184;
  const air = fin(tempC) && (tempC < COLD_C || tempC > HEAT_C) ? 1.05 : 1;
  return r10((flat + climb) * air);
}

/** kcal to eat per riding hour from your carbohydrates per hour (Verpflegung). */
export const eatKcalH = (values = STANDARD) => r10((fin(values?.carbsGh) ? values.carbsGh : STANDARD.carbsGh) * KCAL_PER_G_CARBS);

/**
 * A ride (or a day, a race): hours riding, km, metres up, the temperature (the warmest riding hour from
 * the weather core, or null), kg, your Verpflegung setting.
 * → { hours, kmh, burnH, burn, eatH, eat, carbsG, waterLh, waterL }
 */
export function energyFor({ hours, km = null, gainM = 0, tempC = null, kg = null, loadKg = LOAD_KG_STD, fuel = null } = {}) {
  const h = fin(hours) && hours > 0 ? hours : 0;
  const v = valuesOf(fuel);
  const kmh = h > 0 && fin(km) && km > 0 ? km / h : KMH_STD;
  const climbMh = h > 0 && fin(gainM) ? gainM / h : 0;
  const burnH = burnKcalH({ kg: kg ?? KG_STD, kmh, climbMh, loadKg, tempC });
  const eatH = eatKcalH(v);
  const lh = waterLh(v, tempC, climbMh);
  return { hours: r1(h), kmh: r1(kmh), burnH, burn: r10(burnH * h), eatH, eat: r10(eatH * h), carbsG: Math.round((v.carbsGh * h) / 5) * 5, waterLh: lh, waterL: r1(lh * h) };
}

/** Rounded for a big number (a race): to the hundred under 10 000, else to the thousand. */
export const roundBig = (kcal) => (kcal >= 10000 ? Math.round(kcal / 1000) * 1000 : Math.round(kcal / 100) * 100);

/**
 * Soll gegen Ist (Paket X, 0.171): what you entered as drunk on a day (Körperwerte, setting 'me.water'
 * { entries: [{ day, l }] }, only on this device), read here without changing it. → litres or null.
 */
export const WATER_KEY = 'me.water';
export function drunkOn(value, day) {
  const e = (Array.isArray(value?.entries) ? value.entries : []).filter((x) => x?.day === day && Number.isFinite(Number(x.l)) && Number(x.l) > 0);
  return e.length ? Math.round(Number(e.at(-1).l) * 10) / 10 : null;
}
