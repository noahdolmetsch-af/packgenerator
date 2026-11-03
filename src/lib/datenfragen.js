/**
 * «Fragen aus deinen Daten» (Noah 03.11.2026, thread «Brainstorme intelligenteren Tagescheck», «1b 2a 3a 4a 5a»):
 * when a value of the day stands out, the window of the round asks ONE open question about it and says why
 * («Warum frage ich das?»). Step 1: the rule engine and the first rule, the resting pulse above your usual.
 *
 * - Everything is calculated on this device from the Fitbit days (healthDays) and the answers; nothing leaves it.
 * - Observation only: the question never judges and never names a cause; the answer is a plain chip or a sentence.
 * - A suggestion: every rule has a switch (Ich › Deine Abfragen › «Fragen aus deinen Daten», settings DATA_KEY).
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
};

/** The rules, in order. title/about are English keys for t() (about has {n}). */
export const RULES = [
  {
    id: 'ruhepuls',
    qid: 'daten.ruhepuls',
    title: 'Resting pulse above your usual',
    about: 'Asks when your resting pulse today is at least {n} above your usual of the last 30 days.',
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

/** The stored settings made safe: { off: [ids of known rules] }. */
export function dataOf(value) {
  const off = Array.isArray(value?.off) ? value.off.filter((id) => RULES.some((r) => r.id === id)) : [];
  return { off: [...new Set(off)] };
}
/** Is a rule on? */
export const ruleOn = (value, id) => !dataOf(value).off.includes(id);
/** Switch a rule on or off → the new settings value. */
export function setRule(value, id, on) {
  const cur = dataOf(value).off;
  return { off: on ? cur.filter((x) => x !== id) : [...new Set([...cur, id])] };
}

/** The resting pulse today against the median of the days before: { v, normal } when it stands out, else null. */
export function ruhepulsHit(health = [], today) {
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
  return v >= normal + RHR_ABOVE ? { v: Math.round(v), normal: Math.round(normal) } : null;
}

const WHY = { ruhepuls: 'Your resting pulse today is {v}, your usual of the last 30 days is {normal}.' };
const HITS = { ruhepuls: ({ health, today }) => ruhepulsHit(health, today) };

/**
 * The questions from data that are due today: [{ q, slot, last, why: { text, vars }, data: true }].
 * health: healthDays rows; answers: rows { qid, day }; snooze: { [qid]: stamp }; cfg: the DATA_KEY value;
 * slot: the stamp they show under (the morning round). A question put away today (skip, «Heute nicht», folded
 * under «Show more») stays away until tomorrow.
 */
export function dataDue({ health = [], answers = [], snooze = {}, cfg = null, today, slot = `${today}T07:00` } = {}) {
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
    const hit = HITS[rule.id]({ health, today });
    if (!hit) continue;
    out.push({ q, slot, last: slot, why: { text: WHY[rule.id], vars: hit }, data: true });
  }
  return out;
}
