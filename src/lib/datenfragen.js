/**
 * «Fragen aus deinen Daten» (Noah 03.11.2026, thread «Brainstorme intelligenteren Tagescheck», «1b 2a 3a 4a 5a»):
 * when a value of the day stands out, the window of the round asks ONE open question about it and says why
 * («Warum frage ich das?»). Step 1: the rule engine and the first rule, the resting pulse above your usual.
 *
 * - Everything is calculated on this device from the Fitbit days (healthDays) and the answers; nothing leaves it.
 * - Observation only: the question never judges and never names a cause; the answer is a plain chip or a sentence.
 * - A suggestion: every rule has a switch, a threshold and its own question text, all changeable (Ich › Deine Abfragen ›
 *   «Fragen aus deinen Daten», settings DATA_KEY: { off, vals, texts }); «Zurück zum Standard» per rule.
 * - Up to MAX_PER_DAY a day (Noah «1b»); a rule asks again earliest GAP_DAYS days after the last answer.
 * - «Überspringen» and «Heute nicht» work as for every question (the snooze record, by question id).
 *
 * Pure functions, no database and no clock (days 'YYYY-MM-DD'); tested in tests/datenfragen.test.js.
 * Does not import abfragen.js (abfragen.js imports the questions from here for the history).
 */

/** The settings record: { off: [rule ids] }. */
export const DATA_KEY = 'datenfragen';
/** At most this many questions from data a day, answered ones included (Noah 03.11.2026 «1b»). */
export const MAX_PER_DAY = 3;
/** A rule asks again earliest this many days after its last answer. */
export const GAP_DAYS = 3;
/** The resting pulse: this far above the median of the days before counts as «stands out» (same as erkenntnisse.js). */
export const RHR_ABOVE = 5;
/** The days before today that make the «usual», and the least days with a value needed. */
export const BASE_DAYS = 30;
export const MIN_BASE = 7;
/** Sleep: less than this many minutes asleep in the night counts as short. */
export const SHORT_SLEEP_MIN = 360;
/** Mood: this many days in a row, each this far below your usual. */
export const MOOD_DAYS = 3;
export const MOOD_BELOW = 1;
/** A long day: moving time of yesterday's Strava activities together, in hours (Noah 03.11.2026, step 2). */
export const LONG_DAY_H = 3;
/** A pause: this many days without any training logged (Strava or tennis). The activities are read this many days back. */
export const PAUSE_DAYS = 4;
export const ACT_DAYS = 40;

const chip = (key, label) => ({ key, label: `${label}|data` });

/**
 * The questions from data, in the shape of abfragen.js questions (area, form, src) so that answers, history and
 * the window treat them like the others. Not part of the list of the page «Deine Abfragen» (QUESTIONS).
 */
export const DATA_QUESTIONS = {
  'daten.ruhepuls': {
    id: 'daten.ruhepuls',
    area: 'koerper',
    text: 'What did you do yesterday that throws you off so much today?',
    form: {
      kind: 'chips',
      multi: true,
      note: true,
      options: [chip('lateMeal', 'Ate late'), chip('alcohol', 'Alcohol'), chip('hard', 'Hard training'), chip('stress', 'Stress'), chip('shortSleep', 'Little sleep'), chip('nothing', 'Nothing special')],
    },
    every: { kind: 'daily', time: '07:00' },
    src: ['fitbit'],
    data: true,
    rule: 'ruhepuls',
  },
  'daten.schlaf': {
    id: 'daten.schlaf',
    area: 'erholung',
    text: 'What kept you awake last night?',
    form: {
      kind: 'chips',
      multi: true,
      note: true,
      options: [chip('thoughts', 'Thoughts'), chip('late', 'Went to bed late'), chip('noise', 'Noise or light'), chip('caffeine', 'Coffee or tea late'), chip('body', 'Body'), chip('nothing', 'Nothing special')],
    },
    every: { kind: 'daily', time: '07:00' },
    src: ['fitbit'],
    data: true,
    rule: 'schlaf',
  },
  'daten.stimmung': {
    id: 'daten.stimmung',
    area: 'spass',
    text: 'What would do you good today?',
    form: {
      kind: 'chips',
      multi: true,
      note: true,
      options: [chip('walk', 'A walk'), chip('ride', 'A ride'), chip('people', 'Meet someone'), chip('quiet', 'Quiet time'), chip('early', 'Early to bed'), chip('nothing', 'Nothing special')],
    },
    every: { kind: 'daily', time: '07:00' },
    src: ['hand'],
    data: true,
    rule: 'stimmung',
  },
  'daten.training': {
    id: 'daten.training',
    area: 'sport',
    text: 'How do your legs feel after yesterday?',
    form: {
      kind: 'chips',
      multi: true,
      note: true,
      options: [chip('fresh', 'Fresh'), chip('heavy', 'Heavy legs'), chip('stiff', 'Stiff'), chip('tired', 'Tired'), chip('hungry', 'Very hungry'), chip('nothing', 'Nothing special')],
    },
    every: { kind: 'daily', time: '07:00' },
    src: ['strava'],
    data: true,
    rule: 'training',
  },
  'daten.pause': {
    id: 'daten.pause',
    area: 'sport',
    text: 'What kept you from training lately?',
    form: {
      kind: 'chips',
      multi: true,
      note: true,
      options: [chip('noTime', 'No time'), chip('tired', 'Tired'), chip('weather', 'Weather'), chip('wantedBreak', 'Wanted a break'), chip('away', 'Away'), chip('nothing', 'Nothing special')],
    },
    every: { kind: 'daily', time: '07:00' },
    src: ['hand'],
    data: true,
    rule: 'pause',
  },
};

