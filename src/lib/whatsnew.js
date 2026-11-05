/**
 * v0.35.0 (Noah, from now on every release): "New in the last updates" at the top of "What the app
 * can do" (#/features), and once after an update a quiet line on Today. Each release adds an entry
 * at the top: version, date, 1-4 points in plain words (English keys for t(), German in
 * i18n/de/whatsnew.js), each with the address of the exact place ("Try it"), or no address when
 * the place no longer exists (older versions). The list goes back to the first version (0.1.0).
 * v0.110.0 (I11): an entry may also have title, lead (one sentence) and test (the steps «How to test it»).
 * action 'data': the place is "Data and backup" (under Me since v0.94.0, nav.js openData) instead of an address.
 * v0.118.0 «Was ist neu 2» (mockups W1–W3, Noah 13.10.2026 «w1-w3 freigeben», answers 1a 2a 3a 4a 5a):
 * every version has its own title (relaxed, with a wink, at most one emoji), one sentence (lead), 1–3
 * main points (each with the place it leads to) and the small things in boxes: small: [{ box, text,
 * href? }] with box one of BOXES (New, Nicer, Fixed, Faster). All versions were rewritten once in this
 * style; versions, dates, addresses and test steps stayed.
 * Pure, tested in tests/whatsnew.test.js.
 */

// Version at merge time (Noah 27.10.2026 «1a»): since 0.232.0 a PR no longer adds its entry to a list here. It adds
// src/lib/news/<name>.js (see the README there); scripts/news.mjs gives it its version and day from the
// order of merges on main. Tested in tests/version-at-merge.test.js.
//
// Tempo (Noah 05.11.2026 «a»): the start reads only what it needs of the list. WHATS_NEW holds the newest few entries in full
// (the tile «New» on Today, the banner after an update); NEWS_INDEX_ALL has a short line for every version (version, day,
// number of points, «since»). Everything else (all texts, all German) loads with the page that shows the whole list:
// import { WHATS_NEW } from './whatsnew-all.js' there (also tests, which want the whole list).
import { NEWS_NEU, NEWS_INDEX } from './news/neu.gen.js';
import { ALT_INDEX } from './whatsnew-alt-index.js';

/** The newest versions in full, newest first (WHATS_NEW[0] is the current one). */
export const WHATS_NEW = NEWS_NEU;
/** A short line for every version, newest first: { version, date, np: points, ns: small things, since? }. */
export const NEWS_INDEX_ALL = [...NEWS_INDEX, ...ALT_INDEX];
/** The number of main points of an entry or of its short line. */
export const pointCount = (e) => e.np ?? e.points?.length ?? 0;

/** How many versions show open; the older ones fold away. */
export const SHOWN = 3;
/** localStorage: the newest version seen on Today. */
export const SEEN_KEY = 'whatsnew.seen';
/** The version before this list existed: a device with data but no mark comes from there. */
export const BEFORE = '0.34.0';

/** v0.118.0 «Was ist neu 2» (answer 2a): the boxes of the small things, in this order (labels are keys for t()). */
export const BOXES = [
  { key: 'new', label: 'New|box' },
  { key: 'nicer', label: 'Nicer|box' },
  { key: 'fixed', label: 'Fixed|box' },
  { key: 'faster', label: 'Faster|box' },
];
export const boxLabel = (key) => BOXES.find((b) => b.key === key)?.label ?? 'New|box';

/** All lines of a version: the main points, then the small things. */
export const itemsOf = (e) => [...(e?.points ?? []), ...(e?.small ?? [])];

/** The news items of a few versions (the window after an update counts them). */
export const countNews = (entries = []) => ({ points: entries.reduce((n, e) => n + e.points.length, 0), small: entries.reduce((n, e) => n + (e.small?.length ?? 0), 0) });

/**
 * The picture of a line, from the place it leads to (a line may name its own `icon`): a key for
 * know/VersionNews.svelte. Most specific address first.
 */
