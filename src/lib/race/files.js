/**
 * Paket U «Rennen»: the race route from one or many GPX files, and your own stops from a POI file.
 * Learnings from the 1000 km example (Noah 19.10.2026): organisers hand out the route in sectors (11 files
 * «Sektor 01 – 98 km» …), seamless one after the other, and one waypoint file with the useful stops
 * (Garmin symbols: Lodging, Restaurant, Shopping Center, Pizza = bakery, Bike Trail = bike shop,
 * Water Source, Campground, Residence = depot, Bell = start and finish).
 *
 * The race keeps (in the settings record, so in the backup):
 *   race.route = { km, gainM, lossM, maxM, start, end, line [[lat, lon]] (≤ 800), profile [[km, m]] (≤ 800),
 *                  profileFine (the detailed profile of map/fineprofile.js, for drawing and the climbs),
 *                  sectors [{ name, fromKm, toKm, gainM }], files [name] }
 *   race.pois  = [{ id, kind, name, lat, lon, km, offKm, sym, own: true }]
 * Pure functions (no browser needed), tested in tests/race.test.js.
 */
import { distKm, climb, thin, profileOf, parseGpx } from '../route.js';
import { lineKm, snap } from './race.js';
import { fineFromSeries } from '../map/fineprofile.js';

/** «Sektor 2», «Sektor-10» sort as numbers: file names in their natural order. */
export const naturalSort = (names) => [...names].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

/**
 * Several parsed GPX files (each { name, points }) → one route, in the given order. A file that starts
 * where the last one ended is joined; a jump of more than 2 km is kept (it is counted, not hidden).
 * → { route, gaps: [{ after: name, km }] }
 */
export function joinSectors(files = []) {
  const all = [];
  const sectors = [];
  const gaps = [];
  const ks = [];
  const es = [];
  let km = 0;
  for (const f of files) {
    const pts = f.points ?? [];
    if (pts.length < 2) continue;
    const prev = all.at(-1);
    if (prev) {
      const jump = distKm(prev, pts[0]);
      if (jump > 2) gaps.push({ after: sectors.at(-1)?.name ?? '', km: Math.round(jump * 10) / 10 });
    }
    let sk = 0;
    for (let i = 0; i < pts.length; i++) {
      if (i) sk += distKm(pts[i - 1], pts[i]);
      // the heights at the km of the route (a jump between files is not counted, as in km)
      if (pts[i].ele != null && Number.isFinite(Number(pts[i].ele))) ks.push(km + sk), es.push(Number(pts[i].ele));
    }
    const { gain } = climb(pts);
    sectors.push({ name: f.name || `${sectors.length + 1}`, fromKm: Math.round(km * 10) / 10, toKm: Math.round((km + sk) * 10) / 10, gainM: gain });
    km += sk;
    all.push(...pts);
  }
  if (all.length < 2) return { route: null, gaps };
  const { gain, loss } = climb(all);
  const ele = all.map((p) => p.ele).filter((e) => e != null);
  const r5 = (v) => Math.round(v * 1e5) / 1e5;
  return {
    route: {
      km: Math.round(km * 10) / 10,
      gainM: gain,
      lossM: loss,
      maxM: ele.length ? Math.round(Math.max(...ele)) : null,
      start: { lat: r5(all[0].lat), lon: r5(all[0].lon) },
      end: { lat: r5(all.at(-1).lat), lon: r5(all.at(-1).lon) },
      line: thin(all, 800),
      profile: profileOf(all, 800),
      profileFine: es.length > 1 ? fineFromSeries(ks, es, km) : null,
      sectors,
      files: files.map((f) => f.file ?? f.name),
    },
    gaps,
  };
}

/** Read the files (File objects) in natural order and join them. Throws with a plain reason. */
export async function readSectorFiles(fileList) {
  const files = naturalSort([...fileList].map((f) => f.name)).map((n) => [...fileList].find((f) => f.name === n));
  const parsed = [];
  for (const f of files) {
    const text = await f.text();
    const gpx = parseGpx(text);
    parsed.push({ name: gpx.name || f.name.replace(/\.gpx$/i, ''), file: f.name, points: gpx.points });
  }
  return joinSectors(parsed);
}

/** The sectors as checkpoints at their end (the last one is the finish). */
export const sectorCheckpoints = (route) => (route?.sectors ?? []).map((s, i) => ({ id: `sec${i + 1}`, name: s.name, km: s.toKm, sector: true }));

/** Garmin waypoint symbols → the app's kinds of stops. Unknown symbols count as «other». */
export const SYM_KIND = {
  'shopping center': 'shop',
  'convenience store': 'shop',
  shopping: 'shop',
  pizza: 'shop', // bakeries in the example file
  restaurant: 'food',
  'fast food': 'food',
  bar: 'food',
  'water source': 'water',
  'drinking water': 'water',
  lodging: 'sleep',
  hotel: 'sleep',
  campground: 'sleep',
  'bike trail': 'bike',
  bike: 'bike',
  residence: 'depot',
  bell: 'startfinish',
  'gas station': 'fuel',
  'train station': 'station',
};

