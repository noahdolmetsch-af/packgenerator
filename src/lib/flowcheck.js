/**
 * v0.51.0 «Im Flow»: the daily check (Noah 10a). Three fixed questions (sleep, energy, mood) and a
 * fourth that rotates through a pool of ten, taken in turn (each one every ten days); the pool is
 * editable. One tap per question on a scale 1–10, a dot marks yesterday's answer.
 * A check: { day, sleep, energy, mood, q (pool id of the 4th), extra }  (table flowChecks).
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

/** A check made whole (each answer 1–10 or null). */
export function checkOf(c, day) {
  const v = (x) => (Number.isInteger(Number(x)) && Number(x) >= 1 && Number(x) <= 10 ? Number(x) : null);
  return { day: c?.day ?? day, sleep: v(c?.sleep), energy: v(c?.energy), mood: v(c?.mood), q: c?.q ?? null, extra: v(c?.extra) };
}
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
