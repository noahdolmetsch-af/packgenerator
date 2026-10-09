/**
 * v0.44.0: the words of the review of the last 12 months (card on Today and #/review), so both say
 * the same. The numbers come from yearreview.js.
 */
import { t, tn, num } from '../i18n.svelte.js';
import { formatWeight } from '../gear.js';

/** "+1.2 kg" / "−300 g" for a change of weight. */
export const signedWeight = (g) => (g > 0 ? `+${formatWeight(g)}` : g < 0 ? `−${formatWeight(-g)}` : formatWeight(0));

/** "+3" / "−40" for a delta (one decimal for hours). */
export const signed = (d) => `${d > 0 ? '+' : '−'}${num(Math.abs(d))}`;

/** The label of a number on the card. */
export function cardLabel(row) {
  if (row.key === 'trips') return tn(row.value, 'trip|count', 'trips|count');
  if (row.key === 'km') return t('km');
  if (row.key === 'nights') return tn(row.value, 'night outside', 'nights outside');
  if (row.key === 'days') return tn(row.value, 'trip day', 'trip days');
  return t('Base weight|change');
}
export const cardValue = (row) => (row.key === 'base' ? signedWeight(row.value) : num(row.value));

/** The one line with the most interesting fact (yearreview.js highlight). */
export function factText(h) {
  if (!h) return '';
  if (h.key === 'lighter') return t('Base weight {w} lighter than on the first trip.', { w: formatWeight(h.g) });
  if (h.key === 'moreKm') return t('{km} km more than in the 12 months before.', { km: num(Math.round(h.km)) });
  if (h.key === 'longest') return t('Longest trip: {title}, {km} km.', { title: h.title, km: num(h.km) });
  if (h.key === 'dead') return tn(h.n, '{n} item came along and was never used.', '{n} items came along and were never used.');
  if (h.key === 'learnings') return tn(h.n, '{n} learning added.', '{n} learnings added.');
  if (h.key === 'pace') return t('Your pace: {kmh} km/h.', { kmh: num(h.kmh) });
  return '';
}
