/**
 * «Orte auf der Karte» (Noah 19.10.2026 «brunnen, einkaufsmöglichkeiten, tankstellen, bikeshops,
 * restaurants, hotels, zeltplätze, öffentliche toiletten … aktiv in der karte anzeigen … im umkreis von
 * 10km»): the places of the switched-on kinds from OpenStreetMap, through the free Overpass API (no key,
 * no cost, fair use: one query per tap, a timeout, at most MAX_PLACES places, two mirrors).
 *
 * Three ways to search: around a point (2/5/10/20 km or an own radius of 1–50 km), the visible map area («Search here») or a
 * corridor along the route (width per kind). The answers stay on this device (db.meta, not in the
 * backup): along the route until «Load again» (works offline), around / the map area 24 h; «around» is
 * also reused when you moved less than a quarter of the radius.
 *
 * «Weitere Quellen» (Noah 20.10.2026 «1a+b»): more kinds to switch into the chip row (MORE), chips renamed,
 * removed and sorted (prefs row / names), and own kinds with OpenStreetMap tags typed by you (prefs own,
 * checked by checkSelector so nothing but ["k"="v"], ["k"~"v"], ["k"!="v"] and ["k"] reaches Overpass).
 *
 * Pure: the store ({ get(key), put(rec) }, e.g. db.meta) and the fetcher are passed in. Names come from
 * OpenStreetMap as they are and never go through t(). Tested in tests/poisearch.test.js.
 */
import { thinLine, fetchOverpass, OVERPASS_URLS, lineHash } from '../route/pois.js';
import { lineKm, snap } from '../race/race.js';
import { distKm } from '../live/live-lib.js';

export { OVERPASS_URLS };
export const SETTINGS_KEY = 'poi-search';
export const CACHE_PREFIX = 'poi-search:';
export const MAX_PLACES = 400;
export const TIMEOUT_S = 25;
export const RADII = [2, 5, 10, 20];
/** An own radius: 1 to 50 km, whole or half km. */
export const RADIUS_MIN = 1;
export const RADIUS_MAX = 50;
export const MODES = ['around', 'here', 'route'];
export const DEFAULTS = { on: [], mode: 'around', radiusKm: 10 };
export const DAY_MS = 864e5;
/** The visible map area is searched only up to this diagonal (fair use; zoom in otherwise). */
export const MAX_VIEW_KM = 40;
/** Line points sent for a corridor (each kind repeats them). */
export const CORRIDOR_PTS = 100;

/**
 * The kinds. name: English key for t(); icon: a lucide icon name; tags: Overpass selectors (any one
 * matches); widthM: the corridor beside the route. The order is also the order of kindOf.
 */
export const CATEGORIES = [
  { key: 'water', name: 'Water|poi', icon: 'droplet', widthM: 300, tags: ['["amenity"="drinking_water"]', '["amenity"="fountain"]["drinking_water"="yes"]', '["man_made"="water_tap"]["drinking_water"!="no"]', '["amenity"="water_point"]'] },
  { key: 'shop', name: 'Shopping|poi', icon: 'shopping-cart', widthM: 1000, tags: ['["shop"~"^(supermarket|convenience|bakery|kiosk|general|deli|greengrocer|butcher|farm)$"]'] },
  { key: 'food', name: 'Food|poi', icon: 'utensils', widthM: 1000, tags: ['["amenity"~"^(restaurant|cafe|fast_food|biergarten)$"]'] },
  { key: 'fuel', name: 'Petrol station', icon: 'fuel', widthM: 1500, tags: ['["amenity"="fuel"]'] },
  { key: 'bike', name: 'Bike shop and workshop|poi', icon: 'bike', widthM: 3000, tags: ['["shop"="bicycle"]', '["craft"="bicycle"]'] },
  { key: 'repair', name: 'Repair stand|poi', icon: 'wrench', widthM: 500, tags: ['["amenity"="bicycle_repair_station"]', '["service:bicycle:pump"="yes"]', '["amenity"="compressed_air"]'] },
  { key: 'sleep', name: 'Hotel|poi', icon: 'bed', widthM: 3000, tags: ['["tourism"~"^(hotel|guest_house|hostel|motel|alpine_hut|chalet|apartment)$"]'] },
  { key: 'camp', name: 'Camping|poi', icon: 'tent', widthM: 3000, tags: ['["tourism"~"^(camp_site|caravan_site|camp_pitch)$"]'] },
  { key: 'shelter', name: 'Shelter', icon: 'house', widthM: 500, tags: ['["amenity"="shelter"]', '["tourism"="wilderness_hut"]'] },
  { key: 'toilet', name: 'WC|poi', icon: 'toilet', widthM: 300, tags: ['["amenity"="toilets"]'] },
  { key: 'pharmacy', name: 'Pharmacy|poi', icon: 'pill', widthM: 2000, tags: ['["amenity"="pharmacy"]', '["healthcare"="pharmacy"]'] },
  { key: 'hospital', name: 'Hospital|poi', icon: 'hospital', widthM: 5000, tags: ['["amenity"~"^(hospital|clinic)$"]'] },
  { key: 'atm', name: 'ATM|poi', icon: 'banknote', widthM: 1000, tags: ['["amenity"="atm"]', '["amenity"="bank"]["atm"="yes"]'] },
  { key: 'station', name: 'Station', icon: 'train-front', widthM: 3000, tags: ['["railway"~"^(station|halt)$"]'] },
  { key: 'laundry', name: 'Laundry', icon: 'washing-machine', widthM: 3000, tags: ['["shop"~"^(laundry|dry_cleaning)$"]', '["amenity"="laundry"]'] },
  { key: 'view', name: 'Viewpoint|poi', icon: 'binoculars', widthM: 300, tags: ['["tourism"="viewpoint"]'] },
];
/** The default chip row: the 16 kinds above. */
export const KEYS = CATEGORIES.map((c) => c.key);

