/**
 * AB «Deine Abfragen» (Noah 14.10.2026 00:06:40 «freigabe», AB1–AB6): ONE set of questions instead of
 * the daily check and the weekly weight question (SN2l). 50 playful questions in 10 areas, 31 of them
 * on at the start (00:06:33: the other 19 are off and can be switched on). Every question has its own
 * interval (several times a day, daily, weekly, monthly or off); own questions can be added and removed.
 * «Lustig gefragt, nüchtern gespeichert»: the question may sound funny, the stored value stays plain.
 * Health values are observation only (no judgement words, no colours for good or bad).
 *
 * Pure rules only (tests/abfragen.test.js); reading and writing in abdb.js.
 * A question: { id, area, text (English source, German in i18n/de/abfragen.js), was?, form, every, src }
 *   form:  { kind: 'scale' | 'chips' | 'yesno' | 'number' | 'text', style?: 'battery' | 'emoji',
 *            options?: [{ key, label, v? }], multi?, unit?, note? (a sentence besides the scale) }
 *   every: { kind: 'times', times: ['08:00', …] } | { kind: 'daily', time } | { kind: 'weekly', dow (0 = Sunday), time }
 *          | { kind: 'monthly', time } (the 1st of the month) | { kind: 'off' }
 *   src:   where the value comes from, quiet tags: 'hand', 'later' (Fitbit, later), 'open' (not checked
 *          yet, by hand until then), 'only' (only by hand possible), 'app'
 */
import { addDays } from './flow.js';
import { HELLO_QUESTIONS } from './home/hallo.js'; // HG1 2b: the two questions behind the greeting on Today
import { clockOf } from './dayclock.js';
/** v0.144.0 RE: the day starts at 11:00, the evening at 18:00 (the one day clock). */
const DAY_FROM = clockOf('day');
const EVENING_FROM = clockOf('evening');

/** The settings record of «Deine Abfragen»: { since, q: { [id]: { on, every, since } }, own: [question], rounds }. */
export const AB_KEY = 'abfragen';
/** The settings record of «Jetzt nicht»: { [id]: slot } (the time of the question that was put away). */
export const AB_SNOOZE_KEY = 'abfragen.snooze';

/** The ten areas, in the order of AB5 (Noah's nine categories plus «Körper und Werte» of AB1). */
export const AREAS = [
  { key: 'erholung', name: 'Recovery|area', icon: 'battery-charging' },
  { key: 'spass', name: 'Fun|area', icon: 'smile' },
  { key: 'sport', name: 'Sport|area', icon: 'bike' },
  { key: 'achtsamkeit', name: 'Mindfulness|area', icon: 'flower' },
  { key: 'freunde', name: 'Friends|area', icon: 'users' },
  { key: 'natur', name: 'Nature|area', icon: 'trees' },
  { key: 'visionen', name: 'Visions|area', icon: 'telescope' },
  { key: 'ziele', name: 'Goals|area', icon: 'target' },
  { key: 'erreicht', name: 'Achieved|area', icon: 'trophy' },
  { key: 'koerper', name: 'Body and values|area', icon: 'heart-pulse' },
];
export const AREA = Object.fromEntries(AREAS.map((a) => [a.key, a]));
/** Own questions without an area of their own sit under «Eigene». */
export const OWN_AREA = 'eigene';

// the intervals of the list
const at = (...times) => ({ kind: 'times', times });
const daily = (time) => ({ kind: 'daily', time });
const weekly = (dow, time) => ({ kind: 'weekly', dow, time });
const monthly = (time) => ({ kind: 'monthly', time });
// the answer forms
const scale = (extra = {}) => ({ kind: 'scale', ...extra });
const chips = (options, extra = {}) => ({ kind: 'chips', options: options.map(([key, label, v]) => (v == null ? { key, label } : { key, label, v })), ...extra });
const yesno = (options) => ({ kind: 'yesno', options: options.map(([key, label, v]) => ({ key, label, v })) });
const number = (unit = '') => ({ kind: 'number', unit });
const text = () => ({ kind: 'text' });
const YES = ['yes', 'yes', 1];
const NO = ['no', 'no', 0];

const q = (area, key, textEn, form, every, src = ['hand'], was = null) => ({ id: `${area}.${key}`, area, key, text: textEn, form, every, src, ...(was ? { was } : {}) });

/**
 * The 50 questions (Paket P adds 4 evening questions: 54) (notes/deine-abfragen/lustige-fragen-2026-10-13.md, Noah «ok» 13.10.2026 23:37–23:40).
 * `was` names the earlier question that lives on in it («bisher: …»).
 */
