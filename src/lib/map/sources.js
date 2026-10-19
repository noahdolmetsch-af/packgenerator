/**
 * Paket U2/U3 (Noah 19.10.2026 «1a 2a 3a und b möglich»): the map grounds of the race map and the
 * live map. One engine (maplibre-gl, loaded on first use) shows raster grounds (swisstopo, OSM,
 * OpenTopoMap) and the free vector map (OpenFreeMap). Each ground says whether its terms allow keeping
 * a strip of it on the device (`offline`):
 * - swisstopo: free Open Government Data with «© swisstopo»; fair use, so a narrow strip is fetched
 *   slowly and capped (offline.js), never the whole country.
 * - OpenFreeMap: no request limits, attribution required.
 * - tile.openstreetmap.org and OpenTopoMap forbid bulk or offline download: view only.
 * Pure, tested in tests/map-sources.test.js.
 */
export const SWISS_WMTS = 'https://wmts.geo.admin.ch/1.0.0';
export const OFM_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
/** The Cache Storage name that holds the strips kept for offline (public/offline-map-sw.js reads it). */
export const OFFLINE_CACHE = 'pg-offline-map';
/** Hosts whose answers the offline service worker may serve from OFFLINE_CACHE. */
export const OFFLINE_HOSTS = ['wmts.geo.admin.ch', 'tiles.openfreemap.org'];

const swiss = (layer, ext = 'jpeg') => `${SWISS_WMTS}/${layer}/default/current/3857/{z}/{x}/{y}.${ext}`;

/**
 * The grounds. kind 'raster' (url with {z}/{x}/{y}) or 'vector' (a style url).
 * name/sub are English keys for t(); swiss: only inside Switzerland.
 */
export const GROUNDS = [
  { key: 'auto', name: 'Automatic', sub: 'swisstopo in Switzerland, the free vector map elsewhere', kind: 'auto' },
  { key: 'swisstopo', name: 'National map', sub: 'swisstopo, summer', kind: 'raster', url: swiss('ch.swisstopo.pixelkarte-farbe'), attribution: '© swisstopo', maxZoom: 18, swiss: true, offline: true },
  { key: 'swisstopoWinter', name: 'Winter map', sub: 'swisstopo, with ski routes', kind: 'raster', url: swiss('ch.swisstopo.pixelkarte-farbe-winter'), attribution: '© swisstopo', maxZoom: 18, swiss: true, offline: true },
  { key: 'swissimage', name: 'Aerial photo', sub: 'swisstopo SWISSIMAGE', kind: 'raster', url: swiss('ch.swisstopo.swissimage'), attribution: '© swisstopo', maxZoom: 19, swiss: true, offline: true },
  { key: 'vector', name: 'Free map', sub: 'OpenFreeMap, all countries, can be kept offline', kind: 'vector', style: OFM_STYLE, attribution: '© OpenFreeMap © OpenMapTiles © OpenStreetMap', maxZoom: 18, offline: true },
  { key: 'osm', name: 'OpenStreetMap', sub: 'Only with the internet', kind: 'raster', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap', maxZoom: 19, offline: false },
  { key: 'topo', name: 'OpenTopoMap', sub: 'Contour lines; only with the internet', kind: 'raster', url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png', attribution: '© OpenTopoMap (CC-BY-SA) © OpenStreetMap', maxZoom: 17, offline: false },
];
export const groundOf = (key) => GROUNDS.find((g) => g.key === key) ?? GROUNDS[0];

/** Roughly Switzerland and Liechtenstein. */
export const inSwitzerland = (lat, lon) => lat >= 45.8 && lat <= 47.85 && lon >= 5.9 && lon <= 10.55;

/** The ground to show: 'auto' → swisstopo (winter map Nov–Apr) in Switzerland, else the vector map. */
export function pickGround(key, lat, lon, month = new Date().getMonth() + 1) {
  const g = groundOf(key);
  if (g.kind !== 'auto') return g;
  if (Number.isFinite(lat) && Number.isFinite(lon) && inSwitzerland(lat, lon)) return groundOf(month >= 11 || month <= 4 ? 'swisstopoWinter' : 'swisstopo');
  return groundOf('vector');
}

/** The address of one raster tile. */
export const tileUrl = (g, z, x, y) => g.url.replace('{z}', z).replace('{x}', x).replace('{y}', y);
