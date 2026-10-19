/** Merken: a day as a short word («Heute», «Morgen», «Fr., 17. Okt.»), on this device's language. */
import { t, locale } from '../i18n.svelte.js';
import { localDay } from '../localday.js';
import { addDays } from '../merken.js';

export function dayLabel(day, today = localDay()) {
  if (!day) return '';
  if (day === today) return t('Today');
  if (day === addDays(today, 1)) return t('Tomorrow');
  if (day === addDays(today, -1)) return t('Yesterday');
  const d = new Date(`${day}T12:00:00Z`);
  const near = day > today && day <= addDays(today, 6);
  return d.toLocaleDateString(locale(), near ? { weekday: 'short', timeZone: 'UTC' } : { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}
