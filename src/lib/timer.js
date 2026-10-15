/**
 * «Timer» (mockups Z1–Z5, Noah 12.10.2026; answers 13.10.2026 «1-5a»: «Timer» counts up, the Digital
 * face first, a singing bowl at the end, the log fills itself and a note is optional; approved
 * 13.10.2026 «ME1-ME3 und Z1-Z5 freigeben»). One timer for everything: five kinds, building blocks
 * («Kaffee 4 min»), a time typed in words («7 min», «1h 20m», «bis 17:30»), six faces and a log.
 *
 * Pure time arithmetic from timestamps (like flowtimer.js): the time stays right when the screen was
 * locked and the browser slept, it is always computed from the start, never counted in steps.
 *
 * A setup: { mode, sec?, work?, rest?, rounds?, until? 'HH:MM', label?, blockId? }
 * A run:   { setup, label, segs: [{ kind: 'work'|'rest', sec }], startedAt, pausedAt, pausedMs,
 *            extra (s, «+1 min»), cued: [index of the segment ends already sounded] }
 *          mode 'up' has no segments: it runs until it is stopped.
 * Tested in tests/timer.test.js.
 */

/** The five kinds (Z2), in their order. label/sub: English keys for t(). */
export const MODES = [
  { id: 'up', label: 'Timer', sub: 'counts up' },
  { id: 'down', label: 'Countdown', sub: 'counts down' },
  { id: 'interval', label: 'Interval', sub: 'e.g. Tabata 20/10' },
  { id: 'pomodoro', label: 'Pomodoro', sub: '25/5 or 52/17' },
  { id: 'until', label: 'Until|timer', sub: 'e.g. until 17:30' },
];
export const MODE_IDS = MODES.map((m) => m.id);
export const modeOf = (id) => MODES.find((m) => m.id === id) ?? MODES[1];

/** The quick chips under the clock (Z2) and on the tile (Z1), in seconds. */
export const CHIPS = [30, 60, 180, 300, 600, 900, 1500, 3600];
export const TILE_CHIPS = [60, 180, 300, 600, 1500];

/** What each kind starts with. */
export const DEFAULTS = {
  up: { mode: 'up' },
  down: { mode: 'down', sec: 300 },
  interval: { mode: 'interval', work: 20, rest: 10, rounds: 8 },
  pomodoro: { mode: 'pomodoro', work: 1500, rest: 300, rounds: 4 },
  until: { mode: 'until', until: '17:30' },
};

/** The building blocks offered (Z2 «Bausteine»); kind 'med' starts a meditation (the meditation page's session). */
export const BLOCKS = [
  { id: 'coffee', label: 'Coffee', icon: 'coffee', setup: { mode: 'down', sec: 240 } },
  { id: 'plank', label: 'Plank', icon: 'dumbbell', setup: { mode: 'interval', work: 60, rest: 30, rounds: 3 } },
  { id: 'meditation', label: 'Meditation', icon: 'lotus', med: true, setup: { mode: 'down', sec: 1200 } },
  { id: 'nap', label: 'Power nap', icon: 'nap', setup: { mode: 'down', sec: 1200 } },
  { id: 'tea', label: 'Tea', icon: 'drop', setup: { mode: 'down', sec: 180 } },
  { id: 'focus', label: 'Focus 52/17', icon: 'focus', setup: { mode: 'pomodoro', work: 3120, rest: 1020, rounds: 1 } },
];

/** The six faces (Z3). label/sub: English keys for t(). med: the face of the meditation session it stands for. */
export const FACES = [
  { id: 'digital', label: 'Digital', sub: 'big digits, like a clock radio', med: 'digits' },
  { id: 'ring', label: 'Ring', sub: 'a ring with ticks', med: 'ring' },
  { id: 'glass', label: 'Hourglass', sub: 'from the meditation', med: 'glass' },
  { id: 'moon', label: 'Moon', sub: 'from the meditation, it wanes', med: 'moon' },
  { id: 'egg', label: 'Egg', sub: 'an egg timer', med: null },
  { id: 'big', label: 'Big number', sub: 'plain, easy to read', med: 'digits' },
];
export const FACE_IDS = FACES.map((f) => f.id);
/** Which timers a face is for (Z3 «Gilt für»). */
export const SCOPES = [
  { id: 'all', label: 'all timers' },
  { id: 'pomodoro', label: 'only Pomodoro' },
  { id: 'meditation', label: 'only meditation' },
];
/** The sound at the end (Z3 «Klang am Ende»): the singing bowl (Noah 4a), a short tone, or only vibrate. */
export const END_SOUNDS = [
  { id: 'bowl', label: 'Singing bowl', sound: 'bowlLow' },
  { id: 'beep', label: 'Short tone', sound: 'wood' },
  { id: 'silent', label: 'Silent, only vibrate', sound: 'vibrate' },
];
/** The digits (Z3 «Ziffern»). */
export const FORMATS = [
  { id: 'hms', label: 'hh:mm:ss' },
  { id: 'auto', label: 'mm:ss, under 1 h' },
];

