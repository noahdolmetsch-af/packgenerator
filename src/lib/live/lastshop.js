/**
 * «Letzter offener Laden vor der Nacht» (Noah 02.11.2026: «mit Einkaufsliste das wichtigste Feature» for races).
 * From the shops and petrol stations ahead on the route: the last one you reach while it is open and before
 * the sun sets. Pure, tested in tests/lastshop.test.js. Opening hours are OSM's (often missing: then the
 * answer says «not sure» and a shop with known hours wins over one without).
 */
import { gainBetween, rideH } from './live-lib.js';
import { openAt } from '../race/outside.js';

export const SHOP_KINDS = ['shop', 'fuel'];

/**
 * pois: places with km along the route; km: where you are; light: lightLeft() of here ({ set, dark });
 * → { state: 'dark' | 'ok' | 'none', last, next, ... } or null without a route position / light.
 *   last: { poi, distKm, eta, open: true|null, closes, minToClose, minToNight } the last place before the night
 *   next: the nearest place ahead (the one to use when it is already dark or no shop is left before the night)
 */
export function lastShopBeforeNight({ pois = [], km, now = Date.now(), pace = {}, profile = [], light = null, rangeKm = 150 }) {
  if (!Number.isFinite(km) || !light) return null;
  const rows = pois
    .filter((p) => SHOP_KINDS.includes(p.kind) && Number.isFinite(p.km) && p.km >= km - 0.1 && p.km - km <= rangeKm)
    .map((p) => {
      const distKm = Math.max(0, Math.round((p.km - km) * 10) / 10);
      const eta = Math.round(now + rideH(distKm, gainBetween(profile, km, p.km), pace) * 36e5);
      const st = p.hours ? openAt(p.hours, new Date(eta)) : { open: null, closes: null };
      return { poi: p, distKm, eta, open: st.open, closes: st.closes, opens: st.opens ?? null };
    })
    .filter((r) => r.open !== false)
    .sort((a, b) => a.distKm - b.distKm);
  const night = light.set;
  const nightIn = Math.round((night - now) / 6e4);
  const fin = (r) => ({ ...r, minToNight: Math.round((night - r.eta) / 6e4), minToClose: r.closes ? minutesTo(r.closes, r.eta) : null });
  const next = rows[0] ? fin(rows[0]) : null;
  if (light.dark || nightIn <= 0) return { state: 'dark', last: null, next, nightIn };
  const before = rows.filter((r) => r.eta <= night);
  // places with known hours win over places without; both: the farthest one
  const sure = before.filter((r) => r.open === true);
  const pick = (sure.length ? sure : before).at(-1);
  if (!pick) return { state: 'none', last: null, next, nightIn };
  return { state: 'ok', last: fin(pick), next, nightIn, sure: pick.open === true };
}

/** Minutes from a moment (ms) to the next «HH:MM» (a closing time, also past midnight → the next day). */
export function minutesTo(hhmm, eta) {
  const [h, m] = String(hhmm).split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const d = new Date(eta);
  const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h % 24, m).getTime();
  const diff = Math.round((at - eta) / 6e4);
  return diff < 0 ? diff + 1440 : diff;
}
