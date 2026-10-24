/**
 * Sportart statt Tourart (mockups SA1–SA3, Noah 14.10.2026 «1b2a 3b 4a 5b», then «SA1–SA3 freigegeben»
 * with «1a 2a 3a 4b» and «5b»).
 *
 * A trip has a sport. The bike sports (Fahrrad, Gravel, Cross Country, Downhill, Bikepacking) all pack
 * from the bike area (domains.js BIKEPACKING); they differ in their name, their icon and their own
 * standard bike. Ski touring and hiking are their own areas. trip.sport holds the key; older bike
 * trips have none until Noah takes the suggestion (oldTripSuggestions, SA3).
 *   1a: «Fahrrad» is chosen in a new trip.
 *   2a: every bike sport has its own standard bike (sportBikeId).
 *   3a: a night chosen with a day sport: a quiet hint «Zu Bikepacking» (wantsBikepacking).
 *   4b: old trips by bike and days (suggestSport).
 *   5b: the sports used most come first (orderSports).
 * Pure functions, easy to test.
 */
import { BIKEPACKING, DOMAIN, domainOf, domainName, hasBike } from './domains.js';
import { SPORTS } from './sportlist.js';

export { SPORTS };
export const SPORT = Object.fromEntries(SPORTS.map((s) => [s.key, s]));
export const CYCLING = 'cycling';
export const BIKE_SPORTS = SPORTS.filter((s) => s.area === BIKEPACKING).map((s) => s.key);
export const isBikeSport = (key) => BIKE_SPORTS.includes(key);
/** The day sports: with a night, Bikepacking may fit better (3a). */
export const DAY_SPORTS = BIKE_SPORTS.filter((k) => k !== 'bikepacking');

/** The area a sport packs from (an unknown key: the key itself, an area like Weekend). */
export const areaOf = (key) => SPORT[key]?.area ?? key;
/** The sport a new trip of an area starts with (a template or an area's page): bike → Fahrrad. */
export const sportForArea = (area) => (!area || area === BIKEPACKING ? CYCLING : SPORTS.find((s) => s.key === area)?.key ?? area);

/** The sport of a trip, or null for an older bike trip without one (and trips of other areas). */
export function sportOf(trip) {
  if (SPORT[trip?.sport] && (isBikeSport(trip.sport) ? hasBike(trip) : domainOf(trip) === trip.sport)) return trip.sport;
  const d = domainOf(trip);
  return d !== BIKEPACKING && SPORT[d] ? d : null;
}

/**
 * The name a trip shows for its kind (an English key for t()): its sport («Fahrrad», «Gravel»), else
 * its area. Klick-Rundgang 22.10.2026 H02: a Fahrrad trip packs from the bike area, but its tips,
 * suggestion list and checks say «Fahrrad», not «Bikepacking».
 */
export const kindName = (trip) => {
  const s = sportOf(trip);
  return s ? SPORT[s].name : domainName(domainOf(trip));
};

/** 5b: the sports, the ones with the most trips first; a tie keeps the fixed order. */
export function orderSports(trips = []) {
  const n = {};
  for (const x of trips) {
    const s = sportOf(x);
    if (s) n[s] = (n[s] ?? 0) + 1;
  }
  return SPORTS.map((s, i) => ({ s, i, n: n[s.key] ?? 0 }))
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .map((x) => x.s);
}

/* ---------- 2a: a standard bike per sport ---------- */

/** Key in the settings table: { gravel: bikeId, … }, set with «Als Standard für Gravel». */
export const SPORT_BIKES = 'sportBikes';

/** What a bike's type (free text) says about the sport it is made for. */
const TYPE_SPORT = [
  [/gravel/i, 'gravel'],
  [/down ?hill|enduro|freeride|\bdh\b/i, 'downhill'],
  [/^(mtb|mountain ?bike)$|cross ?country|\bxc\b|hard ?tail|^full|fully/i, 'xc'],
];
export const typeSport = (bike) => TYPE_SPORT.find(([re]) => re.test(`${bike?.type ?? ''}`.trim()))?.[1] ?? null;

/**
 * The standard bike of a sport: the one Noah set for it, else the first bike (in the order) whose type
 * fits the sport, else the general standard bike (fallbackId, VS1). Fahrrad and Bikepacking use the
 * general one unless Noah set their own. → a bike id or null.
 */
export function sportBikeId(sport, bikes = [], saved = {}, fallbackId = null) {
  if (!isBikeSport(sport) || !bikes.length) return fallbackId;
  const own = saved?.[sport];
  if (own && bikes.some((b) => b.id === own)) return own;
  if (sport === CYCLING || sport === 'bikepacking') return fallbackId;
  // the bikes by their order (bikes.js sortBikes; not imported here, so the tests can read this list)
  const rank = (b) => (typeof b.order === 'number' ? b.order : 99);
  const list = [...bikes].sort((a, b) => rank(a) - rank(b) || `${a.name}`.localeCompare(`${b.name}`));
  const fit = list.find((b) => typeSport(b) === sport) ?? (sport === 'downhill' ? list.find((b) => typeSport(b) === 'xc') : null);
  return fit?.id ?? fallbackId;
}

/** Is this bike the sport's own standard (set by Noah or by its type), not just the general one? */
export const ownSportBike = (sport, bikes, saved, id) => !!id && sport !== CYCLING && sportBikeId(sport, bikes, saved, null) === id;

/* ---------- 3a: a night with a day sport ---------- */

/** A bike day sport with a night chosen: the hint «Bikepacking passt vielleicht besser» shows. */
export const wantsBikepacking = (sport, night) => DAY_SPORTS.includes(sport) && !!night && night !== 'none';

/* ---------- 4b: the old trips (SA3) ---------- */

/** Key in the settings table: true once the old trips got their sport (or Noah tapped «Später» this session only). */
export const OLD_TRIPS_DONE = 'sportsOldTrips';

/** 4b: the suggestion by bike and days: more days → Bikepacking, else by the bike's type, else Fahrrad. */
export function suggestSport(trip, bikes = []) {
  if ((Number(trip?.days) || 1) > 1) return 'bikepacking';
  const s = typeSport(bikes.find((b) => b.id === trip?.bikeId));
  return s ?? CYCLING;
}

/** The old bike trips without a sport, newest first, each with its suggestion. */
export function oldTripSuggestions(trips = [], bikes = []) {
  return trips
    .filter((x) => hasBike(x) && domainOf(x) === BIKEPACKING && !SPORT[x.sport] && !x.skipped)
    .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))
    .map((trip) => ({ trip, sport: suggestSport(trip, bikes) }));
}

/** The sport chips of a new trip: is the key one of the sports (else an area behind «+ Andere»)? */
export const isSport = (key) => !!SPORT[key];
/** An area that is not a sport (Weekend, World trip): offered behind «+ Andere». */
export const otherAreaKeys = (areas) => areas.filter((d) => !isSport(d.key) && d.key !== BIKEPACKING && DOMAIN[d.key]).map((d) => d.key);

/** «Später» in the old trips window: not again until the app is opened again (kept in memory only). */
export const oldTripsLater = { v: false };
