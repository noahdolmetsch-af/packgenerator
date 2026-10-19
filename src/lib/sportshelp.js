/**
 * Paket O «Sportarten»: the helpers per sport and the activity mosaic. Pure functions, tested in
 * tests/sportshelp.test.js.
 *
 *   #96  mosaic: every sport and Meditation, one square per day, in the sport's colour, with its goal
 *   #195 Velo: commuting km, a wind tip, loops from the front door by the time you have
 *   #197 Eishockey: air the bag after every use, sharpen the skates after a number of uses (care steps)
 *   #200 Klettern: the age of rope and harness
 *   #194 Downhill: the protection check before a bike park day
 *   #192 Gravel: fountains and the gravel share along a planned route (OpenStreetMap via Overpass, free)
 *   #65  Tennis: lessons with drills that worked, matches with the result
 *   #218 what the app can do for a sport
 *
 * Records in the table sportItems (sportsdb.js), each with { id, sport, kind, … }:
 *   note   { text, done, order }                «Fürs nächste Mal» and own notes blocks (block: key)
 *   check  { text, done, order, block }          checklist items (protect or an own block)
 *   step   { name, every, last }                 a care step after `every` uses (last: uses when done, day)
 *   age    { name, since, years }                material with a maximum age
 *   lesson { day, topic, notes, drills: [{ id, text, good }] }
 *   match  { day, type: 'single'|'double', who, result, won: true|false|null, note }
 *   loop   { name, km, min, link, order }
 *   plan   { name, mids: [measure ids], order }  a training plan; planrun { planId, day, done: [mids] }
 *   route  { tripId, at, km, water: [{ km, name }], gravelKm, pavedKm, unknownKm }
 */
import { SPORTS } from './sportlist.js';

const SPORT = Object.fromEntries(SPORTS.map((s) => [s.key, s]));

const MS = 864e5;
const dayMs = (d) => Date.parse(`${d}T00:00:00Z`);
export const addDays = (d, n) => new Date(dayMs(d) + n * MS).toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((dayMs(b) - dayMs(a)) / MS);

/* ---------- uses and sessions of a sport ---------- */

/** Is this trip of the sport (trip:<key>)? Bike sports by trip.sport, the other areas by trip.domain. */
export function tripOfSport(trip, key) {
  if (!trip || trip.skipped) return false;
  if (SPORT[key]?.area === 'bikepacking') return trip.sport === key || (key === 'cycling' && !trip.sport && !Array.isArray(trip.packs) && (!trip.domain || trip.domain === 'bikepacking'));
  return trip.domain === key || trip.sport === key;
}
const tripDone = (tr, today) => !!(tr.finished || tr.status === 'done' || tr.fromRide || (tr.startDate && addDays(tr.startDate, Math.max(1, Number(tr.days) || 1) - 1) < today));

/**
 * The days a sport was done, oldest first, with a count per day: ticks of the activity (Aktiv), trip days
 * of the sport, own progress values and Strava activities of the sport. Fahrrad also counts «Velo draussen».
 * → Map(day → n)
 */
export function sportDays(sport, { log = [], trips = [], values = [], strava = [], today }) {
  const days = new Map();
  const add = (d, n = 1) => d && d <= today && days.set(d, (days.get(d) ?? 0) + n);
  if (sport.kind === 'act') for (const e of log) if (e.actId === sport.key) add(e.day);
  if (sport.kind === 'trip') {
    for (const tr of trips) {
      if (!tripOfSport(tr, sport.key) || !tr.startDate || !tripDone(tr, today)) continue;
      const n = Math.max(1, Math.min(60, Number(tr.days) || 1));
      for (let i = 0; i < n; i++) add(addDays(tr.startDate, i));
    }
    if (sport.key === 'cycling') for (const e of log) if (e.actId === 'bike') add(e.day);
  }
  const seen = new Set([...days.keys()]);
  for (const e of values) if (e.sport === sport.id && e.kind === 'value' && !seen.has(e.day)) add(e.day);
  for (const a of strava) if (!seen.has(a.day)) add(a.day);
  return days;
}

/** How many times in the last `days` days (the day count of sportDays). */
export const timesIn = (dayMap, today, days) => [...dayMap.entries()].filter(([d]) => d > addDays(today, -days) && d <= today).reduce((s, [, n]) => s + n, 0);
/** The last day it was done, or null. */
export const lastDay = (dayMap) => [...dayMap.keys()].sort().at(-1) ?? null;

