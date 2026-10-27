/**
 * «Neu heute» (Träume und Neuland N11, Noah 27.10.2026 «1-5 a»): after a ride, one quiet line on Heute: «Neu seit
 * gestern: 3 Gemeinden, 1 See»; a tap opens Neuland. No tile: the line shows only on the day of the ride and the
 * day after, and «×» closes it until something new comes. Pure functions, tested in tests/neuheute.test.js.
 */
import { tracksOf, COUNT_WORDS } from './neuland.js';
import { t, tn } from '../i18n.svelte.js';

export const SEEN_KEY = 'neuland.todaySeen';

/** The day before. */
export function dayBefore(day) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Was anything ridden since `since` (a trip, a ride or an activity with a line or a place)? Cheap: no map data. */
export const rodeSince = (raw, since, today) => tracksOf({ trips: raw?.trips ?? [], rides: raw?.rides ?? [], activities: raw?.activities ?? [], today }).some((x) => x.day >= since);

/**
 * What was reached for the first time since `since` (switched-on collections). result: computeFrom() of store.js.
 * → { n, parts: [{ cid, n, text }], text, key } — key names this news (closing it hides only this one).
 */
export function newSince(result, since) {
  const parts = [];
  const ids = [];
  for (const c of result?.collections ?? []) {
    if (!c.on) continue;
    const got = [...c.visited.entries()].filter(([, v]) => v?.day && v.day >= since).map(([id]) => id);
    if (!got.length) continue;
    ids.push(...got.map((id) => `${c.id}:${id}`));
    const w = COUNT_WORDS[c.id];
    parts.push({ cid: c.id, n: got.length, text: w ? tn(got.length, w[0], w[1]) : `${got.length} × ${c.name}` });
  }
  const n = parts.reduce((s, p) => s + p.n, 0);
  const list = parts.map((p) => p.text).join(', ');
  return { n, parts, text: n ? t('New since yesterday: {list}', { list }) : '', key: ids.sort().join('|') };
}
