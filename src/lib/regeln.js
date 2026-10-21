/**
 * Paket P3 «Warum? und Regeln» (mockups RG1–RG3, Noah 21.10.2026 «alle offenen Mockups freigegeben»):
 * how the app decides, in one place.
 *
 *   ruleCatalog   every rule the app packs by, in groups: the blocks by situation (with their limit, on/off
 *                 and whether they fit the next trip), the own block rules, the fixed rules of the packing
 *                 list, power and ski touring. Each rule says when it applies, where the value comes from and
 *                 where to change it. The numbers come from the modules that use them, never copies.
 *   filterRules   the search box of the page.
 *   toggleRule    on/off of a block rule (5a: the fixed rules only on/off; the limit stays where it lives).
 *   whyLines      the «Why?» window of a row in Pack: each reason of the row with its rule and a link.
 *
 * Pure functions (no database), tested in tests/regeln.test.js.
 */
import { t, num } from './i18n.svelte.js';
import { allSets, blockLabel } from './sets.js';
import { RULE_BLOCKS, hasRule, rulesOf, setRule, situationHits, ownRuleOf, setOwnRule, ownHits, STAGE_OF } from './situation.js';
import { ruleLine, sourceLine } from './situationtext.js';
import { RAIN_LIMIT } from './rainlimit.svelte.js';
import { packRulesOf, DAY_OFF_BLOCKS } from './packrules.svelte.js';
import { BANK_USABLE, COLD_FACTOR, COLD_C } from './power.js';
import { HALF_SHARE, QUARTER_SHARE } from './strom.js';
import { WAX_EVERY } from './ski.js';
import { DESCENT_MIN, BUFFER_MIN } from './skiday.js';
import { REFRESH_YEARS } from './skiplan.js';

/** The groups of the page, in order. */
export const RULE_GROUPS = [
  { key: 'blocks', title: 'Blocks by situation', text: 'They come as a suggestion when the trip fits. Change a limit on Blocks.' },
  { key: 'own', title: 'Your own block rules', text: 'Rules you gave your own blocks.' },
  { key: 'pack', title: 'Packing list', text: 'What comes along by itself and why.' },
  { key: 'power', title: 'Power|electric', text: 'How the power budget counts.' },
  { key: 'ski', title: 'Ski touring', text: 'What the ski tour plan works out.' },
];

const pct = (x) => Math.round(x * 100);
const BLOCK_WORD = { repair: 'Repair|block', charge: 'Charging|block' };

/** The rules of the blocks by situation (and their stages), with their state for the next trip. */
function blockRules(sets, setsValue, trip) {
  const rules = rulesOf(setsValue);
  const hits = trip ? situationHits(trip, setsValue) : {};
  const out = [];
  for (const key of RULE_BLOCKS) {
    const s = sets.find((x) => x.key === key);
    if (!s) continue; // a deleted block has no rule to show
    const parent = STAGE_OF[key] ? sets.find((x) => x.key === STAGE_OF[key]) : null;
    const r = rules[key];
    out.push({
      id: `b.${key}`,
      key,
      name: parent ? `${blockLabel(parent)} › ${blockLabel(s)}` : blockLabel(s),
      when: ruleLine(key, r),
      source: sourceLine(r.metric),
      on: r.on,
      toggle: 'block',
      active: !!hits[key],
      href: '#/blocks',
      link: 'Change on Blocks',
    });
  }
  return out;
}

/** The own blocks that carry a rule. */
function ownRules(sets, setsValue, trip) {
  const hits = trip ? ownHits(trip, setsValue) : {};
  return sets
    .filter((s) => !s.builtIn && !hasRule(s.key) && s.rule)
    .map((s) => {
      const r = ownRuleOf(s.rule);
      return { id: `o.${s.key}`, key: s.key, name: s.name, when: ruleLine('own', r), source: sourceLine(r.metric), on: r.on, toggle: 'own', active: !!hits[s.key], href: '#/blocks', link: 'Change on Blocks' };
    });
}

