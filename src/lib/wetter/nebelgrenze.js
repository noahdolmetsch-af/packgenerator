/**
 * «Nebelgrenze» (Noah 05.11.2026 «1a 2b 3a 4b»): the top of the low fog or low cloud deck («Hochnebel»), in metres
 * above sea level, always shown next to the weather. Open-Meteo has no such value. It is worked out from the air
 * layers of the weather model (temperature, humidity and height at 1000, 975, 950, 925, 900 and 850 hPa, about
 * 100 m to 1500 m above sea level): the fog deck is the damp layer (humidity 90 % or more) that sits on a low-cloud
 * hour, and its top is where the humidity drops through 85 %. It must be capped: the air above is not colder
 * than a damp layer would be (an inversion). A deep rain cloud is not a fog deck and gives no value.
 * That is a guess with the precision of the layers (about 200 m), shown rounded to 100 m and said so.
 *
 * - The air layers come from wetter/profil.js (ONE request per place, shared with the temperatures by height).
 * - fogOf: one hour → { top, ground } (a fog deck) or { top: null } (no deck) or null (no data).
 * - summary: everything the page and Today show: the line now, the sun above, your place, the clearing time,
 *   six times of the day, the temperature above against below and the sight.
 *
 * Everything is a suggestion and switchable: setting 'fogHome' (false = no line on Today); «your height»
 * is the one of the snow line (setting 'snowOwnM', else the height of the place). Pure functions, tested in
 * tests/nebelgrenze.test.js.
 */
import { localDate, localHour, atLocal } from './kern.js';
import { profile, tempAt } from './profil.js';
import { ownHeight, SLOTS } from './schneegrenze.js';

export const HOME_KEY = 'fogHome';
export const STEP_M = 100;
/** A damp layer: humidity (%) from here up. Its top: where the humidity drops through the second number. */
export const DAMP = 90;
export const TOP_AT = 85;
/** At least this much low cloud (%) for a fog deck, and the deck must start within this height above the ground (m). */
export const LOW_CLOUD = 70;
export const STARTS_WITHIN_M = 1200;
/** A capped top: the air above is warmer than this lapse (°C per 100 m). A damp layer cools by about -0.55. */
export const CAP_LAPSE = -0.3;
/** Above this, sun against cloud above the deck (the higher of mid and high cloud, %). */
export const SUN_BELOW = 50;
/** The height for the temperature above when there is no fog (m). */
export const UP_M = 1000;
/** Show the temperature line only from this difference (°C). */
export const UP_MIN = 2;

const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const round = (m) => Math.max(0, Math.round(m / STEP_M) * STEP_M);

/**
 * One hour → { top, ground } (a fog deck up to `top` m above sea level; ground: it reaches the ground),
 * { top: null } (no deck) or null (the hour has no cloud or layer values).
 */
export function fogOf(h, elev) {
  if (!h || !fin(h.low)) return null;
  const pts = profile(h, elev);
  if (pts.length < 2) return null;
  if (h.low < LOW_CLOUD) return { top: null };
  const first = pts.findIndex((p) => p.rh >= DAMP && (!fin(elev) || p.z - elev <= STARTS_WITHIN_M));
  if (first < 0) return { top: null };
  let k = first;
  while (k + 1 < pts.length && pts[k + 1].rh >= DAMP) k++;
  const n = pts[k + 1];
  if (!n) return { top: null }; // damp all the way up: deep cloud, not a fog deck
  const a = pts[k];
  if (((n.t - a.t) / (n.z - a.z)) * 100 < CAP_LAPSE) return { top: null }; // not capped: no fog deck
  const frac = Math.min(1, Math.max(0, (a.rh - TOP_AT) / (a.rh - n.rh)));
  const top = round(a.z + frac * (n.z - a.z));
  return { top, ground: first === 0 };
}

/** The hour that holds the time. */
const hourAt = (fog, now) => (fog?.hours ?? []).find((x) => x.ms <= now && now < x.ms + 36e5) ?? null;

/** Today's hours from the one that holds `now` (not before 6 h) until 21 h, at the place. */
function restOfDay(fog, now) {
  const off = fog?.offset ?? 0;
  const d = localDate(now, off);
  const from = Math.max(atLocal(d, 6, off), Math.floor((now - off * 1000) / 36e5) * 36e5 + off * 1000);
  return (fog?.hours ?? []).filter((h) => h.ms >= from - 1 && h.ms < atLocal(d, 22, off));
}

