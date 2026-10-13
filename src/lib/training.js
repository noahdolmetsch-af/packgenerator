/**
 * «Training» (mockups TR1–TR4, Noah 13.10.2026 «1-5a», «tr1-4 ok»): every Strava activity with its
 * time in the heart rate zones. Pure rules; the page is pages/flow/Training.svelte, one activity
 * pages/flow/TrainingAct.svelte, the tile on Today lib/strava/StravaTile.svelte.
 *
 * - Every activity from Strava is kept (db.activities); only rides count for the bikes (kmBook) (2a).
 * - The zones come from Strava and can be changed (3a): four bounds, a beat below the first is Z1,
 *   from the fourth on Z5. The server sends the heart rate as seconds per beat (hist), so a changed
 *   zone needs no new call.
 * - Health data: observation only, never a rating.
 */
export const ZONES_KEY = 'strava.zones'; // Strava's zones, as fetched: { hr: [{ min, max }], at }
export const OWN_ZONES_KEY = 'training.zones'; // Noah's own bounds: { own: [b1, b2, b3, b4] } or null
export const ZONE_NAMES = ['Recovery|zone', 'Endurance|zone', 'Tempo|zone', 'Threshold|zone', 'Maximum|zone'];
/** Without zones from Strava or own ones: 60/70/80/90 % of a maximum heart rate of 190. */
export const DEFAULT_MAX = 190;
export const DEFAULT_BOUNDS = [0.6, 0.7, 0.8, 0.9].map((p) => Math.round(DEFAULT_MAX * p));
/** Details (heart rate, kcal) fetched by themselves per fetch: the newest, within these days. */
export const DETAIL_MAX = 8;
export const DETAIL_DAYS = 90;

const KINDS = [
  ['bike', /(Ride|Velomobile|Handcycle)$/],
  ['run', /Run$/],
  ['hike', /^(Hike|Walk)$/],
];
/** bike, run, hike or other (the filter chips and the icon). */
export const kindOf = (type) => KINDS.find(([, re]) => re.test(String(type ?? '')))?.[0] ?? 'other';
export const KIND_NAMES = { bike: 'Bike|kind', run: 'Run|kind', hike: 'Hike|kind', other: 'Other|kind' };
/** The words for Strava's sport types the app knows; any other one shows as «Other». */
export const TYPE_NAMES = {
  Ride: 'Ride', GravelRide: 'Gravel ride', MountainBikeRide: 'Mountain bike ride', EBikeRide: 'E-bike ride', EMountainBikeRide: 'E-mountain bike ride', VirtualRide: 'Indoor ride',
  Run: 'Run|kind', TrailRun: 'Trail run', VirtualRun: 'Indoor run', Hike: 'Hike|kind', Walk: 'Walk',
  Swim: 'Swim', Workout: 'Workout', WeightTraining: 'Strength training', Yoga: 'Yoga', AlpineSki: 'Skiing', BackcountrySki: 'Ski touring', NordicSki: 'Cross-country skiing',
  Snowshoe: 'Snowshoeing', RockClimbing: 'Climbing', Rowing: 'Rowing', Kayaking: 'Kayaking', StandUpPaddling: 'Stand-up paddling', Tennis: 'Tennis', Elliptical: 'Cross trainer',
};
export const typeKey = (type) => TYPE_NAMES[type] ?? 'Other|kind';

