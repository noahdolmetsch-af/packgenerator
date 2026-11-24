/**
 * «Suche findet mehr» (Warteliste 1, V1): reads the light rows the search needs from the tables, only once something
 * is typed (Search.svelte loads this file on first use). The Dexie database is passed in; the rows go to `moreGroups`
 * (mehr.js). Health tables are never read here.
 */
import { GB_KEY, bookOf } from '../gipfelbuch.js';
import { PLAN_KEY } from '../training.js';
import { ITEMS_KEY } from '../woche.js';

/**
 * The light rows: { rides, places, learnings, visits, sessions, tasks }.
 * `activities` is read row by row (each one can hold a long line), only five fields stay.
 */
export async function loadMore(db) {
  const rides = [];
  await db.activities.each((a) => rides.push({ id: `a-${a.id}`, name: a.name, day: a.day, km: a.km, kind: a.kind, src: 'Strava' }));
  // rides of the km book that did not come from Strava (by hand, file import): Strava ones are the rows above
  await db.kmBook.each((e) => {
    if (e.kind === 'ride' && e.source !== 'strava' && e.state !== 'removed' && e.state !== 'skipped') rides.push({ id: `k-${e.id}`, name: e.name, day: e.date, km: e.km, kind: 'ride', src: e.source === 'import' ? 'file' : e.device || 'hand', gear: e.gear, bikeId: e.bikeId });
  });
  const [gb, learnings, visits, plan, items, bikes, gt] = await Promise.all([
    db.settings.get(GB_KEY),
    db.learnings.toArray(),
    db.visits.toArray(),
    db.settings.get(PLAN_KEY),
    db.settings.get(ITEMS_KEY),
    db.bikes.toArray(),
    db.gTasks.toArray(),
  ]);
  const bikeName = new Map(bikes.map((b) => [b.id, b.name]));
  for (const r of rides) if (r.bikeId) r.bike = bikeName.get(r.bikeId) ?? '';
  return {
    rides,
    places: bookOf(gb?.value).places.map((p) => ({ id: p.id, name: p.name, ele: p.ele })),
    learnings: learnings.filter((l) => !l.archived).map((l) => ({ id: l.id, topic: l.topic, rule: l.rule, action: l.action })),
    visits: visits.map((v) => ({ id: v.id, shop: v.shop, date: v.date, bike: bikeName.get(v.bikeId) ?? '', parts: (v.parts ?? []).map((p) => [p.part, p.what, p.model].filter(Boolean).join(' ')).join(' ') })),
    sessions: (plan?.value?.sessions ?? []).map((s) => ({ id: s.id, name: s.name, day: s.day, mins: s.mins })),
    tasks: [
      ...(Array.isArray(items?.value) ? items.value : []).filter((x) => x.kind === 'todo' && !x.done).map((x) => ({ id: `w-${x.id}`, title: x.title, due: x.day, own: true })),
      ...gt.filter((x) => !x.done && !x.parent).map((x) => ({ id: `g-${x.id}`, title: x.title, due: x.due, own: false })),
    ],
  };
}

