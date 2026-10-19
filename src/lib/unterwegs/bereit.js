/**
 * Paket K #280 «Bereit für heute?» (Noah 12.10.2026: on every draft of a planned tour and on the tour
 * morning, «immer, nicht nur am Tourmorgen»): a calm hint from the night (sleep, HRV, resting pulse
 * from Fitbit) and the last rides, e.g. «eher kürzer». Observation only, never a rule; without data it
 * says so quietly.
 * Pure functions, tested in tests/unterwegs-bereit.test.js.
 */
import { normalOf, latest } from '../health.js';

const addDays = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** km per day from activities ({ day, km }) or, when there are none, from the uploaded rides ({ date, km }). */
export function kmByDay(activities = [], rides = []) {
  const out = {};
  const src = activities.length ? activities.map((a) => [a.day, a.km]) : rides.map((r) => [r.date, r.km]);
  for (const [d, km] of src) if (typeof d === 'string' && Number.isFinite(km) && km > 0) out[d] = (out[d] ?? 0) + km;
  return out;
}

/**
 * health: rows of healthDays ({ date, sleep: { asleepMin }, hrvMs, restingHr }), sorted by date;
 * km: { day: km } ; today: 'YYYY-MM-DD'.
 * → { level: 'none' | 'ok' | 'easy' | 'short', signs: [{ key, text, vars }], data: bool }
 *   signs are English keys for t() with their numbers.
 */
export function readiness({ health = [], km = {}, today }) {
  const signs = [];
  let data = false;
  const night = latest(health, 'sleep', today);
  if (night && night.date >= addDays(today, -1) && Number.isFinite(night.sleep?.asleepMin)) {
    data = true;
    const min = night.sleep.asleepMin;
    const normal = normalOf(health, 'sleep', today);
    if (min < 360 || (normal && min < normal - 60)) signs.push({ key: 'sleep', text: 'Slept {h} h, less than usual', vars: { h: (Math.round(min / 6) / 10).toFixed(1) } });
  }
  const hrvRow = latest(health, 'hrvMs', today);
  if (hrvRow && hrvRow.date >= addDays(today, -1) && Number.isFinite(hrvRow.hrvMs)) {
    data = true;
    const n = normalOf(health, 'hrvMs', today);
    if (n && hrvRow.hrvMs < n * 0.85) signs.push({ key: 'hrv', text: 'HRV {v} ms, lower than usual ({n})', vars: { v: Math.round(hrvRow.hrvMs), n: Math.round(n) } });
  }
  const hrRow = latest(health, 'restingHr', today);
  if (hrRow && hrRow.date >= addDays(today, -1) && Number.isFinite(hrRow.restingHr)) {
    data = true;
    const n = normalOf(health, 'restingHr', today);
    if (n && hrRow.restingHr >= n + 5) signs.push({ key: 'hr', text: 'Resting pulse {v}, higher than usual ({n})', vars: { v: Math.round(hrRow.restingHr), n: Math.round(n) } });
  }
  const days = Object.keys(km);
  if (days.length) {
    const last3 = [1, 2, 3].reduce((s, i) => s + (km[addDays(today, -i)] ?? 0), 0);
    let month = 0;
    for (let i = 1; i <= 30; i++) month += km[addDays(today, -i)] ?? 0;
    if (month > 0) data = true;
    const usual3 = (month / 30) * 3;
    if (last3 >= 60 && last3 > usual3 * 1.6) signs.push({ key: 'load', text: '{km} km in the last 3 days, more than usual', vars: { km: Math.round(last3) } });
  }
  const level = !data ? 'none' : signs.length === 0 ? 'ok' : signs.length === 1 ? 'easy' : 'short';
  return { level, signs, data };
}

/** The one line of a level (English keys). */
export const LEVEL_TEXT = {
  none: 'No sleep or ride data yet. With Fitbit or Strava connected a calm hint appears here.',
  ok: 'Everything in your usual range. Enjoy the ride.',
  easy: 'One sign: maybe start calmly.',
  short: 'Several signs: maybe a shorter round today?',
};

/* ---------- #206 «Hör-Tipp pro Tourart» ---------- */
export const LISTEN_KEY = 'listenTips';
const okUrl = (u) => {
  try {
    const x = new URL(String(u ?? '').trim());
    return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : null;
  } catch {
    return null;
  }
};
/** The stored tips made safe: [{ id, domain, name, url }] (any number per kind of tour). */
export function tipsOf(v) {
  return (Array.isArray(v) ? v : [])
    .map((x) => (x && okUrl(x.url) ? { id: String(x.id ?? x.url), domain: String(x.domain ?? ''), name: String(x.name ?? '').trim() || okUrl(x.url), url: okUrl(x.url) } : null))
    .filter(Boolean);
}
export const tipsFor = (tips, domain) => tips.filter((x) => x.domain === domain);
/** Add a tip; returns the new list, or null when the link is not a web address. */
export function addTip(tips, { domain, name, url }, id = `lt-${Date.now().toString(36)}`) {
  const u = okUrl(url);
  return u ? [...tips, { id, domain, name: String(name ?? '').trim() || u, url: u }] : null;
}
export const renameTip = (tips, id, name) => tips.map((x) => (x.id === id ? { ...x, name: String(name ?? '').trim() || x.name } : x));
export const dropTip = (tips, id) => tips.filter((x) => x.id !== id);
