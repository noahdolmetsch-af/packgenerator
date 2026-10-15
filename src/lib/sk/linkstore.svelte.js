/**
 * SK: the own links and the switched-off kinds, read once for the whole app (one query, however many
 * «Woanders» rows a page shows, e.g. one per wish).
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { LINKS_KEY, OFF_KEY } from './links.js';

export const skLinks = $state({ own: {}, off: [] });
let sub = null;

export function watchLinks() {
  if (sub) return;
  sub = liveQuery(() => db.settings.bulkGet([LINKS_KEY, OFF_KEY])).subscribe({
    next: ([a, b]) => {
      skLinks.own = a?.value ?? {};
      skLinks.off = b?.value ?? [];
    },
    error: () => {},
  });
}