export const QUESTIONS = [
  // 1 Erholung
  q('erholung', 'schlaf', 'How well did you sleep: marmot or zombie?', scale(), daily('07:00'), ['hand', 'later'], 'How well did you sleep?'),
  q('erholung', 'akku', 'How full is your battery right now?', scale({ style: 'battery' }), at('08:00', '13:00', '20:00'), ['hand'], 'How much energy do you have?'),
  q('erholung', 'koerper', 'Does your body feel more like a freshly oiled bike or a rusty chain today?', scale(), daily('08:00'), ['hand'], 'How rested does your body feel?'),
  q('erholung', 'kaffee', 'How many coffees do you need today to be human?', number('cups'), at('12:00', '18:00'), ['only'], 'own question «Coffee»'),
  q('erholung', 'sofa', 'Sofa or saddle: what is your body calling for today?', chips([['sofa', 'Sofa', 0], ['ratherSofa', 'rather sofa', 0.25], ['either', 'either', 0.5], ['ratherSaddle', 'rather saddle', 0.75], ['saddle', 'Saddle', 1]]), daily('08:00')),
  // Paket P «Was mir gut tut» (Noah 19.10.2026 «4a»): fixed in the evening check, each one can be switched off
  q('erholung', 'raeuber', 'What took energy from you today?', chips([['work', 'Work|drain'], ['screen', 'Screen|drain'], ['people', 'People|drain'], ['sleep', 'Little sleep|drain'], ['stress', 'Rush|drain'], ['weather', 'Weather|drain'], ['nothing', 'Nothing|drain']], { multi: true, note: true }), daily('20:00')),
  // 2 Spass
  q('spass', 'grinser', 'How many grins did the day have?', scale(), daily('20:00'), ['hand'], 'How much fun did you have?'),
  q('spass', 'emoji', 'Which emoji was your day today?', chips([['laugh', '😄'], ['cool', '😎'], ['crazy', '🤪'], ['sleepy', '😴'], ['upsideDown', '🙃'], ['starstruck', '🤩']], { style: 'emoji' }), daily('20:00')),
  q('spass', 'stimmung', 'How is the mood: rain cloud or sunglasses?', scale(), daily('13:00'), ['hand'], 'How is your mood?'),
  q('spass', 'coolstes', 'What was the coolest thing today?', chips([['fun', 'Fun'], ['sport', 'Sport|chip'], ['nature', 'Nature'], ['friends', 'Friends'], ['calm', 'Calm'], ['done', 'Done|day'], ['new', 'New']], { multi: true, note: true }), daily('20:00'), ['hand'], 'What was the coolest thing today?'),
  q('spass', 'gelacht', 'Did you laugh out loud today?', yesno([YES, NO, ['often', 'several times', 1]]), daily('20:00')),
  // 3 Sport
  q('sport', 'beine', 'How do your legs feel: gummy bear or turbo?', scale(), daily('08:00'), ['hand'], 'How do body and legs feel?'),
  q('sport', 'hoehenmeter', 'How much climbing would your head have liked today?', chips([['none', 'none|climb', 0], ['hill', 'a hill', 1 / 3], ['pass', 'a pass', 2 / 3], ['all', 'all of them', 1]]), daily('08:00')),
  q('sport', 'ueberholt', 'Did a road bike overtake you today?', chips([['yes', 'yes'], ['no', 'no'], ['passed', 'I overtook']]), daily('20:00')),
  q('sport', 'fit', 'How fit do you feel this week?', scale(), weekly(0, '19:00'), ['hand'], 'Fitness feeling'),
  q('sport', 'bewegung', 'How much movement was there today: sloth, walker or mountain goat?', chips([['sloth', 'Sloth', 0], ['walker', 'Walker', 0.5], ['goat', 'Mountain goat', 1]]), daily('20:00'), ['hand', 'later']),
  // 4 Achtsamkeit
  q('achtsamkeit', 'kopf', 'How calm is your head: mountain lake or white water?', scale(), daily('13:00'), ['hand'], 'How calm is your mind?'),
  q('achtsamkeit', 'moment', 'Did you have a moment today when you just looked?', yesno([YES, NO]), daily('20:00'), ['hand'], 'Did you have a mindful moment?'),
  q('achtsamkeit', 'schultern', 'How relaxed are your shoulders right now: up by your ears or all the way down?', scale(), daily('13:00'), ['hand'], 'How relaxed do you feel?'),
  q('achtsamkeit', 'dank', 'What are you grateful for today, even if it is only the mid-morning snack?', scale({ note: true }), daily('20:00'), ['hand'], 'How grateful are you today?'),
  q('achtsamkeit', 'tabs', 'How many tabs are open in your head?', chips([['one', '1', 1], ['three', '3', 2 / 3], ['ten', '10', 1 / 3], ['crashed', 'browser crashed', 0]]), daily('08:00'), ['hand'], 'How focused can you work today?'),
  // 5 Freunde
  q('freunde', 'verbunden', 'How connected do you feel to others: hermit or pack animal?', scale(), daily('20:00'), ['hand'], 'How connected do you feel to others?'),
  q('freunde', 'zeit', 'Time with friends or family?', chips([['no', 'no', 0], ['short', 'short', 0.5], ['much', 'a lot', 1]]), daily('20:00'), ['hand'], 'Time with friends or family?'),
  q('freunde', 'runde', 'Who would you most like to ride a round with today?', chips([['alone', 'alone'], ['friends', 'with friends'], ['family', 'with family'], ['group', 'with a group']]), weekly(6, '09:00')),
  q('freunde', 'laecheln', 'Did you coax a smile out of someone today?', yesno([YES, NO, ['several', 'several', 1]]), daily('20:00')),
  q('freunde', 'gespraeche', 'How many real conversations instead of messages were there today?', number(''), daily('20:00')),
  q('freunde', 'allein', 'Were you alone on purpose today?', yesno([YES, NO]), daily('20:00')),
  q('freunde', 'alleingut', 'If you were alone: how good did it do you?', scale(), daily('20:00')),
  // 6 Natur
  q('natur', 'draussen', 'How long were you outside: cave dweller or marmot on the alp?', chips([['m0', '0', 0], ['m30', 'up to 30', 15], ['m90', '30–90', 60], ['more', 'over 90 min', 120]]), daily('20:00'), ['hand', 'app'], 'How much time did you spend outside?'),
  q('natur', 'wetter', 'Which weather did you have in your face?', chips([['sun', 'Sun'], ['wind', 'Wind'], ['rain', 'Rain'], ['fog', 'Fog'], ['snow', 'Snow']], { multi: true }), daily('20:00')),
  q('natur', 'tiere', 'Did you see something alive today that was not on a screen?', chips([['bird', 'Bird'], ['cow', 'Cow'], ['deer', 'Deer'], ['marmot', 'Marmot'], ['other', 'other|animal']], { multi: true }), daily('20:00')),
  q('natur', 'luft', 'How much fresh air was in your lungs?', scale(), daily('20:00')),
  q('natur', 'zug', 'How much did it pull you outside today?', scale(), daily('13:00')),
  // 7 Visionen
  q('visionen', 'vision', 'Did you get closer to your vision this week, even if only by one pedal stroke?', scale({ note: true }), weekly(0, '19:00'), ['hand'], 'Did you get closer to your vision?'),
  q('visionen', 'neues', 'How keen are you on something new: creature of habit or explorer?', scale(), daily('08:00'), ['hand'], 'How keen are you on something new?'),
  q('visionen', 'tour', 'Which tour is haunting your head right now?', text(), weekly(0, '19:00')),
  q('visionen', 'wohin', 'If you had tomorrow off and there was no weather: where to?', text(), weekly(6, '09:00')),
  q('visionen', 'jahr', 'What do you want to be able to do in a year that you cannot do today?', text(), monthly('19:00')),
  // 8 Ziele
  q('ziele', 'ziel', 'Your most important goal for today, in a sentence or a word.', text(), daily('08:00'), ['hand'], 'Your most important goal for today'),
  q('ziele', 'freude', 'What are you looking forward to most today?', chips([['nature', 'Nature'], ['sport', 'Sport|chip'], ['friends', 'Friends'], ['new', 'New'], ['calm', 'Calm'], ['food', 'Food'], ['own', 'own|thing']], { multi: true }), daily('08:00'), ['hand'], 'What are you looking forward to today?'),
  q('ziele', 'kette', 'What is your «chain lube» today, the small thing you otherwise put off?', text(), daily('08:00')),
  q('ziele', 'tempo', 'How much do you want to get done today: snail mail or express train?', scale(), daily('08:00')),
  q('ziele', 'liegen', 'What may stay undone today, for once?', text(), daily('08:00')),
  q('ziele', 'umplanen', 'Did you replan something on purpose today?', chips([['good', 'yes, and it was good', 1], ['notgood', 'yes, not so good', 0], ['no', 'no|replan']], { note: true }), daily('20:00')),
  // 9 Erreicht
  q('erreicht', 'zufrieden', 'How happy are you with the day: the best of both worlds?', scale(), daily('20:00'), ['hand'], 'How happy are you with the day?'),
  q('erreicht', 'ziel', 'Did you reach your goal from this morning?', yesno([YES, ['partly', 'partly', 0.5], NO]), daily('20:00'), ['hand'], 'Did you reach your goal?'),
  q('erreicht', 'gestern', 'How happy are you with yesterday, looking back with some distance?', scale(), daily('08:00'), ['hand'], 'How happy are you with yesterday?'),
  q('erreicht', 'stolz', 'What are you a tiny bit proud of today?', text(), daily('20:00')),
  q('erreicht', 'pokal', 'Which trophy goes to you today?', chips([['kept', 'Kept going'], ['brave', 'Brave'], ['patient', 'Patient'], ['helpful', 'Helpful'], ['lazy', 'Lazy and happy']]), daily('20:00')),
  // 10 Körper und Werte (plain on purpose: they flow into analyses like watts per kg)
  q('koerper', 'waage', 'What do the scales show today, without any judgement?', number('kg'), weekly(5, '08:00'), ['open'], 'Weight'),
  q('koerper', 'ruhepuls', 'How calmly does your heart beat in the morning?', number('bpm'), daily('07:00'), ['later'], 'Resting heart rate'),
  q('koerper', 'essen', 'How well did you eat: gourmet, petrol station or forgotten?', scale(), daily('20:00'), ['hand'], 'How well did you eat?'),
  q('koerper', 'wochenschlaf', 'How was your sleep this week overall?', scale(), weekly(0, '19:00'), ['hand'], 'Sleep of the week'),
  q('koerper', 'bildschirm', 'How many hours did a screen look at you today?', number('h'), daily('20:00'), ['only'], 'own question «Screen time»'),
];
// HG1 2b: the answers to the greeting on Today land in the same history, so the lookup knows their questions too
export const QUESTION = Object.fromEntries([...QUESTIONS, ...HELLO_QUESTIONS].map((x) => [x.id, x]));

