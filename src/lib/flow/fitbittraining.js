/**
 * «Zählen?» for Fitbit workouts (Noah 21.11.2026, Klügere Auswertungen K4): the workouts the watch knows (Tennis, Hockey, treadmill …,
 * healthDays.exercises) that have no tick yet. Like Strava in «suggest» mode they are only a suggestion: one tap makes the tick with its
 * minutes (via 'fitbit'), «Do not count» leaves it out for good; never silent. «Walk» stays out by default. A workout is no suggestion when
 * the same activity is already ticked that day, when a Strava activity of that time exists (the same session once), or when a Fitbit tick of
 * the file import is within 2 minutes. Pure; tests/fitbittraining.test.js. The writing is FitbitZaehlen.svelte.
 */
import { knownType, defaultAct, typeLabel, VIA } from '../fitbitexport.js';
import { normAct, newEntry, addDays } from '../flow.js';

export const HANDLED_KEY = 'fitbit.ticked';
/** Types that are not suggested (the person can still make a tick by hand). */
export const EXCLUDED = new Set(['walk']);
/** How far back suggestions go, in days (what the app holds of Fitbit). */
export const WINDOW_DAYS = 90;
/** A workout shorter than this is noise. */
export const MIN_MIN = 5;
/** Minutes of tolerance when a Strava activity and a workout are the same session. */
export const NEAR_MIN = 30;
const MAX_HANDLED = 1000;

/** «HH:MM» → minutes since midnight, or null. */
const toMin = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm ?? ''));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

/** The id of the tick a workout makes: day and start, so the same workout is never ticked twice. */
export const idOf = (day, ex) => `fl-fbl-${day}-${String(ex?.start ?? '').replace(':', '') || 'x'}`;

/** The moment of a local day and clock time in Europe/Zurich, as an ISO string (UTC). */
export function zurichAt(day, hhmm) {
  const [y, mo, d] = day.split('-').map(Number);
  const mins = toMin(hhmm) ?? 12 * 60;
  const wall = Date.UTC(y, mo - 1, d, Math.floor(mins / 60), mins % 60);
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const localAsUtc = (ms) => {
    const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
    return Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute));
  };
  let t = wall - (localAsUtc(wall) - wall);
  t = wall - (localAsUtc(t) - t);
  return new Date(t).toISOString();
}

/** The known Fitbit type of a workout: by its name, else by its type words («ICE_HOCKEY»). null when unknown. */
export function typeOf(ex) {
  return knownType({ name: ex?.name }) ?? knownType({ name: String(ex?.type ?? '').replace(/_/g, ' ') });
}

/**
 * health: healthDays rows [{ date, exercises }]; acts: flowActs; log: flowLog; activities: db.activities (Strava); handled: ids done.
 * → [{ id, day, start, min, name, key, label, actId, hr? }] newest first.
 */
export function suggestions({ health = [], acts = [], log = [], activities = [], handled = [], today }) {
  const from = addDays(today, -WINDOW_DAYS);
  const live = acts.map(normAct);
  const paused = new Set(live.filter((a) => a.paused).map((a) => a.id));
  const done = new Set(handled.map(String));
  const logIds = new Set(log.map((e) => e.id));
  const own = new Set(log.filter((e) => e.via !== 'trip').map((e) => `${e.actId}|${e.day}`));
  const fb = log.filter((e) => e.via === VIA).map((e) => Date.parse(e.at)).filter(Number.isFinite);
  const stravaBy = new Map();
  for (const a of activities) {
    if (!a?.day) continue;
    const s = toMin(a.time);
    const dur = Math.max(1, Math.round((Number(a.elapsedS) || Number(a.movingS) || 0) / 60));
    const list = stravaBy.get(a.day) ?? [];
    list.push({ from: s, to: s == null ? null : s + dur });
    stravaBy.set(a.day, list);
  }
  const out = [];
  for (const row of health) {
    const day = row?.date;
    if (!day || day > today || day < from) continue;
    for (const ex of row.exercises ?? []) {
      if (!(Number(ex?.min) >= MIN_MIN) || !ex.start) continue;
      const k = typeOf(ex);
      if (!k || EXCLUDED.has(k.key)) continue;
      const actId = defaultAct(k.key, live);
      if (!actId || paused.has(actId)) continue;
      const id = idOf(day, ex);
      if (done.has(id) || logIds.has(id)) continue;
      if (own.has(`${actId}|${day}`)) continue;
      const at = Date.parse(zurichAt(day, ex.start));
      if (fb.some((t) => Math.abs(t - at) <= 2 * 60000)) continue;
      const f = toMin(ex.start);
      const e = f + Math.round(ex.min);
      // the same session as a Strava activity: same day and the times lie within NEAR_MIN; a Strava activity without a time counts as the same
      if ((stravaBy.get(day) ?? []).some((s) => s.from == null || (s.from - NEAR_MIN < e && f < s.to + NEAR_MIN))) continue;
      out.push({ id, day, start: ex.start, min: Math.round(ex.min), name: ex.name || typeLabel(k.key).text, key: k.key, label: typeLabel(k.key).text, actId, ...(Number.isFinite(ex.hr) ? { hr: ex.hr } : {}) });
    }
  }
  return out.sort((a, b) => b.day.localeCompare(a.day) || b.start.localeCompare(a.start));
}

/** The flowLog entry of one suggestion: the minutes of the workout, source 'fitbit' (never estimated). */
export function entryOf(s, act) {
  const e = newEntry(act, { day: s.day, at: zurichAt(s.day, s.start), n: 1, min: s.min, via: VIA });
  return { ...e, id: s.id, fbType: String(s.label).replace(/\|[a-z]+$/, '') };
}

/** The handled ids with some added (newest last, capped), or without some. */
export const withHandled = (list = [], ids = []) => [...new Set([...list.map(String), ...ids.map(String)])].slice(-MAX_HANDLED);
export const withoutHandled = (list = [], ids = []) => list.map(String).filter((x) => !ids.map(String).includes(x));

/**
 * «Dauer von der Uhr übernehmen» (Noah 22.11.2026 «3», Schritt G): for ticks without minutes, the minutes of the watch workout of the same
 * sport on the same day, offered as a tip (never written silently). Only a day with exactly one such workout gives a tip (two are
 * ambiguous); a workout shorter than MIN_MIN is noise.
 * rows: [{ id, day, actId }] (the rows of «Dauer nachtragen»); health: healthDays; acts: flowActs.
 * → Map id → { min, name } (name: the workout as the watch calls it)
 */
export function watchMinutesFor({ rows = [], health = [], acts = [] } = {}) {
  const live = acts.map(normAct);
  const byDay = new Map(health.map((h) => [h?.date, h?.exercises ?? []]));
  const out = new Map();
  for (const r of rows) {
    const same = (byDay.get(r.day) ?? []).filter((ex) => {
      const k = typeOf(ex);
      return k && !EXCLUDED.has(k.key) && Number(ex?.min) >= MIN_MIN && defaultAct(k.key, live) === r.actId;
    });
    if (same.length === 1) out.set(r.id, { min: Math.round(Number(same[0].min)), name: String(same[0].name ?? '') });
  }
  return out;
}

/** The suggestions grouped by activity: [{ actId, label, rows, min }] most first. */
export function grouped(list = []) {
  const m = new Map();
  for (const s of list) {
    const g = m.get(s.actId) ?? { actId: s.actId, label: s.label, rows: [], min: 0 };
    g.rows.push(s);
    g.min += s.min;
    m.set(s.actId, g);
  }
  return [...m.values()].sort((a, b) => b.rows.length - a.rows.length || a.actId.localeCompare(b.actId));
}
