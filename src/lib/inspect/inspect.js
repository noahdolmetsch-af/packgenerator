/**
 * «Velo-Inspektion» (Noah 19.10.2026 «1a 2a 3a 4a 5a»): the pure rules. Tested in tests/inspect.test.js.
 *
 * (1) The person's checklist (rule 18 «alles selbst bearbeiten», rule 17 «Gruppen überall»): stored in
 *     settings INSPECT_LIST as a difference to the template (items.js), so a point the app adds later
 *     still comes:
 *     { names: { id: name }, gone: [ids], own: [{ id, area, name, level, note, url }],
 *       areaNames: { areaId: name }, ownAreas: [{ id, name }], areasGone: [areaIds],
 *       moved: { pointId: areaId | '' }, order: { areaId: [pointIds] }, areaOrder: [areaIds] }
 *     A deleted area hands its points to another area or to «Ohne Gruppe» (area ''); «Standard» brings
 *     everything back.
 * (2) When an inspection is due (3a): km and/or days since the last one of that level (a full inspection
 *     counts for the monthly one too), whichever comes first. The km are weighted: a ride on a rainy day
 *     counts ×1.5, a trail ride ×1.3, a gravel ride ×1.15 (visible, switchable off per bike). The full
 *     inspection is also suggested at the start of the season (March, April).
 * (3) The chain trend: from the measured values, about how many km until the limit.
 * (4) What a finished inspection writes: part history entries (care.js logPart) and problems
 *     (maintenance, fix 'self' or 'shop': the shop ones go into the workshop order by themselves).
 */
import { ITEMS, ITEM, AREAS, LEVEL, LEVEL_RANK } from './items.js';

/** Keys: the person's checklist (settings), the rain days at the home place (meta, rain.js). */
export const INSPECT_LIST = 'inspectList';
export const INSPECT_RAIN = 'inspectRain';
/** Noah 19.10.2026 «1 check möglich als einstellung»: suggest the Kurzcheck before a tour (settings, on unless switched off). */
export const INSPECT_TRIP = 'inspectBeforeTrip';

/** The weights (3a). */
export const FACTOR = { wet: 1.5, trail: 1.3, gravel: 1.15 };
/** A day counts as rainy from this much rain at the home place (mm). */
export const WET_MM = 1;

const MS = 864e5;
const ms = (d) => Date.parse(`${d}T00:00:00Z`);
export const addDays = (d, n) => new Date(ms(d) + n * MS).toISOString().slice(0, 10);
export const daysBetween = (a, b) => Math.round((ms(b) - ms(a)) / MS);

/* ---------- (1) the person's checklist ---------- */

const arr = (x) => (Array.isArray(x) ? x : []);
const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const str = (x) => (typeof x === 'string' ? x : '');
/**
 * Was this ride wet? wetDays: a Set of rainy days (at home), or a function (ride) → boolean
 * (Noah 19.10.2026 «3a»: the rain where the Strava ride started, rain.js wetOf).
 */
export const isWet = (wetDays, e) => (typeof wetDays === 'function' ? !!wetDays(e) : !!wetDays?.has?.(e?.date));

/** The stored record as a whole object (anything broken is left out). */
export function normList(raw) {
  const r = obj(raw);
  return {
    names: Object.fromEntries(Object.entries(obj(r.names)).filter(([, v]) => typeof v === 'string' && v.trim())),
    gone: arr(r.gone).filter((x) => typeof x === 'string'),
    own: arr(r.own)
      .filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string')
      .map((p) => ({ id: p.id, area: str(p.area), name: p.name, level: LEVEL[p.level] ? p.level : 'full', note: str(p.note), url: str(p.url) })),
    areaNames: Object.fromEntries(Object.entries(obj(r.areaNames)).filter(([, v]) => typeof v === 'string' && v.trim())),
    ownAreas: arr(r.ownAreas).filter((a) => a && typeof a.id === 'string' && typeof a.name === 'string').map((a) => ({ id: a.id, name: a.name })),
    areasGone: arr(r.areasGone).filter((x) => typeof x === 'string'),
    moved: Object.fromEntries(Object.entries(obj(r.moved)).filter(([, v]) => typeof v === 'string')),
    order: Object.fromEntries(Object.entries(obj(r.order)).map(([k, v]) => [k, arr(v).filter((x) => typeof x === 'string')])),
    areaOrder: arr(r.areaOrder).filter((x) => typeof x === 'string'),
  };
}