/** One Strava activity (as api/strava.js trimActivity sends it) as the app keeps it. */
export function actRecord(a) {
  const local = typeof a.startLocal === 'string' ? a.startLocal : null;
  const start = typeof a.start === 'string' ? a.start : null;
  const day = local ? local.slice(0, 10) : start ? new Date(start).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' }) : '';
  const time = local ? local.slice(11, 16) : start ? new Date(start).toLocaleTimeString('de-CH', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit' }) : '';
  const fin = (v) => (Number.isFinite(v) ? v : null);
  return {
    id: String(a.id),
    day,
    time,
    start,
    name: a.name ?? '',
    type: a.type ?? '',
    kind: kindOf(a.type),
    km: fin(a.km) ?? 0,
    hm: fin(a.hm),
    movingS: fin(a.movingS) ?? 0,
    elapsedS: fin(a.elapsedS),
    gearId: a.gearId ?? null,
    hrAvg: fin(a.hrAvg),
    hrMax: fin(a.hrMax),
    commute: !!a.commute,
    trainer: !!a.trainer,
    wAvg: fin(a.wAvg),
    wMax: fin(a.wMax),
    wDevice: !!a.wDevice,
  };
}
/** What the app adds to an activity and keeps when it is fetched again. */
export const KEEP = ['kcal', 'hist', 'curve', 'w20', 'desc', 'detail', 'note'];

/** Newest first. */
export const byNewest = (a, b) => `${b.day} ${b.time}`.localeCompare(`${a.day} ${a.time}`);

/** The activities whose details (heart rate, kcal, best 20 min) are worth fetching now: newest first, with heart rate or a power meter, recent. */
export function needDetail(acts, today, { max = DETAIL_MAX, days = DETAIL_DAYS } = {}) {
  const from = shiftDay(today, -days);
  return acts.filter((a) => !a.detail && (a.hrAvg != null || a.wDevice) && a.day >= from).sort(byNewest).slice(0, max);
}

/** A calendar day ± n days (no clock involved). */
export function shiftDay(day, n) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Strava's zones as the four bounds (upper ends of Z1–Z4), or null when Strava sent no five zones. */
export function boundsOfStrava(z) {
  const hr = z?.hr;
  if (!Array.isArray(hr) || hr.length !== 5) return null;
  const b = hr.slice(0, 4).map((x) => Number(x.max));
  return validBounds(b) ? b : null;
}
/** Four whole numbers, rising, between 60 and 230. */
export const validBounds = (b) => Array.isArray(b) && b.length === 4 && b.every((x, i) => Number.isInteger(x) && x >= 60 && x <= 230 && (i === 0 || x > b[i - 1]));

/** The zones in use: own (changed), else Strava's, else the standard. → { bounds, source: 'own'|'strava'|'default' } */
export function zonesOf(stravaZones, own) {
  if (validBounds(own?.own)) return { bounds: own.own, source: 'own' };
  const s = boundsOfStrava(stravaZones);
  if (s) return { bounds: s, source: 'strava' };
  return { bounds: DEFAULT_BOUNDS, source: 'default' };
}

/** 0–4: the zone of one beat. */
export const zoneOf = (bpm, bounds) => {
  const i = bounds.findIndex((b) => bpm < b);
  return i < 0 ? 4 : i;
};

/** Seconds in each of the five zones, from the histogram { bpm: seconds }. null without heart rate. */
export function zoneSecs(hist, bounds) {
  if (!hist || typeof hist !== 'object') return null;
  const out = [0, 0, 0, 0, 0];
  for (const [bpm, s] of Object.entries(hist)) {
    const n = Number(s);
    if (Number(bpm) > 0 && n > 0) out[zoneOf(Number(bpm), bounds)] += n;
  }
  return out.some((s) => s > 0) ? out : null;
}

/** The zone with the most time (0–4), or null. */
export const mainZone = (secs) => (secs ? secs.indexOf(Math.max(...secs)) : null);

/** Shares in percent: base (Z1–Z2) and intense (Z4–Z5). */
export function shares(secs) {
  const all = secs?.reduce((s, x) => s + x, 0) ?? 0;
  if (!all) return null;
  return { base: Math.round(((secs[0] + secs[1]) / all) * 100), intense: Math.round(((secs[3] + secs[4]) / all) * 100) };
}

/** The beats of one zone as words: { from, to } (to null for Z5, from null for Z1). */
export const zoneRange = (i, bounds) => ({ from: i === 0 ? null : bounds[i - 1], to: i === 4 ? null : bounds[i] - 1 });

/** h:mm, e.g. 1:42 or 0:48. */
export function hmm(s) {
  const m = Math.round((Number(s) || 0) / 60);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

/** km/h over the moving time, one decimal; null without both. */
export const speed = (a) => (a.km > 0 && a.movingS > 0 ? Math.round((a.km / (a.movingS / 3600)) * 10) / 10 : null);

/**
 * «Gleiche Strecke»: the activities with the same name and kind and a distance within 10 %, newest
 * first (the activity itself included). fastest: the id with the shortest moving time.
 */
export function sameRoute(acts, act) {
  const name = act.name.trim().toLowerCase();
  if (!name) return { list: [act], fastest: null };
  const list = acts.filter((a) => a.kind === act.kind && a.name.trim().toLowerCase() === name && Math.abs(a.km - act.km) <= Math.max(0.5, act.km * 0.1)).sort(byNewest);
  const timed = list.filter((a) => a.movingS > 0);
  const fastest = list.length > 1 && timed.length ? timed.reduce((b, a) => (a.movingS < b.movingS ? a : b)).id : null;
  return { list, fastest };
}

/** The filter chips: all, then each kind that has activities. → [{ key, n }] */
export function kindCounts(acts) {
  const n = { bike: 0, run: 0, hike: 0, other: 0 };
  for (const a of acts) n[a.kind in n ? a.kind : 'other']++;
  return [{ key: 'all', n: acts.length }, ...Object.entries(n).filter(([, c]) => c).map(([key, c]) => ({ key, n: c }))];
}

/** The months with activities, newest first ('2026-10'). */
export const monthsOf = (acts) => [...new Set(acts.map((a) => a.day.slice(0, 7)).filter(Boolean))].sort().reverse();

/** The second line of an activity: the bike (rides) or the kind of sport. */
export function subOf(a, { bikeName = null } = {}) {
  return a.kind === 'bike' && bikeName ? { bike: bikeName } : { type: typeKey(a.type) };
}

/* ---------- TR4: the week plan and the look back (Noah «1-5a» 4a: sessions with duration and zone per day) ---------- */
export const PLAN_KEY = 'training.plan'; // { sessions: [{ id, day, kind, name, mins, zone }] }
export const GOAL_KEY = 'training.goal'; // { name, hours, base, until } or null
export const PLAN_KEEP_DAYS = 120;
const KIND_KEYS = ['bike', 'run', 'hike', 'other'];

/** Monday of the week of a day. */
export function mondayOf(day) {
  const d = new Date(`${day}T12:00:00Z`);
  return shiftDay(day, -((d.getUTCDay() + 6) % 7));
}
/** The ISO calendar week (KW) of a day. */
export function isoWeek(day) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  return Math.ceil(((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
}
export const weekOf = (monday) => Array.from({ length: 7 }, (_, i) => shiftDay(monday, i));

/** One planned session, cleaned; null when it is no session. */
export function cleanSession(s) {
  const mins = Math.round(Number(s?.mins));
  const zone = Math.round(Number(s?.zone));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s?.day ?? '')) || !(mins > 0 && mins <= 24 * 60)) return null;
  return { id: String(s.id || `s${Math.random().toString(36).slice(2, 9)}`), day: s.day, kind: KIND_KEYS.includes(s.kind) ? s.kind : 'bike', name: String(s.name ?? '').trim().slice(0, 60), mins, zone: zone >= 1 && zone <= 5 ? zone : null };
}
export const planOf = (v) => (Array.isArray(v?.sessions) ? v.sessions.map(cleanSession).filter(Boolean) : []);

/** The goal, cleaned: hours per week (0.5–40), base share in % (0–100), a name and an end day; all optional. */
export function goalOf(v) {
  if (!v || typeof v !== 'object') return null;
  const given = (x) => x !== '' && x != null;
  const hours = given(v.hours) ? Number(v.hours) : NaN;
  const base = given(v.base) ? Math.round(Number(v.base)) : NaN;
  const g = {
    name: String(v.name ?? '').trim().slice(0, 80),
    hours: hours >= 0.5 && hours <= 40 ? Math.round(hours * 4) / 4 : null,
    base: base >= 0 && base <= 100 ? base : null,
    until: /^\d{4}-\d{2}-\d{2}$/.test(String(v.until ?? '')) ? v.until : null,
  };
  return g.name || g.hours || g.base != null || g.until ? g : null;
}
/** Whole weeks from today to the goal's day (0 when passed), or null. */
export const weeksTo = (until, today) => (until ? Math.max(0, Math.ceil((Date.parse(`${until}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / (7 * 864e5))) : null);

/** A planned session is done when an activity of its kind is on its day. */
export const doneBy = (s, acts) => acts.find((a) => a.day === s.day && (a.kind === s.kind || s.kind === 'other')) ?? null;

/** The plan for a new week from last week's, each session 7 days later (new ids). */
export const copyWeek = (sessions, monday) =>
  sessions.filter((s) => s.day >= shiftDay(monday, -7) && s.day < monday).map((s) => cleanSession({ ...s, id: '', day: shiftDay(s.day, 7) }));

/** Old sessions go after PLAN_KEEP_DAYS. */
export const prunePlan = (sessions, today) => sessions.filter((s) => s.day >= shiftDay(today, -PLAN_KEEP_DAYS));

/**
 * One week in numbers: seconds per zone (activities with heart rate), the moving seconds of those
 * without (unknown), all seconds, the planned minutes. → { zones, unknown, secs, planned }
 */
export function weekNumbers(acts, sessions, monday, bounds) {
  const end = shiftDay(monday, 7);
  const zones = [0, 0, 0, 0, 0];
  let unknown = 0;
  let secs = 0;
  for (const a of acts) {
    if (a.day < monday || a.day >= end) continue;
    secs += a.movingS || 0;
    const z = zoneSecs(a.hist, bounds);
    if (z) {
      const sum = z.reduce((s, x) => s + x, 0);
      // the zones share the moving time (the beats can count a little more or less than it)
      z.forEach((x, i) => (zones[i] += sum ? (x / sum) * (a.movingS || sum) : 0));
    } else unknown += a.movingS || 0;
  }
  const planned = sessions.filter((s) => s.day >= monday && s.day < end).reduce((s, x) => s + x.mins, 0);
  return { zones, unknown, secs, planned };
}

/**
 * The bike activities of a trip (for the trip's look back and Tempo, thread «Design-Refresh»): those
 * whose ride in the ledger belongs to the trip (kmBook tripId, matched by stravaId) and every bike
 * activity from the first to the last day. Each once, in order.
 */
export function activitiesForTrip(trip, acts = [], kmBook = []) {
  if (!trip?.startDate) return [];
  const end = shiftDay(trip.startDate, Math.max(1, Number(trip.days) || 1) - 1);
  const ids = new Set(kmBook.filter((e) => e.tripId === trip.id && e.stravaId).map((e) => String(e.stravaId)));
  return acts.filter((a) => ids.has(a.id) || (a.kind === 'bike' && a.day >= trip.startDate && a.day <= end)).sort((a, b) => `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`));
}
