/**
 * The summits and passes the summit book knows (Noah 24.11.2026 «alle 1-5 zusammen», Gipfelbuch ausbauen, ideas 1 and 4):
 * the same lists Neuland uses (peaks of 3000 m and more, the Alpine passes) plus a few Swiss summits and the Zürich house
 * mountains. Two things read it: the collections («Alle Viertausender», «Pässe über 2000 m», «Zürcher Hausberge»: only how many
 * you have, no goal) and the finding of places on a ride («In dein Gipfelbuch?»). The places are rounded to about 100–500 m
 * and only a suggestion: nothing is written without a tap. Loaded only when the summit book opens (own chunk).
 * Pure apart from loadCatalog(); tested in tests/gipfelkatalog.test.js.
 */
import { distKm } from './route.js';
import { decodePolyline } from './spur/polyline.js';
import { passHitsOnLine } from './paesse/katalog.js';
import { hitLevel } from './passregel.js';
import { sportOfType, isVelo, MIN_RISE, NEAR_KM } from './gipfelbuch.js';

const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim();
export const normName = norm;

/** The Zürich house mountains: [name, lat, lon, height m]. Only a beginning; every list can be changed (rounded, please check). */
export const HAUSBERGE = [
  ['Üetliberg', 47.3498, 8.4912, 870],
  ['Albishorn', 47.265, 8.534, 909],
  ['Pfannenstiel', 47.312, 8.672, 853],
  ['Bachtel', 47.289, 8.872, 1115],
  ['Lägern Hochwacht', 47.4817, 8.3975, 859],
];

/** The collections of the book. kind: which items; min: height at least (m). */
export const COLLECTIONS = [
  { id: 'vier', name: 'All four-thousanders', hint: 'The 48 summits over 4000 m in Switzerland.' },
  { id: 'paesse2000', name: 'Passes over 2000 m', hint: 'Passes of the Alps from 2000 m up.' },
  { id: 'haus', name: 'Zürich house mountains', hint: 'The hills around Zürich. A beginning: add your own with «New list».' },
];

/** A catalogue item → { key, name, m, lat, lon, kind: 'peak'|'pass', coll: [ids] }. */
const item = (kind, [name, lat, lon, m]) => ({ key: `${kind}:${norm(name).replace(/ /g, '-')}`, name, m, lat, lon, kind, coll: [] });

let cache = null;
/** The whole catalogue (loaded once). */
export async function loadCatalog() {
  if (cache) return cache;
  const [peaks, passes, wx] = await Promise.all([import('./neuland/data/peaks.js'), import('./neuland/data/passes.js'), import('./wetter/hoehe.js')]);
  cache = buildCatalog({ peaks: peaks.default, passes: passes.default, summits: wx.PEAKS.map((p) => [p.name, p.lat, p.lon, p.z]) });
  return cache;
}

/** Build the list from the raw tables (pure, for the test). Names that already exist are not added twice. */
export function buildCatalog({ peaks = [], passes = [], summits = [], haus = HAUSBERGE } = {}) {
  const out = [];
  const seen = new Set();
  const add = (kind, row, coll = []) => {
    const it = item(kind, row);
    const dup = out.find((x) => x.kind === kind && (x.key === it.key || (distKm(x, it) < 0.3 && Math.abs(x.m - it.m) < 60)));
    if (dup) {
      for (const c of coll) if (!dup.coll.includes(c)) dup.coll.push(c);
      return;
    }
    if (seen.has(it.key)) return;
    seen.add(it.key);
    it.coll = [...coll];
    out.push(it);
  };
  for (const r of haus) add('peak', r, ['haus']);
  for (const r of peaks) add('peak', r, r[3] >= 4000 ? ['vier'] : []);
  for (const r of summits) add('peak', r, []);
  for (const r of passes) add('pass', r, r[3] >= 2000 ? ['paesse2000'] : []);
  return out;
}

