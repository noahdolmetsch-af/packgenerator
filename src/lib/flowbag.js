/**
 * «Sporttasche» (mockup AK3, Noah 13.10.2026 «1-5a», «ich gebe hiermit alle mockups frei»): a short
 * packing list per sport. The bag of the next fixed date (flowweek.js) opens first; a tick puts a thing
 * in, «Alles drin» all of them. A thing left out on a day the bag was packed counts as forgotten once;
 * from 2 times it is marked «oft vergessen». The evening before a fixed date Heute reminds (4a).
 *
 * Settings (db.settings, they travel with the backup):
 *   flow.bags        [{ id, actId|null, name, nameDe?, icon, items: [{ id, name, nameDe?, note?, noteDe?, forgot }] }]
 *   flow.bagPack     { [bagId]: { day, ids: [itemId] } }   what is in the bag for that day
 *   flow.bagRemind   false = no reminder on Heute (default on)
 * Pure functions; the page is src/pages/flow/Bags.svelte.
 */
import { addDays } from './flow.js';
import { weekdayOf, nextOn } from './flowweek.js';
import { DAY_CLOCK } from './dayclock.js';

export const BAGS_KEY = 'flow.bags';
export const PACK_KEY = 'flow.bagPack';
export const REMIND_KEY = 'flow.bagRemind';
/** From this many times forgotten a thing is «often forgotten». */
export const OFTEN = 2;
/** The reminder shows from this hour (Zurich) on the evening before (v0.144.0 RE: the evening of the one day clock, 18; was 17). */
export const REMIND_HOUR = DAY_CLOCK.evening;

const it = (id, name, nameDe, extra = {}) => ({ id, name, nameDe, forgot: 0, ...extra });
/** The bags of the start, fictional and changeable (linked to the seeded activities by id). */
export function seedBags() {
  return [
    { id: 'bag-yoga', actId: 'yoga', name: 'Yoga', icon: 'yoga', items: [it('mat', 'Yoga mat', 'Yogamatte'), it('bottle', 'Water bottle', 'Trinkflasche'), it('towel', 'Towel', 'Handtuch'), it('shirt', 'Spare shirt', 'Wechselshirt'), it('keys', 'House keys', 'Hausschlüssel', { note: 'always with you', noteDe: 'immer dabei' })] },
    { id: 'bag-tennis', actId: 'tennis', name: 'Tennis', icon: 'tennis', items: [it('racket', 'Racket', 'Schläger'), it('balls', 'Balls', 'Bälle'), it('shoes', 'Court shoes', 'Hallenschuhe'), it('bottle', 'Water bottle', 'Trinkflasche'), it('towel', 'Towel', 'Handtuch'), it('shirt', 'Spare shirt', 'Wechselshirt'), it('keys', 'House keys', 'Hausschlüssel')] },
    { id: 'bag-gym', actId: 'gym', name: 'Gym + sauna', nameDe: 'Gym + Sauna', icon: 'gym', items: [it('shoes', 'Gym shoes', 'Turnschuhe'), it('bottle', 'Water bottle', 'Trinkflasche'), it('towel', 'Towel', 'Handtuch'), it('saunatowel', 'Sauna towel', 'Saunatuch'), it('slippers', 'Slippers', 'Badelatschen'), it('shower', 'Shower gel', 'Duschmittel'), it('card', 'Member card', 'Abo-Karte'), it('keys', 'House keys', 'Hausschlüssel')] },
    { id: 'bag-hockey', actId: 'hockey', name: 'Ice hockey', nameDe: 'Eishockey', icon: 'hockey', items: [it('skates', 'Skates', 'Schlittschuhe'), it('stick', 'Stick', 'Stock'), it('helmet', 'Helmet', 'Helm'), it('gloves', 'Gloves', 'Handschuhe'), it('pads', 'Pads', 'Schoner'), it('bottle', 'Water bottle', 'Trinkflasche'), it('towel', 'Towel', 'Handtuch'), it('keys', 'House keys', 'Hausschlüssel')] },
    { id: 'bag-commute', actId: 'bike', name: 'Bike commute', nameDe: 'Velo Pendeln', icon: 'bike', items: [it('helmet', 'Helmet', 'Helm'), it('lights', 'Lights charged', 'Licht geladen'), it('lock', 'Lock', 'Schloss'), it('rain', 'Rain jacket', 'Regenjacke'), it('shirt', 'Spare shirt', 'Wechselshirt'), it('keys', 'House keys', 'Hausschlüssel')] },
  ];
}

