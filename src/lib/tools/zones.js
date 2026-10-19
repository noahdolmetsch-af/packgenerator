/**
 * Paket L «Werkzeugkasten» (#316 Zeitzonen): the time in other places, from the browser's own time
 * zone data (Intl), works offline. The places are the user's own: add, rename, delete (rule 18).
 * Pure, tested in tests/werkzeugkasten.test.js.
 */

/** Suggested places at the start (place names are proper names, never through t()). */
export const DEFAULT_ZONES = [
  { id: 'z1', name: 'Zürich', tz: 'Europe/Zurich' },
  { id: 'z2', name: 'London', tz: 'Europe/London' },
  { id: 'z3', name: 'New York', tz: 'America/New_York' },
  { id: 'z4', name: 'Tokyo', tz: 'Asia/Tokyo' },
];

/** All zones the browser knows (a short fallback list where it cannot list them). */
export function allZones() {
  try {
    const l = Intl.supportedValuesOf?.('timeZone');
    if (l?.length) return l;
  } catch {
    /* older browser */
  }
  return ['Europe/Zurich', 'Europe/London', 'Europe/Lisbon', 'Europe/Athens', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', 'Asia/Bangkok', 'Australia/Sydney', 'UTC'];
}

export const validZone = (tz) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

/** Minutes the zone is ahead of UTC at the moment `when`. */
export function offsetMinutes(tz, when = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(when).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute);
  return Math.round((asUtc - Math.floor(when.getTime() / 60000) * 60000) / 60000);
}

/** The difference to the home zone as text: «+7 h», «−5 h 30», «same time». */
export function diffText(tz, homeTz, when = new Date()) {
  const d = offsetMinutes(tz, when) - offsetMinutes(homeTz, when);
  if (d === 0) return '±0';
  const sign = d > 0 ? '+' : '−';
  const h = Math.floor(Math.abs(d) / 60);
  const m = Math.abs(d) % 60;
  return `${sign}${h} h${m ? ` ${String(m).padStart(2, '0')}` : ''}`;
}

/** The clock time in the zone, «14:05». */
export const timeIn = (tz, when = new Date(), loc = 'de-CH') => new Intl.DateTimeFormat(loc, { timeZone: tz, hour: '2-digit', minute: '2-digit' }).format(when);

/** The day in the zone compared with home: -1 (yesterday), 0, 1 (tomorrow). */
export function dayShift(tz, homeTz, when = new Date()) {
  const day = (z) => new Intl.DateTimeFormat('en-CA', { timeZone: z, year: 'numeric', month: '2-digit', day: '2-digit' }).format(when);
  const a = day(tz);
  const b = day(homeTz);
  return a === b ? 0 : a > b ? 1 : -1;
}

/** The last part of the zone as a suggested place name: «America/New_York» → «New York». */
export const placeOfZone = (tz) => String(tz).split('/').pop().replace(/_/g, ' ');
