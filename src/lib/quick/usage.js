/**
 * «Quick Links» step 4 (Noah 28.10.2026 «6a 7a», «20: 30 Tage nicht geöffnet»): what this device opened
 * lately, a suggestion to pin a page you open often, and a gentle clean-up of pins you have not opened
 * for 30 days. Everything is a suggestion: «No, thanks» and «Keep» are remembered, nothing is unpinned
 * without a tap. One record per kind of device (like the pins), days in local time (localDay).
 *
 * Record: { start: day, recent: [{ href, title, at }], days: { path: ['YYYY-MM-DD', …] }, used: { pinId: day },
 *           no: { path: day }, keep: { pinId: day } }  (start: the first day this device counted)
 * Pure functions (tests/quickusage.test.js); PinMarks.svelte records, Quick.svelte shows.
 */
import { FEATURE, featureHref } from '../features.js';

export const USAGE_KEYS = { phone: 'quickLinks.used.phone', computer: 'quickLinks.used.computer' };
export const RECENT_MAX = 6;
/** A page opened on this many different days within OFTEN_DAYS is «often». */
export const OFTEN_TIMES = 3;
export const OFTEN_DAYS = 14;
/** A pin not opened for this many days is offered for clean-up. */
export const STALE_DAYS = 30;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** Days between two local days (b − a), by the calendar. */
const utc = (d) => {
  const [y, m, n] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, n);
};
export const daysBetween = (a, b) => Math.round((utc(b) - utc(a)) / 864e5);

/** The page part of an address: no filter, no trailing slash ('#/' for Today). */
export const pathOf = (href) => (String(href ?? '').split('?')[0].replace(/\/+$/, '') || '#').replace(/^#$/, '#/');

/** A stored record made safe. */
export function cleanUsage(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const obj = (o, ok) => Object.fromEntries(Object.entries(o && typeof o === 'object' ? o : {}).filter(([k, v]) => typeof k === 'string' && ok(v)));
  return {
    start: DAY.test(r.start) ? r.start : null,
    recent: (Array.isArray(r.recent) ? r.recent : []).filter((x) => x && typeof x.href === 'string' && x.href.startsWith('#/') && DAY.test(x.at)).slice(0, RECENT_MAX).map((x) => ({ href: x.href, title: String(x.title ?? '').slice(0, 80), at: x.at })),
    days: obj(r.days, (v) => Array.isArray(v) && v.every((d) => DAY.test(d))),
    used: obj(r.used, (v) => DAY.test(v)),
    no: obj(r.no, (v) => DAY.test(v)),
    keep: obj(r.keep, (v) => DAY.test(v)),
  };
}

/** A page was opened (href with its filter, the title it showed) on `day`. Today and Quick Links do not count. */
export function recordVisit(u, href, title, day) {
  const path = pathOf(href);
  if (path === '#/' || /^#\/quick(\/|$)/.test(path) || !title) return u;
  const start = u.start ?? day;
  const recent = [{ href, title: String(title).slice(0, 80), at: day }, ...u.recent.filter((x) => pathOf(x.href) !== path)].slice(0, RECENT_MAX);
  const seen = (u.days[path] ?? []).filter((d) => daysBetween(d, day) < OFTEN_DAYS);
  const days = { ...u.days, [path]: seen.includes(day) ? seen : [...seen, day] };
  return { ...u, start, recent, days };
}

/** The address a pin opens (a view's own, a function's page), or null for an action (a window). */
export function pinPath(p) {
  if (!p.feature) return pathOf(p.href);
  const f = FEATURE[p.feature];
  const href = f ? featureHref(f) : null;
  return href ? pathOf(href) : null;
}

/** A pin was opened (tapped in Quick Links, or its page was opened) on `day`. */
export const usePin = (u, pinId, day) => ({ ...u, used: { ...u.used, [pinId]: day } });

/** The pins whose page this address is (to count a visit as using them). */
export const pinsAt = (s, href) => s.pins.filter((p) => pinPath(p) === pathOf(href)).map((p) => p.id);

/**
 * Pages opened on OFTEN_TIMES days within OFTEN_DAYS that are not pinned and not turned down in the last
 * STALE_DAYS: [{ href, title }], most days first, at most `max`.
 */
export function suggestions(u, s, day, max = 1) {
  const pinned = new Set(s.pins.map(pinPath).filter(Boolean));
  return Object.entries(u.days)
    .map(([path, ds]) => ({ path, n: ds.filter((d) => daysBetween(d, day) < OFTEN_DAYS).length }))
    .filter((x) => x.n >= OFTEN_TIMES && !pinned.has(x.path) && !(u.no[x.path] && daysBetween(u.no[x.path], day) < STALE_DAYS))
    .sort((a, b) => b.n - a.n || a.path.localeCompare(b.path))
    .slice(0, max)
    .map((x) => {
      const r = u.recent.find((y) => pathOf(y.href) === x.path);
      return { href: x.path, title: r?.title ?? x.path };
    });
}

/**
 * Pins not opened for STALE_DAYS (a pin counts from the day it was added, `p.at`, or from the day this
 * device began to count) and not kept in the last STALE_DAYS: the ids, oldest first.
 */
export function stalePins(u, s, day) {
  const since = u.start ?? day;
  return s.pins
    .map((p) => {
      const from = [p.at, since].filter(Boolean).sort().at(-1); // a pin added after the start counts from its day
      return { id: p.id, last: u.used[p.id] ?? from };
    })
    .filter((x) => daysBetween(x.last, day) >= STALE_DAYS && !(u.keep[x.id] && daysBetween(u.keep[x.id], day) < STALE_DAYS))
    .sort((a, b) => a.last.localeCompare(b.last))
    .map((x) => x.id);
}
