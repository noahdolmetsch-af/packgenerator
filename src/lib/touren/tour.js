/**
 * «Abgeschlossene Touren: mehr damit machen» (Noah 19.10.2026 21:05 «1a 2 beides 3b 4 beides 5a»):
 * the page «Tour» (#/tour/<key>) for every finished tour, and what a person can change on it.
 *
 *   key  'a:<activity id>'  one Strava activity
 *        'g:<group id>'     several Strava activities joined into one tour (5a)
 *        't:<trip id>'      a trip packed in the app (Packmodus); its Rückblick is a part of the page (1a)
 *
 *   - 3b: km, Hm and the moving time can be corrected; the Strava value stays and shows as «Strava: …»
 *     beside the mark «changed». Activities keep the change in `own` (training.js KEEP), trips and joined
 *     tours in their own `own`.
 *   - Hiding an activity keeps it (a filter shows it again); deleting it removes it from the app and
 *     STRAVA_GONE_KEY keeps the next fetch from bringing it back (Undo takes both back).
 *   - 5a: a joined tour is { id, name, acts, own, diary, rating, good, next, at } in TOUR_GROUPS_KEY. An
 *     activity is in one joined tour at most; «Verbindung lösen» deletes the joined tour, the activities stay.
 *
 * Pure helpers, tested in tests/tour.test.js.
 */
import { decodePolyline, lineKm } from '../spur/polyline.js';

export const TOUR_GROUPS_KEY = 'tourGroups';
export const STRAVA_GONE_KEY = 'stravaGone';
/** The page's own choices: { mode: 'all' | 'tabs', kpis: [...] } and the list view of «Abgeschlossene Touren». */
export const TOUR_PAGE_KEY = 'tourPage';

/** 2 «beides»: the parts of the page, shown one below the other with a jump bar, or one at a time as tabs. */
export const PARTS = [
  { key: 'overview', name: 'Overview|tour' },
  { key: 'values', name: 'Values|tour' },
  { key: 'pack', name: 'Gear|tour' },
  { key: 'diary', name: 'Diary|tour' },
  { key: 'review', name: 'Look back|tour' },
  { key: 'analysis', name: 'Analysis|ana' },
];
export const MODES = ['all', 'tabs'];

/** 4 «beides»: the views of the list «Abgeschlossene Touren». */
export const LIST_VIEWS = [
  { key: 'rows', name: 'Rows|view' },
  { key: 'tiles', name: 'Tiles|view' },
  { key: 'map', name: 'Map|view' },
  { key: 'cal', name: 'Calendar|view' },
];

/** The key figures a person can put on top of the page (at most KPI_MAX), in this order of choice. */
export const KPIS = [
  { key: 'km', name: 'Distance', unit: 'km' },
  { key: 'hm', name: 'Climbing', unit: 'Hm' },
  { key: 'dauer', name: 'Moving time', unit: '' },
  { key: 'verstr', name: 'Elapsed|col', unit: '' },
  { key: 'kmh', name: 'Ø speed', unit: 'km/h' },
  { key: 'hf', name: 'Ø HR', unit: 'bpm' },
  { key: 'hfmax', name: 'Max. HR', unit: 'bpm' },
  { key: 'w', name: 'Ø power', unit: 'W' },
  { key: 'tss', name: 'TSS', unit: '' },
  { key: 'n', name: 'Activities', unit: '' },
];
// Noah 20.10.2026 «vier Werte hervorheben»: Distanz, Höhenmeter, Fahrzeit, Ø Herzfrequenz (changeable)
export const KPI_DEFAULT = ['km', 'hm', 'dauer', 'hf'];
export const KPI_MAX = 6;

/** The fields 3b lets a person correct. */
export const OWN_FIELDS = ['km', 'hm', 'movingS'];

export const tourHref = (key) => `#/tour/${encodeURIComponent(key)}`;

/** { kind: 'a' | 'g' | 't', id } of a key, or null. */
export function parseKey(key) {
  const m = /^([agt]):(.+)$/.exec(String(key ?? ''));
  return m ? { kind: m[1], id: m[2] } : null;
}

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Only the own values that are set and differ from Strava's (an empty own value means «Strava's»). */
export function cleanOwn(own = {}, base = {}) {
  const out = {};
  for (const [k, v] of Object.entries(own ?? {})) {
    if (v == null || v === '') continue;
    if (OWN_FIELDS.includes(k) || k === 'kind') {
      if (v !== base[k]) out[k] = v;
    } else out[k] = v;
  }
  return out;
}

