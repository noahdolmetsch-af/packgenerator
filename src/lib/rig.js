/**
 * Velos › Setup (UC3-1 to UC3-3, Noah 14.10.2026 «1-5a», extras 1–3, «UC3-1-UC3-3 freigeben»):
 * one page per bike with your setup photos, the total weight, the bag plan, the setup log, the
 * comparison with rigs you saved, your races and your own race-rig links.
 *
 * Nothing here is fixed by the app: links, races, comparison rows and log entries are only what the
 * user adds; suggestions (move an item, go back after a change) are hints that can be dismissed.
 * Links and comparison rows live in settings ('rigLinks') and on the bike (bike.rigCompare,
 * bike.setupLog), so no new table is needed and every backup carries them.
 *
 * Pure functions, tested in tests/rig.test.js.
 */
import { SLOTS } from './bikes.js';
import { tripStats } from './trips.js';
import { PART } from './care.js';
import { bikeKm, kmOn } from './kmbook.js';

/* ---------- the bag plan (UC3-2) ---------- */

/** Where a place sits on the bike: front, middle or rear (for the weight split). */
export const SIDES = {
  front: ['bar', 'pouchL', 'pouchR', 'fork'],
  middle: ['top', 'frame', 'ttrear', 'tool', 'down', 'cage1', 'cage2'],
  rear: ['seat', 'side'],
};
export const sideOf = (slot) => Object.keys(SIDES).find((k) => SIDES[k].includes(slot)) ?? null;
/** Places you reach while riding. */
export const HANDY = ['top', 'pouchL', 'pouchR'];
/** Low and central places, good for heavy things. */
export const LOW = ['frame', 'tool', 'down'];
/** From this weight an item counts as heavy for the «lower and more central» hint. */
export const HEAVY_G = 300;
/** From this fill (%) a bag counts as almost full. */
export const FULL_PCT = 90;

/** The trips of a bike that have a packing list, for the plan's choice: the next ones first, then the last ones. At most `max`. */
export function planTrips(trips, bikeId, today, max = 4) {
  const mine = (trips ?? []).filter((x) => x.bikeId === bikeId && !Array.isArray(x.packs) && (x.entries ?? []).length);
  const next = mine.filter((x) => (x.startDate ?? '9999') >= today).sort((a, b) => (a.startDate ?? '9999').localeCompare(b.startDate ?? '9999'));
  const past = mine.filter((x) => (x.startDate ?? '9999') < today).sort((a, b) => b.startDate.localeCompare(a.startDate));
  return [...next, ...past].slice(0, max);
}

/**
 * The plan of one trip on its bike: the bags in the order of the places (numbered), their weight,
 * fill and contents, the split front / middle / rear and the items that sit in a place without a bag.
 */
export function bagPlan(trip, items, containers, bike) {
  const stats = tripStats(trip, items, containers, bike);
  const itemsById = Object.fromEntries(items.map((i) => [i.id, i]));
  const order = SLOTS.map((s) => s.key);
  const inBag = stats.zones.filter((z) => z.bag && !z.worn && z.key !== 'body' && z.key !== 'mounted' && order.includes(z.key)).sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  const bags = inBag.map((z, n) => {
    const cap = Number(z.bag.volumeL) || null;
    const known = z.entries.length > 0 && z.entries.every((e) => Number(itemsById[e.itemId]?.volumeL) > 0);
    const fill = cap && known ? Math.min(100, Math.round((z.vol / cap) * 100)) : null;
    const tags = [];
    if (HANDY.includes(z.key)) tags.push('handy');
    if (LOW.includes(z.key)) tags.push('low');
    return {
      n: n + 1,
      key: z.key,
      bagName: z.bag.name,
      grams: z.grams,
      unweighed: z.unweighed,
      vol: Math.round(z.vol * 10) / 10,
      cap,
      fill,
      full: fill != null && fill >= FULL_PCT,
      tags,
      items: z.entries.map((e) => ({ itemId: e.itemId, qty: e.qty || 1, grams: itemsById[e.itemId]?.weightG == null ? null : itemsById[e.itemId].weightG * (e.qty || 1) })),
    };
  });
  const sides = { front: 0, middle: 0, rear: 0 };
  for (const b of bags) {
    const s = sideOf(b.key);
    if (s) sides[s] += b.grams;
  }
  const totalG = sides.front + sides.middle + sides.rear;
  const loose = stats.zones
    .filter((z) => z.noBag && !z.worn && z.entries.length)
    .flatMap((z) => z.entries.map((e) => ({ itemId: e.itemId, slot: z.key, grams: itemsById[e.itemId]?.weightG ?? null })));
  return { bags, sides, totalG, loose, stats };
}

