/**
 * v0.165.0 «Gipfelbuch für alle» (proposal GB1, Noah 15.10.2026 08:40 «1a 2a 3a 4a und manuelle eingabe
 * möglich? 5b»): one book of the places reached in every sport, under Aktiv. It replaces «Orte» N5.
 *   - 1a under Aktiv, for all sports; 2a instead of «Orte»
 *   - 3a the app finds the highest point of a ride or Strava activity, you confirm it with a name;
 *     a place can always be entered by hand, changed or removed
 *   - 4a stars: first pass over 2000 m, 10/25/50 passes by bike, the highest point of each year,
 *     5 new places in one year; they also show in the trophy showcase
 *   - 5b sports without height (tennis, yoga …) keep their places too (halls, courts), entered by hand
 * Stored in one settings row (no new table):
 *   settings 'gipfelbuch' = {
 *     places:  [{ id, name, sport, ele|null, lat|null, lon|null, label (the activity of «Other»), note, createdAt }],
 *     visits:  [{ id, placeId, day, ref ('act:<id>' | 'ride:<id>' | 'hand'), hm|null }],
 *     dismissed: [ref]   suggestions answered with «Kein Gipfel»
 *   }
 * Pure and tested (tests/gipfelbuch.test.js); days are calendar days (YYYY-MM-DD).
 */
import { distKm } from './route.js';

export const GB_KEY = 'gipfelbuch';

/** The sports of the book, bike sports first (Noah SA «4a»). velo: its places are passes and count for the passes by bike. */
export const GB_SPORTS = [
  { key: 'bike', name: 'Cycling|sport', velo: true },
  { key: 'gravel', name: 'Gravel', velo: true },
  { key: 'xc', name: 'Cross Country' },
  { key: 'dh', name: 'Downhill' },
  { key: 'ski', name: 'Ski touring' },
  { key: 'hike', name: 'Hiking' },
  { key: 'other', name: 'Other|sport' },
];
const SPORT = Object.fromEntries(GB_SPORTS.map((s) => [s.key, s]));
export const sportOf = (key) => SPORT[key] ?? SPORT.other;
export const isVelo = (key) => !!SPORT[key]?.velo;

/** What a place is called in each sport (the word of the row «Pass», «Gipfel», «Trail», «Ort»). */
export const PLACE_WORD = { bike: 'Pass', gravel: 'Pass', xc: 'Trail', dh: 'Trail', ski: 'Summit', hike: 'Summit', other: 'Place|gb' };

/** «Aktiv neu» (Noah 22.10.2026 «1a», proposal «Gipfelbuch auf der Seite der Sportart»): the sport of the book
 * that belongs to a sport page (sportsbase.js ids), or null. Own activities keep their places as «other» with
 * their name as label. */
const GB_OF_SPORT = { 'trip:cycling': 'bike', 'trip:bikepacking': 'bike', 'trip:gravel': 'gravel', 'trip:xc': 'xc', 'trip:downhill': 'dh', 'trip:ski': 'ski', 'trip:hiking': 'hike' };
export const gbSportOf = (sportId) => GB_OF_SPORT[sportId] ?? null;
/** The places of one sport page, newest visit first: by its book sport, or for an own activity by its name. */
export function placesOfSport(book, sport) {
  const key = gbSportOf(sport?.id);
  if (key) return placeRows(book, key);
  const name = String(sport?.name ?? '').trim().toLowerCase();
  if (!name) return [];
  return placeRows(book, 'other').filter((r) => r.place.label.toLowerCase() === name);
}

/** A Strava activity type → the sport of the book, or null (indoor and other kinds are not suggested). */
export function sportOfType(type) {
  if (/^(Ride|EBikeRide)$/.test(type)) return 'bike';
  if (type === 'GravelRide') return 'gravel';
  if (/^E?MountainBikeRide$/.test(type)) return 'xc';
  if (type === 'BackcountrySki') return 'ski';
  if (/^(Hike|Walk)$/.test(type)) return 'hike';
  return null;
}