/** The places of the book that belong to a catalogue item: by the name, or by a visit within `km` of it. */
export function placeFor(book, it, km = 1.5) {
  const key = norm(it.name);
  const bare = key.replace(/\b(pass|passo|col|colle|hochwacht)\b/g, '').trim();
  return (
    book.places.find((p) => {
      const n = norm(p.name);
      const hOk = p.ele == null || it.m == null || Math.abs(p.ele - it.m) < 400;
      if (n.length >= 3 && (n === key || n === bare || (bare.length >= 4 && hOk && (n.includes(bare) || bare.includes(n))))) return true;
      return p.lat != null && p.lon != null && distKm({ lat: p.lat, lon: p.lon }, it) <= km;
    }) ?? null
  );
}

/** The state of one collection: { id, name, hint, have, total, rows: [{ it, place }] } with the items you have first. */
export function collectionOf(def, catalog, book) {
  const items = catalog.filter((c) => c.coll.includes(def.id)).sort((a, b) => b.m - a.m);
  const rows = items.map((it) => ({ it, place: placeFor(book, it) }));
  return { ...def, have: rows.filter((r) => r.place).length, total: rows.length, rows: [...rows.filter((r) => r.place), ...rows.filter((r) => !r.place)] };
}

/* ---------- own lists: a name and the names of the places in it ---------- */
export const LISTS_KEY = 'gipfelbuch-listen';
/** The stored value made whole: { hidden: [collection ids], own: [{ id, name, items: [name] }] }. */
export function listsOf(v) {
  const o = v && typeof v === 'object' ? v : {};
  return {
    hidden: (Array.isArray(o.hidden) ? o.hidden : []).filter((x) => typeof x === 'string'),
    own: (Array.isArray(o.own) ? o.own : [])
      .filter((l) => l && typeof l.id === 'string' && typeof l.name === 'string' && l.name.trim())
      .map((l) => ({ id: l.id, name: l.name.trim().slice(0, 60), items: (Array.isArray(l.items) ? l.items : []).map((n) => String(n).trim().slice(0, 60)).filter(Boolean).slice(0, 200) })),
  };
}
/** An own list's names from a text with one name per line. */
export const itemsOfText = (text) => [...new Set(String(text ?? '').split(/\r?\n|;/).map((n) => n.trim()).filter(Boolean))].slice(0, 200);
/** Add or change an own list (id given: change). */
export function saveList(lists, { id, name, items }, newId = `gbl_${Date.now().toString(36)}`) {
  const nm = String(name ?? '').trim().slice(0, 60);
  if (!nm) return lists;
  const row = { id: id ?? newId, name: nm, items: itemsOfText(Array.isArray(items) ? items.join('\n') : items) };
  return { ...lists, own: id && lists.own.some((l) => l.id === id) ? lists.own.map((l) => (l.id === id ? row : l)) : [...lists.own, row] };
}
export const removeList = (lists, id) => ({ ...lists, own: lists.own.filter((l) => l.id !== id) });
/** Hide or show a built-in list. */
export const setHidden = (lists, id, hidden) => ({ ...lists, hidden: hidden ? [...new Set([...lists.hidden, id])] : lists.hidden.filter((x) => x !== id) });
/** An own list as a collection: the items you have first. */
export function ownCollection(list, book) {
  const rows = list.items.map((name) => ({ it: { key: `own:${norm(name)}`, name, m: null }, place: placeFor(book, { name, m: null, lat: null, lon: null }) }));
  return { id: list.id, name: list.name, hint: '', own: true, have: rows.filter((r) => r.place).length, total: rows.length, rows: [...rows.filter((r) => r.place), ...rows.filter((r) => !r.place)] };
}

/* ---------- finding the places of the catalogue on a ride (idea 1) ---------- */
/** How many places one ride may suggest. */
export const MAX_PER_RIDE = 3;
/** The refs of dismissed catalogue hits are written as «<ref>#<key>» (the generic «No summit» keeps the plain ref). */
export const hitRef = (ref, key) => `${ref}#${key}`;