/** Has the person changed anything? */
export function listChanged(raw) {
  const l = normList(raw);
  return !!(Object.keys(l.names).length || l.gone.length || l.own.length || Object.keys(l.areaNames).length || l.ownAreas.length || l.areasGone.length || Object.keys(l.moved).length || Object.keys(l.order).length || l.areaOrder.length);
}

/**
 * The areas as the person has them, in order: [{ id, name, std, own }]. std: the template name (for t());
 * name: the person's own name or null (then the UI shows t(std)). The «Ohne Gruppe» area '' is not in it.
 */
export function areasOf(raw) {
  const l = normList(raw);
  const all = [...AREAS.filter((a) => !l.areasGone.includes(a.id)).map((a) => ({ id: a.id, std: a.name, name: l.areaNames[a.id] ?? null, own: false })), ...l.ownAreas.map((a) => ({ id: a.id, std: null, name: a.name, own: true }))];
  const rank = (id) => {
    const i = l.areaOrder.indexOf(id);
    return i < 0 ? 1000 + all.findIndex((a) => a.id === id) : i;
  };
  return all.sort((a, b) => rank(a.id) - rank(b.id));
}

/** The area a point sits in now ('' = «Ohne Gruppe»): moved, else its own; an area that is gone → ''. */
export function areaNow(raw, p) {
  const l = normList(raw);
  const a = Object.hasOwn(l.moved, p.id) ? l.moved[p.id] : p.area;
  return areasOf(l).some((x) => x.id === a) ? a : '';
}

/** Every point as the person has it (all levels, all kinds): [{ id, area, level, std, name, own, … }]. */
export function allPoints(raw) {
  const l = normList(raw);
  const std = ITEMS.filter((i) => !l.gone.includes(i.id)).map((i) => ({ ...i, std: i.name, name: l.names[i.id] ?? null, own: false }));
  const own = l.own.map((p) => ({ id: p.id, area: p.area, level: p.level, std: null, name: p.name, own: true, note: p.note, url: p.url, tools: [], steps: [], who: 'self', shop: '', links: [] }));
  return [...std, ...own].map((p) => ({ ...p, area: areaNow(l, p) }));
}

/**
 * Does this point fit this bike (kind, fork, shock)? hasPart(key): the bike has that part and shows it
 * (Paket I: a part hidden on a bike hides its points too).
 */
export function fitsBike(p, kind, hasPart = () => true) {
  if (p.kinds && !p.kinds.includes(kind)) return false;
  if (p.needs && !hasPart(p.needs)) return false;
  if (p.part && !hasPart(p.part)) return false;
  return true;
}

/**
 * The checklist of one inspection: the points of that level (and the smaller ones) that fit the bike,
 * grouped by area in the person's order: [{ area: { id, std, name }, points: [...] }]; empty areas left out.
 */
export function checklist(raw, level, kind, hasPart = () => true) {
  const l = normList(raw);
  const pts = allPoints(l).filter((p) => LEVEL_RANK[p.level] <= LEVEL_RANK[level] && fitsBike(p, kind, hasPart));
  const groups = [...areasOf(l), { id: '', std: 'No group', name: null, own: false }];
  return groups
    .map((area) => ({ area, points: sortIn(l, area.id, pts.filter((p) => p.area === area.id)) }))
    .filter((g) => g.points.length);
}

/** The points of one area in the person's order (unknown ones keep the template order, at the end). */
function sortIn(l, areaId, pts) {
  const order = l.order[areaId] ?? [];
  const rank = (p) => {
    const i = order.indexOf(p.id);
    return i < 0 ? 1000 + ITEMS.findIndex((x) => x.id === p.id) + (p.own ? 500 : 0) : i;
  };
  return [...pts].sort((a, b) => rank(a) - rank(b));
}

/** All points of one area (every level, every kind), in order: for «Checkliste bearbeiten». */
export const pointsIn = (raw, areaId) => {
  const l = normList(raw);
  return sortIn(l, areaId, allPoints(l).filter((p) => p.area === areaId));
};

let seq = 0;
const newId = (prefix, now) => `${prefix}-${now.toString(36)}-${(seq++).toString(36)}`;

/** Rename a point (empty name: a template point goes back to its own name). */
export function renamePoint(raw, id, name) {
  const l = normList(raw);
  const text = String(name ?? '').trim();
  if (l.own.some((p) => p.id === id)) return text ? { ...l, own: l.own.map((p) => (p.id === id ? { ...p, name: text } : p)) } : l;
  const names = { ...l.names };
  if (text && text !== ITEM[id]?.name) names[id] = text;
  else delete names[id];
  return { ...l, names };
}

