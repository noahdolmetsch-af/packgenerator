/**
 * «Einträge zusammenführen» (Noah 21.11.2026 «1-5a», point 4 of the thread «Fix Abhaken-Sync»): two devices that
 * tick different things in the SAME stored record (the packing list of one trip, the ticks of one week of the
 * weekly plan) no longer lose one of the two. Until now the newer record won as a whole and the other version
 * waited 30 days in the quiet history, so the ticks of the older one looked lost.
 *
 * Rule: when both devices changed such a record, a tick set on either device stays. Everything else (names, dates,
 * order) comes from the newer record, as before. The result is the same on both devices, whichever of them
 * computes it (a pure function of the two records and their times), and merging an already merged record changes
 * nothing, so the devices settle and do not ping-pong.
 *
 * Price (the app cannot know what was in the record at the last sync): a tick taken back on one device while the
 * other device changed the record at the same time comes back, and an entry deleted on one device while the other
 * ticked something else comes back too. Nothing is lost, one tap sets it right.
 * Other records keep the old rule: the newer change wins, the other version waits 30 days.
 */
import { stable } from './track.js';
import { seedItems, normItem } from '../routine.js';

/** The newer of two records by the time of their change; the same time: the larger content, the same on both devices. */
export function newerOf(mine, theirs, mineAt = '', theirsAt = '') {
  const a = String(mineAt ?? '');
  const b = String(theirsAt ?? '');
  const theirsWins = b !== a ? b > a : stable(theirs) > stable(mine);
  return theirsWins ? { newer: theirs, older: mine } : { newer: mine, older: theirs };
}

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const list = (v) => (Array.isArray(v) ? v : []);

/** A trip: the entries (packed) and the ready check (done) of both, ticks from either side. */
export function mergeTrip(newer, older) {
  const queues = new Map();
  for (const e of list(older?.entries)) queues.set(e?.itemId, [...(queues.get(e?.itemId) ?? []), e]);
  const inNewer = new Set(list(newer?.entries).map((e) => e?.itemId));
  const entries = list(newer?.entries).map((e) => {
    const o = queues.get(e?.itemId)?.shift();
    return o?.packed && !e?.packed ? { ...e, packed: true } : e;
  });
  // an entry only the older record has (added there, or taken out here): it comes back, so nothing is lost
  for (const e of list(older?.entries)) if (!inNewer.has(e?.itemId)) entries.push(e);
  const olderReady = new Map(list(older?.ready).map((r) => [r?.id, r]));
  const readyIds = new Set(list(newer?.ready).map((r) => r?.id));
  const ready = list(newer?.ready).map((r) => (olderReady.get(r?.id)?.done && !r?.done ? { ...r, done: true } : r));
  for (const r of list(older?.ready)) if (!readyIds.has(r?.id)) ready.push(r);
  const out = { ...newer };
  if (Array.isArray(newer?.entries) || Array.isArray(older?.entries)) out.entries = entries;
  if (Array.isArray(newer?.ready) || Array.isArray(older?.ready)) out.ready = ready;
  return out;
}

/** The weekly plan log (setting training.weeklog): the ticks, the «not this unit» marks and the released units of every week. */
export function mergeWeeklog(newer, older) {
  const a = obj(newer?.value);
  const b = obj(older?.value);
  const weeks = {};
  for (const monday of new Set([...Object.keys(obj(a.weeks)), ...Object.keys(obj(b.weeks))])) {
    const n = obj(obj(a.weeks)[monday]);
    const o = obj(obj(b.weeks)[monday]);
    const week = { ...o, ...n };
    week.done = { ...obj(o.done), ...obj(n.done) };
    week.no = [...new Set([...list(n.no), ...list(o.no)])];
    week.released = [...new Set([...list(n.released), ...list(o.released)])];
    week.pins = { ...obj(o.pins), ...obj(n.pins) };
    week.mode = { ...obj(o.mode), ...obj(n.mode) };
    week.snap = n.snap ?? o.snap ?? null;
    weeks[monday] = week;
  }
  return { ...newer, value: { ...a, weeks } };
}

