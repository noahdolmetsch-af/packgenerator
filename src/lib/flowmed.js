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
import { weekStart, zurichHour, msContext, actMilestones, evaluate, isOff } from './flowms.js';

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

/* ---------- v0.93.0 «Meditation Wünsche» (mockups F–H, Noah «1-5 a» 11.10.2026) ---------- */
/** The durations to pick in one tap (start sheet and «Neue Sitzung»); any other is typed («oder frei»). */
export const MED_DURATIONS = [10, 15, 20, 30, 45, 60];
/** A typed duration made safe: whole minutes 1–600, or null for nothing usable. */
export const freeMinutes = (v) => {
  const n = Math.round(Number(String(v ?? '').replace(',', '.')));
  return Number.isFinite(n) && n >= 1 ? Math.min(600, n) : null;
};
/**
 * «Klänge dazwischen» in three chips: none · random · own; «own» is either every N minutes or at
 * minute marks. An older template with «alle 5», «alle 10» or «alle 7» is «own · every N».
 * → { mode: 'none'|'random'|'own', own: 'every'|'marks', every, count, marks }
 */
export function soundsOf(bowl) {
  const b = bowlOf(bowl);
  const mode = b.mode === 'random' ? 'random' : b.mode === 'every' || b.mode === 'marks' ? 'own' : 'none';
  return { mode, own: b.mode === 'marks' ? 'marks' : 'every', every: Math.min(60, b.every), count: b.count, marks: b.marks };
}
/** The bowl setting of the three chips (the reverse of soundsOf); marks past the end are left out. */
export function bowlOfSounds({ mode, own = 'every', every = 5, count = 2, marks = [] }, totalSec = Infinity) {
  if (mode === 'random') return { mode: 'random', count: Math.max(1, Math.min(10, Math.round(Number(count) || 2))) };
  if (mode !== 'own') return { mode: 'none' };
  if (own === 'marks') return { mode: 'marks', marks: marksOf(marks).filter((m) => m.sec < totalSec) };
  return { mode: 'every', every: Math.max(1, Math.min(60, Math.round(Number(every) || 5))) };
}
/** Minute marks as text for the «an Minute» field: 180 s, 450 s → «3, 7,5» (a decimal comma). */
export const marksText = (marks = []) =>
  marksOf(marks)
    .map((m) => String(Math.round((m.sec / 60) * 10) / 10).replace('.', ','))
    .join(', ');