/** Share of each side in %, rounded so the three add up to 100 (all 0 when nothing is weighed). */
export function sideShares(sides) {
  const total = sides.front + sides.middle + sides.rear;
  if (!total) return { front: 0, middle: 0, rear: 0 };
  const front = Math.round((sides.front / total) * 100);
  const middle = Math.round((sides.middle / total) * 100);
  return { front, middle, rear: 100 - front - middle };
}

/**
 * At most two hints to move an item (UC3-2), never applied by themselves:
 *  - heavy: the heaviest item of HEAVY_G or more in the seat pack, side bags or front roll goes to
 *    the frame bag (lower and more central), when the trip has one that is not almost full;
 *  - handy: the heaviest rain item in the seat pack, side bags or front roll goes to a place you
 *    reach while riding (top tube bag, else a pouch), when the trip has one.
 * Dismissed hints are kept on the trip (trip.planDismissed: ['itemId>slot']).
 */
export function planHints(plan, trip, items) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const setup = trip.setup ?? {};
  const dismissed = new Set(trip.planDismissed ?? []);
  const far = ['seat', 'side', 'bar'];
  const out = [];
  const frame = plan.bags.find((b) => b.key === 'frame');
  const candidates = (test) =>
    plan.bags
      .filter((b) => far.includes(b.key))
      .flatMap((b) => b.items.map((x) => ({ ...x, from: b.key })))
      .filter((x) => test(byId[x.itemId], x))
      .sort((a, b) => (b.grams ?? 0) - (a.grams ?? 0));
  if (setup.frame && !frame?.full) {
    const heavy = candidates((it, x) => (x.grams ?? 0) >= HEAVY_G && it?.category !== 'food').find((x) => !dismissed.has(`${x.itemId}>frame`));
    if (heavy) out.push({ kind: 'heavy', itemId: heavy.itemId, grams: heavy.grams, from: heavy.from, to: 'frame' });
  }
  const handyTo = HANDY.find((s) => setup[s]);
  if (handyTo) {
    const rain = candidates((it) => it?.category === 'rain').find((x) => !dismissed.has(`${x.itemId}>${handyTo}`) && !out.some((o) => o.itemId === x.itemId));
    if (rain) out.push({ kind: 'handy', itemId: rain.itemId, grams: rain.grams, from: rain.from, to: handyTo });
  }
  return out;
}

/** The trip's entries after moving one item (open to pack again, like «Move to» in Pack). */
export const moveEntry = (trip, itemId, to) => (trip.entries ?? []).map((e) => (e.itemId === itemId ? { ...e, slot: to, packed: false } : e));
/** The trip's dismissed hints after dismissing one. */
export const dismissHint = (trip, hint) => [...new Set([...(trip.planDismissed ?? []), `${hint.itemId}>${hint.to}`])];

/* ---------- the total weight (UC3-1) ---------- */

/**
 * Bike, luggage (gear, bags and what you wear) and food and water of one trip, in grams.
 * missing: how many things have no weight yet (bike included).
 */
export function weightSplit(stats, bike) {
  const bikeG = bike?.weightG ?? 0;
  const packG = stats.baseG + stats.bagsG + stats.wornG;
  const eatG = stats.consumablesG;
  return { bikeG, packG, eatG, totalG: bikeG + packG + eatG, missing: stats.unweighed + (bike?.weightG == null ? 1 : 0) };
}

/** Within this many grams a saved rig counts as «about the same». */
export const SAME_G = 500;
/** Your luggage against a saved rig's (typed by you, in kg): 'lighter', 'heavier' or 'same'. */
export function compareLoad(packG, rigKg) {
  const rigG = Number(rigKg) * 1000;
  if (!(rigG > 0)) return null;
  if (Math.abs(packG - rigG) <= SAME_G) return 'same';
  return packG < rigG ? 'lighter' : 'heavier';
}

/* ---------- links: race rigs and races (UC3-1) ---------- */