/** Delete a point (a template point is hidden, an own point goes). → the new list. */
export function deletePoint(raw, id) {
  const l = normList(raw);
  if (l.own.some((p) => p.id === id)) return { ...l, own: l.own.filter((p) => p.id !== id) };
  return ITEM[id] && !l.gone.includes(id) ? { ...l, gone: [...l.gone, id] } : l;
}

/** Add an own point. → { list, id } (id null when the name is empty). */
export function addPoint(raw, { name, area = '', level = 'full', note = '', url = '' } = {}, now = Date.now()) {
  const l = normList(raw);
  const text = String(name ?? '').trim();
  if (!text) return { list: l, id: null };
  const id = newId('ip', now);
  return { list: { ...l, own: [...l.own, { id, area, name: text, level: LEVEL[level] ? level : 'full', note: String(note ?? '').trim(), url: String(url ?? '').trim() }] }, id };
}

/** Change the level, note or link of an own point. */
export const changeOwn = (raw, id, patch) => {
  const l = normList(raw);
  return { ...l, own: l.own.map((p) => (p.id === id ? { ...p, ...(LEVEL[patch.level] ? { level: patch.level } : {}), ...(patch.note != null ? { note: String(patch.note) } : {}), ...(patch.url != null ? { url: String(patch.url).trim() } : {}) } : p)) };
};

/** Move a point inside its area (arrows and drag): from/to are indexes in pointsIn(area). */
export function movePoint(raw, areaId, from, to) {
  const l = normList(raw);
  const ids = pointsIn(l, areaId).map((p) => p.id);
  if (from < 0 || from >= ids.length || to < 0 || to >= ids.length || from === to) return l;
  const [x] = ids.splice(from, 1);
  ids.splice(to, 0, x);
  return { ...l, order: { ...l.order, [areaId]: ids } };
}

/** Put a point into another area ('' = «Ohne Gruppe»). */
export function setArea(raw, id, areaId) {
  const l = normList(raw);
  const own = l.own.find((p) => p.id === id);
  if (own) return { ...l, own: l.own.map((p) => (p.id === id ? { ...p, area: areaId } : p)) };
  const moved = { ...l.moved };
  if (ITEM[id]?.area === areaId) delete moved[id];
  else moved[id] = areaId;
  return { ...l, moved };
}

/** Rename an area (empty: a template area goes back to its own name). */
export function renameArea(raw, id, name) {
  const l = normList(raw);
  const text = String(name ?? '').trim();
  if (l.ownAreas.some((a) => a.id === id)) return text ? { ...l, ownAreas: l.ownAreas.map((a) => (a.id === id ? { ...a, name: text } : a)) } : l;
  const areaNames = { ...l.areaNames };
  if (text && text !== AREAS.find((a) => a.id === id)?.name) areaNames[id] = text;
  else delete areaNames[id];
  return { ...l, areaNames };
}

/** Add an own area. → { list, id }. */
export function addArea(raw, name, now = Date.now()) {
  const l = normList(raw);
  const text = String(name ?? '').trim();
  if (!text) return { list: l, id: null };
  const id = newId('ia', now);
  return { list: { ...l, ownAreas: [...l.ownAreas, { id, name: text }] }, id };
}

/**
 * Delete an area; its points go to `to` (another area) or to «Ohne Gruppe» (to null). The points are
 * never deleted. → the new list.
 */
export function deleteArea(raw, id, to = null) {
  let l = normList(raw);
  for (const p of pointsIn(l, id)) l = setArea(l, p.id, to ?? '');
  if (l.ownAreas.some((a) => a.id === id)) l = { ...l, ownAreas: l.ownAreas.filter((a) => a.id !== id) };
  else if (AREAS.some((a) => a.id === id) && !l.areasGone.includes(id)) l = { ...l, areasGone: [...l.areasGone, id] };
  return { ...l, areaOrder: l.areaOrder.filter((x) => x !== id) };
}

/** Move an area (arrows and drag). */
export function moveArea(raw, from, to) {
  const l = normList(raw);
  const ids = areasOf(l).map((a) => a.id);
  if (from < 0 || from >= ids.length || to < 0 || to >= ids.length || from === to) return l;
  const [x] = ids.splice(from, 1);
  ids.splice(to, 0, x);
  return { ...l, areaOrder: ids };
}

/* ---------- (2) when is an inspection due ---------- */

