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
};

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
  if (key === 'climb') out.alt = fin(s.alt) ?? d.alt;
  return out;
}

/** Is a rule the standard one? (then «Zurücksetzen» has nothing to do) */
export const isDefaultRule = (key, rule) => JSON.stringify(ruleOf(key, rule)) === JSON.stringify(ruleOf(key, null));

/** The rules of all seven blocks from the settings «sets» value: { cold: rule, … }. */
export function rulesOf(setsValue) {
  const list = Array.isArray(setsValue) ? setsValue : [];
  return Object.fromEntries(SITUATION_BLOCKS.map((k) => [k, ruleOf(k, list.find((s) => s?.key === k)?.rule)]));
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
  const country = String(trip?.country || HOME_COUNTRY).toUpperCase();
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
  };
}

/**
 * Does one block's rule fit the trip? → the reason { kind: key, … } or null.
 *   cold/heat: { c }; climb: { by: 'pass' | 'top' | 'gain', m }; long: { h }; abroad: { country };
 *   train: {}; rain: { pct } (pct null: rain is forecast, the chance is unknown, as before 5a).
 * A rule switched off never fits. A rule on another value than its standard reports { value }.
 */
export function ruleHit(key, rule, facts) {
  if (!rule?.on) return null;
  const m = rule.metric;
  if (METRICS[m]?.bool) return facts[m] ? (m === 'abroad' ? { kind: key, country: facts.country } : { kind: key }) : null;
  const v = facts[m];
  if (key === 'climb') {
    if (facts.pass) return { kind: key, by: 'pass' };
    if (rule.alt != null && facts.topM != null && facts.topM >= rule.alt) return { kind: key, by: 'top', m: facts.topM };
  }
  if (passes(v, rule.cmp, rule.limit)) {
    if (m !== DEFAULT_RULES[key].metric) return { kind: key, metric: m, value: v };
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
  return Object.fromEntries(SITUATION_BLOCKS.map((k) => [k, ruleHit(k, rules[k], facts)]).filter(([, r]) => r));
}

/**
 * Paket H #260 «Regel-Editor» (Noah 19.10.2026 «3a»): an own block can carry its own rule too
 * («Kommt mit, wenn …»), on any value of METRICS. Stored as `rule` on the own block's record in the
 * settings «sets»; no rule = never suggested by itself. Never binding: a hit is a dashed suggestion.
 */
export const OWN_RULE = { on: true, metric: 'minC', cmp: 'lt', limit: 5 };

/** An own block's rule, every field checked; null when there is none. */
export function ownRuleOf(saved) {
  if (!saved || typeof saved !== 'object') return null;
  const metric = Object.hasOwn(METRICS, saved.metric) ? saved.metric : OWN_RULE.metric;
  const out = { on: saved.on !== false, metric };
  if (METRICS[metric].bool) return out;
  out.cmp = CMPS.includes(saved.cmp) ? saved.cmp : 'gte';
  out.limit = fin(saved.limit) ?? 0;
  return out;
}

/** Does an own rule fit? → a reason (the same shapes hitBadge knows) or null. */
export function ownHit(rule, facts) {
  if (!rule?.on) return null;
  const m = rule.metric;
  if (METRICS[m]?.bool) return facts[m] ? (m === 'abroad' ? { kind: 'abroad', country: facts.country, own: true } : { kind: m, own: true }) : null;
  return passes(facts[m], rule.cmp, rule.limit) ? { kind: 'own', metric: m, value: facts[m], own: true } : null;
}

/** Store an own block's rule (null: no rule). The record keeps its name, note and amounts. */
export function setOwnRule(setsValue, key, rule) {
  const list = Array.isArray(setsValue) ? setsValue : [];
  const clean = ownRuleOf(rule);
  return list.map((s) => {
    if (s?.key !== key) return s;
    const { rule: _, ...rest } = s;
    return clean ? { ...rest, rule: clean } : rest;
  });
}

/** Every own block with a rule that fits the trip: { 'u-…': reason }. */
export function ownHits(trip, setsValue) {
  if (!trip) return {};
  const list = (Array.isArray(setsValue) ? setsValue : []).filter((s) => s?.key && !isSituation(s.key) && s.rule && !DEFAULT_RULES[s.key]);
  if (!list.length) return {};
  const facts = tripFacts(trip);
  return Object.fromEntries(list.map((s) => [s.key, ownHit(ownRuleOf(s.rule), facts)]).filter(([, r]) => r));
}