/** The suggested template name: the kind (or «Meditation»), the minutes and the sounds in between. */
export function tplSuggestion({ kind = '', minutes = 20, bowl = null }) {
  const b = bowlOf(bowl);
  const head = `${kind || 'Meditation'} ${Math.round(Number(minutes) || 20)}`;
  if (b.mode === 'every') return { head, key: 'every {n} min', vars: { n: b.every } };
  if (b.mode === 'random') return { head, key: 'sounds at random', vars: {} };
  if (b.mode === 'marks' && b.marks.length) return { head, key: '{n} own sounds', vars: { n: b.marks.length } };
  return { head, key: '', vars: {} };
}
/** The clock of a running session: Ring · Sanduhr · Mond · Zahl; remembered in db.settings. */
export const CLOCK_KEY = 'flow.medClock';
export const CLOCK_VIEWS = ['ring', 'glass', 'moon', 'digits'];
export function clockPrefOf(v) {
  const o = v && typeof v === 'object' ? v : {};
  return { view: CLOCK_VIEWS.includes(o.view) ? o.view : 'ring', hideTime: o.hideTime === true };
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

/* ======================================================================================================
 * Hobby pages 3 «Nach dem Gong» (mockups B3–B6, Noah 10.10.2026, H11a, H23a, H24a): the note after the
 * gong, what helped, the comparison, «Als Nächstes» with a calendar file, the log with its filters, the
 * streak heatmap, the calendar, the time of day and the month comparison. Pure and tested.
 * ==================================================================================================== */
export const HELPED_KEY = 'flow.medHelped';
export const NEXT_KEY = 'flow.medNext';

/* ---------- the note (H23a: a sentence, depth 1–5, mood, all optional) ---------- */
export const MOODS = [
  { id: 'calm', name: 'calm|mood' },
  { id: 'clear', name: 'clear|mood' },
  { id: 'grateful', name: 'grateful|mood' },
  { id: 'restless', name: 'restless|mood' },
  { id: 'tired', name: 'tired|mood' },
  { id: 'distracted', name: 'distracted|mood' },
  { id: 'sleepy', name: 'sleepy|mood' },
  { id: 'warm', name: 'warm|mood' },
];
/** «Was hat geholfen?»: suggestions, own ones added by name (choiceList). */
export const HELPED = [
  { id: 'early', name: 'early in the morning' },
  { id: 'breaths', name: 'counting breaths at the start' },
  { id: 'anchor', name: 'the sound as an anchor' },
  { id: 'candle', name: 'a candle' },
  { id: 'window', name: 'the window open' },
];
const strList = (v, n = 12) => [...new Set((Array.isArray(v) ? v : []).filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim().slice(0, 60)))].slice(0, n);
/** The note of a session made safe: { note, depth (1–5 | null), moods, helped }. */
export function noteOf(s) {
  const o = s && typeof s === 'object' ? s : {};
  const d = Math.round(Number(o.depth));
  return {
    note: typeof o.note === 'string' ? o.note.trim().slice(0, 1000) : '',
    depth: d >= 1 && d <= 5 ? d : null,
    moods: strList(o.moods),
    helped: strList(o.helped),
  };
}
/** Something written down: a sentence, a depth, a mood or what helped. */
export const hasNote = (s) => {
  const n = noteOf(s);
  return !!(n.note || n.depth || n.moods.length || n.helped.length);
};
/** Toggle a value in a list (moods, helped). */
export const toggleIn = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/* ---------- the comparison and the best time ---------- */
/**
 * «45 Min · dein Schnitt 28 Min · diese Woche 180 Min, letzte 170»: the session against the others.
 * → { min, avg (the other sessions with minutes, null without), week, lastWeek, best (before), isBest }.
 */
export function compareSession(log = [], actId, id, today) {
  const mine = log.filter((e) => e.actId === actId && e.day);
  const me = mine.find((e) => e.id === id);
  const min = Math.round(Number(me?.min) || 0);
  const others = mine.filter((e) => e.id !== id && Number(e.min) > 0);
  const avg = others.length ? Math.round(others.reduce((s, e) => s + Number(e.min), 0) / others.length) : null;
  const w0 = weekStart(today);
  const sumIn = (from, to) => Math.round(mine.filter((e) => e.day >= from && e.day < to).reduce((s, e) => s + (Number(e.min) || 0), 0));
  const before = others.filter((e) => !me || (e.at ?? e.day) < (me.at ?? me.day));
  const best = before.length ? Math.max(...before.map((e) => Number(e.min))) : null;
  return { min, avg, week: sumIn(w0, addDays(w0, 7)), lastWeek: sumIn(addDays(w0, -7), w0), best, isBest: best != null && min > best };
}

/**
 * The stars a session made reachable (B3 «neuer Stern», B5 «Hier erreicht»): the milestones of the
 * activity evaluated with and without the session; a star counts when it is reached with it, not
 * without it, on the session's day. → [{ r (evaluated), star }]
 */