/** The bike's own settings: { every: { monthly: { km, days }, full: { km, days } }, factors, off, buy (soon worn parts on the wishlist) }. */
export function bikeSettings(bike) {
  const s = obj(bike?.inspect);
  const num = (v, d) => (v === null ? null : typeof v === 'number' && v > 0 ? v : d);
  const every = (level) => {
    const std = LEVEL[level].every;
    const own = obj(obj(s.every)[level]);
    return { km: num(own.km, std.km), days: num(own.days, std.days) };
  };
  return { every: { monthly: every('monthly'), full: every('full') }, factors: s.factors !== false, off: s.off === true, buy: s.buy !== false };
}

/** The kind of one ride for the weights: 'trail', 'gravel' or '' (Strava/FIT type; else the bike's kind). */
export function rideKind(entry, bikeKind = '') {
  const t = String(entry?.type ?? '');
  if (/mountain|\bmtb\b|trail|enduro|down ?hill|e-?mountain/i.test(t)) return 'trail';
  if (/gravel|cyclocross|\bcx\b/i.test(t)) return 'gravel';
  if (/road|virtual|velomobile|handcycle/i.test(t)) return '';
  return bikeKind === 'mtb' ? 'trail' : bikeKind === 'gravel' ? 'gravel' : '';
}

/**
 * The weighted km of one bike after a day (exclusive): only the rides it counted (kmBook state
 * 'counted', kind 'ride'). wetDays: Set of rainy days. → { km, load, wet, trail, gravel, rides }.
 */
export function loadSince(entries, bikeId, since, { wetDays = new Set(), factors = true, kind = '' } = {}) {
  const out = { km: 0, load: 0, wet: 0, trail: 0, gravel: 0, rides: 0 };
  for (const e of entries ?? []) {
    if (e?.bikeId !== bikeId || e.state !== 'counted' || (e.kind && e.kind !== 'ride')) continue;
    if (since && !(e.date > since)) continue;
    const km = Number(e.km) || 0;
    if (km <= 0) continue;
    const wet = isWet(wetDays, e);
    const rk = rideKind(e, kind);
    let f = 1;
    if (factors && wet) f *= FACTOR.wet;
    if (factors && rk === 'trail') f *= FACTOR.trail;
    if (factors && rk === 'gravel') f *= FACTOR.gravel;
    out.km += km;
    out.load += km * f;
    out.rides += 1;
    if (wet) out.wet += 1;
    if (rk === 'trail') out.trail += 1;
    if (rk === 'gravel') out.gravel += 1;
  }
  out.km = Math.round(out.km);
  out.load = Math.round(out.load);
  return out;
}

/** The last finished inspection of a bike at this level or above (a full one counts for the monthly). */
export function lastOf(inspections, bikeId, level) {
  return (inspections ?? [])
    .filter((x) => x?.bikeId === bikeId && x.done && LEVEL_RANK[x.level] >= LEVEL_RANK[level])
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || (b.km ?? 0) - (a.km ?? 0))[0] ?? null;
}

/** Is it the start of the season and no full inspection since mid-February? */
export const seasonDue = (last, today) => {
  const m = Number(today.slice(5, 7));
  return (m === 3 || m === 4) && (!last || last.date < `${today.slice(0, 4)}-02-15`);
};

/**
 * The state of one level for one bike.
 * → { level, last, never, due, soon, by: 'km'|'days'|'season'|null, kmLeft, daysLeft, next (date by days),
 *     load: { km, load, wet, trail, gravel, rides }, extra (km added by the weights), every }
 * Without any inspection: never (no reminder, except the full one at the start of the season).
 */
export function levelState(bike, level, { inspections = [], entries = [], wetDays = new Set(), today, kind = '' } = {}) {
  const s = bikeSettings(bike);
  const every = s.every[level];
  const last = lastOf(inspections, bike?.id, level);
  const base = { level, last, never: !last, due: false, soon: false, by: null, kmLeft: null, daysLeft: null, next: null, load: null, extra: 0, every, off: s.off };
  if (s.off) return base;
  if (!last) {
    if (level === 'full' && seasonDue(null, today)) return { ...base, due: true, by: 'season' };
    return base;
  }
  let load = loadSince(entries, bike.id, last.date, { wetDays, factors: s.factors, kind });
  // no ride in the ledger since then, but the km grew: those km count as they are
  if (!load.rides && typeof bike.km === 'number' && typeof last.km === 'number' && bike.km > last.km) load = { ...load, km: bike.km - last.km, load: bike.km - last.km };
  const days = daysBetween(last.date, today);
  const kmLeft = every.km != null ? every.km - load.load : null;
  const daysLeft = every.days != null ? every.days - days : null;
  const byKm = kmLeft != null && kmLeft <= 0;
  const byDays = daysLeft != null && daysLeft <= 0;
  const season = level === 'full' && seasonDue(last, today);
  const due = byKm || byDays || season;
  const soon = !due && ((kmLeft != null && kmLeft <= every.km * 0.2) || (daysLeft != null && daysLeft <= 7));
  return {
    ...base, due, soon,
    by: byKm ? 'km' : byDays ? 'days' : season ? 'season' : null,
    kmLeft, daysLeft, next: every.days != null ? addDays(last.date, every.days) : null,
    load, extra: Math.max(0, load.load - load.km),
  };
}

