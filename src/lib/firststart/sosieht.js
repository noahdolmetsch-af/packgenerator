/**
 * «So sieht's aus» (Noah 23.11.2026 «1-5a», question 5a): on an empty main page (Trips, Pack, Gear, Bikes) the empty
 * card gets one quiet line: a small picture of what the page looks like with the sample, and «See a sample». The
 * sample is the example trip, bike and gear of the first start (Me › Data and backup › «Adjust the examples» too): it is
 * put in marked «example», never over your own data, and «Remove the examples» takes it away. Texts are English keys.
 */
export const SOSIEHT = {
  trips: { title: 'Jura loop (example)', sub: 'A 2-day trip with its packing list', hash: '#/trips', trip: false },
  pack: { title: 'Jura loop (example)', sub: 'The packing list, bag by bag', hash: '#/pack', trip: true },
  gear: { title: 'Rain jacket|play', sub: 'Every item with weight and bag', hash: '#/gear', trip: false },
  bikes: { title: 'Gravel bike (example)', sub: 'With bags, km and care', hash: '#/bikes', trip: false },
  // «Example week» (Noah 23.11.2026 «1-5a»): a week of made-up ticks, from the interest «Active and everyday»
  week: { title: 'Example week', sub: 'Ticks of the last six days', hash: '#/day', trip: false, interests: ['active'] },
};
export const SOSIEHT_AREAS = Object.keys(SOSIEHT);
/** The example trip of the first start (its id). */
export const SAMPLE_TRIP_ID = 'ex-trip';
