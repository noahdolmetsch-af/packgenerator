/**
 * «Rennen aus dem Rennatlas» (Noah 24.11.2026 «a»): races you picked in your own race list (a file,
 * JSON) become races of the app. Pure functions: read the file, say what is already there, make the
 * trip and the small record that stays on the race. Nothing is fetched and the file never leaves the
 * device. Tested in tests/atlas.test.js.
 *
 * File: { "format": "rennatlas", "asOf": "2026-11-24", "races": [{ name, date, days, km, hm, city, land, surface, url,
 * status, registered, fav, source, checked, opens, closes, quality, note, lat, lon }] } or the list alone.
 * Only `name` is needed; the rest is shown when it is there.
 */
export const MAX_ROWS = 400;
export const MAX_FILE = 2_000_000;

const text = (v, n = 120) => String(v ?? '').trim().slice(0, n);
const dayOf = (v) => (/^\d{4}-\d\d-\d\d$/.test(String(v ?? '')) ? String(v) : '');
const count = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};
const coord = (v, max) => {
  const n = typeof v === 'number' ? v : Number.NaN;
  return Number.isFinite(n) && Math.abs(n) <= max ? Math.round(n * 1e4) / 1e4 : null;
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
    opens: dayOf(x.opens),
    closes: dayOf(x.closes),
    quality: text(x.quality, 60),
    note: text(x.note, 300),
    lat: coord(x.lat, 90),
    lon: coord(x.lon, 180),
  };
}

/** The text of a file → { rows, error, asOf } with error 'unreadable', 'format', 'empty' or ''. The dated rows come first, by day; a race twice in the file counts once. */
export function parseAtlas(raw) {
  let json;
  try {
    json = JSON.parse(String(raw ?? ''));
  } catch {
    return { rows: [], error: 'unreadable', asOf: '' };
  }
  const list = Array.isArray(json) ? json : Array.isArray(json?.races) ? json.races : null;
  if (!list) return { rows: [], error: 'format', asOf: '' };
  const seen = new Set();
  const rows = list
    .slice(0, MAX_ROWS)
    .map(rowOf)
    .filter((r) => r && !seen.has(keyOf(r)) && seen.add(keyOf(r)));
  rows.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.name.localeCompare(b.name));
  return { rows, error: rows.length ? '' : 'empty', asOf: dayOf(json?.asOf) };
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

const addDay = (day, n) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

/** The days a race takes, from its start to its last day (calendar days); null without a start day. */
export function rangeOf(row) {
  if (!row?.date) return null;
  return { from: row.date, to: addDay(row.date, Math.max(1, row.days || 1) - 1) };
}

/** Which of these races fall on the same days: { key → [names of the others] }. Races without a day never clash. */
export function overlaps(rows = []) {
  const dated = rows.map((r) => ({ r, g: rangeOf(r) })).filter((x) => x.g);
  const out = {};
  for (const a of dated) {
    for (const b of dated) {
      if (a === b || a.g.from > b.g.to || b.g.from > a.g.to) continue;
      (out[keyOf(a.r)] ??= []).push(b.r.name);
    }
  }
  return out;
}

/** The races by month: [{ key: '2027-06', rows }], the ones without a day last under key ''. */
export function byMonth(rows = []) {
  const groups = [];
  for (const r of rows) {
    const key = r.date ? r.date.slice(0, 7) : '';
    let g = groups.find((x) => x.key === key);
    if (!g) groups.push((g = { key, rows: [] }));
    g.rows.push(r);
  }
  return groups.sort((a, b) => (a.key || '9999').localeCompare(b.key || '9999'));
}

/** Where a day stands in a year, 0 to 100 (per cent of the 365 days); a day of another year is null. */
export function yearPos(day, year) {
  if (!day || day.slice(0, 4) !== String(year)) return null;
  const jan1 = Date.parse(`${year}-01-01T12:00:00Z`);
  return ((Date.parse(`${day}T12:00:00Z`) - jan1) / 864e5 / 365) * 100;
}

/**
 * Puts bars (with their label) on lanes so that none touches another: items [{ a, b }] in per cent
 * (b includes the label); returns the lane number of each item in the same order (greedy, by start).
 */
export function packLanes(items = [], gap = 1) {
  const order = items.map((_, i) => i).sort((x, y) => items[x].a - items[y].a);
  const ends = [];
  const lane = new Array(items.length).fill(0);
  for (const i of order) {
    let l = ends.findIndex((e) => e + gap <= items[i].a);
    if (l < 0) l = ends.length;
    ends[l] = items[i].b;
    lane[i] = l;
  }
  return lane;
}

/** The years in the races (in the order of the days), for the season grid. */
export const yearsOf = (rows = []) => [...new Set(rows.filter((r) => r.date).map((r) => r.date.slice(0, 4)))].sort();
