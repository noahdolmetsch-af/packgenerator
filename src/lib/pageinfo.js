/**
 * «Inhalte Flow» IF1–IF3 (Noah 14.10.2026, answers «1b 2a 3a 4a», mockups approved 04:32 «IF1–IF3
 * freigegeben»): three small kinds of text on a page, each a suggestion that can be hidden.
 *   - the tip line «Gut zu wissen»: one tip a day, own words, × hides it for today, «Alle Tipps» shows all
 *     (IF3: switch single tips off, all tips off, add an own tip);
 *   - the fold «Das kann die App hier»: closed, a few rows, each opens the place in the app (1b);
 *   - the tiles «Weiter» at the end of the page: places in the app, links outside (3a) and own links.
 * Pure data and functions; the texts are English keys translated with t() at the call site (German in
 * i18n/de/pageinfo.js). The state lives in one setting (PAGEINFO_KEY), on the device and in the backup.
 */
import { linkOf } from './flowmed.js';

export const PAGEINFO_KEY = 'pageInfo';
/** Built-in tiles at most (SK1–SK6: 7 plus the empty «+»), and own links at most. */
export const MAX_TILES = 7;
export const MAX_OWN = 8;

/**
 * The pages with their tips, rows and tiles. In hrefs `{base}` is the page's own address (an activity page).
 * A tile: { id, icon, title, sub, href } inside the app, or { …, out: 'https://…', domain } outside;
 * { id, own: true, title, sub } is an empty slot for an own link (e.g. «My music», DG-X8).
 */
export const PAGES = {
  aktiv: {
    tips: [
      { id: 'aktiv-rolling', text: 'The rings always count the last 7 days. A rest day does not cost everything at once.' },
      { id: 'aktiv-one-ring', text: 'Move, Mindful, Recovery: if you only fill one ring, you see it here first.' },
      { id: 'aktiv-amount', text: 'A long press enters another amount, for example 25 push-ups instead of 10.' },
      { id: 'aktiv-strava', text: 'Rides from Strava and trip days count on «Cycling outdoors» by themselves.' },
    ],
    can: [
      { id: 'rings', title: 'Rings over 7 days', sub: 'Move, Mindful and Recovery count on a rolling basis', href: '#/flow/goals' },
      { id: 'window', title: 'Goals with their own window', sub: '1, 7, 10 or 30 days, with a season', href: '#/flow/goals' },
      { id: 'strava', title: 'Strava counts along', sub: 'Your rides tick off «Cycling outdoors»', href: '#/debrief/ride' },
      { id: 'counts', title: '«Counts too»', sub: 'Commuting and trip days count by themselves', href: '#/flow/goals' },
    ],
    tiles: [
      { id: 'goals', icon: 'goals', title: 'Goals|flow', sub: 'all activities', href: '#/flow/goals' },
      { id: 'milestones', icon: 'star', title: 'Milestones', sub: 'your next stars', href: '#/flow/milestones' },
      { id: 'rides', icon: 'bike', title: 'Ride log', sub: 'rides and km', href: '#/debrief/ride' },
      { id: 'rest', icon: 'moon', title: 'Recovery|page', sub: 'sauna, walk, early to bed', href: '#/flow/rest' },
      { id: 'hepa', icon: 'heart', title: 'Exercise recommended', sub: 'How much per week?', out: 'https://www.hepa.ch/', domain: 'hepa.ch' },
      { id: 'strava', icon: 'pulse', title: 'Strava', sub: 'your last activity', out: 'https://www.strava.com/dashboard', domain: 'strava.com' },
      { id: 'week', icon: 'calendar', title: 'Week', sub: 'fixed dates', href: '#/flow/week' },
    ],
  },
  meditation: {
    tips: [
      { id: 'med-short', text: 'Short and often carries further than rare and long. 5 minutes count.' },
      { id: 'med-depth', text: 'The depth after the gong is only for you. Under Patterns you see when it goes deepest.' },
      { id: 'med-gongs', text: 'Interval gongs help you come back when your thoughts wander.' },
      { id: 'med-tpl', text: 'Templates keep the length, sound and place. One tap and it runs.' },
    ],
    can: [
      { id: 'tpl', title: 'Templates', sub: 'length, sound and place with one tap', href: '{base}/timer' },
      { id: 'gongs', title: 'Interval gongs', sub: 'help you come back', href: '{base}/timer' },
      { id: 'log', title: 'Log', sub: 'list, calendar and curve', href: '{base}/log' },
      { id: 'patterns', title: 'Patterns', sub: 'when it goes deepest', href: '{base}/muster' },
      { id: 'more', title: 'Quotes and own links', sub: 'under More', href: '{base}/mehr' },
    ],
    tiles: [
      { id: 'music', icon: 'music', title: 'My music', sub: 'own link, at the start', own: true },
      { id: 'rest', icon: 'moon', title: 'Recovery|page', sub: 'sauna, walk', href: '#/flow/rest' },
      { id: 'week', icon: 'calendar', title: 'Week', sub: 'fixed times', href: '#/flow/week' },
      { id: 'trophies', icon: 'trophy', title: 'Trophy showcase', sub: 'all your stars', href: '#/flow/trophies' },
      { id: 'milestones', icon: 'star', title: 'Milestones', sub: 'stars of meditation', href: '#/flow/milestones?act={act}' },
    ],
  },
};

