/**
 * Live Navigation PR 3 (Noah 26.10.2026 «1–14, 17, 18»): the filters of «Places» (poisearch / PoiPanel).
 * Pure rules, no database. Every filter is a suggestion: all are off at the start and each one can be
 * switched off again («Reset filters»).
 *
 * The filters:
 *  1 open now / open when I get there · 2 only ahead of me (along the route) · 3 maximum detour
 *  4 reachable before dark · 5 properties (bikes welcome, drinking water, roof, free WC, card, vegetarian,
 *  socket) · 6 «Mine» (only saved places, hide places you were at) · 7 sort (distance, arrival, detour)
 *  8 saved filters (presets, poisearch prefs) · 9 maximum climb to get there · 10 rain: roof first
 *  12 only bigger shops · 13 Sundays and public holidays (openOn) · 14 quick buttons Water / Food / Sleep
 *  17 refill without shopping · 18 last chance before a long stretch without the same kind.
 * (11 the group's meeting point comes with the group map, M12.)
 *
 * The arrival is a guess: the km to the place (along the route when there is one, else straight × 1.3)
 * at the speed in the filter (standard 18 km/h), plus half the detour.
 */
import { openAt, parseHours } from '../race/outside.js';
import { holidayOn } from '../woche/kalender.js';
import { localDay } from '../localday.js';

/** 5 · the properties a place can have (from its OSM tags; parsePlaces keeps them in `feat`). */
export const FEATS = [
  { key: 'bikes', name: 'Bikes welcome|poi' },
  { key: 'water', name: 'Drinking water|poi' },
  { key: 'roof', name: 'Roof|poi' },
  { key: 'freewc', name: 'Free WC|poi' },
  { key: 'card', name: 'Card payment|poi' },
  { key: 'veggie', name: 'Vegetarian|poi' },
  { key: 'socket', name: 'Socket|poi' },
];
export const FEAT_KEYS = FEATS.map((f) => f.key);

/** 14 · the quick buttons: each switches these kinds on (the others off). */
export const QUICK = [
  { key: 'water', name: 'Water|poi', kinds: ['water', 'toilet'] },
  { key: 'food', name: 'Food|poi', kinds: ['shop', 'food', 'fuel'] },
  { key: 'sleep', name: 'Sleep|poi', kinds: ['sleep', 'camp', 'shelter'] },
];

export const SORTS = ['dist', 'arrive', 'detour'];
export const OPENS = ['any', 'now', 'arrive'];
export const DETOURS = [1, 2, 5];
export const CLIMBS = [50, 100, 200];
export const SPEED = { min: 6, max: 40, std: 18 };
/** 18 · a stretch this long without the same kind makes the place before it the «last chance». */
export const LAST_GAP_KM = 20;
export const ROAD_FACTOR = 1.3;
export const MAX_PRESETS = 12;
export const MAX_VISITED = 500;

/** The filter with nothing switched on. */
export const NO_FILTER = Object.freeze({
  open: 'any',
  unknown: true,
  ahead: false,
  detourKm: null,
  dark: false,
  feats: [],
  starred: false,
  hideVisited: false,
  sort: 'dist',
  climbM: null,
  rain: false,
  big: false,
  refill: false,
  last: false,
  speed: SPEED.std,
});

const bool = (v) => v === true;
const oneOf = (v, list, d) => (list.includes(v) ? v : d);

/** A kept or typed filter, cleaned (anything unknown back to «off»). */
export function normFilter(v) {
  const f = v && typeof v === 'object' ? v : {};
  const speed = Number(f.speed);
  return {
    open: oneOf(f.open, OPENS, 'any'),
    unknown: f.unknown !== false,
    ahead: bool(f.ahead),
    detourKm: DETOURS.includes(Number(f.detourKm)) ? Number(f.detourKm) : null,
    dark: bool(f.dark),
    feats: Array.isArray(f.feats) ? [...new Set(f.feats.filter((k) => FEAT_KEYS.includes(k)))] : [],
    starred: bool(f.starred),
    hideVisited: bool(f.hideVisited),
    sort: oneOf(f.sort, SORTS, 'dist'),
    climbM: CLIMBS.includes(Number(f.climbM)) ? Number(f.climbM) : null,
    rain: bool(f.rain),
    big: bool(f.big),
    refill: bool(f.refill),
    last: bool(f.last),
    speed: Number.isFinite(speed) && speed >= SPEED.min && speed <= SPEED.max ? Math.round(speed) : SPEED.std,
  };
}