/**
 * #96 the mosaic: a row per sport with one square per day of the last `n` days (oldest left) and the goal.
 * goal: { count, days } (the activity's first goal, or the sport's own goal). → [{ sport, cells: [{ day, n }], times, goal, met }]
 */
export function mosaic(rows, today, n = 28) {
  const days = Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
  return rows.map(({ sport, dayMap, goal }) => {
    const times = goal ? timesIn(dayMap, today, goal.days) : null;
    return { sport, cells: days.map((d) => ({ day: d, n: dayMap.get(d) ?? 0 })), times, goal: goal ?? null, met: goal ? times >= goal.count : null, active: [...dayMap.keys()].some((d) => d > addDays(today, -n)) };
  });
}

/** The goal of a sport: the own one (sportsbase cfg goal), else the activity's first live goal. */
export function goalOf(sport, own, activeGoals = []) {
  if (own) return own;
  const g = activeGoals[0];
  return g ? { count: g.count, days: g.days } : null;
}

/* ---------- #195 Velo ---------- */

/** The 8 directions, from north clockwise (English keys for t()). */
export const DIRS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
/** The direction a wind comes from (degrees) as one of the 8 words. */
export const dirOf = (deg) => DIRS[Math.round((((Number(deg) % 360) + 360) % 360) / 45) % 8];
/**
 * The wind tip: ride out against the wind, home with it at your back. → { from, gust, strong } or null
 * without a wind direction. strong: gusts of 40 km/h or more.
 */
export function windTip(day) {
  if (!day || day.windDir == null || !Number.isFinite(Number(day.windDir))) return null;
  const gust = Number.isFinite(Number(day.gust)) ? Math.round(Number(day.gust)) : null;
  return { from: dirOf(day.windDir), gust, strong: gust != null && gust >= 40 };
}

/** Commuting km from Strava (activities marked as commute): this month and this year. */
export function commuteKm(activities = [], today) {
  const month = today.slice(0, 7);
  const year = today.slice(0, 4);
  let m = 0;
  let y = 0;
  let n = 0;
  for (const a of activities) {
    if (!a.commute || !a.day || a.day > today) continue;
    if (a.day.startsWith(year)) {
      y += Number(a.km) || 0;
      n++;
    }
    if (a.day.startsWith(month)) m += Number(a.km) || 0;
  }
  return { month: Math.round(m), year: Math.round(y), rides: n };
}
/** The commutes ticked in Aktiv (via 'commute' on «Velo draussen») this month. */
export const commuteTicks = (log = [], today) => log.filter((e) => e.actId === 'bike' && e.via === 'commute' && e.day?.startsWith(today.slice(0, 7))).length;

/** The loops that fit in `min` minutes, the longest first (loops without a time come last). */
export function loopsFor(loops = [], min) {
  if (!min) return [...loops].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return loops.filter((l) => !(Number(l.min) > min)).sort((a, b) => (Number(b.min) || 0) - (Number(a.min) || 0));
}

/* ---------- care steps after uses, and the age of material (#197, #200) ---------- */

/** Care steps the app suggests per sport (English keys); every: after this many uses. */
export const STEP_PRESETS = {
  'act:hockey': [
    { name: 'Air the bag', every: 1 },
    { name: 'Dry the skates and wipe the blades', every: 1 },
    { name: 'Sharpen the skates', every: 10 },
  ],
  'trip:downhill': [{ name: 'Clean the fork and shock seals', every: 1 }],
  'act:gym': [{ name: 'Wash the towel and gym clothes', every: 1 }],
  'act:climb': [{ name: 'Check the rope for damage', every: 10 }],
  'trip:ski': [{ name: 'Dry the skins', every: 1 }],
};
/** Material with an age limit, per sport (years from the purchase). */
export const AGE_PRESETS = {
  'act:climb': [
    { name: 'Rope', years: 10 },
    { name: 'Harness', years: 10 },
    { name: 'Quickdraws', years: 10 },
  ],
  'act:hockey': [{ name: 'Helmet', years: 5 }],
  'trip:downhill': [{ name: 'Full-face helmet', years: 5 }],
  'trip:ski': [{ name: 'Avalanche transceiver', years: 10 }],
};

/** A care step after uses: uses since it was last done, how many are left, due. */
export function stepState(step, uses) {
  const every = Math.max(1, Math.round(Number(step.every) || 1));
  const since = step.last == null ? uses : Math.max(0, uses - (Number(step.last.uses) || 0));
  return { since, left: every - since, due: since >= every, every };
}

