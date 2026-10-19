/**
 * Verpflegungsstrategie (Noah 19.10.2026 «1a 2a 3a und b 4a 5a»): how much to eat and drink on a tour or
 * a race, section by section between the places where you can buy food.
 *
 * - Your own values (settings 'fuel', in backup and sync): carbohydrates per riding hour (60 g), water per
 *   hour when it is cool and when it is hot (1 and 2 l), bottles, a stop about every n hours, start time,
 *   your products (bar 40 g …). Everything can be changed; products added, renamed, sorted and deleted.
 * - Water per hour is worked out (answer 2a): between «cool» and «hot» by the temperature when you are
 *   there, plus up to half the span for steep climbing (600 m up per hour = the whole half).
 * - Sections (answer 5a): from a food stop to the farthest usable one within your stop rhythm; a shop that
 *   is closed when you get there (night, Sunday) does not count, so the section before it says how much
 *   to buy for the whole way to the next open one.
 * - Pure functions; the page (pages/Fuel.svelte) brings the trip, the places along the route, the
 *   forecast and the opening-hours check (openAt). Names you type never go through t().
 */

export const FUEL_KEY = 'fuel';

/** The standard values: suggestions, all changeable. */
export const STANDARD = {
  carbsGh: 60,
  coolLh: 1,
  hotLh: 2,
  coolC: 15,
  hotC: 30,
  bottles: 2,
  bottleL: 0.75,
  stopH: 3,
  startHour: 8,
  view: 'grams',
};

/** The limits of each value (inputs and loading a broken setting). */
export const LIMITS = {
  carbsGh: [0, 150],
  coolLh: [0, 3],
  hotLh: [0, 4],
  coolC: [-20, 40],
  hotC: [0, 50],
  bottles: [0, 10],
  bottleL: [0.1, 3],
  stopH: [0.5, 24],
  startHour: [0, 23.5],
};

/** The standard products. std: the English name (translated); a typed name goes in name instead. */
export const STANDARD_PRODUCTS = [
  { id: 'p-bar', std: 'Bar|fuel', carbs: 40 },
  { id: 'p-gel', std: 'Gel|fuel', carbs: 25 },
  { id: 'p-drink', std: 'Sports drink, one bottle|fuel', carbs: 40 },
  { id: 'p-banana', std: 'Banana|fuel', carbs: 25 },
];

/** Which kinds of places give water and food. The places of a trip (route/pois.js) know only fountains. */
export const ROUTE_KINDS = { water: ['water'], food: [] };
/** The places of a race (Paket U, race/outside.js): shops, petrol stations, restaurants, water. */
export const RACE_KINDS = { water: ['water', 'shop', 'fuel', 'food'], food: ['shop', 'fuel', 'food'] };

const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v));
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;