/** The fog at 6, 9, 12, 15, 18 and 21 h today → [{ hour, top }] (top null: no deck; an hour without data is left out). */
export function slots(fog, now = Date.now()) {
  const off = fog?.offset ?? 0;
  const d = localDate(now, off);
  return (fog?.hours ?? [])
    .filter((h) => h.ms >= atLocal(d, 6, off) - 1 && h.ms < atLocal(d, 22, off) && SLOTS.includes(localHour(h.ms, off)))
    .map((h) => ({ hour: localHour(h.ms, off), f: fogOf(h, fog.elev) }))
    .filter((s) => s.f)
    .map((s) => ({ hour: s.hour, top: s.f.top }));
}

/**
 * When the fog clears (or comes) today (Noah «Verlauf»): { kind: 'clears' | 'stays' | 'comes', hour? } or null.
 * Fog now and none later: 'clears' at that hour; fog until 21 h: 'stays'; none now and fog later: 'comes'.
 */
export function clearing(fog, now = Date.now()) {
  const off = fog?.offset ?? 0;
  const rest = restOfDay(fog, now)
    .map((h) => ({ hour: localHour(h.ms, off), f: fogOf(h, fog.elev) }))
    .filter((s) => s.f);
  const cur = rest[0];
  if (!cur) return null;
  if (cur.f.top != null) {
    const later = rest.find((s) => s.f.top == null);
    return later ? { kind: 'clears', hour: later.hour } : { kind: 'stays' };
  }
  const later = rest.find((s) => s.f.top != null);
  return later ? { kind: 'comes', hour: later.hour } : null;
}

/** The sight now in metres, or null. */
export const sightNow = (fog, now = Date.now()) => {
  const v = hourAt(fog, now)?.vis;
  return fin(v) ? Math.round(v) : null;
};

/** The sight as a number and a unit: below 1 km in metres (rounded to 50), up to 20 km in km, above «20+». */
export function sightParts(m) {
  if (!fin(m)) return null;
  if (m < 1000) return { v: Math.max(50, Math.round(m / 50) * 50), unit: 'm' };
  const km = m / 1000;
  if (km >= 20) return { v: 20, unit: 'km', over: true };
  return { v: km < 10 ? Math.round(km * 10) / 10 : Math.round(km), unit: 'km' };
}

/**
 * Everything for the display: { now: { top, ground } | { top: null }, above: 'sun' | 'cloud' | null, own: { m, in },
 * up: { h, diff } | null, clearing, slots, sight, mix } or null without any value. `ownSet` is the height set in the
 * snow line settings (empty: the height of the place).
 */
export function summary(fog, now = Date.now(), ownSet = null) {
  const h = hourAt(fog, now);
  const f = fogOf(h, fog?.elev);
  if (!f) return null;
  const top = f.top;
  let above = null;
  if (top != null && fin(h.mid) && fin(h.high)) above = Math.max(h.mid, h.high) < SUN_BELOW ? 'sun' : 'cloud';
  const ownM = ownHeight({ elev: fog.elev }, ownSet);
  const own = top != null && ownM != null ? { m: ownM, in: ownM <= top } : null;
  // the temperature above against below: above the fog deck (or at 1000 m without one) against the surface
  const pts = profile(h, fog.elev);
  const upM = top != null ? Math.ceil((top + STEP_M) / STEP_M) * STEP_M : UP_M;
  const tUp = fin(fog.elev) && upM > fog.elev + STEP_M ? tempAt(pts, upM) : null;
  const diff = tUp != null && fin(h.t) ? Math.round(tUp - h.t) : null;
  const up = diff != null && Math.abs(diff) >= UP_MIN ? { h: upM, diff } : null;
  return { now: f, above, own, up, clearing: clearing(fog, now), slots: slots(fog, now), sight: sightParts(sightNow(fog, now)) };
}

/** The fog at a time (ms): { top, ground } (a deck), { top: null } (none) or null (no data for that hour). */
export const fogAtTime = (fog, ms) => fogOf(hourAt(fog, ms), fog?.elev);