/**
 * The list «Das tut mir gut» (setting routine; Noah 23.11.2026: the list on the phone had 11 entries, the one on the computer 8):
 * the whole record used to go to the newer device, so a list edited on one device was replaced by the other one, and a device that
 * had never saved its list (it showed the seven examples) wrote the examples over the real list with its first tick.
 * Now: every entry that either device has stays; the ticks and the answers «Did it do you good?» of both stay; the order and the
 * wording of an entry come from the newer record, except that an example nobody changed never beats an entry someone changed;
 * an example that only one device still has was deleted on the other (the examples were on both at the start), so it goes;
 * an own entry only one device has stays, unless the newer record notes it as deleted («gone»).
 */
const seedOf = new Map(seedItems().map((x) => [x.id, stable(x)]));
const untouched = (x) => !!x && seedOf.get(x.id) === stable(normItem(x));
export function mergeRoutine(newer, older) {
  const a = obj(newer?.value);
  const b = obj(older?.value);
  const itemsA = list(a.items).filter((x) => x && x.id);
  const itemsB = list(b.items).filter((x) => x && x.id);
  const inB = new Map(itemsB.map((x) => [x.id, x]));
  const inA = new Set(itemsA.map((x) => x.id));
  const goneA = new Set(list(a.gone));
  const items = [];
  for (const x of itemsA) {
    const o = inB.get(x.id);
    if (!o) {
      if (!untouched(x) || list(obj(a.ticks)[x.id]).length) items.push(x); // a new entry of this side, or an example it changed: stays; an unchanged, never ticked example the other deleted: goes
      continue;
    }
    items.push(untouched(x) && !untouched(o) ? o : x);
  }
  for (const x of itemsB) if (!inA.has(x.id) && !goneA.has(x.id) && (!untouched(x) || list(obj(b.ticks)[x.id]).length)) items.push(x);
  const ticks = {};
  for (const id of new Set([...Object.keys(obj(a.ticks)), ...Object.keys(obj(b.ticks))])) {
    const days = [...new Set([...list(obj(a.ticks)[id]), ...list(obj(b.ticks)[id])])].sort();
    if (days.length) ticks[id] = days;
  }
  const felt = {};
  for (const id of new Set([...Object.keys(obj(a.felt)), ...Object.keys(obj(b.felt))])) {
    const days = { ...obj(obj(b.felt)[id]), ...obj(obj(a.felt)[id]) };
    if (Object.keys(days).length) felt[id] = days;
  }
  const have = new Set(items.map((x) => x.id));
  const gone = [...new Set([...list(a.gone), ...list(b.gone)])].filter((id) => !have.has(id)).sort().slice(-100);
  const value = { ...a, items, ticks, felt };
  if (gone.length) value.gone = gone;
  else delete value.gone;
  return { ...newer, value };
}

/** A plain list of ids kept in one setting (wardrobe.everydayKeep): the ids of both devices stay, in the order of the newer record. */
export function mergeIdList(newer, older) {
  const a = list(newer?.value);
  const rest = list(older?.value).filter((x) => !a.includes(x));
  return { ...newer, value: [...a, ...rest] };
}

const RULES = {
  trips: mergeTrip,
  'settings:training.weeklog': mergeWeeklog,
  'settings:routine': mergeRoutine,
  'settings:wardrobe.everydayKeep': mergeIdList,
};
const ruleOf = (t, id) => RULES[t] ?? RULES[`${t}:${id}`] ?? null;

/**
 * The merged record of a record changed on both devices, or null when no merge rule applies (a delete on one
 * side, another kind of record, or the result differs in nothing from the newer one).
 */
export function mergeBoth(t, id, mine, theirs, { mineAt = '', theirsAt = '' } = {}) {
  const rule = ruleOf(t, id);
  if (!rule || mine == null || theirs == null) return null;
  const { newer, older } = newerOf(mine, theirs, mineAt, theirsAt);
  const merged = rule(newer, older);
  return stable(merged) === stable(newer) ? null : merged; // nothing to add: the newer one is the answer, the old rule applies
}
