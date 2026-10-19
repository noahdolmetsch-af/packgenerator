/**
 * Paket U «Rennen», ideas 33–40 (Noah 19.10.2026 «1-32 und 33-40»): the parts that need no outside data
 * or only the OSM ways along the route. Pure functions, tested in tests/race.test.js.
 */
import { OVERPASS } from './outside.js';
import { snap } from './race.js';

/* ---------- merge your own stops with OSM ---------- */

/**
 * Your own stops first; an OSM place of the same kind within 150 m of one of yours is left out, and gives
 * yours its opening hours and phone when yours has none (learning: the organiser's POI file has names
 * and symbols only, OSM knows when the bakery closes).
 */
export function mergePois(own = [], osm = []) {
  const near = (a, b) => Math.abs(a.lat - b.lat) < 0.0014 && Math.abs(a.lon - b.lon) < 0.002;
  const same = (a, b) => a.kind === b.kind || (a.kind === 'shop' && b.kind === 'fuel') || (a.kind === 'food' && b.kind === 'shop');
  const used = new Set();
  const mine = own.map((p) => {
    const o = osm.find((x) => same(p, x) && near(p, x));
    if (!o) return p;
    used.add(o.id ?? o);
    return { ...p, hours: p.hours || o.hours || '', phone: p.phone || o.phone || '' };
  });
  const rest = osm.filter((o) => !used.has(o.id ?? o) && !own.some((p) => same(p, o) && near(p, o)));
  return [...mine, ...rest].sort((a, b) => a.km - b.km);
}

/* ---------- 34 · Pannen-Plan nach Belag and 35 · Hauptstrassen in der Nacht ---------- */

/** The query for the roads under the route (tags and middle only, small enough for 1000 km). */
export function wayQuery(pts) {
  const n = Math.min(pts.length, 400);
  const line = Array.from({ length: n }, (_, i) => pts[Math.round((i * (pts.length - 1)) / Math.max(1, n - 1))])
    .map((p) => `${p.lat.toFixed(5)},${p.lon.toFixed(5)}`)
    .join(',');
  return `[out:json][timeout:90];way["highway"](around:20,${line});out center tags;`;
}

/** Surfaces in three groups. */
export const SURFACE = {
  paved: /^(asphalt|paved|concrete|concrete:plates|paving_stones|sett|chipseal)$/,
  gravel: /^(gravel|fine_gravel|compacted|unpaved|dirt|ground|earth|grass|pebblestone|mud|sand|rock|woodchips)$/,
};
const surfaceOf = (tags) => {
  const s = tags.surface ?? '';
  if (SURFACE.paved.test(s)) return 'paved';
  if (SURFACE.gravel.test(s)) return 'gravel';
  if (/^(track|path|bridleway)$/.test(tags.highway)) return 'gravel';
  if (/^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|service|living_street|cycleway)$/.test(tags.highway)) return 'paved';
  return 'unknown';
};
export const BUSY = /^(trunk|trunk_link|primary|primary_link)$/;

/**
 * The OSM ways → per bin of `bin` km: the surface most seen and whether a busy road is there.
 * → { bins: [{ fromKm, toKm, surface, busy }], gravelShare (0–100), busy: [{ fromKm, toKm }] }
 * An estimate: each way counts once in the bin of its middle.
 */
