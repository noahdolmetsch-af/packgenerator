/**
 * Paket N #68 «Projekt-Ablage als Seite in der App» (19.10.2026): Ich › Was kommt (#/me/next) shows
 * the packages of the plan (notes/plan-wuensche-2026-10-19, docs/projektstand.md) in their order:
 * what is live, what is being built, what comes next. Only names and short texts, no private data.
 *
 * Update rule (bundler): when a package goes live, set its `version`; a package counts as live once
 * the app's own version reaches it. `work: true` marks packages being built now.
 * Titles and texts are English keys for t(). Pure, tested in tests/wascommt.test.js.
 */

/** The packages in the order they go live (Noah 19.10.2026: E → C → F, then G L P N Q, then the rest). */
export const PACKAGES = [
  { key: 'E', title: 'Gear, bikes and reminders', sub: 'Enter data, building blocks, Garmin, bags, birthdays and plants, ski tours.', version: '0.149.0', work: true },
  { key: 'C', title: 'Today and Active', sub: 'The new Today, daily check as its own window, balance ring, routine, insights.', version: null, work: true },
  { key: 'F', title: 'Plan the week', sub: 'The week with your Google calendar, weather and load; a walk-through.', version: null, work: true },
  { key: 'G', title: 'Data comes by itself', sub: 'Strava, Fitbit, calendar and lake fill the app without typing.', version: null, work: true },
  { key: 'L', title: 'Toolbox', sub: 'Edit PDFs and photos, calculator, converter, split costs, keep files and links.', version: null, work: true },
  { key: 'P', title: 'What does me good', sub: 'Small experiments, good combinations, a well-being area (observation only).', version: null, work: true },
  { key: 'N', title: 'Plans and dreams', sub: 'Dream tours with a season, races as event tours, goals in steps, linked notes.', version: null, work: true },
  { key: 'Q', title: 'A clearer app', sub: 'Missing buttons, hidden functions, empty texts, understandable errors.', version: null, work: true },
  { key: 'H', title: 'Easier packing', sub: 'Start lists per kind of trip, gear on the computer, read aloud.', version: null },
  { key: 'J', title: 'Mountain, snow and emergency', sub: 'Freezing level, slope, emergency call, emergency QR.', version: null },
  { key: 'K', title: 'On the bike', sub: 'Train home, handlebar view, glove mode, eating reminder.', version: null },
  { key: 'M', title: 'Learn from trips', sub: 'Sort the debrief, chronicle map, new ground, observations with charts.', version: null },
  { key: 'O', title: 'Sports', sub: 'One colour per sport, the same building blocks, helpers per sport.', version: null },
  { key: 'I', title: 'Bikes under control', sub: 'The same parts template for every bike, workshop crib offline.', version: null },
  { key: 'R', title: 'Other people and money', sub: 'Pro version, appointments, content of others. Needs your decision first.', version: null },
];

/** -1, 0 or 1 for two versions «0.149.0». */
export function cmpVersion(a = '0', b = '0') {
  const x = String(a).split('.').map(Number);
  const y = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return d < 0 ? -1 : 1;
  }
  return 0;
}

/**
 * The packages in three groups for the page: { live, work, later }, each in plan order.
 * live: a version the app already has; work: being built; later: planned.
 */
export function packagesNow(appVersion, list = PACKAGES) {
  const out = { live: [], work: [], later: [] };
  for (const p of list) {
    if (p.version && cmpVersion(p.version, appVersion) <= 0) out.live.push(p);
    else if (p.work) out.work.push(p);
    else out.later.push(p);
  }
  return out;
}
