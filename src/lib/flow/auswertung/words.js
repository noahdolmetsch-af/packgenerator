/**
 * «Auswertung wie Training»: the words of the tick cards in the current language (weekdays, months,
 * rings). The numbers come from ../auswertung.js.
 */
import { locale } from '../../i18n.svelte.js';

/** Monday … Sunday, short («Mo»). 2026-10-05 is a Monday. */
export const weekdayShort = (i) => new Date(Date.UTC(2026, 9, 5 + i, 12)).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' }).replace('.', '').slice(0, 2);
/** Monday … Sunday, long («Montag»). */
export const weekdayLong = (i) => new Date(Date.UTC(2026, 9, 5 + i, 12)).toLocaleDateString(locale(), { weekday: 'long', timeZone: 'UTC' });
/** «Okt. 2026» for '2026-10'. */
export const monthName = (m) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString(locale(), { month: 'short', year: 'numeric', timeZone: 'UTC' });
/** «5. Okt.» for a day. */
export const dayName = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', timeZone: 'UTC' });
/** The ring names, English sources for t(). */
export const RING_WORDS = { move: 'Move|ring', mind: 'Mindful|ring', rest: 'Recovery|ring' };
