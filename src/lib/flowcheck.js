/**
 * v0.51.0 «Im Flow»: the daily check (Noah 10a). Three fixed questions (sleep, energy, mood) and a
 * fourth that rotates through a pool of ten, taken in turn (each one every ten days); the pool is
 * editable. One tap per question on a scale 1–10, a dot marks yesterday's answer.
 * A check: { day, sleep, energy, mood, q (pool id of the 4th), extra }  (table flowChecks).
 * v0.124.0 «Tages-Check» 1: plus joy, goal, last, sugg (morning) and sat, best, story, goalDone, outside,
 * people, fun, mindful (evening), all optional; see checkOf.
 * The pool lives in the settings record 'flowQuestions': [{ id, text, textDe?, lo, loDe?, hi, hiDe?, short, shortDe? }].
 */
import { addDays, lastDays, daysBetween } from './flow.js';

export const QUESTIONS_KEY = 'flowQuestions';
export const FIXED = [
  { key: 'sleep', text: 'How well did you sleep?', lo: 'badly', hi: 'deep and long', short: 'Sleep|flow' },
  { key: 'energy', text: 'How much energy do you have?', lo: 'empty|energy', hi: 'full of energy', short: 'Energy' },
  { key: 'mood', text: 'How is your mood?', lo: 'low|mood', hi: 'radiant', short: 'Mood' },
];

const q = (id, text, textDe, lo, loDe, hi, hiDe, short, shortDe) => ({ id, text, textDe, lo, loDe, hi, hiDe, short, shortDe });
/** The ten questions of the pool to start with. */
export const SEED_QUESTIONS = [
  q('body', 'How rested does your body feel?', 'Wie erholt fühlt sich dein Körper an?', 'tired, heavy', 'müde, schwer', 'fresh', 'frisch', 'Body', 'Körper'),
  q('new', 'How keen are you on something new?', 'Wie viel Lust hast du auf Neues?', 'none', 'keine', 'a lot', 'viel', 'New', 'Neues'),
  q('calm', 'How calm is your mind?', 'Wie ruhig ist dein Kopf?', 'restless', 'unruhig', 'still', 'still', 'Calm', 'Ruhe'),
  q('yesterday', 'How happy are you with yesterday?', 'Wie zufrieden bist du mit gestern?', 'not at all', 'gar nicht', 'very', 'sehr', 'Yesterday', 'Gestern'),
  q('food', 'How well did you eat?', 'Wie gut hast du gegessen?', 'badly', 'schlecht', 'very well', 'sehr gut', 'Food', 'Essen'),
  q('people', 'How connected do you feel to others?', 'Wie verbunden fühlst du dich mit anderen?', 'alone', 'allein', 'close', 'verbunden', 'People', 'Menschen'),
  q('outside', 'How much time did you spend outside?', 'Wie viel Zeit warst du draussen?', 'none', 'keine', 'a lot', 'viel', 'Outside', 'Draussen'),
  q('focus', 'How focused can you work today?', 'Wie konzentriert kannst du heute arbeiten?', 'scattered', 'zerstreut', 'focused', 'fokussiert', 'Focus', 'Fokus'),
  q('ease', 'How relaxed do you feel?', 'Wie entspannt fühlst du dich?', 'tense', 'angespannt', 'relaxed', 'entspannt', 'Ease', 'Entspannt'),
  q('thanks', 'How grateful are you today?', 'Wie dankbar bist du heute?', 'a little', 'wenig', 'very', 'sehr', 'Thanks', 'Dank'),
];

/** The stored pool made safe; an empty or broken one gives the seed questions. */
export function poolOf(value) {
  const list = (Array.isArray(value) ? value : []).filter((x) => x && typeof x.id === 'string' && String(x.text ?? '').trim());
  return list.length ? list : SEED_QUESTIONS;
}

/** The fourth question of a day: the pool in turn, one step per day (each comes every n days). */
export function rotating(pool, day) {
  const list = poolOf(pool);
  const i = ((daysBetween('2026-01-01', day) % list.length) + list.length) % list.length;
  return { q: list[i], index: i };
}

/** The keys a check asks for, in order: the three fixed ones and 'extra'. */
export const KEYS = ['sleep', 'energy', 'mood', 'extra'];

const v10 = (x) => (x != null && x !== '' && Number.isInteger(Number(x)) && Number(x) >= 1 && Number(x) <= 10 ? Number(x) : null);
const ids = (x) => (Array.isArray(x) ? [...new Set(x.filter((y) => typeof y === 'string' && y.trim()))] : []);
const oneOf = (x, list) => (list.includes(x) ? x : null);
/**
 * A check made whole (each answer 1–10 or null). v0.124.0 «Tages-Check» 1: the same row of the day
 * holds the new morning and evening answers too, all optional (an old row reads with them empty).
 */
