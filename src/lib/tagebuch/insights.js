/**
 * «Tagebuch» › Rückblick (Noah 20.10.2026 «2a 4b»): the mood of each entry with its curve and what goes
 * together (observation only: never a cause, never advice), the words of a month as a word cloud, and calm
 * series (days in a row, entries, words) that stay once reached. Pure, tested in tests/journal.test.js.
 */
import { wordCount } from './journal.js';

/** The five moods: value, sign and name (t() key). */
export const MOODS = [
  { v: 1, emoji: '😣', name: 'Heavy|mood' },
  { v: 2, emoji: '😕', name: 'Meh|mood' },
  { v: 3, emoji: '😐', name: 'Okay|mood' },
  { v: 4, emoji: '🙂', name: 'Good|mood' },
  { v: 5, emoji: '😄', name: 'Great|mood' },
];
export const moodOf = (v) => MOODS.find((m) => m.v === v) ?? null;
const r1 = (n) => Math.round(n * 10) / 10;

/** The mood of each day (the mean of its entries with a mood): { day: mood }. */
export function moodByDay(entries = []) {
  const sum = {};
  for (const e of entries) {
    if (!(e.mood >= 1 && e.mood <= 5)) continue;
    (sum[e.day] ??= []).push(e.mood);
  }
  return Object.fromEntries(Object.entries(sum).map(([d, v]) => [d, r1(v.reduce((a, b) => a + b, 0) / v.length)]));
}

const addDays = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** The days with a mood in the last `days` days up to today, oldest first: [{ day, mood }]. */
export function moodSeries(entries = [], today, days = 90) {
  const from = addDays(today, -(days - 1));
  return Object.entries(moodByDay(entries))
    .filter(([d]) => d >= from && d <= today)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, mood]) => ({ day, mood }));
}

/** The least days on each side before a pair is shown. */
export const MIN_DAYS = 5;
/** The smallest difference (in mood steps) worth a sentence. */
export const MIN_DIFF = 0.3;

/**
 * What goes together with the mood: rides (rideDays: Set of days with an activity), sleep (sleep: { day:
 * minutes asleep }, at least 7 h or less) and each tag. → [{ key, label, vars, yes, no, nYes, nNo }]
 * with at least MIN_DAYS days on both sides and a difference of at least MIN_DIFF, biggest first.
 * label is a t() key with {thing} filled from vars.
 */
export function moodPairs(entries = [], { rideDays = new Set(), sleep = {} } = {}) {
  const md = moodByDay(entries);
  const days = Object.keys(md);
  const tagDays = {};
  for (const e of entries) for (const x of e.tags ?? []) (tagDays[x.toLowerCase()] ??= { name: x, days: new Set() }).days.add(e.day);
  const tests = [
    { key: 'ride', label: 'On days with a ride or workout', test: (d) => rideDays.has(d) },
    { key: 'sleep', label: 'After at least 7 h of sleep', test: (d) => (Number.isFinite(sleep[d]) ? sleep[d] >= 420 : null) },
    ...Object.values(tagDays).map((x) => ({ key: `tag:${x.name}`, label: 'On days with #{thing}', vars: { thing: x.name }, test: (d) => x.days.has(d) })),
  ];
  const out = [];
  for (const k of tests) {
    const yes = [];
    const no = [];
    for (const d of days) {
      const r = k.test(d);
      if (r === null) continue;
      (r ? yes : no).push(md[d]);
    }
    if (yes.length < MIN_DAYS || no.length < MIN_DAYS) continue;
    const a = r1(yes.reduce((s, v) => s + v, 0) / yes.length);
    const b = r1(no.reduce((s, v) => s + v, 0) / no.length);
    if (Math.abs(a - b) < MIN_DIFF) continue;
    out.push({ key: k.key, label: k.label, vars: k.vars ?? {}, yes: a, no: b, nYes: yes.length, nNo: no.length });
  }
  return out.sort((x, y) => Math.abs(y.yes - y.no) - Math.abs(x.yes - x.no));
}