/** The waypoints of a GPX text → [{ name, lat, lon, sym, type, desc }] (works without a browser). */
export function parseWaypoints(text = '') {
  if (!/<gpx[\s>]/i.test(text)) throw new Error('not-gpx');
  const out = [];
  for (const m of text.matchAll(/<wpt\b([^>]*)>([\s\S]*?)<\/wpt>/gi)) {
    const lat = Number(m[1].match(/lat\s*=\s*["']([^"']+)["']/i)?.[1]);
    const lon = Number(m[1].match(/lon\s*=\s*["']([^"']+)["']/i)?.[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const tag = (n) => m[2].match(new RegExp(`<${n}>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*</${n}>`, 'i'))?.[1]?.trim() ?? '';
    out.push({ name: decode(tag('name')), lat, lon, sym: tag('sym'), type: decode(tag('type')), desc: decode(tag('desc') || tag('cmt')) });
  }
  return out;
}
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");

/** «Restaurant» and so on: the kind of a waypoint from its symbol, else from words in its name. */
export function kindOfWpt(w) {
  const k = SYM_KIND[String(w.sym ?? '').toLowerCase()];
  if (k) return k;
  const n = String(w.name ?? '').toLowerCase();
  if (/b(a|ä|ae)ckerei|bakery|coop|migros|denner|volg|spar|lidl|aldi|kiosk|laden|shop/.test(n)) return 'shop';
  if (/restaurant|gasthof|gasthaus|beizli|pizzeria|bistro|caf(e|é)/.test(n)) return 'food';
  if (/hotel|pension|hostel|herberge|camping|hütte|huette|cabane|chalet/.test(n)) return 'sleep';
  if (/velo|bike|cycle|rad/.test(n)) return 'bike';
  if (/brunnen|fontaine|wasser|water/.test(n)) return 'water';
  if (/bahnhof|station|gare/.test(n)) return 'station';
  return 'other';
}

/**
 * Your own stops along the route: each waypoint with its km and how far off the route it is. Points
 * more than maxOffKm away are left out (counted in `far`). → { pois, far }
 */
export function ownPois(wpts = [], route, maxOffKm = 5) {
  const pts = lineKm(route);
  const pois = [];
  let far = 0;
  wpts.forEach((w, i) => {
    const s = pts.length ? snap(pts, w) : { km: 0, offKm: 0 };
    if (pts.length && s.offKm > maxOffKm) {
      far++;
      return;
    }
    pois.push({ id: `own${i}`, kind: kindOfWpt(w), name: w.name, lat: w.lat, lon: w.lon, km: s.km, offKm: s.offKm, sym: w.sym, desc: w.desc || '', own: true });
  });
  return { pois: pois.sort((a, b) => a.km - b.km), far };
}

/** The route as the trip stores it (route.js format: 200 points, 300 profile points), for the other pages. */
export function tripRouteOf(route, name = '') {
  if (!route) return null;
  const pts = route.line.map(([lat, lon]) => ({ lat, lon }));
  return {
    name,
    km: route.km,
    gainM: route.gainM,
    lossM: route.lossM,
    start: route.start,
    end: route.end,
    line: thin(pts, 200),
    profile: route.profile.length > 300 ? Array.from({ length: 300 }, (_, i) => route.profile[Math.round((i * (route.profile.length - 1)) / 299)]) : route.profile,
    file: (route.files ?? []).join(', '),
  };
}

/**
 * The biggest gaps between stops of a kind (learning: «92 km without a shop at the end», «224 km
 * without a bike shop», «168 km without a bed from the start»). → [{ kind, fromKm, toKm, km }] longest first
 */
export function biggestGaps(pois = [], totalKm, kinds = ['shop', 'food', 'water', 'sleep', 'bike'], top = 1) {
  const out = [];
  for (const kind of kinds) {
    const ks = pois
      .filter((p) => p.kind === kind || (kind === 'shop' && p.kind === 'fuel') || (kind === 'water' && (p.kind === 'shop' || p.kind === 'fuel' || p.kind === 'food')))
      .map((p) => p.km)
      .sort((a, b) => a - b);
    const pts = [0, ...ks, totalKm];
    const gaps = [];
    for (let i = 1; i < pts.length; i++) gaps.push({ kind, fromKm: Math.round(pts[i - 1]), toKm: Math.round(pts[i]), km: Math.round(pts[i] - pts[i - 1]) });
    out.push(...gaps.sort((a, b) => b.km - a.km).slice(0, top));
  }
  return out.sort((a, b) => b.km - a.km);
}
