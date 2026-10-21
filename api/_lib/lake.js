/**
 * Paket G «Daten kommen von selbst», #9 «Seetemperatur Zürichsee als Verlauf» (Noah 19.10.2026): the
 * pure parts of /api/lake, kept free of Node so the app can use the same code as its fallback
 * (src/lib/lake.js) when the server cannot be reached.
 *
 * Two free sources without a key:
 * - the measurement: Stadt Zürich, Wasserschutzpolizei, station Mythenquai, every 10 minutes, through
 *   the Tecdottir API (open data). Format (documented, not checked live from here):
 *     GET /measurements/mythenquai?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&sort=timestamp_cet desc&limit=N&offset=M
 *     → { ok, total_count, result: [ { station, timestamp, values: { timestamp_cet: { value },
 *         water_temperature: { value, unit, status }, air_temperature: { value } … } } ] }
 * - the preview: Eawag Alplakes, Simstrat 1D model of Lake Zurich (a calculation, not a measurement):
 *     GET /simulations/1d/point/simstrat/zurich/{startYYYYmmddHHMM}/{endYYYYmmddHHMM}/{depth}
 *     → believed { time: [...], variables: { T: { data: [...], unit } } }. Read tolerantly; on any
 *       doubt the preview is simply empty.
 *
 * Days are calendar days in Europe/Zurich.
 */

export const TECDOTTIR_BASES = ['https://tecdottir.metaodi.ch', 'https://tecdottir.herokuapp.com'];
export const ALPLAKES_BASE = 'https://alplakes-api.eawag.ch';
export const STATION = 'mythenquai';
export const LAKE_ID = 'zurich';
/** Depth of the model value in metres (the swimming layer near the surface). */
export const DEPTH_M = 1;
/** How many past days the server sums up, and how many days ahead the preview shows. */
export const PAST_DAYS = 30;
export const AHEAD_DAYS = 4;
export const PAGE = 1000;
export const MAX_PAGES = 6; // 30 days × 144 values = 4320 rows
export const TIMEOUT_MS = 8000;
/**
 * Fix 21.10.2026 (live check of 0.170: forecastNote «timeout»): the Eawag model answers slowly from
 * the US server (it reads a month file). The preview gets its own, longer time; the city stays fast.
 */
export const FORECAST_TIMEOUT_MS = 25000;
/** A preview fetched once stays usable this long when the next try fails (same server instance). */
export const FORECAST_KEEP_MS = 12 * 60 * 60 * 1000;

const TZ = 'Europe/Zurich';
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const partsFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** The calendar day (YYYY-MM-DD) in Zurich of a moment (Date, ISO string or ms). */
export function zurichDay(at) {
  const d = at instanceof Date ? at : new Date(at);
  if (Number.isNaN(d.getTime())) return null;
  return dayFmt.format(d);
}

/** Calendar-day arithmetic on YYYY-MM-DD. */
export function addDays(day, k) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + k);
  return d.toISOString().slice(0, 10);
}

