/**
 * The Standard package (Noah 14.10.2026, thread «Persönlich und Standard», answers 1a 2 3a 4a 5,
 * step S4 of «Daten einmal bereinigen»): every base list of the app in one register, neutral, the
 * same for everyone. It is the foundation for two later steps, each with its own mockups first:
 * - «Listen und Typen» (mockups LI1–LI3): rename, add own entries, hide, reorder;
 * - the profile switch: the Standard profile and a personal one that inherits from it.
 *
 * The register copies nothing: each list is read from its one home (docs/daten.md «Eine Liste, ein
 * Ort»). What a person changes is kept apart from the Standard as overrides (settings «listOverrides»,
 * so it travels in the backup); the Standard itself never changes in the data. A change of the Standard
 * reaches a person as a suggestion «übernehmen?» (Noah 1a), see standardChanges.
 *
 * Pure functions, tested in tests/standard.test.js. lists.js puts the changes in place (so far the
 * categories, v0.134.0 «Listen und Typen»).
 */
import { STD_DOMAINS } from './domains.js';
import { STD_CATEGORIES, BAGS, SETS } from './gear.js';
import { STD_SLOTS } from './bikes.js';
import { LAYERS, ZONES } from './wardrobe.js';
import { STD_PARTS, AREAS } from './care.js';
import { READY_DEFAULT, READY_BY_DOMAIN, CHECKS_BY_DOMAIN } from './checks.js';
import { WEATHER, AMOUNT, BAGS_OK } from './debrief.js';
import { FIXED, SEED_QUESTIONS } from './flowcheck.js';
import { ARTS } from './flowmed.js';
import { FUN_IDEAS } from './flowsugg.js';
import { TODAY_OPTIONS } from './challenge.js';
import { STD_TOPICS } from './inbox.js';
import { VALUE_GROUPS } from './valuefields.js';
import { POINT_KINDS_STD } from './map/ownkinds.js';
import { BIKE_KINDS_STD } from './bikekind.js';
import { AWAY_STD } from './woche/away.js';
import { JOURNAL_Q_STD } from './tagebuch/fragen.js';
import { JOURNAL_MOODS_STD } from './tagebuch/insights.js';
import { MED_MOODS_STD } from './flowmed.js';
import { DAY_SPORTS_STD } from './tourplan/prep.js';

/** The settings record of a person's changes: { [list key]: { names, hidden, order, own, deleted, icons, areas } }. */
export const OVERRIDES_KEY = 'listOverrides';

/** Entries as { id, name } (name: the English key for t()). */
const keyed = (list) => list.map((e) => ({ id: e.key, name: e.name }));
const labelled = (list) => list.map((e) => ({ id: e.id, name: e.label }));

/** Check lists per area: one list per kind (eve, after) and area, plus the ready checks. */
function checkLists() {
  const out = [{ key: 'checks.ready.bikepacking', area: 'trips', name: 'Ready check', of: 'bikepacking', entries: () => labelled(READY_DEFAULT) }];
  for (const [domain, list] of Object.entries(READY_BY_DOMAIN)) out.push({ key: `checks.ready.${domain}`, area: 'trips', name: 'Ready check', of: domain, entries: () => labelled(list) });
  for (const [kind, byDomain] of Object.entries(CHECKS_BY_DOMAIN)) {
    for (const [domain, list] of Object.entries(byDomain)) out.push({ key: `checks.${kind}.${domain}`, area: 'trips', name: kind === 'eve' ? 'Evening before' : 'Back home', of: domain, entries: () => labelled(list) });
  }
  return out;
}

/**
 * Every base list: { key, area, name, of?, entries() }. area: the place the list belongs to (trips,
 * gear, bikes, review, active), the group on the page «Listen und Typen». entries() reads the home.
 */
