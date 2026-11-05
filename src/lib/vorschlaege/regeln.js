/**
 * «Tourenvorschläge» Pilot (Noah 05.11.2026 «a b, Mockup ja», «1a 2a 3a»): mountain bike tours from the open
 * data set «Mountainbikeland Schweiz» (swisstopo/ASTRA, © swisstopo, SchweizMobil). The pilot has five tours
 * in Zurich and Grisons (data/pilot.js, built by scripts/vorschlaege/build-pilot.py).
 *
 * The rules are pure and tested in tests/vorschlaege.test.js. The page is pages/Vorschlaege.svelte.
 * - Level (official, 3 steps): «Kondition» (fitness) and «Technik» (skill). «Medium and difficult» (Noah) means
 *   a tour is shown when its fitness OR its skill level is chosen; «easy» is off at the start but can be switched on.
 * - Time: your own pace (pace.js, «Dein Tempo»): km / speed + climb / metres per hour.
 * - Snow: a rule of thumb by month and height (no weather data in the pilot). It only warns, nothing is hidden for good.
 * - New for you: how much of the line is farther than 150 m from every ride you have recorded.
 */
import { SPEED_KMH, CLIMB_MH } from '../route.js';
import { gpxString } from '../gpxout.js';

export const REGIONS = [
  { key: 'zh', name: 'Zurich|tour' },
  { key: 'gr', name: 'Grisons|tour' },
];
export const LEVELS = ['easy', 'medium', 'difficult'];
/** What is on at the start (Noah: only medium and difficult). */
export const LEVELS_STD = ['medium', 'difficult'];
/** The time choices in hours; null = any. */
export const HOURS = [2, 3, 4, 5, 6];

/** The height (m) from which snow can lie on a typical day of the month (1 = January). A rule of thumb, not a forecast. */
export const SNOW_LINE = { 1: 900, 2: 900, 3: 1200, 4: 1600, 5: 2000, 6: 2400, 7: 3000, 8: 3000, 9: 2500, 10: 2100, 11: 1700, 12: 1100 };
/** Above the line + this many metres snow is likely; between, it is possible. */
export const SNOW_BAND = 300;

/** The tour's levels that count: fitness and skill (a downhill has no fitness level). */
export const levelsOf = (t) => [t?.cond, t?.tech].filter(Boolean);

/** Does the tour have a chosen level (fitness or skill)? levels: a Set or an array. */
export function matchLevels(t, levels) {
  const set = levels instanceof Set ? levels : new Set(levels ?? []);
  return levelsOf(t).some((l) => set.has(l));
}

/** Riding hours with your pace ({ kmh, climbMh }) or the standard; rounded to 5 minutes. */
export function hoursOf(t, pace = null) {
  const kmh = Number(pace?.kmh) > 0 ? Number(pace.kmh) : SPEED_KMH;
  const mh = Number(pace?.climbMh) > 0 ? Number(pace.climbMh) : CLIMB_MH;
  const h = (t.lenM ?? t.km * 1000) / 1000 / kmh + (t.up ?? 0) / mh;
  return Math.max(5, Math.round((h * 60) / 5) * 5) / 60;
}

/** Hours → { h, min } for «3 h 40». */
export function splitHours(h) {
  const m = Math.round(h * 60);
  return { h: Math.floor(m / 60), min: m % 60 };
}

/** «likely», «possible» or null: the snow at the highest point of the tour in this month. */
export function snowOf(t, month) {
  const line = SNOW_LINE[month];
  if (!line || !Number.isFinite(t?.max)) return null;
  if (t.max > line + SNOW_BAND) return 'likely';
  if (t.max > line) return 'possible';
  return null;
}

/**
 * The tours to show: region (set or array; empty = all), levels, the most hours (null = any), without the hidden ones.
 * pace is used for the time.
 */
export function filterTours(tours = [], { regions = [], levels = LEVELS_STD, maxHours = null, hidden = [], pace = null } = {}) {
  const rs = new Set(regions ?? []);
  const hid = new Set(hidden ?? []);
  return tours.filter((t) => !hid.has(t.id) && (!rs.size || rs.has(t.region)) && matchLevels(t, levels) && (!maxHours || hoursOf(t, pace) <= maxHours + 1e-9));
}

/** Splits a list: what fits this month and what does not (snow likely). */
export function splitNow(tours = [], month) {
  const fits = [];
  const notNow = [];
  for (const t of tours) (snowOf(t, month) === 'likely' ? notNow : fits).push(t);
  return { fits, notNow };
}

/* ---------- new for you ---------- */