/** Noah 14.10.2026 00:06:33: 31 of the 50 are on at the start, as drawn in AB5 (per area 4·4·3·3·2·3·2·3·4·3); Paket P adds its 4 evening questions, on: 35. */
export const ON_AT_START = new Set([
  'erholung.schlaf', 'erholung.akku', 'erholung.koerper', 'erholung.kaffee',
  'spass.grinser', 'spass.emoji', 'spass.stimmung', 'spass.coolstes',
  'sport.beine', 'sport.fit', 'sport.bewegung',
  'achtsamkeit.kopf', 'achtsamkeit.moment', 'achtsamkeit.tabs',
  'freunde.verbunden', 'freunde.laecheln',
  'natur.draussen', 'natur.wetter', 'natur.luft',
  'visionen.vision', 'visionen.tour',
  'ziele.ziel', 'ziele.freude', 'ziele.liegen',
  'erreicht.zufrieden', 'erreicht.ziel', 'erreicht.stolz', 'erreicht.pokal',
  'koerper.waage', 'koerper.ruhepuls', 'koerper.wochenschlaf',
  // Paket P (Noah 19.10.2026 «4a»): the four evening questions of «Was mir gut tut»
  'erholung.raeuber', 'freunde.allein', 'freunde.alleingut', 'ziele.umplanen',
]);