/** The fixed rules of the packing list (their numbers from where they live). */
function packRules(sets, packValue, rainLimit) {
  const rules = packRulesOf(packValue);
  const name = (key, fallback) => {
    const s = sets.find((x) => x.key === key);
    return s ? blockLabel(s) : t(fallback);
  };
  const light = [rules.darkBuffer ? t('In the dark, and {n} min before sunset and after sunrise', { n: rules.darkBuffer }) : t('When the ride is in the dark'), rules.lightAlways ? t('always with a night or a race') : ''].filter(Boolean).join(' · ');
  return [
    { id: 'p.firstaid', name: name('firstaid', 'First aid'), when: t('Small set on a day ride, full set with a night'), source: t('from the night in Plan; or chosen on the trip'), href: '#/blocks', link: 'Change on Blocks' },
    { id: 'p.night', name: t('Blocks of the night'), when: t('Hotel with a night in a hotel; bivouac, tent and cooking with a night outdoors'), source: t('from the night in Plan'), href: '#/blocks', link: 'Change on Blocks' },
    ...DAY_OFF_BLOCKS.map((k) => ({
      id: `p.${k}`,
      name: name(k, BLOCK_WORD[k]),
      when: rules.dayOff.includes(k) ? t('Only as a button on a day ride; by itself with a night') : t('Comes on every ride'),
      source: t('from «Tidy up the packing list»'),
      href: '#/blocks/aufraeumen',
      link: 'Tidy up the packing list',
    })),
    { id: 'p.lights', name: name('lights', 'Light'), when: light, source: t('from the start time, the riding hours and the sunset'), href: '#/blocks/aufraeumen', link: 'Tidy up the packing list' },
    { id: 'p.race', name: name('race', 'Race'), when: t('Comes on a race'), source: t('from «Race» in Plan'), href: '#/blocks', link: 'Change on Blocks' },
    { id: 'p.cold', name: t('Clothes for the cold'), when: t('A piece with «comes along below …» comes when the lowest temperature is below it'), source: t('from the forecast in Plan, over all days of the trip'), href: '#/gear', link: 'Change in Gear' },
    { id: 'p.rain', name: t('Rain gear'), when: t('From {n} % rain on the riding hours', { n: num(rainLimit) }), source: t('the limit of the block Rain'), href: '#/blocks', link: 'Change on Blocks' },
    { id: 'p.amount', name: t('Amounts by the hour'), when: t('1 per so many hours of riding, at most the maximum of the item'), source: t('from the riding hours in Plan'), href: '#/gear', link: 'Change in Gear' },
  ];
}

const powerRules = () => [
  { id: 'w.bank', name: t('Power bank'), when: t('Counts with {pct} % of its battery (the rest is lost when charging)', { pct: pct(BANK_USABLE) }), source: t('fixed value'), href: '#/gear/power', link: 'Open Power' },
  { id: 'w.cold', name: t('Cold batteries'), when: t('Below {c} °C a power bank gives {pct} % of that', { c: COLD_C, pct: pct(COLD_FACTOR) }), source: t('from the forecast in Plan'), href: '#/gear/power', link: 'Open Power' },
  { id: 'w.part', name: t('Half and a quarter charge'), when: t('Half takes {half} % of the full charging time, a quarter {quarter} %', { half: pct(HALF_SHARE), quarter: pct(QUARTER_SHARE) }), source: t('from «Charging takes» of the item'), href: '#/gear', link: 'Change in Gear' },
];

const skiRules = () => [
  { id: 's.turn', name: t('Turnaround time'), when: t('From the last train back: {down} min down and {buffer} min buffer earlier', { down: DESCENT_MIN, buffer: BUFFER_MIN }), source: t('from the last train in the ski tour plan'), href: '#/ski/plan', link: 'Open the ski tour plan' },
  { id: 's.wax', name: t('Wax the skins'), when: t('Every {m} m of climbing', { m: num(WAX_EVERY) }), source: t('from your ski days'), href: '#/ski', link: 'Open Ski touring' },
  { id: 's.course', name: t('Refresh a course'), when: t('After {n} years', { n: REFRESH_YEARS }), source: t('from your courses in the ski tour plan'), href: '#/ski/plan', link: 'Open the ski tour plan' },
];

