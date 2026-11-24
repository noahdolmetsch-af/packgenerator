/**
 * «Verbindungen» (Noah 04./05.11.2026, Thread «Wi gaht's? um Träume und Visionen erweitern», «3b» 23.11.2026: alle fünf in einem PR):
 * a text question shows what the app already knows as one-tap answers, so you do not type what is already there:
 * your goals of the week, your to-dos, your activities, your friends, the stars you reached and (Noah «4a») your visions from the notes.
 * Nothing is copied and nothing is stored here: a tap puts the words into the answer field, you can change them.
 * Pure (tests/verbindungen.test.js); the data is read by connQuery in abdb.js, the chips are drawn in AnswerInput.svelte.
 */
import { goalsOf } from '../flow/weekgoals.js';
import { msContext, crossMilestones, actMilestones } from '../flowms.js';

/** Which question offers which kinds, in this order. */
export const CONNECT = {
  'visionen.naeher': ['visions'], // «Which vision did you move closer to this month»: the notes with the template «Vision»
  'ziele.ziel': ['todos', 'goals', 'acts'], // «Your most important goal for today»
  'ziele.liegen': ['todos'], // «What may stay undone today»
  'ziele.schritt': ['todos', 'goals'], // sample: «Your smallest doable step»
  'ziele.woche': ['goals', 'acts'], // sample: «What do you want to get done this week»
  'erreicht.stolz': ['stars', 'done'], // «What are you a tiny bit proud of today»
  'erreicht.endlich': ['done'], // sample: «Which little thing did you finally get done»
  'freunde.nachricht': ['friends'], // sample: «Who would you like to send a message to»
  'freunde.bald': ['friends'], // sample: «Who would you like to spend time with again soon»
};
/** The group names (English keys; German in i18n/de/verbindungen.js). */
export const LABELS = {
  todos: 'From your to-dos',
  goals: 'Your goals of the week',
  acts: 'Your activities',
  friends: 'People you want to see',
  stars: 'New stars',
  done: 'Done today|link',
  visions: 'Your visions',
};
export const MAX_PER_KIND = 5;

const text = (s, n = 80) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const day = (iso) => {
  // a stored time (ISO, UTC) as the calendar day of the device
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso ?? '').slice(0, 10);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const addDays = (d, n) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

/**
 * What the app offers, by kind, from the raw records. `raw`: { merken: [to-do], weekGoals, acts: [flowActs], people: [alltag.people],
 * stars: [flowStars], notes: [notes with the template «Vision»] }. `tr`: translator, `actName`: the name of an activity in the shown language. → { todos, goals, acts, friends, stars, done, visions }: [string]
 */
export function sourcesOf(raw = {}, today, { tr = (s) => s, actName = (a) => a?.name ?? '' } = {}) {
  const acts = (Array.isArray(raw.acts) ? raw.acts : []).filter((a) => a && !a.paused);
  const actById = new Map(acts.map((a) => [a.id, a]));
  const todos = (Array.isArray(raw.merken) ? raw.merken : []).filter((x) => x && text(x.text));
  const open = todos
    .filter((x) => !x.doneAt && !x.wait)
    .map((x) => ({ x, rank: x.due ? (x.due <= today ? 0 : x.due <= addDays(today, 1) ? 1 : 3) : 2 }))
    .sort((a, b) => a.rank - b.rank || String(a.x.due ?? '9').localeCompare(String(b.x.due ?? '9')) || String(a.x.created ?? '').localeCompare(String(b.x.created ?? '')))
    .filter((r) => r.rank < 3)
    .map((r) => text(r.x.text));
  const done = todos.filter((x) => x.doneAt && day(x.doneAt) === today).map((x) => text(x.text));
  const goals = goalsOf(raw.weekGoals)
    .map((g) => (g.kind === 'km' ? `${g.of} ${tr('Bike km')}` : actById.has(g.actId) ? `${g.of}× ${actName(actById.get(g.actId))}` : null))
    .filter(Boolean);
  const people = (Array.isArray(raw.people) ? raw.people : [])
    .filter((p) => p && p.name && !p.off)
    .sort((a, b) => String(a.seen ?? '').localeCompare(String(b.seen ?? '')))
    .map((p) => text(p.name, 60));
  // the stars of the last 7 days: the name of the milestone they belong to
  const names = new Map(crossMilestones(msContext({ today })).map((m) => [m.id, tr(m.name, { year: today.slice(0, 4) })]));
  for (const a of acts) for (const m of actMilestones(a, today)) names.set(m.id, `${actName(a)} · ${tr(m.name, { year: today.slice(0, 4) })}`);
  const since = addDays(today, -7);
  const seen = new Set();
  const stars = (Array.isArray(raw.stars) ? raw.stars : [])
    .filter((s) => s && s.day >= since && s.day <= today && names.has(s.msId) && !seen.has(s.msId) && seen.add(s.msId))
    .sort((a, b) => String(b.day).localeCompare(String(a.day)))
    .map((s) => names.get(s.msId));
  // visions: the notes written with the template «Vision» (note.form.key), newest first; the title, else «Where I want to go»
  const visions = (Array.isArray(raw.notes) ? raw.notes : [])
    .filter((n) => n?.form?.key === 'vision')
    .sort((a, b) => String(b.updatedAt ?? b.createdAt ?? b.at ?? '').localeCompare(String(a.updatedAt ?? a.createdAt ?? a.at ?? '')))
    .map((n) => text(n.title || n.form?.values?.where || String(n.text ?? '').split('\n')[0], 80))
    .filter(Boolean);
  return { visions, todos: open, goals, acts: acts.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((a) => text(actName(a), 60)).filter(Boolean), friends: people, stars, done };
}

/** The groups for one question: [{ kind, label, items }], empty groups left out; [] for a question without connections. */
export function groupsFor(qid, sources, { tr = (s) => s, max = MAX_PER_KIND } = {}) {
  const seen = new Set();
  return (CONNECT[qid] ?? [])
    .map((kind) => ({ kind, label: tr(LABELS[kind]), items: (sources?.[kind] ?? []).filter((s) => !seen.has(s) && seen.add(s)).slice(0, max) }))
    .filter((g) => g.items.length);
}

/** What a tap does to the answer field: an empty field takes the words; a filled one gets them added after « · » (never twice). */
export function withLink(value, item) {
  const v = String(value ?? '').trim();
  if (!v) return item;
  if (v.split(' · ').includes(item)) return v;
  return `${v} · ${item}`.slice(0, 500);
}
