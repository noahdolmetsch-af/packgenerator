/**
 * Paket O «Sportarten»: the records the two sport pages read, as one live query (activities of Aktiv
 * with their log, trips, the sport entries, the Strava activities, the settings, the home weather).
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { normAct } from '../flow.js';
import { CFG_KEY } from '../sportsbase.js';
import { HOME_PLACE, HOME_FORECAST, usable } from '../know.js';
import { SPORT_BIKES } from '../sports.js';
import { BAGS_KEY, bagsOf } from '../flowbag.js';

export function sportsQuery() {
  return liveQuery(async () => {
    const [acts, log, trips, items, activities, cfg, place, forecast, bikes, gear, sportBikes, bags] = await Promise.all([
      db.flowActs.toArray(),
      db.flowLog.toArray(),
      db.trips.toArray(),
      db.sportItems.toArray(),
      db.activities.toArray(),
      db.settings.get(CFG_KEY),
      db.settings.get(HOME_PLACE),
      db.meta.get(HOME_FORECAST),
      db.bikes.toArray(),
      db.items.filter((i) => !!i.main).toArray(),
      db.settings.get(SPORT_BIKES),
      db.settings.get(BAGS_KEY),
    ]);
    return {
      acts: acts.map(normAct).sort((a, b) => a.order - b.order),
      log,
      trips,
      items,
      activities: activities.map((a) => ({ id: a.id, day: a.day, time: a.time, type: a.type, km: a.km, movingS: a.movingS, hm: a.hm, commute: a.commute })),
      cfg: cfg?.value ?? {},
      days: usable(place?.value, forecast) ? (forecast.days ?? []) : [],
      place: place?.value ?? null,
      bikes,
      gear,
      sportBikes: sportBikes?.value ?? {},
      bags: bagsOf(bags?.value),
    };
  });
}
