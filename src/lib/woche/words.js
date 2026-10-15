/** «Woche planen»: the words of an entry or a suggestion (the same in the week, the planning and on Heute). */
import { t, locale } from '../i18n.svelte.js';
import { KIND_NAMES as TRAIN_KINDS } from '../training.js';
import { AWAY_NAMES } from '../woche.js';

const dur = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${String(m % 60).padStart(2, '0')}` : ''}` : t('{n} min', { n: m }));
export const hours = dur;

/** The title of an entry (a training session without a name gets its kind). */
export const titleOf = (e) => e.title || (e.sessionKind ? t(TRAIN_KINDS[e.sessionKind] ?? 'Other|kind') : e.kind === 'away' ? t('Holidays|away') : '');

/** The small line under an entry. */
export function subOf(e) {
  const s = e.sub;
  if (!s) return e.done ? t('done|week') : '';
  if (s.mins) return `${dur(s.mins)}${e.done ? ` · ${t('done|week')}` : ''}`;
  if (s.src) return s.src === 'google' ? t('Google Calendar') : t('Calendar');
  if (s.away) return t(AWAY_NAMES[s.away]);
  if (s.trip) return s.of > 1 ? t('Trip · day {n} of {m}', { n: s.trip, m: s.of }) : t('Trip|week');
  if (s.bike) return s.before ? t('{bike} · before the holidays', { bike: s.bike }) : s.bike;
  if (s.paused) return t('Paused: holidays');
  return '';
}

/** A day as «Mo 19.» (short) or «Montag, 19. Oktober» (long). */
export const dayName = (d, long = false) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), long ? { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' } : { timeZone: 'UTC', weekday: 'short', day: 'numeric' }).replace(/[.,]+(?=\s)/, '');
export const shortDate = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'numeric' });
