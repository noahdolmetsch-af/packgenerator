/**
 * Paket P «Was mir gut tut» (Noah 19.10.2026, plan-wuensche P): what makes good days, read from the one
 * history (abdb.js historyQuery), the ride ledger (kmBook) and the Fitbit days (healthDays).
 * Observation only: no grade, no diagnosis; every result says where it comes from («Wie kommt die App
 * darauf?», #259) and shows only once there are enough days. Pure functions (tests/wohl.test.js).
 *
 *   dayData       one record per day: the day score and the facts (outside, ride, friends …)
 *   lifts         one fact: days with it against days without it (what helps, what drains, #251)
 *   combos        two facts together (#246 «Gute Kombinationen»)
 *   comfort       the range of a value with the best days (#248 «Wohlfühlbereich»)
 *   recipe        what was there on a good day (#249 «Rezepte für gute Tage»)
 *   surprises     a week far from your normal (#256, for the Sunday review)
 *   wishGap       the wished mix of the balance ring against the real one (#254)
 *   SHORT         every suggestion in 5, 20 or 60 minutes (#250)
 *   rideNumbers   km, metres climbed and pulse of a day (#221, for the evening)
 */
import { lastDays } from './flow.js';
import { dailyValues } from './abauswertung.js';

const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
const sd = (xs) => {
  const m = mean(xs);
  return xs.length < 2 ? 0 : Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
};

/** A day counts as good from this day score (1–10) on. */
export const GOOD = 7;
/** At least this many days in each group before a fact says something. */
export const MIN_DAYS = 5;
/** Two facts together: at least this many days with both. */
export const MIN_BOTH = 4;
/** A difference of the day score that is worth a line (on 1–10). */
export const MIN_DIFF = 0.8;

/** The day score: «Wie zufrieden mit dem Tag» (1–10), else the mean of mood and grins. */
export const SCORE_QIDS = ['erreicht.zufrieden', 'spass.stimmung', 'spass.grinser'];

/**
 * The facts of a day. label: English key for t(); src: where it comes from (for #259).
 * Each test(day record) → true | false | null (null: not known that day).
 */
export const FACTS = [
  { key: 'outside', label: 'at least 30 min outside', src: ['hand', 'strava'] },
  { key: 'ride', label: 'a ride', src: ['strava', 'hand'] },
  { key: 'friends', label: 'time with friends or family', src: ['hand'] },
  { key: 'moment', label: 'a mindful moment', src: ['hand'] },
  { key: 'sleep', label: 'slept well', src: ['hand', 'fitbit'] },
  { key: 'laugh', label: 'laughed out loud', src: ['hand'] },
  { key: 'goal', label: 'reached your goal', src: ['hand'] },
  { key: 'food', label: 'ate well', src: ['hand'] },
  { key: 'screen', label: 'more than 4 h screen', src: ['hand'] },
  { key: 'coffee', label: '3 coffees or more', src: ['hand'] },
  { key: 'alone', label: 'time alone on purpose', src: ['hand'] },
  { key: 'replan', label: 'replanned on purpose', src: ['hand'] },
];
export const FACT = Object.fromEntries(FACTS.map((f) => [f.key, f]));

const pick = (rows, qid) => {
  const out = {};
  for (const r of rows) if (r.qid === qid && r.value != null && !(r.day in out)) out[r.day] = r.value;
  return out;
};
const first = (v) => (Array.isArray(v) ? v[0] : v);
/** A ride of the ledger that counts (not a start value, reading, removed entry or a multi-day span). */
const isRide = (e) => !!e?.date && e.kind === 'ride' && e.state !== 'removed' && !e.span && Number(e.km) > 0;

/**
 * One record per day of `days`: { day, score (1–10 or null), facts: { key: true | false | null },
 * values: { sleepH, outsideMin, km, hm, hrAvg, coffee, screenH } }.
 * rows: the history (newest first, as historyQuery gives it); km: kmBook rows ({ date, km, hm, hrAvg, kind });
 * health: healthDays rows ({ date, sleep: { asleepMin } }).
 */