const ICONS = [
  ['#/me/news', 'star'], ['#/features', 'star'], ['#/me/checks', 'check'], ['#/me/data', 'save'], ['#/me/look', 'palette'], ['#/helper', 'sparkles'],
  ['#/me', 'user'], ['#/inbox', 'inbox'], ['#/notes', 'note'], ['#/bikes?tab=care', 'wrench'], ['#/care', 'wrench'], ['#/bikes', 'bike'],
  ['#/wardrobe', 'shirt'], ['#/favorites', 'star'], ['#/gear', 'box'], ['#/flow', 'activity'], ['#/debrief', 'book'], ['#/review', 'book'],
  ['#/blocks', 'blocks'], ['#/pack?day', 'check'], ['#/pack/templates', 'copy'], ['#/pack', 'pack'], ['#/trips', 'route'], ['#/ride', 'compass'], ['#/', 'sun'],
];
export function iconOf(p) {
  if (p?.icon) return p.icon;
  if (p?.action === 'data') return 'save';
  const h = p?.href ?? '';
  return ICONS.find(([pre]) => (pre === '#/' ? h === '#/' : h.startsWith(pre)))?.[1] ?? 'sparkles';
}

/** -1, 0 or 1 for two versions like "0.35.0" (missing parts count as 0). */
export function compareVersions(a = '0', b = '0') {
  const pa = String(a).split('.').map((x) => Number(x) || 0);
  const pb = String(b).split('.').map((x) => Number(x) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d < 0 ? -1 : 1;
  }
  return 0;
}

/** The entries to show open (the newest SHOWN) and the older ones (folded). */
export function splitNews(list = WHATS_NEW, shown = SHOWN) {
  return { recent: list.slice(0, shown), older: list.slice(shown) };
}

/** "0.35.0" → "0.35", "0.30.2" stays. */
export const shortVersion = (v) => String(v).replace(/\.0$/, '');

/**
 * The folded versions in calm groups by version range (0.30 to 0.39, 0.20 to 0.29, ...; 0.1 to
 * 0.9 the first), newest first: { key, from, to, entries } with from/to like "0.20" and "0.29".
 */
export function groupOlder(older = splitNews().older) {
  const groups = [];
  for (const e of older) {
    const [major = 0, minor = 0] = String(e.version).split('.').map((x) => Number(x) || 0);
    const key = `${major}.${Math.floor(minor / 10)}`;
    let g = groups.at(-1);
    if (!g || g.key !== key) groups.push((g = { key, entries: [] }));
    g.entries.push(e);
  }
  const minorOf = (e) => e.version.split('.').slice(0, 2).join('.');
  return groups.map(({ key, entries }) => ({ key, from: minorOf(entries.at(-1)), to: minorOf(entries[0]), entries }));
}

/**
 * Today's hint "New since your last visit": { show, mark }. seen: the stored version (null: none);
 * hasData: the device has trips, items or bikes (then it is an update from before this list, not a
 * first install). show: say it once now; mark: the version to store (null: nothing to store).
 * A first install (no mark, no data) shows nothing and stores the current version.
 */
export function newsHint(seen, hasData, current = WHATS_NEW[0].version) {
  const from = seen ?? (hasData ? BEFORE : null);
  if (from == null) return { show: false, mark: current };
  if (compareVersions(from, current) >= 0) return { show: false, mark: seen === current ? null : current };
  return { show: true, mark: current };
}

/**
 * The entries newer than a version (what changed since the last visit). By default the short lines of all versions
 * (use pointCount(e)); where an entry is also in full (the newest), the full one is given.
 */
export const newerThan = (version, list = NEWS_INDEX_ALL) => {
  const full = new Map(WHATS_NEW.map((e) => [e.version, e]));
  return list.filter((e) => compareVersions(e.version, version) > 0).map((e) => full.get(e.version) ?? e);
};