export const PREFS_KEY = 'timer.prefs';
export const RUN_KEY = 'pg.timer.run';
export const PREFS_DEFAULT = { faces: { all: 'digital' }, end: 'bowl', fmt: 'hms', blocks: [], last: DEFAULTS.down };

/** Stored prefs made safe. */
export function prefsOf(v) {
  const o = v && typeof v === 'object' ? v : {};
  const faces = { all: 'digital' };
  for (const s of SCOPES) if (FACE_IDS.includes(o.faces?.[s.id])) faces[s.id] = o.faces[s.id];
  return {
    faces,
    end: END_SOUNDS.some((e) => e.id === o.end) ? o.end : 'bowl',
    fmt: FORMATS.some((f) => f.id === o.fmt) ? o.fmt : 'hms',
    blocks: Array.isArray(o.blocks) ? o.blocks.filter((b) => b && b.id && b.label && setupOk(b.setup)).map((b) => ({ id: String(b.id), label: String(b.label).slice(0, 40), icon: 'timer', own: true, setup: setupOk(b.setup) })) : [],
    last: setupOk(o.last) ?? DEFAULTS.down,
  };
}

/** The face of a timer: its own scope first («nur Pomodoro»), else the one for all. */
export function faceFor(prefs, setup) {
  const f = prefs?.faces ?? {};
  if (setup?.mode === 'pomodoro' && f.pomodoro) return f.pomodoro;
  if (setup?.med && f.meditation) return f.meditation;
  return f.all ?? 'digital';
}

const int = (v, lo, hi) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : null;
};
const HM = /^([01]?\d|2[0-3])[:.]([0-5]\d)$/;

/** A setup made safe (unknown kind, no time: null). */
export function setupOk(s) {
  if (!s || !MODE_IDS.includes(s.mode)) return null;
  const out = { mode: s.mode };
  if (s.mode === 'down') {
    out.sec = int(s.sec, 1, 24 * 3600);
    if (!out.sec) return null;
  } else if (s.mode === 'interval' || s.mode === 'pomodoro') {
    out.work = int(s.work, 1, 6 * 3600);
    out.rest = int(s.rest ?? 0, 0, 6 * 3600);
    out.rounds = int(s.rounds ?? 1, 1, 99);
    if (!out.work) return null;
  } else if (s.mode === 'until') {
    if (!HM.test(String(s.until ?? ''))) return null;
    out.until = String(s.until).replace('.', ':').padStart(5, '0');
  }
  if (s.label) out.label = String(s.label).slice(0, 40);
  if (s.blockId) out.blockId = String(s.blockId);
  if (s.med) out.med = true;
  return out;
}

/* ---------- a time in words (Z2 «Zeit eingeben: «7 min», «1h 20m», «bis 17:30»») ---------- */
const UNIT = [
  [/^(h|std|stunden?|hours?|hrs?)$/, 3600],
  [/^(m|min|mins|minuten?|minutes?)$/, 60],
  [/^(s|sek|sec|secs|sekunden?|seconds?)$/, 1],
];
const unitSec = (u) => UNIT.find(([re]) => re.test(u))?.[1] ?? null;

/**
 * A setup from a typed time, or null. «7» and «7 min» → a countdown of 7 minutes; «1h 20m», «90 s»,
 * «1:30» (min:s), «1:20:00»; «bis 17:30» / «until 9:45» / «um 17:30» → until; «25/5» or «52/17» →
 * Pomodoro (minutes); «3x60s», «8 × 20/10» → interval (seconds, a pause after the slash).
 */