export function dayData({ rows = [], km = [], health = [], days = [] } = {}) {
  const score = SCORE_QIDS.map((q) => dailyValues(rows, q));
  const draussen = pick(rows, 'natur.draussen');
  const zeit = pick(rows, 'freunde.zeit');
  const verbunden = dailyValues(rows, 'freunde.verbunden');
  const moment = pick(rows, 'achtsamkeit.moment');
  const schlaf = dailyValues(rows, 'erholung.schlaf');
  const gelacht = pick(rows, 'spass.gelacht');
  const ziel = pick(rows, 'erreicht.ziel');
  const essen = dailyValues(rows, 'koerper.essen');
  const screen = dailyValues(rows, 'koerper.bildschirm');
  const coffee = dailyValues(rows, 'erholung.kaffee');
  const alone = pick(rows, 'freunde.allein');
  const replan = pick(rows, 'ziele.umplanen');
  const strava = {};
  for (const r of rows) if (r.kind === 'ride' && Number(r.value) > 0) strava[r.day] = (strava[r.day] ?? 0) + Number(r.value);
  const ledger = {};
  for (const e of km) {
    if (!isRide(e)) continue;
    const x = (ledger[e.date] ??= { km: 0, hm: 0, hr: [] });
    x.km += Number(e.km);
    if (Number(e.hm) > 0) x.hm += Number(e.hm);
    if (Number(e.hrAvg) > 0) x.hr.push(Number(e.hrAvg));
  }
  const sleepMin = Object.fromEntries(health.filter((h) => h?.date && Number(h.sleep?.asleepMin) > 0).map((h) => [h.date, Number(h.sleep.asleepMin)]));
  const OUT_MIN = { m0: 0, m30: 15, m90: 60, more: 120 };

  return days.map((day) => {
    const s = score.find((p) => p[day] != null)?.[day] ?? null;
    const kmDay = ledger[day]?.km || strava[day] || 0;
    const out = first(draussen[day]);
    const outsideMin = out in OUT_MIN ? OUT_MIN[out] : null;
    const z = first(zeit[day]);
    const sleepH = sleepMin[day] ? sleepMin[day] / 60 : null;
    const yes = (v) => (v == null ? null : ['yes', 'often', 'several'].includes(first(v)));
    const facts = {
      outside: outsideMin != null ? outsideMin >= 30 || kmDay > 0 : kmDay > 0 ? true : null,
      ride: kmDay > 0 ? true : km.length || Object.keys(strava).length ? false : null,
      friends: z != null ? z !== 'no' : verbunden[day] != null ? verbunden[day] >= 7 : null,
      moment: yes(moment[day]),
      sleep: schlaf[day] != null ? schlaf[day] >= 7 : sleepH != null ? sleepH >= 7 : null,
      laugh: yes(gelacht[day]),
      goal: ziel[day] == null ? null : first(ziel[day]) === 'yes',
      food: essen[day] != null ? essen[day] >= 7 : null,
      screen: screen[day] != null ? screen[day] > 4 : null,
      coffee: coffee[day] != null ? coffee[day] >= 3 : null,
      alone: yes(alone[day]),
      replan: replan[day] == null ? null : ['good', 'notgood'].includes(first(replan[day])),
    };
    return {
      day,
      score: s == null ? null : r1(s),
      facts,
      values: { sleepH: r1(sleepH), outsideMin, km: kmDay ? Math.round(kmDay) : 0, hm: ledger[day]?.hm ? Math.round(ledger[day].hm) : null, hrAvg: ledger[day]?.hr.length ? Math.round(mean(ledger[day].hr)) : null, coffee: coffee[day] ?? null, screenH: screen[day] ?? null },
    };
  });
}

/**
 * One fact: the day score on days with it and on days without it. → [{ key, with, without, nWith,
 * nWithout, diff }] for every fact with MIN_DAYS days in both groups, the biggest difference first.
 */
export function lifts(data = [], { min = MIN_DAYS } = {}) {
  const out = [];
  for (const { key } of FACTS) {
    const yes = data.filter((d) => d.score != null && d.facts[key] === true).map((d) => d.score);
    const no = data.filter((d) => d.score != null && d.facts[key] === false).map((d) => d.score);
    if (yes.length < min || no.length < min) continue;
    const a = mean(yes);
    const b = mean(no);
    out.push({ key, with: r1(a), without: r1(b), nWith: yes.length, nWithout: no.length, diff: r1(a - b) });
  }
  return out.sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff));
}
/** What helps: facts with a clearly better day score (top 3). */
export const helps = (data, opts) => lifts(data, opts).filter((l) => l.diff >= MIN_DIFF).slice(0, 3);
/** #251 Energieräuber: facts with a clearly lower day score (top 3). Shown only when switched on. */
export const drains = (data, opts) => lifts(data, opts).filter((l) => l.diff <= -MIN_DIFF).sort((a, b) => a.diff - b.diff).slice(0, 3);

/**
 * #246 Gute Kombinationen: two facts on the same day against the days with at most one of them.
 * Only pairs that are better together than each one alone. → [{ keys: [a, b], both, rest, nBoth, nRest, diff }]
 */
export function combos(data = [], { min = MIN_DAYS, minBoth = MIN_BOTH, top = 3 } = {}) {
  const good = FACTS.filter((f) => !['screen', 'coffee'].includes(f.key)).map((f) => f.key);
  const single = Object.fromEntries(lifts(data, { min }).map((l) => [l.key, l.with]));
  const out = [];
  for (let i = 0; i < good.length; i++)
    for (let j = i + 1; j < good.length; j++) {
      const [a, b] = [good[i], good[j]];
      const known = data.filter((d) => d.score != null && d.facts[a] != null && d.facts[b] != null);
      const both = known.filter((d) => d.facts[a] && d.facts[b]).map((d) => d.score);
      const rest = known.filter((d) => !(d.facts[a] && d.facts[b])).map((d) => d.score);
      if (both.length < minBoth || rest.length < min) continue;
      const m = mean(both);
      const diff = m - mean(rest);
      // better together than the better one alone
      const alone = Math.max(single[a] ?? -Infinity, single[b] ?? -Infinity);
      if (diff < MIN_DIFF || m <= alone) continue;
      out.push({ keys: [a, b], both: r1(m), rest: r1(mean(rest)), nBoth: both.length, nRest: rest.length, diff: r1(diff) });
    }
  return out.sort((x, y) => y.diff - x.diff || y.nBoth - x.nBoth).slice(0, top);
}

/**
 * #248 Wohlfühlbereich: per value its ranges and the range with the best day score.
 * → [{ key, label, best: { label, mean, n }, all: [{ label, mean, n }], overall }] (only values with
 * at least 2 ranges of MIN_DAYS − 1 days).
 */