/** Minutes Zurich is ahead of UTC at that moment (60 in winter, 120 in summer). */
function zurichOffsetMin(ms) {
  const p = Object.fromEntries(partsFmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
}

/** A Zurich wall-clock time → the UTC moment (ms). */
function zurichLocalMs(y, mo, d, h = 0, mi = 0, s = 0) {
  const guess = Date.UTC(y, mo - 1, d, h, mi, s);
  const off = zurichOffsetMin(guess - 60 * 60000);
  const ms = guess - off * 60000;
  const off2 = zurichOffsetMin(ms);
  return off2 === off ? ms : guess - off2 * 60000;
}

/**
 * One time value → ISO (UTC) or null. Takes an ISO string with zone, epoch seconds or ms, and the
 * zone-less forms «2026-10-19T12:10:00» / «19.10.2026 12:10:00» as Zurich wall-clock time.
 */
export function parseTime(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number' && Number.isFinite(v)) {
    const ms = v < 1e11 ? v * 1000 : v;
    return new Date(ms).toISOString();
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})[ T]?(\d{1,2})?:?(\d{2})?:?(\d{2})?$/);
  if (m) return new Date(zurichLocalMs(+m[3], +m[2], +m[1], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0))).toISOString();
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?$/);
  if (m) return new Date(zurichLocalMs(+m[1], +m[2], +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0))).toISOString();
  if (/^\d+(\.\d+)?$/.test(s)) return parseTime(Number(s));
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const num = (v) => {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
/** A plausible lake water temperature, else null (sensor gaps come as null, -999 or 99). */
const waterOk = (v) => (v != null && v >= -1 && v <= 35 ? v : null);
const airOk = (v) => (v != null && v >= -40 && v <= 50 ? v : null);
const r1 = (v) => Math.round(v * 10) / 10;
const valueOf = (x) => (x && typeof x === 'object' ? x.value : x);
const BAD_STATUS = /broken|error|invalid|defekt|fehler/i;

/* ---------- Tecdottir (Stadt Zürich, Mythenquai) ---------- */

export function tecdottirUrl({ from, to, limit = PAGE, offset = 0, base = TECDOTTIR_BASES[0], station = STATION }) {
  const q = new URLSearchParams({ startDate: from, endDate: to, sort: 'timestamp_cet desc', limit: String(limit), offset: String(offset) });
  return `${base}/measurements/${station}?${q.toString().replace(/\+/g, '%20')}`;
}

/** The rows of a Tecdottir answer → [{ at (ISO UTC), water, air }], newest first; bad rows dropped. */
export function parseTecdottir(body) {
  const list = Array.isArray(body) ? body : Array.isArray(body?.result) ? body.result : Array.isArray(body?.results) ? body.results : [];
  const out = [];
  for (const row of list) {
    if (!row || typeof row !== 'object') continue;
    const v = row.values ?? row;
    const at = parseTime(row.timestamp) ?? parseTime(valueOf(v.timestamp_utc)) ?? parseTime(valueOf(v.timestamp_cet)) ?? parseTime(row.timestamp_cet);
    if (!at) continue;
    const w = v.water_temperature;
    const status = w && typeof w === 'object' ? String(w.status ?? '') : '';
    const water = BAD_STATUS.test(status) ? null : waterOk(num(valueOf(w)));
    const air = airOk(num(valueOf(v.air_temperature)));
    if (water == null && air == null) continue;
    out.push({ at, water, air });
  }
  return out.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

/** The newest row with a water value → { at, water, air? } or null. */
export function latest(rows) {
  const r = rows.find((x) => x.water != null);
  if (!r) return null;
  const air = rows.find((x) => x.at === r.at)?.air;
  return { at: r.at, water: r1(r.water), ...(air != null ? { air: r1(air) } : {}) };
}

/** Rows → one entry per Zurich day: [{ day, min, max, mean, n }], oldest first. from: first day kept. */
export function dailyStats(rows, { from = null, to = null } = {}) {
  const by = new Map();
  for (const r of rows) {
    if (r.water == null) continue;
    const day = zurichDay(r.at);
    if (!day || (from && day < from) || (to && day > to)) continue;
    const s = by.get(day) ?? { day, min: Infinity, max: -Infinity, sum: 0, n: 0 };
    s.min = Math.min(s.min, r.water);
    s.max = Math.max(s.max, r.water);
    s.sum += r.water;
    s.n += 1;
    by.set(day, s);
  }
  return [...by.values()]
    .sort((a, b) => (a.day < b.day ? -1 : 1))
    .map((s) => ({ day: s.day, min: r1(s.min), max: r1(s.max), mean: r1(s.sum / s.n), n: s.n }));
}

/* ---------- Alplakes (Eawag, Simstrat 1D) ---------- */

/** A moment → YYYYmmddHHMM in UTC (the Alplakes path format). */
export function alplakesStamp(d) {
  const iso = (d instanceof Date ? d : new Date(d)).toISOString();
  return iso.slice(0, 4) + iso.slice(5, 7) + iso.slice(8, 10) + iso.slice(11, 13) + iso.slice(14, 16);
}

export function alplakesUrl({ start, end, depth = DEPTH_M, lake = LAKE_ID, base = ALPLAKES_BASE }) {
  return `${base}/simulations/1d/point/simstrat/${lake}/${alplakesStamp(start)}/${alplakesStamp(end)}/${depth}`;
}

const TEMP_KEY = /^(t|temp|temperature|water_?temperature|watertemp)$/i;
const TIME_KEY = ['time', 'times', 'datetime', 'date', 'timestamps', 'timestamp'];

/** A list of numbers out of [1, 2] or [[1], [2]] or { data: [...] }. */
function series(x) {
  const arr = Array.isArray(x) ? x : Array.isArray(x?.data) ? x.data : Array.isArray(x?.values) ? x.values : null;
  if (!arr) return null;
  return arr.map((v) => (Array.isArray(v) ? num(v[0]) : num(v)));
}

/** An Alplakes answer → [{ at, water }] oldest first, or [] when it cannot be read. */
export function parseAlplakes(body) {
  if (!body || typeof body !== 'object') return [];
  // a list of points: [{ time, T }]
  if (Array.isArray(body)) {
    return body
      .map((p) => {
        const at = parseTime(p?.time ?? p?.datetime ?? p?.date);
        const k = p && Object.keys(p).find((x) => TEMP_KEY.test(x));
        return { at, water: waterOk(num(valueOf(k ? p[k] : null))) };
      })
      .filter((p) => p.at && p.water != null)
      .sort((a, b) => (a.at < b.at ? -1 : 1));
  }
  const tk = TIME_KEY.find((k) => Array.isArray(body[k]));
  const times = tk ? body[tk] : null;
  const vars = body.variables && typeof body.variables === 'object' ? body.variables : body;
  const vk = Object.keys(vars).find((k) => TEMP_KEY.test(k) && series(vars[k]));
  const vals = vk ? series(vars[vk]) : null;
  if (!times || !vals) return [];
  const out = [];
  for (let i = 0; i < Math.min(times.length, vals.length); i++) {
    const at = parseTime(times[i]);
    const water = waterOk(vals[i]);
    if (at && water != null) out.push({ at, water });
  }
  return out.sort((a, b) => (a.at < b.at ? -1 : 1));
}

/** Model points → the next days: [{ day, water (mean), min, max }], from today on, at most `ahead` days. */
export function forecastDays(points, today, ahead = AHEAD_DAYS) {
  const last = addDays(today, ahead);
  return dailyStats(points, { from: today, to: last }).map(({ day, mean, min, max }) => ({ day, water: mean, min, max }));
}

/* ---------- the whole answer ---------- */

async function getJson(doFetch, url, timeout) {
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), timeout) : null;
  try {
    const res = await doFetch(url, { headers: { Accept: 'application/json' }, ...(ctl ? { signal: ctl.signal } : {}) });
    if (!res.ok) throw new Error(`status ${res.status}`);
    return await res.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** All rows of the last days from the first host that answers. pages: how many pages at most. */
export async function fetchMeasurements(doFetch, { from, to, pages = MAX_PAGES, timeout = TIMEOUT_MS } = {}) {
  let lastErr = null;
  for (const base of TECDOTTIR_BASES) {
    try {
      const rows = [];
      for (let p = 0; p < pages; p++) {
        const body = await getJson(doFetch, tecdottirUrl({ from, to, offset: p * PAGE, base }), timeout);
        if (body && body.ok === false) throw new Error('not ok');
        const list = Array.isArray(body?.result) ? body.result : Array.isArray(body) ? body : [];
        rows.push(...parseTecdottir(body));
        const total = num(body?.total_count);
        if (list.length < PAGE || (total != null && (p + 1) * PAGE >= total)) break;
      }
      return rows.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error('no source');
}

/**
 * Fix 20.10.2026 (thread «Seetemperatur und Sauna»): the preview stayed empty. Alplakes answers an
 * unknown lake with 400 and «… please select from: [a, b, …]»; from that list the key of Lake Zurich
 * is taken (the lower lake, not «upper…»). null when there is none.
 */
export function lakeKeyFrom(detail) {
  const m = String(detail ?? '').match(/\[([^\]]*)\]/);
  if (!m) return null;
  const keys = m[1].split(',').map((k) => k.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  return keys.find((k) => /^(lower_?)?zurich$/i.test(k)) ?? keys.find((k) => /zuri/i.test(k) && !/upper|ober/i.test(k)) ?? null;
}

/** One request that keeps the error text: → { ok, status, body }; throws only on network or timeout. */
async function getRaw(doFetch, url, timeout) {
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), timeout) : null;
  try {
    const res = await doFetch(url, { headers: { Accept: 'application/json' }, ...(ctl ? { signal: ctl.signal } : {}) });
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { ok: !!res.ok, status: res.status, body };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// the lake key that worked last and the last preview (both stay while the server instance lives)
let knownKey = null;
let lastForecast = null; // { at: ms, points }

/** For tests: forget the kept key and preview. */
export function resetForecastMemo() {
  knownKey = null;
  lastForecast = null;
}

/**
 * The model points from midnight today (Zurich) for `ahead` days. → { points, note }: note says in a few
 * words why the preview is empty (shown nowhere in the app, only in the server answer for checking).
 */
export async function fetchForecastWithNote(doFetch, opts = {}) {
  const now = opts.now ?? new Date();
  const r = await askForecast(doFetch, opts);
  if (r.points.length) {
    lastForecast = { at: now.getTime(), points: r.points };
    return r;
  }
  // the last good preview, while it is young enough (its days from today on are still a preview)
  if (lastForecast && now.getTime() - lastForecast.at < FORECAST_KEEP_MS) return { points: lastForecast.points, note: '', kept: true };
  return r;
}

async function askForecast(doFetch, { now = new Date(), ahead = AHEAD_DAYS, timeout = FORECAST_TIMEOUT_MS } = {}) {
  const today = zurichDay(now);
  const start = new Date(`${today}T00:00:00Z`);
  let lake = knownKey ?? LAKE_ID;
  let note = '';
  for (const days of [ahead + 1, 3]) {
    const end = new Date(`${addDays(today, days)}T00:00:00Z`);
    for (let tries = 0; tries < 2; tries++) {
      try {
        const r = await getRaw(doFetch, alplakesUrl({ start, end, lake }), timeout);
        if (r.ok) {
          const pts = parseAlplakes(r.body);
          if (pts.length) {
            knownKey = lake;
            return { points: pts, note: '' };
          }
          note = 'no points';
          break;
        }
        const detail = typeof r.body?.detail === 'string' ? r.body.detail : '';
        note = `status ${r.status}${detail ? `: ${detail.slice(0, 140)}` : ''}`;
        const other = r.status === 400 ? lakeKeyFrom(detail) : null;
        if (other && other !== lake) {
          lake = other; // the right key: ask again at once
          continue;
        }
        break;
      } catch (err) {
        // a timeout or no network: a second, shorter window would only wait again
        return { points: [], note: err?.name === 'AbortError' ? 'timeout' : 'network' };
      }
    }
  }
  return { points: [], note };
}

/** The model points only; [] on any failure. */
export async function fetchForecast(doFetch, opts = {}) {
  return (await fetchForecastWithNote(doFetch, opts)).points;
}

/**
 * The answer of GET /api/lake?step=now:
 *   { now: { at, water, air? } | null, days: [{ day, min, max, mean, n }], forecast: [{ day, water, min, max }],
 *     at: ISO of this answer, sources: { measurement: bool, forecast: bool } }
 * Throws only when neither source gave anything.
 */
export async function lakeNow({ doFetch = (...a) => fetch(...a), now = new Date(), pages = MAX_PAGES, timeout = TIMEOUT_MS, forecastTimeout = FORECAST_TIMEOUT_MS } = {}) {
  const today = zurichDay(now);
  const from = addDays(today, -(PAST_DAYS - 1));
  const [rows, points] = await Promise.all([
    // the city's endDate is «before which» (exclusive): ask up to tomorrow, or today's values are missing
    fetchMeasurements(doFetch, { from, to: addDays(today, 1), pages, timeout }).catch(() => null),
    fetchForecastWithNote(doFetch, { now, timeout: forecastTimeout }),
  ]);
  const forecast = forecastDays(points.points, today);
  // a kept preview alone is no answer (offline it would replace the stored measurement)
  if (!rows?.length && (!forecast.length || points.kept)) throw new Error('no lake data');
  return {
    at: now.toISOString(),
    now: rows ? latest(rows) : null,
    days: rows ? dailyStats(rows, { from, to: today }) : [],
    forecast,
    sources: { measurement: !!rows?.length, forecast: forecast.length > 0, ...(forecast.length ? {} : { forecastNote: points.note || 'empty' }) },
  };
}

/** Is this a usable answer (from the server or the fallback)? */
export function isLakeAnswer(x) {
  return !!x && typeof x === 'object' && Array.isArray(x.days) && Array.isArray(x.forecast) && (x.now == null || (typeof x.now.at === 'string' && typeof x.now.water === 'number'));
}
