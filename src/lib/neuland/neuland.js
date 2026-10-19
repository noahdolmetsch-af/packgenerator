/**
 * «Neuland» (wish #1007 «Kantonskarte und Bingo» + #1006 «Was war neu?», Noah 19.10.2026): what you
 * reached for the first time. Collections (cantons, municipalities, countries, Alpine passes, SAC huts,
 * peaks over 3000 m, lakes, and your own ones such as «Lieblingscafés»), each switchable on and off.
 *
 * The app finds a visit from your data: the route line of a trip (trip.route.line, [[lat, lon], …]),
 * the start place of a trip (trip.place, trip.route.start), the uploaded rides (db.rides: line, start,
 * end) and Strava activities when they carry a line or a start point (db.activities: line / start
 * point; today's activities have none, so they count once the app keeps one). Areas by point in
 * polygon (the line is densified to 400 m steps), points by distance to the line: a pass within
 * 600 m, a hut 400 m, a peak 250 m, a lake within 300 m of its shore («passed by»; a swim is ticked by
 * hand). Each item keeps its first day and the trip or ride it came from, and the first day per year.
 * What the person ticks or unticks by hand always wins over what the app found.
 *
 * State: db.settings 'neuland' (in the backup) =
 *   { off: [collectionId], order: [collectionId], names: { collectionId: own name },
 *     ticks: { collectionId: { itemId: { day, by: 'hand', tripId? } } },
 *     nope: { collectionId: { itemId: { day } } },      the app found it, the person says «not there»
 *     custom: [{ id, name, items: [{ id, name, lat?, lon? }] }],   own collections
 *     extra: { collectionId: [{ id, name, lat?, lon? }] },          own items in a built-in collection
 *     fixes: { itemId: { name?, lat?, lon?, hidden? } },            changes to a built-in item
 *     home: canton id or null }                                     the bingo joker
 * Pure functions (no database, no screen), tested in tests/neuland.test.js.
 */
import { t, tn } from '../i18n.svelte.js';
import { densify, lineBox, gridOf, areaAt, lineKm, ringsKm, inRings, inBox } from './geo.js';

export const NEULAND_KEY = 'neuland';

/**
 * The built-in collections, in their first order. kind: 'area' (polygons), 'point' (a place with a
 * radius in km), 'lake' (shapes and points). map: which map the page draws. title/one: English keys.
 */
export const COLLECTIONS = [
  { id: 'cantons', kind: 'area', title: 'Cantons', one: 'Canton', map: 'ch' },
  { id: 'countries', kind: 'area', title: 'Countries', one: 'Country', map: 'europe' },
  { id: 'passes', kind: 'point', title: 'Alpine passes', one: 'Pass', radius: 0.6, map: 'alps' },
  { id: 'huts', kind: 'point', title: 'SAC huts', one: 'Hut', radius: 0.4, map: 'ch' },
  { id: 'peaks', kind: 'point', title: 'Peaks over 3000 m', one: 'Peak', radius: 0.25, map: 'ch' },
  { id: 'lakes', kind: 'lake', title: 'Lakes', one: 'Lake', radius: 0.3, map: 'ch' },
  { id: 'municipalities', kind: 'area', title: 'Municipalities', one: 'Municipality', map: 'ch' },
];
const BUILT = new Map(COLLECTIONS.map((c) => [c.id, c]));
export const isBuiltIn = (cid) => BUILT.has(cid);
export const defOf = (cid) => BUILT.get(cid) ?? null;

/** Own items and own collections: a place counts within this many km of the line. */
export const OWN_RADIUS = 0.2;
/** An item added to a built-in area collection (no shape): its place counts within this many km. */
export const ADDED_RADIUS = 0.5;
/** The «Ohne Sammlung» collection that takes the items of a deleted own collection. */
export const LOOSE_ID = 'u-loose';

/** The 26 cantons in their official order (BFS numbers 1–26), the ids of cantons.js. */
export const CANTON_IDS = ['ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR', 'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG', 'TI', 'VD', 'VS', 'NE', 'GE', 'JU'];
export const DEFAULT_HOME = 'ZH';