export const RANGES = [
  { key: 'sleepH', label: 'Sleep (Fitbit)', unit: 'h', cuts: [[0, 6, 'under 6 h'], [6, 7, '6–7 h'], [7, 8, '7–8 h'], [8, 24, 'over 8 h']] },
  { key: 'outsideMin', label: 'Time outside', unit: 'min', cuts: [[0, 1, 'none|outside'], [1, 30, 'up to 30 min'], [30, 90, '30–90 min'], [90, 1e9, 'over 90 min']] },
  { key: 'km', label: 'Kilometres of the day', unit: 'km', cuts: [[0, 0.5, 'no ride'], [0.5, 20, 'up to 20 km'], [20, 50, '20–50 km'], [50, 1e9, 'over 50 km']] },
  { key: 'coffee', label: 'Coffees', unit: 'cups', cuts: [[0, 1, 'none|coffee'], [1, 2, '1|cups'], [2, 3, '2|cups'], [3, 99, '3 or more']] },
  { key: 'screenH', label: 'Screen time', unit: 'h', cuts: [[0, 2, 'up to 2 h'], [2, 4, '2–4 h'], [4, 6, '4–6 h'], [6, 24, 'over 6 h']] },
];
export function comfort(data = [], { min = MIN_DAYS - 1 } = {}) {
  const out = [];
  for (const r of RANGES) {
    const known = data.filter((d) => d.score != null && d.values[r.key] != null);
    const all = r.cuts
      .map(([lo, hi, label]) => {
        const xs = known.filter((d) => d.values[r.key] >= lo && d.values[r.key] < hi).map((d) => d.score);
        return { label, mean: r1(mean(xs)), n: xs.length };
      })
      .filter((x) => x.n >= min);
    if (all.length < 2) continue;
    const best = [...all].sort((a, b) => b.mean - a.mean || b.n - a.n)[0];
    out.push({ key: r.key, label: r.label, best, all, overall: r1(mean(known.map((d) => d.score))) });
  }
  return out;
}

/**
 * #249 Rezept für einen Tag: the facts of that day that help on your good days (lifts > 0), and
 * whether the day was good. → { good, score, parts: [key] } or null without a day score.
 */
export function recipe(data = [], day) {
  const d = data.find((x) => x.day === day);
  if (!d || d.score == null) return null;
  const plus = new Set(lifts(data).filter((l) => l.diff > 0).map((l) => l.key));
  const parts = FACTS.map((f) => f.key).filter((k) => d.facts[k] === true && (plus.has(k) || !plus.size) && !['screen', 'coffee'].includes(k));
  return { good: d.score >= GOOD, score: d.score, parts };
}

/** The recipes of your good days: which parts come up most (top 4). → [{ key, n, of }] */
export function goodRecipes(data = []) {
  const goodDays = data.filter((d) => d.score != null && d.score >= GOOD);
  const count = {};
  for (const d of goodDays) for (const f of FACTS) if (d.facts[f.key] === true && !['screen', 'coffee'].includes(f.key)) count[f.key] = (count[f.key] ?? 0) + 1;
  return Object.entries(count)
    .map(([key, n]) => ({ key, n, of: goodDays.length }))
    .filter((x) => x.n >= 2)
    .sort((a, b) => b.n - a.n)
    .slice(0, 4);
}

/**
 * #256 Überraschungen: per 1–10 question the mean of the week against your normal (the 30 days
 * before the week): a surprise when it is more than one usual spread away and at least 1 point.
 * → [{ qid, week, normal, dir: 'up' | 'down', n }] the biggest first.
 */
export function surprises(rows = [], week = [], { before = 30 } = {}) {
  if (!week.length) return [];
  const prev = lastDays(week[0], before + 1).slice(0, -1);
  const qids = [...new Set(rows.filter((r) => r.kind === 'scale').map((r) => r.qid))];
  const out = [];
  for (const qid of qids) {
    const per = dailyValues(rows, qid);
    const w = week.map((d) => per[d]).filter((v) => v != null);
    const p = prev.map((d) => per[d]).filter((v) => v != null);
    if (w.length < 3 || p.length < 7) continue;
    const a = mean(w);
    const b = mean(p);
    const gap = Math.abs(a - b);
    if (gap < 1 || gap <= sd(p)) continue;
    out.push({ qid, week: r1(a), normal: r1(b), dir: a > b ? 'up' : 'down', n: w.length, gap });
  }
  return out.sort((x, y) => y.gap - x.gap).slice(0, 3).map(({ gap, ...x }) => x);
}

/** #254 the wished mix: the settings record and its cleaning ({ cat: 0–100 }). */
export const WISH_KEY = 'balance.wish';
export function wishOf(value, cats = []) {
  const v = value && typeof value === 'object' ? value : {};
  const out = {};
  for (const c of cats) {
    const n = Number(v[c]);
    if (Number.isFinite(n)) out[c] = Math.max(0, Math.min(100, Math.round(n / 10) * 10));
  }
  return out;
}
/**
 * The real ring against the wish: the categories furthest below the wish (top 2), each { key, value, wish, gap }.
 * Categories without a value or without a wish are left out.
 */
export function wishGap(cats = [], wish = {}) {
  return cats
    .filter((c) => c.value != null && wish[c.key] != null && wish[c.key] - c.value >= 15)
    .map((c) => ({ key: c.key, value: c.value, wish: wish[c.key], gap: wish[c.key] - c.value }))
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 2);
}
/** The wish as SVG arcs on the ring (the same angles as balance.js ringPaths): [{ key, d }]. */
export function wishArcs(keys = [], wish = {}, size = 200, { inner = 0.27, gap = 2.2 } = {}) {
  const c = size / 2;
  const r0 = size * inner;
  const r1v = size / 2 - 2;
  const step = 360 / keys.length;
  const pt = (r, a) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return `${(c + r * Math.cos(rad)).toFixed(2)} ${(c + r * Math.sin(rad)).toFixed(2)}`;
  };
  return keys
    .map((key, i) => {
      if (wish[key] == null) return null;
      const a0 = i * step - step / 2 + gap / 2;
      const a1 = a0 + step - gap;
      const r = r0 + ((r1v - r0) * Math.max(4, wish[key])) / 100;
      return { key, d: `M ${pt(r, a0)} A ${r} ${r} 0 0 1 ${pt(r, a1)}` };
    })
    .filter(Boolean);
}

/**
 * #250 every suggestion in three sizes: 5, 20 or 60 minutes, per balance category (balance.js CATS).
 * English keys for t().
 */
