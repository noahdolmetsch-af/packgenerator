/**
 * «Inhalte Flow» IF1–IF3: the one setting behind the tip line, the fold and the tiles, live for every
 * component on the page. info() is the stored value made whole, save(next) writes it back.
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { putSetting } from '../flowdb.js';
import { PAGEINFO_KEY, infoOf, contextOf } from '../pageinfo.js';
import { HOME_PLACE, HOME_FORECAST, usable } from '../know.js';

export function pageInfo() {
  const q = liveQuery(() => db.settings.get(PAGEINFO_KEY));
  let v = $state(undefined);
  let loaded = $state(false);
  $effect(() => {
    const sub = q.subscribe({ next: (x) => ((v = x?.value), (loaded = true)) });
    return () => sub.unsubscribe();
  });
  return {
    get info() {
      return infoOf(v);
    },
    get loaded() {
      return loaded;
    },
    /** Change the stored value with fn(stored) → next, read and written in one transaction, so two quick taps never undo each other; fn may return null (nothing to save). */
    save: (fn) =>
      db.transaction('rw', db.settings, async () => {
        const next = fn((await db.settings.get(PAGEINFO_KEY))?.value);
        if (next) await putSetting(db, PAGEINFO_KEY, next);
        return next;
      }),
  };
}

/**
 * «Passt zu heute» WD3: what kind of day it is (contextOf), from the saved home forecast (never fetched
 * here), today's activity log and the trips.
 */
export function dayContext(today) {
  const q = liveQuery(async () => {
    const [place, forecast, log, trips] = await Promise.all([db.settings.get(HOME_PLACE), db.meta.get(HOME_FORECAST), db.flowLog.where('day').equals(today).toArray(), db.trips.toArray()]);
    const day = usable(place?.value, forecast) ? (forecast.days?.find((d) => d.date === today) ?? null) : null;
    return contextOf({ day, log, trips }, today);
  });
  let v = $state({});
  $effect(() => {
    const sub = q.subscribe({ next: (x) => (v = x ?? {}) });
    return () => sub.unsubscribe();
  });
  return {
    get ctx() {
      return v;
    },
  };
}
