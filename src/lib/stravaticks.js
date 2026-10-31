/**
 * Package G «Daten kommen von selbst», #156 + #191 (Noah 19.10.2026 «1a wobei user dies in der app
 * ändern kann»): every Strava activity ticks the matching Aktiv activity by itself. In the app this can
 * be switched to «suggest first, I confirm» (or off). Which Strava sport goes to which Aktiv activity
 * is a suggestion the user can change per sport (#191).
 *
 * Settings (db.settings, in backups), TICKS_KEY: { mode: 'auto'|'suggest'|'off', map: { stravaType: actId | '' } }
 * HANDLED_KEY: Strava ids already ticked, suggested or left out (a deleted tick never comes back).
 * OPEN_KEY: suggestions waiting for «Zählen» or «Nicht zählen» (mode 'suggest').
 * A tick is a flowLog entry with via 'strava' and the Strava id; nothing is ticked twice on a day.
 */
import { db as appDb } from './db.js';
import { normAct, newEntry, addDays, tripDays } from './flow.js';
import { localDay } from './localday.js';

export const TICKS_KEY = 'strava.ticks';
export const HANDLED_KEY = 'strava.ticked';
export const OPEN_KEY = 'strava.tickOpen';
export const MODES = ['auto', 'suggest', 'off'];
/** In «suggest» only activities of the last days are asked about; older ones stay out. */
export const SUGGEST_DAYS = 14;

/**
 * The Strava sports and the activity each goes to by default: the first act whose id is in `ids` or
 * whose name (English or German) matches `re`. label: English key for t().
 */
export const SPORTS = [
  { types: ['Ride', 'GravelRide', 'MountainBikeRide', 'EBikeRide', 'EMountainBikeRide'], label: 'Ride', ids: ['bike'], re: /velo|bike|cycling|rad/i },
  { types: ['VirtualRide'], label: 'Indoor ride', ids: ['spin'], re: /indoor|spinning|rolle/i, inside: true },
  { types: ['Run', 'TrailRun', 'VirtualRun'], label: 'Run|kind', ids: ['run'], re: /lauf|run|jogg/i },
  { types: ['Hike', 'Walk'], label: 'Hike|kind', ids: ['hike', 'walk'], re: /wander|hik|walk|spazier/i },
  { types: ['BackcountrySki'], label: 'Ski touring', ids: ['skitour'], re: /skitour|ski tour/i },
  { types: ['AlpineSki', 'NordicSki', 'Snowboard'], label: 'Skiing', ids: ['ski'], re: /^ski|langlauf|snowboard/i },
  { types: ['Snowshoe'], label: 'Snowshoeing', ids: ['snowshoe'], re: /schneeschuh|snowshoe/i },
  { types: ['Tennis', 'Squash', 'Badminton', 'Padel', 'Pickleball'], label: 'Tennis', ids: ['tennis'], re: /tennis/i },
  { types: ['Yoga', 'Pilates'], label: 'Yoga', ids: ['yoga'], re: /yoga/i },
  { types: ['WeightTraining', 'Workout', 'Crossfit', 'HighIntensityIntervalTraining'], label: 'Strength training', ids: ['gym'], re: /gym|kraft|fitness|strength/i },
  { types: ['RockClimbing'], label: 'Climbing', ids: ['climb'], re: /kletter|climb|boulder/i },
  { types: ['Swim'], label: 'Swim', ids: ['swim'], re: /schwimm|swim/i },
  { types: ['IceSkate'], label: 'Ice skating', ids: ['hockey'], re: /eis|hockey|skat/i },
  { types: ['Rowing', 'Kayaking', 'Canoeing', 'StandUpPaddling'], label: 'Rowing', ids: ['row'], re: /ruder|row|kajak|kayak|paddl|sup/i },
];
const sportOf = (type, inside = false) => {
  // a ride on the trainer (Strava's «trainer» flag) is an indoor ride
  if (inside && SPORTS[0].types.includes(type)) return SPORTS[1];
  return SPORTS.find((s) => s.types.includes(type)) ?? null;
};
/** The key a Strava activity is mapped by: the first type of its sport, else its own type. */
export const sportKey = (type, inside = false) => sportOf(type, inside)?.types[0] ?? String(type ?? '');

export const prefsOf = (v) => ({
  mode: MODES.includes(v?.mode) ? v.mode : 'auto',
  map: v?.map && typeof v.map === 'object' ? { ...v.map } : {},
});

/** The default act for a sport key: by id first, then by name. null when the user has none. */
export function defaultAct(key, acts = []) {
  const s = SPORTS.find((x) => x.types[0] === key) ?? sportOf(key);
  if (!s) return null;
  const live = acts.map(normAct);
  const byId = live.find((a) => s.ids.includes(a.id));
  if (byId) return byId.id;
  return live.find((a) => s.re.test(a.name) || s.re.test(a.nameDe ?? ''))?.id ?? null;
}

/** The act a Strava activity ticks: the user's choice ('' = none), else the default. */
export function actFor(activity, acts, map = {}) {
  const key = sportKey(activity.type, !!activity.trainer);
  if (key in map) return map[key] || null;
  return defaultAct(key, acts);
}

