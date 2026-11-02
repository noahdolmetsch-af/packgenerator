/**
 * «Faustregeln aus deinen Rückblicken» (idea D2 of «App denkt mit», Noah 02.11.2026 «3b»): the app looks at
 * your finished trips and suggests a rule for an own building block when the debriefs show a clean split: the
 * block was used on every trip with the temperature below 8 °C and never above, say. The person decides:
 * «Make it a rule» (the rule of Blocks, Undo) or «Not this one». Only a suggestion; never added by itself.
 * Pure functions, tested in tests/faustregel.test.js.
 */
import { allSets } from './sets.js';
import { debriefedTrips } from './insights.js';
import { tripFacts, METRICS } from './situation.js';
import { isInventory } from './gear.js';

/** The metrics a suggested rule may use (numbers only). */
export const RULE_METRICS = ['minC', 'maxC', 'rainPct', 'gainM', 'hours'];
/** At least this many finished trips with the block on them, and at least this many used and not used. */
export const MIN_TRIPS = 4;
export const MIN_EACH = 2;

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const round = (v, metric) => (metric === 'hours' ? Math.round(v * 2) / 2 : Math.round(v));

/** The limit between two groups so that low < limit <= high, rounded kindly; null when the groups touch. */
function between(low, high, metric) {
  if (!(low < high)) return null;
  const mid = round((low + high) / 2, metric);
  return mid > low && mid <= high ? mid : high;
}

/** A rule for a set from the trips where its items were taken: { metric, cmp, limit, used, unused, n } or null. */
export function ruleFor(rows) {
  const used = rows.filter((r) => r.used);
  const unused = rows.filter((r) => !r.used);
  if (rows.length < MIN_TRIPS || used.length < MIN_EACH || unused.length < MIN_EACH) return null;
  let best = null;
  for (const metric of RULE_METRICS) {
    const u = used.map((r) => num(r.facts[metric]));
    const n = unused.map((r) => num(r.facts[metric]));
    if (u.includes(null) || n.includes(null)) continue;
    const span = (METRICS[metric].max - METRICS[metric].min) || 1;
    for (const [cmp, lowG, highG] of [['lt', u, n], ['gte', n, u]]) {
      const limit = between(Math.max(...lowG), Math.min(...highG), metric);
      if (limit == null) continue;
      const gap = (Math.min(...highG) - Math.max(...lowG)) / span;
      if (!best || gap > best.gap) best = { metric, cmp, limit, gap };
    }
  }
  return best ? { metric: best.metric, cmp: best.cmp, limit: best.limit, used: used.length, unused: unused.length, n: rows.length } : null;
}

/**
 * The suggestions: own blocks without a rule (not temperature kits, not built in), each with the rule the
 * debriefs show. dismissed: «setKey:metric» pairs the person said no to.
 * → [{ key, name, rule: { metric, cmp, limit }, used, unused, n }]
 */
export function ruleSuggestions({ trips = [], debriefs = [], items = [], setsValue = [], dismissed = [] } = {}) {
  const finished = debriefedTrips(trips, debriefs);
  const out = [];
  for (const s of allSets(setsValue)) {
    if (s.builtIn || s.rule || typeof s.minC === 'number' || typeof s.maxC === 'number') continue;
    const ids = new Set(items.filter((i) => isInventory(i) && i.sets?.includes(s.key)).map((i) => i.id));
    if (!ids.size) continue;
    const rows = [];
    for (const { d, t } of finished) {
      const taken = (t.entries ?? []).filter((e) => ids.has(e.itemId));
      if (!taken.length) continue;
      rows.push({ facts: tripFacts(t), used: taken.some((e) => d.items?.[e.itemId] !== 'unused') });
    }
    const r = ruleFor(rows);
    if (r && !dismissed.includes(`${s.key}:${r.metric}`)) out.push({ key: s.key, name: s.name, rule: { metric: r.metric, cmp: r.cmp, limit: r.limit }, used: r.used, unused: r.unused, n: r.n });
  }
  return out;
}
