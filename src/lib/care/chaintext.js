/** «Kette vorausschauend»: the title of a chain step (lib/chainplan.js), for the page «Wear» and the short card. */
import { t } from '../i18n.svelte.js';

export const tripName = (s) => s.trip?.name || t('your next trip');

export function stepTitle(s) {
  if (s.kind === 'replace') return t('Replace the chain');
  if (s.kind === 'trip') return s.when === 'before' ? t('New chain before «{trip}»', { trip: tripName(s) }) : t('The chain runs out during «{trip}»', { trip: tripName(s) });
  if (s.kind === 'soon') return t('New chain soon');
  if (s.kind === 'measure') return t('Measure the chain');
  return t('Oil the chain');
}