/** A name as an id part: small letters, umlauts written out, the rest dashes. */
export function slug(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const arr = (v) => (Array.isArray(v) ? v : []);
const num = (v) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : null);
const cleanItem = (i) => ({ id: String(i.id), name: String(i.name ?? ''), ...(num(i.lat) != null && num(i.lon) != null ? { lat: num(i.lat), lon: num(i.lon) } : {}) });

/** The stored state with every part filled in (old or broken values never break the page). */
export function stateOf(v) {
  const s = obj(v);
  return {
    off: arr(s.off).map(String),
    order: arr(s.order).map(String),
    names: { ...obj(s.names) },
    ticks: Object.fromEntries(Object.entries(obj(s.ticks)).map(([k, m]) => [k, { ...obj(m) }])),
    nope: Object.fromEntries(Object.entries(obj(s.nope)).map(([k, m]) => [k, { ...obj(m) }])),
    custom: arr(s.custom)
      .filter((c) => c && c.id)
      .map((c) => ({ id: String(c.id), name: String(c.name ?? ''), items: arr(c.items).filter((i) => i && i.id).map(cleanItem) })),
    extra: Object.fromEntries(Object.entries(obj(s.extra)).map(([k, l]) => [k, arr(l).filter((i) => i && i.id).map(cleanItem)])),
    fixes: Object.fromEntries(Object.entries(obj(s.fixes)).map(([k, f]) => [k, { ...obj(f) }])),
    home: typeof s.home === 'string' && CANTON_IDS.includes(s.home) ? s.home : null,
  };
}

/* ---------------------------------------------------------------- collections ---------- */

/**
 * Every collection in the person's order: [{ id, builtIn, on, name, title }] — name: the own name
 * (never through t()), or '' for a built-in one that keeps its own title (an English key for t()).
 */
export function collectionsOf(state) {
  const s = stateOf(state);
  const all = [...COLLECTIONS.map((c) => c.id), ...s.custom.map((c) => c.id)];
  const ordered = [...s.order.filter((id) => all.includes(id)), ...all.filter((id) => !s.order.includes(id))];
  return ordered.map((id) => {
    const c = BUILT.get(id);
    const own = s.custom.find((x) => x.id === id);
    return { id, builtIn: !!c, on: !s.off.includes(id), name: c ? String(s.names[id] ?? '') : own.name, title: c ? c.title : '' };
  });
}

/** The name to show: the own name, else the translated title. */
export const collectionName = (c) => (c.name ? c.name : t(c.title));

export function setOn(state, cid, on) {
  const s = stateOf(state);
  const off = s.off.filter((x) => x !== cid);
  return { ...s, off: on ? off : [...off, cid] };
}

/** Move a collection from place `from` to place `to` (indices in collectionsOf). */
export function moveCollectionTo(state, from, to) {
  const s = stateOf(state);
  const ids = collectionsOf(s).map((c) => c.id);
  if (from < 0 || from >= ids.length) return s;
  const [id] = ids.splice(from, 1);
  ids.splice(Math.max(0, Math.min(ids.length, to)), 0, id);
  return { ...s, order: ids };
}
export function moveCollection(state, cid, dir) {
  const ids = collectionsOf(state).map((c) => c.id);
  const i = ids.indexOf(cid);
  return moveCollectionTo(state, i, i + dir);
}

let seq = 0;
const newId = (prefix) => `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}`;

/** A new own collection. → { state, id } */
export function addCustom(state, name, id = newId('u-')) {
  const s = stateOf(state);
  return { state: { ...s, custom: [...s.custom, { id, name: String(name).trim(), items: [] }] }, id };
}

/** Rename a collection: an own one gets the name, a built-in one an own name ('' = its title again). */
export function renameCollection(state, cid, name) {
  const s = stateOf(state);
  const n = String(name ?? '').trim();
  if (isBuiltIn(cid)) {
    const names = { ...s.names };
    if (n) names[cid] = n;
    else delete names[cid];
    return { ...s, names };
  }
  return { ...s, custom: s.custom.map((c) => (c.id === cid ? { ...c, name: n || c.name } : c)) };
}

/**
 * Delete an own collection; its items (and their ticks) go to `to` (another own collection) or,
 * with to = null, to «Ohne Sammlung» (LOOSE_ID, made when needed). Nothing is lost.
 * The «Ohne Sammlung» collection itself, deleted with to = null, takes its items with it (the
 * page asks first and offers Undo).
 */
