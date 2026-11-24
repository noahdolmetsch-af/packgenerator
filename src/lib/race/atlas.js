/**
 * «Rennen aus dem Rennatlas» (Noah 24.11.2026 «a»): races you picked in your own race list (a file,
 * JSON) become races of the app. Pure functions: read the file, say what is already there, make the
 * trip and the small record that stays on the race. Nothing is fetched and the file never leaves the
 * device. Tested in tests/atlas.test.js.
 *
 * File: { "format": "rennatlas", "races": [{ name, date, days, km, hm, city, land, surface, url,
 * status, registered, fav, source, checked }] } or the list alone. Only `name` is needed.
 */
export const MAX_ROWS = 400;
export const MAX_FILE = 2_000_000;

const text = (v, n = 120) => String(v ?? '').trim().slice(0, n);
const dayOf = (v) => (/^\d{4}-\d\d-\d\d$/.test(String(v ?? '')) ? String(v) : '');
const count = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};
const link = (v) => (/^https:\/\/[^\s]+$/i.test(String(v ?? '').trim()) ? String(v).trim().slice(0, 300) : '');

/** «6–10» → 10, 3 → 3, nothing → 1: the longest time is the plan (it never plans too tight). */
export function daysOf(v) {
  const all = String(v ?? '').match(/\d+/g);
  if (!all) return 1;
  return Math.max(1, Math.min(40, Number(all[all.length - 1])));
}

const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
/** One race of the file: the same name on the same day counts once. */
export const keyOf = (r) => `${norm(r.name)}|${r.date}`;

/** One row of the file → a clean row, or null without a name. */
export function rowOf(x) {
  if (!x || typeof x !== 'object') return null;
  const name = text(x.name, 80);
  if (!name) return null;
  return {
    name,
    date: dayOf(x.date),
    days: daysOf(x.days),
    daysText: text(x.days, 12),
    km: count(x.km),
    hm: count(x.hm),
    city: text(x.city),
    land: text(x.land, 60),
    surface: text(x.surface, 60),
    url: link(x.url),
    status: text(x.status, 60),
    registered: x.registered === true,
    fav: x.fav === true,
    source: text(x.source, 80),
    checked: dayOf(x.checked),
  };
}

/** The text of a file → { rows, error } with error 'unreadable', 'format', 'empty' or ''. The dated rows come first, by day; a race twice in the file counts once. */
export function parseAtlas(raw) {
  let json;
  try {
    json = JSON.parse(String(raw ?? ''));
  } catch {
    return { rows: [], error: 'unreadable' };
  }
  const list = Array.isArray(json) ? json : Array.isArray(json?.races) ? json.races : null;
  if (!list) return { rows: [], error: 'format' };
  const seen = new Set();
  const rows = list
    .slice(0, MAX_ROWS)
    .map(rowOf)
    .filter((r) => r && !seen.has(keyOf(r)) && seen.add(keyOf(r)));
  rows.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.name.localeCompare(b.name));
  return { rows, error: rows.length ? '' : 'empty' };
}


/** Is this race already one of your trips (same name and start day)? */
export const isKnown = (row, trips = []) => trips.some((t) => norm(t.title) === norm(row.name) && (t.startDate || '') === (row.date || ''));

/** The ones that are on by default: the races you are registered for and your favourites. */
export const preselected = (row) => row.registered || row.fav;

/** The small record that stays on the race (stored.atlas). */
export function atlasOf(row) {
  return {
    km: row.km,
    hm: row.hm,
    city: row.city,
    land: row.land,
    surface: row.surface,
    url: row.url,
    status: row.status,
    registered: row.registered,
    source: row.source,
    checked: row.checked,
  };
}

/** The line under the title of a race that has no route yet: what the list said. */
export function atlasLine(a) {
  if (!a || typeof a !== 'object') return null;
  const km = count(a.km);
  const hm = count(a.hm);
  return km || hm ? { km, hm } : null;
}
