/**
 * Paket L «Werkzeugkasten» (Strecke auf Karte messen, Noah 19.10.2026): the length of a line of points
 * tapped on the map. Pure, tested in tests/werkzeugkasten.test.js.
 */
const R = 6371008.8; // mean earth radius in metres
const rad = (d) => (d * Math.PI) / 180;

/** Metres between two points [lat, lon]. */
export function haversine(a, b) {
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Metres along the whole line. */
export const lineLength = (pts) => (pts ?? []).reduce((s, p, i) => (i ? s + haversine(pts[i - 1], p) : 0), 0);

/** «850 m» or «12.4 km». */
export const distText = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 100000 ? 1 : 0)} km`);

/** A line as a small GPX file (to load into a trip or another app). */
export function gpxOf(pts, name = 'Strecke') {
  const esc = (s) => String(s).replace(/[<&>"]/g, (c) => ({ '<': '&lt;', '&': '&amp;', '>': '&gt;', '"': '&quot;' })[c]);
  const trk = pts.map(([la, lo]) => `<trkpt lat="${la.toFixed(6)}" lon="${lo.toFixed(6)}"></trkpt>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Pack Generator" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>${esc(name)}</name><trkseg>${trk}</trkseg></trk></gpx>\n`;
}
