/** «Woche planen»: the words of an entry or a suggestion (the same in the week, the planning and on Heute). */
import { t, locale } from '../i18n.svelte.js';
import { KIND_NAMES as TRAIN_KINDS } from '../training.js';
import { awayName } from '../woche/away.js';
import { HOLIDAY_NAMES, SEASON_TITLES } from './kalender.js';

const TOUR_TITLES = { pack: 'Packing list: {trip}', wx: 'Check the weather: {trip}', bike: 'Bike check: {trip}' };

const dur = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${String(m % 60).padStart(2, '0')}` : ''}` : t('{n} min', { n: m }));
export const hours = dur;

/** The title of an entry (a training session without a name gets its kind). */
export const titleOf = (e) =>
  e.title ||
  (e.tour ? t(TOUR_TITLES[e.tour.what], { trip: e.tour.trip || t('Trip|week') }) : '') ||
  (e.season ? t(SEASON_TITLES[e.season]) : '') ||
  (e.sessionKind ? t(TRAIN_KINDS[e.sessionKind] ?? 'Other|kind') : e.kind === 'away' ? t('Holidays|away') : '');

/** The small line under an entry. */
export function subOf(e) {
  const s = e.sub;
  if (!s) return e.done ? t('done|week') : '';
  if (s.aktiv) return s.mins ? `${dur(s.mins)} · ${t('done in Aktiv')}` : t('done in Aktiv');
  if (s.mins) return `${dur(s.mins)}${e.done ? ` · ${t('done|week')}` : ''}`;
  if (s.src) return s.src === 'google' ? t('Google Calendar') : s.src === 'google-tasks' ? t('Google Tasks') : t('Calendar');
  if (s.away) return awayName(s.away, t);
  if (s.trip) return s.of > 1 ? t('Trip · day {n} of {m}', { n: s.trip, m: s.of }) : t('Trip|week');
  // Gesamttest 20.10.2026 B6: the bike is in the title already (the same job on two bikes)
  if (s.bike && s.named) return s.before ? t('before the holidays') : '';
  if (s.bike) return s.before ? t('{bike} · before the holidays', { bike: s.bike }) : s.bike;
  if (s.paused) return t('Paused: holidays');
  if (s.wet) return t('rain on {day}, dry here', { day: dayName(s.wet) });
  return '';
}

/** A day as «Mo 19.» (short) or «Montag, 19. Oktober» (long). */
export const dayName = (d, long = false) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), long ? { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' } : { timeZone: 'UTC', weekday: 'short', day: 'numeric' }).replace(/[.,]+(?=\s)/, '');
export const shortDate = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'numeric' });

/** The name of a public holiday (kalender.js key). */
export const holidayName = (key) => (key ? t(HOLIDAY_NAMES[key]) : '');

/** The weather of a day in words for screen readers and the small line: «dry, 14°» / «rain, 9°». */
export const wxWords = (wx) => (wx ? `${wx.wet ? t('rain|wx') : wx.dry ? t('dry|wx') : t('showers|wx')}${wx.max != null ? `, ${Math.round(wx.max)}°` : ''}` : '');

/** Last week in one line (3b). */
export function reviewLine(r) {
  if (!r) return '';
  const parts = [];
  if (r.planned) parts.push(t('{done} of {planned} sessions', { done: r.done, planned: r.planned }));
  if (r.rides) parts.push(r.mins ? `${r.km} km · ${dur(r.mins)}` : `${r.km} km`);
  if (r.todos) parts.push(r.todos === 1 ? t('1 to-do done') : t('{n} to-dos done', { n: r.todos }));
  return parts.length ? t('Last week: {list}', { list: parts.join(' · ') }) : '';
}

/** A hint on the load (2a) in words. */
export function hintText(h) {
  if (h.key === 'twoHard') return t('Two hard days in a row ({day}). An easy day between them helps you recover.', { day: dayName(h.day) });
  if (h.key === 'noRest') return t('No day without sport this week. One rest day keeps you fresh.');
  if (h.key === 'jump') return t('{pct} % more time than last week. Better to raise it slowly, about a tenth a week.', { pct: h.pct });
  return '';
}