/** A suggestion needs a top this high and this far above the start (Selbst entschieden). */
export const MIN_ELE = 800;
export const MIN_RISE = 300;
/** A ride whose top is this close to a place is a new visit of it. */
export const NEAR_KM = 1;

export const emptyBook = () => ({ places: [], visits: [], dismissed: [] });
/** The stored row as a book (missing parts empty). */
export function bookOf(value) {
  return {
    places: Array.isArray(value?.places) ? value.places : [],
    visits: Array.isArray(value?.visits) ? value.visits : [],
    dismissed: Array.isArray(value?.dismissed) ? value.dismissed : [],
  };
}

/* ---------- the tops of rides and activities ---------- */
/** An uploaded ride (GPX): its highest point from the profile, placed on the thinned line. */
export function topOfRide(ride) {
  const prof = Array.isArray(ride?.profile) ? ride.profile.filter((p) => Array.isArray(p) && Number.isFinite(p[1])) : [];
  if (prof.length < 2) return null;
  let j = 0;
  prof.forEach((p, i) => p[1] > prof[j][1] && (j = i));
  const line = Array.isArray(ride.line) ? ride.line : [];
  const at = line.length ? line[Math.round((j / (prof.length - 1)) * (line.length - 1))] : null;
  return { ele: Math.round(prof[j][1]), rise: Math.round(prof[j][1] - prof[0][1]), lat: at?.[0] ?? null, lon: at?.[1] ?? null };
}
/** A Strava activity with its details: the highest point of its course (prof.pts [min, alt, …]). */
export function topOfAct(a) {
  const pts = Array.isArray(a?.prof?.pts) ? a.prof.pts.filter((p) => Array.isArray(p) && Number.isFinite(p[1])) : [];
  if (pts.length < 2) return null;
  const top = Math.max(...pts.map((p) => p[1]));
  return { ele: Math.round(top), rise: Math.round(top - pts[0][1]), lat: null, lon: null };
}
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/** The longest climb's name of an activity, a hint for the name of its top. */
const climbName = (a) => (Array.isArray(a?.climbs) ? [...a.climbs].sort((x, y) => (y.hm ?? 0) - (x.hm ?? 0))[0]?.name ?? '' : '');

/** A place of the book this top belongs to: the nearest within NEAR_KM, or one whose name is in a climb. */
function matchOf(book, top, climbs = []) {
  if (top.lat != null) {
    let best = null;
    for (const p of book.places) {
      if (p.lat == null || p.lon == null) continue;
      const d = distKm({ lat: top.lat, lon: top.lon }, { lat: p.lat, lon: p.lon });
      if (d <= NEAR_KM && (!best || d < best.d)) best = { d, id: p.id };
    }
    if (best) return best.id;
  }
  const names = climbs.map((c) => norm(c.name)).filter(Boolean);
  return book.places.find((p) => norm(p.name).length >= 3 && names.some((n) => n.includes(norm(p.name))))?.id ?? null;
}

/**
 * The suggestions: rides and activities whose top is worth a place, not yet in the book and not
 * dismissed, newest first. → [{ ref, day, sport, title, ele, rise, lat, lon, hm, name (a hint), match (placeId|null) }]
 */
export function suggestions(book, { acts = [], rides = [] } = {}) {
  const used = new Set([...book.visits.map((v) => v.ref), ...book.dismissed]);
  const out = [];
  for (const a of acts) {
    const ref = `act:${a.id}`;
    const sport = sportOfType(a.type);
    if (!sport || a.trainer || used.has(ref)) continue;
    const top = topOfAct(a);
    if (!top || top.ele < MIN_ELE || top.rise < MIN_RISE) continue;
    out.push({ ref, day: a.day, sport, title: a.name || '', ...top, hm: a.hm ?? null, name: climbName(a), match: matchOf(book, top, a.climbs ?? []) });
  }
  for (const r of rides) {
    const ref = `ride:${r.id}`;
    if (used.has(ref)) continue;
    const top = topOfRide(r);
    if (!top || top.ele < MIN_ELE || top.rise < MIN_RISE) continue;
    out.push({ ref, day: r.date ?? '', sport: 'bike', title: r.name || '', ...top, hm: Number.isFinite(r.gainM) ? Math.round(r.gainM) : null, name: '', match: matchOf(book, top) });
  }
  return out.filter((s) => s.day).sort((a, b) => b.day.localeCompare(a.day));
}

