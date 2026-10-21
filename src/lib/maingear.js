/**
 * «Ausrüstung» (mockup AU1, Noah 15.10.2026 «5b» own place, «1-5a» with «1b»): the main equipment of
 * each sport (skis, skins, a racket, shoes, a cushion) with a counter and its care. Bikes keep their
 * own place (gear-pro-welt 12.10.2026 «2a»).
 *
 * One inventory (3a): an item of Material becomes main equipment; the mark lives on the item:
 *   item.main = { sport, unit, since, care: [{ id, name, every, unit }], done: { [careId]: { at, day } },
 *                 log: [{ id, day, n, h, km }] }
 * sport: 'dom:<area>' (an area of domains.js with sport, without a bike) or 'act:<id>' (an activity
 * of Aktiv, without the bike ones). unit: what the counter counts: 'uses' (always there, 12.10 «3a»),
 * 'hours', 'km' or 'days'. A care step counts in its own unit (a battery every 365 days on a counter
 * of uses).
 * Uses come by themselves: a past trip of the area with the item on its list, an entry of the activity
 * in Aktiv (with its minutes and km); «Einsatz eintragen» adds one by hand.
 * Everything is a suggestion: counter, care steps and intervals can be changed and removed.
 * Pure functions, tested in tests/maingear.test.js.
 */
import { DOMAINS } from './domains.js';
import { localDay } from './localday.js';

export const UNITS = ['uses', 'hours', 'km', 'days'];
export const UNIT_NAME = { uses: 'uses', hours: 'hours', km: 'km', days: 'days' };
/** Aktiv activities that belong to the bikes (their place is Velos). */
const BIKE_ACTS = new Set(['bike', 'spin']);
/** A care step is «soon» from this share of its interval on. */
export const SOON = 0.8;

const sportDomains = () => DOMAINS.filter((d) => d.sport && !d.bike);

/**
 * The sports equipment can belong to, in order: the areas with a sport (Ski touring, Hiking), then the
 * activities of Aktiv (without the bike ones). → [{ key, name, nameDe?, icon }]
 */
export function sportsOf(acts = []) {
  const out = sportDomains().map((d) => ({ key: `dom:${d.key}`, name: d.name, icon: d.icon ?? d.key }));
  // Impeccable bug: only «move» activities are sports (not meditation, sauna or brushing teeth), and a
  // name that is there already (an area «Hiking» and an activity «Hiking») shows once
  const seen = new Set(out.map((d) => String(d.name).toLowerCase()));
  for (const a of [...acts].sort((x, y) => (x.order ?? 0) - (y.order ?? 0))) {
    if (!a?.id || BIKE_ACTS.has(a.id) || a.paused) continue;
    if (a.ring && a.ring !== 'move') continue;
    const names = [a.name, a.nameDe].filter(Boolean).map((n) => String(n).toLowerCase());
    if (names.some((n) => seen.has(n))) continue;
    names.forEach((n) => seen.add(n));
    out.push({ key: `act:${a.id}`, name: a.name, nameDe: a.nameDe, icon: a.icon ?? 'heart' });
  }
  return out;
}

/**
 * The care steps suggested for a new piece of equipment, by sport and a word in its name (all of them
 * suggestions, changeable). → [{ name, every, unit }]
 */
export function careSuggest(sport = '', name = '') {
  const n = String(name).toLowerCase();
  if (sport === 'dom:ski') {
    if (/fell|skin/.test(n)) return [{ name: 'Check the skin glue', every: 20, unit: 'uses' }];
    if (/lvs|transceiver|avalanche|beacon/.test(n)) return [{ name: 'Change the batteries', every: 365, unit: 'days' }];
    if (/schuh|boot/.test(n)) return [{ name: 'Check the buckles', every: 365, unit: 'days' }];
    return [{ name: 'Wax the base', every: 10, unit: 'uses' }, { name: 'Sharpen the edges', every: 365, unit: 'days' }];
  }
  if (sport === 'act:tennis') return [{ name: 'Restring', every: 30, unit: 'hours' }];
  // Paket O (#197, #200): skates are sharpened after uses; rope and harness have an age limit
  if (sport === 'act:hockey' && /schlittschuh|skate/.test(n)) return [{ name: 'Sharpen the skates', every: 10, unit: 'uses' }];
  if (sport === 'act:climb' && /seil|rope/.test(n)) return [{ name: 'Check the rope for damage', every: 10, unit: 'uses' }, { name: 'Replace the rope', every: 3650, unit: 'days' }];
  if (sport === 'act:climb' && /gurt|harness/.test(n)) return [{ name: 'Replace the harness', every: 3650, unit: 'days' }];
  if (sport === 'dom:hiking' || sport === 'act:run' || /schuh|shoe/.test(n)) return [{ name: 'Waterproof', every: 300, unit: 'km' }];
  return [];
}

