/**
 * Idee 52 «Tour aus einer Absicht» (Touren b, mockup B52, Noah 26.10.2026 «freigabe», answer a: the first step
 * of a new tour). Pick what you want (see nature, visit someone, test a night out, training, just ride); the app
 * asks only the questions that fit and proposes the tour: name, days, night, hours, and the questions the
 * Rückblick asks afterwards. Everything stays changeable in the window below.
 * Texts are English (t() in the component). Pure functions, tested in tests/touren-b.test.js.
 */
import { localDay } from '../localday.js';

/** The answer «When?»: today, tomorrow, next Saturday (calendar days, local). */
export function whenChoices(now = new Date()) {
  const at = (n) => localDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + n));
  const sat = (6 - now.getDay() + 7) % 7 || 7;
  return [
    { key: 'today', name: 'Today', day: at(0) },
    { key: 'tomorrow', name: 'Tomorrow', day: at(1) },
    ...(sat > 1 ? [{ key: 'sat', name: 'Next Saturday', day: at(sat) }] : []),
  ];
}

const WHEN = { id: 'when', q: 'When?', when: true };

/** The intents with their questions. choices: [{ key, name }]; multi: more than one; own: «+ own» text. */
export const INTENTS = [
  {
    key: 'nature',
    icon: 'eye',
    name: 'See nature',
    sub: 'Lake, view, forest',
    questions: [
      { id: 'see', q: 'What do you want to see?', multi: true, choices: [{ key: 'lake', name: 'Lake' }, { key: 'view', name: 'View' }, { key: 'forest', name: 'Forest' }, { key: 'river', name: 'River' }] },
      { id: 'long', q: 'How long?', choices: [{ key: 'half', name: 'Half a day' }, { key: 'day', name: 'A whole day' }, { key: 'two', name: '2 days' }] },
      WHEN,
    ],
  },
  {
    key: 'visit',
    icon: 'home',
    name: 'Visit someone',
    sub: 'With a goal and a time',
    questions: [
      { id: 'back', q: 'Back the same day?', choices: [{ key: 'same', name: 'Same day' }, { key: 'stay', name: 'Stay the night' }] },
      { id: 'arrive', q: 'Arrive by?', choices: [{ key: 'morning', name: 'Morning' }, { key: 'noon', name: 'Noon' }, { key: 'evening', name: 'Evening' }] },
      WHEN,
    ],
  },
  {
    key: 'night',
    icon: 'tent',
    name: 'Test a night out',
    sub: 'Close to home',
    questions: [
      { id: 'sleep', q: 'Where do you sleep?', choices: [{ key: 'tent', name: 'Tent' }, { key: 'bivy', name: 'Bivvy bag' }, { key: 'hammock', name: 'Hammock' }, { key: 'hut', name: 'Hut' }] },
      { id: 'far', q: 'How far from home?', hint: 'Close means: going home early is easy.', choices: [{ key: 'near', name: 'Under 10 km' }, { key: 'mid', name: '10–30 km' }, { key: 'far', name: 'Further' }] },
      { id: 'test', q: 'What do you want to test?', multi: true, own: true, choices: [{ key: 'cold', name: 'Sleeping bag in the cold' }, { key: 'cook', name: 'Cooking' }, { key: 'pack', name: 'Packing on the bike' }] },
      WHEN,
    ],
  },
  {
    key: 'training',
    icon: 'act',
    name: 'Training',
    sub: 'Speed and climbing',
    questions: [
      { id: 'focus', q: 'What do you train?', choices: [{ key: 'base', name: 'Endurance' }, { key: 'speed', name: 'Speed' }, { key: 'climb', name: 'Climbing' }] },
      { id: 'hours', q: 'How long?', choices: [{ key: '1', name: '1 h' }, { key: '2', name: '2 h' }, { key: '3', name: '3 h' }, { key: '4', name: '4 h or more' }] },
      WHEN,
    ],
  },
  {
    key: 'ride',
    icon: 'bike',
    name: 'Just ride',
    sub: 'No plan',
    questions: [{ id: 'long', q: 'How long?', choices: [{ key: 'short', name: '1–2 h' }, { key: 'half', name: 'Half a day' }, { key: 'day', name: 'A whole day' }] }, WHEN],
  },
];
export const intentOf = (key) => INTENTS.find((i) => i.key === key) ?? null;

