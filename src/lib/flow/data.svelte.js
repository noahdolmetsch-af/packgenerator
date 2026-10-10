/**
 * v0.51.0 «Im Flow»: the records the flow views read, as one live query (activities, the log of the
 * last 70 days, the checks of the last 30 days, the trip days, the question pool and bowl default).
 * Heute's card, the flow page and the floating windows each read it.
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { addDays, normAct, tripDays } from '../flow.js';
import { QUESTIONS_KEY, poolOf } from '../flowcheck.js';
import { BOWL_KEY, bowlOf } from '../flowbowl.js';
import { homeTrips } from '../home/heute.js';
import { ensureSeed, ensureSeed2 } from '../flowdb.js';
import { TUNE_KEY, REWARD_KEY } from '../flowms.js';
import { HIDDEN_KEY } from '../flowsugg.js';
import { SEED2_KEY } from '../flowtiles.js';
import { HOME_PLACE, HOME_FORECAST, usable } from '../know.js';
import { toWx } from '../weather.js';

/** today: YYYY-MM-DD. */
export function flowQuery(today) {
  return liveQuery(async () => {
    const [acts, log, checks, trips, pool, bowl, seeded] = await Promise.all([
      db.flowActs.toArray(),
      db.flowLog.where('day').aboveOrEqual(addDays(today, -70)).toArray(),
      db.flowChecks.where('day').aboveOrEqual(addDays(today, -30)).toArray(),
      db.trips.toArray(),
      db.settings.get(QUESTIONS_KEY),
      db.settings.get(BOWL_KEY),
      db.settings.get('flowSeeded'),
    ]);
    return {
      acts: acts.map(normAct).sort((a, b) => a.order - b.order),
      log,
      checks,
      tripDays: tripDays(homeTrips(trips), today),
      pool: poolOf(pool?.value),
      bowl: bowlOf(bowl?.value),
      seeded: !!seeded || acts.length > 0,
    };
  });
}

let seeding = false;
/** Seed once when the data says so (a fresh start, or a restored backup without flow data). */
export async function seedIfNeeded(data) {
  if (!data || data.seeded || seeding) return;
  seeding = true;
  try {
    await ensureSeed(db);
  } finally {
    seeding = false;
  }
}

/* ---------- hobby pages, package 1 (Aktiv › Aktivität, Meilensteine) ---------- */
/**
 * The milestones need the WHOLE history (not the 70 days above): activities, the full log, the session
 * details, the stars kept, the settings of the hobby pages, the wishlist (rewards), the uploaded rides
 * (record wall) and today's home weather from the saved forecast (never fetched here).
 */
export function hobbyQuery(today) {
  return liveQuery(async () => {
    const [acts, log, sessions, stars, trips, sets, wish, rides, place, forecast] = await Promise.all([
      db.flowActs.toArray(),
      db.flowLog.toArray(),
      db.flowSessions.toArray(),
      db.flowStars.toArray(),
      db.trips.toArray(),
      db.settings.where('key').anyOf([TUNE_KEY, REWARD_KEY, HIDDEN_KEY, SEED2_KEY, 'flowSeeded']).toArray(),
      db.items.where('ownership').equals('wishlist').toArray(),
      db.rides.toArray(),
      db.settings.get(HOME_PLACE),
      db.meta.get(HOME_FORECAST),
    ]);
    const set = Object.fromEntries(sets.map((s) => [s.key, s.value]));
    const day = usable(place?.value, forecast) ? forecast.days?.find((d) => d.date === today) : null;
    const wx = day ? toWx([day]) : null;
    return {
      acts: acts.map(normAct).sort((a, b) => a.order - b.order),
      log,
      sessions,
      stars,
      tripDays: tripDays(homeTrips(trips), today),
      tune: set[TUNE_KEY] ?? {},
      reward: set[REWARD_KEY] ?? null,
      hidden: Array.isArray(set[HIDDEN_KEY]) ? set[HIDDEN_KEY] : [],
      wishlist: wish.map((i) => ({ id: i.id, name: i.name, nameDe: i.nameDe })),
      rides: rides.map((r) => ({ km: r.km, date: r.date })),
      weather: wx ? { max: wx.max, rain: wx.rain } : null,
      seeded: !!set.flowSeeded || acts.length > 0,
      seeded2: !!set[SEED2_KEY],
    };
  });
}

let seeding2 = false;
/** The first seed when needed, then seed 2 (names, favourites, the walk), once. */
export async function seedHobby(data) {
  if (!data || seeding2 || (data.seeded && data.seeded2)) return;
  seeding2 = true;
  try {
    if (!data.seeded) await ensureSeed(db);
    await ensureSeed2(db);
  } finally {
    seeding2 = false;
  }
}
