/**
 * «Bilder bei jeder Neuheit» PR 3 (Noah 23.11.2026 «1b 2a 3a 4b 5a»): the card «N Neuheiten seit …» on Today. It counts every
 * line of the news (main points and small things) of the versions after the last one you looked at, shows up to three
 * pictures of them and opens a window that groups the news by place. This file is the pure part (no screen, tested in
 * tests/neuseit.test.js); the start reads only the short lines of the versions (whatsnew.js NEWS_INDEX_ALL).
 */
import { compareVersions } from '../whatsnew.js';

/** localStorage: the newest version whose news you looked at (closed the card or the window). */
export const CARD_KEY = 'wasneu.card';
/** At most this many pictures in the strip of the card. */
export const STRIP = 3;

/**
 * The version the card counts from: the one you last looked at, else the one before the last update of this device (wasneuStore
 * readUpdate), else null (a first start has nothing «since»).
 */
export const fromOf = (card, update) => (typeof card === 'string' && card ? card : (update?.from ?? null));

/**
 * What the card says: { n: lines of news, versions, since: the day of the version you count from or of the oldest new one,
 * pics: [{ id, line, vorher }] (the first picture of the newest versions, at most STRIP) } for the short lines `rows`
 * (newest first) after the version `from`. n 0: no card.
 */
export function sinceInfo(rows, from) {
  if (from == null) return { n: 0, versions: 0, since: null, pics: [] };
  const fresh = rows.filter((r) => compareVersions(r.version, from) > 0);
  const base = rows.find((r) => r.version === from);
  const pics = [];
  for (const r of fresh) {
    const first = r.bilder?.[0];
    if (r.id && first && pics.length < STRIP) pics.push({ id: r.id, line: first.line, vorher: !!first.vorher });
  }
  return {
    n: fresh.reduce((n, r) => n + (r.np ?? r.points?.length ?? 0) + (r.ns ?? r.small?.length ?? 0), 0),
    versions: fresh.length,
    since: base?.date ?? fresh.at(-1)?.date ?? null,
    pics,
  };
}

/** The day of «since» as people say it: the weekday within the last six days, else day and month ({ weekday } | { day, month }). */
export function sinceFormat(iso, today) {
  if (!iso) return null;
  const a = new Date(`${iso}T12:00:00`);
  const b = new Date(`${today}T12:00:00`);
  const days = Math.round((b - a) / 864e5);
  return days >= 0 && days < 7 ? { weekday: 'long' } : { day: 'numeric', month: 'short' };
}