export function deleteCustom(state, cid, to = null, looseName = 'Without collection') {
  const s = stateOf(state);
  const gone = s.custom.find((c) => c.id === cid);
  if (!gone) return s;
  let custom = s.custom.filter((c) => c.id !== cid);
  const dropAll = cid === LOOSE_ID && !to;
  const target = dropAll ? null : to && custom.some((c) => c.id === to) ? to : LOOSE_ID;
  if (target && gone.items.length) {
    if (!custom.some((c) => c.id === target)) custom = [...custom, { id: LOOSE_ID, name: looseName, items: [] }];
    custom = custom.map((c) => (c.id === target ? { ...c, items: [...c.items, ...gone.items.filter((i) => !c.items.some((x) => x.id === i.id))] } : c));
  }
  const move = (m) => {
    const next = { ...m };
    if (target && m[cid]) next[target] = { ...(m[target] ?? {}), ...m[cid] };
    delete next[cid];
    return next;
  };
  return { ...s, custom, ticks: move(s.ticks), nope: move(s.nope), off: s.off.filter((x) => x !== cid), order: s.order.filter((x) => x !== cid) };
}

/* ---------------------------------------------------------------- items ---------------- */

/**
 * The items of a collection as the person has them. base: the built-in items (load.js) or [] for an
 * own collection. → { items: [...visible], hidden: [...hidden built-in ones] }, each item
 * { id, name, kind, lat?, lon?, rings?, bbox?, r?, alt?, region?, own?, fixed? }.
 */
export function itemsOf(state, cid, base = []) {
  const s = stateOf(state);
  if (!isBuiltIn(cid)) {
    const c = s.custom.find((x) => x.id === cid);
    return { items: (c?.items ?? []).map((i) => ({ ...i, kind: 'point', r: 0, own: true })), hidden: [] };
  }
  const items = [];
  const hidden = [];
  for (const b of base) {
    const f = s.fixes[b.id];
    const it = f ? { ...b, ...(f.name ? { name: f.name } : {}), ...(num(f.lat) != null && num(f.lon) != null ? { lat: num(f.lat), lon: num(f.lon) } : {}), fixed: true } : b;
    (f?.hidden ? hidden : items).push(it);
  }
  for (const e of s.extra[cid] ?? []) items.push({ ...e, kind: 'point', r: 0, own: true });
  return { items, hidden };
}

const editList = (list, id, fn) => list.map((i) => (i.id === id ? fn(i) : i));

/** Add an item (own collection, or an own item in a built-in one). → { state, id } */
export function addItem(state, cid, { name, lat = null, lon = null }, id = newId('x-')) {
  const s = stateOf(state);
  const item = cleanItem({ id, name: String(name).trim(), lat, lon });
  if (isBuiltIn(cid)) return { state: { ...s, extra: { ...s.extra, [cid]: [...(s.extra[cid] ?? []), item] } }, id };
  return { state: { ...s, custom: s.custom.map((c) => (c.id === cid ? { ...c, items: [...c.items, item] } : c)) }, id };
}

/** Change an item's name or place. Own items change themselves; a built-in item gets a fix. */
export function editItem(state, cid, id, { name, lat, lon } = {}) {
  const s = stateOf(state);
  const patch = (i) => {
    const n = { ...i };
    if (name !== undefined && String(name).trim()) n.name = String(name).trim();
    if (lat !== undefined || lon !== undefined) {
      if (num(lat) != null && num(lon) != null) Object.assign(n, { lat: num(lat), lon: num(lon) });
      else (delete n.lat, delete n.lon);
    }
    return n;
  };
  if (!isBuiltIn(cid)) return { ...s, custom: s.custom.map((c) => (c.id === cid ? { ...c, items: editList(c.items, id, patch) } : c)) };
  if ((s.extra[cid] ?? []).some((i) => i.id === id)) return { ...s, extra: { ...s.extra, [cid]: editList(s.extra[cid], id, patch) } };
  const f = { ...(s.fixes[id] ?? {}) };
  if (name !== undefined) {
    if (String(name).trim()) f.name = String(name).trim();
    else delete f.name;
  }
  if (lat !== undefined || lon !== undefined) {
    if (num(lat) != null && num(lon) != null) Object.assign(f, { lat: num(lat), lon: num(lon) });
    else (delete f.lat, delete f.lon);
  }
  const fixes = { ...s.fixes };
  if (Object.keys(f).length) fixes[id] = f;
  else delete fixes[id];
  return { ...s, fixes };
}