export const MINUTES = [5, 20, 60];
export const SHORT = {
  fun: ['Put on one song you love', 'Play something, alone or with someone', 'An hour just for a hobby'],
  rest: ['Close your eyes for 5 minutes', 'A short nap or a slow tea', 'Sauna or an early evening'],
  sport: ['Ten squats and a stretch', 'A short round on the bike', 'A proper ride or a run'],
  mind: ['Five breaths, slowly', 'A short meditation', 'A long walk without the phone'],
  friends: ['Send someone a short message', 'Call a friend', 'Meet someone for a coffee or a ride'],
  nature: ['Open the window and look outside', 'A round around the block', 'To the lake or into the forest'],
  vision: ['Write down one dream', 'Look at the map of a dream tour', 'Plan one step of a big plan'],
  goals: ['Choose one small goal', 'Do the first step of it', 'Finish something you put off'],
  done: ['Tick off one small thing', 'Tidy one corner', 'Finish a task completely'],
};
export const shortOf = (cat, min) => SHORT[cat]?.[MINUTES.indexOf(min)] ?? null;

/** #221 the ride of a day in numbers: { km, hm, hrAvg } from the ledger, null without a ride. */
export function rideNumbers(km = [], day) {
  const list = km.filter((e) => e?.date === day && isRide(e));
  if (!list.length) return null;
  const hr = list.map((e) => Number(e.hrAvg)).filter((x) => x > 0);
  const hm = list.reduce((s, e) => s + (Number(e.hm) > 0 ? Number(e.hm) : 0), 0);
  return { km: Math.round(list.reduce((s, e) => s + Number(e.km), 0) * 10) / 10, hm: hm ? Math.round(hm) : null, hrAvg: hr.length ? Math.round(mean(hr)) : null };
}

/** How many days have a day score (for «noch n Tage» before results show). */
export const scoredDays = (data = []) => data.filter((d) => d.score != null).length;

/* ---------- #253 Neuland: new places and things of the year ---------- */
/**
 * settings: [{ id, name, day }] typed by you (names never go through t()). Its own setting since 27.10.2026:
 * it shared 'neuland' with the Neuland page before (neuland/split.js moves old lists over).
 */
export const NEULAND_KEY = 'neulandYear';
const isDay = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
export function neulandOf(value) {
  return (Array.isArray(value) ? value : [])
    .filter((x) => x && typeof x.id === 'string' && String(x.name ?? '').trim() && isDay(x.day))
    .map((x) => ({ id: x.id, name: String(x.name).trim().slice(0, 80), day: x.day }));
}
/**
 * The Neuland of a year: your own entries and the evenings whose «coolest thing» was «New» with a
 * note (auto: true, from the history). Newest first.
 */
export function neulandYear(own = [], rows = [], year) {
  const y = String(year);
  const auto = rows
    .filter((r) => r.qid === 'spass.coolstes' && r.day?.startsWith(y) && (Array.isArray(r.value) ? r.value : [r.value]).includes('new') && String(r.note ?? '').trim())
    .map((r) => ({ id: `auto-${r.day}`, name: String(r.note).trim().slice(0, 80), day: r.day, auto: true }));
  return [...neulandOf(own).filter((x) => x.day.startsWith(y)), ...auto].sort((a, b) => b.day.localeCompare(a.day) || a.name.localeCompare(b.name));
}
export const addNeuland = (list, name, day, id = `nl-${Date.now().toString(36)}`) => [...neulandOf(list), { id, name: String(name).trim().slice(0, 80), day }];
export const renameNeuland = (list, id, name) => neulandOf(list).map((x) => (x.id === id ? { ...x, name: String(name).trim().slice(0, 80) } : x));
export const dropNeuland = (list, id) => neulandOf(list).filter((x) => x.id !== id);

/* ---------- #89 Saisonwechsel: a checklist in spring and in autumn ---------- */
export const SEASON_KEY = 'seasonSwitch';
/** The lists to start with: English keys for t() (std: true); your own and renamed ones are typed text. */
export const SEASON_STD = {
  spring: ['Summer clothes to the front', 'Check the bike tyres and chain', 'Put the lights and fenders away or keep them', 'Sunscreen and bottles ready', 'Book the bike service'],
  autumn: ['Winter clothes to the front', 'Lights on the bike and charged', 'Fenders on', 'Gloves, cap and overshoes ready', 'Wash and oil the bike before winter'],
};
/** Spring March–May, autumn September–November; between them null. */
export const seasonOf = (day) => {
  const m = Number(String(day).slice(5, 7));
  return m >= 3 && m <= 5 ? 'spring' : m >= 9 && m <= 11 ? 'autumn' : null;
};
/** The next season switch from a day (for the line «next: in autumn»). */
export const nextSeason = (day) => seasonOf(day) ?? (Number(String(day).slice(5, 7)) <= 2 || Number(String(day).slice(5, 7)) === 12 ? 'spring' : 'autumn');
/**
 * The stored record made safe: { spring: { items: [{ id, name, std? }], done: { [year]: [id] } }, autumn: … }.
 * Without one the start lists.
 */
