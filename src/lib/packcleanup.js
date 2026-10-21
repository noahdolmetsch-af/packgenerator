/**
 * «Packliste aufräumen» (Noah 21.10.2026, answers «1b (nur ein Mini-Hinweis «Reparatur») 2 Handy, Airpods,
 * Trinkflasche, Schlüssel, Bargeld 3a 4 kalt unter 12, sehr kalt unter 8, eisig unter 4. 5a»).
 * One page (Material › Bausteine › Packliste aufräumen, #/gear/aufraeumen) that slims what comes along by itself:
 *   1 «Immer dabei» (the block Standard of the bike area): a short list in your order;
 *   2 Repair (and Charging, if you want) only as a button on a day ride (packrules dayOff);
 *   3 Light early in the morning and in the evening (darkBuffer), always with a night or a race, the head
 *     torch only then (lightExtra);
 *   4 Kälte in three steps: kalt, sehr kalt, eisig (the blocks cold, coldHands, coldLayers, each its limit).
 * The page starts with a suggestion (suggestPlan), everything changeable; «Übernehmen» writes it at once
 * (applyPlan) and offers Undo. Nothing is deleted: an item that leaves «Immer dabei» stays in Gear.
 * Pure functions, tested in tests/packcleanup.test.js. Fictional words only.
 */
import { isInventory } from './gear.js';
import { inDomain, BIKEPACKING } from './domains.js';
import { inStandard, isWorn, STANDARD } from './blocks2026.js';
import { ruleOf, setRule } from './situation.js';
import { PACK_RULES_SUGGESTED, packRulesOf } from './packrules.svelte.js';

/**
 * The suggestion for «Immer dabei», in this order (Noah's order). words: what finds your own item (lower
 * case, in name, German name, brand or model); prefer: words that make one item the better match;
 * not: words that rule an item out (a chain link is no lock).
 */
export const CORE_LINES = [
  { key: 'jacket', name: 'Jacket', words: ['jacke', 'jacket'], prefer: ['wind', 'regen', 'rain'], not: ['daune', 'down'] },
  { key: 'lock', name: 'Lock', words: ['schloss', 'lock'], prefer: ['mini', 'kabel', 'cable'], not: ['kette', 'chain', 'quad'] },
  { key: 'backpack', name: 'Backpack', words: ['rucksack', 'backpack'], prefer: ['daily', 'alltag', 'day'], not: ['koch', 'cook', 'ski'] },
  { key: 'computer', name: 'Bike computer', words: ['garmin', 'edge', 'wahoo', 'gps', 'computer'], prefer: ['edge', 'computer', 'gps'], not: ['halterung', 'mount', 'zweites', 'second', 'gurt', 'strap', 'uhr', 'watch'] },
  { key: 'money', name: 'Cash', words: ['portemonnaie', 'wallet', 'bargeld', 'cash', 'chf'], prefer: ['portemonnaie', 'wallet'], not: [] },
  { key: 'phone', name: 'Phone', words: ['handy', 'phone', 'telefon'], prefer: [], not: ['halterung', 'mount', 'zweites', 'second', 'hülle', 'case'] },
  { key: 'earbuds', name: 'Earphones', words: ['airpods', 'kopfhörer', 'headphone', 'earbud', 'earphone'], prefer: [], not: ['ladehülle', 'charging'] },
  { key: 'bottle', name: 'Water bottle', words: ['trinkflasche', 'bottle', 'bidon'], prefer: [], not: ['thermos'] },
  { key: 'keys', name: 'Keys', words: ['schlüssel', 'key'], prefer: [], not: ['schlüsselband', 'lanyard'] },
];

