/**
 * Paket M «Aus Touren lernen» · «Quiz am Vorabend» (wish #207, Noah 19.10.2026): three questions about
 * the gear and the route of a trip, built from the user's own data, with a streak. It can be switched
 * off; own questions can be added, changed, deleted and switched off one by one (rule 18), and every
 * kind of suggested question can be hidden («Vorschläge ausblenden»).
 *
 * Pure rules (tests/quiz.test.js); the page is src/pages/Quiz.svelte (#/quiz, #/quiz/<tripId>), the
 * card src/lib/lernen/QuizCard.svelte. Stored in db.settings 'quiz' (in backups and the sync):
 *   { on, own: [{ id, text, right, wrong: [..], on, pin }], offTypes: ['bag', …],
 *     log: [{ day, tripId, right, of, ids: [question id …] }], hidden: [tripId …] }
 *   own.wrong empty: a «Weisst du's?» card (the answer is revealed and you rate yourself).
 *   hidden: trips whose evening card on «Gepackt» was put away.
 *
 * A question: { id, type, text, answers: [{ text, right }], note?, reveal? }. Ids stay the same for the
 * same fact (type plus what it asks about), so the log knows which ones came up the evening before.
 * The draw is seeded by the day and the trip: the same quiz after a reload.
 */
import { t, num, nameOf } from '../i18n.svelte.js';
import { tripStats, zoneName } from '../trips.js';
import { stagePlan, stageDays } from '../stages.js';
import { forecastForTrip } from '../weather.js';
import { nextTrip } from '../debrief.js';
import { isTestTrip, isArchived } from '../testname.js';

export const QUIZ_KEY = 'quiz';
/** Questions in one quiz. */
export const PER_QUIZ = 3;
/** At most this many results stay in the log. */
export const LOG_MAX = 200;
/** The kinds of suggested questions, in the order the page lists them (their switches). */
export const TYPES = [
  { key: 'bag', name: 'Which bag?|quiz' },
  { key: 'heavier', name: 'What weighs more?|quiz' },
  { key: 'count', name: 'How many in the bag?|quiz' },
  { key: 'route', name: 'Distance and climbing|quiz' },
  { key: 'place', name: 'Start and finish|quiz' },
  { key: 'longest', name: 'Longest day|quiz' },
  { key: 'weather', name: 'Weather|quiz' },
];
export const TYPE_KEYS = TYPES.map((x) => x.key);

/* ---------------------------------------------------------------- settings */

const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** One own question as stored: text and right answer required, 0–3 wrong answers. Null when it is not one. */
export function ownOf(x) {
  if (!x || typeof x !== 'object') return null;
  const text = str(x.text);
  const right = str(x.right);
  if (!text || !right) return null;
  const wrong = [...new Set((Array.isArray(x.wrong) ? x.wrong : []).map((w) => str(w)).filter((w) => w && w !== right))].slice(0, 3);
  return { id: str(x.id, 60) || `qo-${Math.random().toString(36).slice(2, 9)}`, text, right, wrong, on: x.on !== false, pin: !!x.pin };
}

/** The stored record, cleaned: missing parts get their default (on, no own questions, nothing hidden). */
export function quizOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  return {
    on: v.on !== false,
    own: (Array.isArray(v.own) ? v.own : []).map(ownOf).filter(Boolean),
    offTypes: (Array.isArray(v.offTypes) ? v.offTypes : []).filter((k) => TYPE_KEYS.includes(k)),
    log: (Array.isArray(v.log) ? v.log : []).filter((e) => e && /^\d{4}-\d{2}-\d{2}$/.test(e.day ?? '') && e.tripId).map((e) => ({ day: e.day, tripId: String(e.tripId), right: Number(e.right) || 0, of: Number(e.of) || 0, ids: Array.isArray(e.ids) ? e.ids.map(String) : [] })),
    hidden: (Array.isArray(v.hidden) ? v.hidden : []).map(String).slice(-50),
  };
}

/** A new own question (id from the time). */
export const newOwn = (fields = {}, now = Date.now()) => ownOf({ on: true, pin: false, ...fields, id: `qo-${now.toString(36)}` });