export function seasonListOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const out = {};
  for (const s of ['spring', 'autumn']) {
    const x = v[s] && typeof v[s] === 'object' ? v[s] : {};
    const items = Array.isArray(x.items)
      ? x.items.filter((i) => i && typeof i.id === 'string' && String(i.name ?? '').trim()).map((i) => ({ id: i.id, name: String(i.name).trim().slice(0, 80), ...(i.std ? { std: true } : {}) }))
      : SEASON_STD[s].map((name, i) => ({ id: `${s}-${i + 1}`, name, std: true }));
    const done = {};
    for (const [y, ids] of Object.entries(x.done && typeof x.done === 'object' ? x.done : {})) if (/^\d{4}$/.test(y) && Array.isArray(ids)) done[y] = [...new Set(ids.filter((id) => items.some((i) => i.id === id)))];
    out[s] = { items, done };
  }
  return out;
}
export function tickSeason(value, season, year, id) {
  const v = seasonListOf(value);
  const list = v[season].done[year] ?? [];
  v[season].done[year] = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  return v;
}
export function addSeasonItem(value, season, name, id = `own-${Date.now().toString(36)}`) {
  const v = seasonListOf(value);
  v[season].items = [...v[season].items, { id, name: String(name).trim().slice(0, 80) }];
  return v;
}
/** A renamed start item becomes your own text (std falls away). */
export function renameSeasonItem(value, season, id, name) {
  const v = seasonListOf(value);
  v[season].items = v[season].items.map((i) => (i.id === id ? { id, name: String(name).trim().slice(0, 80) } : i));
  return v;
}
export function dropSeasonItem(value, season, id) {
  const v = seasonListOf(value);
  v[season].items = v[season].items.filter((i) => i.id !== id);
  for (const y of Object.keys(v[season].done)) v[season].done[y] = v[season].done[y].filter((x) => x !== id);
  return v;
}
export function moveSeasonItem(value, season, id, dir) {
  const v = seasonListOf(value);
  const list = [...v[season].items];
  const i = list.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return v;
  [list[i], list[j]] = [list[j], list[i]];
  v[season].items = list;
  return v;
}

/* ---------- the page settings ---------- */
/** settings: { drains: false } — the energy drains show only when you switch them on (#251, «freiwillig»). */
export const WOHL_KEY = 'wohl';
export const wohlOf = (value) => ({ drains: !!(value && typeof value === 'object' && value.drains) });

/* ---------- #245 Kleine Experimente (Noah 19.10.2026 «1 a und b»): a suggestion for 7 days, or your own ---------- */
/** settings: [{ id, what, std?, fact?, days, from, stopped? , ticks: [day] }]. */
export const EXP_KEY = 'experiments';
export const EXP_DAYS = [3, 7, 14];
/** The suggestions, one per balance category: English keys for t(); fact: the fact the app can see by itself. */
export const EXP_IDEAS = [
  { cat: 'nature', what: '10 minutes outside every day', fact: 'outside' },
  { cat: 'mind', what: 'A mindful moment every day', fact: 'moment' },
  { cat: 'friends', what: 'Talk to someone every day, not only messages', fact: 'friends' },
  { cat: 'rest', what: 'In bed half an hour earlier', fact: 'sleep' },
  { cat: 'sport', what: 'A short ride or walk every day', fact: 'ride' },
  { cat: 'fun', what: 'Something just for fun every day', fact: 'laugh' },
  { cat: 'vision', what: 'Five minutes a day for a dream', fact: null },
  { cat: 'goals', what: 'One small goal every morning', fact: 'goal' },
  { cat: 'done', what: 'Finish one small thing every day', fact: null },
  { cat: 'rest', what: 'No screen after 21:00', fact: 'screen' },
];
/** The suggestion for the area lowest in your balance (or the first). */
export function expSuggestion(least) {
  return EXP_IDEAS.find((x) => x.cat === least) ?? EXP_IDEAS[0];
}
export function experimentsOf(value) {
  return (Array.isArray(value) ? value : [])
    .filter((x) => x && typeof x.id === 'string' && String(x.what ?? '').trim() && isDay(x.from))
    .map((x) => ({
      id: x.id,
      what: String(x.what).trim().slice(0, 80),
      ...(x.std ? { std: true } : {}),
      fact: FACT[x.fact] ? x.fact : null,
      days: EXP_DAYS.includes(Number(x.days)) ? Number(x.days) : 7,
      from: x.from,
      ...(x.stopped ? { stopped: true } : {}),
      ticks: [...new Set((Array.isArray(x.ticks) ? x.ticks : []).filter(isDay))].sort(),
    }));
}
export const startExperiment = (list, { what, std = false, fact = null, days = 7 }, from, id = `exp-${Date.now().toString(36)}`) => [...experimentsOf(list), { id, what, ...(std ? { std: true } : {}), fact, days, from, ticks: [] }];
export const tickExperiment = (list, id, day) => experimentsOf(list).map((x) => (x.id === id ? { ...x, ticks: x.ticks.includes(day) ? x.ticks.filter((d) => d !== day) : [...x.ticks, day].sort() } : x));
export const stopExperiment = (list, id) => experimentsOf(list).map((x) => (x.id === id ? { ...x, stopped: true } : x));
export const dropExperiment = (list, id) => experimentsOf(list).filter((x) => x.id !== id);
export const renameExperiment = (list, id, what) => experimentsOf(list).map((x) => (x.id === id ? { id: x.id, what: String(what).trim().slice(0, 80), fact: x.fact, days: x.days, from: x.from, ticks: x.ticks, ...(x.stopped ? { stopped: true } : {}) } : x));

/**
 * Where an experiment stands and what it showed: the days of the experiment against the same number of
 * days before it. → { day (1-based, capped), end, done, ticks, during: { mean, n }, before: { mean, n }, diff }
 * diff only when both have at least 2 days with a day score. A fact the app sees (e.g. outside) counts as a tick too.
 */