export function starsOfSession({ act, acts = [], log = [], sessions = [], today, tripDays = [], tune = {} }, id) {
  if (!act) return [];
  const day = log.find((e) => e.id === id)?.day;
  if (!day) return [];
  const withIt = msContext({ acts, log, sessions, today, tripDays });
  const without = msContext({ acts, log: log.filter((e) => e.id !== id), sessions: sessions.filter((s) => s.id !== id), today, tripDays });
  return actMilestones(act)
    .filter((m) => !isOff(m, tune))
    .flatMap((m) => {
      const a = evaluate(m, withIt, new Map(), tune);
      const had = new Set(evaluate(m, without, new Map(), tune).reached.map((r) => r.star));
      return a.reached.filter((r) => !had.has(r.star) && r.day === day).map((r) => ({ r: a, star: r.star }));
    });
}

/* ---------- «Als Nächstes» (H24a: one calm suggestion, with a calendar file, can be switched off) ---------- */
/** «06:52» in Zurich for an ISO time. */
export function zurichTime(at) {
  const d = new Date(at);
  if (!at || Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('en-GB', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
}
/**
 * The next session as a suggestion: tomorrow (after the later of the session's day and today) at the
 * same time of day (down to 5 minutes). After a long session (a third over the average, at least 30
 * min) the shortest template, else the session's own template (or the same duration).
 * → { day, time, minutes, tplId, art, why: 'short' | 'same' }
 */
export function nextUp({ log = [], tpls = [], session, today }) {
  if (!session) return null;
  const day = addDays(session.day > today ? session.day : today, 1);
  const hm = zurichTime(session.at) ?? '07:00';
  const [h, m] = hm.split(':').map(Number);
  const time = `${String(h).padStart(2, '0')}:${String(Math.floor(m / 5) * 5).padStart(2, '0')}`;
  const { avg } = compareSession(log, session.actId, session.id, today);
  const min = Number(session.min) || 0;
  const long = min >= 30 && avg != null && min >= avg * 4 / 3;
  if (long && tpls.length) {
    const short = [...tpls].sort((a, b) => a.minutes - b.minutes || (b.usedAt ?? '').localeCompare(a.usedAt ?? ''))[0];
    if (short.minutes < min) return { day, time, minutes: short.minutes, tplId: short.id, art: short.art ?? null, why: 'short' };
  }
  const own = tpls.find((x) => x.id === session.tplId);
  if (own) return { day, time, minutes: own.minutes, tplId: own.id, art: session.art ?? own.art ?? null, why: 'same' };
  return { day, time, minutes: Math.max(1, Number(session.target) || min || 20), tplId: null, art: session.art ?? null, why: 'same' };
}

/** Text for a calendar file: backslash, semicolon, comma and line breaks escaped. */
const icsText = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const icsLocal = (day, hm) => `${day.replace(/-/g, '')}T${hm.replace(':', '')}00`;
/**
 * Events as one calendar file (.ics) in Zurich time, with the time zone's rules so every calendar reads
 * it the same. An event: { uid, title, note?, day, time? 'HH:MM', minutes?, rrule? } (no time: all day;
 * rrule e.g. 'FREQ=WEEKLY;BYDAY=TH', v0.130.0 «Woche»). → the text (CRLF).
 */
export function icsCalendar(events = [], now = Date.now()) {
  const stamp = new Date(now).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const ev = ({ uid, title, note = '', day, time, minutes = 60, rrule }) => {
    let when;
    if (time) {
      const end = new Date(Date.parse(`${day}T${time}:00Z`) + Math.max(1, Math.round(minutes)) * 60000).toISOString();
      when = [`DTSTART;TZID=Europe/Zurich:${icsLocal(day, time)}`, `DTEND;TZID=Europe/Zurich:${icsLocal(end.slice(0, 10), end.slice(11, 16))}`];
    } else when = [`DTSTART;VALUE=DATE:${day.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${new Date(Date.parse(`${day}T00:00:00Z`) + 864e5).toISOString().slice(0, 10).replace(/-/g, '')}`];
    return ['BEGIN:VEVENT', `UID:${icsText(uid)}@packgenerator`, `DTSTAMP:${stamp}`, ...when, ...(rrule ? [`RRULE:${rrule}`] : []), `SUMMARY:${icsText(title)}`, ...(note ? [`DESCRIPTION:${icsText(note)}`] : []), 'END:VEVENT'];
  };
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pack Generator//Flow//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Zurich',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
    ...events.flatMap(ev),
    'END:VCALENDAR',
  ];
  return `${lines.join('\r\n')}\r\n`;
}
/** One event as a calendar file: { uid, title, note?, day, time 'HH:MM', minutes, now (ms) } → the text. */
export const icsEvent = ({ now = Date.now(), ...e }) => icsCalendar([e], now);

/* ---------- the log (B4): rows, filters ---------- */
/** Time of day (by the hour in Zurich). */
export const TOD = [
  { id: 'early', name: 'before 8', from: 0, to: 8 },
  { id: 'morning', name: '8 to 12', from: 8, to: 12 },
  { id: 'afternoon', name: '12 to 18', from: 12, to: 18 },
  { id: 'evening', name: 'from 18', from: 18, to: 24 },
];
/** Duration bins (B4 filter, B6 «Dauer der Sitzungen»). */
export const DUR = [
  { id: 's', name: 'up to 15', from: 0, to: 15 },
  { id: 'm', name: '16–30', from: 16, to: 30 },
  { id: 'l', name: '31–45', from: 31, to: 45 },
  { id: 'xl', name: 'over 45', from: 46, to: Infinity },
];
export const RANGES = [
  { id: '1m', name: '1 month', months: 1 },
  { id: '3m', name: '3 months', months: 3 },
  { id: '12m', name: '12 months', months: 12 },
  { id: 'all', name: 'all|range', months: null },
];
export const VIEWS = ['list', 'cal', 'chart'];
export const LOG_DEFAULT = { view: 'list', art: 'all', dur: 'all', tod: 'all', tpl: 'all', note: false, longest: false, range: '3m' };
export const durOf = (min) => DUR.find((d) => Math.round(Number(min) || 0) <= d.to)?.id ?? 'xl';
export const todOf = (hour) => (hour == null ? null : (TOD.find((x) => hour >= x.from && hour < x.to)?.id ?? null));

/** The filter from the address (…/log?view=cal&art=metta&note=1); unknown values fall back. */
export function filterOf(params) {
  const p = params instanceof URLSearchParams ? params : new URLSearchParams(params ?? '');
  const pick = (k, ok) => (p.has(k) && ok(p.get(k)) ? p.get(k) : LOG_DEFAULT[k]);
  return {
    view: pick('view', (v) => VIEWS.includes(v)),
    art: pick('art', (v) => !!v),
    dur: pick('dur', (v) => v === 'all' || DUR.some((d) => d.id === v)),
    tod: pick('tod', (v) => v === 'all' || TOD.some((d) => d.id === v)),
    tpl: pick('tpl', (v) => !!v),
    note: p.get('note') === '1',
    longest: p.get('longest') === '1',
    range: pick('range', (v) => RANGES.some((r) => r.id === v)),
    month: /^\d{4}-\d{2}$/.test(p.get('month') ?? '') ? p.get('month') : null,
    day: /^\d{4}-\d{2}-\d{2}$/.test(p.get('day') ?? '') ? p.get('day') : null,
  };
}
/** The address part of a filter: only what differs from the default. */
export function filterQuery(f) {
  const p = new URLSearchParams();
  for (const k of ['view', 'art', 'dur', 'tod', 'tpl', 'range']) if (f[k] && f[k] !== LOG_DEFAULT[k]) p.set(k, f[k]);
  if (f.note) p.set('note', '1');
  if (f.longest) p.set('longest', '1');
  if (f.month) p.set('month', f.month);
  if (f.day) p.set('day', f.day);
  const s = p.toString();
  return s ? `?${s}` : '';
}
/** How many filters are set (the view, month and day are not filters). */
export const filterCount = (f) => ['art', 'dur', 'tod', 'tpl', 'range'].filter((k) => f[k] !== LOG_DEFAULT[k]).length + (f.note ? 1 : 0) + (f.longest ? 1 : 0);

/** «2026-10» plus n months. */
export function monthAdd(month, n) {
  const [y, m] = month.split('-').map(Number);
  const k = y * 12 + (m - 1) + n;
  return `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, '0')}`;
}
/** The first day of the range (n months back on the calendar; the day kept or the month's last), null for all. */
export function rangeStart(range, today) {
  const r = RANGES.find((x) => x.id === range);
  if (!r?.months) return null;
  const month = monthAdd(today.slice(0, 7), -r.months);
  const last = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
  return `${month}-${String(Math.min(Number(today.slice(8, 10)), last)).padStart(2, '0')}`;
}
/** The log entries of the activity joined with their details, newest first. */
export function logRows(log = [], sessions = [], actId = 'meditation') {
  const det = new Map(sessions.map((s) => [s.id, s]));
  return log
    .filter((e) => e.actId === actId && e.day)
    .map((e) => {
      const s = det.get(e.id) ?? null;
      const n = noteOf(s);
      return { id: e.id, actId, day: e.day, at: e.at ?? null, min: Math.round(Number(e.min) || 0), hour: zurichHour(e.at), art: s?.art ?? null, tplId: s?.tplId ?? null, marks: s ? marksOf(s.marks) : [], bowl: s?.bowl ?? null, place: s?.place ?? null, ...n, noted: hasNote(s), s, e };
    })
    .sort((a, b) => (b.at ?? b.day).localeCompare(a.at ?? a.day));
}
/** The rows that pass the filter; «längste am Stück» puts the longest first. */
export function filterRows(rows = [], f = LOG_DEFAULT, today) {
  const from = rangeStart(f.range, today);
  const out = rows.filter(
    (r) =>
      (!from || r.day >= from) &&
      r.day <= today &&
      (f.art === 'all' || r.art === f.art) &&
      (f.dur === 'all' || (r.min > 0 && durOf(r.min) === f.dur)) &&
      (f.tod === 'all' || todOf(r.hour) === f.tod) &&
      (f.tpl === 'all' || r.tplId === f.tpl) &&
      (!f.note || r.noted),
  );
  return f.longest ? [...out].sort((a, b) => b.min - a.min || (b.at ?? b.day).localeCompare(a.at ?? a.day)) : out;
}

/* ---------- streaks and the heatmap (B4) ---------- */
/** 0 no session, 1 up to 15 min (or ticked without minutes), 2 up to 30, 3 more. */
export const levelOf = (n, min) => (!n ? 0 : min > 30 ? 3 : min > 15 ? 2 : 1);
function dayTotals(rows, actId) {
  const by = new Map();
  for (const e of rows) {
    if ((actId && e.actId !== actId) || !e.day) continue;
    const o = by.get(e.day) ?? { n: 0, min: 0 };
    by.set(e.day, { n: o.n + 1, min: o.min + (Number(e.min) || 0) });
  }
  return by;
}
/**
 * The streak heatmap: `weeks` columns (Monday on), seven days each, up to this week.
 * → { cols: [[{ day, min, n, level, future }]], share (percent of days up to today with a session) }
 */
export function heatmap(rows = [], actId, today, weeks = 13) {
  const by = dayTotals(rows, actId);
  const first = addDays(weekStart(today), -7 * (weeks - 1));
  let on = 0;
  let all = 0;
  const cols = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = addDays(first, w * 7 + d);
      const x = by.get(day) ?? { n: 0, min: 0 };
      const future = day > today;
      if (!future) (all++, x.n && on++);
      return { day, min: Math.round(x.min), n: x.n, level: levelOf(x.n, x.min), future };
    }),
  );
  return { cols, share: all ? Math.round((on / all) * 100) : 0 };
}
/** The longest run of days in a row within a month (up to today): «10 Tage im Oktober ohne Lücke». */
export function monthRun(rows = [], actId, month, today) {
  const by = dayTotals(rows, actId);
  let best = 0;
  let run = 0;
  for (let d = `${month}-01`; d.startsWith(month) && d <= today; d = addDays(d, 1)) {
    run = by.has(d) ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}
/** Minutes on the Saturday and Sunday of the day's week. */
export function weekendMinutes(rows = [], actId, day) {
  const sat = addDays(weekStart(day), 5);
  const sun = addDays(sat, 1);
  return Math.round(rows.filter((e) => e.actId === actId && (e.day === sat || e.day === sun)).reduce((s, e) => s + (Number(e.min) || 0), 0));
}
/** Days with two sessions or more. */
export const doubleDays = (rows = [], actId) => [...dayTotals(rows, actId).values()].filter((x) => x.n >= 2).length;

/* ---------- the calendar (B6) ---------- */
/** A month as weeks (Monday on): { month, weeks: [[{ day | null, min, n, level, future }]] }. */
export function monthCalendar(rows = [], actId, month, today) {
  const by = dayTotals(rows, actId);
  const first = `${month}-01`;
  const lead = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const cells = Array.from({ length: lead }, () => null);
  for (let d = first; d.startsWith(month); d = addDays(d, 1)) {
    const x = by.get(d) ?? { n: 0, min: 0 };
    cells.push({ day: d, min: Math.round(x.min), n: x.n, level: levelOf(x.n, x.min), future: d > today });
  }
  while (cells.length % 7) cells.push(null);
  return { month, weeks: Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7)) };
}