/** The units an answer can have (AB2 quick choice kg, min, h, km; cups and bpm from the list). */
export const UNITS = { kg: 'kg', min: 'min', h: 'h', km: 'km', cups: 'cups', bpm: 'bpm' };
/** The answer kinds of an own question (AB2): scale, yes/no, number with unit, text. */
export const OWN_KINDS = ['scale', 'yesno', 'number', 'text'];

/* ---------------------------------------------------------------- time */

const p2 = (n) => String(n).padStart(2, '0');
/** A local time stamp 'YYYY-MM-DDTHH:MM' (the device's clock, like localDay). */
export const stampOf = (d = new Date()) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
export const dayOf = (stamp) => String(stamp ?? '').slice(0, 10);
const hmOf = (stamp) => String(stamp ?? '').slice(11, 16);
/** The weekday of a day (0 = Sunday), calendar arithmetic. */
export const dowOf = (day) => new Date(`${day}T00:00:00Z`).getUTCDay();
const HM = /^([01]\d|2[0-3]):[0-5]\d$/;
/** A time 'H:MM' or 'HH:MM' made whole, null when it is none. */
export function timeOf(s) {
  const m = String(s ?? '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const v = `${p2(Number(m[1]))}:${m[2]}`;
  return HM.test(v) ? v : null;
}

/** An interval made safe: unknown kinds are «off», times sorted and without doubles. */
export function everyOf(e) {
  const kind = e?.kind;
  if (kind === 'times') {
    const times = [...new Set((Array.isArray(e.times) ? e.times : []).map(timeOf).filter(Boolean))].sort();
    if (!times.length) return { kind: 'off' };
    return times.length === 1 ? { kind: 'daily', time: times[0] } : { kind: 'times', times };
  }
  if (kind === 'daily') return { kind, time: timeOf(e.time) ?? '08:00' };
  if (kind === 'weekly') return { kind, dow: Number.isInteger(e.dow) && e.dow >= 0 && e.dow <= 6 ? e.dow : 0, time: timeOf(e.time) ?? '19:00' };
  if (kind === 'monthly') return { kind, time: timeOf(e.time) ?? '19:00' };
  return { kind: 'off' };
}
/** The times of a day an interval asks (several, one, or none). */
export const timesOf = (e) => (e.kind === 'times' ? e.times : e.kind === 'off' ? [] : [e.time]);

/** The last time the question was due at or before `now` (a stamp), null when it never is. */
export function lastSlot(every, now) {
  const e = everyOf(every);
  const day = dayOf(now);
  const hm = hmOf(now);
  if (e.kind === 'off') return null;
  if (e.kind === 'times' || e.kind === 'daily') {
    const ts = timesOf(e);
    const today = ts.filter((x) => x <= hm).at(-1);
    return today ? `${day}T${today}` : `${addDays(day, -1)}T${ts.at(-1)}`;
  }
  if (e.kind === 'weekly') {
    let d = addDays(day, -((dowOf(day) - e.dow + 7) % 7));
    if (d === day && e.time > hm) d = addDays(d, -7);
    return `${d}T${e.time}`;
  }
  // monthly: the 1st of the month
  let d = `${day.slice(0, 8)}01`;
  if (d === day && e.time > hm) d = `${addDays(d, -1).slice(0, 8)}01`;
  return `${d}T${e.time}`;
}
/** The next time after a slot (for «Jetzt nicht» and the missed rule). */
export function nextSlot(every, slot) {
  const e = everyOf(every);
  if (e.kind === 'off' || !slot) return null;
  const day = dayOf(slot);
  const hm = hmOf(slot);
  if (e.kind === 'times' || e.kind === 'daily') {
    const later = timesOf(e).find((x) => x > hm);
    return later ? `${day}T${later}` : `${addDays(day, 1)}T${timesOf(e)[0]}`;
  }
  if (e.kind === 'weekly') return `${addDays(day, 7)}T${e.time}`;
  const [y, m] = day.split('-').map(Number);
  return `${m === 12 ? y + 1 : y}-${p2(m === 12 ? 1 : m + 1)}-01T${e.time}`;
}

/* ---------------------------------------------------------------- the settings */

/** Every question there is: the 50 of the list and the own ones. */
export const allQuestions = (cfg) => [...QUESTIONS, ...(cfg?.own ?? [])];

/** An own question made safe (AB2), null without a name. */
export function ownOf(x) {
  const name = String(x?.text ?? '').trim().slice(0, 120);
  if (!name || typeof x?.id !== 'string') return null;
  const kind = OWN_KINDS.includes(x?.form?.kind) ? x.form.kind : 'scale';
  const form = kind === 'number' ? { kind, unit: String(x.form?.unit ?? '').trim().slice(0, 20) } : kind === 'yesno' ? { kind, options: [{ key: 'yes', label: 'yes', v: 1 }, { key: 'no', label: 'no', v: 0 }] } : { kind };
  const area = AREA[x?.area] ? x.area : OWN_AREA;
  return { id: x.id, area, text: name, form, every: everyOf(x.every), src: ['only'], own: true, show: x.show !== false };
}
/** A new own question with a fresh id (the time it was made). */
export const newOwn = (fields = {}, now = new Date()) => ownOf({ ...fields, id: `own-${now.getTime().toString(36)}` });

/** The stored settings made safe: { since, q, own, rounds }. */
export function configOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const own = (Array.isArray(v.own) ? v.own : []).map(ownOf).filter(Boolean);
  const qs = v.q && typeof v.q === 'object' ? v.q : {};
  return { since: typeof v.since === 'string' ? v.since : null, q: qs, own, rounds: roundsOf(v.rounds) };
}