/** The age of material: years so far, years left, state ok | soon (last year) | old. Null without a date. */
export function ageState(item, today) {
  if (!item?.since || !/^\d{4}-\d{2}-\d{2}$/.test(item.since)) return null;
  const years = daysBetween(item.since, today) / 365.25;
  const max = Math.max(1, Number(item.years) || 10);
  const left = Math.round((max - years) * 10) / 10;
  return { years: Math.round(years * 10) / 10, left, state: left <= 0 ? 'old' : left <= 1 ? 'soon' : 'ok', until: addDays(item.since, Math.round(max * 365.25)) };
}

/* ---------- #194 Downhill: protection check ---------- */

/** The protection check before a bike park day (English keys, a suggestion to take over and change). */
export const PROTECT_PRESET = ['Full-face helmet', 'Goggles', 'Back protector', 'Knee pads', 'Elbow pads', 'Gloves', 'Spare derailleur hanger', 'Spare brake pads', 'Tubeless plugs and a spare tube', 'Shock pump'];

/* ---------- #65 Tennis ---------- */

/** Wins, losses and open results in a year (all years without `year`). */
export function matchStats(matches = [], year = null) {
  const list = matches.filter((m) => !year || String(m.day ?? '').startsWith(String(year)));
  return { total: list.length, won: list.filter((m) => m.won === true).length, lost: list.filter((m) => m.won === false).length };
}
/** The drills that worked («hat sich bewährt»), newest lesson first, each once. */
export function goodDrills(lessons = []) {
  const seen = new Set();
  const out = [];
  for (const l of [...lessons].sort((a, b) => String(b.day).localeCompare(String(a.day)))) {
    for (const d of l.drills ?? []) {
      const k = String(d.text ?? '').trim().toLowerCase();
      if (!d.good || !k || seen.has(k)) continue;
      seen.add(k);
      out.push({ text: d.text, day: l.day, lessonId: l.id });
    }
  }
  return out;
}

/* ---------- #192 Gravel: fountains and gravel on the route ---------- */

const R = 6371;
const rad = (x) => (x * Math.PI) / 180;
/** Distance in km between two [lat, lon]. */
export function distKm(a, b) {
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}
/** At most `max` points of a line, evenly picked (first and last stay). */
export function thin(line = [], max = 120) {
  if (line.length <= max) return line;
  const step = (line.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => line[Math.round(i * step)]);
}
/** The Overpass query: drinking water within 300 m and the roads within 25 m of the route. */
export function overpassQuery(line) {
  const pts = thin(line, 120)
    .map(([la, lo]) => `${la.toFixed(5)},${lo.toFixed(5)}`)
    .join(',');
  return `[out:json][timeout:60];(node(around:300,${pts})[amenity=drinking_water];node(around:300,${pts})[man_made=water_tap];node(around:300,${pts})[amenity=fountain][drinking_water=yes];);out body;way(around:25,${pts})[highway];out tags geom;`;
}
export const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const UNPAVED = /^(gravel|fine_gravel|compacted|dirt|earth|ground|unpaved|grass|pebblestone|mud|sand|woodchips|rock|grass_paver)$/;
const PAVED = /^(asphalt|paved|concrete|concrete:plates|concrete:lanes|paving_stones|sett|cobblestone|chipseal|metal|wood)$/;
/** gravel | paved | null (not known) for an OpenStreetMap way. */
export function surfaceOf(tags = {}) {
  const s = String(tags.surface ?? '').toLowerCase();
  if (UNPAVED.test(s)) return 'gravel';
  if (PAVED.test(s)) return 'paved';
  if (tags.highway === 'track' || tags.highway === 'path' || tags.highway === 'bridleway') return 'gravel';
  if (/^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|service|living_street|cycleway)/.test(String(tags.highway ?? ''))) return 'paved';
  return null;
}

/** Distance in km from point p to the segment a–b (flat, good enough for a few metres). */
function toSegKm(p, a, b) {
  const kx = 111.32 * Math.cos(rad(p[0]));
  const ky = 110.57;
  const ax = (a[1] - p[1]) * kx;
  const ay = (a[0] - p[0]) * ky;
  const bx = (b[1] - p[1]) * kx;
  const by = (b[0] - p[0]) * ky;
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len)) : 0;
  return Math.hypot(ax + t * dx, ay + t * dy);
}

/**
 * The check of a route from the Overpass answer: fountains along it (km from the start, each once within
 * 200 m) and the km on gravel, paved and unknown roads (each piece of the route takes the nearest road
 * within 25 m). line: [[lat, lon], …] (trip.route.line). → { km, water: [{ km, name }], gravelKm, pavedKm, unknownKm, share }
 */