const CELL = 0.0015; // about 170 m
const key = (la, lo) => `${Math.round(la / CELL)}:${Math.round(lo / (CELL * 1.45))}`;
const rad = (d) => (d * Math.PI) / 180;
/** Metres between two [lat, lon] points. */
export function metres(a, b) {
  const dy = (b[0] - a[0]) * 111320;
  const dx = (b[1] - a[1]) * 111320 * Math.cos(rad((a[0] + b[0]) / 2));
  return Math.hypot(dx, dy);
}

/** A grid of your own ride points: lines = [[[lat, lon], …], …]. null when there is nothing. */
export function gridOf(lines = []) {
  const g = new Map();
  let n = 0;
  for (const l of lines) {
    for (const p of l ?? []) {
      if (!Array.isArray(p) || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
      const k = key(p[0], p[1]);
      if (!g.has(k)) g.set(k, []);
      g.get(k).push(p);
      n++;
    }
  }
  return n ? g : null;
}

/** The line with a point at least every `step` metres. */
export function densify(line = [], step = 100) {
  const out = [];
  for (let i = 0; i < line.length; i++) {
    out.push(line[i]);
    const nx = line[i + 1];
    if (!nx) break;
    const d = metres(line[i], nx);
    const k = Math.floor(d / step);
    for (let j = 1; j <= k; j++) out.push([line[i][0] + ((nx[0] - line[i][0]) * j) / (k + 1), line[i][1] + ((nx[1] - line[i][1]) * j) / (k + 1)]);
  }
  return out;
}

/** Share (0 to 1) of the tour's line that you have not ridden (farther than `near` m from your points); null without rides. */
export function newShare(t, grid, near = 150) {
  if (!grid || !t?.line?.length) return null;
  const pts = densify(t.line, 100);
  let fresh = 0;
  for (const p of pts) {
    const la = Math.round(p[0] / CELL);
    const lo = Math.round(p[1] / (CELL * 1.45));
    let hit = false;
    for (let a = -1; a <= 1 && !hit; a++) {
      for (let b = -1; b <= 1 && !hit; b++) {
        for (const q of grid.get(`${la + a}:${lo + b}`) ?? []) {
          if (metres(p, q) <= near) {
            hit = true;
            break;
          }
        }
      }
    }
    if (!hit) fresh++;
  }
  return fresh / pts.length;
}

/** Km as the crow flies from home { lat, lon } to the start of the tour; null without home. */
export function awayKm(t, home) {
  if (!home || !Number.isFinite(Number(home.lat)) || !Number.isFinite(Number(home.lon)) || !t?.line?.length) return null;
  return Math.round(metres([Number(home.lat), Number(home.lon)], t.line[0]) / 1000);
}

/**
 * The lines under «Why this suggestion?»: [{ k, tone, ...params }], tone 'ok' or 'warn'.
 * k: 'level' (levels), 'time' (hours, window), 'snow' (state), 'new' (share), 'away' (km). ctx: { pace, month, maxHours, grid, home }.
 */
export function whyOf(t, ctx = {}) {
  const out = [];
  const h = hoursOf(t, ctx.pace);
  out.push({ k: 'time', tone: ctx.maxHours && h > ctx.maxHours ? 'warn' : 'ok', hours: h, window: ctx.maxHours ?? null, mine: !!ctx.pace?.mine });
  const snow = snowOf(t, ctx.month);
  if (snow) out.push({ k: 'snow', tone: 'warn', state: snow, max: t.max });
  else if (ctx.month) out.push({ k: 'snow', tone: 'ok', state: 'none', max: t.max });
  const hard = levelsOf(t).includes('difficult');
  if (hard) out.push({ k: 'level', tone: 'warn', cond: t.cond ?? null, tech: t.tech });
  const share = newShare(t, ctx.grid);
  if (share !== null) out.push({ k: 'new', tone: 'ok', share: Math.round(share * 100) });
  const km = awayKm(t, ctx.home);
  if (km !== null) out.push({ k: 'away', tone: 'ok', km });
  return out;
}

/** The warnings of a tour for the box on its page: 'level', 'snow' (state). */
export function warnsOf(t, month) {
  const w = [];
  if (levelsOf(t).includes('difficult')) w.push({ k: 'level' });
  const s = snowOf(t, month);
  if (s) w.push({ k: 'snow', state: s });
  return w;
}

/** The GPX text of a tour (line with the height of the nearest 100 m). */
export function gpxOf(t, title = '') {
  const line = (t.line ?? []).map((p, i, a) => {
    const idx = Math.min((t.ele?.length ?? 1) - 1, Math.round((i / Math.max(1, a.length - 1)) * ((t.ele?.length ?? 1) - 1)));
    return [p[0], p[1], t.ele?.[idx]];
  });
  return gpxString({ name: title || t.title, line });
}

/** The tour as a dream (title, a note with km and climb, the source link). Used by «Keep as a dream». */
export const dreamTextOf = (t) => `${t.km} km, +${t.up} m · SchweizMobil ${t.route}`;