/** Hide (or show again) a built-in item. */
export function hideItem(state, id, hidden = true) {
  const s = stateOf(state);
  const f = { ...(s.fixes[id] ?? {}) };
  if (hidden) f.hidden = true;
  else delete f.hidden;
  const fixes = { ...s.fixes };
  if (Object.keys(f).length) fixes[id] = f;
  else delete fixes[id];
  return { ...s, fixes };
}

/** Remove an own item (own collection or own item in a built-in one) with its tick. */
export function removeItem(state, cid, id) {
  const s = stateOf(state);
  const drop = (l) => l.filter((i) => i.id !== id);
  const ticks = { ...s.ticks, [cid]: { ...(s.ticks[cid] ?? {}) } };
  delete ticks[cid][id];
  if (isBuiltIn(cid)) return { ...s, ticks, extra: { ...s.extra, [cid]: drop(s.extra[cid] ?? []) } };
  return { ...s, ticks, custom: s.custom.map((c) => (c.id === cid ? { ...c, items: drop(c.items) } : c)) };
}

/** Restore an own item at its place (Undo of removeItem). */
export function restoreItem(state, cid, item, index = Infinity, tick = null) {
  const s = stateOf(state);
  const put = (l) => {
    const n = l.filter((i) => i.id !== item.id);
    n.splice(Math.min(index, n.length), 0, cleanItem(item));
    return n;
  };
  const ticks = tick ? { ...s.ticks, [cid]: { ...(s.ticks[cid] ?? {}), [item.id]: tick } } : s.ticks;
  if (isBuiltIn(cid)) return { ...s, ticks, extra: { ...s.extra, [cid]: put(s.extra[cid] ?? []) } };
  return { ...s, ticks, custom: s.custom.map((c) => (c.id === cid ? { ...c, items: put(c.items) } : c)) };
}

/**
 * A place typed by the person: «46.8686, 8.8546», «46.8686 8.8546» or a map link with «@46.86,8.85»
 * or «?q=46.86,8.85». → { lat, lon } or null ('' → { lat: null, lon: null }: no place).
 */