/** Put an own question in (a new one at the end, a known id replaced in place). */
export function putOwn(cfg, q) {
  const c = quizOf(cfg);
  const clean = ownOf(q);
  if (!clean) return c;
  const at = c.own.findIndex((x) => x.id === clean.id);
  const own = at < 0 ? [...c.own, clean] : c.own.map((x, i) => (i === at ? clean : x));
  return { ...c, own };
}
/** Take an own question out. */
export const dropOwn = (cfg, id) => {
  const c = quizOf(cfg);
  return { ...c, own: c.own.filter((x) => x.id !== id) };
};
/** Change one field of an own question (on, pin). */
export const patchOwn = (cfg, id, patch) => {
  const c = quizOf(cfg);
  return { ...c, own: c.own.map((x) => (x.id === id ? ownOf({ ...x, ...patch }) : x)) };
};
/** Move own question `from` to place `to` (arrows and drag). */
export function moveOwn(cfg, from, to) {
  const c = quizOf(cfg);
  if (from === to || from < 0 || to < 0 || from >= c.own.length || to >= c.own.length) return c;
  const own = [...c.own];
  const [x] = own.splice(from, 1);
  own.splice(to, 0, x);
  return { ...c, own };
}
/** Switch a kind of suggested question on or off. */
export const setType = (cfg, key, on) => {
  const c = quizOf(cfg);
  const off = new Set(c.offTypes);
  if (on) off.delete(key);
  else if (TYPE_KEYS.includes(key)) off.add(key);
  return { ...c, offTypes: TYPE_KEYS.filter((k) => off.has(k)) };
};
/** Put the evening card of a trip away. */
export const hideCard = (cfg, tripId) => {
  const c = quizOf(cfg);
  return { ...c, hidden: [...new Set([...c.hidden, String(tripId)])].slice(-50) };
};

/* ---------------------------------------------------------------- the seeded draw */