/** A rainy ride in the last 3 days after the last inspection or chain care: «Kette putzen und ölen». */
export function afterRain(bike, { inspections = [], entries = [], wetDays = new Set(), today } = {}) {
  const last = lastOf(inspections, bike?.id, 'quick');
  const from = addDays(today, -3);
  const rides = (entries ?? []).filter((e) => e?.bikeId === bike?.id && e.state === 'counted' && (!e.kind || e.kind === 'ride') && e.date >= from && e.date <= today && isWet(wetDays, e) && (!last || e.date >= last.date) && !(last && last.date === e.date && last.done));
  return rides.length ? { day: rides.map((e) => e.date).sort().at(-1), n: rides.length } : null;
}

/** Both levels and the rain hint for one bike (the card, the due list, the trip). */
export function inspectState(bike, ctx) {
  return {
    monthly: levelState(bike, 'monthly', ctx),
    full: levelState(bike, 'full', ctx),
    rain: bikeSettings(bike).off ? null : afterRain(bike, ctx),
    lastDone: (ctx.inspections ?? []).filter((x) => x?.bikeId === bike?.id && x.done).map((x) => String(x.date)).sort().at(-1) ?? null,
    draft: (ctx.inspections ?? []).filter((x) => x?.bikeId === bike?.id && !x.done).sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] ?? null,
  };
}

/**
 * Noah 19.10.2026 «1»: the Kurzcheck before a tour, from two days before the start to the start day,
 * unless an inspection (any level) was done in the three days before the start.
 */
export function quickBeforeTrip(start, lastDone, today) {
  if (!start || !today || today > start || today < addDays(start, -2)) return false;
  return !(lastDone && lastDone >= addDays(start, -3));
}

/* ---------- (3) values ---------- */

/** A typed value: '0,35' → 0.35, '' → null, nonsense → NaN. */
export function readValue(text) {
  const s = String(text ?? '').trim().replace(',', '.').replace(/\s*(%|mm|bar|psi)$/i, '');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n < 10000 ? n : NaN;
}

/** How a measured value stands: 'ok', 'warn' or 'worn' (null without limits or value). */
export function valueState(measure, value) {
  if (!measure || typeof value !== 'number' || measure.limit == null) return null;
  if (measure.low) return value <= measure.limit ? 'worn' : measure.warnAt != null && value <= measure.warnAt ? 'warn' : 'ok';
  return value >= measure.limit ? 'worn' : measure.warnAt != null && value >= measure.warnAt ? 'warn' : 'ok';
}

/**
 * The chain trend: the measured values (check entries with a value and km, after the last replace).
 * → { kmLeft, perKkm } (about how many km until the limit; % per 1000 km), or null with too few values.
 */
export function chainTrend(part, limit = 0.5) {
  return wearTrend(part, { limit: limit ?? 0.5 });
}

/**
 * The wear trend of any measured part: growing values (chain %) or shrinking ones (low: pads, rotor mm).
 * extra: [{ km, value }] values not in the history yet (the inspection being finished).
 * → { kmLeft, perKkm } or null with too few values (two measurements at least 50 km apart).
 */
export function wearTrend(part, { limit, low = false, extra = [] } = {}) {
  if (limit == null) return null;
  const hist = part?.history ?? [];
  const lastRep = hist.map((h) => h.action).lastIndexOf('replace');
  const pts = [...hist.slice(lastRep + 1).filter((h) => h.action === 'check'), ...extra]
    .filter((h) => typeof h.value === 'number' && typeof h.km === 'number')
    .sort((a, b) => a.km - b.km);
  if (pts.length < 2) return null;
  const a = pts[0];
  const b = pts.at(-1);
  const worn = low ? a.value - b.value : b.value - a.value;
  if (b.km - a.km < 50 || worn <= 0) return null;
  const rate = worn / (b.km - a.km);
  const rest = low ? b.value - limit : limit - b.value;
  const kmLeft = Math.max(0, Math.round(rest / rate / 10) * 10);
  return { kmLeft, perKkm: Math.round(rate * 1000 * 100) / 100 };
}