export const STANDARD_LISTS = [
  { key: 'domains', area: 'trips', name: 'Sports and areas', entries: () => keyed(STD_DOMAINS) },
  ...checkLists(),
  { key: 'categories', area: 'gear', name: 'Categories', entries: () => keyed(STD_CATEGORIES) },
  { key: 'bagPlaces', area: 'gear', name: 'Default places', entries: () => keyed(BAGS) },
  { key: 'blocks', area: 'gear', name: 'Building blocks', entries: () => Object.entries(SETS).map(([id, name]) => ({ id, name })) },
  { key: 'layers', area: 'gear', name: 'Clothing layers', entries: () => keyed(LAYERS) },
  { key: 'zones', area: 'gear', name: 'Body zones', entries: () => keyed(ZONES) },
  { key: 'bikeSlots', area: 'bikes', name: 'Places on the bike', entries: () => keyed(STD_SLOTS) },
  { key: 'careParts', area: 'bikes', name: 'Care parts', entries: () => keyed(STD_PARTS) },
  { key: 'careAreas', area: 'bikes', name: 'Care areas', entries: () => keyed(AREAS) },
  // «Gruppen überall» (Noah 18.10.2026): the groups the person files things in can be renamed and deleted
  { key: 'valueGroups', area: 'bikes', name: 'Groups of the bike values', entries: () => keyed(VALUE_GROUPS) },
  { key: 'noteTopics', area: 'notes', name: 'Note topics', entries: () => keyed(STD_TOPICS) },
  { key: 'debrief.weather', area: 'review', name: 'Weather', entries: () => keyed(WEATHER) },
  { key: 'debrief.amount', area: 'review', name: 'Amount', entries: () => keyed(AMOUNT) },
  { key: 'debrief.bags', area: 'review', name: 'Bags', entries: () => keyed(BAGS_OK) },
  { key: 'dailyQuestions', area: 'active', name: 'Daily questions', entries: () => [...FIXED.map((q) => ({ id: q.key, name: q.text })), ...SEED_QUESTIONS.map((q) => ({ id: q.id, name: q.text }))] },
  { key: 'medArts', area: 'active', name: 'Kinds of meditation', entries: () => ARTS.map((a) => ({ id: a.id, name: a.name })) },
  { key: 'funIdeas', area: 'active', name: 'Ideas for rest and fun', entries: () => FUN_IDEAS.map((a) => ({ id: a.id, name: a.name })) },
  { key: 'challenges', area: 'active', name: 'Challenge ideas', entries: () => TODAY_OPTIONS.map((name) => ({ id: name, name })) },
  // «Alle Daten anpassbar» (Noah 21.10.2026 «4a»), put in place by applists.js
  { key: 'pointKinds', area: 'trips', name: 'Kinds of own map points', entries: () => POINT_KINDS_STD },
  { key: 'bikeKinds', area: 'bikes', name: 'Kinds of bike', entries: () => BIKE_KINDS_STD },
  { key: 'awayTypes', area: 'trips', name: 'Kinds of time away', entries: () => AWAY_STD },
  { key: 'journalQuestions', area: 'notes', name: 'Questions of the day (diary)', entries: () => JOURNAL_Q_STD },
  { key: 'journalMoods', area: 'notes', name: 'Moods (diary)', entries: () => JOURNAL_MOODS_STD },
  { key: 'medMoods', area: 'active', name: 'Moods after meditating', entries: () => MED_MOODS_STD },
  // Touren-Ideen 45 (Noah 26.10.2026 «2b»): the kind of each day of a trip
  { key: 'daySports', area: 'trips', name: 'Kinds of trip days', entries: () => DAY_SPORTS_STD },
];
export const STANDARD_LIST = Object.fromEntries(STANDARD_LISTS.map((l) => [l.key, l]));

/** The Standard as plain data: { [list key]: [{ id, name }] } (to remember it and compare later). */
export const standardSnapshot = () => Object.fromEntries(STANDARD_LISTS.map((l) => [l.key, l.entries()]));

const arr = (x) => (Array.isArray(x) ? x : []);

/**
 * A stored override made whole: { names: {id: name}, hidden: [id], order: [id], own: [{ id, name,
 * color?, icon? }], deleted: [id], icons: {id: icon name}, areas: {id: [area key]} }. deleted (LI answer
 * 1b): Standard entries the person removed; «Auf Standard zurücksetzen» brings them back. areas (LI3
 * «Gilt für», Noah «2b» 15.10.2026): the trip areas an entry applies to; none stored means all.
 */
