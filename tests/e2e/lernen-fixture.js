// Paket M «Aus Touren lernen» (Chronik-Karte, Gelernt, Jahr als Bildgeschichte): fictional trips, debriefs,
// rides, learnings and settings around a given «today» (YYYY-MM-DD, a calendar day in Europe/Zurich).
// Used by tests/chronik.test.js, tests/gelernt.test.js, tests/jahrstory.test.js and tests/e2e/lernen.spec.js.
// Dates are calendar-day arithmetic on the day string, never Date.now() + n * 864e5.
export const P = 'test_data_gtp_lern_'; // the fixture mark (testname.js FIXTURE_MARK): never taken for a test trip

/** The calendar day n days from iso. */
export const addDays = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** The same day n years earlier (29 February → 28). */
export const yearsBack = (iso, n) => `${Number(iso.slice(0, 4)) - n}${iso.slice(4)}`.replace(/-02-29$/, '-02-28');
/** Another day of the same month (not today's day). */
export const otherDayOfMonth = (iso) => `${iso.slice(0, 8)}${iso.slice(8, 10) === '03' ? '05' : '03'}`;

const line = (lat, lon, n = 12, dLat = 0.01, dLon = 0.015) => Array.from({ length: n }, (_, i) => [Math.round((lat + i * dLat) * 1e5) / 1e5, Math.round((lon + Math.sin(i / 2) * dLon) * 1e5) / 1e5]);
const at = (day, h = 18) => `${day}T${String(h).padStart(2, '0')}:00:00.000Z`;

/**
 * The tables: { trips, debriefs, rides, learnings, items, settings } and the days used.
 * - «Jurahöhen» (2 days) exactly one year ago, with a saved debrief (note, km, template and «stays at home»)
 * - «Feierabendrunde», a ride on its own, exactly one year ago
 * - «Seenrunde» two years ago in the same month (another day)
 * - this year: «Frühlingsschlaufe», «Passfahrt» (the longest) and «Herbstrunde», 10/40/70 days back
 */
export function lernenData(today) {
  const ago1 = yearsBack(today, 1);
  const ago2 = otherDayOfMonth(yearsBack(today, 2));
  const c1 = addDays(today, -70);
  const c2 = addDays(today, -40);
  const c3 = addDays(today, -10);
  const trip = (id, title, startDate, days, extra = {}) => ({ id: `${P}${id}`, title: `${P}${title}`, startDate, days, bikeId: `${P}bike`, entries: [{ itemId: `${P}it1`, slot: 'seat', qty: 1 }, { itemId: `${P}it2`, slot: 'seat', qty: 1 }], status: 'done', finished: true, ...extra });
  const trips = [
    trip('jura', 'Jurahöhen', ago1, 2, { route: { km: 130, gainM: 2100, line: line(47.2, 7.0) } }),
    trip('seen', 'Seenrunde', ago2, 1, { route: { km: 60, gainM: 400, line: line(47.0, 8.3, 8) } }),
    trip('fruehling', 'Frühlingsschlaufe', c1, 1, { route: { km: 55, gainM: 600, line: line(47.4, 8.5, 10) } }),
    trip('pass', 'Passfahrt', c2, 3, { route: { km: 240, gainM: 4200, line: line(46.6, 8.6, 14, 0.02) } }),
    trip('herbst', 'Herbstrunde', c3, 1, { route: { km: 80, gainM: 900, line: line(47.3, 8.0, 10) } }),
  ];
  const debrief = (id, doneDay, o = {}) => ({ tripId: `${P}${id}`, status: 'done', weather: 'planned', amount: 'right', bags: 'fine', note: '', items: {}, missing: [], applied: [], km: null, kmApplied: 0, createdAt: at(doneDay, 8), updatedAt: at(doneDay), doneAt: at(doneDay), ...o });
  const debriefs = [
    debrief('jura', addDays(ago1, 2), { note: 'Zu viel Werkzeug dabei.\nDas zweite Mal leichter.', km: 132, clothing: 'cold', items: { [`${P}it1`]: 'unused' }, applied: [`template:${P}tpl`, `optional:${P}it1`] }),
    debrief('seen', addDays(ago2, 1), { note: 'Wunderbar ruhig am Wasser.', km: 64, amount: 'much' }),
    debrief('fruehling', addDays(c1, 1), { note: 'Regenjacke war genau richtig.', km: 56, items: { [`${P}it2`]: 'unused' } }),
    debrief('pass', addDays(c2, 3), { note: 'Lange Abfahrten, kalte Finger.', km: 245, clothing: 'cold', missing: [{ id: 'm1', name: 'Handschuhe', itemId: null }], items: { [`${P}it2`]: 'unused' } }),
    debrief('herbst', addDays(c3, 1), { note: 'Alles passte.', km: 81, clothing: 'fit', applied: [`template:${P}tpl`, `cold:${P}it2`], items: { [`${P}it2`]: 'unused' } }),
  ];
  const rides = [{ id: `${P}ride1`, name: `${P}Feierabendrunde`, date: ago1, km: 35, gainM: 300, movingH: 1.5, line: line(47.5, 8.7, 9) }];
  const learnings = [
    { id: 9101, topic: 'Debrief', rule: `${P}Weniger Werkzeug mitnehmen`, source: `${P}Jurahöhen`, tripId: `${P}jura`, priority: 'medium', confirmed: 0, createdAt: at(addDays(ago1, 2)) },
    { id: 9102, topic: 'Debrief', rule: `${P}Handschuhe ab 8 °C`, source: `${P}Passfahrt`, tripId: `${P}pass`, priority: 'high', confirmed: 0, createdAt: at(addDays(c2, 3)) },
    { id: 9103, topic: 'Debrief', rule: `${P}Früh losfahren`, source: `${P}Herbstrunde`, tripId: `${P}herbst`, priority: 'medium', confirmed: 0, createdAt: at(addDays(c3, 1)) },
  ];
  const items = [
    { id: `${P}it1`, name: `${P}Kettennieter`, category: 'tools', weightG: 80, qty: 1, ownership: 'own', domains: ['bikepacking'] },
    { id: `${P}it2`, name: `${P}Daunenweste`, category: 'clothing', weightG: 220, qty: 1, ownership: 'own', domains: ['bikepacking'] },
  ];
  const pace = { kmh: 18.2, climbMh: 640, factor: 0.88, stops: 1.2, n: 6, rides: Array.from({ length: 6 }, (_, i) => ({ id: `${P}pace${i}`, name: `${P}Runde ${i + 1}`, date: addDays(c3, -i * 3), km: 40 + i, gainM: 400, movingH: 2.2, totalH: 2.5, use: true })), updatedAt: at(addDays(c3, 2)) };
  const settings = [{ key: 'pace', value: pace }];
  return { tables: { trips, debriefs, rides, learnings, items, settings }, days: { ago1, ago2, c1, c2, c3 }, pace };
}
