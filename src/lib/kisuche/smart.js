/**
 * «Kluge Suche» (Noah 14.10.2026 «alle 3 in einem schritt, ohne mockups»): the free search, part 1.
 * Wraps searchAll (search.js stays as it is): similar words (Regenjacke finds the Hardshell), small
 * typos («regenjake»), and short filters («material unter 200 g», «unter 5 °C», «lernpunkte regen»).
 * Part 2 and 3 use `related` and `claudeText`: the entries that fit a question, as one text.
 * Pure functions, no database.
 */
import { searchAll, fold, KIND } from '../search.js';
import { t, nameOf, num } from '../i18n.svelte.js';

/** Words that mean the same thing (lower case, as the names are written; looked up folded). */
export const SYNONYMS = [
  ['regenjacke', 'hardshell', 'regenschutz', 'rain jacket', 'raincoat'],
  ['regenhose', 'rain trousers', 'rain pants'],
  ['daunenjacke', 'puffy', 'isojacke', 'isolationsjacke', 'down jacket'],
  ['schlafsack', 'quilt', 'sleeping bag'],
  ['schlafmatte', 'matte', 'isomatte', 'sleeping mat', 'mat'],
  ['zelt', 'tent', 'biwaksack', 'bivy'],
  ['handschuhe', 'gloves', 'handschuh'],
  ['mütze', 'beanie', 'kappe', 'cap'],
  ['velo', 'fahrrad', 'bike', 'rad'],
  ['lampe', 'licht', 'light', 'stirnlampe', 'headlamp'],
  ['powerbank', 'akku', 'battery'],
  ['kocher', 'stove'],
  ['werkzeug', 'tool', 'multitool'],
  ['schlauch', 'tube'],
  ['flasche', 'trinkflasche', 'bottle'],
  ['tasche', 'bag', 'pack'],
  ['kette', 'chain'],
  ['reifen', 'pneu', 'tire', 'tyre'],
  ['trikot', 'jersey'],
  ['weste', 'gilet', 'vest'],
];
const SYN = new Map(SYNONYMS.flatMap((g) => g.map((w) => [fold(w), g.filter((x) => x !== w)])));
export const synonymsOf = (word) => SYN.get(fold(word)) ?? [];

/** The kind words that narrow the search («touren jura» finds only trips). */
const KIND_WORDS = {
  touren: 'trip', trips: 'trip',
  material: 'gear', sachen: 'gear', gear: 'gear',
  velos: 'bike', bikes: 'bike',
  notizen: 'note', notes: 'note',
  tagebuch: 'diary', diary: 'diary',
  lernpunkte: 'log', logbuch: 'log', logbook: 'log',
  vorlagen: 'template', templates: 'template',
};

const NUM = /(unter|bis|max|über|ueber|ab|min|under|below|over|above)\s*(-?\d+(?:[.,]\d+)?)\s*(kg|g|°\s*c|°|grad|c)(?=\s|$|[?!.,])/g;

/**
 * The filters a search says: { rest, kinds: Set, weight: { max?, min? }, temp: { max?, min? } }.
 * rest: the words left over (as typed). «unter 5 °C»: the item keeps you warm down to 5 °C (tempMin ≤ 5).
 */