/** How many filters are switched on (the speed and the sort by distance do not count). */
export function filterCount(f) {
  const n = normFilter(f);
  return [n.open !== 'any', n.ahead, n.detourKm != null, n.dark, n.starred, n.hideVisited, n.sort !== 'dist', n.climbM != null, n.rain, n.big, n.refill, n.last].filter(Boolean).length + n.feats.length;
}

/** 8 · saved filters: [{ id, name, filter }] (your names, never through t()). */
export function presetsOf(v) {
  const out = [];
  for (const p of Array.isArray(v) ? v : []) {
    const name = String(p?.name ?? '')
      .trim()
      .slice(0, 40);
    const id = String(p?.id ?? '').trim();
    if (!name || !id || out.some((q) => q.id === id)) continue;
    out.push({ id, name, filter: normFilter(p.filter) });
    if (out.length >= MAX_PRESETS) break;
  }
  return out;
}
/** Keep the filter under a name (the same name: replaced). → presets */
export function putPreset(presets, name, filter, id = `pf-${Date.now().toString(36)}`) {
  const list = presetsOf(presets);
  const n = String(name ?? '')
    .trim()
    .slice(0, 40);
  if (!n) return list;
  const same = list.find((p) => p.name.toLowerCase() === n.toLowerCase());
  if (same) return list.map((p) => (p.id === same.id ? { ...p, filter: normFilter(filter) } : p));
  if (list.length >= MAX_PRESETS) return list;
  return [...list, { id, name: n, filter: normFilter(filter) }];
}
export const renamePreset = (presets, id, name) => {
  const n = String(name ?? '')
    .trim()
    .slice(0, 40);
  return presetsOf(presets).map((p) => (p.id === id && n ? { ...p, name: n } : p));
};
export const removePreset = (presets, id) => presetsOf(presets).filter((p) => p.id !== id);
export const movePreset = (presets, from, to) => {
  const list = presetsOf(presets);
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const [x] = list.splice(from, 1);
  list.splice(to, 0, x);
  return list;
};

/** 6 · the places you were at (ids), newest last. */
export const visitedOf = (v) => (Array.isArray(v) ? [...new Set(v.map(String).filter(Boolean))].slice(-MAX_VISITED) : []);
export const toggleVisited = (list, id) => {
  const v = visitedOf(list);
  return v.includes(String(id)) ? v.filter((x) => x !== String(id)) : visitedOf([...v, String(id)]);
};

/* ---------- from the OSM tags ---------- */

const yes = (v) => ['yes', 'designated', 'only'].includes(String(v ?? '').toLowerCase());
const BIG = /^(supermarket|department_store|wholesale|mall|hypermarket)$/;
const ROOF_TOURISM = /^(hotel|guest_house|hostel|motel|alpine_hut|chalet|apartment|wilderness_hut)$/;
const ROOF_AMENITY = /^(shelter|restaurant|cafe|fast_food|waiting_room|pharmacy|bank|post_office|library|bus_station)$/;

