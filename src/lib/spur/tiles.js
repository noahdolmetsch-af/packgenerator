/**
 * Paket S «Reise-Spur» (spec paket-s.md 3): the map ground under the tour map. In Switzerland the
 * swisstopo map (free, «© swisstopo», Web Mercator tiles of geo.admin.ch), elsewhere OpenStreetMap
 * (fair use with attribution). The same swisstopo layers as Paket J (src/lib/mountain/maplayers.js):
 * the national map, the winter map from November to April. When J is on main, the swisstopo part
 * reads J's WMTS, BASES and ATTRIBUTION, so the app keeps one place for map grounds.
 * Pure, tested in tests/spur.test.js.
 */
export const GROUNDS = {
  swisstopo: {
    key: 'swisstopo',
    name: 'swisstopo',
    url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg',
    attribution: '© swisstopo',
    maxZoom: 18,
  },
  swisstopoWinter: {
    key: 'swisstopoWinter',
    name: 'swisstopo',
    url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe-winter/default/current/3857/{z}/{x}/{y}.jpeg',
    attribution: '© swisstopo',
    maxZoom: 18,
  },
  osm: {
    key: 'osm',
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  },
};

/** Roughly Switzerland (and Liechtenstein). */
export const inSwitzerland = (lat, lon) => lat >= 45.8 && lat <= 47.85 && lon >= 5.9 && lon <= 10.55;

/** The ground for a map whose middle is at lat, lon: 'auto' picks swisstopo in Switzerland (winter map Nov–Apr, as Paket J). */
export function groundFor(lat, lon, choice = 'auto', month = new Date().getMonth() + 1) {
  const swiss = month >= 11 || month <= 4 ? GROUNDS.swisstopoWinter : GROUNDS.swisstopo;
  if (choice === 'osm') return GROUNDS.osm;
  if (choice === 'swisstopo') return swiss;
  return inSwitzerland(lat, lon) ? swiss : GROUNDS.osm;
}

/** The address of one tile. */
export const tileUrl = (ground, z, x, y) => ground.url.replace('{z}', z).replace('{x}', x).replace('{y}', y);