export function parsePlace(text) {
  const s = String(text ?? '').trim();
  if (!s) return { lat: null, lon: null };
  const m = s.match(/(-?\d{1,2}(?:[.,]\d+)?)\s*[,; ]\s*(-?\d{1,3}(?:[.,]\d+)?)/);
  if (!m) return null;
  const lat = Number(m[1].replace(',', '.'));
  const lon = Number(m[2].replace(',', '.'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat: Math.round(lat * 1e5) / 1e5, lon: Math.round(lon * 1e5) / 1e5 };
}
export const placeText = (it) => (Number.isFinite(it?.lat) && Number.isFinite(it?.lon) ? `${it.lat}, ${it.lon}` : '');

/* ---------------------------------------------------------------- ticks ---------------- */

/** Tick by hand: «I was there» (on `day`, optionally on a trip). The «not there» goes. */
export function tick(state, cid, id, day, tripId = null) {
  const s = stateOf(state);
  const nope = { ...s.nope, [cid]: { ...(s.nope[cid] ?? {}) } };
  delete nope[cid][id];
  return { ...s, nope, ticks: { ...s.ticks, [cid]: { ...(s.ticks[cid] ?? {}), [id]: { day, by: 'hand', ...(tripId ? { tripId } : {}) } } } };
}

/** Untick: the hand tick goes; when the app found it too, a «not there» keeps it off. */
export function untick(state, cid, id, { found = false, day } = {}) {
  const s = stateOf(state);
  const ticks = { ...s.ticks, [cid]: { ...(s.ticks[cid] ?? {}) } };
  delete ticks[cid][id];
  const nope = found ? { ...s.nope, [cid]: { ...(s.nope[cid] ?? {}), [id]: { day } } } : s.nope;
  return { ...s, ticks, nope };
}

/** Let the app decide again (the «not there» goes). */
export function clearNope(state, cid, id) {
  const s = stateOf(state);
  const nope = { ...s.nope, [cid]: { ...(s.nope[cid] ?? {}) } };
  delete nope[cid][id];
  return { ...s, nope };
}

/* ---------------------------------------------------------------- detection ------------ */

const okPoint = (p) => Array.isArray(p) && p.length >= 2 && Number.isFinite(+p[0]) && Number.isFinite(+p[1]) && Math.abs(p[0]) <= 90 && Math.abs(p[1]) <= 180;
const asPair = (p) => (Array.isArray(p) ? [+p[0], +p[1]] : p && Number.isFinite(+p.lat) && Number.isFinite(+p.lon) ? [+p.lat, +p.lon] : null);
const lineOf = (line) => arr(line).map(asPair).filter(okPoint);

/**
 * Everything the person rode or went to, as lines: [{ day, tripId, rideId, src, pts }] sorted by day.
 * Trips count from their start day once it is reached (not skipped, no test trip); rides and
 * activities on their day. A trip without a line counts with its start place.
 */
export function tracksOf({ trips = [], rides = [], activities = [], lines = [], today }) {
  const out = linesToTracks(lines, today);
  for (const tr of trips) {
    if (!tr?.startDate || tr.skipped || tr.testTrip === true || (today && tr.startDate > today)) continue;
    const line = lineOf(tr.route?.line);
    const pts = line.length ? line : [asPair(tr.route?.start), asPair(tr.route?.end), asPair(tr.place)].filter(Boolean).filter(okPoint);
    if (line.length && asPair(tr.place) && okPoint(asPair(tr.place))) pts.unshift(asPair(tr.place));
    if (pts.length) out.push({ day: tr.startDate, tripId: tr.id, rideId: null, src: 'trip', pts });
  }
  for (const r of rides) {
    if (!r?.date || (today && r.date > today)) continue;
    const line = lineOf(r.line);
    const pts = line.length ? line : [asPair(r.start), asPair(r.end)].filter(Boolean).filter(okPoint);
    if (pts.length) out.push({ day: r.date, tripId: r.tripId ?? null, rideId: r.id, src: 'ride', pts });
  }
  for (const a of activities) {
    if (!a?.day || (today && a.day > today)) continue;
    const line = lineOf(a.line);
    const pts = line.length ? line : [asPair(a.startLatLng), asPair(a.endLatLng)].filter(Boolean).filter(okPoint);
    if (pts.length) out.push({ day: a.day, tripId: a.tripId ?? null, rideId: null, actId: a.id, src: 'activity', pts });
  }
  return out.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
}

/**
 * Lines from elsewhere (e.g. package S «Reise-Spur» allLines(db) → [{ day, source, pts, tripId? }]) as
 * tracks; a line after `today` or without points is left out.
 */
export function linesToTracks(lines = [], today = null) {
  return arr(lines)
    .filter((l) => l?.day && (!today || l.day <= today))
    .map((l) => ({ day: l.day, tripId: l.tripId ?? null, rideId: l.rideId ?? null, src: l.source ?? 'line', pts: lineOf(l.pts) }))
    .filter((l) => l.pts.length);
}

/**
 * What a list of such lines reaches, for the given collections (defs: [{ id, kind, radius, items }]).
 * → the same as detect(): { [collectionId]: { [itemId]: { day, tripId, rideId, years } } }
 */
export const visitedFromLines = (lines, defs, today = null) => detect(defs, linesToTracks(lines, today));

/**
 * What the app finds on the tracks. defs: [{ id, kind, radius, items }] (items from itemsOf).
 * → { [collectionId]: { [itemId]: { day, tripId, rideId, years: { YYYY: day } } } }
 */
export function detect(defs, tracks) {
  const found = {};
  const rec = (cid, id, tr) => {
    const m = (found[cid] ??= {});
    const e = (m[id] ??= { day: null, tripId: null, rideId: null, years: {} });
    if (!e.day || tr.day < e.day) Object.assign(e, { day: tr.day, tripId: tr.tripId ?? null, rideId: tr.rideId ?? null });
    const y = tr.day.slice(0, 4);
    if (!e.years[y] || tr.day < e.years[y]) e.years[y] = tr.day;
  };
  const prepared = defs.map((d) => {
    const areas = d.items.filter((i) => i.rings?.length && i.bbox);
    const points = d.items.filter((i) => Number.isFinite(i.lat) && Number.isFinite(i.lon));
    const span = areas.length ? Math.max(...areas.map((a) => Math.max(a.bbox[2] - a.bbox[0], a.bbox[3] - a.bbox[1]))) : 0;
    const cell = span > 5 ? 1 : 0.1;
    return { d, areas, points, grid: d.kind === 'area' && areas.length ? gridOf(areas, cell) : null };
  });
  for (const tr of tracks) {
    const box = lineBox(tr.pts);
    let dense = null;
    for (const { d, areas, points, grid } of prepared) {
      const radius = d.radius ?? (isBuiltIn(d.id) ? ADDED_RADIUS : OWN_RADIUS);
      if (grid) {
        dense ??= densify(tr.pts, 0.4);
        let last = -1;
        for (const [lat, lon] of dense) {
          if (last >= 0 && inBox(lon, lat, areas[last].bbox) && inRings(lon, lat, areas[last].rings)) continue;
          const i = areaAt(lon, lat, areas, grid);
          if (i >= 0) {
            last = i;
            rec(d.id, areas[i].id, tr);
          }
        }
      } else if (areas.length) {
        // lake shapes: a point on or within `radius` of the shore
        dense ??= densify(tr.pts, 0.4);
        const pad = radius / 80;
        for (const a of areas) {
          if (box[2] < a.bbox[1] - pad || box[0] > a.bbox[3] + pad || box[3] < a.bbox[0] - pad || box[1] > a.bbox[2] + pad) continue;
          const hit = dense.some(([lat, lon]) => inBox(lon, lat, a.bbox, pad) && (inRings(lon, lat, a.rings) || ringsKm([lat, lon], a.rings) <= radius));
          if (hit) rec(d.id, a.id, tr);
        }
      }
      for (const p of points) {
        const reach = radius + (p.r ?? 0); // a lake point: its own radius plus the shore distance
        const pad = reach / 70;
        if (p.lat < box[0] - pad || p.lat > box[2] + pad || p.lon < box[1] - pad * 1.5 || p.lon > box[3] + pad * 1.5) continue;
        if (lineKm([p.lat, p.lon], tr.pts) <= reach) rec(d.id, p.id, tr);
      }
    }
  }
  return found;
}

/**
 * The visits as the person has them: the app's finds, the hand ticks over them, the «not there»
 * taking them away. → Map itemId → { day, by: 'auto'|'hand', tripId, rideId, years }
 */
export function visitedOf(state, cid, items, found = {}) {
  const s = stateOf(state);
  const ticks = s.ticks[cid] ?? {};
  const nope = s.nope[cid] ?? {};
  const auto = found[cid] ?? {};
  const out = new Map();
  for (const it of items) {
    if (nope[it.id] && !ticks[it.id]) continue;
    const tk = ticks[it.id];
    const a = auto[it.id];
    if (tk?.day) {
      const y = tk.day.slice(0, 4);
      const years = { ...(a?.years ?? {}) };
      if (!years[y] || tk.day < years[y]) years[y] = tk.day;
      out.set(it.id, { day: tk.day, by: 'hand', tripId: tk.tripId ?? null, rideId: null, years });
    } else if (a?.day) out.set(it.id, { ...a, by: 'auto' });
  }
  return out;
}

/** The items first reached in `year` (all years: null). */
export const newIn = (visited, year) => [...visited.entries()].filter(([, v]) => !year || v.day.startsWith(String(year))).map(([id]) => id);

/* ---------------------------------------------------------------- bingo ---------------- */

/** A small seeded random generator (mulberry32), the same card every time for one year. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The bingo card of a year: 25 cells (5 × 5, row by row); the middle (12) is the joker, your home
 * canton (else ZH), always marked. The other 24 cells hold 24 of the other 25 cantons, mixed by the
 * year; the one left out changes every year. → { cells: [cantonId], joker, out }
 */
export function bingoCard(year, home = DEFAULT_HOME) {
  const joker = CANTON_IDS.includes(home) ? home : DEFAULT_HOME;
  const rest = CANTON_IDS.filter((c) => c !== joker);
  const r = rng(Number(year) * 2654435761);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  const cells = rest.slice(0, 24);
  cells.splice(12, 0, joker);
  return { cells, joker, out: rest[24] };
}

/** Every line of a 5 × 5 card: 5 rows, 5 columns, 2 diagonals, as cell indices. */
export const BINGO_LINES = [
  ...[0, 1, 2, 3, 4].map((r) => ({ kind: 'row', n: r, cells: [0, 1, 2, 3, 4].map((c) => r * 5 + c) })),
  ...[0, 1, 2, 3, 4].map((c) => ({ kind: 'col', n: c, cells: [0, 1, 2, 3, 4].map((r) => r * 5 + c) })),
  { kind: 'diag', n: 0, cells: [0, 6, 12, 18, 24] },
  { kind: 'diag', n: 1, cells: [4, 8, 12, 16, 20] },
];

/** The complete lines of a card: marked = Set of canton ids (the joker counts by itself). */
export function bingoLines(card, marked) {
  const on = (i) => i === 12 || marked.has(card.cells[i]);
  return BINGO_LINES.filter((l) => l.cells.every(on));
}

/** The cantons visited in a year (a visit that year, not only the first one). */
export function cantonsInYear(visited, year) {
  const y = String(year);
  return new Set([...visited.entries()].filter(([, v]) => v.years?.[y] || v.day?.startsWith(y)).map(([id]) => id));
}

/* ---------------------------------------------------------------- words ---------------- */

const WHAT = { cantons: 'Canton', municipalities: 'Municipality', countries: 'Country', passes: 'Pass', huts: 'Hut', peaks: 'Peak', lakes: 'Lake' };

/** A short line for one item, ready for German: «Kanton Uri», «Altdorf (UR)», «Klausenpass · 1948 m». */
export function itemLabel(cid, item) {
  if (cid === 'cantons') return t('Canton {name}', { name: item.name });
  if (cid === 'municipalities') return item.kt && !item.name.endsWith(`(${item.kt})`) ? `${item.name} (${item.kt})` : item.name;
  if (Number.isFinite(item.alt)) return `${item.name} · ${item.alt} m`;
  return item.name;
}

/** The word for one item of a collection (a built-in title or the own collection's name). */
export const whatOf = (c) => (c.builtIn ? t(WHAT[c.id] ?? c.title) : c.name);

/**
 * «Was war neu?»: the items first reached on this trip (also by a ride of the trip, or ticked by hand
 * for it). result: computeNeuland() of store.js → [{ cid, id, name, label, what }] in the order of
 * the collections.
 */
export function newOnTrip(tripId, result) {
  if (!tripId || !result?.collections) return [];
  const out = [];
  for (const c of result.collections) {
    if (!c.on) continue;
    for (const it of c.items) {
      const v = c.visited.get(it.id);
      if (v && v.tripId === tripId) out.push({ cid: c.id, id: it.id, name: it.name, label: itemLabel(c.id, it), what: whatOf(c), day: v.day });
    }
  }
  return out;
}

const COUNT_WORDS = {
  cantons: ['{n} canton', '{n} cantons'],
  municipalities: ['{n} municipality', '{n} municipalities'],
  countries: ['{n} country', '{n} countries'],
  passes: ['{n} pass', '{n} passes'],
  huts: ['{n} hut', '{n} huts'],
  peaks: ['{n} peak', '{n} peaks'],
  lakes: ['{n} lake', '{n} lakes'],
};

/**
 * One line for the Rückblick: what was new in `year` (null: everything so far).
 * → { n, parts: [{ cid, n, text }], text } — text '' when nothing is new.
 */
export function neulandSummary(result, year = null) {
  const parts = [];
  for (const c of result?.collections ?? []) {
    if (!c.on) continue;
    const n = newIn(c.visited, year).length;
    if (!n) continue;
    const w = COUNT_WORDS[c.id];
    parts.push({ cid: c.id, n, text: w ? tn(n, w[0], w[1]) : `${n} × ${c.name}` });
  }
  const n = parts.reduce((s, p) => s + p.n, 0);
  const list = parts.map((p) => p.text).join(', ');
  const text = !n ? '' : year ? t('New in {year}: {list}', { year, list }) : t('New ground so far: {list}', { list });
  return { n, parts, text };
}
