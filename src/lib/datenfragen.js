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
/** After this many skips of a rule's question (on different days, never answered between), the window offers to ask less often. */
export const SKIP_OFFER = 3;
/** «Ask less often» makes the gap of that rule this many days. */
export const FEWER_GAP = 7;
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
/** Tennis: a game of at least this many minutes is asked about the day after; a missed court time counts this many days back. */
export const GAME_MIN = 30;
export const SLOT_DAYS = 2;
/** Rain chance (percent) from which a day counts as a rainy day; below RAIN_DRY and under 1 mm it counts as dry. */
export const RAIN_PCT = 60;
export const RAIN_DRY = 30;
/** Warm enough for an evening outside (degrees, the day's high). */
export const WARM_C = 15;
/** The evening for «nothing planned»: from 17:00 to 22:00. */
export const EVENING = [17, 22];

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
  'daten.spiel': {
    id: 'daten.spiel',
    area: 'sport',
    text: 'How was the game yesterday? What worked, what did not?',
    form: {
      kind: 'chips',
      multi: true,
      note: true,
      options: [chip('rhythm', 'Good rhythm'), chip('serve', 'Serve worked'), chip('legs', 'Legs were fast'), chip('focus', 'Lost focus'), chip('heavy', 'Heavy legs'), chip('fun', 'Great fun')],
    },
    every: { kind: 'daily', time: '07:00' },
    src: ['hand'],
    data: true,
    rule: 'spiel',
  },
  'daten.platz': {
    id: 'daten.platz',
    area: 'sport',
    text: 'What got in the way of the court time?',
    form: {
      kind: 'chips',
      multi: true,
      note: true,
      options: [chip('work', 'Work came up'), chip('tired', 'Tired'), chip('weather', 'Weather'), chip('cancelled', 'Cancelled by the other'), chip('court', 'No court free'), chip('nothing', 'Nothing special')],
    },
    every: { kind: 'daily', time: '07:00' },
    src: ['hand'],
    data: true,
    rule: 'platz',
  },
  'daten.grau': {
    id: 'daten.grau',
    area: 'spass',
    text: 'What does you good on grey days?',
    form: {
      kind: 'chips',
      multi: true,
      note: true,
      options: [chip('walk', 'A short walk'), chip('people', 'See someone'), chip('cook', 'Cook something'), chip('music', 'Music'), chip('rest', 'Rest'), chip('nothing', 'Nothing special')],
    },
    every: { kind: 'daily', time: '07:00' },
    src: ['hand'],
    data: true,
    rule: 'grau',
  },
  'daten.draussen': {
    id: 'daten.draussen',
    area: 'spass',
    text: 'Anything planned outside?',
    form: {
      kind: 'chips',
      multi: true,
      note: true,
      options: [chip('ride', 'A ride'), chip('run', 'A run'), chip('tennis', 'Tennis'), chip('walk', 'A walk'), chip('people', 'See someone'), chip('nothing', 'Nothing planned')],
    },
    every: { kind: 'daily', time: '07:00' },
    src: ['hand'],
    data: true,
    rule: 'draussen',
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
  {
    id: 'spiel',
    qid: 'daten.spiel',
    title: 'After a tennis game',
    about: 'Asks the day after a tennis game you noted (at least {n} minutes).',
    vars: { n: GAME_MIN },
    param: { key: 'n', min: 15, max: 180, step: 15, def: GAME_MIN, label: 'Game of at least (minutes)' },
  },
  {
    id: 'platz',
    qid: 'daten.platz',
    title: 'A court time that did not happen',
    about: 'Asks when you noted «not played» for a planned court time in the last {n} days.',
    vars: { n: SLOT_DAYS },
    param: { key: 'n', min: 1, max: 7, step: 1, def: SLOT_DAYS, label: 'Looking back (days)' },
  },
  {
    id: 'grau',
    qid: 'daten.grau',
    title: 'Grey day and a low mood',
    about: 'Asks on a day with a rain chance of at least {n} percent when your latest mood was clearly below your usual.',
    vars: { n: RAIN_PCT },
    param: { key: 'n', min: 30, max: 90, step: 10, def: RAIN_PCT, label: 'Rain chance from (percent)' },
  },
  {
    id: 'draussen',
    qid: 'daten.draussen',
    title: 'Fine weather and a free evening',
    about: 'Asks on a dry day of at least {n} degrees when your calendar has nothing from 17 to 22 o\'clock.',
    vars: { n: WARM_C },
    param: { key: 'n', min: 8, max: 28, step: 1, def: WARM_C, label: 'Warm from (degrees)' },
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
  const gaps = {};
  const skips = {};
  for (const r of RULES) {
    const v = Number(value?.vals?.[r.id]);
    if (value?.vals?.[r.id] != null && Number.isFinite(v) && v >= r.param.min && v <= r.param.max && v !== r.param.def) vals[r.id] = v;
    const t = typeof value?.texts?.[r.id] === 'string' ? value.texts[r.id].trim().slice(0, 140) : '';
    if (t && t !== DATA_QUESTIONS[r.qid].text) texts[r.id] = t;
    const g = Number(value?.gaps?.[r.id]);
    if (value?.gaps?.[r.id] != null && Number.isFinite(g) && g > GAP_DAYS && g <= 30) gaps[r.id] = Math.round(g);
    const k = value?.skips?.[r.id];
    const n = Number(k?.n);
    if (Number.isFinite(n) && n >= 1 && /^\d{4}-\d{2}-\d{2}$/.test(k?.day ?? '')) skips[r.id] = { n: Math.min(99, Math.round(n)), day: k.day };
  }
  return { off: [...new Set(off)], vals, texts, gaps, skips };
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
  const { [id]: _g, ...gaps } = cur.gaps;
  const { [id]: _s, ...skips } = cur.skips;
  return { ...cur, vals, texts, gaps, skips };
}
/** Is a rule changed from the standard (threshold or text)? */
export const ruleChanged = (value, id) => ruleVal(value, id) !== RULE[id].param.def || ruleText(value, id) != null || ruleGap(value, id) !== GAP_DAYS;

/** Days between two asks of a rule: GAP_DAYS, or longer after «Ask less often». */
export const ruleGap = (value, id) => dataOf(value).gaps[id] ?? GAP_DAYS;
/** Set the gap of a rule (GAP_DAYS or less: back to the default) → the new settings value. */
export function setGap(value, id, days) {
  const cur = dataOf(value);
  const { [id]: _, ...rest } = cur.gaps;
  return dataOf({ ...cur, gaps: days > GAP_DAYS ? { ...rest, [id]: days } : rest });
}
/** The person skipped the question of a rule today → the new settings value (counted once a day). */
export function noteSkip(value, id, today) {
  const cur = dataOf(value);
  const k = cur.skips[id];
  if (k?.day === today) return cur;
  return dataOf({ ...cur, skips: { ...cur.skips, [id]: { n: (k?.n ?? 0) + 1, day: today } } });
}
/** An answer (or «keep it as it is») ends the count of skips of a rule → the new settings value. */
export function clearSkips(value, id) {
  const cur = dataOf(value);
  const { [id]: _, ...skips } = cur.skips;
  return { ...cur, skips };
}
/** Skipped often enough that the window offers to ask less often (and the rule is not yet asking less often)? */
export const fewerOffer = (value, id) => (dataOf(value).skips[id]?.n ?? 0) >= SKIP_OFFER && ruleGap(value, id) === GAP_DAYS;

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

const TENNIS = 'act:tennis';
/** The longest tennis game noted yesterday of at least `min` minutes: { min } or null. */
export function spielHit(sport = [], today, min = GAME_MIN) {
  const yesterday = addDays(today, -1);
  const g = sport.filter((x) => x?.sport === TENNIS && x.kind === 'played' && x.day === yesterday && (fin(Number(x.min)) ?? 0) >= min).sort((a, b) => b.min - a.min)[0];
  return g ? { min: Math.round(g.min) } : null;
}
/** A planned court time answered «not played» within the last `days` days before today (and no game noted that day): { day } or null. */
export function platzHit(sport = [], today, days = SLOT_DAYS) {
  const from = addDays(today, -days);
  const played = new Set(sport.filter((x) => x?.sport === TENNIS && x.kind === 'played').map((x) => x.day));
  const miss = sport.filter((x) => x?.sport === TENNIS && x.kind === 'slot' && x.answer === 'skipped' && x.day >= from && x.day < today && !played.has(x.day)).sort((a, b) => b.day.localeCompare(a.day))[0];
  return miss ? { day: miss.day } : null;
}

/** The forecast day of today from the saved home forecast: { rainMm, rainPct, max } or null. */
const wxOf = (wx, today) => (wx && wx.date === today ? wx : null);
/** A rainy day (rain chance from `pct` or at least 5 mm) and the latest mood (today, else yesterday) clearly below the usual of the 30 days before: { pct, mood, usual } or null. */
export function grauHit(wx, answers = [], checks = [], today, pct = RAIN_PCT) {
  const w = wxOf(wx, today);
  if (!w) return null;
  const rainy = (fin(w.rainPct) ?? 0) >= pct || (fin(w.rainMm) ?? 0) >= 5;
  if (!rainy) return null;
  const by = moodByDay(answers, checks);
  const day = by[today] != null ? today : by[addDays(today, -1)] != null ? addDays(today, -1) : null;
  if (!day) return null;
  const base = [];
  for (let i = 1; i <= BASE_DAYS; i++) {
    const x = by[addDays(day, -i)];
    if (x != null) base.push(x);
  }
  if (base.length < MIN_BASE) return null;
  const usual = base.reduce((x, y) => x + y, 0) / base.length;
  if (by[day] > usual - MOOD_BELOW) return null;
  const r1 = (x) => Math.round(x * 10) / 10;
  return { mood: r1(by[day]), usual: r1(usual) };
}

/** Is a busy appointment in the evening (17–22, Europe/Zurich) of `day`? events: gEvents rows { start, end, allDay, busy }. */
export function eveningBusy(events = [], day) {
  const key = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(d);
    const get = (t) => parts.find((x) => x.type === t)?.value;
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
  };
  const from = `${day}T${String(EVENING[0]).padStart(2, '0')}:00`;
  const to = `${day}T${String(EVENING[1]).padStart(2, '0')}:00`;
  return events.some((e) => {
    if (!e || e.allDay || e.busy === false) return false;
    const st = key(e.start);
    if (!st) return false;
    const en = key(e.end ?? e.start) ?? st;
    return st < to && (en > from || (en === st && st >= from));
  });
}
/** A dry, warm day (at least `warm` degrees, under 1 mm and a rain chance under RAIN_DRY) and a free evening in a calendar that is in use: { max } or null. cal: { used, events }. */
export function draussenHit(wx, cal, today, warm = WARM_C) {
  const w = wxOf(wx, today);
  if (!w || !cal?.used) return null;
  const max = fin(w.max);
  if (max == null || max < warm) return null;
  if ((fin(w.rainMm) ?? 0) >= 1 || (fin(w.rainPct) ?? 0) >= RAIN_DRY) return null;
  if (eveningBusy(cal.events, today)) return null;
  return { max: Math.round(max) };
}