export function checkOf(c, day) {
  const goal = c?.goal && typeof c.goal === 'object' && (GOALS.some((g) => g.id === c.goal.id) || String(c.goal.text ?? '').trim()) ? (c.goal.id ? { id: c.goal.id } : { text: String(c.goal.text).trim() }) : null;
  return {
    day: c?.day ?? day,
    sleep: v10(c?.sleep),
    energy: v10(c?.energy),
    mood: v10(c?.mood),
    q: c?.q ?? null,
    extra: v10(c?.extra),
    // morning (T1)
    joy: ids(c?.joy),
    goal,
    last: ids(c?.last).filter((x) => LAST_EVENING.some((l) => l.id === x)),
    sugg: c?.sugg && typeof c.sugg === 'object' ? { id: String(c.sugg.id ?? ''), pick: String(c.sugg.pick ?? '') } : null,
    // evening (T2)
    sat: v10(c?.sat),
    best: ids(c?.best),
    story: typeof c?.story === 'string' ? c.story : '',
    goalDone: oneOf(c?.goalDone, GOAL_DONE),
    outside: oneOf(c?.outside, OUTSIDE),
    people: oneOf(c?.people, PEOPLE),
    fun: v10(c?.fun),
    mindful: oneOf(c?.mindful, ['yes', 'no', 'auto']),
  };
}
/** Some answers of the day set at once (the rest kept). */
export const patchCheck = (c, fields, day) => ({ ...checkOf(c, day), ...fields });
/** How many of the four are answered. */
export const answered = (c) => KEYS.filter((k) => c?.[k] != null).length;
export const complete = (c) => answered(c) === KEYS.length;
/** The first question still open (its key), null when all four are answered. */
export const nextOpen = (c) => KEYS.find((k) => c?.[k] == null) ?? null;

/** Set one answer: the check with it, the 4th question's id kept with its answer. */
export function answer(c, key, value, day, qid = null) {
  const out = { ...checkOf(c, day), [key]: value };
  if (key === 'extra' && qid) out.q = qid;
  return out;
}

/** Yesterday's answer of a key (the dot under the scale), the 4th only for the same question. */
export function yesterdayOf(checks = [], day, key, qid = null) {
  const y = checks.find((c) => c.day === addDays(day, -1));
  if (!y) return null;
  if (key === 'extra' && qid && y.q !== qid) return null;
  return checkOf(y)[key];
}

/** The mean of a key over the last n days (one decimal), null without answers; series per day too. */
export function averages(checks = [], today, n = 7) {
  const days = lastDays(today, n);
  const byDay = Object.fromEntries(checks.map((c) => [c.day, checkOf(c)]));
  const out = {};
  for (const k of ['sleep', 'energy', 'mood']) {
    const series = days.map((d) => byDay[d]?.[k] ?? null);
    const vals = series.filter((x) => x != null);
    out[k] = { mean: vals.length ? Math.round((vals.reduce((s, x) => s + x, 0) / vals.length) * 10) / 10 : null, series };
  }
  return out;
}

/* ---------- v0.124.0 «Tages-Check» step 1: morning check (T1) and evening review (T2) ---------- */
/**
 * Noah 13.10.2026 «ich gebe hiermit alle mockups frei»: questions 1–14 of the 15 (the Sunday one comes
 * later). Every question is optional and skippable; what the app already knows (meditation, rides) it
 * fills in or shows. Labels are English keys for t(). Own chips are stored as their text.
 */
export const JOYS = [
  { id: 'nature', label: 'Nature|joy' },
  { id: 'sport', label: 'Sport|joy' },
  { id: 'friends', label: 'Friends|joy' },
  { id: 'new', label: 'Something new|joy' },
  { id: 'calm', label: 'Calm|joy' },
];
/** Q9 «Was war heute am coolsten?»: the joys and «Geschafft». */
export const BEST = [JOYS[0], JOYS[1], JOYS[2], JOYS[4], { id: 'done', label: 'Got it done|best' }, JOYS[3]];
/** Q7: a short list of goals to start with (Noah: suggestions, an own sentence always possible). */
export const GOALS = [
  { id: 'ride', label: 'Ride after work' },
  { id: 'meditate', label: 'Meditate 20 min' },
  { id: 'early', label: 'Go to bed early' },
];
/** «Gestern Abend» (optional, for sleep comparisons later). */
export const LAST_EVENING = [
  { id: 'coffee', label: 'Coffee after 2 pm' },
  { id: 'alcohol', label: 'Alcohol|last' },
  { id: 'phone', label: 'Phone in bed' },
  { id: 'late', label: 'Ate late' },
];
export const GOAL_DONE = ['yes', 'part', 'no'];
/** Q11 «Wie lange warst du draussen?» in four steps. */
export const OUTSIDE = ['0', 'lt30', '30-90', 'gt90'];
/** Q12 «Zeit mit Freunden oder Familie?» */
export const PEOPLE = ['no', 'short', 'lots'];