/** About how many km a bike rides per day (the last 60 days of its counted rides), or null. */
export function kmPerDay(entries, bikeId, today, days = 60) {
  const from = addDays(today, -days);
  const km = (entries ?? []).filter((e) => e?.bikeId === bikeId && e.state === 'counted' && (!e.kind || e.kind === 'ride') && e.date > from && e.date <= today).reduce((s, e) => s + (Number(e.km) || 0), 0);
  return km > 0 ? km / days : null;
}

/** About when km run out: a date (never before tomorrow), or null without riding. */
export const kmToDate = (kmLeft, perDay, today) => (kmLeft == null || !perDay ? null : addDays(today, Math.max(1, Math.round(kmLeft / perDay))));

/* ---------- (4) a finished inspection ---------- */

/** The states of a point (4a: every point can carry a photo and a note). */
export const STATES = [
  { key: 'ok', name: 'OK|inspect' },
  { key: 'watch', name: 'Watch' },
  { key: 'fix', name: 'Fix myself' },
  { key: 'shop', name: 'Bike shop' },
];

/**
 * What a finished inspection writes. points: the checklist points (allPoints), partUnit(key): the unit of
 * a care part ('%', 'mm' …). → { parts: [{ key, entry }], problems: [{ text, fix, part, photo }] }
 * A value goes into the part history only when its unit is the part's unit (chain %, rotor mm).
 */
export function finishPlan(insp, points, { partUnit = () => '', name = (p) => p.name ?? p.std, prefix = 'Inspection' } = {}) {
  const byId = Object.fromEntries((points ?? []).map((p) => [p.id, p]));
  const parts = [];
  const problems = [];
  const buy = [];
  for (const r of insp?.results ?? []) {
    const p = byId[r.id];
    if (!p || !r.state || r.state === 'skip') continue;
    const label = name(p);
    if (p.part) {
      const unit = p.measure?.unit ?? '';
      const sameUnit = typeof r.value === 'number' && unit && unit === partUnit(p.part);
      const valueNote = typeof r.value === 'number' && !sameUnit ? `${String(r.value).replace('.', ',')} ${unit}`.trim() : '';
      parts.push({
        key: p.part,
        entry: {
          date: insp.date, km: typeof insp.km === 'number' ? insp.km : null, action: 'check',
          result: r.state === 'ok' || r.state === 'watch' ? 'ok' : 'needed', by: 'self',
          ...(sameUnit ? { value: r.value } : {}),
          note: [prefix, valueNote, r.note].filter(Boolean).join(' · '),
          inspectionId: insp.id,
        },
      });
    }
    // Noah 19.10.2026 «2a»: a measured part that is soon or already worn goes on the wishlist (inspectdb.js)
    const vs = p.part && p.measure ? valueState(p.measure, r.value) : null;
    if (vs === 'warn' || vs === 'worn') buy.push({ part: p.part, pointId: p.id, state: vs, value: r.value, measure: p.measure });
    if (r.state === 'fix' || r.state === 'shop') problems.push({ text: r.note ? `${label}: ${r.note}` : label, fix: r.state === 'shop' ? 'shop' : 'self', part: p.part ?? null, photo: r.photos?.[0] ?? null, pointId: p.id });
  }
  return { parts, problems, buy: buy.filter((b, i) => buy.findIndex((x) => x.part === b.part) === i) };
}

/** How far an inspection is: { done, total } (done: points with a state). */
export function progress(insp, points) {
  const ids = new Set((points ?? []).map((p) => p.id));
  const done = (insp?.results ?? []).filter((r) => ids.has(r.id) && r.state).length;
  return { done, total: ids.size };
}

/** Put one result into an inspection (a new object; empty fields are left out). */
export function setResult(insp, id, patch) {
  const results = [...(insp?.results ?? [])];
  const i = results.findIndex((r) => r.id === id);
  const prev = i < 0 ? { id } : results[i];
  const next = { ...prev, ...patch };
  if (i < 0) results.push(next);
  else results[i] = next;
  return { ...insp, results };
}