export function analyseRoute(line = [], osm = { elements: [] }) {
  const els = Array.isArray(osm?.elements) ? osm.elements : [];
  const cum = [0];
  for (let i = 1; i < line.length; i++) cum.push(cum[i - 1] + distKm(line[i - 1], line[i]));
  const km = cum.at(-1) ?? 0;
  // the fountains: the km of the nearest route point
  const water = [];
  for (const n of els.filter((e) => e.type === 'node' && Number.isFinite(e.lat))) {
    let best = Infinity;
    let at = 0;
    for (let i = 0; i < line.length; i++) {
      const d = distKm([n.lat, n.lon], line[i]);
      if (d < best) (best = d), (at = cum[i]);
    }
    if (best > 0.4) continue;
    if (water.some((w) => Math.abs(w.km - at) < 0.2)) continue;
    water.push({ km: Math.round(at * 10) / 10, name: n.tags?.name ?? '' });
  }
  water.sort((a, b) => a.km - b.km);
  // the roads, in a grid of about 1 km so each piece of route looks only at the roads near it
  const cell = (la, lo) => `${Math.floor(la * 100)}:${Math.floor(lo * 100)}`;
  const grid = new Map();
  for (const w of els.filter((e) => e.type === 'way' && Array.isArray(e.geometry))) {
    const kind = surfaceOf(w.tags);
    const g = w.geometry.map((p) => [p.lat, p.lon]);
    for (let i = 1; i < g.length; i++) {
      const seg = { a: g[i - 1], b: g[i], kind };
      for (const k of new Set([cell(...g[i - 1]), cell(...g[i])])) {
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(seg);
      }
    }
  }
  let gravelKm = 0;
  let pavedKm = 0;
  let unknownKm = 0;
  for (let i = 1; i < line.length; i++) {
    const len = cum[i] - cum[i - 1];
    const mid = [(line[i - 1][0] + line[i][0]) / 2, (line[i - 1][1] + line[i][1]) / 2];
    const c = [Math.floor(mid[0] * 100), Math.floor(mid[1] * 100)];
    let best = null;
    let bestD = 0.025;
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (const s of grid.get(`${c[0] + dx}:${c[1] + dy}`) ?? []) {
          const d = toSegKm(mid, s.a, s.b);
          if (d < bestD) (bestD = d), (best = s);
        }
    if (best?.kind === 'gravel') gravelKm += len;
    else if (best?.kind === 'paved') pavedKm += len;
    else unknownKm += len;
  }
  const r1 = (n) => Math.round(n * 10) / 10;
  const known = gravelKm + pavedKm;
  return { km: r1(km), water, gravelKm: r1(gravelKm), pavedKm: r1(pavedKm), unknownKm: r1(unknownKm), share: known > 0 ? Math.round((gravelKm / known) * 100) : null };
}
/** The longest stretch without a fountain (km), from start to finish. */
export function longestDry(check) {
  if (!check) return null;
  const marks = [0, ...check.water.map((w) => w.km), check.km];
  let best = 0;
  for (let i = 1; i < marks.length; i++) best = Math.max(best, marks[i] - marks[i - 1]);
  return Math.round(best * 10) / 10;
}

/* ---------- #218 what the app can do for a sport ---------- */

/** Feature ids of «Was die App kann» (features.js) per sport, the most fitting first. */
const FEATURES_BY = {
  bike: ['f.plan', 'f.quickstart', 'f.strava', 'f.standardbike', 'f.gipfelbuch', 'f.training', 'f.komoot', 'care', 'km'],
  'trip:ski': ['f.plan', 'f.skiequipment', 'f.gipfelbuch', 'f.training'],
  'trip:hiking': ['f.plan', 'f.gipfelbuch', 'f.komoot', 'f.training'],
  'act:meditation': ['f.meditation', 'f.medlog', 'f.medreview', 'f.timer'],
  act: ['f.tick', 'f.goals', 'f.milestones', 'f.timer', 'f.training', 'f.skiequipment'],
  trip: ['f.plan', 'f.skiequipment', 'f.gipfelbuch'],
};
/** The feature ids for a sport (kept to those that exist in `ids`). */
export function featuresFor(sport, ids = null) {
  const list = FEATURES_BY[sport.id] ?? (sport.bike ? FEATURES_BY.bike : FEATURES_BY[sport.kind] ?? []);
  return ids ? list.filter((id) => ids.includes(id)) : list;
}