/* ---------------------------------------------------------------- WG: the two fixed rounds */

/**
 * WG «Wi gaht's?» takes over the daily check (Noah 14.10.2026 «a) ja, alle drei übernehmen»): two fixed
 * rounds, 07:00 and 20:30. While they are on, a question whose own time is before 11:00 asks at the
 * morning time, one from 18:00 at the evening time; 11:00–17:59 keeps its own time (v0.144.0 RE: the day clock). A suggestion only:
 * the rounds can be switched off and both times changed (Ich › «Wi gaht's?» › «Feste Runden»).
 */
export const ROUNDS = { on: true, morning: '07:00', evening: '20:30' };
/** WG: the stored rounds made safe (missing: on, 07:00 and 20:30). */
export function roundsOf(r) {
  const v = r && typeof r === 'object' ? r : {};
  return { on: typeof v.on === 'boolean' ? v.on : ROUNDS.on, morning: timeOf(v.morning) ?? ROUNDS.morning, evening: timeOf(v.evening) ?? ROUNDS.evening };
}
/** WG: the rounds changed (on, morning, evening; the rest kept). */
export const setRounds = (cfg, patch = {}) => {
  const c = configOf(cfg);
  return { ...c, rounds: roundsOf({ ...c.rounds, ...patch }) };
};
/**
 * WG: the time a question asks at with the rounds: before 11:00 the morning, from 18:00 the evening time.
 * v0.144.0 RE «Eine Tagesuhr»: the borders of the one day clock (dayclock.js; the morning ended at 12:00 before).
 */
