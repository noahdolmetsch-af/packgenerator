/**
 * «Datenseiten wie am Garmin» (Noah 20.10.2026): on the full-screen live map you swipe left and right.
 * The map is one page, then the rider's data pages. This file is the pure part: the stored pages, the
 * grids, the zones and the chart data. Components: DataPages.svelte (the pager), DataPage.svelte (one
 * page), DataPagesEditor.svelte (the editor in the bottom sheet). Tested in tests/datapages.test.js.
 *
 * Stored in db.settings under PAGES_KEY:
 *   { v: 1, pages: [{ id, name, std, items, map }], maxHr, ftp }
 *   name: what the rider typed (shown as typed, never t()); '' for a ready page that keeps its own name
 *   std: the English key of a ready page ('Ride|page'), shown with t() while name is ''
 *   items: [{ f: fieldKey, big: bool } | { c: chartKey }] in the order shown
 *   map: a small map at the bottom of the page
 *   maxHr, ftp: the rider's own numbers for the zones (null: not entered)
 *
 * The grid has two columns. A small field takes one place, a big field and a chart two (a full row);
 * a page holds MAX_UNITS places. The ready grids (1, 2, 3, 4, 6, 8, 10 fields, like Garmin) are only a
 * suggestion: after one, every field can still be made big or small («free»).
 */
import { POWER_ZONE_SHARES } from '../training.js';

export const PAGES_KEY = 'live-pages';
export const MAX_UNITS = 10;
export const MAX_PAGES = 10;
export const NAME_MAX = 40;

/**
 * The numbers this module adds to the live catalogue (the values come from Live.svelte).
 * route: only with a route.
 */
export const EXTRA_FIELDS = [
  { key: 'avgHr', label: 'Average heart rate', unit: 'bpm' },
  { key: 'maxHr', label: 'Max heart rate', unit: 'bpm' },
  { key: 'avgPower', label: 'Average power', unit: 'W' },
  { key: 'maxPower', label: 'Max power', unit: 'W' },
  { key: 'lap', label: 'Lap time', unit: '' },
  { key: 'battery', label: 'Battery', unit: '%' },
  { key: 'nextWp', label: 'To the next waypoint', unit: 'km', route: true },
  { key: 'upToTop', label: 'Metres up to the summit', unit: 'm', route: true },
  // Runden und «Gegen dich selbst» (Noah 20.10.2026 «2-3 ja»)
  { key: 'lapKm', label: 'Lap distance', unit: 'km' },
  { key: 'ghost', label: 'Against your last ride', unit: '', route: true },
];

/** The charts a page can hold (each takes two places). route: only with a route. */
export const CHARTS = [
  { key: 'power', label: 'Power over time', unit: 'W' },
  { key: 'hr', label: 'Heart rate curve', unit: 'bpm' },
  { key: 'speed', label: 'Speed curve', unit: 'km/h' },
  { key: 'hrZones', label: 'Time in heart rate zones', unit: '' },
  { key: 'powerZones', label: 'Time in power zones', unit: '' },
  { key: 'profile', label: 'Elevation profile ahead', unit: 'm', route: true },
];
const CHART_KEYS = new Set(CHARTS.map((c) => c.key));
export const CHART = Object.fromEntries(CHARTS.map((c) => [c.key, c]));

/** The live catalogue plus EXTRA_FIELDS (keys already in it are not doubled). */
export function fieldCatalogue(base = []) {
  const have = new Set(base.map((f) => f.key));
  return [...base, ...EXTRA_FIELDS.filter((f) => !have.has(f.key))];
}

/** The ready grids: number of fields → the places of each field (2 = big, 1 = small). */
export const LAYOUTS = {
  1: [2],
  2: [2, 2],
  3: [2, 1, 1],
  4: [1, 1, 1, 1],
  6: [1, 1, 1, 1, 1, 1],
  8: [1, 1, 1, 1, 1, 1, 1, 1],
  10: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};
export const LAYOUT_NS = Object.keys(LAYOUTS).map(Number);

/** The fields used to fill a grid that needs more fields than the page has (first unused ones). */
export const FILL_ORDER = ['speed', 'done', 'moving', 'clock', 'avg', 'gain', 'hr', 'power', 'cadence', 'height', 'left', 'arrive'];