/** 5 / 12 / 17 · what the tags say: { feat: [keys], big, refill }. */
export function featsOf(tags = {}) {
  const k = Object.keys(tags);
  const has = (re) => k.some((x) => re.test(x));
  const feat = [];
  if (yes(tags.bicycle) || has(/^service:bicycle:/) || tags.amenity === 'bicycle_parking' || yes(tags['bicycle_parking'])) feat.push('bikes');
  const potable = tags.drinking_water !== 'no' && (yes(tags.drinking_water) || tags.amenity === 'drinking_water' || tags.amenity === 'water_point' || (tags.man_made === 'water_tap' && tags.drinking_water !== 'no'));
  if (potable) feat.push('water');
  const roof =
    yes(tags.covered) ||
    yes(tags.shelter) ||
    yes(tags.indoor) ||
    (tags.building && tags.building !== 'no') ||
    !!tags.shop ||
    ROOF_TOURISM.test(tags.tourism ?? '') ||
    ROOF_AMENITY.test(tags.amenity ?? '') ||
    tags.railway === 'station';
  if (roof) feat.push('roof');
  if ((tags.amenity === 'toilets' && tags.fee === 'no') || (yes(tags.toilets) && tags['toilets:fee'] === 'no')) feat.push('freewc');
  if (['credit_cards', 'debit_cards', 'cards', 'maestro', 'visa', 'mastercard', 'contactless', 'twint'].some((p) => yes(tags[`payment:${p}`]))) feat.push('card');
  if (yes(tags['diet:vegetarian']) || yes(tags['diet:vegan'])) feat.push('veggie');
  if (has(/^socket:/) || yes(tags.power_supply) || tags.amenity === 'charging_station') feat.push('socket');
  const refill =
    potable || yes(tags['drinking_water:refill']) || yes(tags['refill:drinking_water']) || (tags.amenity === 'fountain' && yes(tags.drinking_water)) || (tags.amenity === 'toilets' && yes(tags.drinking_water));
  return { feat, big: BIG.test(tags.shop ?? ''), refill };
}

/* ---------- 13 · opening hours on Sundays and public holidays ---------- */

/** Is the day of `date` a public holiday (the Swiss ones, kalender.js)? → key or null */
export const holidayAt = (date) => holidayOn(localDay(date));

/**
 * Open at a moment, with public holidays: on a holiday the «PH» rule counts; without one, the place
 * keeps its Sunday hours (most shops close like on Sunday). → like openAt, plus holiday (key or null).
 */
export function openOn(hours, date) {
  const p = typeof hours === 'string' ? parseHours(hours) : hours;
  const holiday = holidayAt(date);
  if (!p || p.always || !holiday) return { ...openAt(p, date), holiday };
  const wd = (date.getDay() + 6) % 7;
  const days = p.days.map((d, i) => (i === wd ? (p.ph ?? p.days[6]) : d));
  return { ...openAt({ days }, date), holiday };
}

/* ---------- the guesses ---------- */

/** The height on the profile ([[km, m]]) at km, or null. */
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

