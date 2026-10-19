/**
 * SN3+ «Bausteine je nach Lage» (Noah 13.10.2026 «SN3e–SN3g freigegeben», answers 1a 2a 3ab 4b 5a):
 * seven built-in blocks that come as a suggestion when the trip fits: Kälte, Hitze, Pass & Höhenmeter,
 * Lange Fahrt, Ausland, Zug, Regen. They start empty; Noah fills them. Each has a rule
 * { on, metric, cmp, limit } (Pass also `alt`, the highest point), saved on the block's record in the
 * settings «sets» (sets.js), so Undo, backups and the templates keep it with the block.
 *
 * What the app knows of the trip comes only from what is already on it (tripFacts):
 *   - the weather in Planen: the lowest / highest forecast over all days of the trip (2a), else trip.wx;
 *   - the route: climbing per day, the highest point (route.profile), the riding time per day;
 *   - three fields in Planen: trip.pass (by hand, 3b), trip.country (ISO code, 4b; none = CH) and
 *     trip.arrival ('bike' | 'train' | 'car').
 * Never binding: a hit is a dashed suggestion in Packen, nothing is added by itself.
 * Pure functions, tested in tests/situation.test.js.
 */
import { rainChance } from './wardrobe.js';
import { forecastForTrip } from './weather.js';
import { ridingHours } from './route.js';
import { RAIN_LIMIT } from './rainlimit.svelte.js';

/** The seven blocks «je nach Lage», in the order of the page. */
export const SITUATION_BLOCKS = ['cold', 'heat', 'climb', 'long', 'abroad', 'train', 'rain'];
export const isSituation = (key) => SITUATION_BLOCKS.includes(key);

/**
 * v0.154.0 «Bausteine mehr» (SN3h–SN3j, Noah 14.10.2026 «SN3h–SN3j freigegeben», answers 1a 2a 3a 4b 5a):
 * nine more blocks with a rule (B7, B10, B13, B15, B20, B23–B26). They start with example parts (1a,
 * blocksmore.js) and come as a dashed suggestion, never by themselves.
 */
export const MORE_BLOCKS = ['sleepwell', 'twonights', 'descent', 'recovery', 'icy', 'swim', 'sauna', 'coldwater', 'drybag'];
/**
 * v0.154.0: the stages of a block (4b: «Kälte» one suggestion PER stage; the extensions of Kochen, Laden,
 * Erste Hilfe and Hygiene that only fit some trips work the same way). Each stage is its own small block
 * with its own rule, shown inside its parent on Bausteine and as its own suggestion in Packen.
 */
export const STAGE_OF = { coldHands: 'cold', coldLayers: 'cold', coldEvening: 'cold', cookWarm: 'cook', chargeLong: 'charge', aidWinter: 'firstaid', hygieneCare: 'hygiene' };
export const STAGE_BLOCKS = Object.keys(STAGE_OF);
/** The stages of one block, in their order. */
export const stagesOf = (key) => STAGE_BLOCKS.filter((k) => STAGE_OF[k] === key);
/** The blocks of the new group «Baden» (by hand in Planen until there is a source). */
export const BATHING_BLOCKS = ['swim', 'sauna', 'coldwater', 'drybag'];
/** Every block with a rule: the seven of SN3+, the nine new ones and the stages. */
export const RULE_BLOCKS = [...SITUATION_BLOCKS, ...MORE_BLOCKS, ...STAGE_BLOCKS];
export const hasRule = (key) => RULE_BLOCKS.includes(key);
/** v0.154.0: «Baden» in Planen, by hand (trip.bathe = ['lake', 'sauna', 'cold']). */
export const BATHE = ['lake', 'sauna', 'cold'];

/** The home country: a trip without a country is at home (4b). */
export const HOME_COUNTRY = 'CH';
/** The countries offered in Planen (ISO codes; the names come from the browser in the app's language). */
export const COUNTRIES = ['CH', 'DE', 'FR', 'IT', 'AT', 'LI', 'ES', 'NL', 'BE', 'LU', 'SI', 'HR', 'CZ', 'DK', 'GB', 'NO', 'SE', 'PL', 'PT'];
/** How you get to the start (Planen). */
export const ARRIVALS = ['bike', 'train', 'car'];

/**
 * The values a rule can look at: unit, the comparisons that make sense and where the value comes from.
 * bool: no limit (abroad, train).
 */
