/**
 * Einzelidee Heute 1 (UC-004-I1 «Wetter an der Terrasse merken», Noah 25.10.2026): at home you note how
 * the forecast really felt on your own spot (terrace, balcony, garden): less, the same or more wind, less,
 * the same or more sun. From a few notes the app makes your own hints, e.g. «Bei Westwind ist es bei dir
 * meist ruhiger als angesagt». Observation only: the forecast itself is never changed.
 * Setting HOME_FEEL_KEY (synced, in the backup): [{ id, day, wind, dir, sunH, feltWind, feltSun }].
 * Pure functions, tested in tests/wetter-terrasse.test.js.
 */
export const HOME_FEEL_KEY = 'wxHomeFeel';
export const FELT = ['less', 'same', 'more'];
export const WIND_TEXT = { less: 'Less wind', same: 'As forecast', more: 'More wind' };
export const SUN_TEXT = { less: 'Less sun', same: 'As forecast', more: 'More sun' };
/** The four wind sides (from where the wind comes), English keys for t(). */
export const SIDES = ['north', 'east', 'south', 'west'];
/** A hint needs at least this many notes that agree, and more than half of them. */
export const MIN_NOTES = 2;
export const MAX = 200;
/** Weather codes that count as a sunny hour (clear, mainly clear). */
const SUNNY = (code) => Number.isFinite(code) && code <= 1;

const fin = (v) => typeof v === 'number' && Number.isFinite(v);
export const sideOf = (dir) => (fin(dir) ? SIDES[Math.round((((dir % 360) + 360) % 360) / 90) % 4] : null);

/** What the forecast said for the day on the spot (the hours 09–18): { wind (mean, km/h), dir, sunH }. */
export function forecastOf(hours = []) {
  const h = hours.filter((x) => fin(x?.wind));
  if (!h.length) return null;
  const wind = Math.round(h.reduce((s, x) => s + x.wind, 0) / h.length);
  // the direction of the mean wind vector, weighted by speed
  let sx = 0;
  let sy = 0;
  for (const x of h) if (fin(x.dir)) (sx += Math.sin((x.dir * Math.PI) / 180) * x.wind), (sy += Math.cos((x.dir * Math.PI) / 180) * x.wind);
  const dir = sx || sy ? Math.round(((Math.atan2(sx, sy) * 180) / Math.PI + 360) % 360) : null;
  return { wind, dir, sunH: hours.filter((x) => SUNNY(x?.code)).length };
}

export function homeFeelsOf(value) {
  return (Array.isArray(value) ? value : [])
    .filter((x) => x && /^\d{4}-\d\d-\d\d$/.test(x.day ?? '') && (FELT.includes(x.feltWind) || FELT.includes(x.feltSun)))
    .map((x) => ({ id: String(x.id ?? x.day), day: x.day, wind: fin(x.wind) ? x.wind : null, dir: fin(x.dir) ? x.dir : null, sunH: fin(x.sunH) ? x.sunH : null, feltWind: FELT.includes(x.feltWind) ? x.feltWind : null, feltSun: FELT.includes(x.feltSun) ? x.feltSun : null }));
}

/** Add a note (or replace the one of the same day). fc: forecastOf(...) of that day. */
export function addHomeFeel(list, { day, fc, feltWind = null, feltSun = null }, now = Date.now()) {
  if (!day || !(FELT.includes(feltWind) || FELT.includes(feltSun))) return list;
  const row = { id: `hf-${now.toString(36)}`, day, wind: fc?.wind ?? null, dir: fc?.dir ?? null, sunH: fc?.sunH ?? null, feltWind: FELT.includes(feltWind) ? feltWind : null, feltSun: FELT.includes(feltSun) ? feltSun : null };
  return [...list.filter((x) => x.day !== day), row].sort((a, b) => a.day.localeCompare(b.day)).slice(-MAX);
}
export const removeHomeFeel = (list, id) => list.filter((x) => x.id !== id);

/** The tendency of a list of «less / same / more»: { felt, n, of } when MIN_NOTES agree and more than half, else null. */
function tendency(vals) {
  const of = vals.length;
  for (const f of ['less', 'more', 'same']) {
    const n = vals.filter((v) => v === f).length;
    if (n >= MIN_NOTES && n * 2 > of) return { felt: f, n, of };
  }
  return null;
}

/**
 * Your own hints: per wind side (only notes with a forecast wind of 5 km/h or more) and for the sun.
 * → [{ kind: 'wind', side, felt, n, of } | { kind: 'sun', felt, n, of }]; «same» says the forecast fits.
 */
export function homeHints(list = []) {
  const out = [];
  for (const side of SIDES) {
    const t0 = tendency(list.filter((x) => x.feltWind && fin(x.wind) && x.wind >= 5 && sideOf(x.dir) === side).map((x) => x.feltWind));
    if (t0) out.push({ kind: 'wind', side, ...t0 });
  }
  const s = tendency(list.filter((x) => x.feltSun).map((x) => x.feltSun));
  if (s) out.push({ kind: 'sun', ...s });
  return out;
}

/** The hint that fits a day's forecast: the one of its wind side, else the sun hint, else null. */
export function hintFor(hints = [], fc) {
  const side = sideOf(fc?.dir);
  return (fc && fc.wind >= 5 && hints.find((h) => h.kind === 'wind' && h.side === side)) || hints.find((h) => h.kind === 'sun') || null;
}

/** The words of a hint (English keys for t(), with vars). */
export function hintText(h) {
  if (!h) return null;
  if (h.kind === 'wind') {
    const key = h.felt === 'less' ? 'With wind from the {side} it is mostly calmer on your spot than forecast ({n} of {of} times).' : h.felt === 'more' ? 'With wind from the {side} it is mostly windier on your spot than forecast ({n} of {of} times).' : 'With wind from the {side} the forecast fits your spot ({n} of {of} times).';
    return { key, vars: { side: h.side, n: h.n, of: h.of } };
  }
  const key = h.felt === 'less' ? 'Your spot gets mostly less sun than forecast: more shade ({n} of {of} times).' : h.felt === 'more' ? 'Your spot gets mostly more sun than forecast ({n} of {of} times).' : 'The sun of the forecast fits your spot ({n} of {of} times).';
  return { key, vars: { n: h.n, of: h.of } };
}
