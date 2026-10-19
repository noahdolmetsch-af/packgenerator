/**
 * «Velo im Griff» (Noah 19.10.2026): the live values the pure care rules read, like ownlive.svelte.js.
 * - vig.tpl: the part templates per bike kind (settings PART_TEMPLATES, bikekind.js), read by care.js ensureParts;
 * - vig.hours: the riding hours per bike (bikehours.js hourSeries), read by the due rules (workshop.js).
 * watchVeloImGriff(db) keeps both up to date (once per app start, from App.svelte). Until then, and in
 * the unit tests, the standards count: no own template, no hours known.
 */
import { liveQuery } from 'dexie';
import { PART_TEMPLATES, normTemplates } from './bikekind.js';
import { hourSeries } from './bikehours.js';

export const vig = $state({ tpl: normTemplates(null), hours: {} });

/** Take a stored template record (or null) as the live templates. */
export const useTemplates = (raw) => (vig.tpl = normTemplates(raw));
/** Take the hours per bike ({ [bikeId]: series }) as the live hours. */
export const useHours = (by) => (vig.hours = by ?? {});

let subs = [];
export function watchVeloImGriff(db) {
  for (const s of subs) s.unsubscribe();
  subs = [
    liveQuery(() => db.settings.get(PART_TEMPLATES)).subscribe({ next: (row) => useTemplates(row?.value), error: () => {} }),
    liveQuery(async () => {
      const [bikes, entries, acts] = await Promise.all([db.bikes.toArray(), db.kmBook.toArray(), db.activities.where('kind').equals('bike').toArray()]);
      // only what the hours need (the activities carry much more)
      const slim = acts.map((a) => ({ id: a.id, movingS: a.movingS, km: a.km }));
      return Object.fromEntries(bikes.map((b) => [b.id, hourSeries(b, entries, slim)]));
    }).subscribe({ next: useHours, error: () => {} }),
  ];
}