export function experimentState(x, data = [], today) {
  const span = lastDays(addDayStr(x.from, x.days - 1), x.days);
  const end = span.at(-1);
  const before = lastDays(addDayStr(x.from, -1), x.days);
  const by = Object.fromEntries(data.map((d) => [d.day, d]));
  const scoreOf = (list) => list.map((d) => by[d]?.score).filter((v) => v != null);
  const dur = scoreOf(span.filter((d) => d <= today));
  const bef = scoreOf(before);
  const seen = x.fact ? span.filter((d) => d <= today && by[d]?.facts[x.fact] === (x.fact === 'screen' ? false : true)) : [];
  const ticks = [...new Set([...x.ticks.filter((d) => span.includes(d)), ...seen])].length;
  const ready = dur.length >= 2 && bef.length >= 2;
  return {
    day: Math.max(1, Math.min(x.days, span.filter((d) => d <= today).length)),
    end,
    done: today > end || !!x.stopped,
    ticks,
    during: { mean: r1(mean(dur)), n: dur.length },
    before: { mean: r1(mean(bef)), n: bef.length },
    diff: ready ? r1(mean(dur) - mean(bef)) : null,
  };
}
function addDayStr(day, n) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/* ---------- #255 Lebensphasen (Noah 19.10.2026 «5a und b»): your own phases and the app's suggestions ---------- */
/** settings: { own: [{ id, name, from, until }], names: { [suggestion id]: name }, hidden: [suggestion id] }. */
export const PHASES_KEY = 'lifePhases';
const SEASON_OF_MONTH = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];
export const SEASON_NAMES = { spring: 'Spring {year}', summer: 'Summer {year}', autumn: 'Autumn {year}', winter: 'Winter {year}' };
export function phasesOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const own = (Array.isArray(v.own) ? v.own : [])
    .filter((x) => x && typeof x.id === 'string' && String(x.name ?? '').trim() && isDay(x.from) && isDay(x.until) && x.from <= x.until)
    .map((x) => ({ id: x.id, name: String(x.name).trim().slice(0, 60), from: x.from, until: x.until }));
  const names = {};
  for (const [k, n] of Object.entries(v.names && typeof v.names === 'object' ? v.names : {})) if (String(n ?? '').trim()) names[k] = String(n).trim().slice(0, 60);
  const hidden = [...new Set((Array.isArray(v.hidden) ? v.hidden : []).filter((x) => typeof x === 'string'))];
  return { own, names, hidden };
}
/**
 * The app's suggestions: the last 4 seasons up to today (the one now included), newest first.
 * → [{ id: 'season-2026-autumn', key: 'Autumn {year}', year, from, until }] (key: English for t(); a renamed one has name).
 */
export function suggestedPhases(today, n = 4) {
  const out = [];
  let y = Number(today.slice(0, 4));
  let m = Number(today.slice(5, 7)) - 1;
  let s = SEASON_OF_MONTH[m];
  for (let i = 0; i < n; i++) {
    // the season s that contains month m of year y; winter starts in December of the year before
    const startM = { spring: 2, summer: 5, autumn: 8, winter: 11 }[s];
    const startY = s === 'winter' && m <= 1 ? y - 1 : y;
    const from = `${startY}-${String(startM + 1).padStart(2, '0')}-01`;
    const endD = new Date(Date.UTC(startY, startM + 3, 0));
    const until = endD.toISOString().slice(0, 10);
    const label = s === 'winter' ? `${startY}/${String(startY + 1).slice(2)}` : String(startY);
    out.push({ id: `season-${startY}-${s}`, key: SEASON_NAMES[s], year: label, from, until: until > today ? today : until });
    // one season back
    const prev = new Date(Date.UTC(startY, startM - 1, 1));
    y = prev.getUTCFullYear();
    m = prev.getUTCMonth();
    s = SEASON_OF_MONTH[m];
  }
  return out;
}
export const addPhase = (value, { name, from, until }, id = `ph-${Date.now().toString(36)}`) => {
  const v = phasesOf(value);
  return { ...v, own: [...v.own, { id, name: String(name).trim().slice(0, 60), from, until }] };
};
export function renamePhase(value, id, name) {
  const v = phasesOf(value);
  if (v.own.some((x) => x.id === id)) return { ...v, own: v.own.map((x) => (x.id === id ? { ...x, name: String(name).trim().slice(0, 60) } : x)) };
  return { ...v, names: { ...v.names, [id]: String(name).trim().slice(0, 60) } };
}
export function dropPhase(value, id) {
  const v = phasesOf(value);
  if (v.own.some((x) => x.id === id)) return { ...v, own: v.own.filter((x) => x.id !== id) };
  return { ...v, hidden: [...new Set([...v.hidden, id])] };
}
/**
 * One row per phase: { id, from, until, n (days with a day score), mean, goodShare (0–100), km, top (fact key or null) }.
 * data: dayData over the whole span.
 */
export function phaseRows(phases = [], data = []) {
  return phases.map((p) => {
    const in_ = data.filter((d) => d.day >= p.from && d.day <= p.until);
    const sc = in_.filter((d) => d.score != null);
    const good = sc.filter((d) => d.score >= GOOD);
    const rec = goodRecipes(in_)[0]?.key ?? null;
    return { id: p.id, from: p.from, until: p.until, n: sc.length, mean: r1(mean(sc.map((d) => d.score))), goodShare: sc.length ? Math.round((good.length / sc.length) * 100) : null, km: Math.round(in_.reduce((s, d) => s + (d.values.km || 0), 0)), top: rec };
  });
}

/* ---------- #293 Daten-Widget (Noah 19.10.2026 «2 beides»): km, weather, sleep, HRV at a glance ---------- */
/**
 * The values of the widget, observation only, each with your normal (the 30 days before) where it has one.
 * km: kmBook rows; health: healthDays rows; forecast: homeForecast() or null; today: YYYY-MM-DD.
 * rides (UI-Test T5): the rides as «Diese Woche» counts them (kmbook.js withStravaRides); when given, the km
 * of today and of 7 days come from them, so the tiles «Du heute» and «Velo diesen Monat» agree.
 * → { kmToday, kmWeek, weather: { min, max, rain } | null, sleepH, sleepNormal, hrv, hrvNormal, restingHr, restingNormal, day }
 * day: the day of the last health values (sleep belongs to the night before it).
 */
