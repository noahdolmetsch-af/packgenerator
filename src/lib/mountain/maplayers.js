/**
 * Paket J #161 (Noah 19.10.2026 «2a»): the swisstopo map in the app with the layers «Slopes over 30°»
 * and «Ski touring routes». The tiles come from swisstopo's free WMTS (Open Government Data, credit
 * «© swisstopo»), in Web Mercator so a plain tile map can show them. Pure, tested in
 * tests/bergnotfall.test.js; the map itself (Leaflet) loads only when the page opens (SwissMap.svelte).
 */
export const WMTS = 'https://wmts.geo.admin.ch/1.0.0';
export const ATTRIBUTION = '© swisstopo';

/** The base maps: summer and winter. */
export const BASES = [
  { key: 'winter', name: 'Winter map', layer: 'ch.swisstopo.pixelkarte-farbe-winter', ext: 'jpeg' },
  { key: 'summer', name: 'National map', layer: 'ch.swisstopo.pixelkarte-farbe', ext: 'jpeg' },
];

/** The layers on top, each one switchable. */
export const OVERLAYS = [
  { key: 'slope', name: 'Slopes over 30°', sub: 'Steep slopes in colour: from 30° (yellow) to over 45° (violet)', layer: 'ch.swisstopo.hangneigung-ueber_30', ext: 'png', opacity: 0.6, on: true },
  { key: 'ski', name: 'Ski touring routes', sub: 'The ski routes of the national map', layer: 'ch.swisstopo-karto.skitouren', ext: 'png', opacity: 1, on: true },
  { key: 'hike', name: 'Hiking trails', sub: 'Yellow, white-red-white and white-blue-white', layer: 'ch.swisstopo.swisstlm3d-wanderwege', ext: 'png', opacity: 1, on: false },
];

/** The tile address of a layer for Leaflet ({z}/{x}/{y} filled in by the map). */
export const tileUrl = (l) => `${WMTS}/${l.layer}/default/current/3857/{z}/{x}/{y}.${l.ext}`;

/** Switzerland, so the map does not wander off. */
export const CH_BOUNDS = [
  [45.7, 5.8],
  [47.9, 10.6],
];
export const CH_CENTER = [46.8, 8.2];

/** The layers on, from the saved choice (settings or localStorage); unknown keys are dropped. */
export function layersOn(saved) {
  const keys = OVERLAYS.map((o) => o.key);
  if (Array.isArray(saved)) return saved.filter((k) => keys.includes(k));
  return OVERLAYS.filter((o) => o.on).map((o) => o.key);
}

/** The base map from the month: winter from November to April, else summer; a saved choice wins. */
export function baseFor(month, saved) {
  if (BASES.some((b) => b.key === saved)) return saved;
  return month >= 11 || month <= 4 ? 'winter' : 'summer';
}

/** Where the map opens: the given point, the trip's place, or Switzerland. */
export function startView(point, place) {
  const p = [point, place].find((x) => x && Number.isFinite(x.lat) && Number.isFinite(x.lon));
  return p ? { center: [p.lat, p.lon], zoom: 13 } : { center: CH_CENTER, zoom: 8 };
}