/** The rules, in order. title/about are English keys for t() (about has {n}). */
export const RULES = [
  {
    id: 'ruhepuls',
    qid: 'daten.ruhepuls',
    title: 'Resting pulse above your usual',
    about: 'Asks when your resting pulse today is at least {n} above your usual of the last 30 days.',
    vars: { n: RHR_ABOVE },
    param: { key: 'n', min: 3, max: 15, step: 1, def: RHR_ABOVE, label: 'Above your usual by (beats per minute)' },
  },
  {
    id: 'schlaf',
    qid: 'daten.schlaf',
    title: 'Short night',
    about: 'Asks when you slept less than {n} hours last night.',
    vars: { n: SHORT_SLEEP_MIN / 60 },
    param: { key: 'n', min: 3, max: 8, step: 0.5, def: SHORT_SLEEP_MIN / 60, label: 'Less than (hours asleep)' },
  },
  {
    id: 'stimmung',
    qid: 'daten.stimmung',
    title: 'Low mood for days',
    about: 'Asks when your mood was clearly below your usual {n} days in a row.',
    vars: { n: MOOD_DAYS },
    param: { key: 'n', min: 2, max: 7, step: 1, def: MOOD_DAYS, label: 'Days in a row' },
  },
  {
    id: 'training',
    qid: 'daten.training',
    title: 'Long day yesterday',
    about: 'Asks when yesterday\'s Strava activities together took at least {n} hours.',
    vars: { n: LONG_DAY_H },
    param: { key: 'n', min: 1, max: 8, step: 0.5, def: LONG_DAY_H, label: 'At least (hours on the move)' },
  },
  {
    id: 'pause',
    qid: 'daten.pause',
    title: 'A pause from training',
    about: 'Asks when you have logged no training for {n} days (Strava or tennis).',
    vars: { n: PAUSE_DAYS },
    param: { key: 'n', min: 2, max: 14, step: 1, def: PAUSE_DAYS, label: 'Days without training' },
  },
];

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const addDays = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const dayOf = (stamp) => String(stamp ?? '').slice(0, 10);

/** The ids of the rules. */
const RULE = Object.fromEntries(RULES.map((r) => [r.id, r]));

/**
 * The stored settings made safe: { off: [rule ids], vals: { [id]: number within its limits }, texts: { [id]: own question text } }.
 * A threshold outside its limits or a text that is empty or the default is left out (the default counts).
 */