/**
 * An activity with the person's own values: name, km, Hm, moving time, kind (3b). The speed is worked
 * out again when km or the time changed. changed: the corrected fields; strava: Strava's values of them.
 */
export function withOwn(a) {
  const own = a?.own ?? {};
  const out = { ...a, changed: [], strava: {} };
  if (own.name) out.name = own.name;
  if (own.kind) out.kind = own.kind;
  for (const f of OWN_FIELDS) {
    if (fin(own[f]) == null) continue;
    out.strava[f] = a[f] ?? null;
    out[f] = own[f];
    out.changed.push(f);
  }
  if (out.changed.includes('km') || out.changed.includes('movingS')) out.spdAvg = null;
  return out;
}

/** A merged row with corrected values (a joined tour or a trip): km, Hm, moving time; speed again. */
export function rowWithOwn(row, own) {
  if (!row || !own) return row;
  const out = { ...row, changed: [...(row.changed ?? [])], strava: { ...(row.strava ?? {}) } };
  const map = { km: 'km', hm: 'hm', movingS: 'dauer' };
  for (const [f, k] of Object.entries(map)) {
    if (fin(own[f]) == null) continue;
    out.strava[f] = row[k] ?? null;
    out[k] = own[f];
    if (!out.changed.includes(f)) out.changed.push(f);
  }
  if (own.name) out.name = own.name;
  if (out.km > 0 && out.dauer > 0 && (fin(own.km) != null || fin(own.movingS) != null)) out.kmh = Math.round((out.km / (out.dauer / 3600)) * 10) / 10;
  return out;
}

/** «2:30» or «2 h 30» or «150» (minutes) → seconds; '' → null; nonsense → NaN. */
export function parseDuration(text) {
  const s = String(text ?? '').trim();
  if (!s) return null;
  const hm = /^(\d{1,3})\s*(?::|h|\.)\s*(\d{1,2})?\s*(?:min)?$/i.exec(s);
  if (hm) {
    const m = Number(hm[2] ?? 0);
    return m < 60 ? Number(hm[1]) * 3600 + m * 60 : NaN;
  }
  if (/^\d{1,4}$/.test(s)) return Number(s) * 60;
  return NaN;
}
/** Seconds → «2:30»; minutes rounded first, so 1:59:40 is «2:00», never «1:60». */
export const durationText = (s) => {
  if (fin(s) == null) return '';
  const m = Math.round(s / 60);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
};

