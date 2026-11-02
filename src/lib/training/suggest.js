/**
 * «Training verbessern» 2 (Noah 2.11.2026): a suggestion for the training week, built from the goal (hours per
 * week, share in Z1–Z2), the next race, today's readiness and the sports the person wants each week in Aktiv.
 * It always says why. Pure: nothing here reads the clock or the database. Everything is a suggestion; the
 * sessions it writes are ordinary sessions of the week plan (src «sug») that can be changed or removed.
 */
import { shiftDay, weekOf } from '../training.js';
import { activeGoals } from '../flow.js';

export const SRC = 'sug'; // src of a session written by a suggestion
export const VARIANTS = 3; // «more suggestions»: three layouts of the week
const NOT_SPORTS = ['bike', 'spin', 'run', 'meditation', 'sauna']; // the core kinds and the quiet ones are not «sports of the week»

/** The sports of Aktiv the person wants this week: [{ id, name, mins, perWeek }], at most three. */
export function weeklySports(acts = [], monday) {
  return acts
    .filter((a) => a && !a.paused && a.ring === 'move' && !NOT_SPORTS.includes(a.id))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((a) => {
      const goals = activeGoals(a, monday);
      const perWeek = Math.min(2, Math.round(goals.reduce((s, g) => s + (g.count * 7) / Math.max(1, g.days), 0)));
      return { id: a.id, name: a.name, nameDe: a.nameDe, mins: a.minMin > 0 ? a.minMin : 45, perWeek };
    })
    .filter((s) => s.perWeek >= 1)
    .slice(0, 3);
}

/** Roles of the core sessions: [dow (0 = Monday), share of the core minutes, role]. */
const LAYOUTS = [
  [[1, 0.2, 'easy'], [3, 0.2, 'quality'], [5, 0.45, 'long'], [6, 0.15, 'spin']],
  [[2, 0.25, 'easy'], [4, 0.2, 'quality'], [6, 0.55, 'long']],
  [[1, 0.3, 'quality'], [3, 0.3, 'easy'], [5, 0.4, 'long']],
];
const FREE = [[0, 2, 4], [0, 1, 3, 5], [0, 2, 4, 6]]; // days for the sports of each layout
const NAMES = { easy: 'Easy endurance session', quality: 'Tempo session', long: 'Long session, calm', spin: 'Easy spin', mid: 'Endurance session' };

const round5 = (x) => Math.max(5, Math.round(x / 5) * 5);

/**
 * The suggestion for the week starting on monday. Input: { monday, today, goal, daysToRace (null without a race),
 * level ('rest' | 'easy' | 'normal' | 'hard' | null, today's readiness), recentMins (minutes per week of the last
 * weeks, or null), mainKind ('bike' …), sports (weeklySports), variant (0–2), nameOf (a sport's name in the language shown) }.
 * Output: { sessions, why: [{ key, vars }], mins } (why: English keys for t()).
 */
export function suggestWeek({ monday, today, goal = null, daysToRace = null, level = null, recentMins = null, mainKind = 'bike', sports = [], variant = 0, nameOf = (s) => s.name } = {}) {
  const v = ((variant % VARIANTS) + VARIANTS) % VARIANTS;
  const why = [];
  let hours;
  if (goal?.hours) {
    hours = goal.hours;
    why.push({ key: 'About {n} h this week, from your goal.', vars: { n: hours } });
  } else if (recentMins) {
    hours = Math.min(12, Math.max(2, Math.round((recentMins / 60) * 2) / 2));
    why.push({ key: 'About {n} h this week, like your last weeks.', vars: { n: hours } });
  } else {
    hours = 6;
    why.push({ key: 'About {n} h this week. Set a goal to change it.', vars: { n: hours } });
  }
  let factor = 1;
  const raceWeek = daysToRace != null && daysToRace >= 0 && daysToRace <= 7;
  if (raceWeek) (factor = 0.5), why.push({ key: 'Your race is close: a lighter week.', vars: {} });
  else if (daysToRace != null && daysToRace > 7 && daysToRace <= 14) (factor = 0.75), why.push({ key: 'Two weeks to your race: a little less.', vars: {} });
  if (level === 'rest') (factor *= 0.6), why.push({ key: 'You are tired today: less.', vars: {} });
  else if (level === 'easy') (factor *= 0.8), why.push({ key: 'You are a little tired today: a bit less.', vars: {} });
  const total = Math.round(hours * 60 * factor);

  const free = FREE[v];
  const sportSessions = [];
  const taken = new Set(LAYOUTS[v].map((d) => d[0]));
  const slots = free.filter((d) => !taken.has(d));
  sports.forEach((s) => {
    for (let i = 0; i < s.perWeek && slots.length; i++) sportSessions.push({ dow: slots.shift(), sport: s, mins: s.mins });
  });
  // sports take at most a third of the time
  let sportMin = sportSessions.reduce((a, s) => a + s.mins, 0);
  while (sportSessions.length && sportMin > total / 3) sportMin -= sportSessions.pop().mins;
  if (sportSessions.length) why.push({ key: 'Your sports: {names}.', vars: { names: [...new Set(sportSessions.map((s) => nameOf(s.sport)))].join(', ') } });

  const core = Math.max(30, total - sportMin);
  const base = goal?.base ?? 80;
  const days = weekOf(monday);
  const rows = LAYOUTS[v].map(([dow, share, role]) => ({ dow, mins: round5(core * share), role, zone: role === 'long' || role === 'easy' ? 2 : role === 'spin' ? 1 : 3 }));
  // keep the share in Z1–Z2 near the goal: a tempo session becomes an endurance one when the share would be too low
  const low = () => Math.round((rows.filter((r) => r.zone <= 2).reduce((a, r) => a + r.mins, 0) / Math.max(1, rows.reduce((a, r) => a + r.mins, 0))) * 100);
  const q = rows.find((r) => r.role === 'quality');
  if (q && low() < base) (q.zone = 2), (q.role = 'mid');
  const sessions = [
    ...rows.map((r) => ({ day: days[r.dow], kind: mainKind, name: NAMES[r.role], mins: r.mins, zone: r.zone })),
    ...sportSessions.map((s) => ({ day: days[s.dow], kind: 'other', sport: s.sport.id, name: '', mins: s.mins, zone: null })),
  ]
    .sort((a, b) => a.day.localeCompare(b.day))
    .filter((s) => s.day >= today)
    .map((s, i) => ({ ...s, id: `${SRC}-${s.day}-${i}`, src: SRC }));
  if (sessions.length < rows.length + sportSessions.length) why.push({ key: 'Days that have passed are left out.', vars: {} });
  why.push({ key: 'About {n} % in Z1–Z2 (your goal: {goal} %).', vars: { n: low(), goal: base } });
  return { sessions, why, mins: sessions.reduce((a, s) => a + s.mins, 0), shiftTo: shiftDay(monday, 7) };
}