/**
 * More kinds you can switch into the chip row («Change the kinds»). A more specific kind wins over a
 * default one when both are on (a bakery is «Bakery», not «Shopping»).
 */
export const MORE = [
  { key: 'supermarket', name: 'Supermarket|poi', icon: 'shopping-basket', widthM: 1000, tags: ['["shop"="supermarket"]'] },
  { key: 'bakery', name: 'Bakery|poi', icon: 'croissant', widthM: 1000, tags: ['["shop"="bakery"]'] },
  { key: 'icecream', name: 'Ice cream|poi', icon: 'ice-cream-cone', widthM: 500, tags: ['["amenity"="ice_cream"]', '["shop"="ice_cream"]'] },
  { key: 'bench', name: 'Bench|poi', icon: 'armchair', widthM: 300, tags: ['["amenity"="bench"]'] },
  { key: 'picnic', name: 'Picnic spot|poi', icon: 'tree-pine', widthM: 500, tags: ['["leisure"="picnic_table"]', '["tourism"="picnic_site"]'] },
  { key: 'charge', name: 'E-bike charging|poi', icon: 'plug-zap', widthM: 1000, tags: ['["amenity"="charging_station"]["bicycle"="yes"]', '["amenity"="charging_station"]["ebike"="yes"]'] },
  { key: 'bikepark', name: 'Bike parking|poi', icon: 'circle-parking', widthM: 300, tags: ['["amenity"="bicycle_parking"]'] },
  { key: 'rental', name: 'Bike rental|poi', icon: 'bike', widthM: 2000, tags: ['["amenity"="bicycle_rental"]'] },
  // U4 «Schlafplätze im Rennen» 1137 + 1143: more roofs for the night, and places open all night
  { key: 'roofbus', name: 'Bus stop with a roof|poi', icon: 'bus', widthM: 500, tags: ['["highway"="bus_stop"]["shelter"="yes"]'] },
  { key: 'hut', name: 'Picnic and forest hut|poi', icon: 'house', widthM: 500, tags: ['["amenity"="shelter"]["shelter_type"~"^(picnic_shelter|basic_hut|lean_to|weather_shelter)$"]'] },
  { key: 'bivouac', name: 'Bivouac box|poi', icon: 'mountain', widthM: 3000, tags: ['["tourism"="wilderness_hut"]'] },
  { key: 'waitroom', name: 'Station waiting room|poi', icon: 'train-front', widthM: 3000, tags: ['["amenity"="waiting_room"]'] },
  { key: 'night24', name: 'Open at night|poi', icon: 'moon', widthM: 3000, tags: ['["amenity"="fuel"]["opening_hours"="24/7"]', '["shop"~"^(convenience|supermarket|kiosk)$"]["opening_hours"="24/7"]', '["railway"="station"]["opening_hours"="24/7"]'] },
  { key: 'bus', name: 'Bus stop|poi', icon: 'bus', widthM: 500, tags: ['["highway"="bus_stop"]', '["amenity"="bus_station"]'] },
  { key: 'transit', name: 'Public transport|poi', icon: 'tram-front', widthM: 1500, tags: ['["public_transport"="station"]', '["railway"="tram_stop"]', '["amenity"="ferry_terminal"]'] },
  { key: 'info', name: 'Tourist information|poi', icon: 'info', widthM: 1000, tags: ['["tourism"="information"]["information"~"^(office|visitor_centre)$"]'] },
  { key: 'swim', name: 'Swimming|poi', icon: 'waves-horizontal', widthM: 1000, tags: ['["leisure"~"^(swimming_area|bathing_place|beach_resort)$"]', '["amenity"="public_bath"]'] },
  { key: 'church', name: 'Church|poi', icon: 'church', widthM: 500, tags: ['["amenity"="place_of_worship"]'] },
  { key: 'pass', name: 'Mountain pass|poi', icon: 'mountain', widthM: 500, tags: ['["mountain_pass"="yes"]'] },
  { key: 'doctor', name: 'Doctor|poi', icon: 'stethoscope', widthM: 3000, tags: ['["amenity"="doctors"]', '["healthcare"="doctor"]'] },
  { key: 'police', name: 'Police|poi', icon: 'shield', widthM: 3000, tags: ['["amenity"="police"]'] },
  { key: 'post', name: 'Post office|poi', icon: 'mail', widthM: 2000, tags: ['["amenity"="post_office"]'] },
];
export const MORE_KEYS = MORE.map((c) => c.key);
/** Every kind of the app (the default row first). */
export const ALL = [...CATEGORIES, ...MORE];
export const ALL_KEYS = ALL.map((c) => c.key);
export const CATEGORY = Object.fromEntries(ALL.map((c) => [c.key, c]));

/* ---------- own kinds (OpenStreetMap tags typed by you) ---------- */

