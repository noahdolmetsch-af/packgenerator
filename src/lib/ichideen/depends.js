/**
 * Einzelidee 35 «Abhängigkeiten einer Verbindung» (996 Ideen, Noah 25.10.2026): on Ich › Verbindungen, for
 * each connection what in the app depends on it, and where data is missing (a gap). Labels are English keys
 * for t() (the tab names of nav.js). Pure; tested in tests/ichideen.test.js.
 */
/** The address of Auswerten › Fahrten (nav.js RIDES_HREF; kept here so this module stays plain). */
const RIDES_HREF = '#/trips/rides';

/** What uses the data of each connection. */
export const DEPENDS = {
  strava: [
    { label: 'Rides|tab', href: RIDES_HREF },
    { label: 'Training|tab', href: '#/flow/training' },
    { label: 'Form|tab', href: '#/flow/form' },
    { label: 'Ticks evaluated|tab', href: '#/flow/auswertung' },
    { label: 'Bike care|dep', href: '#/bikes?tab=care' },
  ],
  fitbit: [
    { label: 'Form|tab', href: '#/flow/form' },
    { label: 'Body values', href: '#/flow/stats/hr' },
    { label: 'Insights|tab', href: '#/me/insights' },
  ],
  agenda: [
    { label: 'Week|tab', href: '#/week' },
    { label: 'Remember|tab', href: '#/calendar' },
  ],
  mail: [{ label: 'Inbox|dep', href: '#/inbox' }],
  lake: [{ label: 'Sauna and lake|dep', href: '#/flow' }],
};

const DAY = 864e5;
const dayMs = (d) => Date.parse(`${d}T12:00:00Z`);
const addDays = (d, n) => new Date(dayMs(d) + n * DAY).toISOString().slice(0, 10);
/** Whole days from an ISO moment (or day) to today. */
export const daysSince = (iso, today) => (iso ? Math.max(0, Math.round((dayMs(today) - dayMs(String(iso).slice(0, 10))) / DAY)) : null);

/**
 * The gap of a connection, or null: { kind: 'old', days } (no new data for a while) or
 * { kind: 'days', n, of } (days without values in the last `of` days, Fitbit). Only for a connection that is on.
 */
export function gapOf(key, { on = false, last = null, days = [], today, of = 14 } = {}) {
  if (!on || !today) return null;
  if (key === 'fitbit') {
    const have = new Set(days);
    let n = 0;
    for (let i = 1; i <= of; i++) if (!have.has(addDays(today, -i))) n++;
    return n ? { kind: 'days', n, of } : null;
  }
  const limit = key === 'strava' ? 7 : key === 'agenda' ? 3 : null;
  const d = daysSince(last, today);
  return limit != null && d != null && d > limit ? { kind: 'old', days: d } : null;
}