export const METRICS = {
  minC: { name: 'Lowest temperature', unit: '°C', min: -30, max: 45 },
  maxC: { name: 'Highest temperature', unit: '°C', min: -30, max: 45 },
  rainPct: { name: 'Rain chance', unit: '%', min: 0, max: 100 },
  gainM: { name: 'Climbing per day', unit: 'm', min: 0, max: 9000 },
  hours: { name: 'Riding time per day', unit: 'h', min: 0.5, max: 24 },
  abroad: { name: 'Trip abroad', bool: true },
  train: { name: 'Travel there by train', bool: true },
  // v0.154.0 «Bausteine mehr»
  nights: { name: 'Nights', unit: 'nights', min: 0, max: 60 },
  lossM: { name: 'Descent per day', unit: 'm', min: 0, max: 9000 },
  outdoor: { name: 'Night in a tent or bivouac', bool: true },
  sauna: { name: 'Accommodation with sauna or bath', bool: true },
  coldWater: { name: 'Water below 15 °C or winter bathing', bool: true },
  bathing: { name: 'A bathing block comes along', bool: true },
};
/** The numeric values, for the choice in the rule sheet. */
export const NUMERIC = Object.keys(METRICS).filter((k) => !METRICS[k].bool);
/** lt: below, gt: above, gte: from (at or above). */
export const CMPS = ['lt', 'gt', 'gte'];

/** The standard rules (README SN3 plus; Pass: 1'200 Hm a day or a highest point from 1'500 m, 3a). */
export const DEFAULT_RULES = {
  cold: { on: true, metric: 'minC', cmp: 'lt', limit: 5 },
  heat: { on: true, metric: 'maxC', cmp: 'gt', limit: 28 },
  climb: { on: true, metric: 'gainM', cmp: 'gte', limit: 1200, alt: 1500 },
  long: { on: true, metric: 'hours', cmp: 'gt', limit: 5 },
  abroad: { on: true, metric: 'abroad' },
  train: { on: true, metric: 'train' },
  // v0.144.0 RE (1a): this limit is the one rain limit of the whole app (rainlimit.svelte.js).
  rain: { on: true, metric: 'rainPct', cmp: 'gte', limit: RAIN_LIMIT },
  // v0.154.0 «Bausteine mehr» (README SN3h): Gut schlafen, Zwei Nächte, Abfahrt warm, Erholung danach,
  // Glatt und nass, the four of «Baden»
  sleepwell: { on: true, metric: 'outdoor' },
  twonights: { on: true, metric: 'nights', cmp: 'gte', limit: 2 },
  descent: { on: true, metric: 'lossM', cmp: 'gte', limit: 1200 },
  recovery: { on: true, metric: 'hours', cmp: 'gt', limit: 5, alt: 1500 },
  icy: { on: true, metric: 'minC', cmp: 'lt', limit: 3 },
  swim: { on: true, metric: 'maxC', cmp: 'gt', limit: 22 },
  sauna: { on: true, metric: 'sauna' },
  coldwater: { on: true, metric: 'coldWater' },
  drybag: { on: true, metric: 'bathing' },
  // the stages (4b): Kälte below 8 °C (hands and feet), below 0 °C (layers), the evening with a night;
  // Kochen when cool, Laden for more than one night without power, Erste Hilfe below 0 °C, Hygiene from 2 nights
  coldHands: { on: true, metric: 'minC', cmp: 'lt', limit: 8 },
  coldLayers: { on: true, metric: 'minC', cmp: 'lt', limit: 0 },
  coldEvening: { on: true, metric: 'minC', cmp: 'lt', limit: 10 },
  cookWarm: { on: true, metric: 'minC', cmp: 'lt', limit: 10 },
  chargeLong: { on: true, metric: 'nights', cmp: 'gte', limit: 2 },
  aidWinter: { on: true, metric: 'minC', cmp: 'lt', limit: 0 },
  hygieneCare: { on: true, metric: 'nights', cmp: 'gte', limit: 2 },
};

/**
 * v0.154.0: a fixed second condition of a block (not a limit to change): «und …». night: a night on the
 * trip; lake: «See oder Fluss» tapped in Planen (by hand); cook: cooking outdoors; outdoor: a night in a
 * tent or bivouac.
 */