export function overrideOf(value) {
  const words = (x) => (x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).filter(([, n]) => typeof n === 'string' && n.trim()).map(([id, n]) => [id, n.trim()])) : {});
  const own = arr(value?.own)
    .filter((e) => e && typeof e.id === 'string' && typeof e.name === 'string' && e.name.trim())
    .map((e) => ({ id: e.id, name: e.name.trim(), ...(typeof e.color === 'string' ? { color: e.color } : {}), ...(typeof e.icon === 'string' ? { icon: e.icon } : {}) }));
  const uniq = (list) => [...new Set(arr(list).filter((id) => typeof id === 'string'))];
  const areas = Object.fromEntries(
    Object.entries(value?.areas && typeof value.areas === 'object' ? value.areas : {})
      .map(([id, keys]) => [id, uniq(keys)])
      .filter(([, keys]) => keys.length),
  );
  return { names: words(value?.names), hidden: uniq(value?.hidden), order: uniq(value?.order), own, deleted: uniq(value?.deleted), icons: words(value?.icons), areas };
}

/** Has the person changed anything in this list? */
export const isChanged = (value) => {
  const o = overrideOf(value);
  return Object.keys(o.names).length > 0 || o.hidden.length > 0 || o.order.length > 0 || o.own.length > 0 || o.deleted.length > 0 || Object.keys(o.icons).length > 0 || Object.keys(o.areas).length > 0;
};

/**
 * A list as the person sees it: [{ id, name, std, own, renamed, hidden, icon, color, areas }]. std: the
 * Standard name (null for an own entry). Order: the person's order first, then the rest in Standard
 * order, own entries after the Standard ones. Hidden entries stay in the list (flag), so a page can
 * show them greyed out and nothing that uses them breaks; visible() leaves them out. Deleted Standard
 * entries are left out.
 */
export function applyOverrides(entries, value) {
  const o = overrideOf(value);
  const std = arr(entries).filter((e) => !o.deleted.includes(e.id));
  const all = [
    ...std.map((e) => ({ id: e.id, std: e.name, own: false })),
    ...o.own.filter((e) => !arr(entries).some((s) => s.id === e.id)).map((e) => ({ id: e.id, std: null, own: true, name: e.name, color: e.color, icon: e.icon })),
  ];
  const rank = new Map(o.order.map((id, i) => [id, i]));
  const sorted = all
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (rank.has(a.e.id) ? rank.get(a.e.id) : o.order.length + a.i) - (rank.has(b.e.id) ? rank.get(b.e.id) : o.order.length + b.i))
    .map(({ e }) => e);
  return sorted.map((e) => {
    const name = o.names[e.id] ?? e.name ?? e.std;
    return { id: e.id, name, std: e.std, own: e.own, renamed: !e.own && name !== e.std, hidden: o.hidden.includes(e.id), icon: o.icons[e.id] ?? e.icon ?? null, color: e.color ?? null, areas: o.areas[e.id] ?? null };
  });
}

/** Only the entries that are not hidden. */
export const visible = (list) => list.filter((e) => !e.hidden);

/** One list of the register with the person's changes (all overrides: the settings value). */
export function listFor(key, all = {}) {
  const l = STANDARD_LIST[key];
  return l ? applyOverrides(l.entries(), all?.[key]) : [];
}

/** Back to the Standard: the overrides without this list. */
export function resetList(all, key) {
  const { [key]: _gone, ...rest } = all ?? {};
  return rest;
}

/**
 * What changed in the Standard since a person last took it over (Noah 1a: a suggestion
 * «übernehmen?», never automatic). before/after: standardSnapshot() values.
 * → [{ list, id, kind: 'added' | 'renamed' | 'removed', name, was? }]
 */
export function standardChanges(before = {}, after = {}) {
  const out = [];
  for (const [list, now] of Object.entries(after)) {
    const old = new Map(arr(before[list]).map((e) => [e.id, e.name]));
    if (!(list in before)) continue; // a whole new list is not a change of an entry
    for (const e of now) {
      if (!old.has(e.id)) out.push({ list, id: e.id, kind: 'added', name: e.name });
      else if (old.get(e.id) !== e.name) out.push({ list, id: e.id, kind: 'renamed', name: e.name, was: old.get(e.id) });
    }
    for (const [id, name] of old) if (!now.some((e) => e.id === id)) out.push({ list, id, kind: 'removed', name });
  }
  return out;
}