/** Sports seen in the fetched activities, each with its act now: for the mapping table (#191). */
export function seenSports(activities = [], acts = [], map = {}) {
  const n = new Map();
  for (const a of activities) {
    const k = sportKey(a.type, !!a.trainer);
    if (k) n.set(k, (n.get(k) ?? 0) + 1);
  }
  return [...n.entries()]
    .map(([key, count]) => ({ key, count, label: SPORTS.find((s) => s.types[0] === key)?.label ?? key, actId: key in map ? map[key] || null : defaultAct(key, acts), own: key in map }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

const minutes = (a) => (Number(a.movingS) > 0 ? Math.max(1, Math.round(a.movingS / 60)) : null);

/** The flowLog entry for one Strava activity. */
export function tickEntry(act, a) {
  const at = a.start || `${a.day}T12:00:00.000Z`;
  const e = newEntry(act, { day: a.day, at, n: 1, min: minutes(a), via: 'strava' });
  return { ...e, id: `fl-strava-${a.id}`, stravaId: String(a.id) };
}

/**
 * What one round does. activities: db.activities (training.js actRecord); acts: flowActs; log: flowLog;
 * handled: Strava ids already done; open: suggestions waiting.
 * → { add: [entries], suggest: [{ id, actId, day, name, type, min }], handled: [ids newly handled] }
 */
export function planTicks({ activities = [], acts = [], log = [], handled = [], open = [], prefs = prefsOf(null), today, trips = [] }) {
  const out = { add: [], suggest: [], handled: [] };
  if (prefs.mode === 'off') return out;
  const done = new Set([...handled.map(String), ...open.map((o) => String(o.id))]);
  const actOf = new Map(acts.map(normAct).map((a) => [a.id, a]));
  const taken = new Set(log.map((e) => `${e.actId}|${e.day}`));
  const onTrip = new Set(trips);
  const byStrava = new Set(log.filter((e) => e.stravaId).map((e) => String(e.stravaId)));
  const from = addDays(today, -SUGGEST_DAYS + 1);
  for (const a of [...activities].sort((x, y) => String(x.start ?? x.day).localeCompare(String(y.start ?? y.day)))) {
    const id = String(a.id);
    if (!a.day || a.day > today || done.has(id)) continue;
    if (byStrava.has(id)) {
      out.handled.push(id);
      continue;
    }
    const actId = actFor(a, acts, prefs.map);
    const act = actId ? actOf.get(actId) : null;
    if (!act || act.paused) continue; // stays open: a later choice in the table can still tick it
    const k = `${act.id}|${a.day}`;
    out.handled.push(id);
    if (taken.has(k) || (act.counts.includes('trip') && onTrip.has(a.day))) continue; // already ticked that day (by hand, another activity or a trip day)
    taken.add(k);
    if (prefs.mode === 'suggest') {
      if (a.day >= from) out.suggest.push({ id, actId: act.id, day: a.day, name: a.name ?? '', type: a.type ?? '', min: minutes(a) });
      continue;
    }
    out.add.push(tickEntry(act, a));
  }
  return out;
}

/** One round in the database (after every Strava fetch, and after a change in the table). */
export async function applyTicks(db = appDb, { now = new Date() } = {}) {
  const prefs = prefsOf((await db.settings.get(TICKS_KEY))?.value);
  if (prefs.mode === 'off') return { add: 0, suggest: 0 };
  const today = localDay(now);
  const trips = tripDays(await db.trips.toArray(), today);
  return db.transaction('rw', db.settings, db.flowLog, db.flowActs, db.activities, async () => {
    const handled = (await db.settings.get(HANDLED_KEY))?.value ?? [];
    const open = (await db.settings.get(OPEN_KEY))?.value ?? [];
    const plan = planTicks({ activities: await db.activities.toArray(), acts: await db.flowActs.toArray(), log: await db.flowLog.toArray(), handled, open, prefs, today, trips });
    if (plan.add.length) await db.flowLog.bulkPut(plan.add);
    if (plan.suggest.length) await db.settings.put({ key: OPEN_KEY, value: [...open, ...plan.suggest] });
    if (plan.handled.length) await db.settings.put({ key: HANDLED_KEY, value: [...handled, ...plan.handled] });
    return { add: plan.add.length, suggest: plan.suggest.length };
  });
}

export async function savePrefs(patch, db = appDb) {
  await db.transaction('rw', db.settings, async () => {
    const cur = prefsOf((await db.settings.get(TICKS_KEY))?.value);
    await db.settings.put({ key: TICKS_KEY, value: { ...cur, ...patch } });
  });
}

/** «Zählen»: the suggestion becomes a tick. «Nicht zählen»: it goes away for good. */
export async function answer(id, take, db = appDb) {
  return db.transaction('rw', db.settings, db.flowLog, db.flowActs, db.activities, async () => {
    const open = (await db.settings.get(OPEN_KEY))?.value ?? [];
    const s = open.find((o) => o.id === id);
    await db.settings.put({ key: OPEN_KEY, value: open.filter((o) => o.id !== id) });
    if (!s || !take) return null;
    const act = await db.flowActs.get(s.actId);
    const a = (await db.activities.get(id)) ?? { id, day: s.day, movingS: (s.min ?? 0) * 60 };
    if (!act) return null;
    const e = tickEntry(act, a);
    await db.flowLog.put(e);
    return e;
  });
}

/** The table changed (#191): activities that had no Aktiv activity yet are ticked with the new choice. */
export async function setSport(key, actId, db = appDb, now = new Date()) {
  const cur = prefsOf((await db.settings.get(TICKS_KEY))?.value);
  await savePrefs({ map: { ...cur.map, [key]: actId ?? '' } }, db);
  return applyTicks(db, { now });
}