export function widgetValues({ km = [], rides: counted = null, health = [], forecast = null, today } = {}) {
  const week = lastDays(today, 7);
  const rides = counted ? counted.filter((r) => typeof r?.date === 'string').map((r) => ({ date: r.date.slice(0, 10), km: Number(r.km) || 0 })) : km.filter(isRide);
  const sum = (list) => Math.round(list.reduce((s, e) => s + Number(e.km), 0) * 10) / 10;
  const byDay = Object.fromEntries(health.filter((h) => h?.date).map((h) => [h.date, h]));
  const last = Object.keys(byDay).filter((d) => d <= today).sort().at(-1) ?? null;
  const sleepOf = (x) => (Number(x?.sleep?.asleepMin) > 0 ? x.sleep.asleepMin / 60 : null);
  const hrvOf = (x) => (Number.isFinite(x?.hrvMs) ? x.hrvMs : null);
  const restOf = (x) => (Number.isFinite(x?.restingHr) ? x.restingHr : null);
  // Noah 26.10.2026 «1a»: a value today does not have yet (Fitbit often sends the night later) shows its
  // last day within 7 days, with that day, like the Körperwerte tile (home/vitals.js)
  const latest = (pick) => {
    for (const d of lastDays(today, 7).reverse()) if (byDay[d] && pick(byDay[d]) != null) return d;
    return null;
  };
  // your normal: the 30 days before the day the value is from
  const norm = (pick, day) => {
    if (!day) return null;
    const xs = lastDays(day, 31)
      .slice(0, -1)
      .map((d) => (byDay[d] ? pick(byDay[d]) : null))
      .filter((v) => Number.isFinite(v));
    return xs.length >= 7 ? r1(mean(xs)) : null;
  };
  const sleepDay = latest(sleepOf);
  const hrvDay = latest(hrvOf);
  const restingDay = latest(restOf);
  const w = forecast?.days?.find((d) => d.date === today) ?? null;
  return {
    kmToday: sum(rides.filter((e) => e.date === today)),
    kmWeek: sum(rides.filter((e) => week.includes(e.date))),
    weather: w ? { min: Math.round(w.min), max: Math.round(w.max), rain: w.rain ?? null } : null,
    sleepH: sleepDay ? r1(sleepOf(byDay[sleepDay])) : null,
    sleepNormal: norm(sleepOf, sleepDay),
    sleepDay,
    hrv: hrvDay ? Math.round(byDay[hrvDay].hrvMs) : null,
    hrvNormal: norm(hrvOf, hrvDay),
    hrvDay,
    restingHr: restingDay ? Math.round(byDay[restingDay].restingHr) : null,
    restingNormal: norm(restOf, restingDay),
    restingDay,
    day: last,
  };
}

/* ---------- #79 Fotoalbum (Noah 19.10.2026 «3a»): your own photo greets you on Heute ---------- */
/** The album photos live in the photos table (in every backup) with album: true and no bike. */
export const albumOf = (photos = []) => photos.filter((p) => p?.album && p.data).sort((a, b) => String(a.addedAt ?? '').localeCompare(String(b.addedAt ?? '')));
/** The photo of this visit: a different one each time the app opens (r: a number 0–1, fixed per visit). */
export function greetPhoto(album = [], r = 0) {
  // Paket P8 «Fotoalbum»: a photo switched off («Auf Heute zeigen» off) never greets
  const list = album.filter((p) => p?.greet !== false);
  return list.length ? list[Math.min(list.length - 1, Math.floor(r * list.length))] : null;
}
/** settings: { greet: true } — the photo on Heute can be switched off. */
export const ALBUM_KEY = 'album';
export const albumCfgOf = (v) => ({ greet: !(v && typeof v === 'object' && v.greet === false) });

/* ---------- Ideen 19.10.2026 (Noah «1a 2a 3a»): Glas der guten Momente, Wetter und gute Tage, Rezept am Morgen ---------- */
/**
 * Glas der guten Momente: your notes to «Wofür bist du dankbar?» and your sentences to «Worauf bist du
 * stolz?», newest first. → [{ id, day, text, kind: 'thanks' | 'proud' }]
 */
export function jarNotes(rows = []) {
  const out = [];
  for (const r of rows) {
    const text = r.qid === 'achtsamkeit.dank' ? r.note : r.qid === 'erreicht.stolz' ? (typeof r.value === 'string' ? r.value : r.note) : null;
    if (!String(text ?? '').trim()) continue;
    out.push({ id: r.id ?? `${r.qid}-${r.day}`, day: r.day, text: String(text).trim().slice(0, 300), kind: r.qid === 'achtsamkeit.dank' ? 'thanks' : 'proud' });
  }
  return out.sort((a, b) => b.day.localeCompare(a.day));
}
/** n notes from the jar, a different choice for another seed (0–1). */
export function jarPick(notes = [], seed = 0, n = 3) {
  if (notes.length <= n) return notes;
  const start = Math.floor(seed * notes.length);
  const step = Math.max(1, Math.floor(notes.length / n));
  const out = [];
  for (let i = 0; out.length < n && i < notes.length * 2; i++) {
    const x = notes[(start + i * step) % notes.length];
    if (!out.includes(x)) out.push(x);
  }
  return out;
}
/** A low day: today's battery or day score is 4 or less (1–10). null when nothing is known yet. */
export function lowToday(rows = [], today) {
  const vals = ['erholung.akku', 'erreicht.zufrieden', 'spass.stimmung'].map((q) => dailyValues(rows, q)[today]).filter((v) => v != null);
  return vals.length ? Math.min(...vals) <= 4 : null;
}

/**
 * Wetter und gute Tage: the past days at home from Open-Meteo (free, no key; past_days on the forecast
 * address) → [{ date, max, rainMm }]. Cached once a day in meta (never in a backup).
 */