/** The unit a sport counts in by default (uses everywhere, 12.10 «3a»; km for running and hiking shoes). */
export const unitSuggest = (sport = '', name = '') => (sport === 'act:tennis' ? 'hours' : (sport === 'act:run' || sport === 'dom:hiking') && /schuh|shoe/i.test(name) ? 'km' : 'uses');

let seq = 0;
const newId = (p) => `${p}_${Date.now().toString(36)}${(seq++).toString(36)}`;
const posNum = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : 0);

/** A stored mark made whole (or null for an item that is not main equipment). */
export function mainOf(item) {
  const m = item?.main;
  if (!m || !m.sport) return null;
  return {
    sport: String(m.sport),
    unit: UNITS.includes(m.unit) ? m.unit : 'uses',
    since: /^\d{4}-\d{2}-\d{2}$/.test(m.since ?? '') ? m.since : null,
    care: (Array.isArray(m.care) ? m.care : []).filter((c) => c && c.name && posNum(c.every)).map((c) => ({ id: c.id ?? newId('care'), name: String(c.name), every: Math.round(posNum(c.every)), unit: UNITS.includes(c.unit) ? c.unit : 'uses' })),
    done: m.done && typeof m.done === 'object' ? m.done : {},
    log: (Array.isArray(m.log) ? m.log : []).filter((x) => x?.day),
  };
}

/** The mark for an item from the sheet's values (keeps its log and the care already done). */
export function markOf(old, { sport, unit, since, care = [] }) {
  const prev = old ? mainOf({ main: old }) : null;
  return {
    sport,
    unit: UNITS.includes(unit) ? unit : 'uses',
    since: since || prev?.since || null, // empty: everything counts, also the trips before the mark
    care: care.filter((c) => String(c.name ?? '').trim() && posNum(c.every)).map((c) => ({ id: c.id ?? newId('care'), name: String(c.name).trim(), every: Math.round(posNum(c.every)), unit: UNITS.includes(c.unit) ? c.unit : 'uses' })),
    done: prev?.done ?? {},
    log: prev?.log ?? [],
  };
}

const daysBetween = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);

/**
 * Where the uses of a piece of equipment come from: its own log, the past trips of its area with the
 * item on the list, the entries of its activity in Aktiv. → [{ day, n, h, km, from }] (day ≥ since)
 */
export function usesOf(item, { trips = [], log = [], today = localDay() } = {}) {
  const m = mainOf(item);
  if (!m) return [];
  const out = m.log.map((x) => ({ day: x.day, n: posNum(x.n) || (x.h || x.km ? 0 : 1), h: posNum(x.h), km: posNum(x.km), from: 'hand' }));
  if (m.sport.startsWith('dom:')) {
    const dom = m.sport.slice(4);
    for (const x of trips) {
      const day = x.startDate;
      if (!day || day > today || x.skipped || x.archivedAt || (x.domain ?? 'bikepacking') !== dom) continue;
      if (!(x.entries ?? []).some((e) => e.itemId === item.id)) continue;
      const days = Math.max(1, Math.round(Number(x.days) || 1));
      out.push({ day, n: days, h: 0, km: posNum(x.km), from: 'trip' });
    }
  } else if (m.sport.startsWith('act:')) {
    const act = m.sport.slice(4);
    for (const x of log) if (x.actId === act && x.day && x.day <= today) out.push({ day: x.day, n: 1, h: posNum(x.min) / 60, km: posNum(x.km), from: 'act' });
  }
  return out.filter((x) => !m.since || x.day >= m.since).sort((a, b) => a.day.localeCompare(b.day));
}

/** The counter in one unit up to a day (days: since the mark, or since a given day). */
export function countOf(uses, unit, { since = null, today = localDay(), from = null } = {}) {
  if (unit === 'days') return Math.max(0, daysBetween(from ?? since ?? today, today));
  const rows = from ? uses.filter((x) => x.day > from) : uses;
  const key = unit === 'hours' ? 'h' : unit === 'km' ? 'km' : 'n';
  const v = rows.reduce((s, x) => s + (x[key] || 0), 0);
  return unit === 'uses' ? Math.round(v) : Math.round(v * 10) / 10;
}