export function parseFilters(q) {
  let s = String(q ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  const weight = {};
  const temp = {};
  s = s.replace(NUM, (m, op, n, unit) => {
    const v = Number(n.replace(',', '.'));
    const down = ['unter', 'bis', 'max', 'under', 'below'].includes(op);
    if (unit === 'kg' || unit === 'g') {
      const g = unit === 'kg' ? v * 1000 : v;
      if (down) weight.max = g;
      else weight.min = g;
    } else if (down) temp.max = v;
    else temp.min = v;
    return ' ';
  });
  const words = s.split(/\s+/).filter(Boolean);
  const kinds = new Set();
  const rest = [];
  for (const w of words) {
    if (KIND_WORDS[fold(w)]) kinds.add(KIND_WORDS[fold(w)]);
    else rest.push(w);
  }
  const filtered = Object.keys(weight).length || Object.keys(temp).length;
  // a kind word alone is a normal search («touren» finds the page «Touren»)
  if (!rest.length && !filtered) return { rest: words.join(' '), kinds: new Set(), weight, temp };
  return { rest: rest.join(' '), kinds, weight, temp };
}

/** Does the item pass the weight and temperature filters? */
export function passes(i, { weight = {}, temp = {} } = {}) {
  if (weight.max != null && !(i.weightG != null && i.weightG <= weight.max)) return false;
  if (weight.min != null && !(i.weightG != null && i.weightG >= weight.min)) return false;
  if (temp.max != null && !(i.tempMin != null && i.tempMin <= temp.max)) return false;
  if (temp.min != null && !(i.tempMax != null && i.tempMax >= temp.min)) return false;
  return true;
}

/** Edit distance, stopped early above `max`. */
export function distance(a, b, max = 2) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let low = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      low = Math.min(low, cur[j]);
    }
    if (low > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** All words in the names of the data (lower case, as written), for the typo check. */
function vocabulary({ items = [], trips = [], bikes = [], templates = [], events = [] } = {}) {
  const out = new Map();
  const add = (s) => {
    for (const w of String(s ?? '').toLowerCase().split(/[^\p{L}\p{N}]+/u)) if (w.length >= 4) out.set(fold(w), w);
  };
  for (const i of items) add(`${i.name ?? ''} ${i.nameDe ?? ''} ${i.brand ?? ''}`);
  for (const x of trips) add(x.title);
  for (const b of bikes) add(`${b.name ?? ''} ${b.model ?? ''}`);
  for (const x of templates) add(x.name);
  for (const e of events) add(e.name);
  return out;
}

/** The closest word of the data for a typo (4+ letters: 1 letter off, 8+ letters: 2), or null. */
export function closest(word, vocab) {
  const w = fold(word);
  if (w.length < 4 || vocab.has(w)) return null;
  const max = w.length >= 8 ? 2 : 1;
  let best = null;
  let bestD = max + 1;
  for (const [k, v] of vocab) {
    const d = distance(w, k, max);
    if (d < bestD) (best = v), (bestD = d);
  }
  return best;
}

/** Groups of searchAll merged (first wins, the order kept), cut again to each kind's maximum. */
function merge(lists) {
  const by = new Map();
  for (const groups of lists)
    for (const g of groups) {
      const cur = by.get(g.kind) ?? { kind: g.kind, name: g.name, all: [], seen: new Set(), extra: 0 };
      for (const r of g.rows) if (!cur.seen.has(r.id)) cur.seen.add(r.id), cur.all.push(r);
      cur.extra = Math.max(cur.extra, g.more ?? 0);
      by.set(g.kind, cur);
    }
  const order = Object.keys(KIND);
  return [...by.values()]
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
    .map((g) => ({ kind: g.kind, name: g.name, rows: g.all.slice(0, KIND[g.kind].max), more: Math.max(0, g.all.length - KIND[g.kind].max) + g.extra }));
}

/** A gear row as searchAll shows it (for a filter without words, «material unter 100 g»). */
const gearRow = (i) => ({ id: i.id, title: `${i.favorite ? '★ ' : ''}${nameOf(i)}`, sub: [i.brand, i.tempMin != null ? `${t('from {n} °C', { n: num(i.tempMin) })}` : ''].filter(Boolean).join(' · '), v: i.weightG != null ? `${num(i.weightG)} g` : '', href: `#/gear?q=${encodeURIComponent(nameOf(i))}&item=${encodeURIComponent(i.id)}` });

/**
 * The search with similar words, typos and filters: { groups, also: [words], fixed: text|null }.
 * also: the similar words searched too; fixed: the corrected search when the typed one found nothing.
 */
export function smartSearch(q, data = {}) {
  const f = parseFilters(q);
  const filtered = Object.keys(f.weight).length || Object.keys(f.temp).length;
  const items = filtered ? (data.items ?? []).filter((i) => passes(i, f)) : (data.items ?? []);
  const d = { ...data, items };
  const kinds = filtered && !f.kinds.size ? new Set(['gear']) : f.kinds;
  const keep = (groups) => (kinds.size ? groups.filter((g) => kinds.has(g.kind)) : groups);
  const words = f.rest.split(/\s+/).filter(Boolean);
  if (!words.length) {
    if (!filtered) return { groups: [], also: [], fixed: null };
    const rows = items.filter((i) => i.ownership !== 'gone').sort((a, b) => (a.weightG ?? 1e9) - (b.weightG ?? 1e9)).map(gearRow);
    const groups = rows.length ? [{ kind: 'gear', name: KIND.gear.name, rows: rows.slice(0, KIND.gear.max), more: Math.max(0, rows.length - KIND.gear.max) }] : [];
    return { groups: keep(groups), also: [], fixed: null };
  }
  const base = searchAll(f.rest, d);
  // similar words: each word swapped for each of its synonyms (one at a time)
  const also = [];
  const lists = [base];
  words.forEach((w, n) => {
    for (const s of synonymsOf(w).slice(0, 4)) {
      const r = searchAll(words.map((x, k) => (k === n ? s : x)).join(' '), d);
      if (r.some((g) => g.kind !== 'page' && g.kind !== 'action')) also.push(s), lists.push(r);
    }
  });
  let groups = keep(merge(lists));
  let fixed = null;
  if (!groups.length) {
    const vocab = vocabulary(d);
    const fix = words.map((w) => closest(w, vocab) ?? w);
    if (fix.some((w, n) => w !== words[n])) {
      const r = keep(searchAll(fix.join(' '), d));
      if (r.length) (groups = r), (fixed = fix.join(' '));
    }
  }
  return { groups, also: [...new Set(also)], fixed };
}

/* ---------- part 2 and 3: the entries that fit a question ---------- */

const STOP = new Set('was wie wo wann warum wieso welche welcher welches welchen welchem brauche brauch soll sollte kann koennte muss nehme nimm mit fuer bei ich mich mir meine meinen meinem meiner mein habe hatte hast ist sind war waren und oder der die das den dem des ein eine einen einem einer auf aus von vom zum zur im in an am als auch noch nur sehr mehr viel wieviel tage tag gibt gut genug reicht lohnt what how which where when why should do can is it the a an my for with on in at to and or of i me'.split(' '));

/** The key words of a question, with their similar words: [[word, ...synonyms]]. */
export function keywords(q) {
  const f = parseFilters(q);
  return f.rest
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}-]/gu, ''))
    .filter((w) => w.length >= 3 && !STOP.has(fold(w)))
    .map((w) => [w, ...synonymsOf(w)]);
}