/** The three ready pages of the first start (like Garmin): «Fahrt», «Leistung», «Steigung». */
export function defaultPages() {
  const f = (key, big = false) => ({ f: key, big });
  return {
    v: 1,
    maxHr: null,
    ftp: null,
    pages: [
      { id: 'ride', name: '', std: 'Ride|page', map: false, items: [f('speed'), f('done'), f('moving'), f('avg'), f('clock'), f('gain')] },
      { id: 'power', name: '', std: 'Power|page', map: false, items: [f('power', true), f('avgPower'), f('hr'), f('cadence'), f('maxPower'), { c: 'power' }, { c: 'powerZones' }] },
      { id: 'climb', name: '', std: 'Climb|page', map: true, items: [f('grade', true), f('upToTop'), f('top'), f('height'), f('gain'), { c: 'profile' }] },
    ],
  };
}

const KEY_RE = /^[A-Za-z][\w-]{0,31}$/;
const unitOf = (it) => (it.c ? 2 : it.big ? 2 : 1);
/** The places the items take. */
export const unitsOf = (items = []) => items.reduce((s, it) => s + unitOf(it), 0);

const num = (v, lo, hi) => {
  const n = Math.round(Number(v));
  return v !== null && v !== '' && Number.isFinite(n) && n >= lo && n <= hi ? n : null;
};
/** A max heart rate the zones can use (100–240 bpm), else null. */
export const cleanMaxHr = (v) => num(v, 100, 240);
/** An FTP the zones can use (50–700 W), else null. */
export const cleanFtp = (v) => num(v, 50, 700);

function cleanItems(raw) {
  const out = [];
  const seenF = new Set();
  const seenC = new Set();
  for (const it of Array.isArray(raw) ? raw : []) {
    if (!it || typeof it !== 'object') continue;
    let next = null;
    if (typeof it.f === 'string' && KEY_RE.test(it.f) && !seenF.has(it.f)) {
      seenF.add(it.f);
      next = { f: it.f, big: it.big === true };
    } else if (typeof it.c === 'string' && CHART_KEYS.has(it.c) && !seenC.has(it.c)) {
      seenC.add(it.c);
      next = { c: it.c };
    }
    if (next && unitsOf(out) + unitOf(next) <= MAX_UNITS) out.push(next);
  }
  return out;
}

/**
 * The stored value made safe. Nothing stored (or not readable) → the three ready pages. An empty list
 * stays empty (the rider deleted every data page: only the map). Unknown charts, doubles, too many
 * places and pages without a field go; field keys are kept when they look like keys (the catalogue
 * decides at showing time, so a field that comes back later is still there).
 */
export function cleanPages(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.pages)) return defaultPages();
  const ids = new Set();
  const pages = [];
  for (const p of raw.pages) {
    if (!p || typeof p !== 'object' || pages.length >= MAX_PAGES) continue;
    const items = cleanItems(p.items);
    if (!items.length) continue;
    let id = typeof p.id === 'string' && p.id && p.id.length <= 40 ? p.id : `p${pages.length + 1}`;
    while (ids.has(id)) id = `${id}x`;
    ids.add(id);
    const name = typeof p.name === 'string' ? p.name.trim().slice(0, NAME_MAX) : '';
    const std = typeof p.std === 'string' && /^[A-Z][\w ]{0,30}\|page$/.test(p.std) ? p.std : '';
    pages.push({ id, name, std, map: p.map === true, items });
  }
  return { v: 1, maxHr: cleanMaxHr(raw.maxHr), ftp: cleanFtp(raw.ftp), pages };
}

const plain = (s, vars) => s.replace(/\|[a-z]+$/, '').replace(/\{(\w+)\}/g, (m, k) => vars?.[k] ?? m);
/**
 * A page's name: as typed, else the ready page's own name through tr (t()), else «Page 2» by its place i.
 * The map is page 1, so the first data page is «Page 2».
 */
export const pageName = (page, tr = plain, i = 0) => (page?.name ? page.name : page?.std ? tr(page.std) : tr('Page {n}', { n: i + 2 }));

const withPages = (set, pages) => ({ ...set, pages });
const indexOf = (set, id) => set.pages.findIndex((p) => p.id === id);

/** A new id not used yet. */
export function newId(set, seed = Date.now()) {
  let n = 0;
  let id;
  do id = `p${seed.toString(36)}${n++ ? n : ''}`;
  while (set.pages.some((p) => p.id === id));
  return id;
}