/**
 * The state of each care step: how far since it was last done, against its interval.
 * → [{ care, used, left, share, state: 'ok'|'soon'|'due', doneDay }]
 */
export function careState(item, ctx = {}) {
  const m = mainOf(item);
  if (!m) return [];
  const today = ctx.today ?? localDay();
  const uses = ctx.uses ?? usesOf(item, ctx);
  return m.care.map((c) => {
    const d = m.done[c.id] ?? null;
    const used = c.unit === 'days' ? countOf(uses, 'days', { from: d?.day ?? m.since ?? uses[0]?.day ?? today, today }) : countOf(uses, c.unit, { from: d?.day ?? null, today });
    const share = used / c.every;
    return { care: c, used, left: Math.max(0, Math.round((c.every - used) * 10) / 10), share, state: share >= 1 ? 'due' : share >= SOON ? 'soon' : 'ok', doneDay: d?.day ?? null };
  });
}

/** «Erledigt»: the care step starts again today. Returns the new mark. */
export function careDone(main, careId, today = localDay()) {
  return { ...main, done: { ...(main.done ?? {}), [careId]: { day: today } } };
}

/** One use by hand (n uses, or hours / km for those counters). Returns the new mark. */
export function addUse(main, { day, n = 1, h = 0, km = 0 }) {
  return { ...main, log: [...(main.log ?? []), { id: newId('use'), day, n: posNum(n), h: posNum(h), km: posNum(km) }] };
}

/** The season of a day: winter sports from 1 October, the others the calendar year. */
export const seasonStart = (sport, today = localDay()) => {
  const y = Number(today.slice(0, 4));
  if (sport === 'dom:ski') return Number(today.slice(5, 7)) >= 10 ? `${y}-10-01` : `${y - 1}-10-01`;
  return `${y}-01-01`;
};

/**
 * Everything the page shows for one piece of equipment.
 * → { item, main, uses, total, season, last, care: careState rows, due (n due), soon }
 */
export function rowOf(item, ctx = {}) {
  const main = mainOf(item);
  const today = ctx.today ?? localDay();
  const uses = usesOf(item, { ...ctx, today });
  const care = careState(item, { ...ctx, today, uses });
  const from = seasonStart(main.sport, today);
  return {
    item,
    main,
    uses,
    total: countOf(uses, main.unit, { since: main.since ?? uses[0]?.day ?? today, today }),
    season: countOf(uses.filter((x) => x.day >= from), main.unit, { since: from > (main.since ?? '') ? from : main.since, today }),
    seasonUses: countOf(uses.filter((x) => x.day >= from), 'uses'),
    last: uses.at(-1)?.day ?? null,
    care,
    due: care.filter((c) => c.state === 'due').length,
    soon: care.filter((c) => c.state === 'soon').length,
  };
}

/** All main equipment of the inventory, as rows (items without a mark left out, gone ones too). */
export function equipmentRows(items = [], ctx = {}) {
  return items.filter((i) => mainOf(i) && i.ownership !== 'gone').map((i) => rowOf(i, ctx));
}

/**
 * The page in groups by sport (2a), in the order of the sports; the sports without equipment come
 * last in one list (5a). → { groups: [{ sport, rows }], empty: [sport], other: rows of unknown sports }
 */
export function groupsOf(rows, sports) {
  const groups = [];
  const empty = [];
  for (const s of sports) {
    const r = rows.filter((x) => x.main.sport === s.key);
    if (r.length) groups.push({ sport: s, rows: r.sort((a, b) => b.due - a.due || String(a.item.name).localeCompare(String(b.item.name))) });
    else empty.push(s);
  }
  const known = new Set(sports.map((s) => s.key));
  const other = rows.filter((x) => !known.has(x.main.sport));
  if (other.length) groups.push({ sport: { key: 'other', name: 'Other|sport', icon: 'heart' }, rows: other });
  return { groups, empty };
}

/** The care steps due now, over all equipment, most overdue first (the box on top and the line on Heute, 4a). */
export function dueCare(rows) {
  return rows
    .flatMap((r) => r.care.filter((c) => c.state === 'due').map((c) => ({ row: r, ...c })))
    .sort((a, b) => b.share - a.share);
}