export function roundTime(time, rounds) {
  const r = roundsOf(rounds);
  const hm = timeOf(time);
  if (!r.on || !hm) return hm;
  return hm < DAY_FROM ? r.morning : hm >= EVENING_FROM ? r.evening : hm;
}
/** WG: an interval with the rounds applied (several times a day, daily, weekly and monthly alike). */
export function roundEvery(every, rounds) {
  const e = everyOf(every);
  if (!roundsOf(rounds).on || e.kind === 'off') return e;
  if (e.kind === 'times') return everyOf({ kind: 'times', times: e.times.map((x) => roundTime(x, rounds)) });
  return { ...e, time: roundTime(e.time, rounds) };
}
/**
 * WG: the part of the day an answer belongs to, by its question time (else the time it was given):
 * 'morning', 'day' or 'evening'; the two round times always count as their round.
 */
export function partOf(row, rounds) {
  const hm = hmOf(row?.slot || row?.at);
  if (!hm) return null;
  const r = roundsOf(rounds);
  if (r.on && hm === r.evening) return 'evening';
  if (r.on && hm === r.morning) return 'morning';
  return hm < DAY_FROM ? 'morning' : hm >= EVENING_FROM ? 'evening' : 'day';
}
/** WG: is it the evening round yet (from the evening time on; also with the rounds off, the time stays the border)? */
export const isEveningRound = (now, rounds) => hmOf(now) >= roundsOf(rounds).evening;

/** One question's setting: on, its interval and since when it asks (switched on later: from then). */
export function settingOf(cfg, question) {
  const c = configOf(cfg);
  const s = c.q[question.id] ?? {};
  const on = typeof s.on === 'boolean' ? s.on : question.own ? true : ON_AT_START.has(question.id);
  return { on, every: s.every ? everyOf(s.every) : everyOf(question.every), since: s.since ?? c.since };
}
/** Switch a question on or off: the new settings. Switched on, it asks from its next time on. */
export function setOn(cfg, id, on, now) {
  const c = configOf(cfg);
  const was = c.q[id] ?? {};
  return { ...c, q: { ...c.q, [id]: { ...was, on: !!on, ...(on ? { since: now } : {}) } } };
}
/** Give a question another interval: the new settings (an own question keeps it in its record). */
export function setEvery(cfg, id, every) {
  const c = configOf(cfg);
  return { ...c, q: { ...c.q, [id]: { ...(c.q[id] ?? {}), every: everyOf(every) } } };
}
/** Add or change an own question. */
export function putOwn(cfg, question, now) {
  const c = configOf(cfg);
  const own = ownOf(question);
  if (!own) return c;
  const has = c.own.some((x) => x.id === own.id);
  const next = { ...c, own: has ? c.own.map((x) => (x.id === own.id ? own : x)) : [...c.own, own] };
  // the interval lives in the question itself; a new one asks from its next time on
  const q = { ...next.q };
  const was = q[own.id] ?? {};
  const off = own.every.kind === 'off';
  // «Aus» in the sheet switches it off; a new one or one switched on again asks from its next time
  q[own.id] = { on: !off, since: !has || (!off && was.on === false) ? now : was.since ?? now };
  return { ...next, q };
}
/** Remove an own question (its answers stay in the history). */
export function dropOwn(cfg, id) {
  const c = configOf(cfg);
  const q = { ...c.q };
  delete q[id];
  return { ...c, own: c.own.filter((x) => x.id !== id), q };
}

/** How many are on: { all, on, per: { [area]: { all, on } } } (AB5 «50 Fragen in 10 Bereichen, 31 davon an»). */
export function counts(cfg) {
  const per = {};
  let on = 0;
  const list = allQuestions(configOf(cfg));
  for (const x of list) {
    const a = x.own ? OWN_AREA : x.area;
    per[a] ??= { all: 0, on: 0 };
    per[a].all++;
    if (settingOf(cfg, x).on) (per[a].on++, on++);
  }
  return { all: list.length, on, per };
}

/**
 * Impeccable Runde 2 «Tageslast»: about how many times a day the app asks, from the questions that are on:
 * «3× daily» counts 3, daily 1, weekly 1/7, monthly 1/30; rounded to a whole number.
 */
