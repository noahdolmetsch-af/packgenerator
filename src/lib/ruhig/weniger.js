/**
 * Paket C «Ruhig und persönlich» › Weniger App für den Moment (996 Ideen UC-319-I3, UC-317-I3, UC-256-I2,
 * UC-217-I2). Four small things that make the app quieter, each one a suggestion you can switch off:
 *
 *   Arbeitsraum (SPACE_KEY)  { name, ids: [feature id], until: day | null, on }: for one plan (a trip,
 *                            a workshop Saturday) only the functions you chose, as a strip on top of every
 *                            page. It ends by itself after `until`.
 *   Ruhige Ansicht (CALM_KEY) { what, href, since }: one thing you do now, shown big and alone; numbers,
 *                            stars and suggestions rest (the strip says only «You are doing: …»).
 *   Erinnerungs-Budget (BUDGET_KEY) { on, perDay, order: [group] }: at most perDay phone reminders a day;
 *                            when there are more, your order of the groups decides. Safety (weather, ice,
 *                            light, rain on the way, eating on the ride) never counts against it.
 *   Nicht für mich (NOT_KEY) { [feature id]: { why, at } }: a function that is not for you. It stays in
 *                            «What the app can do», but the app stops putting it on top as «never used».
 * Pure, tested in tests/ruhig.test.js.
 */
import { clean, isDay, move } from './base.js';

export const SPACE_KEY = 'ruhig.space';
export const CALM_KEY = 'ruhig.calm';
export const BUDGET_KEY = 'ruhig.budget';
export const NOT_KEY = 'ruhig.notForMe';
export const SPACE_MAX = 8;

/* ---------- Arbeitsraum ---------- */

export function spaceOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const ids = [...new Set((Array.isArray(v.ids) ? v.ids : []).filter((x) => typeof x === 'string' && x))].slice(0, SPACE_MAX);
  return { name: clean(v.name, 60), ids, until: isDay(v.until) ? v.until : null, on: v.on === true && ids.length > 0 };
}
/** On and not over (the last day still counts). */
export const spaceActive = (s, today) => !!s?.on && s.ids.length > 0 && (!s.until || s.until >= today);
export const spaceAdd = (s, id) => (s.ids.includes(id) || s.ids.length >= SPACE_MAX ? s : { ...s, ids: [...s.ids, id] });
export const spaceDrop = (s, id) => {
  const ids = s.ids.filter((x) => x !== id);
  return { ...s, ids, on: s.on && ids.length > 0 };
};
export const spaceMove = (s, from, to) => ({ ...s, ids: move(s.ids, from, to) });

/** Ready-made starts for a workspace (English keys; the ids are features.js ids that exist). */
export const SPACE_STARTS = [
  { key: 'workshop', name: 'Workshop Saturday', ids: ['f.inspect', 'f.sparestock', 'f.partwear', 'f.workshop'] },
  { key: 'trip', name: 'Getting ready for a trip', ids: ['f.probe', 'f.shop', 'f.planb', 'f.departsheet'] },
  { key: 'week', name: 'A calm week', ids: ['f.weekplan', 'f.meditation', 'f.routine'] },
];

/* ---------- Ruhige Ansicht ---------- */

export function calmOf(value) {
  const v = value && typeof value === 'object' ? value : null;
  const what = clean(v?.what, 80);
  return what ? { what, href: typeof v.href === 'string' && v.href.startsWith('#/') ? v.href : '', since: typeof v.since === 'string' ? v.since : '' } : null;
}

/* ---------- Erinnerungs-Budget ---------- */

/** The groups of phone reminders, by the start of their key (push/schedule.js). Safety is never limited. */
export const BUDGET_GROUPS = [
  { key: 'trip', label: 'Trips and races', prefixes: ['eve', 'shop', 'race'] },
  { key: 'bike', label: 'Bike care', prefixes: ['wetchain', 'wear', 'workshop', 'shopjob'] },
  { key: 'home', label: 'Everyday', prefixes: ['bday', 'plant', 'own', 'note', 'supply', 'lend'] },
  { key: 'app', label: 'Backup and app', prefixes: ['backup'] },
];
export const SAFETY_PREFIXES = ['ice', 'wx', 'ww', 'ws', 'dark', 'rain', 'eat', 'air'];
export const PER_DAY_STD = 3;

export function budgetOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const n = Math.round(Number(v.perDay));
  const keys = BUDGET_GROUPS.map((g) => g.key);
  const order = [...new Set([...(Array.isArray(v.order) ? v.order.filter((k) => keys.includes(k)) : []), ...keys])];
  return { on: v.on === true, perDay: n >= 1 && n <= 10 ? n : PER_DAY_STD, order };
}
const prefixOf = (key) => String(key ?? '').split(/[^a-z]/i)[0];
/** The group of a reminder key ('safety', a BUDGET_GROUPS key, or 'other'). */
export function groupOfKey(key) {
  const p = prefixOf(key);
  if (SAFETY_PREFIXES.includes(p)) return 'safety';
  return BUDGET_GROUPS.find((g) => g.prefixes.includes(p))?.key ?? 'other';
}
/** A local day of a time in ms (the phone's clock). */
const dayOfMs = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
/**
 * The reminders that go out under the budget: per day all safety ones, then the others by the order of
 * the groups (then by time), at most perDay. → { items (in time order), held: [{ key, at, title }] }
 */
export function applyBudget(items = [], budget) {
  const b = budget?.order ? budget : budgetOf(budget);
  if (!b.on) return { items, held: [] };
  const rank = (it) => {
    const g = groupOfKey(it.key);
    const i = b.order.indexOf(g);
    return i < 0 ? b.order.length : i;
  };
  const byDay = new Map();
  for (const it of items) {
    const d = dayOfMs(it.at);
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d).push(it);
  }
  const keep = new Set();
  const held = [];
  for (const list of byDay.values()) {
    const safe = list.filter((it) => groupOfKey(it.key) === 'safety');
    safe.forEach((it) => keep.add(it));
    const rest = list.filter((it) => groupOfKey(it.key) !== 'safety').sort((a, b2) => rank(a) - rank(b2) || a.at - b2.at);
    rest.forEach((it, i) => (i < b.perDay ? keep.add(it) : held.push({ key: it.key, at: it.at, title: it.title })));
  }
  return { items: items.filter((it) => keep.has(it)), held: held.sort((a, c) => a.at - c.at) };
}

/* ---------- Nicht für mich ---------- */

export function notForMeOf(value) {
  const out = {};
  for (const [id, x] of Object.entries(value && typeof value === 'object' ? value : {})) if (id && x) out[id] = { why: clean(x.why, 120), at: isDay(x.at) ? x.at : '' };
  return out;
}
export const setNotForMe = (map, id, why = '', at = '') => ({ ...map, [id]: { why: clean(why, 120), at } });
export const unsetNotForMe = (map, id) => Object.fromEntries(Object.entries(map).filter(([k]) => k !== id));
/** Reasons to pick from (English keys); a typed one counts as well. */
export const NOT_WHY = ['I do this elsewhere', 'Not my kind of trip', 'Too much for me right now'];
/**
 * «What the app can do»: a row the person marked «Not for me» is no longer «never used» on top; it moves
 * to the end of its group and stays there to find (nothing hidden).
 */
export function lastIfNotForMe(rows, map) {
  const m = map ?? {};
  return [...rows.filter((r) => !m[r.id]), ...rows.filter((r) => m[r.id])];
}