/** A small number from a text (FNV-1a). */
export function hashOf(s) {
  let h = 2166136261;
  for (const ch of String(s)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
/** A repeatable random function from a seed (mulberry32). */
export function randomOf(seed) {
  let a = hashOf(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle(list, rnd) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A question with its answers in a seeded order: one right, the others wrong, 3–4 in all (or none: «Weisst du's?»). */
function ask(id, type, text, right, wrong, rnd, extra = {}) {
  const ws = [...new Set(wrong.map(String))].filter((w) => w && w !== String(right)).slice(0, 3);
  if (ws.length < 2) return null;
  const answers = shuffle([{ text: String(right), right: true }, ...ws.map((w) => ({ text: w, right: false }))], rnd);
  return { id, type, text, answers, ...extra };
}

/** Numbers near the right one that read differently (no two the same after rounding). */
export function nearNumbers(value, rnd, { round = (x) => Math.round(x), factors = [0.6, 0.75, 1.3, 1.5, 1.8] } = {}) {
  const right = round(value);
  const out = [];
  for (const f of shuffle(factors, rnd)) {
    const w = round(value * f);
    if (w > 0 && w !== right && !out.includes(w)) out.push(w);
    if (out.length === 3) break;
  }
  return out;
}

/* ---------------------------------------------------------------- the questions of a trip */

const kg = (g) => (g >= 1000 ? `${num(Math.round(g / 100) / 10)} kg` : `${num(Math.round(g))} g`);

/**
 * Every suggested question the trip's data allows → [question]. data: { items, containers, bikes, trips }.
 * Nothing is invented: a question needs its facts (a weight, a route, a named stage, a forecast).
 */
export function generated(trip, data = {}, rnd = Math.random) {
  if (!trip) return [];
  const items = data.items ?? [];
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const bike = (data.bikes ?? []).find((b) => b.id === trip.bikeId) ?? null;
  const out = [];
  const push = (q) => q && out.push(q);
  const entries = (trip.entries ?? []).filter((e) => byId[e.itemId]);

  // in which bag? (zones with something in them, named apart)
  if (entries.length) {
    const stats = tripStats({ ...trip, entries }, items, data.containers ?? [], bike, 0);
    const zones = stats.zones.filter((z) => z.entries.length).map((z) => ({ z, name: zoneName(z) }));
    const names = [...new Set(zones.map((x) => x.name))];
    if (names.length >= 3) {
      for (const { z, name } of zones) {
        for (const e of z.entries) {
          const it = byId[e.itemId];
          push(ask(`bag:${it.id}`, 'bag', t('In which bag is {item}?', { item: nameOf(it) }), name, shuffle(names.filter((n) => n !== name), rnd), rnd));
        }
      }
    }
    // how many in the bag? (pieces, counted with their number)
    for (const { z, name } of zones) {
      const n = z.entries.reduce((s, e) => s + (Number(e.qty) || 1), 0);
      if (n < 2) continue;
      const wrong = shuffle([n - 2, n - 1, n + 1, n + 2, n + 3].filter((x) => x > 0), rnd);
      push(ask(`count:${z.key}`, 'count', t('How many pieces are in «{bag}»?', { bag: name }), num(n), wrong.map(num), rnd));
    }
  }

  // what weighs more? (three items with a known weight, the heaviest a tenth above the next)
  const weighed = [...new Map(entries.map((e) => [e.itemId, byId[e.itemId]])).values()].filter((i) => Number(i.weightG) > 0);
  if (weighed.length >= 3) {
    const pool = shuffle(weighed, rnd);
    for (let k = 0; k + 2 < pool.length && k < 12; k += 3) {
      const three = pool.slice(k, k + 3).sort((a, b) => b.weightG - a.weightG);
      if (three[0].weightG < three[1].weightG * 1.1) continue;
      const id = `heavier:${three.map((i) => i.id).sort().join('+')}`;
      push(ask(id, 'heavier', t('What weighs more?'), nameOf(three[0]), three.slice(1).map(nameOf), rnd, { note: three.map((i) => `${nameOf(i)} ${kg(i.weightG)}`).join(' · ') }));
    }
  }

  // the route: km and climbing
  const route = trip.route ?? null;
  if (route?.km > 0) {
    const r = (x) => Math.round(x);
    push(ask('route:km', 'route', t('How long is the route?'), `${num(r(route.km))} km`, nearNumbers(route.km, rnd, { round: r }).map((x) => `${num(x)} km`), rnd));
  }
  if (route?.gainM > 0) {
    const r = (x) => Math.round(x / 50) * 50 || 50;
    push(ask('route:hm', 'route', t('How many metres of climbing has the route?'), `${num(r(route.gainM))} m`, nearNumbers(route.gainM, rnd, { round: r }).map((x) => `${num(x)} m`), rnd));
  }

  // start and finish: the names of the stages, other places as the wrong answers
  const plan = stageDays(trip) > 1 ? stagePlan(trip) : [];
  const start = str(trip.stages?.start) || str(plan[0]?.from) || '';
  const finish = str(plan.at(-1)?.to) || '';
  const otherPlaces = [...new Set((data.trips ?? []).filter((x) => x.id !== trip.id).flatMap((x) => [str(x.stages?.start), ...(x.stages?.days ?? []).map((d) => str(d?.name)), str(x.place?.name)]).filter(Boolean))];
  const own = [...new Set([start, ...plan.map((d) => str(d.to))].filter(Boolean))];
  if (start) push(ask('place:start', 'place', t('Where does the trip start?'), start, shuffle([...own.filter((p) => p !== start), ...shuffle(otherPlaces, rnd)], rnd), rnd));
  if (finish && finish !== start) push(ask('place:finish', 'place', t('Where does the last day end?'), finish, shuffle([...own.filter((p) => p !== finish), ...shuffle(otherPlaces, rnd)], rnd), rnd));

  // the longest day (three days or more, with a route)
  if (plan.length >= 3 && plan.every((d) => d.km > 0)) {
    const label = (d) => (d.to ? t('Day {n} · to {place}', { n: d.day, place: d.to }) : t('Day {n}', { n: d.day }));
    const sorted = [...plan].sort((a, b) => b.km - a.km);
    if (sorted[0].km >= sorted[1].km * 1.05) push(ask('longest', 'longest', t('Which day is the longest?'), label(sorted[0]), sorted.slice(1).map(label), rnd, { note: plan.map((d) => `${label(d)}: ${num(Math.round(d.km))} km`).join(' · ') }));
  }

  // the weather: the forecast of the first day, else the packing weather
  const fc = forecastForTrip(trip).find((d) => d.date === trip.startDate && Number.isFinite(d.max));
  if (fc) {
    const max = Math.round(fc.max);
    const wrong = shuffle([max - 8, max - 4, max + 4, max + 7], rnd).map((x) => `${x} °C`);
    push(ask('weather:max', 'weather', t('How warm does it get on the first day, by the forecast?'), `${max} °C`, wrong, rnd));
    if (Number.isFinite(fc.rainPct)) {
      const band = (p) => (p < 30 ? 'low' : p < 60 ? 'medium' : 'high');
      const words = { low: t('Hardly any rain (under 30 %)'), medium: t('Maybe rain (30–60 %)'), high: t('Likely rain (over 60 %)') };
      const right = band(fc.rainPct);
      push(ask('weather:rain', 'weather', t('How likely is rain on the first day?'), words[right], Object.keys(words).filter((k) => k !== right).map((k) => words[k]), rnd));
    }
  } else if (trip.wx?.min != null && trip.wx?.max != null) {
    const r = `${trip.wx.min}–${trip.wx.max} °C`;
    const shifts = shuffle([-10, -6, 6, 10], rnd);
    push(ask('weather:wx', 'weather', t('Which temperatures do you pack for?'), r, shifts.map((s) => `${trip.wx.min + s}–${trip.wx.max + s} °C`), rnd));
  }
  return out;
}

/** An own question as a quiz question (its wrong answers shuffled in; without any: «Weisst du's?»). */
export function ownQuestion(o, rnd = Math.random) {
  if (!o.wrong.length) return { id: `own:${o.id}`, type: 'own', text: o.text, answers: [], reveal: o.right, own: o.id };
  const answers = shuffle([{ text: o.right, right: true }, ...o.wrong.map((w) => ({ text: w, right: false }))], rnd);
  return { id: `own:${o.id}`, type: 'own', text: o.text, answers, own: o.id };
}

/** The ids asked in the last quiz on another day (to avoid asking them again the next evening). */
export function lastIds(log = [], today) {
  const before = log.filter((e) => e.day < today).sort((a, b) => b.day.localeCompare(a.day));
  return new Set(before[0]?.ids ?? []);
}

/**
 * The quiz of a trip for a day → [question] (up to PER_QUIZ). Pinned own questions («immer fragen») come
 * first; the rest is drawn from the suggested ones (kinds not hidden) and the other own questions that are
 * on, at most one per kind while there is choice, and none of the evening before while there is choice.
 */
export function buildQuiz(trip, data = {}, cfg = {}, today = '') {
  const c = quizOf(cfg);
  const rnd = randomOf(`${today}|${trip?.id ?? ''}`);
  const gen = generated(trip, data, rnd).filter((q) => !c.offTypes.includes(q.type));
  const own = c.own.filter((o) => o.on);
  const pinned = own.filter((o) => o.pin).map((o) => ownQuestion(o, rnd));
  const pool = shuffle([...gen, ...own.filter((o) => !o.pin).map((o) => ownQuestion(o, rnd))], rnd);
  const last = lastIds(c.log, today);
  const out = pinned.slice(0, PER_QUIZ);
  const fresh = pool.filter((q) => !last.has(q.id));
  const tired = pool.filter((q) => last.has(q.id));
  // first round: one per kind among the fresh ones; then any fresh one; then the ones of last time
  for (const pass of [(q) => !out.some((x) => x.type === q.type) && fresh.includes(q), (q) => fresh.includes(q), (q) => tired.includes(q)]) {
    for (const q of pool) {
      if (out.length >= PER_QUIZ) break;
      if (!out.includes(q) && pass(q)) out.push(q);
    }
  }
  return out;
}

/* ---------------------------------------------------------------- the trip, the log, the streak */

const usable = (x) => x?.startDate && !x.skipped && !x.idea && !isArchived(x) && !isTestTrip(x);

/** The trip the quiz is for: the next one that has not started (else the one under way), or null. */
export function quizTrip(trips = [], today) {
  const ahead = trips.filter((x) => usable(x) && x.startDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  return ahead ?? nextTrip(trips, today) ?? null;
}

/** Does a quiz on this day count? For a trip still ahead (or starting today), once a day. */
export const counts = (log = [], trip, today) => !!trip?.startDate && trip.startDate >= today && !log.some((e) => e.day === today);

/** The log with a finished quiz (only when it counts; the oldest go when it gets long). */
export function logResult(cfg, { trip, today, right, of, ids = [] }) {
  const c = quizOf(cfg);
  if (!counts(c.log, trip, today)) return c;
  return { ...c, log: [...c.log, { day: today, tripId: trip.id, right, of, ids }].slice(-LOG_MAX) };
}

/** The result counted today, or null. */
export const todayResult = (log = [], today) => log.find((e) => e.day === today) ?? null;

/**
 * The streak: trips in a row, newest first, each with a quiz before it («Serie: 4 Touren»). The trip still
 * ahead counts once its quiz is done; while it is not done yet it does not break the streak.
 */
export function streak(trips = [], log = [], today) {
  const done = new Set(log.map((e) => e.tripId));
  const list = trips.filter(usable).filter((x) => x.startDate <= today || done.has(x.id)).sort((a, b) => b.startDate.localeCompare(a.startDate));
  let n = 0;
  for (const x of list) {
    if (done.has(x.id)) n++;
    else if (x.startDate >= today) continue;
    else break;
  }
  return n;
}

/** The last results, newest first, with their trip's title → [{ day, tripId, title, right, of }]. */
export function lastResults(trips = [], log = [], n = 5) {
  const title = Object.fromEntries(trips.map((x) => [x.id, x.title]));
  return [...log].sort((a, b) => b.day.localeCompare(a.day)).slice(0, n).map((e) => ({ ...e, title: title[e.tripId] ?? '' }));
}

/** The evening card on «Gepackt»: only when the quiz is on, on the evening before, not put away and not done today. */
export function showEveCard(cfg, trip, { today, hour, eveningBefore }) {
  const c = quizOf(cfg);
  if (!c.on || !trip || c.hidden.includes(trip.id)) return false;
  if (todayResult(c.log, today)?.tripId === trip.id) return false;
  return !!eveningBefore(trip, today, hour);
}