export const OWN_CAT_PREFIX = 'my-';
export const MAX_OWN_CATS = 20;
export const MAX_SELECTORS = 8;
export const MAX_PARTS = 4;
export const OWN_WIDTH_M = 1000;
/** The icons an own kind can have: the icon and map symbol of these kinds. */
export const OWN_ICONS = ['view', 'water', 'food', 'shop', 'sleep', 'camp', 'bike', 'repair', 'toilet', 'station', 'bench', 'picnic', 'swim', 'church', 'info', 'pass'];
const OSM_KEY = /^[A-Za-z0-9_:.-]{1,64}$/;
const BAD_VALUE = /["\\\u0000-\u001f]/;
const BRACKET = /\s*\[\s*"([^"\\\]\n]*)"\s*(?:(=|!=|~)\s*"([^"\\\n]*)"\s*)?\]/y;

/**
 * One line typed by you → { sel } (the clean selector, e.g. ["amenity"="bench"]) or { error }:
 * 'empty' | 'form' | 'key' | 'value' | 'regex' | 'positive' | 'long'. Allowed: ["k"="v"], ["k"~"v"],
 * ["k"!="v"] and ["k"], up to MAX_PARTS in a row (all must fit); also plain amenity=bench. Anything
 * else is refused, so no other Overpass text can get into a query.
 */