/** A line [[lat, lon], …] of a Strava activity (encoded text) or a ride (list of points). */
const lineOf = (x) => (typeof x?.line === 'string' ? decodePolyline(x.line) : Array.isArray(x?.line) ? x.line : []);

/**
 * The places of the catalogue a ride or activity went over, not yet in the book with this ride, not put away:
 * a road ride finds passes only, hikes, ski tours and runs find summits and passes. A hit up to SURE_KM from the line is
 * sure, up to MAYBE_KM «please check» (passregel.js).
 * → [{ ref, day, sport, title, ele, rise: null, lat, lon, hm, name, match (placeId|null), cat: key, level, km }], newest day first.
 */
export function catalogSuggestions(book, catalog, { acts = [], rides = [] } = {}) {
  const out = [];
  const gone = new Set(book.dismissed);
  const hits = (src, ref, day, sport, title, hm) => {
    const line = lineOf(src);
    if (line.length < 2) return;
    const pool = isVelo(sport) ? catalog.filter((c) => c.kind === 'pass') : catalog;
    const found = passHitsOnLine(line, undefined, pool)
      .map((h) => ({ ...h, it: pool.find((c) => c.key === h.key) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, MAX_PER_RIDE);
    for (const h of found) {
      const place = placeFor(book, h.it, NEAR_KM);
      if (place && book.visits.some((v) => v.ref === ref && v.placeId === place.id)) continue;
      if (gone.has(hitRef(ref, h.key))) continue;
      out.push({ ref, day, sport, title, ele: h.it.m, rise: null, lat: h.it.lat, lon: h.it.lon, hm, name: h.it.name, match: place?.id ?? null, cat: h.key, level: hitLevel(h.km) ?? 'maybe', km: h.km });
    }
  };
  for (const a of acts) {
    const sport = sportOfType(a.type);
    if (!sport || a.trainer || !a.day) continue;
    if (isVelo(sport) && !(a.hm >= MIN_RISE)) continue; // a flat ride is not worth reading its line
    hits(a, `act:${a.id}`, a.day, sport, a.name || '', a.hm ?? null);
  }
  for (const r of rides) {
    if (!r.date) continue;
    hits(r, `ride:${r.id}`, r.date, 'bike', r.name || '', Number.isFinite(r.gainM) ? Math.round(r.gainM) : null);
  }
  return out.sort((x, y) => y.day.localeCompare(x.day) || x.km - y.km);
}

/**
 * The suggestions of the book: the places of the catalogue first (they have a name), then the highest points that no
 * place of the catalogue explains (a generic top within 150 m of the height of a hit of the same ride is that hit).
 */
export function mergeSuggestions(generic, found) {
  const byRef = new Map();
  for (const f of found) byRef.set(f.ref, [...(byRef.get(f.ref) ?? []), f]);
  const rest = generic.filter((g) => !(byRef.get(g.ref) ?? []).some((f) => Math.abs((f.ele ?? 0) - (g.ele ?? 0)) <= 150));
  return [...found, ...rest].sort((a, b) => b.day.localeCompare(a.day) || (b.cat ? 1 : 0) - (a.cat ? 1 : 0));
}

/**
 * One row per place of the catalogue (real data: one hill near home is on dozens of rides): the newest ride stays the row,
 * the others of the same place and the same match are in `more` ([{ ref, day, hm }], newest first). Highest points
 * without a name stay as they are. The list keeps its order (newest first).
 */
export function groupFound(list) {
  const first = new Map();
  const out = [];
  for (const s of list) {
    if (!s.cat) {
      out.push(s);
      continue;
    }
    const k = `${s.cat}|${s.match ?? ''}`;
    const g = first.get(k);
    if (g) g.more.push({ ref: s.ref, day: s.day, hm: s.hm ?? null });
    else {
      const row = { ...s, more: [] };
      first.set(k, row);
      out.push(row);
    }
  }
  return out;
}
