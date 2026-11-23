import { t } from '../i18n.svelte.js';

/**
 * «Keine Daten statt 0» (Noah 21.11.2026): a bar for a time that has not come, or from before the first record,
 * is no «0 h». It says why it is empty. from/to: the first and last day of the bar, today and firstDay: «YYYY-MM-DD»
 * (firstDay null when nothing was recorded). Returns '' for a bar that really is a zero.
 */
export function noDataText(from, to, today, firstDay) {
  if (from > today) return t('Not yet');
  if (firstDay && to < firstDay) return t('No data in this period');
  return '';
}

/** The first day of a list of units or entries with a `day`, or null. */
export const firstDayOf = (list = []) => list.reduce((m, u) => (u.day && (m == null || u.day < m) ? u.day : m), null);
