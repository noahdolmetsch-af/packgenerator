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

const RULES = {
  trips: mergeTrip,
  'settings:training.weeklog': mergeWeeklog,
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
