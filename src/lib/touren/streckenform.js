/**
 * «Strecke als Bild» (Noah 03.11.2026, Paket E, Idee 23): every trip in the lists shows its route as a
 * small still shape, like the tiles of the Strava activities.
 *
 * The line of a row, in this order: the uploaded rides, the planned route, the Strava rides of the trip.
 * A row without any line gets no shape at all (nothing is drawn, nothing is invented).
 * Pure, tested in tests/streckenform.test.js.
 */
import { linesOf as rowLines } from '../review/inzahlen.js';
import { linesOf as actLines, miniPath } from './tour.js';

/** The size of the shape in the lists (viewBox). */
export const SHAPE_W = 64;
export const SHAPE_H = 40;

/** The lines of a row in the shape the map functions use: [{ pts }]. acts: the Strava activities of the row. */
export function shapeLines(row, acts = []) {
  const own = rowLines(row ?? {})
    .map((l) => l.filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])))
    .filter((l) => l.length > 1)
    .map((pts, i) => ({ id: `r-${i}`, pts }));
  return own.length ? own : actLines(acts ?? []);
}

/** The SVG path of a row's shape, or '' when it has no line. */
export function shapeOf(row, acts = [], w = SHAPE_W, h = SHAPE_H) {
  return miniPath(shapeLines(row, acts), w, h, 4);
}