/* ---------- changes (each returns a new book) ---------- */
let seq = 0;
const newId = (p) => `${p}_${Date.now().toString(36)}${(seq++).toString(36)}`;
const cleanEle = (v) => (v === '' || v == null || !Number.isFinite(Number(v)) ? null : Math.round(Number(v)));

/** A new place with its first visit (a suggestion confirmed, or by hand). */
export function addPlace(book, place, visit, now = new Date().toISOString()) {
  const p = { id: newId('gbp'), name: String(place.name ?? '').trim(), sport: SPORT[place.sport] ? place.sport : 'other', ele: cleanEle(place.ele), lat: place.lat ?? null, lon: place.lon ?? null, label: String(place.label ?? '').trim(), note: String(place.note ?? '').trim(), createdAt: now };
  const v = { id: newId('gbv'), placeId: p.id, day: visit.day, ref: visit.ref ?? 'hand', hm: cleanEle(visit.hm) };
  return { ...book, places: [...book.places, p], visits: [...book.visits, v] };
}
/** One more visit of a place. */
export function addVisit(book, placeId, visit) {
  return { ...book, visits: [...book.visits, { id: newId('gbv'), placeId, day: visit.day, ref: visit.ref ?? 'hand', hm: cleanEle(visit.hm) }] };
}
/** Change a place (name, height, sport, label, note). */
export function editPlace(book, id, patch) {
  return { ...book, places: book.places.map((p) => (p.id === id ? { ...p, ...patch, ...(patch.ele !== undefined ? { ele: cleanEle(patch.ele) } : {}), ...(patch.sport && !SPORT[patch.sport] ? { sport: 'other' } : {}) } : p)) };
}
/** Remove a place with its visits (the page offers Undo with the book before). */
export function removePlace(book, id) {
  return { ...book, places: book.places.filter((p) => p.id !== id), visits: book.visits.filter((v) => v.placeId !== id) };
}
/** «Kein Gipfel»: the suggestion does not come back. */
export function dismiss(book, ref) {
  return book.dismissed.includes(ref) ? book : { ...book, dismissed: [...book.dismissed, ref] };
}

/* ---------- reading ---------- */
const byDay = (a, b) => a.day.localeCompare(b.day) || a.id.localeCompare(b.id);

/** Every place with its visits, first and last day, newest visit first. sport: filter or null. */
export function placeRows(book, sport = null) {
  const visits = [...book.visits].sort(byDay);
  return book.places
    .filter((p) => !sport || p.sport === sport)
    .map((p) => {
      const vs = visits.filter((v) => v.placeId === p.id);
      return { place: p, visits: vs, n: vs.length, first: vs[0]?.day ?? null, last: vs.at(-1)?.day ?? null };
    })
    .filter((r) => r.n)
    .sort((a, b) => b.last.localeCompare(a.last) || a.place.name.localeCompare(b.place.name));
}

/** The years with their visits: [{ year, rows: [{ ...row, visit (the newest of the year), firstEver }], visits, fresh }], newest first. */
export function yearGroups(book, sport = null) {
  const rows = placeRows(book, sport);
  const years = new Map();
  for (const r of rows) {
    for (const v of r.visits) {
      const y = v.day.slice(0, 4);
      if (!years.has(y)) years.set(y, new Map());
      const m = years.get(y);
      const had = m.get(r.place.id);
      if (!had || v.day > had.visit.day) m.set(r.place.id, { ...r, visit: v, firstEver: r.first.slice(0, 4) === y });
    }
  }
  return [...years.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, m]) => {
      const list = [...m.values()].sort((a, b) => b.visit.day.localeCompare(a.visit.day));
      return { year, rows: list, visits: rows.reduce((s, r) => s + r.visits.filter((v) => v.day.startsWith(year)).length, 0), fresh: list.filter((r) => r.firstEver).length };
    });
}

