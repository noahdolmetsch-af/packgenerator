/**
 * Paket V «Alltag» (Noah 19.10.2026 «3a oder b 4a 5a», «1a»): the pure part of Ich › Alltag.
 *   - Einkauf (1113): the everyday shopping list. It is the own list «Shopping list» of Kalender › Merken
 *     (id SHOP_ID, the same list the recipes of Freie Zeit fill), with groups. A switch shows the open
 *     trip shopping list on the same page («zusammen») or leaves it at the trip («getrennt»).
 *   - Verträge und Abos (1114, under Dokumente): cost, cancellation deadline, a reminder before it
 *     (a to-do of Kalender › Merken, the app's one way to remind; nothing on Heute).
 *   - Lange nicht gesehen (1115): people the user enters with a wish interval; a quiet to-do in Merken
 *     when it is time again (no alarm), switchable.
 *   - Unterwegs im Ausland (Ideen 275, 276): emergency numbers per country (changeable), the travel
 *     insurance from the contracts, and the currency of the trip's country for the converter.
 *   - Flug morgen (Idee 277, Noah «1a»): the evening window before a trip with a flight number.
 * No database and no clock here (tests/alltag.test.js).
 */
import { addDays, addMonth } from './merken.js';

export const PREFS_KEY = 'alltag.prefs';
export const CONTRACTS_KEY = 'alltag.contracts';
export const PEOPLE_KEY = 'alltag.people';
export const SOS_KEY = 'alltag.sos';
export const ALLTAG_HASH = '#/me/alltag';

/** The pages of Ich › Alltag, in this order. */
export const PARTS = [
  { key: 'einkauf', icon: 'cart', title: 'Shopping list', sub: 'Everyday shopping with groups; recipes add to it' },
  { key: 'abos', icon: 'file', title: 'Contracts and subscriptions', sub: 'What runs, what it costs, when to cancel' },
  { key: 'menschen', icon: 'people', title: 'Not seen for a while', sub: 'A quiet reminder for people you choose' },
];
/** The part of an address: «#/me/alltag/abos» → 'abos'; the overview → ''. */
export function alltagPart(hash) {
  const m = /^#\/me\/alltag\/([a-z]+)/.exec(String(hash ?? ''));
  return m && PARTS.some((p) => p.key === m[1]) ? m[1] : '';
}

export const uid = (p) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const clean = (s, max = 120) => String(s ?? '').trim().slice(0, max);
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/* ---------- Einkauf ---------- */

/** Group ideas for an empty list (English source names; stored in the person's language when chosen). */
export const SHOP_GROUP_IDEAS = ['Fruit and vegetables', 'Bread and dairy', 'Household', 'Drugstore'];

/** The groups of the list: [{ id, name }] (clean ones only). */
export const shopGroups = (list) => (Array.isArray(list?.groups) ? list.groups.filter((g) => g?.id && clean(g.name)) : []);

/**
 * The list in sections: each group with its points (open first, ticked after), then «without a group»
 * (points with no or a deleted group). → [{ id ('' = without), name, items }]
 */
export function shopSections(list) {
  const groups = shopGroups(list);
  const ids = new Set(groups.map((g) => g.id));
  const items = list?.items ?? [];
  const order = (xs) => [...xs.filter((x) => !x.done), ...xs.filter((x) => x.done)];
  const out = groups.map((g) => ({ id: g.id, name: g.name, items: order(items.filter((x) => x.group === g.id)) }));
  out.push({ id: '', name: '', items: order(items.filter((x) => !ids.has(x.group))) });
  return out;
}

