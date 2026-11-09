/**
 * «Tour-Pfad» (Tour von A bis Z, Schritt 1): the words of the path. tourStand (stand.js) decides the state of every
 * row and brings the numbers (facts); this file turns a row into its title and one quiet line. Every text goes through
 * t(); a row without data says what to do, never «fine». Tested in tests/tourpfad.test.js.
 */
import { t, tn, num, locale } from '../i18n.svelte.js';

/** Titles of the four phases. */
export const PHASE_TITLE = () => ({
  planen: t('Planning|phase'),
  vorbereiten: t('Preparing'),
  unterwegs: t('On the way'),
  danach: t('Afterwards'),
});

const when = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' }) : '');

/** → { title, line } of a row of tourStand. `line` may be ''. */
export function rowWords(row) {
  const f = row.facts ?? {};
  const s = row.state;
  switch (row.key) {
    case 'ziel':
      return { title: t('Goal and date'), line: f.date ? when(f.date) : t('Set a start day') };
    case 'route':
      return { title: t('Route'), line: f.km ? t('{n} km', { n: num(Math.round(f.km)) }) : t('No route yet|path') };
    case 'wetter':
      return { title: t('Weather'), line: s === 'done' ? t('Forecast saved') : t('Check the weather') };
    case 'anreise':
      return { title: t('Arrival and stay'), line: s === 'done' ? t('Decided') : t('Not decided yet') };
    case 'etappen':
      return { title: t('Stages|path'), line: s === 'done' ? tn(f.days, '{n} stage planned', '{n} stages planned') : s === 'part' ? t('Route is there, stages are not') : t('Not planned yet') };
    case 'verpflegung':
      return { title: t('Food and drink'), line: t('Plan food and drink') };
    case 'koerper':
      return { title: t('Body'), line: f.form === 'good' ? t('Form is good') : f.form === 'ok' ? t('Form is fine') : f.form === 'low' ? t('Form is low, go easy') : t('Look at your form') };
    case 'koerper-tour':
      return { title: t('Body and tour'), line: tn(f.days, 'Tour ≈ {n} day × {km} km, your longest: {longest} km', 'Tour ≈ {n} days × {km} km, your longest: {longest} km', { km: f.perDay, longest: f.longestKm }) };
    case 'velo':
      return { title: t('Bike'), line: f.careDue > 0 ? tn(f.careDue, '{n} care point due', '{n} care points due') : f.careDue === 0 ? t('Care is up to date') : t('Look at the care of your bike') };
    case 'packen':
      return { title: t('Packing'), line: f.total ? t('{p} of {n} packed', { p: f.packed, n: f.total }) : t('The packing list is empty') };
    case 'letzte24':
      return { title: t('Last 24 hours'), line: s === 'later' ? t('From the day before the start') : t('{p} of {n} done', { p: f.done, n: f.total }) };
    case 'losfahren':
      return { title: t('Set off'), line: s === 'done' ? t('You are on your way') : t('On the first day') };
    case 'ankommen':
      return { title: t('Arrive'), line: s === 'done' ? t('Arrived') : t('When you are there|path') };
    case 'rueckblick':
      return { title: t('Debrief'), line: s === 'done' ? t('Saved') : t('Not written yet') };
    case 'fahrt':
      return { title: t('Match the ride'), line: s === 'done' ? t('Ride matched') : t('Upload or match a ride') };
    default:
      return { title: row.key, line: '' };
  }
}

/** The state of a phase as a short word for its header, e.g. «3 von 5». */
export const phaseCount = (p) => (p.total ? t('{p} of {n}', { p: p.done, n: p.total }) : '');

/** The line over the path: «Schritt 2 von 4 · Vorbereiten», or the end states. */
export function headLine(stand) {
  if (stand.phase === 'ausgefallen') return t('This tour is not riding');
  if (stand.phase === 'fertig') return t('Done: the debrief is saved');
  if (!stand.phase) return '';
  return t('Step {n} of {m}', { n: stand.n, m: stand.total }) + ' · ' + PHASE_TITLE()[stand.phase];
}
