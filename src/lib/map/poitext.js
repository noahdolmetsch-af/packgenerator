/**
 * «Orte auf der Karte»: the shown words of a place (through t(); OSM names stay as they are).
 */
import { t, num } from '../i18n.svelte.js';
import { openAt } from '../race/outside.js';
import { CATEGORY, SUB_NAMES, labelOf } from './poisearch.js';

/**
 * The kind in words: the sub kind when we know a nicer one, else your name for the kind (catName: an own
 * kind or a renamed chip, never through t()), else the app's name.
 */
export const kindText = (p) => (p?.catName && !SUB_NAMES[p?.sub] ? p.catName : t(labelOf(p)));
/** The category in words. */
export const catText = (key) => t(CATEGORY[key]?.name ?? 'Place|poi');
/** The name, else the kind. */
export const titleOf = (p) => p?.name || kindText(p);

/** km in words: under 1 km in metres. */
export function kmText(km) {
  if (!Number.isFinite(km)) return '';
  if (km < 1) return t('{m} m', { m: num(Math.max(10, Math.round((km * 1000) / 10) * 10)) });
  return t('{km} km', { km: num(km < 10 ? Math.round(km * 10) / 10 : Math.round(km)) });
}

/** The distance of a place with d = distanceOf(): along the route when known, else straight. */
export function distText(d) {
  if (!d) return '';
  if (d.along != null) return d.along >= 0 ? t('{km} ahead|poi', { km: kmText(d.along) }) : t('{km} behind|poi', { km: kmText(-d.along) });
  if (d.km != null) return kmText(d.km);
  if (d.atKm != null) return t('at km {km}|poi', { km: num(Math.round(d.atKm)) });
  return '';
}

/** Open now? → { state: 'open' | 'closed' | 'unknown', text } */
export function openText(hours, now = new Date()) {
  const s = openAt(hours, now);
  if (s.open === true) return { state: 'open', text: s.closes ? t('Open, closes {time}|poi', { time: s.closes }) : t('Open now|poi') };
  if (s.open === false) {
    if (!s.opens) return { state: 'closed', text: t('Closed now|poi') };
    return { state: 'closed', text: s.inDays === 1 ? t('Closed, opens tomorrow {time}|poi', { time: s.opens }) : s.inDays > 1 ? t('Closed, opens in {n} days at {time}|poi', { n: s.inDays, time: s.opens }) : t('Closed, opens {time}|poi', { time: s.opens }) };
  }
  return { state: 'unknown', text: '' };
}