/** The suggestion for «kalt» (the block Kälte). */
export const COLD_LINES = [
  { key: 'neck', name: 'Buff', words: ['buff', 'schlauchtuch', 'halstuch', 'neck'], prefer: ['buff'], not: [] },
  { key: 'gloves', name: 'Gloves', words: ['handschuh', 'glove'], prefer: ['lang', 'long'], not: ['latex', 'fingerlos', 'fingerless', 'warm'] },
  { key: 'midlayer', name: 'Midlayer', words: ['midlayer', 'fleece'], prefer: ['midlayer'], not: ['hose', 'mütze', 'trousers', 'hat'] },
  { key: 'trousers', name: 'Track pants', words: ['trainerhose', 'track pants', 'jogging'], prefer: ['trainerhose'], not: ['chillig'] },
];

/** The head torch: an extra of Light (only with a night or a race). */
export const HEAD_TORCH = ['stirnlampe', 'head torch', 'headlamp', 'head lamp'];

/** Kälte in three steps: the block and its standard limit here (Noah «4»). Names for t(). */
export const COLD_STEPS = [
  { key: 'cold', name: 'Cold|step', limit: 12 },
  { key: 'coldHands', name: 'Very cold', limit: 8 },
  { key: 'coldLayers', name: 'Icy', limit: 4 },
];

const hay = (i) => [i.name, i.nameDe, i.brand, i.model].filter(Boolean).join(' ').toLowerCase();
const has = (i) => i.ownership === 'owned' || i.ownership === 'unclear';
/** Your things (owned or unclear), for the choice on the page. */
export const ownItems = (items = []) => items.filter((i) => isInventory(i) && has(i));
/** The items whose Standard this page changes: your things of the bike area (a ski-only item keeps its Standard). */
export const bikeItems = (items = []) => ownItems(items).filter((i) => inDomain(i, BIKEPACKING));
/** A chosen item outside the bike area gets it, so it comes on a bike trip. */
const withBike = (i, patch = {}) => (inDomain(i, BIKEPACKING) ? patch : { ...patch, domains: [...new Set([...(i.domains ?? []), BIKEPACKING])] });

/** The best own item for a line, or null. Standard first, then the prefer words, then the shorter name. */
export function bestFor(line, items = [], { taken = new Set(), boost = () => 0 } = {}) {
  const hits = items.filter((i) => !taken.has(i.id) && line.words.some((w) => hay(i).includes(w)) && !line.not.some((w) => hay(i).includes(w)));
  const score = (i) => boost(i) + line.prefer.filter((w) => hay(i).includes(w)).length * 10 - hay(i).length / 1000;
  return hits.sort((a, b) => score(b) - score(a))[0] ?? null;
}

/**
 * The suggestion the page starts with:
 * { std: [itemId] (in order), dayOff, darkBuffer, lightAlways, lightExtra: [itemId],
 *   cold: { cold: { limit, ids }, coldHands: {…}, coldLayers: {…} } }.
 * sets: the settings «sets» value (the rules); saved: the settings «pack-rules» value (what is set now).
 */
export function suggestPlan(items = [], sets = [], saved = null) {
  const bike = bikeItems(items);
  const own = ownItems(items);
  const inBike = (x) => (inDomain(x, BIKEPACKING) ? 5 : 0);
  const taken = new Set();
  const std = [];
  for (const line of CORE_LINES) {
    const i = bestFor(line, own, { taken, boost: (x) => (inStandard(x) && inDomain(x, BIKEPACKING) ? 100 : 0) + inBike(x) });
    if (i) (std.push(i.id), taken.add(i.id));
  }
  const now = packRulesOf(saved);
  const inSet = (key) => bike.filter((i) => i.sets?.includes(key)).map((i) => i.id);
  const lights = bike.filter((i) => i.sets?.includes('lights'));
  const extra = now.lightExtra.length ? now.lightExtra : lights.filter((i) => HEAD_TORCH.some((w) => hay(i).includes(w))).map((i) => i.id);
  const coldTaken = new Set();
  const coldIds = [...inSet('cold')];
  for (const line of COLD_LINES) {
    const i = bestFor(line, own, { taken: coldTaken, boost: (x) => (x.sets?.includes('cold') ? 100 : 0) + inBike(x) });
    if (i) (coldTaken.add(i.id), coldIds.includes(i.id) || coldIds.push(i.id));
  }
  const rules = Array.isArray(sets) ? sets : [];
  const ruleLimit = (key) => rules.find((s) => s?.key === key)?.rule?.limit;
  const cold = Object.fromEntries(
    COLD_STEPS.map((s) => [s.key, { limit: typeof ruleLimit(s.key) === 'number' && ruleLimit(s.key) !== ruleOf(s.key).limit ? ruleLimit(s.key) : s.limit, ids: s.key === 'cold' ? coldIds : inSet(s.key) }]),
  );
  return {
    std,
    dayOff: now.dayOff.length ? now.dayOff : [...PACK_RULES_SUGGESTED.dayOff],
    darkBuffer: now.darkBuffer || PACK_RULES_SUGGESTED.darkBuffer,
    lightAlways: saved ? now.lightAlways : PACK_RULES_SUGGESTED.lightAlways,
    lightExtra: extra,
    cold,
  };
}