/** A number typed with a comma or a point; '' → null; nonsense → NaN. */
export function parseNumber(text) {
  const s = String(text ?? '').trim().replace(/['’\s]/g, '').replace(',', '.');
  if (!s) return null;
  const v = Number(s);
  return Number.isFinite(v) && v >= 0 ? v : NaN;
}

/* ---- 5a: joined tours ---- */

/** The joined tour an activity belongs to, or null. */
export const groupOf = (groups, actId) => (groups ?? []).find((g) => (g.acts ?? []).includes(String(actId))) ?? null;

/**
 * Join activities into one tour. They leave any joined tour they were in (an empty one goes).
 * → { groups, id }
 */
export function joinActs(groups = [], actIds = [], name = '', now = new Date()) {
  const ids = [...new Set(actIds.map(String))];
  const id = `tg-${now.getTime().toString(36)}`;
  const rest = groups.map((g) => ({ ...g, acts: (g.acts ?? []).filter((a) => !ids.includes(a)) })).filter((g) => g.acts.length > 1);
  return { groups: [...rest, { id, name: String(name ?? '').trim(), acts: ids, at: now.toISOString() }], id };
}

/** Change one joined tour (name, own values, diary, rating …). */
export const patchGroup = (groups = [], id, patch) => groups.map((g) => (g.id === id ? { ...g, ...patch } : g));

/** «Verbindung lösen»: the joined tour goes, its activities stay as they are. */
export const dropGroup = (groups = [], id) => groups.filter((g) => g.id !== id);

/** Take one activity out of a joined tour; with fewer than two left, the joined tour goes. */
export function leaveGroup(groups = [], id, actId) {
  return groups.map((g) => (g.id === id ? { ...g, acts: g.acts.filter((a) => a !== String(actId)) } : g)).filter((g) => g.acts.length > 1);
}

/* ---- the page ---- */

/** The page's choices with the defaults filled in. */
export function pageOpts(rec) {
  const v = rec ?? {};
  const kpis = Array.isArray(v.kpis) ? v.kpis.filter((k) => KPIS.some((x) => x.key === k)).slice(0, KPI_MAX) : KPI_DEFAULT;
  return { mode: MODES.includes(v.mode) ? v.mode : 'all', kpis: kpis.length ? kpis : KPI_DEFAULT, list: LIST_VIEWS.some((x) => x.key === v.list) ? v.list : 'rows' };
}

/** The lines of the map: one per activity with a Strava line, else the planned route of the trip. */
export function linesOf(acts = [], trip = null) {
  const out = [];
  acts.forEach((a, i) => {
    const pts = a?.line ? decodePolyline(a.line) : [];
    if (pts.length >= 2) out.push({ id: `a-${a.id}`, pts, n: i + 1, src: 'strava' });
  });
  if (!out.length && Array.isArray(trip?.route?.line) && trip.route.line.length >= 2) out.push({ id: 'route', pts: trip.route.line.filter((p) => Array.isArray(p) && p.length >= 2), n: 1, src: 'route' });
  return out;
}

/** All points of the lines one after the other (for «where on the map is this bit of the profile»). */
export const joinedLine = (lines) => lines.flatMap((l) => l.pts);

/**
 * The elevation profile [[km, m], …]: the planned route's profile of a trip, else the course of the
 * activities (Strava detail `prof.pts` = [min, m, …]), placed along their km one after the other.
 */
export function profileOf(acts = [], trip = null) {
  if (Array.isArray(trip?.route?.profile) && trip.route.profile.length > 1 && !acts.some((a) => a?.prof?.pts?.length > 1)) return trip.route.profile;
  const out = [];
  let at = 0;
  for (const a of acts) {
    const pts = (a?.prof?.pts ?? []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
    const km = fin(a?.km) ?? (a?.line ? lineKm(decodePolyline(a.line)) : 0);
    if (pts.length < 2 || !km) {
      at += km || 0;
      continue;
    }
    const end = pts.at(-1)[0] || 1;
    for (const p of pts) out.push([Math.round((at + (p[0] / end) * km) * 100) / 100, Math.round(p[1])]);
    at += km;
  }
  return out.length > 1 ? out : [];
}

/** The value of a key figure on a row. */
export function kpiOf(row, key) {
  if (!row) return null;
  if (key === 'n') return row.n ?? 1;
  return row[key] ?? null;
}

/**
 * 4: the calendar of one month: weeks from Monday, each day { day, rows } (null outside the month).
 * rows: list rows (a tour counts on each of its days).
 */
export function calMonth(rows = [], ym) {
  const [y, m] = ym.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;
  const cells = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) {
    const day = `${ym}-${String(d).padStart(2, '0')}`;
    cells.push({ day, rows: rows.filter((r) => r.day <= day && (r.endDay ?? r.day) >= day) });
  }
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** The months with rows, newest first ('YYYY-MM'). */
export const monthsWith = (rows = []) => [...new Set(rows.flatMap((r) => [r.day.slice(0, 7), (r.endDay ?? r.day).slice(0, 7)]))].sort().reverse();

/** The month before / after 'YYYY-MM'. */
export function shiftMonth(ym, n) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** A small still line of a tour for its tile: an SVG path in a w×h box, or ''. */
export function miniPath(lines, w = 120, h = 72, pad = 6) {
  const pts = joinedLine(lines);
  if (pts.length < 2) return '';
  const lat0 = Math.min(...pts.map((p) => p[0]));
  const lat1 = Math.max(...pts.map((p) => p[0]));
  const lon0 = Math.min(...pts.map((p) => p[1]));
  const lon1 = Math.max(...pts.map((p) => p[1]));
  const k = Math.cos(((lat0 + lat1) / 2) * (Math.PI / 180));
  const sx = (lon1 - lon0) * k || 1e-6;
  const sy = lat1 - lat0 || 1e-6;
  const s = Math.min((w - 2 * pad) / sx, (h - 2 * pad) / sy);
  const ox = (w - sx * s) / 2;
  const oy = (h - sy * s) / 2;
  const step = Math.max(1, Math.floor(pts.length / 200));
  return pts
    .filter((_, i) => i % step === 0 || i === pts.length - 1)
    .map((p, i) => `${i ? 'L' : 'M'}${(ox + (p[1] - lon0) * k * s).toFixed(1)},${(oy + (lat1 - p[0]) * s).toFixed(1)}`)
    .join('');
}

/** The text «Teilen» sends: name, date, the main values. */
export function shareText(row, { date = '', values = [] } = {}) {
  return [row?.name ?? '', date, values.filter(Boolean).join(' · ')].filter(Boolean).join('\n');
}