/* ---------- word cloud ---------- */
const STOP = new Set(
  (
    'aber alle allem allen aller alles also am an andere anderen auch auf aus bei bin bis bist da dabei dann das dass dein deine dem den der des die dies diese dieser dir doch dort du durch ein eine einem einen einer eines einmal er es etwas euch für gab gar gegen gehabt geht gewesen hab habe haben hast hat hatte hatten heute hier hin ich ihm ihn ihr im in ist ja jetzt kam kann kein keine kurz man mal mehr mein meine meinem meinen mich mir mit muss nach nicht nichts noch nun nur ob oder ohne schon sehr sein seine sich sie sind so sowie über um und uns unter viel vom von vor war waren was weil wenn wer wie wieder wir wird wo zu zum zur zwei drei gut ganz immer einfach bisschen etwa wurde wurden würde morgen gestern ' +
    'the a an and or but to of in on at for with from by is are was were be been it this that these those i me my we our you your he she they them his her its as so not no yes do did have has had will would can could just very then there here what when where who why how about into up out over again today'
  ).split(' '),
);
/** The most used words of the entries: [{ word, n }], at least 2 uses, stop words left out, at most `max`. */
export function topWords(entries = [], max = 30) {
  const count = new Map();
  for (const e of entries) {
    for (const w of `${e.title ?? ''} ${e.text ?? ''}`.toLowerCase().match(/[\p{L}][\p{L}'’-]{2,}/gu) ?? []) {
      if (STOP.has(w) || w.startsWith('test_data')) continue;
      count.set(w, (count.get(w) ?? 0) + 1);
    }
  }
  return [...count.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([word, n]) => ({ word, n }));
}
/** A size step 1–5 for each word of the cloud (by its share of the biggest). */
export const cloudSize = (n, top) => (top > 0 ? Math.max(1, Math.min(5, Math.ceil((n / top) * 5))) : 1);

/* ---------- series ---------- */
/** The longest run of days in a row with an entry. */
export function longestStreak(entries = []) {
  const days = [...new Set(entries.map((e) => e.day))].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** The calm milestones: [{ key, label, vars, done }] (label: t() key). Nothing counts on an empty diary. */
export function milestones(entries = []) {
  const n = entries.length;
  const words = entries.reduce((s, e) => s + wordCount(e.text) + wordCount(e.title), 0);
  const best = longestStreak(entries);
  const photos = entries.reduce((s, e) => s + (e.photos?.length ?? 0), 0);
  const moods = entries.filter((e) => e.mood).length;
  const list = [
    ...[1, 10, 50, 100, 365].map((k) => ({ key: `entries-${k}`, label: k === 1 ? 'First entry' : '{k} entries', vars: { k }, done: n >= k })),
    ...[3, 7, 30, 100].map((k) => ({ key: `streak-${k}`, label: '{k} days in a row', vars: { k }, done: best >= k })),
    ...[1000, 10000, 100000].map((k) => ({ key: `words-${k}`, label: '{k} words', vars: { k }, done: words >= k })),
    { key: 'photos-10', label: '{k} photos', vars: { k: 10 }, done: photos >= 10 },
    { key: 'moods-30', label: '{k} days with a mood', vars: { k: 30 }, done: moods >= 30 },
  ];
  return n ? list : list.map((m) => ({ ...m, done: false }));
}

/* ---------- evening reminder (Noah «3a») ---------- */
/** The reminder as stored in the settings 'journal' (on, at 21:00 unless changed). */
export const remindOf = (cfg) => ({ on: cfg?.remind?.on !== false, time: /^\d{2}:\d{2}$/.test(cfg?.remind?.time ?? '') ? cfg.remind.time : '21:00' });
/**
 * Show the evening window? Only when it is on, the time has come, the diary has an entry at all, today has
 * none yet, it is not waiting (until: «Später» or «Heute nicht») and the diary is not open.
 */
export function remindDue({ cfg, hasAny, hasToday, clock, now, until = null, onDiary = false }) {
  const r = remindOf(cfg);
  if (!r.on || !hasAny || hasToday || onDiary) return false;
  if (until && new Date(until) > now) return false;
  return clock >= r.time;
}