export function parseTime(text) {
  const s = String(text ?? '')
    .trim()
    .toLowerCase()
    .replace(/,/g, '.')
    .replace(/×/g, 'x');
  if (!s) return null;
  let m = /^(?:bis|until|um|till|to)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(?:uhr)?$/.exec(s);
  if (m) {
    const h = Number(m[1]);
    const mi = Number(m[2] ?? 0);
    if (h > 23 || mi > 59) return null;
    return { mode: 'until', until: `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}` };
  }
  m = /^(\d{1,2})\s*x\s*(\d+(?:\.\d+)?)\s*(s|sek|sec|m|min)?\s*(?:\/\s*(\d+(?:\.\d+)?)\s*(s|sek|sec|m|min)?)?$/.exec(s);
  if (m) {
    const f = (v, u) => Math.round(Number(v) * (u && unitSec(u) === 60 ? 60 : 1));
    return setupOk({ mode: 'interval', rounds: Number(m[1]), work: f(m[2], m[3]), rest: m[4] ? f(m[4], m[5] ?? m[3]) : 0 });
  }
  m = /^(\d{1,3})\s*\/\s*(\d{1,3})$/.exec(s);
  if (m) return setupOk({ mode: 'pomodoro', work: Number(m[1]) * 60, rest: Number(m[2]) * 60, rounds: Number(m[1]) >= 45 ? 1 : 4 });
  m = /^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?$/.exec(s);
  if (m) {
    const sec = m[3] != null ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : Number(m[1]) * 60 + Number(m[2]);
    return sec > 0 ? { mode: 'down', sec } : null;
  }
  if (/^\d+(\.\d+)?$/.test(s)) {
    const sec = Math.round(Number(s) * 60);
    return sec > 0 ? { mode: 'down', sec } : null;
  }
  const parts = s.match(/\d+(?:\.\d+)?\s*[a-zäöü]+/g);
  if (!parts || parts.join('').replace(/\s/g, '') !== s.replace(/\s/g, '')) return null;
  let sec = 0;
  for (const p of parts) {
    const [, n, u] = /^(\d+(?:\.\d+)?)\s*([a-zäöü]+)$/.exec(p);
    const k = unitSec(u);
    if (!k) return null;
    sec += Number(n) * k;
  }
  sec = Math.round(sec);
  return sec > 0 ? { mode: 'down', sec } : null;
}

/* ---------- the run ---------- */
/** Seconds from `now` to the next HH:MM in Zurich time (tomorrow when it has passed), at least 1. */
export function secUntil(hm, now = Date.now()) {
  const [h, mi] = String(hm).split(':').map(Number);
  const z = zurichParts(now);
  let sec = (h * 3600 + mi * 60) - (z.h * 3600 + z.m * 60 + z.s);
  if (sec <= 0) sec += 24 * 3600;
  return sec;
}
/** Hours, minutes, seconds of `ms` in Zurich. */
export function zurichParts(ms) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date(ms))
      .filter((x) => x.type !== 'literal')
      .map((x) => [x.type, Number(x.value)]),
  );
  return { h: p.hour, m: p.minute, s: p.second };
}
/** «15:10» in Zurich. */
export const hmOf = (ms) => {
  const z = zurichParts(ms);
  return `${String(z.h).padStart(2, '0')}:${String(z.m).padStart(2, '0')}`;
};

/** The segments of a setup (at `now`, for «until»). 'up': none. */
export function segmentsOf(setup, now = Date.now()) {
  const s = setupOk(setup);
  if (!s || s.mode === 'up') return [];
  if (s.mode === 'down') return [{ kind: 'work', sec: s.sec }];
  if (s.mode === 'until') return [{ kind: 'work', sec: secUntil(s.until, now) }];
  const out = [];
  for (let i = 0; i < s.rounds; i++) {
    out.push({ kind: 'work', sec: s.work });
    if (s.rest > 0) out.push({ kind: 'rest', sec: s.rest });
  }
  return out;
}

/** Start a run. */
export function startRun(setup, now = Date.now(), label = '') {
  const s = setupOk(setup);
  if (!s) return null;
  return { setup: s, label: label || s.label || '', segs: segmentsOf(s, now), startedAt: now, pausedAt: null, pausedMs: 0, extra: 0, cued: [] };
}
export const isOpen = (run) => !!run && run.setup.mode === 'up';
/** All seconds the run will take (open: Infinity). */
export const totalSec = (run) => (!run ? 0 : isOpen(run) ? Infinity : run.segs.reduce((a, x) => a + x.sec, 0) + (run.extra || 0));
/** Seconds run (pauses left out), never more than the total. */
export function runElapsed(run, now = Date.now()) {
  if (!run) return 0;
  const ms = (run.pausedAt ?? now) - run.startedAt - (run.pausedMs || 0);
  return Math.max(0, Math.min(totalSec(run), ms / 1000));
}
export const runDone = (run, now = Date.now()) => !!run && !isOpen(run) && runElapsed(run, now) >= totalSec(run) - 0.05;
export const runPaused = (run) => !!run?.pausedAt;
export const pauseRun = (run, now = Date.now()) => (run && !run.pausedAt && !runDone(run, now) ? { ...run, pausedAt: now } : run);
export const resumeRun = (run, now = Date.now()) => (run?.pausedAt ? { ...run, pausedMs: (run.pausedMs || 0) + (now - run.pausedAt), pausedAt: null } : run);
/** «+1 min»: the last segment gets longer. */
export const addMinute = (run, sec = 60) => (run && !isOpen(run) ? { ...run, extra: (run.extra || 0) + sec } : run);

