/**
 * Hobby pages 2 «Kissenzeit» (mockups B1, B2, B7; Noah 10.10.2026, H4a, H5a, H12a, H13a, H22a): the
 * meditation page's rules, pure and tested (tests/flowmed.test.js).
 *   kinds (Arten): twelve as a start, own ones added, the favourites in «Heute vielleicht»
 *   templates (flowTemplates): named, with duration, marks and sounds; three suggestions on first open
 *   «Wie letztes Mal», the history (4 weeks, streaks), minutes per week, the challenge (H12a: only near
 *   the best time, at most one a day), places and things, own links, the session record of B7.
 * Days are calendar days (YYYY-MM-DD, Europe/Zurich on the device); weeks start on Monday.
 */
import { addDays } from './flow.js';
import { bowlOf, marksOf } from './flowbowl.js';
import { soundOk, DEFAULT_SOUND, DEFAULT_END_SOUND } from './flowsounds.js';
import { weekStart } from './flowms.js';

export const ARTS_KEY = 'flow.medArts';
export const PLACES_KEY = 'flow.medPlaces';
export const THINGS_KEY = 'flow.medThings';
export const LINKS_KEY = 'flow.medLinks';
export const SOUND_KEY = 'flow.medSound';
export const CHALLENGE_KEY = 'flow.medChallenge';
export const MED_SEED_KEY = 'flow.medSeed';

/* ---------- kinds (Arten) ---------- */
/** Twelve kinds as a start (names in English, German via t()). */
export const ARTS = [
  { id: 'omahhung', name: 'Om Ah Hung' },
  { id: 'aware', name: 'Mindful awareness' },
  { id: 'count', name: 'Counting breaths' },
  { id: 'sit', name: 'Just sitting', minutes: 20 },
  { id: 'bodyscan', name: 'Body scan' },
  { id: 'metta', name: 'Metta / loving kindness' },
  { id: 'walking', name: 'Walking meditation' },
  { id: 'tonglen', name: 'Tonglen' },
  { id: 'visual', name: 'Visualisation' },
  { id: 'mantra', name: 'Mantra|med' },
  { id: 'guided', name: 'Guided|med' },
  { id: 'sound', name: 'Sound meditation' },
];
/** The favourites shown under «Heute vielleicht» until the user changes them (H13a). */
export const FAV_ARTS = ['omahhung', 'aware', 'count', 'sit'];

/** The kinds setting made safe: { favs: [ids], own: [{ id, name }] }. */
export function artsOf(v) {
  const o = v && typeof v === 'object' ? v : {};
  const own = (Array.isArray(o.own) ? o.own : []).filter((a) => a && a.id && typeof a.name === 'string' && a.name.trim()).map((a) => ({ id: String(a.id), name: a.name.trim(), own: true }));
  const all = [...ARTS, ...own];
  const known = new Set(all.map((a) => a.id));
  const favs = (Array.isArray(o.favs) ? o.favs : FAV_ARTS).filter((id) => known.has(id));
  return { favs: [...new Set(favs)], own, all };
}
/** Add an own kind (a name); the id is made from it. Returns the new setting. */
export function addArt(v, name, now = Date.now()) {
  const s = artsOf(v);
  const nm = String(name ?? '').trim();
  if (!nm) return { favs: s.favs, own: s.own };
  const id = `own-${now.toString(36)}`;
  return { favs: [...s.favs, id], own: [...s.own.map(({ id, name }) => ({ id, name })), { id, name: nm }] };
}
export const toggleFavArt = (v, id) => {
  const s = artsOf(v);
  return { favs: s.favs.includes(id) ? s.favs.filter((x) => x !== id) : [...s.favs, id], own: s.own.map(({ id: i, name }) => ({ id: i, name })) };
};