/** The answers as they start: the first choice of each question (multi: the first one), «When?» tomorrow. */
export function startAnswers(intent, now = new Date()) {
  const out = {};
  for (const q of intent?.questions ?? []) {
    if (q.when) out[q.id] = whenChoices(now)[1].day;
    else out[q.id] = q.multi ? [q.choices[0].key] : q.choices[0].key;
  }
  return out;
}

/** Pick an answer: a single question takes the key, a multi question switches it on or off. */
export function pickAnswer(answers, q, key) {
  if (!q.multi) return { ...answers, [q.id]: key };
  const now = Array.isArray(answers[q.id]) ? answers[q.id] : [];
  return { ...answers, [q.id]: now.includes(key) ? now.filter((k) => k !== key) : [...now, key] };
}

const TEST_ASKS = { cold: 'How warm was the sleeping bag?', cook: 'Did the cooking work?', pack: 'How did packing on the bike work?' };
const HOURS = { half: 4, day: 7, short: 2 };

/**
 * The tour from the intent and the answers: { title, days, startDate, hours, overnight, cook, tent, asks }.
 * title and asks are English (t() when shown); an own test (answers.own) is the user's text and stays as typed:
 * its ask is { own: name }. asks: [{ text } | { own }].
 */
export function proposal(intentKey, answers = {}) {
  const a = answers;
  const base = { days: 1, startDate: a.when || '', hours: null, overnight: 'none', cook: false, tent: false };
  if (intentKey === 'nature') {
    const days = a.long === 'two' ? 2 : 1;
    return { ...base, title: 'Nature tour', days, hours: days === 1 ? HOURS[a.long] ?? null : null, overnight: days > 1 ? 'outdoor' : 'none', tent: days > 1, asks: [{ text: 'What was the most beautiful place?' }, { text: 'Would you ride there again?' }] };
  }
  if (intentKey === 'visit') {
    const stay = a.back === 'stay';
    return { ...base, title: 'Visit', days: stay ? 2 : 1, overnight: stay ? 'lodging' : 'none', asks: [{ text: 'Were you there on time?' }, { text: 'Was the way there good?' }] };
  }
  if (intentKey === 'night') {
    const tests = Array.isArray(a.test) ? a.test : [];
    const own = String(a.own ?? '').trim();
    const sleep = a.sleep ?? 'tent';
    return {
      ...base,
      title: 'Test night',
      days: 2,
      overnight: sleep === 'hut' ? 'lodging' : 'outdoor',
      tent: sleep === 'tent',
      cook: tests.includes('cook') && sleep !== 'hut',
      asks: [...tests.filter((k) => TEST_ASKS[k]).map((k) => ({ text: TEST_ASKS[k] })), ...(own ? [{ own }] : []), { text: 'What do you take differently next time?' }],
    };
  }
  if (intentKey === 'training') {
    const name = { base: 'Training: endurance', speed: 'Training: speed', climb: 'Training: climbing' }[a.focus] ?? 'Training';
    return { ...base, title: name, hours: Number(a.hours) || null, asks: [{ text: 'How did your legs feel?' }, { text: 'Did you reach what you wanted to train?' }] };
  }
  return { ...base, title: 'Just ride', hours: HOURS[a.long] ?? null, asks: [{ text: 'What did you like most?' }] };
}

/** What goes on the trip: trip.intent = { key, answers, asks, after: {} }. */
export const intentRecord = (key, answers, p) => ({ key, answers, asks: p.asks, after: {} });

/** An answer after the tour (Rückblick) on question i. → the new trip.intent */
export const answerAfter = (intent, i, text) => ({ ...intent, after: { ...(intent?.after ?? {}), [i]: text } });
/** Take a question out of the Rückblick (it is no longer asked). → the new trip.intent */
export const dropAsk = (intent, i) => ({ ...intent, asks: (intent?.asks ?? []).filter((_, k) => k !== i), after: Object.fromEntries(Object.entries(intent?.after ?? {}).filter(([k]) => Number(k) !== i).map(([k, v]) => [Number(k) > i ? Number(k) - 1 : Number(k), v])) });