const WHY = {
  grau: 'Rain is likely today and your latest mood was {mood}, your usual is {usual}.',
  draussen: 'Dry and {max} degrees today, and nothing in your calendar this evening.',
  spiel: 'You noted a game of {min} minutes yesterday.',
  platz: 'You noted a planned court time as not played in the last days.',
  pause: 'Your last logged training was {n} days ago.',
  training: 'Yesterday you were on the move for {h} h {m} min.',
  ruhepuls: 'Your resting pulse today is {v}, your usual of the last 30 days is {normal}.',
  schlaf: 'You slept {h} h {m} min last night.',
  stimmung: 'Your mood was {a}, {b} and {c} on the last three days, your usual is {usual}.',
  stimmungN: 'Your mood on the last {days} days was {list}, your usual is {usual}.',
};
const HITS = {
  grau: ({ wx, answers, checks, today, val }) => grauHit(wx, answers, checks, today, val),
  draussen: ({ wx, cal, today, val }) => draussenHit(wx, cal, today, val),
  pause: ({ acts, sport, today, val }) => pauseHit(acts, sport, today, val),
  spiel: ({ sport, today, val }) => spielHit(sport, today, val),
  platz: ({ sport, today, val }) => platzHit(sport, today, val),
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
export function dataDue({ health = [], acts = [], sport = [], wx = null, cal = null, answers = [], checks = [], snooze = {}, cfg = null, today, slot = `${today}T07:00` } = {}) {
  if (!today) return [];
  const off = new Set(dataOf(cfg).off);
  const doneToday = new Set(answers.filter((a) => String(a?.qid ?? '').startsWith('daten.') && a.day === today).map((a) => a.qid)).size;
  const room = Math.max(0, MAX_PER_DAY - doneToday);
  // not two questions from data of the same group on a day (Noah 04.11.2026 «2a»): answered ones count
  const usedAreas = new Set(answers.filter((a) => String(a?.qid ?? '').startsWith('daten.') && a.day === today).map((a) => DATA_QUESTIONS[a.qid]?.area).filter(Boolean));
  // a question put away today (skipped, «Not today») keeps its group used as well
  for (const q of Object.values(DATA_QUESTIONS)) if (snooze?.[q.id] && dayOf(snooze[q.id]) >= today) usedAreas.add(q.area);
  const out = [];
  for (const rule of RULES) {
    if (out.length >= room) break;
    if (off.has(rule.id)) continue;
    const q = DATA_QUESTIONS[rule.qid];
    if (usedAreas.has(q.area)) continue;
    const since = addDays(today, -(ruleGap(cfg, rule.id) - 1));
    if (answers.some((a) => a?.qid === q.id && a.day >= since)) continue;
    const put = snooze?.[q.id];
    if (put && dayOf(put) >= today) continue;
    const hit = HITS[rule.id]({ health, acts, sport, wx, cal, answers, checks, today, val: ruleVal(cfg, rule.id) });
    if (!hit) continue;
    const own = ruleText(cfg, rule.id);
    out.push({ q: own ? { ...q, text: own, edited: true } : q, slot, last: slot, why: { text: rule.id === 'stimmung' && hit.days ? WHY.stimmungN : WHY[rule.id], vars: hit }, data: true, rule: rule.id, fewer: fewerOffer(cfg, rule.id) });
    usedAreas.add(q.area);
  }
  return out;
}