/** A product's id. */
export const productId = () => `p-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** The values to work with: the setting over the standard, numbers kept in their limits. */
export function valuesOf(setting) {
  const s = setting && typeof setting === 'object' ? setting : {};
  const out = { ...STANDARD };
  for (const k of Object.keys(LIMITS)) if (fin(s[k])) out[k] = clamp(s[k], LIMITS[k]);
  if (out.hotC <= out.coolC) out.hotC = out.coolC + 1;
  out.view = s.view === 'products' ? 'products' : 'grams';
  out.products = Array.isArray(s.products)
    ? s.products.filter((p) => p && typeof p.id === 'string').map((p) => ({ ...p, carbs: fin(p.carbs) ? clamp(p.carbs, [0, 500]) : 0 }))
    : STANDARD_PRODUCTS.map((p) => ({ ...p }));
  return out;
}

/** The setting to store after changing one value (only what differs from the standard is kept apart from products). */
export function withValue(setting, key, value) {
  const s = { ...(setting ?? {}) };
  if (key === 'view') s.view = value === 'products' ? 'products' : 'grams';
  else if (key in LIMITS && fin(value)) s[key] = clamp(value, LIMITS[key]);
  return s;
}

/** The setting back to the standard values; your products stay. */
export const withStandardValues = (setting) => (setting?.products ? { products: setting.products, view: setting.view } : { view: setting?.view });

/** Water per riding hour (l): between cool and hot by the temperature, plus up to half for climbing. */
export function waterLh(values, tempC, climbMh = 0) {
  const v = values ?? STANDARD;
  const heat = fin(tempC) ? clamp01((tempC - v.coolC) / (v.hotC - v.coolC)) : clamp01((20 - v.coolC) / (v.hotC - v.coolC));
  const terrain = clamp01((fin(climbMh) ? climbMh : 0) / 600);
  return r2(v.coolLh + (v.hotLh - v.coolLh) * Math.min(1, heat + terrain / 2));
}

/**
 * Climbing up to a km from the elevation profile [[km, m]], scaled so the end gives gainM (3 m threshold
 * like route.js). Without a profile the climbing is spread evenly. → climbTo(km) in metres
 */
export function climbAlong(profile, totalKm, gainM) {
  const pts = (profile ?? []).filter((p) => Array.isArray(p) && fin(p[0]) && fin(p[1]));
  const gain = fin(gainM) ? gainM : 0;
  if (pts.length < 2) return (km) => (totalKm > 0 ? gain * clamp01(km / totalKm) : 0);
  const kms = [pts[0][0]];
  const ups = [0];
  let ref = pts[0][1];
  let up = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i][1] - ref;
    if (d >= 3) (up += d), (ref = pts[i][1]);
    else if (d <= -3) ref = pts[i][1];
    kms.push(pts[i][0]);
    ups.push(up);
  }
  const scale = up > 0 && gain > 0 ? gain / up : 1;
  const kmScale = totalKm > 0 && kms.at(-1) > 0 ? kms.at(-1) / totalKm : 1;
  return (km) => {
    const k = km * kmScale;
    if (k <= kms[0]) return 0;
    if (k >= kms.at(-1)) return ups.at(-1) * scale;
    let i = 1;
    while (kms[i] < k) i++;
    const f = (k - kms[i - 1]) / (kms[i] - kms[i - 1] || 1);
    return (ups[i - 1] + (ups[i] - ups[i - 1]) * f) * scale;
  };
}

/** Riding hours from the start to a km: km / speed + climbing / metres per hour. */
export const hoursAlong = (pace, climbTo) => (km) => km / (pace?.kmh || 16) + climbTo(km) / (pace?.climbMh || 600);

/** Clock time is riding time plus this share for short stops (eating, water, photos). */
export const BREAKS = 0.15;

/**
 * When you are at a km (ms), riding `rideH` hours a day from `startHour` on the start day; the nights
 * between are off. startMs: the start day at 00:00 local time. null without a start day.
 */
export function etaAlong({ startMs, startHour = 8, rideH = 6, hoursTo }) {
  if (!fin(startMs)) return () => null;
  const perDay = Math.max(0.5, rideH || 6);
  return (km) => {
    const h = Math.max(0, hoursTo(km));
    let d = Math.floor(h / perDay);
    if (d > 0 && h === d * perDay) d--; // arriving at the end of a day's riding stays on that day
    const inDay = (h - d * perDay) * (1 + BREAKS);
    return startMs + d * 864e5 + (startHour + inDay) * 36e5;
  };
}

/** The temperature at a moment from a trip's forecast (hourly when known, else the day's max); null = unknown. */
export function tempFromTrip(trip, ms) {
  if (!fin(ms)) return fin(trip?.wx?.max) ? trip.wx.max : null;
  const d = new Date(ms);
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const day = (trip?.forecast?.days ?? []).find((x) => x.date === date);
  const hourly = day?.hourly?.t?.[d.getHours()];
  if (fin(hourly)) return hourly;
  if (fin(day?.max)) return day.max;
  return fin(trip?.wx?.max) ? trip.wx.max : null;
}

/** Local midnight of a YYYY-MM-DD day in ms, or null. */
export function dayStartMs(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso ?? ''))) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

/**
 * The plan. → { sections: [Section], totals: { hours, carbs, waterL }, capacityL, guessedTemp, shops }
 * Section: { n, fromKm, toKm, from, to, hours, carbs, waterLh, waterL, carryL, waterStops, maxDry, temp,
 *   leaveMs, arriveMs, closed: [poi + opens], warn: ['bottles', 'long', 'closed', 'unknown', 'night', 'noshop'] }
 * from/to: the place (poi) or null for start and finish.
 * pois: [{ kind, km, name, hours }] · kinds: which kinds give water and food (ROUTE_KINDS, RACE_KINDS)
 * openAt(hours, Date) → { open: true|false|null, opens } (null: opening hours unknown everywhere).
 */
export function fuelPlan({ totalKm, gainM = 0, profile = [], pois = [], values, pace, eta = () => null, hoursTo = null, tempAt = () => null, openAt = null, kinds = ROUTE_KINDS }) {
  const v = values ?? valuesOf(null);
  const total = fin(totalKm) && totalKm > 0 ? totalKm : 0;
  const climbTo = climbAlong(profile, total, gainM);
  const hTo = hoursTo ?? hoursAlong(pace, climbTo);
  const capacityL = r2(v.bottles * v.bottleL);
  const stateOf = (p) => {
    const at = eta(p.km);
    if (!openAt || !fin(at) || !p.hours) return { open: null, opens: null, at };
    const s = openAt(p.hours, new Date(at)) ?? {};
    return { open: s.open ?? null, opens: s.opens ?? null, inDays: s.inDays ?? 0, at };
  };
  const places = (pois ?? [])
    .filter((p) => p && fin(p.km) && p.km >= 0 && p.km <= total + 0.5)
    .map((p) => ({ ...p, state: stateOf(p) }))
    .sort((a, b) => a.km - b.km);
  const waterOk = (p) => kinds.water.includes(p.kind) && (p.kind === 'water' || p.state.open !== false);
  const foodKind = (p) => kinds.food.includes(p.kind);
  const foodOk = (p) => foodKind(p) && p.state.open !== false;
  const food = places.filter(foodOk);
  const water = places.filter(waterOk);
  let guessedTemp = false;

  // the stops: from each one the farthest open food place within the stop rhythm, else the next one
  const stops = [{ km: 0, place: null }];
  let cur = 0;
  while (cur < total - 0.5) {
    const ahead = food.filter((p) => p.km > cur + 0.5 && p.km < total - 0.5);
    if (!ahead.length) break;
    const inReach = ahead.filter((p) => hTo(p.km) - hTo(cur) <= v.stopH);
    const next = inReach.length ? inReach.at(-1) : ahead[0];
    stops.push({ km: next.km, place: next });
    cur = next.km;
  }
  stops.push({ km: total, place: null });

  const sections = [];
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1];
    const b = stops[i];
    const hours = Math.max(0, hTo(b.km) - hTo(a.km));
    const climbMh = hours > 0 ? (climbTo(b.km) - climbTo(a.km)) / hours : 0;
    const leaveMs = eta(a.km);
    const arriveMs = eta(b.km);
    const mid = eta((a.km + b.km) / 2);
    let temp = tempAt(mid, (a.km + b.km) / 2);
    if (!fin(temp)) guessedTemp = true;
    const lh = waterLh(v, temp, climbMh);
    const inside = water.filter((p) => p.km > a.km + 0.05 && p.km < b.km - 0.05);
    const ends = [a.km, ...inside.map((p) => p.km), b.km];
    let maxDry = { fromKm: a.km, toKm: b.km, l: 0 };
    let carryL = 0;
    for (let k = 1; k < ends.length; k++) {
      const l = lh * Math.max(0, hTo(ends[k]) - hTo(ends[k - 1]));
      if (k === 1) carryL = l;
      if (l > maxDry.l) maxDry = { fromKm: r1(ends[k - 1]), toKm: r1(ends[k]), l };
    }
    const closed = places.filter((p) => foodKind(p) && p.state.open === false && p.km > a.km && p.km < b.km);
    const warn = [];
    if (capacityL > 0 && maxDry.l > capacityL + 0.05) warn.push('bottles');
    if (hours > v.stopH + 0.05) warn.push(stops.length === 2 ? 'noshop' : 'long');
    if (closed.length) warn.push('closed');
    if (b.place && b.place.state.open == null && openAt) warn.push('unknown');
    if (fin(leaveMs) && fin(arriveMs) && new Date(leaveMs).toDateString() !== new Date(arriveMs).toDateString()) warn.push('night');
    sections.push({
      n: i,
      fromKm: r1(a.km),
      toKm: r1(b.km),
      from: a.place,
      to: b.place,
      hours: r1(hours),
      carbs: Math.round((v.carbsGh * hours) / 5) * 5,
      waterLh: lh,
      waterL: r1(lh * hours),
      carryL: r1(carryL),
      waterStops: inside.length,
      maxDry: { ...maxDry, l: r1(maxDry.l) },
      temp: fin(temp) ? Math.round(temp) : null,
      leaveMs,
      arriveMs,
      closed: closed.map((p) => ({ ...p, opens: p.state.opens, inDays: p.state.inDays ?? 0 })),
      warn,
    });
  }
  const sum = (k) => sections.reduce((s, x) => s + x[k], 0);
  return {
    sections,
    totals: { hours: r1(sum('hours')), carbs: sections.reduce((s, x) => s + x.carbs, 0), waterL: r1(sum('waterL')) },
    capacityL,
    guessedTemp,
    shops: food.length,
    fountains: water.length,
  };
}

/**
 * Your products for an amount of carbohydrates (answer 3a): the products you use, taken in turn until
 * the amount is reached. → { items: [{ product, n }], carbs } (empty without usable products).
 */
export function packOf(carbs, products = []) {
  const use = (products ?? []).filter((p) => p && p.on !== false && fin(p.carbs) && p.carbs > 0);
  if (!use.length || !(carbs > 0)) return { items: [], carbs: 0 };
  const n = new Map(use.map((p) => [p.id, 0]));
  let got = 0;
  let k = 0;
  while (got < carbs && k < 1000) {
    const p = use[k % use.length];
    n.set(p.id, n.get(p.id) + 1);
    got += p.carbs;
    k++;
  }
  return { items: use.filter((p) => n.get(p.id) > 0).map((product) => ({ product, n: n.get(product.id) })), carbs: got };
}

/** Move a product from one place to another (arrows and drag). */
export function moveProduct(products, from, to) {
  const list = [...(products ?? [])];
  if (from < 0 || from >= list.length) return list;
  const [p] = list.splice(from, 1);
  list.splice(Math.min(Math.max(to, 0), list.length), 0, p);
  return list;
}
