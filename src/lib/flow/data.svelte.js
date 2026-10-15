/**
 * v0.51.0 «Im Flow»: the records the flow views read, as one live query (activities, the log of the
 * last 70 days, the checks of the last 30 days, the trip days, the question pool and bowl default).
 * Heute's card, the flow page and the floating windows each read it.
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { addDays, normAct, tripDays } from '../flow.js';
import { QUESTIONS_KEY, poolOf, OFF_KEY, offOf } from '../flowcheck.js';
import { BOWL_KEY, bowlOf } from '../flowbowl.js';
import { homeTrips } from '../home/heute.js';
import { ensureSeed, ensureSeed2, ensureMedSeed } from '../flowdb.js';
import { ARTS_KEY, PLACES_KEY, THINGS_KEY, LINKS_KEY, SOUND_KEY, CHALLENGE_KEY, MED_SEED_KEY, HELPED_KEY, NEXT_KEY, tplOf } from '../flowmed.js';
import { QUOTES_KEY } from '../flowquotes.js';
import { TUNE_KEY, REWARD_KEY } from '../flowms.js';
import { HIDDEN_KEY } from '../flowsugg.js';
import { SEED2_KEY } from '../flowtiles.js';
import { HOME_PLACE, HOME_FORECAST, usable } from '../know.js';
import { toWx } from '../weather.js';
import { withStravaRides, notIgnored } from '../kmbook.js';

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

/* ---------- hobby pages 2 «Kissenzeit» (B1, B2) ---------- */
/**
 * The meditation page: what hobbyQuery reads (for its milestones: the whole history) plus the
 * templates of the activity and the settings of the page (kinds, places, things, links, quotes, the
 * sound, the challenge put away). One query, computed once per change.
 */
export function medQuery(actId, today) {
  return liveQuery(async () => {
    const [acts, log, sessions, stars, trips, tpls, sets] = await Promise.all([
      db.flowActs.toArray(),
      db.flowLog.where('actId').equals(actId).toArray(),
      db.flowSessions.where('actId').equals(actId).toArray(),
      db.flowStars.toArray(),
      db.trips.toArray(),
      db.flowTemplates.where('actId').equals(actId).toArray(),
      db.settings.where('key').anyOf([TUNE_KEY, ARTS_KEY, PLACES_KEY, THINGS_KEY, LINKS_KEY, SOUND_KEY, CHALLENGE_KEY, QUOTES_KEY, MED_SEED_KEY, SEED2_KEY, HELPED_KEY, NEXT_KEY, 'flowSeeded']).toArray(),
    ]);
    const set = Object.fromEntries(sets.map((s) => [s.key, s.value]));
    return {
      acts: acts.map(normAct).sort((a, b) => a.order - b.order),
      log,
      sessions,
      stars,
      tripDays: tripDays(homeTrips(trips), today),
      tpls: tpls.map((x) => tplOf(x, actId)),
      tune: set[TUNE_KEY] ?? {},
      arts: set[ARTS_KEY] ?? null,
      places: set[PLACES_KEY] ?? null,
      things: set[THINGS_KEY] ?? null,
      links: set[LINKS_KEY] ?? [],
      sound: set[SOUND_KEY] ?? null,
      seen: set[CHALLENGE_KEY] ?? null,
      quotes: set[QUOTES_KEY] ?? null,
      helped: set[HELPED_KEY] ?? null, // hobby pages 3: own «Was hat geholfen?»
      nextOff: set[NEXT_KEY]?.off === true, // hobby pages 3: «Als Nächstes» switched off (H24a)
      seeded: !!set.flowSeeded || acts.length > 0,
      seeded2: !!set[SEED2_KEY],
      medSeeded: !!set[MED_SEED_KEY],
    };
  });
}

let seedingMed = false;
/** The first seeds when needed, then the three suggested templates, once. */
export async function seedMed(data, actId) {
  if (!data || seedingMed || (data.seeded && data.seeded2 && data.medSeeded)) return;
  seedingMed = true;
  try {
    if (!data.seeded) await ensureSeed(db);
    if (!data.seeded2) await ensureSeed2(db);
    if (!data.medSeeded) await ensureMedSeed(db, actId);
  } finally {
    seedingMed = false;
  }
}

/* ---------- v0.127.0 «Tages-Check» 2: the tiles on Heute and the 15 questions ---------- */
/**
 * What «Deine Balance» reads: the checks and the log of the last 7 days, the activities (their ring),
 * the rides of those days (files and counted Strava rides), the pool and the questions switched off;
 * WG: and the «Wi gaht's?» answers of those days.
 */
export function balanceQuery(today) {
  const from = addDays(today, -6);
  return liveQuery(async () => {
    const [acts, log, checks, rides, book, pool, off, answers, stravaActs, stravaPrefs] = await Promise.all([
      db.flowActs.toArray(),
      db.flowLog.where('day').aboveOrEqual(from).toArray(),
      db.flowChecks.where('day').aboveOrEqual(from).toArray(),
      db.rides.where('date').aboveOrEqual(from).toArray(),
      db.kmBook.where('date').aboveOrEqual(from).toArray(),
      db.settings.get(QUESTIONS_KEY),
      db.settings.get(OFF_KEY),
      db.abAnswers.where('day').aboveOrEqual(from).toArray(), // WG: the «Wi gaht's?» answers count in the ring
      db.activities ? db.activities.where('day').aboveOrEqual(from).toArray() : [], // 0.136.0: Strava rides before a bike's start point
      db.settings.get('strava'), // «2b»: rides on an ignored Strava bike do not count
    ]);
    const bikeActs = notIgnored(stravaActs, stravaPrefs?.value?.ignore);
    return {
      answers: answers.filter((a) => a.day <= today),
      acts: acts.map(normAct),
      log: log.filter((e) => e.day <= today),
      checks: checks.filter((c) => c.day <= today),
      rides: withStravaRides(rides, book, bikeActs).filter((r) => r.date <= today).map((r) => ({ date: r.date, km: r.km, movingH: r.movingH ?? null, totalH: r.totalH ?? null })),
      pool: poolOf(pool?.value),
      off: offOf(off?.value),
    };
  });
}