/** The key line: places, new this year, the highest point of the year, the metres climbed to them this year. */
export function coreOf(book, year, sport = null) {
  const rows = placeRows(book, sport);
  const inYear = rows.filter((r) => r.visits.some((v) => v.day.startsWith(year)));
  const top = inYear.filter((r) => r.place.ele != null).sort((a, b) => b.place.ele - a.place.ele)[0] ?? null;
  const hm = rows.flatMap((r) => r.visits).filter((v) => v.day.startsWith(year)).reduce((s, v) => s + (v.hm ?? 0), 0);
  return { places: rows.length, fresh: rows.filter((r) => r.first.startsWith(year)).length, top: top ? { name: top.place.name, ele: top.place.ele } : null, hm };
}

/** The number of places per sport (for the chips). */
export function sportCounts(book) {
  const rows = placeRows(book);
  return GB_SPORTS.map((s) => ({ ...s, n: rows.filter((r) => r.place.sport === s.key).length })).filter((s) => s.n);
}

/* ---------- stars (4a) ---------- */
export const PASS_STEPS = [10, 25, 50];
/** The first visits of all places, oldest first: [{ place, day }]. */
const firsts = (book) => placeRows(book).map((r) => ({ place: r.place, day: r.first })).sort((a, b) => a.day.localeCompare(b.day) || a.place.id.localeCompare(b.place.id));

/**
 * The stars of the book, oldest first: [{ id, kind, n?, year?, day, placeId, name, ele? }].
 *   pass2000    the first pass by bike over 2000 m
 *   passes-N    N different passes by bike (10, 25, 50)
 *   top-YYYY    the highest point of the year (moves up when a higher one comes; the star stays)
 *   new5-YYYY   5 new places in one year
 */
export function gbStars(book) {
  const out = [];
  const f = firsts(book);
  const velo = f.filter((x) => isVelo(x.place.sport));
  const first2000 = velo.find((x) => (x.place.ele ?? 0) >= 2000);
  if (first2000) out.push({ id: 'gb.pass2000', kind: 'pass2000', day: first2000.day, placeId: first2000.place.id, name: first2000.place.name, ele: first2000.place.ele });
  for (const n of PASS_STEPS) if (velo.length >= n) out.push({ id: `gb.passes-${n}`, kind: 'passes', n, day: velo[n - 1].day, placeId: velo[n - 1].place.id, name: velo[n - 1].place.name });
  const years = [...new Set(book.visits.map((v) => v.day.slice(0, 4)))].sort();
  for (const y of years) {
    const vs = book.visits.filter((v) => v.day.startsWith(y)).map((v) => ({ v, p: book.places.find((p) => p.id === v.placeId) })).filter((x) => x.p?.ele != null);
    const top = vs.sort((a, b) => b.p.ele - a.p.ele || a.v.day.localeCompare(b.v.day))[0];
    if (top) out.push({ id: `gb.top-${y}`, kind: 'top', year: y, day: top.v.day, placeId: top.p.id, name: top.p.name, ele: top.p.ele });
    const fresh = f.filter((x) => x.day.startsWith(y));
    if (fresh.length >= 5) out.push({ id: `gb.new5-${y}`, kind: 'new5', year: y, day: fresh[4].day, placeId: fresh[4].place.id, name: fresh[4].place.name });
  }
  return out.sort((a, b) => a.day.localeCompare(b.day) || a.id.localeCompare(b.id));
}
/** The stars a place brought. */
export const starsOfPlace = (book, id) => gbStars(book).filter((s) => s.placeId === id);
/** The next star of the passes by bike: { have, target } or null when all are reached. */
export function nextPassStar(book) {
  const have = placeRows(book).filter((r) => isVelo(r.place.sport)).length;
  const target = PASS_STEPS.find((n) => n > have);
  return target ? { have, target } : null;
}