/** Add or take away one chip. */
export const toggleId = (list = [], id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/** The step of Q11 for some minutes outside. */
export const outsideStep = (min) => (min == null ? null : min <= 0 ? '0' : min <= 30 ? 'lt30' : min <= 90 ? '30-90' : 'gt90');

/** Minutes of one ride: its total or moving time (a GPX file), else a guess from its km at 18 km/h. */
export const rideMinutes = (r) => {
  const h = Math.max(Number(r?.totalH) || 0, Number(r?.movingH) || 0);
  if (h > 0) return Math.round(h * 60);
  const km = Number(r?.km) || 0;
  return km > 0 ? Math.round((km / 18) * 60) : 0;
};
/**
 * Q11 filled in from the rides of a day (files and counted Strava rides, kmbook.js withStravaRides):
 * { step, min, km, n } or null when there is no ride that day (then nothing is filled in).
 */
export function outsideFromRides(rides = [], day) {
  const list = rides.filter((r) => r?.date === day && ((Number(r.km) || 0) > 0 || rideMinutes(r) > 0));
  if (!list.length) return null;
  const min = list.reduce((s, r) => s + rideMinutes(r), 0);
  const km = Math.round(list.reduce((s, r) => s + (Number(r.km) || 0), 0) * 10) / 10;
  return { step: outsideStep(min), min, km, n: list.length };
}

/** Q12 and Q13 take turns, one a day: 'people' (Q12) or 'fun' (Q13). */
export const eveningTurn = (day) => (((daysBetween('2026-01-01', day) % 2) + 2) % 2 === 0 ? 'people' : 'fun');

/**
 * Q14 «achtsamer Moment» found by itself: today's meditation (log entries of the activity) →
 * { min, at, n } (at: the first one's ISO time) or null.
 */
export function mindfulFound(log = [], day, actId = 'meditation') {
  const list = log.filter((e) => e.actId === actId && e.day === day).sort((a, b) => String(a.at ?? '').localeCompare(String(b.at ?? '')));
  if (!list.length) return null;
  return { min: Math.round(list.reduce((s, e) => s + (Number(e.min) || 0), 0)), at: list[0].at ?? null, n: list.length };
}

/** «Woche bisher»: how often each highlight (Q9) came in the last n days, most first: [{ id, n }]. */
export function weekHighlights(checks = [], today, n = 7) {
  const days = new Set(lastDays(today, n));
  const count = new Map();
  for (const c of checks) {
    if (!days.has(c?.day)) continue;
    for (const id of checkOf(c).best) count.set(id, (count.get(id) ?? 0) + 1);
  }
  const order = (id) => {
    const i = BEST.findIndex((b) => b.id === id);
    return i < 0 ? 99 : i;
  };
  return [...count].map(([id, k]) => ({ id, n: k })).sort((a, b) => b.n - a.n || order(a.id) - order(b.id) || a.id.localeCompare(b.id));
}

/** From 20:30 local time the entry offers the evening review. */
export const isEvening = (d = new Date()) => d.getHours() * 60 + d.getMinutes() >= 20 * 60 + 30;
/** Where the check entry leads now: the morning check, from 20:30 the evening review. */
export const checkHref = (d = new Date()) => (isEvening(d) ? '#/check/evening' : '#/check/morning');
/** The part of the check an address shows ('morning' or 'evening'). */
export const checkPart = (hash = '') => (/^#\/check\/evening\b/.test(hash) ? 'evening' : 'morning');
/** How many of the evening questions are answered (for the entry on Heute). */
export const eveningDone = (c) => checkOf(c).sat != null;

/**
 * «Vorschlag für heute» (simple rules, never mandatory): from how you slept and feel, what you look
 * forward to and today's home weather ({ max, rain: 'none'|'showers'|'rain' } or null).
 * → { id, text, opts: [{ id, label }] } (labels are English keys for t(); «Nicht heute» is added by the page).
 */
export function suggestion({ sleep = null, energy = null, joy = [], weather = null } = {}) {
  const dry = weather ? weather.rain === 'none' : null;
  const tired = (energy != null && energy <= 4) || (sleep != null && sleep <= 4);
  const walk = { id: 'walk', label: 'Walk 30 min' };
  const med = { id: 'med', label: 'Meditate 10 min' };
  if (tired) return { id: 'easy', text: 'A short night or little energy: rather something easy today?', opts: [walk, med] };
  if (joy.includes('calm')) return { id: 'calm', text: 'You look forward to calm: a quiet half hour for yourself?', opts: [med, { id: 'sauna', label: 'Sauna|sugg' }, walk] };
  if (dry !== false && (joy.includes('nature') || joy.includes('sport'))) return { id: 'ride', text: dry ? 'Dry, and you look forward to being outside: a ride after work?' : 'You look forward to being outside: a ride after work?', opts: [{ id: 'ride', label: 'Ride 1 h' }, walk] };
  if (dry === false) return { id: 'indoor', text: 'Wet outside: something indoors today?', opts: [{ id: 'yoga', label: 'Yoga 30 min' }, med] };
  if (joy.includes('friends')) return { id: 'friends', text: 'You look forward to friends: arrange something small?', opts: [{ id: 'meet', label: 'Meet up' }, walk] };
  return { id: 'walk', text: 'A little time outside does most days good.', opts: [walk, { id: 'ride', label: 'Ride 1 h' }] };
}