export function perDay(cfg) {
  const c = configOf(cfg);
  let n = 0;
  for (const x of allQuestions(c)) {
    const s = settingOf(c, x);
    if (!s.on) continue;
    const e = everyOf(s.every);
    n += e.kind === 'times' ? e.times.length : e.kind === 'daily' ? 1 : e.kind === 'weekly' ? 1 / 7 : e.kind === 'monthly' ? 1 / 30 : 0;
  }
  return Math.round(n);
}
/** More than this many a day: a calm hint how to ask less. */
export const BUSY_DAY = 15;

/* ---------------------------------------------------------------- what is due */

// Noah 14.10. 00:52:22 1a 2a 3b 4ab — 3b: a value that later comes from Fitbit does not switch its question
// off; it stays on until you switch it off yourself (no Fitbit link is built yet).

/**
 * Noah 14.10. 00:52:22 1a 2a 3b 4ab — 2a: a missed question STAYS until it is answered or tapped away.
 * The first time it was due after `floor` (switched on, the last answer, «Jetzt nicht»), null when none
 * has come since. A question switched on asks from its next time on.
 */
export function pendingSlot(every, floor, now) {
  const last = lastSlot(every, now);
  if (!last) return null;
  if (!floor) return last;
  if (last <= floor) return null;
  const before = lastSlot(every, floor);
  return before ? nextSlot(every, before) : last;
}

/**
 * All questions due now (a pure list; AbCard.svelte shows them, Noah 1a: together in one card):
 * [{ q, slot (the first time missed), last (the latest time) }] in the order of their time, then of the list.
 * answers: rows { qid, at } (at: stamp); snooze: { [qid]: stamp } («Jetzt nicht» until the next time).
 */
export function dueList(cfg, answers = [], now, snooze = {}) {
  const c = configOf(cfg);
  const lastAt = {};
  for (const a of answers) if (a?.qid && a.at && (!lastAt[a.qid] || a.at > lastAt[a.qid])) lastAt[a.qid] = a.at;
  const order = new Map(allQuestions(c).map((x, i) => [x.id, i]));
  const out = [];
  for (const x of allQuestions(c)) {
    const s = settingOf(c, x);
    if (!s.on) continue;
    const floor = [s.since, lastAt[x.id], snooze?.[x.id]].filter(Boolean).sort().at(-1) ?? null;
    const every = roundEvery(s.every, c.rounds); // WG: the fixed rounds move the morning and evening times
    const slot = pendingSlot(every, floor, now);
    if (!slot) continue;
    out.push({ q: x, slot, last: lastSlot(every, now) });
  }
  return out.sort((a, b) => a.slot.localeCompare(b.slot) || order.get(a.q.id) - order.get(b.q.id));
}
/** «Später» on the window of the round (Noah 19.10.2026): kept in the snooze record under this key, until when. */
export const LATER_KEY = '_later';
/** The stamp one hour after `now` (a stamp 'YYYY-MM-DDTHH:MM', local time). */
export function laterStamp(now) {
  const [d, hm] = String(now).split('T');
  const [y, m, dd] = d.split('-').map(Number);
  const [h, mi] = hm.split(':').map(Number);
  return stampOf(new Date(y, m - 1, dd, h + 1, mi));
}
/** «Heute nicht» (was «Jetzt nicht»): every shown question put away until its next time. */
export const snoozeAll = (snooze = {}, due = []) => ({ ...(snooze ?? {}), ...Object.fromEntries(due.map((d) => [d.q.id, d.last ?? d.slot])) });

/* ---------------------------------------------------------------- answers */

/** The answer made whole for its form, null when there is none (an empty field, an unknown chip). */
export function valueOf(form, raw) {
  if (raw == null || raw === '') return null;
  if (form.kind === 'scale') {
    const v = Number(raw);
    return Number.isInteger(v) && v >= 1 && v <= 10 ? v : null;
  }
  if (form.kind === 'number') {
    const v = Number(String(raw).replace(',', '.'));
    return Number.isFinite(v) && v >= 0 ? Math.round(v * 100) / 100 : null;
  }
  if (form.kind === 'text') {
    const s = String(raw).trim().slice(0, 500);
    return s || null;
  }
  const keys = new Set((form.options ?? []).map((o) => o.key));
  if (form.kind === 'chips' && form.multi) {
    const list = (Array.isArray(raw) ? raw : [raw]).filter((k) => keys.has(k));
    return list.length ? [...new Set(list)] : null;
  }
  const k = Array.isArray(raw) ? raw[0] : raw;
  return keys.has(k) ? k : null;
}

/** The number an answer stands for in the analyses (1–10, 1 · 0.5 · 0, a number, a chip's value), else null. */
export function numberOf(form, value) {
  if (value == null || !form) return null;
  if (form.kind === 'scale' || form.kind === 'number') return typeof value === 'number' ? value : null;
  if (form.kind === 'text') return null;
  const vs = (Array.isArray(value) ? value : [value]).map((k) => form.options?.find((o) => o.key === k)?.v).filter((v) => typeof v === 'number');
  return vs.length ? vs.reduce((s, v) => s + v, 0) / vs.length : null;
}