/** Add a page (four small fields to start), at the end. → the new set (unchanged at MAX_PAGES). */
export function addPage(set, { name, id = newId(set), keys = ['speed', 'done', 'moving', 'clock'] } = {}) {
  if (set.pages.length >= MAX_PAGES) return set;
  const nm = String(name ?? '').trim().slice(0, NAME_MAX);
  return withPages(set, [...set.pages, { id, name: nm, std: '', map: false, items: keys.slice(0, MAX_UNITS).map((f) => ({ f, big: false })) }]);
}

/**
 * Rename a page. The name is kept as typed (trimmed, at most NAME_MAX). Empty: a ready page goes back
 * to its own name; a page of the rider's own keeps its name.
 */
export function renamePage(set, id, name) {
  const nm = String(name ?? '').trim().slice(0, NAME_MAX);
  return withPages(
    set,
    set.pages.map((p) => (p.id !== id ? p : nm ? { ...p, name: nm } : p.std ? { ...p, name: '' } : p)),
  );
}

/** Delete a page. → { set, page, at } (page and at put it back with insertPage). */
export function deletePage(set, id) {
  const at = indexOf(set, id);
  if (at < 0) return { set, page: null, at: -1 };
  return { set: withPages(set, set.pages.filter((p) => p.id !== id)), page: set.pages[at], at };
}

/** Put a deleted page back at its place (or at the end); its id gets a new one when taken meanwhile. */
export function insertPage(set, page, at = set.pages.length) {
  if (!page) return set;
  const p = set.pages.some((x) => x.id === page.id) ? { ...page, id: newId(set) } : page;
  const pages = [...set.pages];
  pages.splice(Math.max(0, Math.min(at, pages.length)), 0, p);
  return withPages(set, pages.slice(0, MAX_PAGES));
}

function move(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const out = [...list];
  const [x] = out.splice(from, 1);
  out.splice(to, 0, x);
  return out;
}
/** Move a page from one place to another. */
export function movePage(set, from, to) {
  const pages = move(set.pages, from, to);
  return pages === set.pages ? set : withPages(set, pages);
}

/** Change one page: fn(page) → the new page. */
export const updatePage = (set, id, fn) => withPages(set, set.pages.map((p) => (p.id === id ? fn(p) : p)));

/** Is there room for one more item of this kind (field small, chart: two places)? */
export const roomFor = (page, kind = 'field') => unitsOf(page.items) + (kind === 'chart' ? 2 : 1) <= MAX_UNITS;

/** Switch a field on (small, at the end of the fields, when there is room) or off (at least one item stays). */
export function toggleField(page, key) {
  const has = page.items.some((it) => it.f === key);
  if (has) return page.items.length > 1 ? { ...page, items: page.items.filter((it) => it.f !== key) } : page;
  if (!roomFor(page, 'field') || !KEY_RE.test(key)) return page;
  const lastField = page.items.reduce((at, it, i) => (it.f ? i : at), -1);
  const items = [...page.items];
  items.splice(lastField + 1, 0, { f: key, big: false });
  return { ...page, items };
}

/** Switch a chart on (at the end, two places) or off (at least one item stays). */
export function toggleChart(page, key) {
  const has = page.items.some((it) => it.c === key);
  if (has) return page.items.length > 1 ? { ...page, items: page.items.filter((it) => it.c !== key) } : page;
  if (!roomFor(page, 'chart') || !CHART_KEYS.has(key)) return page;
  return { ...page, items: [...page.items, { c: key }] };
}

/** Remove the item at place i (at least one item stays). */
export const removeItem = (page, i) => (page.items.length > 1 && i >= 0 && i < page.items.length ? { ...page, items: page.items.filter((_, j) => j !== i) } : page);

/** Move an item of a page. */
export const moveItem = (page, from, to) => ({ ...page, items: move(page.items, from, to) });

/** Make the field at place i big or small (big needs one more place). */
export function setBig(page, i, big) {
  const it = page.items[i];
  if (!it?.f || it.big === big) return page;
  if (big && unitsOf(page.items) + 1 > MAX_UNITS) return page;
  return { ...page, items: page.items.map((x, j) => (j === i ? { ...x, big } : x)) };
}

/** The small map at the bottom on or off. */
export const setMap = (page, on) => ({ ...page, map: !!on });