/**
 * Every rule in its group: [{ key, title, text, rules: [{ id, name, when, source, href, link, on?, toggle?, active? }] }].
 * setsValue: the settings «sets»; packValue: the settings «pack-rules»; trip: the next trip (for «fits now»).
 */
export function ruleCatalog({ setsValue = [], packValue = null, trip = null, rainLimit = RAIN_LIMIT } = {}) {
  const sets = allSets(setsValue);
  const by = {
    blocks: blockRules(sets, setsValue, trip),
    own: ownRules(sets, setsValue, trip),
    pack: packRules(sets, packValue, rainLimit),
    power: powerRules(),
    ski: skiRules(),
  };
  return RULE_GROUPS.map((g) => ({ ...g, rules: by[g.key] })).filter((g) => g.rules.length);
}

const fold = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** The groups with only the rules that hold every word of the search (name, when, source). */
export function filterRules(groups, q) {
  const words = fold(q).split(/\s+/).filter(Boolean);
  if (!words.length) return groups;
  return groups
    .map((g) => ({ ...g, rules: g.rules.filter((r) => words.every((w) => fold(`${r.name} ${r.when} ${r.source}`).includes(w))) }))
    .filter((g) => g.rules.length);
}

/** The settings «sets» value with one rule switched on or off (the limit stays). */
export function toggleRule(setsValue, rule) {
  const list = Array.isArray(setsValue) ? setsValue : [];
  if (rule?.toggle === 'block') {
    const r = rulesOf(list)[rule.key];
    return setRule(list, rule.key, { ...r, on: !r.on });
  }
  if (rule?.toggle === 'own') {
    const r = ownRuleOf(list.find((s) => s?.key === rule.key)?.rule);
    return r ? setOwnRule(list, rule.key, { ...r, on: !r.on }) : list;
  }
  return list;
}

/**
 * The «Why?» window of one row in Pack: each reason with the rule behind it and where to change it.
 * reason: rowReasons(…)[itemId] (its `parts`); → [{ text, rule, href, link }]
 */
export function whyLines(item, reason, { setsValue = [], rainLimit = RAIN_LIMIT } = {}) {
  if (!item || !reason?.parts?.length) return [];
  const sets = allSets(setsValue);
  const rules = rulesOf(setsValue);
  const itemHref = `#/gear?item=${encodeURIComponent(item.id)}`;
  const out = [];
  for (const p of reason.parts) {
    if (p.kind === 'cold') out.push({ text: p.text, rule: t('Comes along when the lowest temperature of the trip is below {c} °C.', { c: num(item.coldBelow) }), href: itemHref, link: 'Change the limit' });
    else if (p.kind === 'rain') out.push({ text: p.text, rule: t('Rain gear comes along from {n} % rain on the riding hours.', { n: num(rainLimit) }), href: '#/blocks', link: 'Change the limit' });
    else if (p.kind === 'layer') out.push({ text: p.text, rule: t('Set on the item in Gear: when it comes along.'), href: itemHref, link: 'Change in Gear' });
    else if (p.kind === 'amount') out.push({ text: p.text, rule: t('The amount follows the riding time: 1 per {n} h.', { n: num(item.perHours) }), href: itemHref, link: 'Change the amount' });
    else if (p.kind === 'aid') out.push({ text: p.text, rule: t('Small set on a day ride, full set with a night. You can choose it on the trip.'), href: '#/blocks', link: 'Change on Blocks' });
    else if (p.kind === 'blocks') {
      for (const key of p.keys ?? []) {
        const s = sets.find((x) => x.key === key);
        const label = s ? blockLabel(s) : key;
        const r = hasRule(key) ? rules[key] : s && !s.builtIn && s.rule ? ownRuleOf(s.rule) : null;
        out.push({ text: t('from {blocks}', { blocks: label }), rule: r ? t('The block {block} comes along: {when}.', { block: label, when: ruleLine(hasRule(key) ? key : 'own', r) }) : t('The item is in the block {block}, which this trip brings.', { block: label }), href: '#/blocks', link: 'Change on Blocks' });
      }
    }
  }
  return out;
}