export function checkSelector(line) {
  const text = String(line ?? '').trim();
  if (!text) return { error: 'empty' };
  if (text.length > 400) return { error: 'long' };
  const parts = [];
  if (text.startsWith('[')) {
    BRACKET.lastIndex = 0;
    let at = 0;
    while (at < text.length) {
      BRACKET.lastIndex = at;
      const m = BRACKET.exec(text);
      if (!m) return { error: 'form' };
      parts.push([m[1], m[2], m[3]]);
      at = BRACKET.lastIndex;
      if (/^\s*$/.test(text.slice(at))) break;
    }
  } else {
    const m = text.match(/^([^=!~"\s]+)\s*(?:(=|!=|~)\s*(.*))?$/);
    if (!m) return { error: 'form' };
    const v = m[2] ? m[3].trim().replace(/^"(.*)"$/, '$1') : undefined;
    parts.push([m[1], m[2], v]);
  }
  if (!parts.length) return { error: 'form' };
  if (parts.length > MAX_PARTS) return { error: 'long' };
  for (const [k, op, v] of parts) {
    if (!OSM_KEY.test(k)) return { error: 'key' };
    if (op && (!v || v.length > 120 || BAD_VALUE.test(v))) return { error: 'value' };
    if (op === '~') {
      try {
        new RegExp(v);
      } catch {
        return { error: 'regex' };
      }
    }
  }
  if (!parts.some(([, op]) => op !== '!=')) return { error: 'positive' };
  return { sel: parts.map(([k, op, v]) => (op ? `["${k}"${op}"${v}"]` : `["${k}"]`)).join('') };
}

/** Several lines (one selector each) → { tags: [clean selectors], errors: [{ line (1-based), error }] }. */
export function checkSelectors(text) {
  const lines = String(text ?? '').split(/\r?\n/).map((l) => l.trim());
  const tags = [];
  const errors = [];
  lines.forEach((l, i) => {
    if (!l) return;
    const r = checkSelector(l);
    if (r.sel) {
      if (!tags.includes(r.sel)) tags.push(r.sel);
    } else errors.push({ line: i + 1, error: r.error });
  });
  if (tags.length > MAX_SELECTORS) errors.push({ line: 0, error: 'many' });
  if (!tags.length && !errors.length) errors.push({ line: 0, error: 'none' });
  return { tags, errors };
}

/** A stored own kind, cleaned → { key, name, icon, tags, widthM, own: true } or null. */
export function ownCatOf(c) {
  const key = String(c?.key ?? '');
  const name = String(c?.name ?? '').trim().slice(0, 40);
  if (!/^my-[a-z0-9]{2,16}$/.test(key) || !name) return null;
  const tags = [...new Set((Array.isArray(c?.tags) ? c.tags : []).map((s) => checkSelector(s).sel).filter(Boolean))].slice(0, MAX_SELECTORS);
  if (!tags.length) return null;
  return { key, name, icon: OWN_ICONS.includes(c?.icon) ? c.icon : OWN_ICONS[0], tags, widthM: OWN_WIDTH_M, own: true };
}
const ownCats = (v) => {
  const out = [];
  for (const c of Array.isArray(v) ? v : []) {
    const x = ownCatOf(c);
    if (x && !out.some((o) => o.key === x.key) && out.length < MAX_OWN_CATS) out.push(x);
  }
  return out;
};
/** A new own kind from the form → { cat } or { errors } (name missing: { line: 0, error: 'name' }). */
export function newOwnCat({ name = '', icon = OWN_ICONS[0], text = '' } = {}, rand = Math.random) {
  const { tags, errors } = checkSelectors(text);
  const errs = [...(String(name).trim() ? [] : [{ line: 0, error: 'name' }]), ...errors];
  if (errs.length) return { errors: errs };
  const key = `${OWN_CAT_PREFIX}${rand().toString(36).slice(2, 10).replace(/[^a-z0-9]/g, '') || 'x1'}`.padEnd(5, '0');
  return { cat: ownCatOf({ key, name, icon, tags }) };
}
/** The kind of a key: one of the app's or one of yours (own: the prefs' own kinds), or null. */
export const catOf = (key, own = []) => CATEGORY[key] ?? own.find((c) => c.key === key) ?? null;
/** The selector line of an own kind, so a kept answer knows when you changed its tags. */
export const sigOf = (c) => (c?.tags ?? []).join('');

/** A nicer English key for common OSM sub kinds (shown when a place has no name). */
export const SUB_NAMES = {
  supermarket: 'Supermarket|poi',
  convenience: 'Small shop|poi',
  bakery: 'Bakery|poi',
  kiosk: 'Kiosk|poi',
  restaurant: 'Restaurant',
  cafe: 'Café|poi',
  fast_food: 'Takeaway|poi',
  hotel: 'Hotel|poi',
  guest_house: 'Guesthouse|poi',
  hostel: 'Hostel|poi',
  alpine_hut: 'Mountain hut|poi',
  camp_site: 'Campsite|poi',
  caravan_site: 'Campsite|poi',
  camp_pitch: 'Tent site|poi',
  drinking_water: 'Drinking water|poi',
  fountain: 'Fountain|poi',
  hospital: 'Hospital|poi',
  clinic: 'Clinic|poi',
  bicycle_repair_station: 'Repair stand|poi',
  compressed_air: 'Air pump|poi',
};
/** The English key that names a place without a name: its sub kind, else its kind. */
export const labelOf = (p) => SUB_NAMES[p?.sub] ?? CATEGORY[p?.kind]?.name ?? 'Place|poi';

/** A starred place as kept: { id, kind, name, lat, lon, sub } (+ catName: the name of your kind). */
export const starOf = (p) => ({ id: String(p.id), kind: CATEGORY[p.kind] ? p.kind : 'water', name: str(p.name), lat: r5(Number(p.lat)), lon: r5(Number(p.lon)), sub: str(p.sub), ...(str(p.catName) ? { catName: str(p.catName).slice(0, 40) } : {}) });

/** An own radius typed or kept (also «7,5») → km (1–50, rounded to half a km) or null. */
export function radiusOf(v) {
  if (v == null || (typeof v === 'string' && !v.trim())) return null;
  const n = typeof v === 'number' ? v : Number(String(v).trim().replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  const r = Math.round(n * 2) / 2;
  return r >= RADIUS_MIN && r <= RADIUS_MAX ? r : null;
}

/**
 * The settings record, cleaned: { on: [keys switched on, all in the row], mode, radiusKm, starred:
 * [places], row: [the chips in your order], names: { key: your name for an app kind }, own: [your kinds] }.
 * Without a row: the 16 default kinds.
 */
export function prefsOf(v) {
  const own = ownCats(v?.own);
  const isKey = (k) => typeof k === 'string' && (!!CATEGORY[k] || own.some((c) => c.key === k));
  const row = Array.isArray(v?.row) ? [...new Set(v.row.filter(isKey))] : [...KEYS];
  const on = Array.isArray(v?.on) ? [...new Set(v.on.filter((k) => isKey(k) && row.includes(k)))] : [];
  const names = {};
  for (const [k, n] of Object.entries(v?.names && typeof v.names === 'object' ? v.names : {})) {
    const s = String(n ?? '').trim().slice(0, 40);
    if (CATEGORY[k] && s) names[k] = s;
  }
  const starred = (Array.isArray(v?.starred) ? v.starred : []).filter((p) => p?.id && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon))).map(starOf);
  return { on, mode: MODES.includes(v?.mode) ? v.mode : DEFAULTS.mode, radiusKm: radiusOf(v?.radiusKm) ?? DEFAULTS.radiusKm, starred, row, names, own };
}

/* ---------- changing the chip row (each → new prefs) ---------- */

/** Move a chip from place `from` to `to`. */
export function moveChip(prefs, from, to) {
  const p = prefsOf(prefs);
  if (to < 0 || to >= p.row.length || from < 0 || from >= p.row.length || from === to) return p;
  const row = [...p.row];
  const [x] = row.splice(from, 1);
  row.splice(to, 0, x);
  return { ...p, row };
}
/** Your name for an app kind ('' or the shown default name: back to the app's name). */
export function renameChip(prefs, key, name, defaultName = '') {
  const p = prefsOf(prefs);
  const s = String(name ?? '').trim().slice(0, 40);
  const own = p.own.find((c) => c.key === key);
  if (own) return s ? { ...p, own: p.own.map((c) => (c.key === key ? { ...c, name: s } : c)) } : p;
  const names = { ...p.names };
  if (!s || s === defaultName) delete names[key];
  else names[key] = s;
  return { ...p, names };
}
/** Take a chip out of the row (an app kind waits under «More kinds»; switched off). */
export const hideChip = (prefs, key) => {
  const p = prefsOf(prefs);
  return { ...p, row: p.row.filter((k) => k !== key), on: p.on.filter((k) => k !== key) };
};
/** Put a kind into the row (at the end), optionally switched on. */
export const showChip = (prefs, key, { on = false } = {}) => {
  const p = prefsOf(prefs);
  if (!catOf(key, p.own)) return p;
  return { ...p, row: p.row.includes(key) ? p.row : [...p.row, key], on: on && !p.on.includes(key) ? [...p.on, key] : p.on };
};
/** Add or change an own kind (a new one goes into the row, switched on). */
export function putOwnCat(prefs, cat) {
  const p = prefsOf(prefs);
  const c = ownCatOf(cat);
  if (!c) return p;
  if (p.own.some((o) => o.key === c.key)) return { ...p, own: p.own.map((o) => (o.key === c.key ? c : o)) };
  if (p.own.length >= MAX_OWN_CATS) return p;
  return showChip({ ...p, own: [...p.own, c] }, c.key, { on: true });
}
/** Delete an own kind (from the row too). */
export const removeOwnCat = (prefs, key) => {
  const p = hideChip(prefs, key);
  return { ...p, own: p.own.filter((c) => c.key !== key) };
};
/** Star or unstar a place in the prefs (→ new prefs). */
export function toggleStar(prefs, place) {
  const p = prefsOf(prefs);
  const has = p.starred.some((s) => s.id === place.id);
  return { ...p, starred: has ? p.starred.filter((s) => s.id !== place.id) : [...p.starred, starOf(place)] };
}

/* ---------- selectors: query and matching ---------- */

const SEL = /\["([^"]+)"(?:(=|!=|~)"([^"]*)")?\]/g;
/** One selector string → [[key, op, value]] (op undefined: the key is there). */
export const partsOf = (sel) => [...sel.matchAll(SEL)].map((m) => [m[1], m[2], m[3]]);
const rx = new Map();
const regexOf = (v) => {
  if (!rx.has(v)) {
    let r = null;
    try {
      r = new RegExp(v);
    } catch {
      r = null;
    }
    rx.set(v, r);
  }
  return rx.get(v);
};
const matches = (tags, sel) =>
  partsOf(sel).every(([k, op, v]) => {
    const x = tags[k];
    if (!op) return x != null;
    if (op === '=') return x === v;
    if (op === '!=') return x !== v;
    const r = regexOf(v);
    return x != null && !!r && r.test(x);
  });

const r5 = (v) => Math.round(v * 1e5) / 1e5;
/** The asked keys that exist, in the order of matching: your kinds, then MORE, then the defaults. */
const ORDER = [...MORE_KEYS, ...KEYS];
const known = (keys, own = []) => {
  const ks = keys ?? [];
  return [...(own ?? []).map((c) => c.key), ...ORDER].filter((k) => ks.includes(k));
};

/** The kind of an OSM element among `keys` (default the 16), or null. The first fitting kind wins. */
export function kindOf(tags = {}, keys = KEYS, own = []) {
  for (const k of known(keys, own)) if (catOf(k, own).tags.some((s) => matches(tags, s))) return k;
  return null;
}
const lines = (ks, own, area) => ks.flatMap((k) => catOf(k, own).tags.map((s) => `  nwr${s}${typeof area === 'function' ? area(catOf(k, own)) : area};`));
const wrap = (ls) => `[out:json][timeout:${TIMEOUT_S}];\n(\n${ls.join('\n')}\n);\nout center tags ${MAX_PLACES * 3};`;

/** Around a point: every switched-on kind within radiusKm. '' without kinds or point. own: your kinds. */
export function aroundQuery(keys, center, radiusKm = DEFAULTS.radiusKm, own = []) {
  const ks = known(keys, own);
  if (!ks.length || !Number.isFinite(center?.lat) || !Number.isFinite(center?.lon)) return '';
  const a = `(around:${Math.round(radiusKm * 1000)},${r5(center.lat)},${r5(center.lon)})`;
  return wrap(lines(ks, own, a));
}

/** The diagonal of a map area in km. */
export const boundsKm = (b) => distKm({ lat: b.s, lon: b.w }, { lat: b.n, lon: b.e });
const okBounds = (b) => [b?.s, b?.w, b?.n, b?.e].every(Number.isFinite) && b.n > b.s && b.e > b.w;

/** The visible map area { s, w, n, e }. '' without kinds, without an area or when it is too big. */
export function bboxQuery(keys, b, own = []) {
  const ks = known(keys, own);
  if (!ks.length || !okBounds(b) || boundsKm(b) > MAX_VIEW_KM) return '';
  return wrap(lines(ks, own, `(${r5(b.s)},${r5(b.w)},${r5(b.n)},${r5(b.e)})`));
}

/** A corridor along the route line [[lat, lon]]: each kind with its own width. '' without a line. */
export function corridorQuery(keys, line, { max = CORRIDOR_PTS, own = [] } = {}) {
  const ks = known(keys, own);
  const pts = thinLine(line, max);
  if (!ks.length || pts.length < 2) return '';
  const coords = pts.map(([lat, lon]) => `${r5(lat)},${r5(lon)}`).join(',');
  return wrap(lines(ks, own, (c) => `(around:${c.widthM},${coords})`));
}

/* ---------- distances ---------- */

/** The line as km points (race.js lineKm), [] without a usable line. */
export const ptsOf = (line) => (Array.isArray(line) && line.length >= 2 ? lineKm({ line, km: 0 }) : []);

/**
 * How far a place is: { km (straight from `from`, or null), along (km along the route from `from`, ahead
 * positive; null without line or from), offKm (beside the route; null without line), atKm (where along) }.
 */
export function distanceOf(place, from, pts = []) {
  const km = from && Number.isFinite(from.lat) ? Math.round(distKm(from, place) * 100) / 100 : null;
  if (!pts.length) return { km, along: null, offKm: null, atKm: null };
  const s = snap(pts, place);
  const me = from && Number.isFinite(from.lat) ? snap(pts, from) : null;
  return { km, along: me ? Math.round((s.km - me.km) * 10) / 10 : null, offKm: s.offKm, atKm: s.km };
}

/** The places with their distances (d), nearest first (along the route: the next ahead first, then behind). */
export function withDistance(list = [], from = null, line = null) {
  const pts = ptsOf(line);
  const out = list.map((p) => ({ ...p, d: distanceOf(p, from, pts) }));
  const key = (p) => {
    if (p.d.along != null) return p.d.along >= 0 ? p.d.along : 1e6 - p.d.along;
    if (p.d.km != null) return p.d.km;
    return p.d.atKm ?? 0;
  };
  return out.sort((a, b) => key(a) - key(b) || a.id.localeCompare(b.id));
}

/* ---------- parsing ---------- */

const str = (v) => String(v ?? '').trim();

/**
 * Overpass JSON → [{ id, kind, name, lat, lon, hours, phone, website, sub, fee, access }], only the
 * `keys` kinds, without private or closed places, deduped (the same element; or the same kind and
 * name within 30 m). `near(p)` gives the order for the limit: the nearest `max` are kept. A place
 * that fits more asked kinds keeps the others in `also` (a bakery is also «Shopping»). own: your kinds.
 * → { list, cut }
 */
export function parsePlaces(json, keys = KEYS, { near = null, max = MAX_PLACES, own = [] } = {}) {
  const ks = known(keys, own);
  const els = Array.isArray(json?.elements) ? json.elements : [];
  const seen = new Set();
  const out = [];
  for (const el of els) {
    if (!['node', 'way', 'relation'].includes(el?.type)) continue;
    const lat = Number(el.lat ?? el.center?.lat);
    const lon = Number(el.lon ?? el.center?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const tags = el.tags ?? {};
    if (['private', 'no'].includes(tags.access)) continue;
    const kinds = ks.filter((k) => catOf(k, own).tags.some((s) => matches(tags, s)));
    const kind = kinds[0];
    if (!kind) continue;
    const id = `${el.type}/${el.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const sub = str(kind === 'bike' ? tags.shop || tags.craft : tags.shop || tags.tourism || tags.amenity || tags.railway || tags.man_made || tags.healthcare || tags.leisure || tags.highway);
    out.push({
      id,
      kind,
      name: str(tags.name || tags.brand || tags.operator),
      lat: r5(lat),
      lon: r5(lon),
      hours: str(tags.opening_hours),
      phone: str(tags.phone || tags['contact:phone']),
      website: str(tags.website || tags['contact:website']),
      sub,
      fee: str(tags.fee),
      access: str(tags.access),
      ele: Number.isFinite(parseFloat(tags.ele)) ? Math.round(parseFloat(tags.ele)) : null,
      n: Object.keys(tags).length,
      ...(kinds.length > 1 ? { also: kinds.slice(1) } : {}),
    });
  }
  const kept = [];
  for (const p of out) {
    const at = kept.findIndex((q) => q.kind === p.kind && q.name && q.name === p.name && distKm(q, p) < 0.03);
    if (at < 0) kept.push(p);
    else if (p.n > kept[at].n) kept[at] = p;
  }
  const order = near ? (a, b) => near(a) - near(b) || a.id.localeCompare(b.id) : (a, b) => a.id.localeCompare(b.id);
  kept.sort(order);
  return { list: kept.slice(0, max).map(({ n, ...p }) => p), cut: kept.length > max };
}

/* ---------- cache rules ---------- */

/** The cache key of a search: around / here one slot each, along the route one per trip. */
export const cacheKeyOf = (mode, tripId = '') => `${CACHE_PREFIX}${mode === 'route' ? `route:${tripId || 'free'}` : mode}`;

/** All asked kinds are in the kept answer (your kinds with the same tags as then). */
const covers = (rec, keys, own = []) => known(keys, own).every((k) => (rec?.keys ?? []).includes(k) && (!k.startsWith(OWN_CAT_PREFIX) || rec?.sigs?.[k] === sigOf(catOf(k, own))));
/** The selector lines of the asked own kinds (kept with an answer). */
const sigsOf = (keys, own = []) => Object.fromEntries(known(keys, own).filter((k) => k.startsWith(OWN_CAT_PREFIX)).map((k) => [k, sigOf(catOf(k, own))]));
const inside = (outer, b) => okBounds(outer) && okBounds(b) && outer.s <= b.s && outer.w <= b.w && outer.n >= b.n && outer.e >= b.e;

/**
 * Is a kept answer still good for this search? rec: { at (ms), keys, center, radiusKm, bounds, hash }.
 * - route: same line (hash), all kinds asked; kept until «Load again» (any age).
 * - around: younger than 24 h, all kinds, its radius at least this one, moved less than a quarter of it.
 * - here: younger than 24 h, all kinds, its area contains this one.
 * stale = true: only the age is wrong (good offline).
 */
export function fresh(rec, q, now = Date.now(), { stale = false } = {}) {
  if (!rec || !Array.isArray(rec.list) || !covers(rec, q.keys, q.own)) return false;
  const young = stale || now - rec.at < DAY_MS;
  if (q.mode === 'route') return rec.hash === lineHash(q.line);
  if (q.mode === 'around') return young && rec.radiusKm >= q.radiusKm && !!rec.center && !!q.center && distKm(rec.center, q.center) < q.radiusKm / 4;
  if (q.mode === 'here') return young && inside(rec.bounds, q.bounds);
  return false;
}

/** The places of a kept answer that fit this search: the asked kinds, within the radius / area. */
export function fitting(rec, q) {
  const ks = known(q.keys, q.own);
  let list = (rec?.list ?? []).flatMap((p) => {
    if (ks.includes(p.kind)) return [p];
    const k = (p.also ?? []).find((x) => ks.includes(x));
    return k ? [{ ...p, kind: k }] : [];
  });
  if (q.mode === 'around' && q.center) list = list.filter((p) => distKm(q.center, p) <= q.radiusKm);
  if (q.mode === 'here' && okBounds(q.bounds)) list = list.filter((p) => p.lat >= q.bounds.s && p.lat <= q.bounds.n && p.lon >= q.bounds.w && p.lon <= q.bounds.e);
  return list;
}

/** The query text of a search, or { error: 'zoom' | 'nothing' }. */
export function queryOf(q) {
  if (!known(q.keys, q.own).length) return { error: 'nothing' };
  if (q.mode === 'around') return aroundQuery(q.keys, q.center, q.radiusKm, q.own) || { error: 'nothing' };
  if (q.mode === 'here') {
    if (okBounds(q.bounds) && boundsKm(q.bounds) > MAX_VIEW_KM) return { error: 'zoom' };
    return bboxQuery(q.keys, q.bounds, q.own) || { error: 'nothing' };
  }
  if (q.mode === 'route') return corridorQuery(q.keys, q.line, { own: q.own }) || { error: 'nothing' };
  return { error: 'nothing' };
}

const errorOf = (err, online) => {
  if (!online) return 'offline';
  return /\b(429|504|503)\b|abort/i.test(String(err?.message ?? err?.name ?? '')) ? 'busy' : 'failed';
};

/**
 * The panel's one call. q: { mode, keys, center, radiusKm, bounds, line, tripId, own (your kinds) }.
 * opts: { store ({ get, put }, e.g. db.meta), fetcher, force, now (ms), online, urls }.
 * → { list (the fitting places, not yet sorted), at (ms of the data), cut, cached (from the store),
 *     error ('offline' | 'busy' | 'failed' | 'zoom' | 'nothing' | null), stale (old data shown) }
 */
export async function loadPlaces(q, { store, fetcher, force = false, now = Date.now(), online = true, urls } = {}) {
  const key = cacheKeyOf(q.mode, q.tripId);
  let rec = null;
  try {
    rec = (await store?.get(key))?.value ?? null;
  } catch {
    rec = null;
  }
  if (!force && fresh(rec, q, now)) return { list: fitting(rec, q), at: rec.at, cut: !!rec.cut, cached: true, error: null, stale: false };
  const query = queryOf(q);
  if (typeof query !== 'string') return { list: [], at: null, cut: false, cached: false, error: query.error, stale: false };
  const old = fresh(rec, q, now, { stale: true }) ? rec : null;
  if (!online) return old ? { list: fitting(old, q), at: old.at, cut: !!old.cut, cached: true, error: 'offline', stale: true } : { list: [], at: null, cut: false, cached: false, error: 'offline', stale: false };
  try {
    const json = await fetchOverpass(query, { ...(fetcher ? { fetcher } : {}), ...(urls ? { urls } : {}), timeout: TIMEOUT_S * 1000 });
    const pts = q.mode === 'route' ? ptsOf(q.line) : [];
    const mid = q.mode === 'here' && okBounds(q.bounds) ? { lat: (q.bounds.s + q.bounds.n) / 2, lon: (q.bounds.w + q.bounds.e) / 2 } : q.center;
    const near = q.mode === 'route' ? (p) => snap(pts, p).offKm : mid ? (p) => distKm(mid, p) : null;
    const { list, cut } = parsePlaces(json, known(q.keys, q.own), { near, own: q.own });
    let value = { at: now, keys: known(q.keys, q.own), sigs: sigsOf(q.keys, q.own), list, cut, mode: q.mode };
    if (q.mode === 'around') Object.assign(value, { center: { lat: q.center.lat, lon: q.center.lon }, radiusKm: q.radiusKm });
    if (q.mode === 'here') value.bounds = { ...q.bounds };
    if (q.mode === 'route') {
      value.hash = lineHash(q.line);
      // the same route: keep the other kinds already kept (e.g. all kinds kept with the offline strip)
      if (rec?.hash === value.hash) value = mergeRoute(rec, value);
    }
    try {
      await store?.put({ key, value });
    } catch {
      /* a full store: the answer is still shown */
    }
    return { list: fitting(value, q), at: now, cut, cached: false, error: null, stale: false };
  } catch (err) {
    const e = errorOf(err, online);
    return old ? { list: fitting(old, q), at: old.at, cut: !!old.cut, cached: true, error: e, stale: true } : { list: [], at: null, cut: false, cached: false, error: e, stale: false };
  }
}

/** Two kept answers of the same route → one: the new kinds replace the old ones of those kinds. */
export function mergeRoute(old, next) {
  const ks = new Set(next.keys);
  const ids = new Set(next.list.map((p) => p.id));
  const list = [...(old?.list ?? []).filter((p) => !ks.has(p.kind) && !ids.has(p.id)), ...next.list];
  const keys = [...next.keys, ...(old?.keys ?? []).filter((k) => !ks.has(k))];
  return { ...next, keys: [...KEYS.filter((k) => keys.includes(k)), ...keys.filter((k) => !KEYS.includes(k))], sigs: { ...(old?.sigs ?? {}), ...(next.sigs ?? {}) }, list, cut: !!(old?.cut || next.cut) };
}

/* ---------- 1a · all places along the route, kept with the offline strip ---------- */

/** How many line points one chunk of the route sends, and how many points the route is thinned to. */
export const CHUNK_PTS = 30;
export const ALONG_PTS = 240;
export const MAX_ALONG = 5000;
export const CHUNK_PAUSE_MS = 1500;

/** The route line thinned to `total` points, cut into chunks of `size` points (each starts where the last ended). */
export function corridorChunks(line, { size = CHUNK_PTS, total = ALONG_PTS } = {}) {
  const pts = thinLine(line, total);
  if (pts.length < 2) return [];
  const out = [];
  for (let i = 0; i < pts.length - 1; i += size - 1) out.push(pts.slice(i, i + size));
  return out.filter((c) => c.length >= 2);
}

/**
 * Every kind along the whole route, chunk by chunk with a pause (polite to Overpass), stored as the
 * route answer of the trip (all kinds, kept until «Load again»). A chunk that fails is skipped.
 * → { count, chunks, failed, cut }
 */
export async function keepAlong(line, tripId, { store, fetcher, keys = KEYS, own = [], now = Date.now(), pauseMs = CHUNK_PAUSE_MS, onProgress = () => {}, wait = (ms) => new Promise((r) => setTimeout(r, ms)), urls } = {}) {
  const chunks = corridorChunks(line);
  const all = new Map();
  let failed = 0;
  for (let i = 0; i < chunks.length; i++) {
    if (i) await wait(pauseMs);
    try {
      const json = await fetchOverpass(corridorQuery(keys, chunks[i], { max: CHUNK_PTS, own }), { ...(fetcher ? { fetcher } : {}), ...(urls ? { urls } : {}), timeout: TIMEOUT_S * 1000 });
      for (const p of parsePlaces(json, keys, { max: Infinity, own }).list) all.set(p.id, p);
    } catch {
      failed++;
    }
    onProgress({ done: i + 1, total: chunks.length, count: all.size });
  }
  if (!chunks.length || failed === chunks.length) return { count: 0, chunks: chunks.length, failed, cut: false };
  const pts = ptsOf(line);
  const list = [...all.values()].sort((a, b) => snap(pts, a).km - snap(pts, b).km || a.id.localeCompare(b.id));
  const value = { at: now, keys: known(keys, own), sigs: sigsOf(keys, own), list: list.slice(0, MAX_ALONG), cut: list.length > MAX_ALONG, mode: 'route', hash: lineHash(line), failed };
  try {
    await store?.put({ key: cacheKeyOf('route', tripId), value });
  } catch {
    /* full: nothing kept */
  }
  return { count: value.list.length, chunks: chunks.length, failed, cut: value.cut };
}

/** How many places are kept along a trip's route (0 when none or another line). */
export async function keptAlong(store, tripId, line) {
  try {
    const v = (await store?.get(cacheKeyOf('route', tripId)))?.value;
    return v?.hash === lineHash(line) && Array.isArray(v.list) ? v.list.length : 0;
  } catch {
    return 0;
  }
}

/* ---------- 3a · detour ---------- */

/** The route's height at km of a profile [[km, m]] (linear), or null. */
export function heightAt(profile, km) {
  if (!Array.isArray(profile) || !profile.length || !Number.isFinite(km)) return null;
  if (km <= profile[0][0]) return profile[0][1];
  for (let i = 1; i < profile.length; i++) {
    const [k1, m1] = profile[i];
    const [k0, m0] = profile[i - 1];
    if (k1 >= km) return k1 > k0 ? m0 + ((m1 - m0) * (km - k0)) / (k1 - k0) : m1;
  }
  return profile.at(-1)[1];
}

/**
 * The detour to a place beside the route, there and back from the nearest route point (straight, so
 * «about»): { km, hm, atKm } or null without a route. hm: the climb up to the place when OSM knows its
 * height and the route has a profile, else 0.
 */
export function detourOf(place, pts = [], profile = null) {
  if (!pts?.length || !Number.isFinite(place?.lat)) return null;
  const s = snap(pts, place);
  const h = heightAt(profile, s.km);
  const hm = Number.isFinite(place.ele) && h != null ? Math.max(0, Math.round(place.ele - h)) : 0;
  return { km: Math.round(s.offKm * 2 * 10) / 10, hm, atKm: s.km };
}

/* ---------- 5a · share ---------- */

/** The links of a place: Google Maps (opens everywhere) and geo: (map apps). */
export const shareLinks = ({ lat, lon }) => ({
  maps: `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(5)},${lon.toFixed(5)}`,
  geo: `geo:${lat.toFixed(5)},${lon.toFixed(5)}`,
});

/** The text for one or more places: «name (kind)» and the map link, one block each. label(p) gives the kind. */
export function shareText(places = [], label = (p) => p.kind, title = '') {
  const blocks = places.map((p) => {
    const k = label(p);
    const head = p.name ? (k ? `${p.name} (${k})` : p.name) : k;
    const l = shareLinks(p);
    return `${head}\n${l.maps}`;
  });
  return [title, ...blocks].filter(Boolean).join('\n\n');
}

/** Share (the phone's own sheet) or copy the text. → 'shared' | 'copied' | 'cancelled' | 'failed' */
export async function shareOrCopy({ title = '', text }, nav = globalThis.navigator) {
  if (nav?.share) {
    try {
      await nav.share({ title, text });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await nav.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

/** Has the map area moved enough that «Search here» makes sense? (no answer, or not inside the last one) */
// a tiny shift (a resize, a late map settle) does not count: 5 % of the view may stick out
export const viewMoved = (lastBounds, bounds) => {
  if (!bounds) return false;
  if (!okBounds(lastBounds) || !okBounds(bounds)) return true;
  const dy = (lastBounds.n - lastBounds.s) * 0.05;
  const dx = (lastBounds.e - lastBounds.w) * 0.05;
  return !inside({ s: lastBounds.s - dy, w: lastBounds.w - dx, n: lastBounds.n + dy, e: lastBounds.e + dx }, bounds);
};

/** A small debounce (one query per tap, chips tapped fast give one query). */
export function debounce(fn, ms = 600) {
  let id = null;
  const d = (...a) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...a), ms);
  };
  d.cancel = () => clearTimeout(id);
  return d;
}