/** The list with a group renamed (empty name changes nothing). */
export const renameShopGroup = (list, id, name) => (clean(name, 40) ? { ...list, groups: shopGroups(list).map((g) => (g.id === id ? { ...g, name: clean(name, 40) } : g)) } : list);
/** The list without group `id`; its points go to group `to` ('' or null: without a group). Nothing is deleted. */
export function deleteShopGroup(list, id, to = '') {
  return { ...list, groups: shopGroups(list).filter((g) => g.id !== id), items: (list.items ?? []).map((x) => (x.group === id ? { ...x, group: to || null } : x)) };
}
export const addShopGroup = (list, name, id) => (clean(name, 40) ? { ...list, groups: [...shopGroups(list), { id, name: clean(name, 40) }] } : list);
/** Group `id` moved to place `to`. */
export function moveShopGroup(list, id, to) {
  const g = [...shopGroups(list)];
  const from = g.findIndex((x) => x.id === id);
  if (from < 0) return list;
  const [x] = g.splice(from, 1);
  g.splice(Math.max(0, Math.min(to, g.length)), 0, x);
  return { ...list, groups: g };
}
/** Point `itemId` moved to place `to` among the open points of its section (the others keep their place). */
export function moveShopItem(list, itemId, to) {
  const items = [...(list.items ?? [])];
  const it = items.find((x) => x.id === itemId);
  if (!it) return list;
  const groups = new Set(shopGroups(list).map((g) => g.id));
  const sec = (x) => (groups.has(x.group) ? x.group : '');
  const mates = items.filter((x) => sec(x) === sec(it) && !x.done && x.id !== itemId);
  mates.splice(Math.max(0, Math.min(to, mates.length)), 0, it);
  const slots = items.map((x, i) => (sec(x) === sec(it) && !x.done ? i : -1)).filter((i) => i >= 0);
  slots.forEach((slot, n) => (items[slot] = mates[n]));
  return { ...list, items };
}
/** The list without the ticked points (for «Remove ticked»). */
export const clearDone = (list) => ({ ...list, items: (list.items ?? []).filter((x) => !x.done) });

/** The list as text to send (groups as headings, open points only). names: the trip rows when together. */
export function shopListText(list, { title = '', without = '', trip = null } = {}) {
  const lines = [title];
  for (const s of shopSections(list)) {
    const open = s.items.filter((x) => !x.done);
    if (!open.length) continue;
    if (s.id || shopGroups(list).length) lines.push('', s.name || without);
    for (const x of open) lines.push(`☐ ${x.text}`);
  }
  if (trip?.rows?.length) {
    lines.push('', trip.title);
    for (const r of trip.rows.filter((x) => !x.done)) lines.push(`☐ ${r.qty > 1 ? `${r.qty} × ${r.name}` : r.name}`);
  }
  return lines.join('\n').trim();
}

