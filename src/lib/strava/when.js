/**
 * «Training»: the day of an activity in words: «Heute 17:05», «Gestern 17:05», else «Di 13.10. 17:05».
 */
import { t, locale } from '../i18n.svelte.js';
import { localDay } from '../localday.js';
import { shiftDay } from '../training.js';

export function dayWhen(day, time = '', today = localDay()) {
  const d = day === today ? t('Today|day') : day === shiftDay(today, -1) ? t('Yesterday|day') : new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'numeric' });
  return time ? `${d} ${time}` : d;
}