export function dataOf(value) {
  const off = Array.isArray(value?.off) ? value.off.filter((id) => RULE[id]) : [];
  const vals = {};
  const texts = {};
  for (const r of RULES) {
    const v = Number(value?.vals?.[r.id]);
    if (value?.vals?.[r.id] != null && Number.isFinite(v) && v >= r.param.min && v <= r.param.max && v !== r.param.def) vals[r.id] = v;
    const t = typeof value?.texts?.[r.id] === 'string' ? value.texts[r.id].trim().slice(0, 140) : '';
    if (t && t !== DATA_QUESTIONS[r.qid].text) texts[r.id] = t;
  }
  return { off: [...new Set(off)], vals, texts };
}
/** Is a rule on? */
export const ruleOn = (value, id) => !dataOf(value).off.includes(id);
/** Switch a rule on or off → the new settings value (the rest kept). */
export function setRule(value, id, on) {
  const cur = dataOf(value);
  return { ...cur, off: on ? cur.off.filter((x) => x !== id) : [...new Set([...cur.off, id])] };
}
/** The threshold of a rule as set, else its default. */
export const ruleVal = (value, id) => dataOf(value).vals[id] ?? RULE[id]?.param.def;
/** Set the threshold (outside its limits or the default: back to the default) → the new settings value. */
export function setVal(value, id, v) {
  const cur = dataOf(value);
  const { [id]: _, ...rest } = cur.vals;
  return dataOf({ ...cur, vals: v == null || v === '' ? rest : { ...rest, [id]: Number(v) } });
}
/** The question text of a rule as set (null: the default text). */
export const ruleText = (value, id) => dataOf(value).texts[id] ?? null;
/** Set the question text (empty or the default: back to the default) → the new settings value. */
export function setText(value, id, text) {
  const cur = dataOf(value);
  const { [id]: _, ...rest } = cur.texts;
  return dataOf({ ...cur, texts: { ...rest, [id]: text } });
}
/** One rule back to the standard: threshold and text (the switch stays) → the new settings value. */
export function resetRule(value, id) {
  const cur = dataOf(value);
  const { [id]: _v, ...vals } = cur.vals;
  const { [id]: _t, ...texts } = cur.texts;
  return { ...cur, vals, texts };
}
/** Is a rule changed from the standard (threshold or text)? */
export const ruleChanged = (value, id) => ruleVal(value, id) !== RULE[id].param.def || ruleText(value, id) != null;

/** The resting pulse today against the median of the days before: { v, normal } when it stands out, else null. */
export function ruhepulsHit(health = [], today, above = RHR_ABOVE) {
  const by = {};
  for (const r of health) if (r?.date && fin(r.restingHr) != null) by[r.date] = r.restingHr;
  const v = by[today];
  if (v == null) return null;
  const base = [];
  for (let i = 1; i <= BASE_DAYS; i++) {
    const x = by[addDays(today, -i)];
    if (x != null) base.push(x);
  }
  if (base.length < MIN_BASE) return null;
  const normal = median(base);
  return v >= normal + above ? { v: Math.round(v), normal: Math.round(normal) } : null;
}

/** The night ending today: { h, m } when it was shorter than SHORT_SLEEP_MIN, else null (no value: null). */
export function schlafHit(health = [], today, hours = SHORT_SLEEP_MIN / 60) {
  const row = health.find((r) => r?.date === today);
  const min = fin(row?.sleep?.asleepMin);
  if (min == null || min <= 0 || min >= hours * 60) return null;
  return { h: Math.floor(min / 60), m: Math.round(min % 60) };
}

/** The mood of every day from the answers to «How is your mood?» (spass.stimmung) and the old daily check, 1–10. */
export function moodByDay(answers = [], checks = []) {
  const all = {};
  const put = (day, v) => {
    if (day && typeof v === 'number' && v >= 1 && v <= 10) (all[day] ??= []).push(v);
  };
  for (const a of answers) if (a?.qid === 'spass.stimmung') put(a.day, a.value);
  for (const c of checks) put(c?.day, c?.mood);
  return Object.fromEntries(Object.entries(all).map(([d, l]) => [d, l.reduce((x, y) => x + y, 0) / l.length]));
}
/** Mood below the usual (mean of the 30 days before) by MOOD_BELOW or more on each of the last MOOD_DAYS days: { days: [values], usual } or null. */
export function stimmungHit(answers = [], checks = [], today, days = MOOD_DAYS) {
  const by = moodByDay(answers, checks);
  const recent = Array.from({ length: days }, (_, i) => addDays(today, i - days + 1));
  if (recent.some((d) => by[d] == null)) return null;
  const base = [];
  for (let i = days; i < days + BASE_DAYS; i++) {
    const x = by[addDays(today, -i)];
    if (x != null) base.push(x);
  }
  if (base.length < MIN_BASE) return null;
  const usual = base.reduce((x, y) => x + y, 0) / base.length;
  const vals = recent.map((d) => by[d]);
  if (!vals.every((v) => v <= usual - MOOD_BELOW)) return null;
  const r1 = (x) => Math.round(x * 10) / 10;
  return days === 3 ? { a: r1(vals[0]), b: r1(vals[1]), c: r1(vals[2]), usual: r1(usual) } : { days, list: vals.map(r1).join(', '), usual: r1(usual) };
}

