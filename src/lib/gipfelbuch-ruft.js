/**
 * «Welcher Berg ruft?» (Noah 24.11.2026 «alle 1-5 zusammen», Gipfelbuch ausbauen, idea 5): when form and weather are good, one
 * summit or pass of the app's list that you do not have in the summit book yet. A pure function for Today (the sentence
 * under «Heute abhaken», built by the thread of the Heute prototype; agreed 24.11.2026): it only reads, nothing is written.
 *   level: the answer of the day from flow/form/tagesantwort.js dayAnswer(): 'rest' | 'easy' | 'normal' | 'hard' | null
 *   wx:    the weather of today { rainMm, tmax?, wind? } (for example from weekBest() of wetter/heutekarten.js when day === 'today'), or null
 *   home:  { lat, lon } of the home place, or null (then nothing is suggested: «near» needs a place)
 * Season: from November to April nothing from 1800 m up, in May nothing from 2300 m up (snow); a pass is a ride, a summit a hike.
 * Only a suggestion, no promise: the list is a rounded catalogue, the page of the place says where to look. Tested in tests/gipfelruft.test.js.
 */
import { mapRows } from './gipfelkarte.js';
import { t, num } from './i18n.svelte.js';

/** Dry enough: at most this much rain (mm) and at most this wind (km/h). */
export const MAX_RAIN_MM = 1;
export const MAX_WIND = 35;
/** Not further than this (km, as the crow flies) from home. */
export const MAX_KM = 90;

/** The highest place that is still free of snow in a month (1–12). */
export function snowFree(month) {
  if (month >= 6 && month <= 10) return Infinity;
  if (month === 5) return 2300;
  return 1800; // November to April
}

/**
 * → { kind: 'hard' | 'normal', it, km, href } or null. `it` is the item of the catalogue (name, m, kind 'peak'|'pass', lat, lon).
 * `today` is a day YYYY-MM-DD (the month decides the snow rule).
 */
export function bergRuft({ level, wx, home, book, catalog, today }) {
  if (level !== 'hard' && level !== 'normal') return null;
  if (!wx || !Number.isFinite(wx.rainMm) || wx.rainMm > MAX_RAIN_MM) return null;
  if (Number.isFinite(wx.wind) && wx.wind > MAX_WIND) return null;
  if (!home || !Array.isArray(catalog) || !catalog.length || !book) return null;
  const free = snowFree(Number(String(today).slice(5, 7)));
  const { rows } = mapRows(catalog.filter((c) => (c.m ?? 0) < free), book, home, { n: 0, withOwn: false });
  // level 'hard': the higher the better within the reach; 'normal': the nearest
  const open = rows.filter((r) => r.st !== 'have' && r.km != null && r.km <= MAX_KM);
  if (!open.length) return null;
  const pick = level === 'hard' ? [...open].sort((a, b) => (b.it.m ?? 0) - (a.it.m ?? 0) || a.km - b.km)[0] : [...open].sort((a, b) => a.km - b.km)[0];
  return { kind: level, it: pick.it, km: pick.km, href: '#/flow/gipfelbuch/karte' };
}

/** The sentence for Today: a question for a strong day, a quiet hint for a normal one. */
export function ruftSatz(r) {
  if (!r) return '';
  const km = Math.round(r.km);
  const what = { name: r.it.name, m: num(r.it.m ?? 0), km };
  return r.kind === 'hard'
    ? t('Today feels strong. Which mountain calls? {name} ({m} m, {km} km away) is not in your summit book yet.', what)
    : t('Form and weather fit. {name} ({m} m, {km} km away) is not in your summit book yet.', what);
}