export const NEED = { coldEvening: 'night', swim: 'lake', cookWarm: 'cook', chargeLong: 'outdoor' };
/** v0.154.0: a fixed «oder …» of a block: a pass (Abfahrt warm), snow (Glatt und nass). */
export const OR = { descent: 'pass', icy: 'snow' };
/** The blocks with a second limit «oder …» (alt): the highest point (Pass), the climbing a day (Erholung). */
export const ALT = { climb: { fact: 'topM', min: 0, max: 9000 }, recovery: { fact: 'gainM', min: 0, max: 9000 } };

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** One block's rule: the saved one over the standard, every field checked (a broken value falls back). */
export function ruleOf(key, saved = null) {
  const d = DEFAULT_RULES[key];
  if (!d) return null;
  const s = saved && typeof saved === 'object' ? saved : {};
  const metric = Object.hasOwn(METRICS, s.metric) && !!METRICS[s.metric].bool === !!METRICS[d.metric].bool ? s.metric : d.metric;
  const out = { on: s.on !== false, metric };
  if (METRICS[metric].bool) return out;
  out.cmp = CMPS.includes(s.cmp) ? s.cmp : d.cmp ?? 'gte';
  out.limit = fin(s.limit) ?? (metric === d.metric ? d.limit : 0);
  if (ALT[key]) out.alt = fin(s.alt) ?? d.alt;
  return out;
}

/** Is a rule the standard one? (then «Zurücksetzen» has nothing to do) */
export const isDefaultRule = (key, rule) => JSON.stringify(ruleOf(key, rule)) === JSON.stringify(ruleOf(key, null));

/** The rules of all blocks with a rule from the settings «sets» value: { cold: rule, … }. */
export function rulesOf(setsValue) {
  const list = Array.isArray(setsValue) ? setsValue : [];
  return Object.fromEntries(RULE_BLOCKS.map((k) => [k, ruleOf(k, list.find((s) => s?.key === k)?.rule)]));
}

/**
 * Store one block's rule on its record in the settings «sets» value (null: back to the standard).
 * The record keeps its name and amounts; a record left with only its key goes.
 */
export function setRule(setsValue, key, rule) {
  const list = Array.isArray(setsValue) ? setsValue : [];
  const clean = rule && !isDefaultRule(key, rule) ? ruleOf(key, rule) : null;
  const fix = (s) => {
    const { rule: _, ...rest } = s;
    return clean ? { ...rest, rule: clean } : rest;
  };
  const has = list.some((s) => s?.key === key);
  const next = has ? list.map((s) => (s?.key === key ? fix(s) : s)) : clean ? [...list, { key, rule: clean }] : list;
  return next.filter((s) => !(s?.key === key && Object.keys(s).length === 1));
}

/** Compare a value with a rule's limit. */
export function passes(value, cmp, limit) {
  if (value == null || limit == null) return false;
  return cmp === 'lt' ? value < limit : cmp === 'gt' ? value > limit : value >= limit;
}

/** The highest point of a route in m (from its elevation profile), or null. */
export function topOf(route) {
  const eles = (route?.profile ?? []).map((p) => fin(p?.[1])).filter((v) => v != null);
  return eles.length ? Math.max(...eles) : null;
}

/** The riding time per day: the hours set in Planen, else a guess from the route (route.js), else null. */
export function hoursOf(trip) {
  const h = fin(Number(trip?.hours));
  if (trip?.hours != null && h != null && h > 0) return h;
  return ridingHours(trip?.route, Math.max(1, Number(trip?.days) || 1));
}

/**
 * What the app knows of a trip for the rules:
 * { minC, maxC, rainPct, wet, gainM, topM, hours, pass, country, abroad, train }; null = unknown.
 * Temperatures (2a): the lowest min and the highest max of the forecast days on the trip; without
 * a forecast the packing weather (trip.wx) as set in Planen.
 */
export function tripFacts(trip) {
  const days = forecastForTrip(trip);
  const mins = days.map((d) => fin(d.min)).filter((v) => v != null);
  const maxs = days.map((d) => fin(d.max)).filter((v) => v != null);
  const minC = mins.length ? Math.round(Math.min(...mins)) : fin(trip?.wx?.min);
  const maxC = maxs.length ? Math.round(Math.max(...maxs)) : fin(trip?.wx?.max);
  const n = Math.max(1, Number(trip?.days) || 1);
  const gain = fin(trip?.route?.gainM);
  const loss = fin(trip?.route?.lossM) ?? lossOf(trip?.route);
  const country = String(trip?.country || HOME_COUNTRY).toUpperCase();
  const night = trip?.overnight === 'lodging' || trip?.overnight === 'outdoor';
  const bathe = Array.isArray(trip?.bathe) ? trip.bathe : [];
  return {
    minC,
    maxC,
    rainPct: rainChance(trip),
    wet: trip?.wx?.rain === 'rain' || trip?.wx?.rain === 'showers',
    gainM: gain == null ? null : Math.round(gain / n),
    topM: topOf(trip?.route),
    hours: hoursOf(trip),
    pass: trip?.pass === true,
    country,
    abroad: country !== HOME_COUNTRY,
    train: trip?.arrival === 'train',
    // v0.154.0 «Bausteine mehr»
    night,
    nights: night ? Math.max(1, n - 1) : 0,
    outdoor: trip?.overnight === 'outdoor',
    cook: trip?.overnight === 'outdoor' && !!trip?.cook,
    lossM: loss == null ? null : Math.round(loss / n),
    // snow: no snow in the forecast data yet, so a day with at least 1 mm at 0 °C or colder counts as snow
    snow: days.some((d) => fin(d.min) != null && d.min <= 0 && (fin(d.rainMm) ?? 0) >= 1),
    lake: bathe.includes('lake'),
    sauna: bathe.includes('sauna'),
    coldWater: bathe.includes('cold'),
    startDate: trip?.startDate ?? null,
    days: n,
  };
}

