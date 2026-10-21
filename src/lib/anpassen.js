/**
 * «Anpassen» (Noah 20.10.2026 «1a 2a 3a 4a 5a»): every page, its tabs and the menu can be changed in the app.
 *   1a: on every page a link «Diese Seite anpassen» opens the window (anpassen/AnpassenSheet.svelte)
 *   2a: the menu (bottom bar on a phone, sidebar on a computer): show, hide, rename and sort the places
 *   3a: headings of a page and the names of tabs and places can be renamed
 *   4a: start values: which tab a place opens with
 *   5a: each device keeps its own choice (localStorage, like Darstellung); nothing goes into a backup
 * Pure rules here (tested in tests/anpassen.test.js); the parts of a page are found in anpassen/parts.js.
 * Everything is a suggestion: «Wie am Anfang» goes back to the app's own page, tabs and menu.
 *
 * Kept as one record under STORE_KEY:
 *   pages: { [pageKey]: { hide: [partKey], order: [partKey], names: { partKey: text } } }
 *   menu:  { hide: [placeKey], order: [placeKey], names: { placeKey: text } }
 *   tabs:  { [placeKey]: { hide: [tabKey], names: { tabKey: text }, start: tabKey } }
 * The order of the tabs is Impeccable's «Mehr» order (nav.js orderedTabs / setTabOrder), not a second one.
 */

export const STORE_KEY = 'anpassen';
/** Heute is always in the menu: the app needs one place to come home to. */
export const ALWAYS_SHOWN = ['today'];
/** The longest own name of a heading, tab or place. */
export const NAME_MAX = 40;

let cache = null;
const copy = (o) => JSON.parse(JSON.stringify(o));

/** An empty record. */
export const empty = () => ({ pages: {}, menu: { hide: [], order: [], names: {} }, tabs: {} });

/** A record from storage, cleaned: unknown or broken parts are dropped, never thrown. */
export function clean(raw) {
  const c = empty();
  if (!raw || typeof raw !== 'object') return c;
  const list = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x) : []);
  const names = (v) => {
    const o = {};
    if (v && typeof v === 'object') for (const [k, n] of Object.entries(v)) if (typeof n === 'string' && n.trim()) o[k] = n.trim().slice(0, NAME_MAX);
    return o;
  };
  if (raw.pages && typeof raw.pages === 'object') {
    for (const [k, p] of Object.entries(raw.pages)) {
      if (!p || typeof p !== 'object') continue;
      const page = { hide: list(p.hide), order: list(p.order), names: names(p.names) };
      if (typeof p.title === 'string' && p.title.trim()) page.title = p.title.trim().slice(0, 80);
      if (!isEmptyPage(page)) c.pages[k] = page;
    }
  }
  if (raw.menu && typeof raw.menu === 'object') c.menu = { hide: list(raw.menu.hide).filter((k) => !ALWAYS_SHOWN.includes(k)), order: list(raw.menu.order), names: names(raw.menu.names) };
  if (raw.tabs && typeof raw.tabs === 'object') {
    for (const [k, p] of Object.entries(raw.tabs)) {
      if (!p || typeof p !== 'object') continue;
      const tab = { hide: list(p.hide), names: names(p.names), start: typeof p.start === 'string' && p.start ? p.start : null };
      if (tab.hide.length || Object.keys(tab.names).length || tab.start) c.tabs[k] = tab;
    }
  }
  return c;
}

export const isEmptyPage = (p) => !p || (!p.hide?.length && !p.order?.length && !Object.keys(p.names ?? {}).length);

/** The record of this device (cached; storage is read once). */
export function readCfg() {
  if (cache) return cache;
  let raw = null;
  try {
    raw = JSON.parse(globalThis.localStorage?.getItem(STORE_KEY) || 'null');
  } catch {
    raw = null;
  }
  cache = clean(raw);
  return cache;
}

/** Keep the record (cleaned); private mode keeps it until the page reloads. */
export function writeCfg(c) {
  cache = clean(c);
  try {
    if (isAllEmpty(cache)) globalThis.localStorage?.removeItem(STORE_KEY);
    else globalThis.localStorage?.setItem(STORE_KEY, JSON.stringify(cache));
  } catch {
    /* private mode */
  }
  return cache;
}

/** For tests: forget the cached record. */
export const resetCache = () => (cache = null);

export function isAllEmpty(c) {
  return !Object.keys(c.pages).length && !c.menu.hide.length && !c.menu.order.length && !Object.keys(c.menu.names).length && !Object.keys(c.tabs).length;
}

/* ---------- order: the same rule everywhere ---------- */

/**
 * items sorted by the keys you chose; items you never sorted keep their own place among the others
 * (they follow the item before them), so a new section or place shows up where the app puts it.
 */
export function byOrder(items, order, keyOf = (x) => x.key) {
  if (!order?.length) return [...items];
  const at = new Map(order.map((k, i) => [k, i]));
  const rank = [];
  let last = -1;
  for (const x of items) {
    const i = at.get(keyOf(x));
    if (i != null) last = i;
    // not sorted: just after the item before it in the app's own order
    rank.push(i != null ? i : last + 0.5);
  }
  return items.map((x, i) => ({ x, r: rank[i], i })).sort((a, b) => a.r - b.r || a.i - b.i).map((o) => o.x);
}

/** Move the item at from to to; returns the new list of keys. */
export function moved(keys, from, to) {
  if (from === to || from < 0 || to < 0 || from >= keys.length || to >= keys.length) return [...keys];
  const k = [...keys];
  const [x] = k.splice(from, 1);
  k.splice(to, 0, x);
  return k;
}

