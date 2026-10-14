/**
 * v0.125.0 TZ-1 «Zustand sichtbar»: the words of a trip state's small extra (tripstate.js stateExtra),
 * apart from tripstate.js so that file stays free of the language (the browser tests read it in Node).
 */
import { t, tn, locale } from './i18n.svelte.js';

/** The words of stateExtra (English keys for t(), German in i18n/de/tz1.js); '' for nothing. */
export function stateExtraText(x) {
  if (!x) return '';
  if (x.key === 'days') return tn(x.n, 'in {n} day', 'in {n} days');
  if (x.key === 'on') return new Date(`${x.date}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
  const WORDS = { today: 'Today', tomorrow: 'Tomorrow', under: 'on the way|state', ask: 'date passed', gpx: 'GPX', strava: 'Strava', draft: 'debrief started', missing: 'debrief missing' };
  return t(WORDS[x.key] ?? '');
}