/** The descent of a route in m from its elevation profile (a route without lossM), or null. */
export function lossOf(route) {
  const eles = (route?.profile ?? []).map((p) => fin(p?.[1])).filter((v) => v != null);
  if (eles.length < 2) return null;
  let down = 0;
  for (let i = 1; i < eles.length; i++) if (eles[i] < eles[i - 1]) down += eles[i - 1] - eles[i];
  return Math.round(down);
}

/** Is the fixed second condition of a block met? (NEED) */
const needMet = (need, facts) => (need === 'night' ? !!facts.night : need === 'lake' ? !!facts.lake : need === 'cook' ? !!facts.cook : need === 'outdoor' ? !!facts.outdoor : true);

/**
 * Does one block's rule fit the trip? → the reason { kind: key, … } or null.
 *   cold/heat: { c }; climb: { by: 'pass' | 'top' | 'gain', m }; long: { h }; abroad: { country };
 *   train: {}; rain: { pct } (pct null: rain is forecast, the chance is unknown, as before 5a).
 * A rule switched off never fits. A rule on another value than its standard reports { value }.
 */
export function ruleHit(key, rule, facts) {
  if (!rule?.on) return null;
  // v0.154.0: a fixed «und …» (a night, the lake by hand, cooking, a night outdoors)
  if (NEED[key] && !needMet(NEED[key], facts)) return null;
  const m = rule.metric;
  if (METRICS[m]?.bool) return facts[m] ? (m === 'abroad' ? { kind: key, country: facts.country } : { kind: key }) : null;
  const v = facts[m];
  if (key === 'climb') {
    if (facts.pass) return { kind: key, by: 'pass' };
    if (rule.alt != null && facts.topM != null && facts.topM >= rule.alt) return { kind: key, by: 'top', m: facts.topM };
  }
  // v0.154.0: Abfahrt warm also with a pass, Glatt und nass also with snow, Erholung also from 1’500 m a day
  if (OR[key] === 'pass' && facts.pass) return { kind: key, by: 'pass', m: facts.lossM };
  if (OR[key] === 'snow' && facts.snow) return { kind: key, by: 'snow' };
  if (key === 'recovery' && rule.alt != null && facts.gainM != null && facts.gainM >= rule.alt && !passes(v, rule.cmp, rule.limit)) return { kind: key, by: 'gain', m: facts.gainM };
  if (passes(v, rule.cmp, rule.limit)) {
    if (m !== DEFAULT_RULES[key].metric) return { kind: key, metric: m, value: v };
    if (MORE_BLOCKS.includes(key) || STAGE_BLOCKS.includes(key)) return { kind: key, metric: m, value: v, ...(m === 'nights' ? { from: facts.startDate, days: facts.days } : {}) };
    if (key === 'cold' || key === 'heat') return { kind: key, c: v };
    if (key === 'climb') return { kind: key, by: 'gain', m: v };
    if (key === 'long') return { kind: key, h: v };
    if (key === 'rain') return { kind: key, pct: v };
    return { kind: key, metric: m, value: v };
  }
  // 5a: the rain block keeps today's way: «rain» or «showers» in Planen without a known chance.
  if (key === 'rain' && m === 'rainPct' && facts.wet && (v == null || v < rule.limit)) return { kind: key, pct: null };
  return null;
}

/** Every block «je nach Lage» that fits the trip: { cold: reason, … } (only the hits). */
export function situationHits(trip, setsValue) {
  if (!trip) return {};
  const facts = tripFacts(trip);
  const rules = rulesOf(setsValue);
  // v0.154.0: «Nasses trocken halten» follows the other bathing blocks (it has no limit of its own)
  facts.bathing = BATHING_BLOCKS.some((k) => k !== 'drybag' && ruleHit(k, rules[k], facts));
  return Object.fromEntries(RULE_BLOCKS.map((k) => [k, ruleHit(k, rules[k], facts)]).filter(([, r]) => r));
}
