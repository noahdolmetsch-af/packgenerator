/**
 * «Nächstes Wasser» (Noah 02.11.2026, Vorschlag 2 «reicht deine Flasche?»): from the water places, shops and petrol
 * stations ahead on the route, the nearest place where you can fill up, and whether what is left in your bottle
 * lasts until then. Pure, tested in tests/water.test.js. A shop or petrol station only counts when it is open
 * when you get there (unknown hours count as «maybe»); a water tap or fountain counts always.
 */
import { gainBetween, rideH } from './live-lib.js';
import { openAt } from '../race/outside.js';

export const WATER_KINDS = ['water', 'shop', 'fuel'];
export const BOTTLE_ML = 1500;
export const DRINK_ML_H = 500;
/** What you drink per hour: warm days need more. */
export const drinkPerH = (tempC, base = DRINK_ML_H) => (Number.isFinite(tempC) && tempC >= 25 ? Math.round(base * 1.6) : base);

/**
 * pois: places with km along the route; km: where you are; haveMl: what is left in your bottle(s);
 * rateMlH: what you drink per hour.
 * → { state: 'ok' | 'tight' | 'short' | 'none', next, needMl, haveMl, lastsKm } or null without a position
 *   next: { poi, distKm, eta, open: true | null (shops: null = hours unknown), sure } the nearest place to fill up
 *   state: ok = the bottle lasts with a reserve of a quarter; tight = it lasts, but with less than that;
 *          short = it does not last; none = no place ahead (then only lastsKm counts)
 */
export function nextWater({ pois = [], km, now = Date.now(), pace = {}, profile = [], haveMl = BOTTLE_ML, rateMlH = DRINK_ML_H, rangeKm = 200 }) {
  if (!Number.isFinite(km)) return null;
  const rows = pois
    .filter((p) => WATER_KINDS.includes(p.kind) && Number.isFinite(p.km) && p.km >= km - 0.1 && p.km - km <= rangeKm)
    .map((p) => {
      const distKm = Math.max(0, Math.round((p.km - km) * 10) / 10);
      const h = rideH(distKm, gainBetween(profile, km, p.km), pace);
      const eta = Math.round(now + h * 36e5);
      const shop = p.kind !== 'water';
      const st = shop && p.hours ? openAt(p.hours, new Date(eta)) : { open: shop ? null : true };
      return { poi: p, distKm, eta, hours: h, open: st.open, sure: !shop || st.open === true };
    })
    .filter((r) => r.open !== false)
    // a sure place beats an unsure one that is not much nearer; otherwise the nearest
    .sort((a, b) => a.distKm - b.distKm);
  const kmh = pace?.kmh > 0 ? pace.kmh : 18;
  const lastsKm = rateMlH > 0 ? Math.round((haveMl / rateMlH) * kmh * 10) / 10 : null;
  const next = rows.find((r) => r.sure) ?? rows[0] ?? null;
  if (!next) return { state: 'none', next: null, needMl: null, haveMl, lastsKm };
  const needMl = Math.round(next.hours * rateMlH);
  const state = haveMl >= needMl * 1.25 ? 'ok' : haveMl >= needMl ? 'tight' : 'short';
  return { state, next, needMl, haveMl, lastsKm };
}