/** A stored list of bags made whole (null: the start bags). */
export function bagsOf(v) {
  if (!Array.isArray(v)) return seedBags();
  return v
    .filter((b) => b?.id)
    .map((b) => ({ ...b, actId: b.actId ?? null, name: String(b.name ?? ''), icon: b.icon || 'heart', items: (Array.isArray(b.items) ? b.items : []).filter((x) => x?.id).map((x) => ({ ...x, name: String(x.name ?? ''), forgot: Math.max(0, Math.round(Number(x.forgot) || 0)) })) }));
}
export const packsOf = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

const hm = (now) => {
  const s = new Date(now).toLocaleTimeString('en-GB', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit', hour12: false });
  return s.slice(0, 5);
};
/**
 * The next fixed date of the bag's activity from now on (today counts while its time is still ahead):
 * { day, time } or null. fixed: flowweek.js fixedList.
 */
export function nextDate(bag, fixed = [], today, now = null) {
  const own = fixed.filter((f) => f.actId && f.actId === bag.actId);
  let best = null;
  for (const f of own) {
    let day = nextOn(today, f.wd);
    if (day === today && now != null && f.time <= hm(now)) day = addDays(today, 7);
    if (!best || day < best.day || (day === best.day && f.time < best.time)) best = { day, time: f.time };
  }
  return best;
}

/** The day the bag is packed for: its next date, or today without one. */
export const packDay = (bag, fixed, today, now) => nextDate(bag, fixed, today, now)?.day ?? today;
/** The things in the bag for that day. */
export const packedIds = (packs, bagId, day) => (packs[bagId]?.day === day ? packs[bagId].ids : []);

/** A tick: the thing in (or out) of the bag for the day. */
export function togglePacked(packs, bagId, day, itemId) {
  const ids = packedIds(packs, bagId, day);
  return { ...packs, [bagId]: { day, ids: ids.includes(itemId) ? ids.filter((x) => x !== itemId) : [...ids, itemId] } };
}
/** «Alles drin». */
export const packAll = (packs, bag, day) => ({ ...packs, [bag.id]: { day, ids: bag.items.map((x) => x.id) } });

/**
 * After a packed day: what stayed out counts as forgotten once (only when something was packed, so an
 * untouched bag counts nothing), and the day's state is cleared. → { bags, packs, changed }.
 */
export function settle(bags = [], packs = {}, today) {
  let changed = false;
  const out = { ...packs };
  const next = bags.map((b) => {
    const p = packs[b.id];
    if (!p || p.day >= today) return b;
    delete out[b.id];
    changed = true;
    if (!p.ids.length) return b;
    return { ...b, items: b.items.map((x) => (p.ids.includes(x.id) ? x : { ...x, forgot: x.forgot + 1 })) };
  });
  return { bags: next, packs: out, changed };
}
export const often = (item) => item.forgot >= OFTEN;

/** A new thing in a bag (name typed), and one removed («nicht gebraucht»). */
export function addThing(bags, bagId, name) {
  const n = String(name ?? '').trim();
  if (!n) return bags;
  return bags.map((b) => (b.id === bagId ? { ...b, items: [...b.items, { id: `it-${Date.now().toString(36)}-${b.items.length}`, name: n, forgot: 0 }] } : b));
}
export const removeThing = (bags, bagId, itemId) => bags.map((b) => (b.id === bagId ? { ...b, items: b.items.filter((x) => x.id !== itemId) } : b));
/** A new empty bag, for an activity or none. */
export function addBag(bags, { name, actId = null, icon = 'heart' }) {
  const n = String(name ?? '').trim();
  if (!n) return bags;
  return [...bags, { id: `bag-${Date.now().toString(36)}`, actId, name: n, icon, items: [] }];
}
export const removeBag = (bags, bagId) => bags.filter((b) => b.id !== bagId);

/**
 * The reminder on Heute: the evening before a fixed date (from REMIND_HOUR), the bags of tomorrow that
 * are not all packed: [{ bag, day, time, n, of }]. Empty when switched off.
 */
export function reminders({ bags = [], fixed = [], packs = {}, today, now, on = true }) {
  if (!on || Number(hm(now).slice(0, 2)) < REMIND_HOUR) return [];
  const tomorrow = addDays(today, 1);
  return bags
    .map((bag) => {
      const f = fixed.filter((x) => x.actId && x.actId === bag.actId && x.wd === weekdayOf(tomorrow)).sort((a, b) => a.time.localeCompare(b.time))[0];
      if (!f || !bag.items.length) return null;
      const n = packedIds(packs, bag.id, tomorrow).filter((id) => bag.items.some((x) => x.id === id)).length;
      return n < bag.items.length ? { bag, day: tomorrow, time: f.time, n, of: bag.items.length } : null;
    })
    .filter(Boolean);
}