export function roadsFrom(json, pts, totalKm, bin = 5) {
  const n = Math.max(1, Math.ceil(totalKm / bin));
  const bins = Array.from({ length: n }, (_, i) => ({ fromKm: i * bin, toKm: Math.min(totalKm, (i + 1) * bin), c: { paved: 0, gravel: 0, unknown: 0 }, busy: false }));
  for (const e of json?.elements ?? []) {
    const c = e.center;
    if (!c || !e.tags) continue;
    const s = snap(pts, { lat: c.lat, lon: c.lon });
    if (s.offKm > 0.3) continue;
    const b = bins[Math.min(n - 1, Math.floor(s.km / bin))];
    b.c[surfaceOf(e.tags)]++;
    if (BUSY.test(e.tags.highway)) b.busy = true;
  }
  const out = bins.map((b) => ({ fromKm: Math.round(b.fromKm), toKm: Math.round(b.toKm), surface: b.c.gravel > b.c.paved ? 'gravel' : b.c.paved || b.c.gravel ? 'paved' : 'unknown', busy: b.busy }));
  const known = out.filter((b) => b.surface !== 'unknown');
  const gravelShare = known.length ? Math.round((known.filter((b) => b.surface === 'gravel').length / known.length) * 100) : null;
  const busy = [];
  for (const b of out) {
    const last = busy.at(-1);
    if (!b.busy) continue;
    if (last && last.toKm >= b.fromKm) last.toKm = b.toKm;
    else busy.push({ fromKm: b.fromKm, toKm: b.toKm });
  }
  return { bins: out, gravelShare, busy };
}
export async function fetchRoads(pts, totalKm, fetcher = fetch) {
  const res = await fetcher(OVERPASS, { method: 'POST', body: `data=${encodeURIComponent(wayQuery(pts))}`, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  if (!res.ok) throw new Error(res.status === 429 ? 'busy' : 'failed');
  return roadsFrom(await res.json(), pts, totalKm);
}

/**
 * 34 · Spares for the share of gravel and the length: tubes, plugs, sealant, pads, chain links.
 * → [{ key (English), n }]
 */
export function sparesFor(km, gravelShare = 0) {
  const g = Math.max(0, Math.min(100, Number(gravelShare) || 0)) / 100;
  const gravelKm = km * g;
  return [
    { key: 'Inner tubes', n: Math.max(1, Math.ceil(km / 600 + gravelKm / 400)) },
    { key: 'Tubeless plugs', n: Math.max(2, Math.ceil(2 + gravelKm / 150)) },
    { key: 'Sealant (small bottle, ml)', n: g >= 0.2 ? 60 : 30 },
    { key: 'Spare brake pads (pairs)', n: km > 800 || gravelKm > 250 ? 2 : 1 },
    { key: 'Quick links for the chain', n: km > 500 ? 2 : 1 },
    { key: 'Tyre boot', n: gravelKm > 100 ? 2 : 1 },
    { key: 'Spokes (with nipple)', n: gravelKm > 300 ? 2 : 0 },
  ].filter((x) => x.n > 0);
}

/**
 * 35 · The busy stretches you are expected to ride in the dark. dark(ms) → true at night; eta(km) → ms.
 * → [{ fromKm, toKm, at }]
 */
export const busyInDark = (busy = [], eta, dark) =>
  busy
    .map((b) => ({ ...b, at: eta(b.fromKm), end: eta(b.toKm) }))
    .filter((b) => dark(b.at) || dark(b.end));

/* ---------- 36 · Gesamtgewicht pro Tag ---------- */

/**
 * The weight of bike and luggage along the route, every 5 km: you fill water at water and food stops
 * (up to waterL), you buy food at shops (up to foodKg); on the way you drink drinkLh litres and eat
 * eatKgH kilos per riding hour. base: bike + packed gear without food and water (kg).
 * eta(km) → ms (for the riding hours); refill: [km] where water is; shops: [km] where food is.
 * → { points: [{ km, kg }], max: { km, kg }, min: { km, kg } }
 */
export function weightAlong({ base, totalKm, eta, waterAt = [], foodAt = [], waterL = 2.5, foodKg = 1.5, drinkLh = 0.6, eatKgH = 0.12, step = 5 }) {
  if (!(totalKm > 0) || !Number.isFinite(base)) return null;
  const w = [...waterAt].sort((a, b) => a - b);
  const f = [...foodAt].sort((a, b) => a - b);
  let water = waterL;
  let food = foodKg;
  let lastMs = eta(0);
  let wi = 0;
  let fi = 0;
  const points = [];
  for (let km = 0; km <= totalKm + 0.01; km += step) {
    const ms = eta(Math.min(km, totalKm));
    const h = Math.max(0, (ms - lastMs) / 36e5);
    lastMs = ms;
    water = Math.max(0, water - drinkLh * Math.min(h, 3));
    food = Math.max(0, food - eatKgH * Math.min(h, 3));
    while (wi < w.length && w[wi] <= km) (water = waterL), wi++;
    while (fi < f.length && f[fi] <= km) (food = foodKg), fi++;
    points.push({ km: Math.round(Math.min(km, totalKm)), kg: Math.round((base + water + food) * 10) / 10 });
  }
  const max = points.reduce((a, b) => (b.kg > a.kg ? b : a), points[0]);
  const min = points.reduce((a, b) => (b.kg < a.kg ? b : a), points[0]);
  return { points, max, min };
}

/* ---------- 37 · Wäsche-Plan ---------- */

/**
 * How often to wash: sets of riding clothes you carry, days of the trip, nights in a room (hotel nights
 * dry faster). → { washes: [{ day, where }], every } where day is the race day (1 = start).
 */
export function laundryPlan({ days, sets = 2, hotelDays = [], dryDays = 1 }) {
  const n = Math.max(1, Math.round(days));
  const every = Math.max(1, sets - dryDays + 1);
  if (n <= sets) return { washes: [], every };
  const washes = [];
  for (let d = every; d < n; d += every) {
    const near = hotelDays.find((h) => Math.abs(h - d) <= 1 && h < n && !washes.some((w) => w.day === h));
    washes.push({ day: near ?? d, where: near ? 'hotel' : 'rinse' });
  }
  return { washes, every };
}

/* ---------- 38 · Abschnitts-Analyse ---------- */

/**
 * Per section (from one checkpoint to the next) plan against what happened. rows: checkpointRows (with
 * eta and actualMs), start: ms. → [{ name, fromKm, toKm, planH, actualH, diffH (+ = lost time) }]
 */
export function sectionAnalysis(rows = [], start) {
  const out = [];
  let prev = { name: 'Start', km: 0, eta: start, actualMs: start };
  for (const r of rows) {
    const planH = r.eta != null && prev.eta != null ? (r.eta - prev.eta) / 36e5 : null;
    const actualH = r.actualMs != null && prev.actualMs != null ? (r.actualMs - prev.actualMs) / 36e5 : null;
    out.push({ name: r.name, fromKm: Number(prev.km) || 0, toKm: Number(r.km) || 0, planH, actualH, diffH: planH != null && actualH != null ? actualH - planH : null });
    prev = r;
  }
  return out;
}

/* ---------- 39 · Werkzeug passt zum Velo ---------- */

/** «Inbus 4, 5 · Torx T25» → normalised sizes: ['hex4', 'hex5', 't25']. */
export function sizesOf(text = '') {
  const out = new Set();
  const s = String(text).toLowerCase().replace(/inbus|allen|hex|innensechskant/g, ' hex ');
  let mode = 'hex';
  for (const tok of s.split(/[\s,;/+·]+/).filter(Boolean)) {
    if (tok === 'hex') mode = 'hex';
    else if (tok === 'torx') mode = 't';
    else if (/^t\d+$/.test(tok)) out.add(tok);
    else if (/^(ph|pz)\d$/.test(tok)) out.add(tok);
    else if (/^\d+(\.\d)?(mm)?$/.test(tok)) out.add(`${mode === 't' ? 't' : 'hex'}${tok.replace('mm', '')}`);
    else if (/^(kreuz|phillips)$/.test(tok)) out.add('ph2');
    else if (/^(kettennieter|chain)$/.test(tok)) out.add('chain');
    else if (/^(speichen|spoke)/.test(tok)) out.add('spoke');
  }
  return [...out];
}
/** The bolts your tool cannot turn. → { missing: [size], ok: [size] } */
export function toolCheck(boltsText, toolText) {
  const bolts = sizesOf(boltsText);
  const tool = new Set(sizesOf(toolText));
  return { missing: bolts.filter((b) => !tool.has(b)), ok: bolts.filter((b) => tool.has(b)) };
}
/** A size for people, as arguments for t(): hex4 → ['Hex {n}', { n: '4' }], t25 → ['Torx {n}', { n: 'T25' }]. */
export const sizeLabel = (s) => (s.startsWith('hex') ? ['Hex {n}', { n: s.slice(3) }] : /^t\d/.test(s) ? ['Torx {n}', { n: s.toUpperCase() }] : s === 'chain' ? ['Chain tool', {}] : s === 'spoke' ? ['Spoke key', {}] : ['{n}', { n: s.toUpperCase() }]);

/* ---------- 40 · Renn-Papierkram ---------- */

/** The paperwork as the app comes (English keys, yours to change). daysBefore: when it is due. */
export const PAPERS = [
  { id: 'pp-signup', text: 'Registration', daysBefore: 90 },
  { id: 'pp-fee', text: 'Pay the entry fee', daysBefore: 80 },
  { id: 'pp-licence', text: 'Licence or day licence', daysBefore: 30 },
  { id: 'pp-tracker', text: 'Rent or charge the tracker', daysBefore: 14 },
  { id: 'pp-insurance', text: 'Insurance: accident, rescue and bike', daysBefore: 21 },
  { id: 'pp-medical', text: 'Medical form or waiver, if the race asks', daysBefore: 14 },
  { id: 'pp-travel', text: 'Travel to the start and back home', daysBefore: 30 },
];

/* ---------- 22 · Velo-Check from km, rain and dust ---------- */

/**
 * The care after the race from what happened: km ridden, rainy hours and dusty (gravel) share.
 * → English keys, most important first.
 */
export function careAfter({ km = 0, rainH = 0, gravelShare = 0 }) {
  const out = [];
  if (rainH >= 3 || gravelShare >= 30) out.push('Wash the bike, dry the chain and oil it');
  else out.push('Clean and oil the chain');
  if (km >= 600) out.push('Chain: measure the wear');
  if (km >= 500 || rainH >= 6) out.push('Brake pads: check what is left');
  if (gravelShare >= 20) out.push('Tyres: cuts, sealant, pressure');
  if (rainH >= 6 || gravelShare >= 40) out.push('Bearings: headset, hubs and bottom bracket turn freely');
  out.push('Bolts: stem, handlebar, seat post, bottle cages');
  out.push('Bags: dry them, check straps and zips');
  out.push('Charge and clean lights, GPS and power bank');
  return out;
}

/* ---------- 30 · Sonnenschutz: when again? ---------- */

/** Cream again after `everyH` hours when the UV is 3 or more. last: ms of the last time, or null. */
export function creamDue(uv, last, now, everyH = 2) {
  if (!Number.isFinite(uv) || uv < 3) return false;
  return last == null || now - last >= everyH * 36e5;
}

/* ---------- 31 · Ruhetag-Planer ---------- */

/**
 * The best places for a rest day: a place to sleep with a laundry, a bike shop and a shop within 3 km.
 * Only after the first third of the route. → [{ poi, score, has: { laundry, bike, shop } }] best 3
 */
export function restDaySpots(pois = [], totalKm) {
  const sleep = pois.filter((p) => p.kind === 'sleep' && p.km >= totalKm / 3);
  const near = (p, kind) => pois.some((q) => q.kind === kind && Math.abs(q.km - p.km) <= 3);
  return sleep
    .map((p) => {
      const has = { laundry: near(p, 'laundry'), bike: near(p, 'bike'), shop: near(p, 'shop') };
      return { poi: p, has, score: (has.laundry ? 2 : 0) + (has.bike ? 2 : 0) + (has.shop ? 1 : 0) - Math.abs(p.km - totalKm / 2) / totalKm };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/* ---------- 19 · bottles for a dry stretch ---------- */

/** Bottles (of bottleL) you need for a stretch of h riding hours at drinkLh litres per hour. */
export const bottlesFor = (h, drinkLh = 0.6, bottleL = 0.75) => Math.max(1, Math.ceil((h * drinkLh) / bottleL));