/* ---------- pages ---------- */

export const pageCfg = (c, page) => c.pages[page] ?? { hide: [], order: [], names: {} };

/** The key of a page for its choice: the page and, when its place has tabs, the tab («trips:overview»). */
export const pageKeyOf = (page, tab = null) => (tab ? `${page}:${tab}` : String(page ?? 'home'));

function editPage(c, page, fn) {
  const p = copy(pageCfg(c, page));
  fn(p);
  const n = { ...c, pages: { ...c.pages } };
  if (!p.title) delete p.title;
  if (isEmptyPage(p)) delete n.pages[page];
  else n.pages[page] = p;
  return n;
}

export const setPartHidden = (c, page, key, hidden) =>
  editPage(c, page, (p) => {
    p.hide = p.hide.filter((k) => k !== key);
    if (hidden) p.hide.push(key);
  });

export const setPartOrder = (c, page, keys) => editPage(c, page, (p) => (p.order = [...keys]));

/** An own name; empty or the same as the app's name goes back to the app's name. */
export const setPartName = (c, page, key, name, orig = '') =>
  editPage(c, page, (p) => {
    const v = String(name ?? '').trim().slice(0, NAME_MAX);
    if (!v || v === orig) delete p.names[key];
    else p.names[key] = v;
  });

/** The page's name for the list under Ich › Darstellung (kept with its choice). */
export function withTitle(c, page, title) {
  if (!c.pages[page] || !title) return c;
  return { ...c, pages: { ...c.pages, [page]: { ...c.pages[page], title: String(title).trim().slice(0, 80) } } };
}

export const resetPage = (c, page) => editPage(c, page, (p) => ((p.hide = []), (p.order = []), (p.names = {})));

/** The key of a heading: its text without numbers and signs, so «Offen (3)» stays «offen» when the count changes. */
export function partKey(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[\d.,:;()[\]·%+–—\-/|!?«»"'’…]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ---------- menu (the places) ---------- */

/** The places of the menu in your order, without the hidden ones (Heute always stays). all: with the hidden ones. */
export function menuPlaces(c, places, { all = false } = {}) {
  const sorted = byOrder(places, c.menu.order);
  return all ? sorted : sorted.filter((p) => ALWAYS_SHOWN.includes(p.key) || !c.menu.hide.includes(p.key));
}

export function setPlaceHidden(c, key, hidden) {
  if (ALWAYS_SHOWN.includes(key)) return c;
  const hide = c.menu.hide.filter((k) => k !== key);
  if (hidden) hide.push(key);
  return { ...c, menu: { ...c.menu, hide } };
}

export const setPlaceOrder = (c, keys) => ({ ...c, menu: { ...c.menu, order: [...keys] } });

export function setPlaceName(c, key, name, orig = '') {
  const names = { ...c.menu.names };
  const v = String(name ?? '').trim().slice(0, NAME_MAX);
  if (!v || v === orig) delete names[key];
  else names[key] = v;
  return { ...c, menu: { ...c.menu, names } };
}

export const resetMenu = (c) => ({ ...c, menu: { hide: [], order: [], names: {} } });

/** The own name of a place, or null. */
export const placeName = (c, key) => c.menu.names[key] ?? null;

/* ---------- tabs of a place ---------- */

export const tabCfg = (c, place) => c.tabs[place] ?? { hide: [], names: {}, start: null };

function editTabs(c, place, fn) {
  const p = copy(tabCfg(c, place));
  fn(p);
  const n = { ...c, tabs: { ...c.tabs } };
  if (!p.hide.length && !Object.keys(p.names).length && !p.start) delete n.tabs[place];
  else n.tabs[place] = p;
  return n;
}

/** Hide a tab; the start tab cannot be hidden (it goes back to «last opened»). */
export const setTabHidden = (c, place, key, hidden) =>
  editTabs(c, place, (p) => {
    p.hide = p.hide.filter((k) => k !== key);
    if (hidden) {
      p.hide.push(key);
      if (p.start === key) p.start = null;
    }
  });

export const setTabName = (c, place, key, name, orig = '') =>
  editTabs(c, place, (p) => {
    const v = String(name ?? '').trim().slice(0, NAME_MAX);
    if (!v || v === orig) delete p.names[key];
    else p.names[key] = v;
  });

/** 4a: the tab a place opens with; null = the one you opened last (the app's way). */
export const setStartTab = (c, place, key) => editTabs(c, place, (p) => (p.start = key || null));

export const resetTabs = (c, place) => editTabs(c, place, (p) => ((p.hide = []), (p.names = {}), (p.start = null)));

/** The tabs without the hidden ones; the tab you are on always stays in sight. */
export function visibleTabs(c, place, tabs, cur = null) {
  const hide = tabCfg(c, place).hide;
  const shown = tabs.filter((x) => x.key === cur || !hide.includes(x.key));
  // never hide every tab: then all of them show
  return shown.length ? shown : tabs;
}

export const tabName = (c, place, key) => tabCfg(c, place).names[key] ?? null;
export const startTab = (c, place) => tabCfg(c, place).start ?? null;

/** How many things are changed, for the list under Ich › Darstellung. */
export function changeCount(c) {
  let n = 0;
  for (const p of Object.values(c.pages)) n += p.hide.length + Object.keys(p.names).length + (p.order.length ? 1 : 0);
  n += c.menu.hide.length + Object.keys(c.menu.names).length + (c.menu.order.length ? 1 : 0);
  for (const p of Object.values(c.tabs)) n += p.hide.length + Object.keys(p.names).length + (p.start ? 1 : 0);
  return n;
}
