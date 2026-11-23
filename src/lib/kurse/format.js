/** «Kursblick»: how numbers and days are written (de-CH or en-GB as the app's language says). Pure but for the locale. */
import { locale } from '../i18n.svelte.js';

export const zahl = (n, dec = 0) => (Number.isFinite(n) ? n.toLocaleString(locale() === 'de-CH' ? 'de-CH' : 'en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : '–');
export const vorzeichen = (n, dec = 0) => (n > 0 ? '+' : n < 0 ? '−' : '') + zahl(Math.abs(n), dec);
/** «Fr, 30.10.2026» from a calendar day. */
export const tagText = (day) => (day ? new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '');
/** «20. Nov. 2026» without the weekday. */
export const tagKurz = (day) => (day ? new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '');
/** The moment prices were fetched, on the device's clock: «22.11.2026, 09:12». */
export const stundeText = (iso) => (iso ? new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');

/** A short label for the middle of an axis: «20. Okt.» inside a year, «Okt. 2026» over a longer stretch. */
export const tagMitte = (day, lang = false) => (day ? new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), lang ? { month: 'short', year: 'numeric', timeZone: 'UTC' } : { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '');

/** A count of pieces or grams without needless zeros: «10», «2.5», «0.0125» (at most `max` decimals). */
export const anzahl = (n, max = 4) => (Number.isFinite(n) ? n.toLocaleString(locale() === 'de-CH' ? 'de-CH' : 'en-GB', { minimumFractionDigits: 0, maximumFractionDigits: max }) : '–');