/** The stored state made whole. */
export function infoOf(v) {
  const o = v && typeof v === 'object' ? v : {};
  const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
  return {
    tipsOn: o.tipsOn !== false,
    off: Array.isArray(o.off) ? o.off.filter((x) => typeof x === 'string') : [],
    own: obj(o.own),
    gone: obj(o.gone),
    canOff: obj(o.canOff),
    links: obj(o.links),
  };
}

const list = (x) => (Array.isArray(x) ? x : []);
/** The page's own tips (the user's). */
export const ownTips = (info, page) => list(infoOf(info).own[page]).filter((x) => x && typeof x.text === 'string' && x.text.trim());

/** All tips of a page, built in first, then the own ones, each with `on`. */
export function allTips(info, page) {
  const i = infoOf(info);
  const off = new Set(i.off);
  const base = list(PAGES[page]?.tips).map((x) => ({ ...x, on: !off.has(x.id) }));
  return [...base, ...ownTips(i, page).map((x) => ({ id: x.id, text: x.text, own: true, on: !off.has(x.id) }))];
}

const dayNo = (day) => Math.floor(Date.parse(`${day}T00:00:00Z`) / 864e5);
/** The tip of the day (the same all day, the next one tomorrow), null when tips are off, hidden today or none is on. */
export function tipOfDay(info, page, today) {
  const i = infoOf(info);
  if (!i.tipsOn || i.gone[page] === today) return null;
  const on = allTips(i, page).filter((x) => x.on);
  if (!on.length) return null;
  const n = dayNo(today);
  return on[((n % on.length) + on.length) % on.length];
}
/** Which number the tip of the day is among the tips that are on (1-based), and how many there are. */
export function tipPlace(info, page, today) {
  const tip = tipOfDay(info, page, today);
  const on = allTips(info, page).filter((x) => x.on);
  return tip ? { n: on.findIndex((x) => x.id === tip.id) + 1, of: on.length } : null;
}

/** The rows of «Das kann die App hier» with the page's address filled in. */
export const canRows = (page, base = '') => list(PAGES[page]?.can).map((r) => ({ ...r, href: r.href.replace('{base}', base) }));

/** The page's own links. */
export const ownLinks = (info, page) => list(infoOf(info).links[page]).filter((x) => x && x.url);

/** The tiles: the page's own (at most MAX_TILES), then the own links (at most MAX_OWN); an empty own slot only while there is no own link. */
export function tilesOf(info, page, { base = '', act = '' } = {}) {
  const links = ownLinks(info, page);
  const fill = (h) => h.replace('{base}', base).replace('{act}', encodeURIComponent(act));
  const own = links.map((l) => ({ id: l.id, icon: 'link', title: l.title, out: l.url, domain: domainOf(l.url), mine: true }));
  const base0 = list(PAGES[page]?.tiles)
    .filter((x) => !(x.own && links.length))
    .map((x) => (x.href ? { ...x, href: fill(x.href) } : x));
  return [...base0.slice(0, MAX_TILES), ...own.slice(0, MAX_OWN)];
}

/** The host of an address without «www.». */
export function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/* ---------- changes (each returns the new stored value) ---------- */
export const setTipsOn = (info, on) => ({ ...infoOf(info), tipsOn: !!on });
export function setTip(info, id, on) {
  const i = infoOf(info);
  const off = new Set(i.off);
  on ? off.delete(id) : off.add(id);
  return { ...i, off: [...off] };
}
export const hideToday = (info, page, today) => {
  const i = infoOf(info);
  return { ...i, gone: { ...i.gone, [page]: today } };
};
export function addTip(info, page, text, now = Date.now()) {
  const i = infoOf(info);
  const tx = String(text ?? '').trim().slice(0, 240);
  if (!tx) return i;
  return { ...i, own: { ...i.own, [page]: [...ownTips(i, page), { id: `own-${now.toString(36)}`, text: tx }] } };
}
export function removeTip(info, page, id) {
  const i = infoOf(info);
  return { ...i, own: { ...i.own, [page]: ownTips(i, page).filter((x) => x.id !== id) }, off: i.off.filter((x) => x !== id) };
}
export const setCan = (info, page, on) => {
  const i = infoOf(info);
  return { ...i, canOff: { ...i.canOff, [page]: !on } };
};
export const canShown = (info, page) => !infoOf(info).canOff[page];
/** An own link (title and address the user typed; only http and https); null when the address is not usable. */
export function addLink(info, page, title, url, now = Date.now()) {
  const l = linkOf(title, url, now);
  if (!l) return null;
  const i = infoOf(info);
  if (ownLinks(i, page).length >= MAX_OWN) return null;
  return { ...i, links: { ...i.links, [page]: [...ownLinks(i, page), { id: l.id, title: l.title, url: l.url }] } };
}
export function removeLink(info, page, id) {
  const i = infoOf(info);
  return { ...i, links: { ...i.links, [page]: ownLinks(i, page).filter((x) => x.id !== id) } };
}
