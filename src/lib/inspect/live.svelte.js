/**
 * «Velo-Inspektion»: the live values the pure rules read, like veloimgriff.svelte.js.
 * - insp.list: the person's checklist (settings INSPECT_LIST);
 * - insp.byBike: { [bikeId]: inspectState } (both levels, the rain hint, an open draft), read by the due
 *   rules (workshop.js bikeDue: the full inspection counts like a service) and the care pages;
 * - insp.rain: the saved rain days at the home place and where the rides started (meta INSPECT_RAIN, rain.js);
 * - insp.beforeTrip: suggest the Kurzcheck before a tour (settings INSPECT_TRIP).
 * watchInspect(db) keeps them up to date (once per app start, from App.svelte); it also fetches the rain
 * once when it is older than 12 hours. Until then, and in the unit tests, nothing is known.
 */
import { liveQuery } from 'dexie';
import { INSPECT_LIST, INSPECT_RAIN, INSPECT_TRIP, normList, inspectState } from './inspect.js';
import { refreshRain, wetOf } from './rain.js';
import { kindOf } from '../bikekind.js';
import { localDay } from '../localday.js';

export const insp = $state({ list: normList(null), byBike: {}, rain: null, beforeTrip: true });

/** For tests: set the states directly. */
export const useInspect = (byBike) => (insp.byBike = byBike ?? {});

let subs = [];
export function watchInspect(db) {
  for (const s of subs) s.unsubscribe();
  subs = [
    liveQuery(() => db.settings.get(INSPECT_LIST)).subscribe({ next: (row) => (insp.list = normList(row?.value)), error: () => {} }),
    // Noah 19.10.2026 «1»: the Kurzcheck before a tour, on unless switched off (InspectPage)
    liveQuery(() => db.settings.get(INSPECT_TRIP)).subscribe({ next: (row) => (insp.beforeTrip = row?.value !== false), error: () => {} }),
    liveQuery(async () => {
      const [bikes, entries, inspections, rain] = await Promise.all([db.bikes.toArray(), db.kmBook.toArray(), db.inspections.toArray(), db.meta.get(INSPECT_RAIN)]);
      const today = localDay();
      const wetDays = wetOf(rain);
      return { rain: rain ?? null, byBike: Object.fromEntries(bikes.map((b) => [b.id, inspectState(b, { inspections, entries, wetDays, today, kind: kindOf(b) })])) };
    }).subscribe({
      next: (v) => {
        insp.byBike = v.byBike;
        insp.rain = v.rain;
      },
      error: () => {},
    }),
  ];
  refreshRain(db, { today: localDay() }).catch(() => {});
}
