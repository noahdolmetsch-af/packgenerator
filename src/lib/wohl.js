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
  const alone = pick(rows, 'wohl.allein');
  const replan = pick(rows, 'wohl.umplanen');
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
      replan: yes(replan[day]),
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
