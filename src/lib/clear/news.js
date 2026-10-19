/**
 * Paket Q #148 «Hinweise und News-Feed» (Noah 19.10.2026 «1a 2a»): what concerns you (weather
 * warnings for your region, the avalanche danger in winter, your passes) and a news feed with velo
 * and mountain topics. The sources are yours: add, rename, change and delete them.
 * Pure (no database, no fetch), tested in tests/news.test.js. Texts are English keys for t();
 * feed names you typed never go through t().
 */

export const NEWS_URL = 'https://packgen-three.vercel.app/api/news';
export const FEEDS_KEY = 'newsFeeds';
export const ALERTS_KEY = 'alertsPrefs';
export const PASS_INFO = 'https://alpen-paesse.ch/';

/** The start sources (velo and mountains; Noah «2a»). Assumption: these sites publish RSS here. */
export const DEFAULT_FEEDS = [
  { id: 'f-bikepacking', name: 'Bikepacking.com', url: 'https://bikepacking.com/feed/' },
  { id: 'f-ride', name: 'Ride Magazin', url: 'https://www.ride.ch/feed/' },
];

/**
 * Passes with their usual season (months 1–12, from–to). The real state of today is on
 * alpen-paesse.ch; the app says «usually open» and links there. Fictional-free, public facts.
 */
export const PASSES = [
  { key: 'furka', name: 'Furka', from: 6, to: 10 },
  { key: 'grimsel', name: 'Grimsel', from: 6, to: 10 },
  { key: 'susten', name: 'Susten', from: 6, to: 10 },
  { key: 'nufenen', name: 'Nufenen', from: 6, to: 10 },
  { key: 'gotthard', name: 'Gotthard', from: 6, to: 10 },
  { key: 'oberalp', name: 'Oberalp', from: 5, to: 11 },
  { key: 'klausen', name: 'Klausen', from: 6, to: 10 },
  { key: 'albula', name: 'Albula', from: 6, to: 10 },
  { key: 'fluela', name: 'Flüela', from: 1, to: 12 },
  { key: 'julier', name: 'Julier', from: 1, to: 12 },
  { key: 'bernina', name: 'Bernina', from: 1, to: 12 },
  { key: 'lukmanier', name: 'Lukmanier', from: 1, to: 12 },
];

/** The stored feed list → the list to show (the start sources when nothing is stored yet). */
export const feedsOf = (value) => (Array.isArray(value) ? value.filter((f) => f?.id && f.url) : DEFAULT_FEEDS);

export const ALERTS_DEFAULT = { region: '', weather: true, avalanche: true, passes: [] };
export const alertsOf = (value) => ({ ...ALERTS_DEFAULT, ...(value && typeof value === 'object' ? value : {}) });

/** A new or changed source: name and https address checked. Returns { feed } or { error } (English key). */
export function checkFeed({ name = '', url = '' }, list = [], id = null) {
  const n = name.trim();
  let u = url.trim();
  if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
  if (!n) return { error: 'Give the source a name.' };
  try {
    const p = new URL(u);
    if (p.protocol !== 'https:') return { error: 'The address must start with https://.' };
  } catch {
    return { error: 'This is not a web address.' };
  }
  if (list.some((f) => f.id !== id && f.url === u)) return { error: 'This source is already in the list.' };
  return { feed: { id: id ?? `f-${Date.now().toString(36)}`, name: n, url: u } };
}

/** The months of a pass season as words, e.g. «June–October» (English keys). */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const seasonOf = (p) => (p.from === 1 && p.to === 12 ? null : [MONTHS[p.from - 1], MONTHS[p.to - 1]]);

/** Is the pass usually open in this month (1–12)? */
export const usuallyOpen = (p, month) => (p.from <= p.to ? month >= p.from && month <= p.to : month >= p.from || month <= p.to);

/** Winter months with an avalanche bulletin worth showing. */
export const avalancheSeason = (month) => month >= 11 || month <= 5;

/** Warnings for your region (all of Switzerland when no region is set), the strongest first. */
export function warningsFor(warnings = [], region = '', now = new Date()) {
  const r = region.trim().toLowerCase();
  return warnings
    .filter((w) => !w.expires || new Date(w.expires) > now)
    .filter((w) => !r || w.area.toLowerCase().includes(r))
    .sort((a, b) => b.level - a.level);
}

