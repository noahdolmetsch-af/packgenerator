/**
 * «Live-Karte und Rennen sichtbar» (Noah 24.10.2026 «2b», 25.10.2026 «bitte fortfahren»): before the start the live map
 * says what it can do during the ride, under the names of «What the app can do» (features.js), so search, catalogue
 * and page say the same. Only words: everything listed opens once the ride runs.
 */
/** [{ id, sub }]; the name comes from features.js by id. */
export const DURING_RIDE = [
  { id: 'f.datapages', sub: 'swipe from the map to your numbers and charts' },
  { id: 'f.laps', sub: 'the lap button, and your earlier time on the same route' },
  { id: 'f.livepause', sub: 'one tap, or by itself when you stand' },
  { id: 'f.sensors', sub: 'heart rate, power and cadence' },
  { id: 'f.turns', sub: 'arrow and voice before each turn, with a route' },
  { id: 'f.reroute', sub: 'to a shop, a bed or a station' },
  { id: 'f.moreplaces', sub: 'your radius and your own kinds' },
  { id: 'f.ovnear', sub: 'stops nearby and their next departures' },
  { id: 'f.postcard', sub: 'after the ride, one picture to share' },
];
