/**
 * Paket L «Werkzeugkasten» (#149 Kompass): the heading from the phone's sensor, as degrees and a
 * direction. Pure, tested in tests/werkzeugkasten.test.js.
 */
export const DIRECTIONS = ['N|compass', 'NE|compass', 'E|compass', 'SE|compass', 'S|compass', 'SW|compass', 'W|compass', 'NW|compass'];

/** 0–359, whole degrees. */
export const norm = (deg) => ((Math.round(deg) % 360) + 360) % 360;

/** The direction (English key for t(), e.g. «NE|compass») of a heading. */
export const directionOf = (deg) => DIRECTIONS[Math.round(norm(deg) / 45) % 8];

/**
 * The heading of a deviceorientation event: iPhone gives webkitCompassHeading, Android gives
 * alpha (counter-clockwise) when the event is absolute. null when it is not known.
 */
export function headingOf(e) {
  if (!e) return null;
  if (typeof e.webkitCompassHeading === 'number') return norm(e.webkitCompassHeading);
  if (typeof e.alpha === 'number' && (e.absolute || e.type === 'deviceorientationabsolute')) return norm(360 - e.alpha);
  return null;
}