/** The metres up along the profile from km a to km b (a < b), plus the climb off the route. */
export function climbTo(profile, a, b) {
  if (!Array.isArray(profile) || profile.length < 2 || !Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  let up = 0;
  let last = heightAt(profile, a);
  for (const [k, m] of profile) {
    if (k <= a) continue;
    if (k >= b) break;
    if (m > last) up += m - last;
    last = m;
  }
  const end = heightAt(profile, b);
  if (end > last) up += end - last;
  return Math.round(up);
}

/** The km to ride to a place (d = distanceOf): ahead along the route, else straight × 1.3; + half the detour. */
export function rideKm(d) {
  if (!d) return null;
  const off = Number.isFinite(d.offKm) ? d.offKm : 0;
  if (d.along != null && d.along >= 0) return d.along + off;
  if (d.km != null) return d.km * ROAD_FACTOR;
  return null;
}

/** When you get there (ms) at speed km/h from now, or null. */
export function arrivalOf(d, speed = SPEED.std, now = Date.now()) {
  const km = rideKm(d);
  return km == null ? null : now + (km / Math.max(1, speed)) * 36e5;
}

/**
 * 18 · the places ahead after which the same kind does not come again for gapKm (or not before the end
 * of the route, when that is further than gapKm). Needs d.along and d.atKm. → Set of ids
 */
export function lastChances(places = [], endKm = null, gapKm = LAST_GAP_KM) {
  const ids = new Set();
  const byCat = new Map();
  for (const p of places) {
    if (p?.d?.along == null || p.d.along < 0 || !Number.isFinite(p.d.atKm)) continue;
    const c = p.cat ?? p.kind;
    if (!byCat.has(c)) byCat.set(c, []);
    byCat.get(c).push(p);
  }
  for (const list of byCat.values()) {
    list.sort((a, b) => a.d.atKm - b.d.atKm);
    list.forEach((p, i) => {
      const next = list[i + 1];
      const gap = next ? next.d.atKm - p.d.atKm : Number.isFinite(endKm) ? endKm - p.d.atKm : 0;
      if (gap > gapKm) ids.add(p.id);
    });
  }
  return ids;
}

/**
 * Filter and sort the places (each with d = distanceOf, cat; as PoiPanel shows them).
 * ctx: { now (Date), starred: [ids], visited: [ids], profile, myKm (where you are along the route),
 * endKm (the route's length), sun: { set (ms) } | null, onRoute (there is a route) }.
 * → [{ ...place, eta (ms | null), detourKm, climbM, open (openOn at the moment that counts), last }]
 */
export function applyFilter(places = [], filter = NO_FILTER, ctx = {}) {
  const f = normFilter(filter);
  const now = ctx.now ?? new Date();
  const starred = new Set((ctx.starred ?? []).map(String));
  const visited = new Set((ctx.visited ?? []).map(String));
  const last = lastChances(places, ctx.endKm);
  const rows = places.map((p) => {
    const eta = arrivalOf(p.d, f.speed, now.getTime());
    const detourKm = Number.isFinite(p.d?.offKm) ? Math.round(p.d.offKm * 2 * 10) / 10 : null;
    const onRoad = ctx.profile && Number.isFinite(p.d?.atKm) && Number.isFinite(ctx.myKm) ? climbTo(ctx.profile, ctx.myKm, p.d.atKm) : 0;
    const h = Number.isFinite(p.d?.atKm) ? heightAt(ctx.profile, p.d.atKm) : null;
    const off = Number.isFinite(p.ele) && h != null ? Math.max(0, Math.round(p.ele - h)) : 0;
    const at = f.open === 'arrive' && eta != null ? new Date(eta) : now;
    return {
      ...p,
      eta,
      detourKm,
      climbM: onRoad + off,
      open: openOn(p.hours, at),
      last: last.has(p.id),
    };
  });
  const keep = rows.filter((p) => {
    if (f.open !== 'any') {
      if (p.open.open === false) return false;
      if (p.open.open == null && !f.unknown) return false;
    }
    if (f.ahead && ctx.onRoute && !(p.d?.along != null && p.d.along >= 0)) return false;
    if (f.detourKm != null && p.detourKm != null && p.detourKm > f.detourKm) return false;
    if (f.dark && ctx.sun?.set && (p.eta == null || p.eta > ctx.sun.set)) return false;
    if (f.feats.length && !f.feats.every((k) => (p.feat ?? []).includes(k))) return false;
    if (f.starred && !starred.has(String(p.id))) return false;
    if (f.hideVisited && visited.has(String(p.id))) return false;
    if (f.climbM != null && p.climbM > f.climbM) return false;
    if (f.big && (p.cat ?? p.kind) === 'shop' && !p.big) return false;
    if (f.refill && !p.refill) return false;
    if (f.last && !p.last) return false;
    return true;
  });
  const idx = new Map(places.map((p, i) => [p.id, i]));
  const by = {
    dist: (a, b) => idx.get(a.id) - idx.get(b.id),
    arrive: (a, b) => (a.eta ?? Infinity) - (b.eta ?? Infinity) || idx.get(a.id) - idx.get(b.id),
    detour: (a, b) => (a.detourKm ?? 0) - (b.detourKm ?? 0) || idx.get(a.id) - idx.get(b.id),
  }[f.sort];
  keep.sort(by);
  if (f.rain) {
    const roof = (p) => ((p.feat ?? []).includes('roof') ? 0 : 1);
    keep.sort((a, b) => roof(a) - roof(b) || by(a, b));
  }
  return keep;
}