/** The segments with the extra time on the last one. */
const segsOf = (run) => run.segs.map((x, i) => (i === run.segs.length - 1 ? { ...x, sec: x.sec + (run.extra || 0) } : x));

/**
 * Where a run stands: { show (the seconds the clock shows), elapsed, total, left, frac (0…1 of the
 * whole), seg (index), kind, segLeft, round, rounds, done, paused, endAt (ms, null when open) }.
 */
export function position(run, now = Date.now()) {
  if (!run) return null;
  const el = runElapsed(run, now);
  const paused = runPaused(run);
  if (isOpen(run)) return { show: el, elapsed: el, total: Infinity, left: Infinity, frac: (el % 3600) / 3600, seg: 0, kind: 'work', segLeft: Infinity, round: 1, rounds: 1, done: false, paused, endAt: null };
  const segs = segsOf(run);
  const total = totalSec(run);
  let acc = 0;
  let i = 0;
  for (; i < segs.length - 1; i++) {
    if (el < acc + segs[i].sec) break;
    acc += segs[i].sec;
  }
  const segLeft = Math.max(0, acc + segs[i].sec - el);
  const works = segs.filter((x) => x.kind === 'work').length;
  const round = segs.slice(0, i + 1).filter((x) => x.kind === 'work').length;
  const left = Math.max(0, total - el);
  const multi = segs.length > 1;
  return {
    show: multi ? segLeft : left,
    elapsed: el,
    total,
    left,
    frac: total ? el / total : 1,
    seg: i,
    kind: segs[i].kind,
    segLeft,
    round: Math.max(1, round),
    rounds: works,
    done: el >= total - 0.05,
    paused,
    endAt: paused ? null : now + left * 1000,
  };
}

/**
 * The segment ends to sound now: { cue: 'seg' | 'end' | null, run: with the ends marked }. An end that
 * passed more than `late` seconds ago (the screen was locked) stays quiet, except the very end.
 */
export function dueCue(run, now = Date.now(), late = 5) {
  if (!run || isOpen(run)) return { cue: null, run };
  const segs = segsOf(run);
  const el = runElapsed(run, now);
  let acc = 0;
  const ends = segs.map((x) => (acc += x.sec));
  const passed = ends.map((e, i) => ({ e, i })).filter(({ e, i }) => e <= el + 0.05 && !run.cued.includes(i));
  if (!passed.length) return { cue: null, run };
  const lastIdx = segs.length - 1;
  const last = passed.at(-1);
  const cue = last.i === lastIdx ? 'end' : el - last.e <= late ? 'seg' : null;
  return { cue, run: { ...run, cued: [...run.cued, ...passed.map((p) => p.i)] } };
}

/* ---------- words and digits ---------- */
/** The digits of a time: 'hms' always 00:25:00, 'auto' 25:00 under an hour. */
export function digits(sec, fmt = 'hms') {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const p = (n) => String(n).padStart(2, '0');
  return fmt === 'auto' && h === 0 ? `${p(m)}:${p(r)}` : `${p(h)}:${p(m)}:${p(r)}`;
}
/** A duration for the log: 4:00, 1:09:00. */
export function dur(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
}
/** Short words for a time: { key, vars } for t(): «4 min», «30 s», «1 h 20 min». */
export function short(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  if (s < 60) return { key: '{n} s', vars: { n: s } };
  if (s < 3600 || s % 3600 !== 0) {
    const h = Math.floor(s / 3600);
    const m = Math.round((s % 3600) / 60);
    if (!h) return { key: '{n} min', vars: { n: m } };
    return m ? { key: '{h} h {m} min', vars: { h, m } } : { key: '{n} h', vars: { n: h } };
  }
  return { key: '{n} h', vars: { n: s / 3600 } };
}
/** The setup in words: { key, vars } for t(). «4 min», «3 × 60 s», «52 + 17 min», «until 17:30», «open». */
export function setupWords(setup) {
  const s = setupOk(setup);
  if (!s) return { key: '' };
  if (s.mode === 'up') return { key: 'open|timer' };
  if (s.mode === 'down') return short(s.sec);
  if (s.mode === 'until') return { key: 'until {hm}', vars: { hm: s.until } };
  if (s.mode === 'pomodoro') return s.rounds > 1 ? { key: '{w}/{r} × {n}', vars: { w: Math.round(s.work / 60), r: Math.round(s.rest / 60), n: s.rounds } } : { key: '{w} + {r} min', vars: { w: Math.round(s.work / 60), r: Math.round(s.rest / 60) } };
  return { key: '{n} × {w} s', vars: { n: s.rounds, w: s.work } };
}
/** The seconds a setup takes (open: 0). */
export const setupSec = (setup, now = Date.now()) => segmentsOf(setup, now).reduce((a, x) => a + x.sec, 0);

