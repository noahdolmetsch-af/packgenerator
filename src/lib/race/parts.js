/**
 * Paket U «Rennen»: the parts of a race page (#/race/<tripId>/<part>) and which of the 40 ideas each holds.
 * Labels are English keys for t(). Each part loads on its first visit (a page of its own, Tempo rule).
 */
export const PARTS = [
  { key: 'plan', title: 'Plan|race', sub: 'The whole race on one page: summary, day plan, ways, scenarios, the 40 cases' },
  { key: 'map', title: 'Map|race', sub: 'The route with its sectors, stops, your own points, the weather and the profile below' },
  { key: 'climbs', title: 'Climbs|race', sub: 'Every climb on its own: length, height, gradient per 100 m and when you are there' },
  { key: 'strategy', title: 'Strategy', sub: 'Hotel, mixed or tent side by side; every assumption yours' },
  { key: 'prepare', title: 'Prepare', sub: 'Route, stops, countdown, training, rules, kit and paperwork' },
  { key: 'route', title: 'Along the route', sub: 'Food, water, beds, trains, weather, light and climbs' },
  { key: 'ride', title: 'Race mode', sub: 'Only what you need on the bike: next stop, food, sleep or ride' },
  { key: 'after', title: 'After the race', sub: 'Sections, stops, recovery, bike check, years and the report' },
];
export const PART_KEYS = PARTS.map((p) => p.key);

/** #/race → null; #/race/trip-1 → { id, part: 'plan' }; #/race/trip-1/route → { id, part: 'route' }. */
export function raceRoute(hash = '') {
  const parts = hash.split('?')[0].split('/').slice(2).map((x) => decodeURIComponent(x));
  if (!parts[0]) return null;
  if (parts[0] === 'brief') return { id: parts[1] ?? '', part: 'brief' };
  return { id: parts[0], part: PART_KEYS.includes(parts[1]) ? parts[1] : 'plan' };
}
export const raceHref = (id, part = '') => `#/race/${encodeURIComponent(id)}${part ? `/${part}` : ''}`;