/** The ready grid the fields of a page match now (1, 2, 3 …), or 'free'. */
export function layoutOf(items = []) {
  const sizes = items.filter((it) => it.f).map((it) => (it.big ? 2 : 1));
  const hit = LAYOUT_NS.find((n) => LAYOUTS[n].length === sizes.length && LAYOUTS[n].every((s, i) => s === sizes[i]));
  return hit ?? 'free';
}

/** Does grid n fit with the charts the page has? */
export const layoutFits = (page, n) => !!LAYOUTS[n] && LAYOUTS[n].reduce((a, b) => a + b, 0) + 2 * page.items.filter((it) => it.c).length <= MAX_UNITS;

/**
 * Apply ready grid n: the page keeps its first n fields (in order), fills up with unused ones from
 * `fill` (the shown catalogue), and gets the sizes of the grid; the charts stay, after the fields.
 * A grid that does not fit with the charts changes nothing.
 */
export function applyLayout(page, n, fill = FILL_ORDER) {
  if (!layoutFits(page, n)) return page;
  const sizes = LAYOUTS[n];
  const keys = page.items.filter((it) => it.f).map((it) => it.f);
  for (const k of [...fill, ...FILL_ORDER]) if (keys.length < sizes.length && !keys.includes(k)) keys.push(k);
  const fields = keys.slice(0, sizes.length).map((f, i) => ({ f, big: sizes[i] === 2 }));
  return { ...page, items: [...fields, ...page.items.filter((it) => it.c)] };
}

/**
 * The cells of a page as shown: the items that can be shown (`ok(item)`: in the catalogue, route), each
 * with its span (1 or 2 columns). A small field alone in its row (the next one is big, a chart, or none)
 * takes the whole row, so no hole stays. → { cells: [{ item, span }], rows }
 */
export function gridOf(items = [], ok = () => true) {
  const shown = items.filter(ok);
  const cells = [];
  let rows = 0;
  for (let i = 0; i < shown.length; i++) {
    const it = shown[i];
    if (unitOf(it) === 2) {
      cells.push({ item: it, span: 2 });
      rows++;
      continue;
    }
    const next = shown[i + 1];
    if (next && unitOf(next) === 1) {
      cells.push({ item: it, span: 1 }, { item: next, span: 1 });
      i++;
    } else cells.push({ item: it, span: 2 });
    rows++;
  }
  return { cells, rows };
}

/* ---------- zones (observation only: they show where you were, they do not judge) ---------- */

/** Heart rate: five zones from the max heart rate, Z1 50–60 %, Z2 60–70 %, Z3 70–80 %, Z4 80–90 %, Z5 90–100 %. */
export const HR_ZONE_PCT = [0.5, 0.6, 0.7, 0.8, 0.9, 1];
/** Power: the seven Coggan zones from the FTP (the same as Training): Z1 up to 55 % … Z7 over 150 %. */
export { POWER_ZONE_SHARES };

/** The heart rate zones as rows [{ z, from, to }] in bpm; null without a max heart rate. Below 50 % counts to Z1. */
export function hrZones(maxHr) {
  const m = cleanMaxHr(maxHr);
  if (!m) return null;
  // the upper end belongs to the zone (zoneIndex), so the next zone starts one beat higher
  return [0, 1, 2, 3, 4].map((i) => ({ z: i + 1, from: Math.round(m * HR_ZONE_PCT[i]) + (i ? 1 : 0), to: Math.round(m * HR_ZONE_PCT[i + 1]) }));
}
/** The power zones as rows [{ z, from, to }] in watts (from of Z1 is 0, to of Z7 null); null without an FTP. */
export function powerZones(ftp) {
  const f = cleanFtp(ftp);
  if (!f) return null;
  const b = POWER_ZONE_SHARES.map((p) => Math.round(f * p));
  return [0, 1, 2, 3, 4, 5, 6].map((i) => ({ z: i + 1, from: i ? b[i - 1] + 1 : 0, to: i < 6 ? b[i] : null }));
}

/** The zone (0-based) of a value: the first zone whose upper end it does not pass (HR: upper ends incl.). */
export function zoneIndex(v, zones) {
  for (let i = 0; i < zones.length - 1; i++) if (v <= zones[i].to) return i;
  return zones.length - 1;
}

/**
 * Seconds in each zone from a series [[sec, value]] (sec since the start). Each sample lasts until the
 * next one, at most maxGap s (a pause in the recording does not count); the last one counts nothing.
 */