/** The site of a link without «www.»: «bikepacking.com». */
export function domainOf(url) {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
/** A full https address from what was typed. */
export const fullUrl = (url) => {
  const s = `${url ?? ''}`.trim();
  return !s ? '' : /^https?:\/\//i.test(s) ? s : `https://${s}`;
};
/** A title from the last part of the address («2026-colorado-trail-race-rigs» → «2026 Colorado Trail Race Rigs»). */
export function guessTitle(url) {
  try {
    const path = new URL(fullUrl(url)).pathname.split('/').filter(Boolean).pop() ?? '';
    return decodeURIComponent(path)
      .replace(/\.[a-z]+$/i, '')
      .split(/[-_]+/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(' ');
  } catch {
    return '';
  }
}
/** The year in a title or address (2000–2099), or null. */
export const guessYear = (text) => Number(`${text ?? ''}`.match(/\b(20\d\d)\b/)?.[1]) || null;

/** A new link from the dialog's fields. kind: 'rig' or 'race'. */
export function newLink({ url, title = '', kind = 'rig', notes = [], packKg = null, raceDate = null, raceEnd = null, raceId = null }, { id, now = new Date().toISOString() } = {}) {
  const href = fullUrl(url);
  const name = `${title ?? ''}`.trim() || guessTitle(href) || domainOf(href);
  return {
    id,
    url: href,
    title: name,
    kind: kind === 'race' ? 'race' : 'rig',
    year: guessYear(`${name} ${href} ${raceDate ?? ''}`),
    notes: notes.map((n) => `${n}`.trim()).filter(Boolean).slice(0, 5),
    packKg: Number(packKg) > 0 ? Number(packKg) : null,
    raceDate: kind === 'race' ? raceDate || null : null,
    raceEnd: kind === 'race' ? raceEnd || null : null,
    raceId: kind === 'rig' ? raceId || null : null,
    star: false,
    addedAt: now,
  };
}

/** The rig links, newest year first, then the newest added. */
export const rigLinks = (links) => (links ?? []).filter((l) => l.kind !== 'race').sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || (b.addedAt ?? '').localeCompare(a.addedAt ?? ''));
/** The years the rig links have, newest first (for the filter). */
export const linkYears = (links) => [...new Set(rigLinks(links).map((l) => l.year).filter(Boolean))].sort((a, b) => b - a);
/** filter: 'all', 'star' or a year. */
export const filterLinks = (links, filter) => rigLinks(links).filter((l) => filter === 'all' || (filter === 'star' ? l.star : l.year === Number(filter)));

/** Your races: upcoming ones first (by date), then the past ones; each with how many rigs belong to it. */
export function racesOf(links, today) {
  const all = links ?? [];
  const races = all.filter((l) => l.kind === 'race').map((r) => ({ ...r, rigs: all.filter((l) => l.kind !== 'race' && l.raceId === r.id).length, past: !!r.raceDate && (r.raceEnd ?? r.raceDate) < today }));
  return races.sort((a, b) => Number(a.past) - Number(b.past) || (a.raceDate ?? '9999').localeCompare(b.raceDate ?? '9999'));
}

/* ---------- the setup log (UC3-3) ---------- */

/** The kinds of a log entry. name: English key for t(). */
export const LOG_KINDS = [
  { key: 'drive', name: 'Drivetrain' },
  { key: 'tyres', name: 'Wheels and tyres' },
  { key: 'bags', name: 'Bags|setup' },
  { key: 'cockpit', name: 'Cockpit' },
  { key: 'other', name: 'Other|setup' },
];
const AREA_KIND = { drive: 'drive', wheels: 'tyres', cockpit: 'cockpit' };
/** The kind of a part's change (care.js PART areas). */
export const kindOfPart = (part) => AREA_KIND[PART[part]?.area] ?? 'other';

/** A new log entry. source: { type: 'visit' | 'link' | 'own', id, label }. */
export function newLogEntry({ date, kind = 'other', title, before = '', after = '', why = '', deltaG = null, source = null, part = null, saved = null }, { id, now = new Date().toISOString() } = {}) {
  return {
    id,
    date,
    kind: LOG_KINDS.some((k) => k.key === kind) ? kind : 'other',
    title: `${title ?? ''}`.trim(),
    before: `${before ?? ''}`.trim(),
    after: `${after ?? ''}`.trim(),
    why: `${why ?? ''}`.trim(),
    deltaG: deltaG === '' || deltaG == null || Number.isNaN(Number(deltaG)) ? null : Math.round(Number(deltaG)),
    source: source ?? { type: 'own', id: null, label: '' },
    part,
    // Velo-Idee 73: the measures and photos before the change (bikes/rueckbau.js), or null
    ...(saved ? { saved } : {}),
    backAsked: false,
    at: now,
  };
}

/** The bike's trips after a day (start on or after it), oldest first. */
const tripsAfter = (trips, bikeId, date) => (trips ?? []).filter((x) => x.bikeId === bikeId && x.startDate && x.startDate >= date).sort((a, b) => a.startDate.localeCompare(b.startDate));
/** The first sentence of a debrief note, at most 90 characters. */
export const feelOf = (note) => {
  const s = `${note ?? ''}`.trim().split(/(?<=[.!?])\s/)[0] ?? '';
  return s.length > 90 ? `${s.slice(0, 89).trimEnd()}…` : s;
};

/**
 * The log of a bike, newest first, each entry with what the app knows since: the km since the change
 * (when the ride ledger knows the km on that day), the first trip on the bike after it (started by today), and your sentence from that
 * trip's debrief.
 */
export function logView(bike, { trips = [], debriefs = [], kmBook = [], today } = {}) {
  const now = bikeKm(kmBook, bike.id).km;
  return [...(bike.setupLog ?? [])]
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || (b.at ?? '').localeCompare(a.at ?? ''))
    .map((e) => {
      const before = e.date ? kmOn(kmBook, bike.id, e.date) : null;
      // Only when the ledger knows the km on that day (an opening entry after it would count everything).
      const kmSince = now != null && before != null && e.date <= today ? Math.max(0, now - before) : null;
      const first = e.date ? tripsAfter(trips, bike.id, e.date).filter((x) => x.startDate <= today)[0] ?? null : null;
      const d = first ? debriefs.find((x) => x.tripId === first.id) : null;
      return { ...e, kmSince, firstTrip: first ? { id: first.id, title: first.title } : null, feel: d ? feelOf(d.note) : '' };
    });
}