/* ---------- the log (Z5) ---------- */
export const newLogId = (now = Date.now()) => `tl-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
/** The log entry of a run that ended (or was stopped) at `now`; day in Zurich (localDay of the start). */
export function logEntry(run, now = Date.now(), day) {
  const p = position(run, now);
  return {
    id: newLogId(now),
    day,
    at: new Date(run.startedAt).toISOString(),
    sec: Math.round(p?.elapsed ?? 0),
    mode: run.setup.mode,
    label: run.label || '',
    blockId: run.setup.blockId ?? null,
    setup: run.setup,
    note: '',
  };
}
/** A stored log row made safe (null when broken). */
export function logRowOk(r) {
  if (!r || !r.id || !/^\d{4}-\d{2}-\d{2}$/.test(r.day ?? '') || !MODE_IDS.includes(r.mode)) return null;
  return { id: String(r.id), day: r.day, at: r.at ?? null, sec: Math.max(0, Math.round(Number(r.sec) || 0)), mode: r.mode, label: String(r.label ?? ''), blockId: r.blockId ?? null, setup: setupOk(r.setup), note: String(r.note ?? '') };
}
/** The name of a row: its label, else the kind (English key). */
export const rowName = (r) => r.label || modeOf(r.mode).label;

/**
 * The rows of the timer log and the meditation sessions together (Z5 shows both), newest first.
 * med: [{ id, day, at, min, note }] (from the meditation log); they open the meditation session.
 */
export function mergeLog(rows = [], med = []) {
  const a = rows.map(logRowOk).filter(Boolean);
  const b = med.map((m) => ({ id: `med:${m.id}`, medId: m.id, day: m.day, at: m.at ?? null, sec: Math.round((Number(m.min) || 0) * 60), mode: 'down', label: 'Meditation', med: true, note: m.note ?? '' }));
  return [...a, ...b].sort((x, y) => (y.day + (y.at ?? '')).localeCompare(x.day + (x.at ?? '')));
}
/** Rows of a kind ('all' or a mode). */
export const filterLog = (rows, mode = 'all') => (mode === 'all' ? rows : rows.filter((r) => r.mode === mode));
/** Rows by day, newest day first: [{ day, rows }]. */
export function byDay(rows = []) {
  const m = new Map();
  for (const r of rows) m.set(r.day, [...(m.get(r.day) ?? []), r]);
  return [...m.entries()].map(([day, list]) => ({ day, rows: list }));
}

/** Monday of the week of `day` (YYYY-MM-DD). */
export function mondayOf(day) {
  const d = new Date(`${day}T12:00:00Z`);
  const wd = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - wd * 864e5).toISOString().slice(0, 10);
}
/** Today (Z1 footer, Z2 «Heute 3× · 1 h 16 min»): { n, sec }. */
export function dayStats(rows = [], day) {
  const list = rows.filter((r) => r.day === day);
  return { n: list.length, sec: list.reduce((a, r) => a + r.sec, 0) };
}
/** This week (Z5): { n, sec, top (mode or null), medAvgMin (null without meditation) }. */
export function weekStats(rows = [], today) {
  const from = mondayOf(today);
  const list = rows.filter((r) => r.day >= from && r.day <= today);
  const count = new Map();
  for (const r of list) if (!r.med) count.set(r.mode, (count.get(r.mode) ?? 0) + 1);
  const top = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const med = list.filter((r) => r.med || r.blockId === 'meditation');
  return { n: list.length, sec: list.reduce((a, r) => a + r.sec, 0), top, medAvgMin: med.length ? Math.round(med.reduce((a, r) => a + r.sec, 0) / med.length / 60) : null };
}
/** «Zuletzt benutzt» (Z2): the last different setups, at most n. */
export function recentSetups(rows = [], n = 4) {
  const out = [];
  const seen = new Set();
  for (const r of rows) {
    if (r.med || !r.setup) continue;
    const key = JSON.stringify({ ...r.setup, label: r.label || '' });
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ setup: r.setup, label: r.label, mode: r.mode });
    if (out.length >= n) break;
  }
  return out;
}
