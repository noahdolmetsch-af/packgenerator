/**
 * «Analyse» (Noah 27.10.2026): the live data every Analyse page reads, in one place, so the tile page,
 * the page of one value (M6) and «Eigenes Diagramm» (D1–D6) see the same numbers. Reactive (runes):
 * the getters change whenever a table changes. Only for components; plain modules use catalog.js.
 */
import { liveQuery } from 'dexie';
import { fromStore } from 'svelte/store';
import { db } from '../db.js';
import { readLite } from '../actlite.js';
import { tableQuery } from '../messwerte-data.js';
import { ownBodyKeys, ownBodyDays } from '../uebersicht.js';
import { AB_KEY, configOf } from '../abfragen.js';
import { bodyExtras } from '../form-data.js';
import { kgOn } from '../weight.js';
import { weight } from '../weight.svelte.js';
import { BP_KEY, WATER_KEY, bpEntries, waterEntries, medByDay } from '../koerper.js';
import { zones } from '../strava/zones.svelte.js';
import { normAct } from '../flow.js';
import { withStrava } from './alle.js';
import { USUAL_KEY, usualMap } from '../flow/usualmin.js';
import { TICKS_KEY, prefsOf } from '../stravaticks.js';
import { localDay } from '../localday.js';
import { HEALTH_FEEL_KEY, fitFeelByDay } from '../flow/healthfeel.js';

const get = async (k) => (await db.settings.get(k))?.value ?? null;
// fromStore wants a store whose subscribe returns a function; Dexie's liveQuery returns { unsubscribe }
const store = (obs) => ({
  subscribe(run) {
    const sub = obs.subscribe({ next: run, error: () => {} });
    return () => sub.unsubscribe();
  },
});
const live = (fn) => fromStore(store(liveQuery(fn)));

/** from(): the first day the counted values (readiness, load) are needed for. */
export function analyseData({ from = () => localDay() } = {}) {
  const today = localDay();
  const q = fromStore(store(tableQuery()));
  const flow = live(async () => {
    const [acts, log, activities, usual, ticks] = await Promise.all([db.flowActs.toArray(), db.flowLog.toArray(), db.activities ? readLite(db, (T) => T.toArray()) : [], db.settings.get(USUAL_KEY), db.settings.get(TICKS_KEY)]);
    const own = acts.map(normAct).sort((a, b) => a.order - b.order);
    // the same sessions as «This week» on Heute: Strava sports without a tick count too (lib/analyse/alle.js)
    return withStrava({ acts: own, log, activities, usual: usualMap(usual?.value), map: prefsOf(ticks?.value).map });
  });
  const checks = live(() => (db.flowChecks ? db.flowChecks.toArray() : []));
  const ab = live(() => db.settings.get(AB_KEY));
  const ans = live(() => (db.abAnswers ? db.abAnswers.toArray() : []));
  const bp = live(() => get(BP_KEY));
  const water = live(() => get(WATER_KEY));
  const trips = live(() => (db.trips ? db.trips.toArray() : []));
  const hfeel = live(() => get(HEALTH_FEEL_KEY)); // the answers to the workouts of the watch (Noah 27.11.2026 «1a»)

  const table = $derived(q.current ?? new Map());
  const ownKeys = $derived(ownBodyKeys(configOf(ab.current?.value).own));
  const weights = $derived(new Map(weight.entries.map((e) => [e.day, e.kg])));
  const ctx = $derived({
    ...bodyExtras({ table, checks: checks.current ?? [], from: from(), to: today }),
    kgOn: (d) => kgOn(weight.entries, d),
    bounds: zones.bounds,
    med: medByDay(flow.current?.log ?? []),
    water: new Map(waterEntries(water.current).map((e) => [e.day, e.l])),
    bp: new Map(bpEntries(bp.current).map((e) => [e.day, e])),
    ab: ownBodyDays(ans.current ?? [], ownKeys),
    fitFeel: fitFeelByDay([...table].map(([date, r]) => ({ date, exercises: r?.fit?.exercises })), hfeel.current ?? null),
  });
  return {
    today,
    get table() {
      return table;
    },
    get ctx() {
      return ctx;
    },
    get weights() {
      return weights;
    },
    get ownKeys() {
      return ownKeys;
    },
    get acts() {
      return flow.current?.acts ?? [];
    },
    get log() {
      return flow.current?.log ?? [];
    },
    get trips() {
      return trips.current ?? [];
    },
    get loading() {
      return q.current === undefined || flow.current === undefined;
    },
  };
}