const score = (keys, ...fields) => {
  const hay = fold(fields.filter(Boolean).join(' '));
  return keys.reduce((n, alts) => n + (alts.some((a) => hay.includes(fold(a))) ? 1 : 0), 0);
};
const top = (rows, max) => rows.filter((r) => r.s > 0).sort((a, b) => b.s - a.s).slice(0, max).map((r) => r.x);

/**
 * The entries that fit a question: { items, trips, learnings, events, notes }, best first.
 * Only names, weights, temperatures, dates and texts the person wrote; nothing about health.
 */
export function related(q, { items = [], trips = [], learnings = [], events = [], notes = [] } = {}) {
  const keys = keywords(q);
  const f = parseFilters(q);
  const filtered = Object.keys(f.weight).length || Object.keys(f.temp).length;
  const own = items.filter((i) => i.ownership !== 'gone' && i.ownership !== 'wishlist' && i.ownership !== 'to-buy');
  const gear = filtered ? own.filter((i) => passes(i, f)).map((x) => ({ x, s: 1 + score(keys, x.name, x.nameDe, x.brand, x.category, x.note) })) : own.map((x) => ({ x, s: score(keys, x.name, x.nameDe, x.brand, x.category, x.note) }));
  const learned = top(learnings.filter((l) => !l.archived).map((x) => ({ x, s: score(keys, x.rule, x.action, x.topic) })), 8);
  // the items a fitting learning names come along («Bei Regen die Hardshell oben» → the Hardshell)
  const picked = top(gear, 15);
  const named = new Set(learned.flatMap((l) => l.itemIds ?? []));
  for (const i of own) if (named.has(i.id) && !picked.includes(i) && picked.length < 15) picked.push(i);
  return {
    items: picked,
    trips: top(trips.map((x) => ({ x, s: score(keys, x.title, x.place?.name, x.bike) })), 5),
    learnings: learned,
    events: top(events.map((x) => ({ x, s: score(keys, x.name, x.note, x.learnings, x.result) })), 5),
    notes: top(notes.map((x) => ({ x, s: score(keys, x.text) })), 3),
  };
}

export const countRelated = (r) => r.items.length + r.trips.length + r.learnings.length + r.events.length + r.notes.length;

const clip = (s, n = 200) => {
  const v = String(s ?? '').replace(/\s+/g, ' ').trim();
  return v.length > n ? `${v.slice(0, n - 1)}…` : v;
};

/** The text for Claude (or the Chrome AI): the question, then the entries that fit, as short lines. */
export function claudeText(q, r) {
  const lines = [t('My question: {q}', { q: String(q ?? '').trim() }), '', t('From my Pack Generator app (only the entries that fit):')];
  const part = (title, rows) => rows.length && lines.push('', `${title}:`, ...rows.map((x) => `- ${x}`));
  part(t('Gear'), r.items.map((i) => [nameOf(i), i.weightG != null ? `${num(i.weightG)} g` : null, i.tempMin != null || i.tempMax != null ? `${i.tempMin ?? '…'} bis ${i.tempMax ?? '…'} °C` : null].filter(Boolean).join(' · ')));
  part(t('Trips'), r.trips.map((x) => [clip(x.title, 80), x.startDate?.slice(0, 10), x.days ? t('{n} days', { n: x.days }) : null, x.bike].filter(Boolean).join(' · ')));
  part(t('Learnings|claude'), r.learnings.map((l) => clip([l.rule, l.action].filter(Boolean).join(' · '))));
  part(t('Logbook'), r.events.map((e) => clip([e.name, e.date ?? e.dateText, e.learnings].filter(Boolean).join(' · '))));
  part(t('Notes'), r.notes.map((n) => clip(n.text)));
  if (!countRelated(r)) lines.push(t('(nothing in the app fits this question)'));
  lines.push('', t('Please answer briefly.'));
  return lines.join('\n');
}