/** What «Immer dabei» holds now (bike area), for «Kommt nicht mehr immer mit». */
export const standardNow = (items = []) => bikeItems(items).filter((i) => inStandard(i) && !isWorn(i));

/**
 * Write a plan. → { items: [changed item], sets: next «sets» value, rules: next «pack-rules» value,
 * counts: { stdIn, stdOut, cold } }. Standard leaves only items of the bike area; a chosen item outside it
 * gets the bike area. Nothing is deleted.
 */
export function applyPlan(plan, items = [], sets = [], saved = null) {
  const own = ownItems(items);
  const std = new Set(plan.std ?? []);
  const changed = new Map();
  const put = (i, patch) => changed.set(i.id, { ...(changed.get(i.id) ?? i), ...patch });
  const setsOf = (i) => changed.get(i.id)?.sets ?? i.sets ?? [];
  let stdIn = 0;
  let stdOut = 0;
  for (const i of own) {
    if (isWorn(i)) continue;
    const want = std.has(i.id);
    if (want && !(inStandard(i) && inDomain(i, BIKEPACKING))) (put(i, withBike(i, inStandard(i) ? {} : { sets: [...setsOf(i), STANDARD] })), stdIn++);
    if (!want && inStandard(i) && inDomain(i, BIKEPACKING)) {
      const patch = { sets: setsOf(i).filter((k) => k !== STANDARD) };
      if (i.role === 'standard') patch.role = null;
      if (i.always) patch.always = false;
      put(i, patch);
      stdOut++;
    }
  }
  let cold = 0;
  for (const step of COLD_STEPS) {
    const want = new Set(plan.cold?.[step.key]?.ids ?? []);
    for (const i of own) {
      const on = setsOf(i).includes(step.key);
      if (want.has(i.id) && !on) (put(i, withBike(i, { sets: [...setsOf(i), step.key] })), cold++);
      if (!want.has(i.id) && on) put(i, { sets: setsOf(i).filter((k) => k !== step.key) });
    }
  }
  for (const id of plan.lightExtra ?? []) {
    const i = own.find((x) => x.id === id);
    if (i && !setsOf(i).includes('lights')) put(i, withBike(i, { sets: [...setsOf(i), 'lights'] }));
  }
  let nextSets = Array.isArray(sets) ? sets : [];
  for (const step of COLD_STEPS) {
    const limit = Number(plan.cold?.[step.key]?.limit);
    if (!Number.isFinite(limit)) continue;
    const saved0 = nextSets.find((s) => s?.key === step.key)?.rule ?? null;
    nextSets = setRule(nextSets, step.key, { ...ruleOf(step.key, saved0), on: true, limit });
  }
  const rules = packRulesOf({ ...(saved ?? {}), dayOff: plan.dayOff, darkBuffer: plan.darkBuffer, lightAlways: plan.lightAlways, lightExtra: plan.lightExtra, stdOrder: plan.std });
  return { items: [...changed.values()], sets: nextSets, rules, counts: { stdIn, stdOut, cold } };
}