/* ---------- templates ---------- */
/** Three suggestions on the first open (fictional names, deletable). */
export const SEED_TEMPLATES = [
  { id: 'tpl-oah30', name: 'Om Ah Hung 30', nameDe: 'Om Ah Hung 30', art: 'omahhung', minutes: 30, bowl: { mode: 'every', every: 5 }, sound: 'bowlLow' },
  { id: 'tpl-sit45', name: 'Sitting 45 irregular', nameDe: 'Sitzen 45 unregelmässig', art: 'aware', minutes: 45, bowl: { mode: 'marks', marks: [{ sec: 180 }, { sec: 600 }, { sec: 1110 }, { sec: 1800 }, { sec: 2520 }] }, sound: 'bowlHigh' },
  { id: 'tpl-morning20', name: 'Morning 20', nameDe: 'Morgen 20', art: 'count', minutes: 20, bowl: { mode: 'every', every: 5 }, sound: 'bowlLow' },
];
/** A stored template made whole. */
export function tplOf(v, actId = 'meditation') {
  const o = v && typeof v === 'object' ? v : {};
  const b = bowlOf({ ...(o.bowl ?? {}), ends: true });
  return {
    id: String(o.id ?? ''),
    actId: o.actId ?? actId,
    name: String(o.name ?? '').trim(),
    nameDe: o.nameDe ? String(o.nameDe) : null,
    art: o.art ? String(o.art) : null,
    minutes: Math.max(1, Math.min(600, Math.round(Number(o.minutes) || 20))),
    bowl: { mode: b.mode, every: b.every, count: b.count, marks: b.marks },
    sound: soundOk(o.sound, DEFAULT_SOUND),
    endSound: soundOk(o.endSound, DEFAULT_END_SOUND),
    usedAt: o.usedAt ?? null,
    uses: Math.max(0, Number(o.uses) || 0),
  };
}
export const seedTemplates = (actId = 'meditation') => SEED_TEMPLATES.map((x) => tplOf({ ...x, actId }, actId));
/** The templates, the last used first (never used: in their order). */
export const sortTemplates = (list = []) => [...list].sort((a, b) => (b.usedAt ?? '').localeCompare(a.usedAt ?? '') || (b.uses ?? 0) - (a.uses ?? 0) || a.name.localeCompare(b.name));
/** A new template id. */
export const newTplId = (now = Date.now()) => `tpl-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
/**
 * What a bowl setting says in short: { key, vars } for t(): «alle 5:00», «eigene Marken», «zufällig»,
 * «nur Anfang und Ende».
 */
export function bowlWords(bowl) {
  const b = bowlOf(bowl);
  if (b.mode === 'every') return { key: 'every {t}', vars: { t: `${b.every}:00` } };
  if (b.mode === 'marks') return b.marks.length ? { key: '{n} own marks', vars: { n: b.marks.length } } : { key: 'only start and end', vars: {} };
  if (b.mode === 'random') return { key: '{n} at random', vars: { n: b.count } };
  return { key: 'only start and end', vars: {} };
}

/* ---------- the last session, the log ---------- */
/**
 * «Wie letztes Mal»: the newest session record of the activity (flowSessions), or, without one, the
 * newest log entry with minutes: { min, art, tplId, bowl, sound, endSound, at, day, place } | null.
 */
export function lastSession(sessions = [], log = [], actId = 'meditation') {
  const s = sessions.filter((x) => x.actId === actId).sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''))[0];
  if (s) return { min: Math.max(1, Math.round(Number(s.min) || 1)), art: s.art ?? null, tplId: s.tplId ?? null, bowl: s.bowl ? bowlOf(s.bowl) : { mode: 'marks', marks: marksOf(s.marks) }, sound: soundOk(s.sound), endSound: soundOk(s.endSound, DEFAULT_END_SOUND), at: s.at, day: s.day, place: s.place ?? null, target: s.target ?? s.min };
  const e = log.filter((x) => x.actId === actId && Number(x.min) > 0).sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''))[0];
  return e ? { min: Math.round(Number(e.min)), art: null, tplId: null, bowl: bowlOf(null), sound: DEFAULT_SOUND, endSound: DEFAULT_END_SOUND, at: e.at, day: e.day, place: null, target: Math.round(Number(e.min)) } : null;
}
/** The newest sessions (log entries joined with their details), newest first. */
export function recentSessions(log = [], sessions = [], actId = 'meditation', n = 10) {
  const det = new Map(sessions.map((s) => [s.id, s]));
  return log
    .filter((e) => e.actId === actId)
    .sort((a, b) => (b.at ?? b.day).localeCompare(a.at ?? a.day))
    .slice(0, n)
    .map((e) => ({ e, s: det.get(e.id) ?? null }));
}

/* ---------- history: four weeks, streaks, minutes per week ---------- */
/** The last `n` days (oldest first) with whether there was a session: [{ day, on, min }]. */
export function daysGrid(log = [], actId, today, n = 28) {
  const by = new Map();
  for (const e of log) if (e.actId === actId && e.day) by.set(e.day, (by.get(e.day) ?? 0) + (Number(e.min) || 0) + 0.001);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const day = addDays(today, -i);
    out.push({ day, on: by.has(day), min: Math.round(by.get(day) ?? 0) });
  }
  return out;
}
/** Streaks of days with a session: { now (today may still come), longest }. */
export function streaks(log = [], actId, today) {
  const days = [...new Set(log.filter((e) => e.actId === actId && e.day && e.day <= today).map((e) => e.day))].sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  const last = days.at(-1);
  const now = last === today || last === addDays(today, -1) ? run : 0;
  return { now, longest };
}
/** Minutes per week (Monday on) for the last `n` weeks, oldest first: [{ week, min }]. */
export function weekMinutes(log = [], actId, today, n = 8) {
  const w0 = weekStart(today);
  const weeks = Array.from({ length: n }, (_, i) => addDays(w0, -7 * (n - 1 - i)));
  const by = new Map(weeks.map((w) => [w, 0]));
  for (const e of log) {
    if (e.actId !== actId || !e.day) continue;
    const w = weekStart(e.day);
    if (by.has(w)) by.set(w, by.get(w) + (Number(e.min) || 0));
  }
  return weeks.map((week) => ({ week, min: Math.round(by.get(week)) }));
}

/* ---------- the challenge (H12a) ---------- */
/**
 * «Schaffst du heute 45 Minuten?» Only near the best time, at most one a day:
 *   the best (longest session before today) is at least 10 min, there are 3 sessions with minutes,
 *   one of the last 14 days reached 80 % of the best; the target is the next 5 minutes above the best.
 *   Not when today already reached it, not when it was put away today (seen: { day, off }).
 * The best counts only days before today, so the challenge stays the same all day.
 */
export function challenge({ log = [], actId = 'meditation', today, seen = null }) {
  if (seen?.off && seen.day === today) return null;
  const mins = log.filter((e) => e.actId === actId && Number(e.min) > 0 && e.day);
  const before = mins.filter((e) => e.day < today);
  if (before.length < 3) return null;
  const best = Math.max(...before.map((e) => Number(e.min)));
  if (best < 10) return null;
  const from = addDays(today, -14);
  const recent = before.filter((e) => e.day >= from).reduce((m, e) => Math.max(m, Number(e.min)), 0);
  if (recent < best * 0.8) return null;
  const target = Math.ceil((best + 1) / 5) * 5;
  const todayMax = mins.filter((e) => e.day === today).reduce((m, e) => Math.max(m, Number(e.min)), 0);
  if (todayMax >= target) return null;
  return { target, best };
}

/* ---------- places and things, own links ---------- */
/** Suggested places (H: «Orte und Dinge» instead of «Sitzkissen»); own ones are added by name. */
export const PLACES = [
  { id: 'home', name: 'At home' },
  { id: 'outside', name: 'Outside|place' },
  { id: 'retreat', name: 'Retreat' },
  { id: 'away', name: 'On the way' },
];
export const THINGS = [
  { id: 'blanket', name: 'Blanket' },
  { id: 'candle', name: 'Candle / incense' },
  { id: 'headphones', name: 'Headphones' },
];
/** A list of suggested ids plus own names: { list: [{ id, name, own? }], cur }. */
export function choiceList(v, base) {
  const o = v && typeof v === 'object' ? v : {};
  const hidden = new Set(Array.isArray(o.hidden) ? o.hidden : []);
  const own = (Array.isArray(o.own) ? o.own : []).filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim());
  const list = [...base.filter((b) => !hidden.has(b.id)), ...own.map((name) => ({ id: `own:${name}`, name, own: true }))];
  const cur = list.some((x) => x.id === o.cur) ? o.cur : null;
  return { list, cur, hidden: [...hidden], own };
}
/** How often each place was used in the sessions: Map id → n. */
export function placeCounts(sessions = [], actId = 'meditation') {
  const by = new Map();
  for (const s of sessions) if (s.actId === actId && s.place) by.set(s.place, (by.get(s.place) ?? 0) + 1);
  return by;
}
/** An own link made safe: only http(s) addresses the user typed; the title is theirs. */
export function linkOf(title, url, now = Date.now()) {
  const u = String(url ?? '').trim();
  const withScheme = /^[a-z]+:\/\//i.test(u) ? u : u ? `https://${u}` : '';
  let ok = null;
  try {
    const p = new URL(withScheme);
    if (p.protocol === 'https:' || p.protocol === 'http:') ok = p.href;
  } catch {
    ok = null;
  }
  if (!ok) return null;
  const tt = String(title ?? '').trim() || new URL(ok).hostname;
  return { id: `ln-${now.toString(36)}`, title: tt.slice(0, 80), url: ok };
}
export const linksOf = (v) => (Array.isArray(v) ? v.filter((l) => l && l.id && /^https?:\/\//.test(l.url ?? '')).map((l) => ({ id: String(l.id), title: String(l.title ?? ''), url: l.url })) : []);

/* ---------- the session (B7) ---------- */
/** What a session starts with: the timer extras for flowtimer.js (marks, sounds, the session's facts). */
export function sessionPlan({ minutes, bowl, sound, endSound, art = null, tplId = null, name = null, place = null }) {
  const b = bowlOf({ ...bowlOf(bowl), ends: true });
  return {
    minutes: Math.max(1, Math.round(Number(minutes) || 20)),
    bowl: b,
    extra: {
      session: { art, tplId, name, place },
      bowl: b,
      marks: b.mode === 'marks' ? b.marks : [],
      sound: soundOk(sound, DEFAULT_SOUND),
      endSound: soundOk(endSound, DEFAULT_END_SOUND),
    },
  };
}
/**
 * The records to save when a session ends (B7): the flowLog entry (it keeps counting for rings, goals
 * and milestones) and its details in flowSessions (same id). The id comes from the start, so saving
 * twice (two tabs, a reload) writes the same rows. null when less than a minute ran.
 * tm: the timer; elapsed: seconds run; now: ms; day(ms) → YYYY-MM-DD on the device.
 */
export function sessionRecords(tm, elapsed, now, day) {
  if (!tm?.session || !(elapsed >= 60)) return null;
  const id = `fl-s-${Number(tm.startedAt).toString(36)}`;
  const at = new Date(tm.startedAt).toISOString();
  const min = Math.max(1, Math.round(elapsed / 60));
  const d = day(tm.startedAt);
  const between = (tm.bowls ?? []).filter((s) => s > 0 && s < tm.targetSec);
  const own = new Map((tm.marks ?? []).map((m) => [m.sec, m.sound]));
  const entry = { id, actId: tm.actId, day: d, at, n: 1, min, via: 'timer' };
  const session = {
    id,
    actId: tm.actId,
    day: d,
    at,
    endAt: new Date(now).toISOString(),
    min,
    target: Math.round(tm.targetSec / 60),
    art: tm.session.art ?? null,
    tplId: tm.session.tplId ?? null,
    place: tm.session.place ?? null,
    marks: between.map((sec) => (own.get(sec) ? { sec, sound: own.get(sec) } : { sec })),
    bowl: tm.bowl ?? null,
    sound: tm.sound ?? DEFAULT_SOUND,
    endSound: tm.endSound ?? DEFAULT_END_SOUND,
  };
  return { entry, session };
}