/* ---------- the charts (B4 «beste Tageszeit», «Monatsvergleich»; B6) ---------- */
/** Sessions per hour of the day (Zurich), 24 numbers. */
export function hourHistogram(rows = []) {
  const out = Array(24).fill(0);
  for (const r of rows) if (r.hour != null) out[r.hour]++;
  return out;
}
/** «Am tiefsten (Tiefe 4–5): 6 bis 8 Uhr»: the two hours with the most deep sessions; null without depth. */
export function deepestHours(rows = []) {
  const deep = hourHistogram(rows.filter((r) => (r.depth ?? 0) >= 4));
  let best = null;
  for (let h = 0; h < 24; h++) {
    const n = deep[h] + (deep[(h + 1) % 24] ?? 0);
    if (n && (!best || n > best.n)) best = { from: h, to: (h + 2) % 24 || 24, n };
  }
  return best;
}
/** Minutes per month for the last n months (oldest first); the current one is «bis heute». */
export function monthCompare(rows = [], actId, today, n = 3) {
  const cur = today.slice(0, 7);
  const months = Array.from({ length: n }, (_, i) => monthAdd(cur, i - n + 1));
  const by = new Map(months.map((m) => [m, 0]));
  for (const e of rows) if ((!actId || e.actId === actId) && e.day && by.has(e.day.slice(0, 7))) by.set(e.day.slice(0, 7), by.get(e.day.slice(0, 7)) + (Number(e.min) || 0));
  return months.map((month) => ({ month, min: Math.round(by.get(month)), partial: month === cur }));
}
/** Minutes per kind, the most first: [{ art (id | null), min }]. */
export function artMinutes(rows = []) {
  const by = new Map();
  for (const r of rows) if (r.min > 0) by.set(r.art ?? null, (by.get(r.art ?? null) ?? 0) + r.min);
  return [...by].map(([art, min]) => ({ art, min })).sort((a, b) => b.min - a.min);
}
/** How many sessions per duration bin: [{ id, name, n }]. */
export function durationBins(rows = []) {
  return DUR.map((d) => ({ ...d, n: rows.filter((r) => r.min > 0 && durOf(r.min) === d.id).length }));
}
