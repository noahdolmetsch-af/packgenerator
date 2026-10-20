/**
 * «Form und Erholung»: the sentences of the card and the page (English source, German via t()).
 */
import { shown } from '../../messwerte.js';
import { t, tn, num } from '../../i18n.svelte.js';

export const LEVEL = {
  rest: { word: 'Rest|form', line: 'Today suits a rest day or an easy walk.' },
  easy: { word: 'Easy|form', line: 'Today suits an easy ride, nothing hard.' },
  normal: { word: 'Normal|form', line: 'Today suits a normal training.' },
  hard: { word: 'Ready|form', line: 'Today suits a hard or long ride.' },
};
export const levelWord = (l) => t(LEVEL[l]?.word ?? LEVEL.normal.word);
export const levelLine = (l) => t(LEVEL[l]?.line ?? LEVEL.normal.line);

/** One sentence per part: what it is today against your normal. */
export function partText(p) {
  if (!p) return '';
  const n = Math.abs(p.delta);
  switch (p.key) {
    case 'rhr':
      return p.delta > 0 ? t('Resting pulse {n} above your normal.', { n: num(n) }) : p.delta < 0 ? t('Resting pulse {n} below your normal.', { n: num(n) }) : t('Resting pulse as usual.');
    case 'hrv':
      return p.delta > 0 ? t('HRV {n} % above your normal.', { n: num(n) }) : p.delta < 0 ? t('HRV {n} % below your normal.', { n: num(n) }) : t('HRV as usual.');
    case 'sleep':
      return t('Slept {time}.', { time: shown('sleep', p.v, num) });
    case 'feltSleep':
      return t('Your sleep felt {n} of 10.', { n: num(p.v) });
    case 'energy':
      return t('Your energy felt {n} of 10.', { n: num(p.v) });
    case 'form':
      return p.v < -5 ? t('The last days were hard: fatigue is above fitness.') : p.v > 5 ? t('You are fresh: fitness is above fatigue.') : t('Load and recovery are balanced.');
    default:
      return '';
  }
}
export const PART_NAMES = { rhr: 'Resting pulse', hrv: 'HRV', sleep: 'Sleep|metric', feltSleep: 'Sleep, felt', energy: 'Energy, felt', form: 'Form|form' };

/** The tour line of the card: before or during a trip. */
export function tourText(tour) {
  if (!tour) return '';
  const name = tour.trip.title || t('your tour');
  if (tour.phase === 'during') {
    const r = tour.days.find((d) => !d.future && d.day === tour.days[tour.dayNo - 1]?.day)?.rhr;
    return [t('Tour day {n} of {m}: «{name}».', { n: tour.dayNo, m: tour.days.length, name }), r != null ? t('Resting pulse today {n}.', { n: num(r) }) : ''].filter(Boolean).join(' ');
  }
  return tour.inDays === 1 ? t('«{name}» starts tomorrow: keep today easy and sleep well.', { name }) : tn(tour.inDays, '«{name}» starts in {n} day: easy days now keep you fresh.', '«{name}» starts in {n} days: easy days now keep you fresh.', { name });
}
