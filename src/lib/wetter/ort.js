/**
 * The name of a place for the weather page (Wetterseite aufräumen, Noah 23.11.2026): the home place is saved the way the
 * place search wrote it («Zurich, Canton of Zurich, Switzerland»). The page shows the place itself, in German where the
 * German name is common («Zürich»). The saved name stays as it is; only the shown text is shorter.
 */
import { lang as UI } from '../i18n.svelte.js';

const DE = {
  zurich: 'Zürich',
  geneva: 'Genf',
  lucerne: 'Luzern',
  berne: 'Bern',
  basle: 'Basel',
  'st. gallen': 'St. Gallen',
  fribourg: 'Freiburg',
  neuchatel: 'Neuenburg',
  'neuchâtel': 'Neuenburg',
  biel: 'Biel/Bienne',
  chur: 'Chur',
  sion: 'Sitten',
  delemont: 'Delsberg',
  'delémont': 'Delsberg',
  lugano: 'Lugano',
  davos: 'Davos',
};

const SEARCH_TAIL = /,\s*(Canton of|Kanton|Switzerland|Schweiz|Liechtenstein|Germany|Italy|France|Austria)/i;

/**
 * «Zurich, Canton of Zurich, Switzerland» → «Zürich». Only a name that ends like a place search result is cut; a name
 * somebody typed («Furka, Oberalp») stays as typed. null → ''.
 */
export function shortPlace(name, lang = UI.v) {
  const full = String(name ?? '').trim();
  if (!full) return '';
  const first = SEARCH_TAIL.test(full) ? full.split(',')[0].trim() : full;
  return lang === 'de' ? DE[first.toLowerCase()] ?? first : first;
}