export const PAST_WX_KEY = 'wohl.pastWeather';
export const PAST_WX_DAYS = 60;
export async function fetchPastWeather(place, fetcher = fetch) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&daily=temperature_2m_max,precipitation_sum&timezone=auto&past_days=${PAST_WX_DAYS}&forecast_days=1`;
  const res = await fetcher(url);
  if (!res.ok) throw new Error(`weather ${res.status}`);
  const { daily = {} } = await res.json();
  return (daily.time ?? []).map((date, n) => ({ date, max: Number.isFinite(daily.temperature_2m_max?.[n]) ? daily.temperature_2m_max[n] : null, rainMm: Number.isFinite(daily.precipitation_sum?.[n]) ? daily.precipitation_sum[n] : null }));
}
/** The weather groups (English keys for t()). */
export const WX_GROUPS = [
  { key: 'dry', label: 'dry days', test: (w) => (w.rainMm == null ? null : w.rainMm < 1) },
  { key: 'rain', label: 'rainy days', test: (w) => (w.rainMm == null ? null : w.rainMm >= 1) },
  { key: 'cold', label: 'under 10 °C', test: (w) => (w.max == null ? null : w.max < 10) },
  { key: 'mild', label: '10–20 °C', test: (w) => (w.max == null ? null : w.max >= 10 && w.max <= 20) },
  { key: 'warm', label: 'over 20 °C', test: (w) => (w.max == null ? null : w.max > 20) },
];
/**
 * The day score per weather group: [{ key, label, mean, n }] for groups with at least `min` days, and
 * the best group. The weather of a day: Open-Meteo, else your answer «Welches Wetter hattest du im
 * Gesicht?» (sun → dry, rain or snow → rain). → { groups, best, all (mean of all days with weather) }
 */
export function weatherDays(data = [], wx = [], rows = [], { min = MIN_DAYS - 1 } = {}) {
  const byDay = Object.fromEntries(wx.filter((w) => w?.date).map((w) => [w.date, w]));
  const said = {};
  for (const r of rows) if (r.qid === 'natur.wetter' && r.value != null && !(r.day in said)) said[r.day] = Array.isArray(r.value) ? r.value : [r.value];
  const wOf = (day) => byDay[day] ?? (said[day] ? { rainMm: said[day].some((k) => k === 'rain' || k === 'snow') ? 5 : said[day].includes('sun') ? 0 : null, max: null } : null);
  const known = data.filter((d) => d.score != null && wOf(d.day));
  const groups = WX_GROUPS.map((g) => {
    const xs = known.filter((d) => g.test(wOf(d.day)) === true).map((d) => d.score);
    return { key: g.key, label: g.label, mean: r1(mean(xs)), n: xs.length };
  }).filter((g) => g.n >= min);
  const best = groups.length >= 2 ? [...groups].sort((a, b) => b.mean - a.mean || b.n - a.n)[0] : null;
  return { groups, best, all: r1(mean(known.map((d) => d.score))), n: known.length };
}

/** Rezept am Morgen: which balance category a fact belongs to (for the 5/20/60 versions). */
export const FACT_CAT = { outside: 'nature', ride: 'sport', friends: 'friends', moment: 'mind', sleep: 'rest', laugh: 'fun', goal: 'goals', food: 'rest', alone: 'rest', replan: 'goals' };
/**
 * On a morning with a low battery (1–10, 4 or less): one part of your good days as a suggestion, in the
 * chosen minutes. → { fact, cat, text } or null (battery fine or unknown, or no recipe yet).
 */
export function morningTip(data = [], rows = [], today, minutes = 20) {
  const akku = dailyValues(rows, 'erholung.akku')[today] ?? dailyValues(rows, 'erholung.schlaf')[today];
  if (akku == null || akku > 4) return null;
  const parts = [...helps(data).map((h) => h.key), ...goodRecipes(data).map((r) => r.key)].filter((k) => FACT_CAT[k]);
  const fact = parts[0];
  if (!fact) return null;
  return { fact, cat: FACT_CAT[fact], text: shortOf(FACT_CAT[fact], minutes), akku };
}

/* ---------- Routine «Das tut mir gut» and your good days (Noah 19.10.2026 «5a») ---------- */
/**
 * For each item of the routine: the day score on the days it was done against the days of the item it was
 * not (from MIN_BOTH days each), and the answers to «Did it do you good?» (2 yes, 1 a little, 0 no).
 * isFor/doneOf come from routine.js (passed in, so this file stays free of the routine record).
 * → [{ id, item, withScore, without, nWith, nWithout, diff, carries, felt: { yes, little, no, n } }], items with
 * a comparison first (largest difference first), then the ones with answers only. Observation only.
 */
export function routineCarry(items = [], data = [], { isFor, doneOf, feltOf } = {}) {
  const out = [];
  for (const item of items) {
    const days = data.filter((d) => d.score != null && isFor(item, d.day));
    const on = days.filter((d) => doneOf(item, d.day)).map((d) => d.score);
    const off = days.filter((d) => !doneOf(item, d.day)).map((d) => d.score);
    const felt = { yes: 0, little: 0, no: 0, n: 0 };
    for (const d of data) {
      const v = feltOf(item, d.day);
      if (v == null) continue;
      felt.n++;
      if (v === 2) felt.yes++;
      else if (v === 1) felt.little++;
      else felt.no++;
    }
    const both = on.length >= MIN_BOTH && off.length >= MIN_BOTH;
    const diff = both ? mean(on) - mean(off) : null;
    if (!both && !felt.n) continue;
    out.push({ id: item.id, item, withScore: both ? r1(mean(on)) : null, without: both ? r1(mean(off)) : null, nWith: on.length, nWithout: off.length, diff: diff == null ? null : r1(diff), carries: diff != null && diff >= MIN_DIFF, felt });
  }
  return out.sort((a, b) => (b.diff ?? -99) - (a.diff ?? -99));
}
