/**
 * «Rennatlas» map (Noah 24.11.2026 «richtige Karte», Mockup 3): the pure geometry of the three zoom levels
 * (Europe, the wider region of the races, the close-up), the dashed frame of the next zoom and the scale bar.
 * No page, no data: tested in tests/atlas-geo.test.js. Coordinates are degrees; a map is W × H units wide
 * (the picture is scaled to the screen, so sizes that must stay readable are divided by the scale).
 * Wide screens get a wide picture, a phone a nearly square one (like the mockup).
 */
export const SHAPES = { wide: { W: 800, H: 520 }, narrow: { W: 500, H: 520 } };
const KM_PER_DEG = 111.19;

/** A view that holds a box of degrees, widened to the shape of the picture. */
export function fitBox(la0, la1, lo0, lo1, S = SHAPES.wide) {
  const k = Math.cos((((la0 + la1) / 2) * Math.PI) / 180);
  let w = (lo1 - lo0) * k;
  let h = la1 - la0;
  const want = S.W / S.H;
  if (w / h < want) {
    const nw = h * want;
    lo0 -= (nw - w) / 2 / k;
    lo1 += (nw - w) / 2 / k;
    w = nw;
  } else {
    const nh = w / want;
    la0 -= (nh - h) / 2;
    la1 += (nh - h) / 2;
    h = nh;
  }
  return { la0, la1, lo0, lo1, k, w, h, W: S.W, H: S.H };
}

/** A view that holds the points ({ lat, lon }), padded by `pad` degrees and at least `minSpan` degrees high. */
export function viewOf(pts, pad, minSpan = 0, S = SHAPES.wide) {
  const lats = pts.map((p) => p.lat);
  const lons = pts.map((p) => p.lon);
  let la0 = Math.min(...lats) - pad;
  let la1 = Math.max(...lats) + pad;
  const h = la1 - la0;
  if (h < minSpan) {
    la0 -= (minSpan - h) / 2;
    la1 += (minSpan - h) / 2;
  }
  return fitBox(la0, la1, Math.min(...lons) - pad, Math.max(...lons) + pad, S);
}

/** Zoom 1: Europe from Portugal to Ukraine, Britain to Greece. */
export const europeOf = (S = SHAPES.wide) => fitBox(36, 62, -11, 36, S);

/** A start place that Europe's map holds (the others stand only in the list). */
export const inEurope = (p) => p.lon > -25 && p.lon < 45 && p.lat > 30 && p.lat < 72;

/** The points that lie close together the most (within dLat × dLon degrees of one of them): the heart of the zoom levels. */
export function clusterOf(pts, dLat = 3.2, dLon = 5.5) {
  let best = [];
  for (const c of pts) {
    const near = pts.filter((p) => Math.abs(p.lat - c.lat) < dLat && Math.abs(p.lon - c.lon) < dLon);
    if (near.length > best.length) best = near;
  }
  return best;
}

/** The three views of a set of points in Europe: { 1: Europe, 2: wider region, 3: close-up }, or null. */
export function levelsOf(pts, S = SHAPES.wide) {
  if (!pts.length) return null;
  const heart = clusterOf(pts);
  const tight = clusterOf(heart, 1.6, 2.6); // the densest part of the heart: the close-up, inside the wider view
  return { 1: europeOf(S), 2: viewOf(heart, 4.2, 9, S), 3: viewOf(tight, 0.9, 3, S) };
}

export const px = (v, lon) => (((lon - v.lo0) * v.k) / v.w) * v.W;
export const py = (v, lat) => ((v.la1 - lat) / v.h) * v.H;
export const inView = (v, lat, lon, margin = 0) => {
  const mx = (v.lo1 - v.lo0) * margin;
  const my = (v.la1 - v.la0) * margin;
  return lon >= v.lo0 + mx && lon <= v.lo1 - mx && lat >= v.la0 + my && lat <= v.la1 - my;
};

/** The dashed rectangle of the next zoom's view on this map, in map units. */
export function frameOf(v, next) {
  const x = px(v, next.lo0);
  const y = py(v, next.la1);
  return { x, y, w: px(v, next.lo1) - x, h: py(v, next.la0) - y };
}

/** A round length for the scale bar: the longest of 1, 2, 5 × 10ⁿ km that is at most `maxUnits` long. */
export function scaleOf(v, maxUnits = 170) {
  const per = (v.h * KM_PER_DEG) / v.H;
  let km = 1;
  for (const base of [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000]) if (base / per <= maxUnits) km = base;
  return { km, units: km / per };
}

/** Does the centre of the view lie in the Alps (the named zoom levels «The Alps» and «Switzerland and neighbours»)? */
export function inAlps(v) {
  const lat = (v.la0 + v.la1) / 2;
  const lon = (v.lo0 + v.lo1) / 2;
  return lat > 44.5 && lat < 48.8 && lon > 5 && lon < 13.5;
}
