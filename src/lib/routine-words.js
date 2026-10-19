/**
 * Routine «Das tut mir gut»: the words of an item in the current language. The examples are English
 * keys for t() (German in i18n/de/routine.js); a name typed stays as typed. «{time}» is filled.
 */
import { t, tn, locale } from './i18n.svelte.js';
import { WEEKDAYS, hm } from './routine.js';

export const itemName = (x) => t(x?.name ?? '', { time: hm(x?.time) || '…' });
/** A weekday in full (0 = Monday): 1 Jan 2024 was a Monday. */
export const dayLong = (w) => new Date(Date.UTC(2024, 0, 1 + w)).toLocaleDateString(locale(), { weekday: 'long', timeZone: 'UTC' });
export const dayShort = (w) => t(WEEKDAYS[w]);
/** «only on Thursday», «only Mon, Thu»; '' for every day. */
export const daysWords = (days) => (!days ? '' : days.length === 1 ? t('only on {day}', { day: dayLong(days[0]) }) : t('only {days}', { days: days.map(dayShort).join(', ') }));
export const daysN = (n) => tn(n, '{n} day', '{n} days');