/** A history row from an answer: { id, qid, area, day, at, slot, kind, value, note, unit, src }. */
export function answerRow(question, raw, { at = null, day = null, slot = null, note = '' } = {}) {
  const value = valueOf(question.form, raw);
  const n = String(note ?? '').trim().slice(0, 500);
  if (value == null && !n) return null;
  return {
    id: `ab-${question.id}-${at ?? day}-${Math.random().toString(36).slice(2, 6)}`,
    qid: question.id,
    area: question.area,
    day: day ?? dayOf(at),
    at,
    slot,
    kind: question.form.kind,
    value,
    note: n || null,
    unit: question.form.unit || null,
    src: 'hand',
  };
}

/* ---------------------------------------------------------------- the old daily check */

/**
 * The daily check (table flowChecks, v0.51.0) lives on in the questions: sleep, energy and mood and the
 * rotating ones with an exact match. Old answers stay where they are; the history reads both (fromChecks).
 * A pool question without a match keeps its own key `tc.<id>`.
 */
export const CHECK_MAP = {
  sleep: 'erholung.schlaf',
  energy: 'erholung.akku',
  mood: 'spass.stimmung',
  body: 'erholung.koerper',
  new: 'visionen.neues',
  calm: 'achtsamkeit.kopf',
  yesterday: 'erreicht.gestern',
  food: 'koerper.essen',
  people: 'freunde.verbunden',
  ease: 'achtsamkeit.schultern',
  thanks: 'achtsamkeit.dank',
};
/** Back the other way: which field of the daily check an answer fills too (only the three fixed ones). */
export const MIRROR = { 'erholung.schlaf': 'sleep', 'erholung.akku': 'energy', 'spass.stimmung': 'mood' };

const scaleV = (x) => (Number.isInteger(Number(x)) && Number(x) >= 1 && Number(x) <= 10 ? Number(x) : null);
/**
 * The rows of the old daily checks, in the shape of the history (src 'hand', from: 'check', no time).
 * pool: the rotating questions (for the text of a key without a match).
 */
export function fromChecks(checks = [], pool = []) {
  const out = [];
  for (const c of checks) {
    if (!c?.day) continue;
    const add = (field, qid, label = null) => {
      const v = scaleV(c[field]);
      if (v == null) return;
      const area = QUESTION[qid]?.area ?? 'erholung';
      out.push({ id: `tc-${c.day}-${qid}`, qid, area, day: c.day, at: null, slot: null, kind: 'scale', value: v, note: null, unit: null, src: 'hand', from: 'check', ...(label ? { label } : {}) });
    };
    add('sleep', CHECK_MAP.sleep);
    add('energy', CHECK_MAP.energy);
    add('mood', CHECK_MAP.mood);
    if (c.q) {
      const p = pool.find((x) => x.id === c.q);
      const qid = CHECK_MAP[c.q] ?? `tc.${c.q}`;
      add('extra', qid, CHECK_MAP[c.q] ? null : { text: p?.text ?? c.q, textDe: p?.textDe ?? null });
    }
  }
  return out;
}

/**
 * The one history (AB4): the answers and the old daily checks, newest first. An old check of a day
 * that has an answer to the same question gives way (the answer was saved into both).
 */
export function mergeHistory(answers = [], checks = [], pool = []) {
  const have = new Set(answers.map((a) => `${a.day}|${a.qid}`));
  const old = fromChecks(checks, pool).filter((r) => !have.has(`${r.day}|${r.qid}`));
  return [...answers, ...old].sort((a, b) => b.day.localeCompare(a.day) || String(b.at ?? '').localeCompare(String(a.at ?? '')) || a.qid.localeCompare(b.qid));
}

/** The latest answer of a question in the history (AB3 «zuletzt 72.4 kg am …»), null without one. */
export const lastAnswer = (rows = [], qid) => rows.filter((r) => r.qid === qid && r.value != null).sort((a, b) => b.day.localeCompare(a.day) || String(b.at ?? '').localeCompare(String(a.at ?? '')))[0] ?? null;

/** History filters (AB4): by question (or area) and by source. */
export function filterHistory(rows = [], { qid = null, src = null } = {}) {
  return rows.filter((r) => (!qid || r.qid === qid) && (!src || r.src === src));
}
/** The rows grouped by day, newest first: [{ day, rows }]. */
export function byDay(rows = []) {
  const out = [];
  for (const r of rows) {
    const last = out.at(-1);
    if (last?.day === r.day) last.rows.push(r);
    else out.push({ day: r.day, rows: [r] });
  }
  return out;
}