export function timeInZones(series = [], zones, maxGap = 30) {
  if (!zones?.length) return null;
  const out = zones.map(() => 0);
  const pts = (series ?? []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  for (let i = 0; i < pts.length - 1; i++) {
    const dt = pts[i + 1][0] - pts[i][0];
    if (!(dt > 0)) continue;
    out[zoneIndex(pts[i][1], zones)] += Math.min(dt, maxGap);
  }
  return out;
}

/** Zone seconds as shares of the longest one (0–1, for the bar heights) and of the total (0–100 %). */
export function zoneBars(secs) {
  if (!secs) return [];
  const top = Math.max(0, ...secs);
  const sum = secs.reduce((a, b) => a + b, 0);
  return secs.map((s) => ({ s, h: top ? s / top : 0, pct: sum ? Math.round((s / sum) * 100) : 0 }));
}

/* ---------- chart data ---------- */

/** At most n points: the average of each of n equal stretches of the samples (time and value). */
export function downsample(points = [], n = 120) {
  const pts = (points ?? []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (pts.length <= n) return pts.map((p) => [p[0], p[1]]);
  const out = [];
  for (let b = 0; b < n; b++) {
    const from = Math.floor((b * pts.length) / n);
    const to = Math.floor(((b + 1) * pts.length) / n);
    let x = 0;
    let y = 0;
    for (let i = from; i < to; i++) {
      x += pts[i][0];
      y += pts[i][1];
    }
    out.push([x / (to - from), y / (to - from)]);
  }
  return out;
}

/** The range of the values: { lo, hi } with a little room; lo from `floor` when given (0 for power). */
export function rangeOf(points = [], floor = null) {
  if (!points.length) return null;
  let lo = Infinity;
  let hi = -Infinity;
  for (const [, v] of points) {
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  if (floor != null) lo = Math.min(lo, floor);
  if (hi - lo < 1) hi = lo + 1;
  const pad = (hi - lo) * 0.08;
  return { lo: floor != null && lo >= floor ? lo : lo - pad, hi: hi + pad };
}

const r1 = (v) => Math.round(v * 10) / 10;
/**
 * An SVG path of a curve in a box w × h (y down): `M x y L …`; a gap of more than `gap` in x (s or km)
 * starts a new piece. area: closed down to the bottom (the elevation profile). → '' with fewer than 2 points.
 */
export function pathOf(points = [], { w = 300, h = 100, gap = 60, floor = null, area = false } = {}) {
  if (points.length < 2) return '';
  const x0 = points[0][0];
  const x1 = points.at(-1)[0];
  const span = x1 - x0 || 1;
  const { lo, hi } = rangeOf(points, floor);
  const X = (x) => r1(((x - x0) / span) * w);
  const Y = (v) => r1(h - ((v - lo) / (hi - lo)) * h);
  if (area) return `M${X(x0)} ${h}${points.map((p) => `L${X(p[0])} ${Y(p[1])}`).join('')}L${X(x1)} ${h}Z`;
  let d = '';
  points.forEach((p, i) => {
    d += `${!i || p[0] - points[i - 1][0] > gap ? 'M' : 'L'}${X(p[0])} ${Y(p[1])}`;
  });
  return d;
}

/** The numbers under a curve: the last value, the average and the highest (rounded); null without points. */
export function curveStats(points = []) {
  const pts = (points ?? []).filter((p) => Array.isArray(p) && Number.isFinite(p[1]));
  if (!pts.length) return null;
  const vs = pts.map((p) => p[1]);
  return { now: Math.round(vs.at(-1)), avg: Math.round(vs.reduce((a, b) => a + b, 0) / vs.length), max: Math.round(Math.max(...vs)) };
}

/** The elevation profile ahead: metres up and down in it, and its length in km; null with fewer than 2 points. */
export function profileStats(points = []) {
  const pts = (points ?? []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (pts.length < 2) return null;
  let up = 0;
  let down = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i][1] - pts[i - 1][1];
    if (d > 0) up += d;
    else down -= d;
  }
  return { up: Math.round(up), down: Math.round(down), km: r1(pts.at(-1)[0] - pts[0][0]) };
}

/** Minutes and seconds as people read them: 0:45, 12:05, 1:02:05. */
export function mmss(s) {
  const t = Math.max(0, Math.round(s || 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const ss = String(t % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}