/** Yesterday's activities (Strava) together: { h, m } when the moving time is at least `hours`, else null. */
export function trainingHit(acts = [], today, hours = LONG_DAY_H) {
  const y = addDays(today, -1);
  const sec = acts.filter((a) => a?.day === y).reduce((n, a) => n + (fin(a.movingS) > 0 ? a.movingS : 0), 0);
  if (sec <= 0 || sec < hours * 3600) return null;
  const min = Math.round(sec / 60);
  return { h: Math.floor(min / 60), m: min % 60 };
}

/** The days with any training logged: Strava activities and tennis played or taught (sport items). */
export function trainingDays(acts = [], sport = []) {
  const days = new Set();
  for (const a of acts) if (a?.day) days.add(a.day);
  for (const x of sport) if (x?.day && x.sport === 'act:tennis' && (x.kind === 'played' || x.kind === 'taught')) days.add(x.day);
  return days;
}
/** No training for `days` days or more: { n } (days since the last one). Without any training in the days read there is nothing to count from: null. */
export function pauseHit(acts = [], sport = [], today, days = PAUSE_DAYS) {
  const last = [...trainingDays(acts, sport)].filter((d) => d <= today).sort().at(-1);
  if (!last) return null;
  let n = 0;
  while (addDays(last, n) < today) n++;
  return n >= days ? { n } : null;
}

const WHY = {
  pause: 'Your last logged training was {n} days ago.',
  training: 'Yesterday you were on the move for {h} h {m} min.',
  ruhepuls: 'Your resting pulse today is {v}, your usual of the last 30 days is {normal}.',
  schlaf: 'You slept {h} h {m} min last night.',
  stimmung: 'Your mood was {a}, {b} and {c} on the last three days, your usual is {usual}.',
  stimmungN: 'Your mood on the last {days} days was {list}, your usual is {usual}.',
};
const HITS = {
  pause: ({ acts, sport, today, val }) => pauseHit(acts, sport, today, val),
  training: ({ acts, today, val }) => trainingHit(acts, today, val),
  ruhepuls: ({ health, today, val }) => ruhepulsHit(health, today, val),
  schlaf: ({ health, today, val }) => schlafHit(health, today, val),
  stimmung: ({ answers, checks, today, val }) => stimmungHit(answers, checks, today, val),
};

/**
 * The questions from data that are due today: [{ q, slot, last, why: { text, vars }, data: true }].
 * health: healthDays rows; acts: Strava activities { day, movingS }; sport: sport items { sport, kind, day }; answers: rows { qid, day, value }; checks: the old daily checks { day, mood }; snooze: { [qid]: stamp }; cfg: the DATA_KEY value;
 * slot: the stamp they show under (the morning round). A question put away today (skip, «Heute nicht», folded
 * under «Show more») stays away until tomorrow.
 */
export function dataDue({ health = [], acts = [], sport = [], answers = [], checks = [], snooze = {}, cfg = null, today, slot = `${today}T07:00` } = {}) {
  if (!today) return [];
  const off = new Set(dataOf(cfg).off);
  const doneToday = new Set(answers.filter((a) => String(a?.qid ?? '').startsWith('daten.') && a.day === today).map((a) => a.qid)).size;
  const room = Math.max(0, MAX_PER_DAY - doneToday);
  const since = addDays(today, -(GAP_DAYS - 1));
  const out = [];
  for (const rule of RULES) {
    if (out.length >= room) break;
    if (off.has(rule.id)) continue;
    const q = DATA_QUESTIONS[rule.qid];
    if (answers.some((a) => a?.qid === q.id && a.day >= since)) continue;
    const put = snooze?.[q.id];
    if (put && dayOf(put) >= today) continue;
    const hit = HITS[rule.id]({ health, acts, sport, answers, checks, today, val: ruleVal(cfg, rule.id) });
    if (!hit) continue;
    const own = ruleText(cfg, rule.id);
    out.push({ q: own ? { ...q, text: own, edited: true } : q, slot, last: slot, why: { text: rule.id === 'stimmung' && hit.days ? WHY.stimmungN : WHY[rule.id], vars: hit }, data: true, rule: rule.id });
  }
  return out;
}