/**
 * The few things important enough for one line on Today (Noah «1a»): a weather warning from level
 * «severe» (orange) in your region (only once a region is set), avalanche danger 3 or higher in winter, a watched pass whose
 * season starts or ends this month. Each: { key, text, vars, href }.
 */
export function importantOf({ warnings = [], avalanche = null, prefs = ALERTS_DEFAULT, now = new Date() }) {
  const month = now.getMonth() + 1;
  const out = [];
  // only with a region: a warning somewhere in Switzerland is no reason for a line on Today
  if (prefs.weather && prefs.region?.trim()) {
    const w = warningsFor(warnings, prefs.region, now).find((x) => x.level >= 3);
    if (w) out.push({ key: 'weather', text: 'Weather warning: {event} ({area})', vars: { event: w.event, area: w.area }, href: '#/me/hinweise' });
  }
  if (prefs.avalanche && avalancheSeason(month) && avalanche?.level >= 3) out.push({ key: 'avalanche', text: 'Avalanche danger up to level {n} in Switzerland', vars: { n: avalanche.level }, href: '#/me/hinweise' });
  for (const key of prefs.passes ?? []) {
    const p = PASSES.find((x) => x.key === key);
    if (!p || !seasonOf(p)) continue;
    if (p.from === month) out.push({ key: `pass-${key}`, text: '{pass}: the pass season usually starts this month', vars: { pass: p.name }, href: '#/me/hinweise' });
    else if (p.to === month) out.push({ key: `pass-${key}`, text: '{pass}: the pass usually closes this month', vars: { pass: p.name }, href: '#/me/hinweise' });
  }
  return out;
}

/** Is a cached answer fresh enough (3 hours)? */
export const fresh = (at, now = Date.now(), hours = 3) => !!at && now - new Date(at).getTime() < hours * 36e5;

/** 'YYYY-MM-DD' plus n days (calendar days, no time zone). */
const plusDays = (day, n) => new Date(Date.UTC(...day.split('-').map((x, i) => (i === 1 ? x - 1 : +x))) + n * 864e5).toISOString().slice(0, 10);
const matchArea = (area, names) => names.some((n) => n && (area.toLowerCase().includes(n) || n.includes(area.toLowerCase())));

/**
 * Paket Q Zusatz 1 (Noah 19.10.2026 «1-3 alle a»): a warning for the days and the place of a planned trip.
 * Weather: a MeteoSwiss warning from level 2 (yellow) whose area matches the trip's start place or your
 * region and whose time touches the trip's days. Avalanche: on a ski tour today or tomorrow, danger 3 or
 * higher. Each line: { key, text, vars, href }. Nothing for a trip that is over or has no date.
 * input: { trip, warnings, avalanche, prefs, today ('YYYY-MM-DD') }
 */
export function tripAlerts({ trip, warnings = [], avalanche = null, prefs = ALERTS_DEFAULT, today }) {
  const start = trip?.startDate;
  if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return [];
  const end = plusDays(start, Math.max(1, Number(trip.days) || 1) - 1);
  if (end < today) return [];
  const out = [];
  const names = [trip.place?.name, prefs.region].map((n) => (n ?? '').trim().toLowerCase()).filter((n) => n.length >= 3);
  if (prefs.weather !== false && names.length) {
    const from = `${start}T00:00:00`;
    const to = `${plusDays(end, 1)}T00:00:00`;
    const hit = warnings
      .filter((w) => w.level >= 2 && matchArea(w.area ?? '', names))
      .filter((w) => (!w.onset || w.onset.slice(0, 19) < to) && (!w.expires || w.expires.slice(0, 19) > from))
      .sort((a, b) => b.level - a.level)[0];
    if (hit) out.push({ key: 'weather', text: 'Weather warning for your trip: {event} ({area})', vars: { event: hit.event, area: hit.area }, href: hit.link || '#/me/hinweise' });
  }
  const ski = trip.domain === 'ski';
  if (ski && prefs.avalanche !== false && avalanche?.level >= 3 && start <= plusDays(today, 1)) {
    out.push({ key: 'avalanche', text: 'Avalanche danger up to level {n}: read the bulletin before your tour', vars: { n: avalanche.level }, href: avalanche.link || '#/me/hinweise' });
  }
  return out;
}

/** Is the trip soon enough to look for warnings (from today up to 5 days ahead, or under way)? */
export const tripSoon = (trip, today) => !!trip?.startDate && trip.startDate <= plusDays(today, 5) && plusDays(trip.startDate, Math.max(1, Number(trip.days) || 1) - 1) >= today;
