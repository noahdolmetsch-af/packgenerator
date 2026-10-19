/**
 * Paket Q #148: the live part of news.js. Reads /api/news (a small free server function, because a
 * browser cannot read other sites' feeds) and keeps the last answer on this device, so offline the
 * page still shows what came last, with its time.
 */
import { NEWS_URL, fresh } from './news.js';

const CACHE = 'pg-news-cache';
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE) ?? '{}') ?? {};
  } catch {
    return {};
  }
};
const write = (v) => {
  try {
    localStorage.setItem(CACHE, JSON.stringify(v));
  } catch {
    /* private mode: only this visit */
  }
};

export const news = $state({ alerts: null, feeds: {}, busy: false, ...read() });
const keep = () => write({ alerts: news.alerts, feeds: news.feeds });

async function ask(q, fetcher) {
  const res = await fetcher(`${NEWS_URL}?${q}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.code ?? 'failed'), { code: body.code ?? 'failed' });
  return body;
}
const codeOf = (err) => (globalThis.navigator?.onLine === false ? 'offline' : (err?.code ?? 'failed'));

/** Weather warnings and the avalanche level; from the cache when fresh. */
export async function loadAlerts({ force = false, fetcher = (...a) => fetch(...a) } = {}) {
  if (!force && fresh(news.alerts?.at)) return news.alerts;
  try {
    const [w, a] = await Promise.all([ask('alerts=weather', fetcher), ask('alerts=avalanche', fetcher)]);
    news.alerts = { at: new Date().toISOString(), warnings: w.warnings ?? [], avalanche: { level: a.level ?? null, link: a.link }, error: null };
  } catch (err) {
    news.alerts = { ...(news.alerts ?? { warnings: [], avalanche: null }), error: codeOf(err) };
  }
  keep();
  return news.alerts;
}

/** One feed's newest items; from the cache when fresh. */
export async function loadFeed(feed, { force = false, fetcher = (...a) => fetch(...a) } = {}) {
  const old = news.feeds[feed.url];
  if (!force && fresh(old?.at)) return old;
  try {
    const b = await ask(`feed=${encodeURIComponent(feed.url)}`, fetcher);
    news.feeds[feed.url] = { at: new Date().toISOString(), title: b.title ?? '', items: b.items ?? [], error: null };
  } catch (err) {
    news.feeds[feed.url] = { ...(old ?? { items: [] }), error: codeOf(err) };
  }
  keep();
  return news.feeds[feed.url];
}