/** This year's changes: how many, the weight change, and how many per kind. */
export function logYear(entries, year) {
  const mine = (entries ?? []).filter((e) => (e.date ?? '').startsWith(`${year}-`));
  const byKind = Object.fromEntries(LOG_KINDS.map((k) => [k.key, mine.filter((e) => e.kind === k.key).length]));
  return { n: mine.length, deltaG: mine.reduce((s, e) => s + (e.deltaG ?? 0), 0), byKind };
}

/** From this many trips after a change the app asks once whether to go back. */
export const BACK_AFTER = 3;
/**
 * «After 3 trips with 38 T.: back to 40 T.?» for the newest change with a before and an after, once
 * BACK_AFTER trips on the bike started after it; null once answered (entry.backAsked).
 */
export function backHint(bike, trips, today) {
  const e = [...(bike.setupLog ?? [])].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))[0];
  if (!e || e.backAsked || !e.before || !e.after) return null;
  const n = tripsAfter(trips, bike.id, e.date).filter((x) => x.startDate <= today).length;
  return n >= BACK_AFTER ? { id: e.id, n, before: e.before, after: e.after } : null;
}

/** How long a workshop job is offered for the log. */
export const OFFER_DAYS = 180;
/**
 * Workshop jobs that replaced a part and are not in the log yet: «Into the log?».
 * → [{ visitId, part, date, model, kind }], newest first.
 */
export function visitOffers(bike, visits, today) {
  const from = new Date(Date.parse(`${today}T00:00:00Z`) - OFFER_DAYS * 864e5).toISOString().slice(0, 10);
  const have = new Set((bike.setupLog ?? []).filter((e) => e.source?.type === 'visit').map((e) => `${e.source.id}:${e.part ?? ''}`));
  const skip = new Set(bike.logSkipped ?? []);
  return (visits ?? [])
    .filter((v) => v.bikeId === bike.id && v.date >= from && v.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .flatMap((v) => (v.parts ?? []).filter((p) => p.action === 'replace').map((p) => ({ visitId: v.id, part: p.part, date: v.date, model: p.model ?? '', what: p.what ?? '', kind: kindOfPart(p.part) })))
    .filter((o) => !have.has(`${o.visitId}:${o.part}`) && !skip.has(`${o.visitId}:${o.part}`));
}