/** The trip whose shopping list shows on the everyday list: the next one that has not ended, or null. */
export function tripForShopping(trips = [], today) {
  const endOf = (x) => addDays(x.startDate, Math.max(1, Number(x.days) || 1) - 1);
  return (trips ?? []).filter((x) => x?.startDate && !x.idea && !x.skipped && endOf(x) >= today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null;
}

/* ---------- Verträge und Abos ---------- */

/** How often it is paid. */
export const PERIODS = ['month', 'year'];
/** Notice periods offered (months; 0 = none). */
export const NOTICE = [0, 1, 2, 3, 6];
/** How long it runs on by itself after the end (months; 0 = it just ends). */
export const RENEW = [0, 1, 12, 24];
/** Reminder this many days before the deadline (0 = off). */
export const REMIND_DAYS = [0, 7, 14, 30, 60];
export const DEFAULT_REMIND = 14;

/** A clean contract from what was typed; an empty name gives null. */
export function newContract(f = {}, id) {
  const name = clean(f.name, 80);
  if (!name) return null;
  const cost = Math.round(Math.max(0, Number(String(f.cost ?? '').replace(',', '.')) || 0) * 100) / 100;
  return {
    id: f.id ?? id,
    name,
    cost,
    period: PERIODS.includes(f.period) ? f.period : 'month',
    end: DAY.test(f.end ?? '') ? f.end : null,
    renew: RENEW.includes(Number(f.renew)) ? Number(f.renew) : 12,
    notice: NOTICE.includes(Number(f.notice)) ? Number(f.notice) : 1,
    remind: REMIND_DAYS.includes(Number(f.remind)) ? Number(f.remind) : DEFAULT_REMIND,
    phone: clean(f.phone, 40),
    number: clean(f.number, 60),
    travel: !!f.travel,
    stopped: !!f.stopped,
    note: clean(f.note, 600),
  };
}

/** The end of the term that is still ahead (rolled on by `renew` months), or null without an end date. */
export function nextEnd(c, today) {
  if (!c?.end) return null;
  let end = c.end;
  if (c.renew > 0) for (let n = 0; end < today && n < 600; n++) end = addMonth(end, c.renew);
  return end;
}
/** The last day to cancel: the end minus the notice period; null without an end date. */
export function deadlineOf(c, today) {
  const end = nextEnd(c, today);
  if (!end) return null;
  return c.notice > 0 ? addMonth(end, -c.notice) : end;
}
/** The day of the reminder (deadline − remind days), or null (no deadline, reminder off, stopped). */
export function remindDayOf(c, today) {
  const d = deadlineOf(c, today);
  return d && c.remind > 0 && !c.stopped ? addDays(d, -c.remind) : null;
}
/** Cost per month (a yearly one /12), rounded to the Rappen. */
export const perMonth = (c) => (c?.stopped ? 0 : Math.round(((c?.period === 'year' ? c.cost / 12 : c?.cost) || 0) * 100) / 100);
/** { month, year } of all running contracts. */
export function totals(list = []) {
  const month = Math.round(list.reduce((s, c) => s + perMonth(c), 0) * 100) / 100;
  return { month, year: Math.round(list.filter((c) => !c.stopped).reduce((s, c) => s + (c.period === 'year' ? c.cost : c.cost * 12), 0) * 100) / 100 };
}
/** Days from today to a day (negative: past). */
export const daysUntil = (day, today) => Math.round((Date.parse(`${day}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 864e5);

/* ---------- Lange nicht gesehen ---------- */

export const EVERY_UNITS = ['week', 'month'];
/** A clean person; an empty name gives null. */
export function newPerson(f = {}, id) {
  const name = clean(f.name, 60);
  if (!name) return null;
  const n = Math.max(1, Math.min(52, Math.round(Number(f.n) || 2)));
  return { id: f.id ?? id, name, n, unit: EVERY_UNITS.includes(f.unit) ? f.unit : 'month', seen: DAY.test(f.seen ?? '') ? f.seen : null, off: !!f.off, note: clean(f.note, 300) };
}
/** The day it is time again: seen + interval; without a «seen» day it is due now (today). */
export const dueOf = (p, today) => (!p.seen ? today : p.unit === 'week' ? addDays(p.seen, 7 * p.n) : addMonth(p.seen, p.n));
/** Whether it is time again (due today or earlier). */
export const isDue = (p, today) => dueOf(p, today) <= today;
export const seenToday = (p, today) => ({ ...p, seen: today });

/* ---------- reminders as to-dos of Kalender › Merken ---------- */

export const SRC_CONTRACT = 'contract:';
export const SRC_PERSON = 'person:';

/**
 * The to-dos the contracts and people want: [{ src, text, due, remind, area }]. texts: { contract(c, deadline),
 * person(p) } give the words (in the person's language). People only when `peopleOn`; a person «off» never.
 */
export function wantedTodos({ contracts = [], people = [], peopleOn = true, today, texts }) {
  const out = [];
  for (const c of contracts) {
    const day = remindDayOf(c, today);
    if (!day) continue;
    out.push({ src: SRC_CONTRACT + c.id, text: texts.contract(c, deadlineOf(c, today)), due: day < today ? today : day, remind: { at: '09:00', before: 0 }, area: 'contract' });
  }
  if (peopleOn)
    for (const p of people) {
      if (p.off) continue;
      out.push({ src: SRC_PERSON + p.id, text: texts.person(p), due: dueOf(p, today), remind: null, area: 'people' });
    }
  return out;
}

/**
 * The Merken list after bringing it in line with the wanted to-dos: a wanted one is added or changed
 * (a ticked one stays ticked while its day is the same; a new day opens it again); a to-do of a contract or
 * person that is no longer wanted goes. Other to-dos stay as they are. → { todos, changed }
 */
export function syncTodos(todos = [], wanted = [], { now = new Date().toISOString(), id = (src) => `al-${src}` } = {}) {
  const ours = (x) => typeof x.src === 'string' && (x.src.startsWith(SRC_CONTRACT) || x.src.startsWith(SRC_PERSON));
  const want = new Map(wanted.map((w) => [w.src, w]));
  let changed = false;
  const next = [];
  const seen = new Set();
  for (const x of todos) {
    if (!ours(x)) {
      next.push(x);
      continue;
    }
    const w = want.get(x.src);
    if (!w || seen.has(x.src)) {
      changed = true;
      continue;
    }
    seen.add(x.src);
    const same = x.due === w.due && x.text === w.text && JSON.stringify(x.remind ?? null) === JSON.stringify(w.remind ?? null) && x.area === w.area;
    if (same) next.push(x);
    else {
      changed = true;
      next.push({ ...x, text: w.text, due: w.due, remind: w.remind, area: w.area, doneAt: x.due === w.due ? x.doneAt : null });
    }
  }
  for (const w of wanted)
    if (!seen.has(w.src)) {
      changed = true;
      next.push({ id: id(w.src), text: w.text, due: w.due, remind: w.remind, repeat: null, list: null, created: now, doneAt: null, area: w.area, src: w.src });
    }
  return { todos: next, changed };
}

/* ---------- Unterwegs im Ausland (Ideen 275, 276) ---------- */

/**
 * Emergency numbers the app starts with (public numbers; the person can change, add and delete them per
 * country). 112 works in all of Europe. label: English source text.
 */
export const SOS_START = {
  CH: [{ label: 'Emergency (Europe)', no: '112' }, { label: 'Ambulance', no: '144' }, { label: 'Police', no: '117' }, { label: 'Fire', no: '118' }, { label: 'Air rescue (Rega)', no: '1414' }],
  LI: [{ label: 'Emergency (Europe)', no: '112' }, { label: 'Ambulance', no: '144' }, { label: 'Police', no: '117' }],
  AT: [{ label: 'Emergency (Europe)', no: '112' }, { label: 'Ambulance', no: '144' }, { label: 'Police', no: '133' }, { label: 'Mountain rescue', no: '140' }],
  DE: [{ label: 'Emergency (Europe)', no: '112' }, { label: 'Police', no: '110' }],
  FR: [{ label: 'Emergency (Europe)', no: '112' }, { label: 'Ambulance', no: '15' }, { label: 'Police', no: '17' }],
  IT: [{ label: 'Emergency (Europe)', no: '112' }, { label: 'Ambulance', no: '118' }],
  GB: [{ label: 'Emergency', no: '999' }, { label: 'Emergency (Europe)', no: '112' }],
  NO: [{ label: 'Emergency (Europe)', no: '112' }, { label: 'Ambulance', no: '113' }],
};
/** The numbers for a country: the person's own ones when they changed them, else the start ones, else 112. */
export function sosOf(country, own = {}) {
  const c = String(country || 'CH').toUpperCase();
  if (Array.isArray(own?.[c])) return own[c];
  return SOS_START[c] ?? [{ label: 'Emergency (Europe)', no: '112' }];
}
/** Whether the numbers of a country are the person's own (changed). */
export const sosOwn = (country, own = {}) => Array.isArray(own?.[String(country || 'CH').toUpperCase()]);
/** A phone link for a number ('tel:+41 …' without spaces). */
export const telOf = (no) => `tel:${String(no ?? '').replace(/[^\d+*#]/g, '')}`;

const EURO = ['DE', 'FR', 'IT', 'AT', 'ES', 'NL', 'BE', 'LU', 'SI', 'HR', 'PT', 'FI', 'IE', 'GR', 'SK', 'EE', 'LV', 'LT', 'MT', 'CY'];
const CURRENCY = { CH: 'CHF', LI: 'CHF', CZ: 'CZK', DK: 'DKK', GB: 'GBP', NO: 'NOK', SE: 'SEK', PL: 'PLN', HU: 'HUF', IS: 'ISK' };
/** The currency of a country ('EUR', 'CHF' …), or null when the app does not know it. */
export const currencyOf = (country) => {
  const c = String(country || '').toUpperCase();
  return EURO.includes(c) ? 'EUR' : CURRENCY[c] ?? null;
};
/** The travel insurance to show at a trip abroad: the running contracts marked «travel». */
export const travelCover = (contracts = []) => contracts.filter((c) => c.travel && !c.stopped);

/* ---------- Flug morgen (Idee 277) ---------- */

/** A flight number as typed («lx 1234» → «LX1234»), or ''. */
export const flightOf = (trip) => String(trip?.flight ?? '').replace(/\s+/g, '').toUpperCase();
export const flightUrl = (no) => `https://www.flightradar24.com/data/flights/${String(no).toLowerCase()}`;
