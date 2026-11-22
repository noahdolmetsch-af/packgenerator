import { t } from '../i18n.svelte.js';
import { hoursMin } from './exact.js';

/**
 * «Vergleich» (Noah 21.11.2026, Punkt 1 «alle sieben»): under the numbers of a bar, one line says how it stands against the year
 * before or, without a year before, against the mean of the bars. Only when both values are real; never against a gap.
 * Times in minutes: «2 h 5 min more than the year before».
 */
export function againstYear(now, before) {
  if (!Number.isFinite(now) || !Number.isFinite(before)) return '';
  const d = Math.round(now - before);
  if (d === 0) return t('The same as the year before');
  return d > 0 ? t('{d} more than the year before', { d: hoursMin(d) }) : t('{d} less than the year before', { d: hoursMin(-d) });
}

/** Against the mean of a list of numbers; within 5 % it is «about your average». */
export function againstMean(now, list) {
  const real = list.filter((v) => Number.isFinite(v));
  if (!Number.isFinite(now) || real.length < 3) return '';
  const mean = real.reduce((s, v) => s + v, 0) / real.length;
  if (!(mean > 0)) return '';
  const f = now / mean;
  return f > 1.05 ? t('Above your average') : f < 0.95 ? t('Below your average') : t('About your average');
}
