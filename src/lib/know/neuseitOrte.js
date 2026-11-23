/**
 * «Bilder bei jeder Neuheit» PR 3: the news since a version grouped by the place they are in (Heute, Woche, Touren, Velos und
 * Material, Auswerten, Wetter, Ich), for the window of the card «N Neuheiten seit …» (know/NeuSeitSheet.svelte). A line with no
 * place of its own (a repair that leads nowhere) goes to «More places». Pure, tested in tests/neuseit.test.js.
 */
import { goOf, hrefOf } from './newsgo.js';
import { compareVersions } from '../whatsnew.js';
import { pageOf, placeOf, ALL_PLACES } from '../nav.js';

/** The key of the group of lines with no place. */
export const ELSEWHERE = 'elsewhere';

/** The place key of a line, or ELSEWHERE. */
export function placeOfLine(p) {
  const href = hrefOf(goOf(p));
  if (!href) return ELSEWHERE;
  const place = placeOf(pageOf(href), href);
  return place === 'quick' ? 'today' : (place ?? ELSEWHERE);
}

/** The English key (for t()) of a place's name. */
export const placeLabel = (key) => ALL_PLACES.find((x) => x.key === key)?.label ?? 'More places|news';

/**
 * Groups the lines of the full entries after `from`: [{ key, label, items: [{ id, version, date, line, p, bild }] }], the group
 * with the most lines first, «More places» last. `line` counts from 1 (main points, then small things) like the picture files.
 * bild: { vorher } when the line has a picture, else null.
 */
export function groupByPlace(entries, from) {
  const groups = new Map();
  for (const e of entries) {
    if (from != null && compareVersions(e.version, from) <= 0) continue;
    [...(e.points ?? []), ...(e.small ?? [])].forEach((p, i) => {
      const key = placeOfLine(p);
      const b = e.bilder?.find((x) => x.line === i + 1);
      if (!groups.has(key)) groups.set(key, { key, label: placeLabel(key), items: [] });
      groups.get(key).items.push({ id: e.id, version: e.version, date: e.date, line: i + 1, p, bild: b ? { vorher: !!b.vorher } : null });
    });
  }
  return [...groups.values()].sort((a, b) => (a.key === ELSEWHERE) - (b.key === ELSEWHERE) || b.items.length - a.items.length);
}
