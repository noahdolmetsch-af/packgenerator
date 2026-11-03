/**
 * «Training verbessern» 2 (Noah 2.11.2026): a suggestion for the training week, built from the goal (hours per
 * week, share in Z1–Z2), the next race, today's readiness and the sports the person wants each week in Aktiv.
 * It always says why. Pure: nothing here reads the clock or the database. Everything is a suggestion; the
 * sessions it writes are ordinary sessions of the week plan (src «sug») that can be changed or removed.
 */
import { shiftDay, weekOf } from '../training.js';
import { activeGoals } from '../flow.js';

export const SRC = 'sug'; // src of a session written by a suggestion
export const FOCUS = ['cardio', 'hit', 'kraft', 'ruhe']; // Ausdauer, Intervalle, Kraft, Erholung
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
const NAMES = { hit: 'Interval session', strength: 'Strength session', easy: 'Easy endurance session', quality: 'Tempo session', long: 'Long session, calm', spin: 'Easy spin', mid: 'Endurance session' };

const round5 = (x) => Math.max(5, Math.round(x / 5) * 5);

/**
 * The suggestion for the week starting on monday. Input: { monday, today, goal, daysToRace (null without a race),
 * level ('rest' | 'easy' | 'normal' | 'hard' | null, today's readiness), recentMins (minutes per week of the last
 * weeks, or null), mainKind ('bike' …), sports (weeklySports), variant (0–2), nameOf (a sport's name in the language shown), hoursSet (hours per week the person chose, else null), push (−1 easier, 0, +1 harder), focus (one of FOCUS), strengthSport (id of a strength sport of Aktiv, or null), dayLimits ({ [dow 0 = Monday]: max minutes, 0 = keep the day free }) }.
 * Output: { sessions, why: [{ key, vars }], mins } (why: English keys for t()).
 */
export function suggestWeek({ monday, today, goal = null, daysToRace = null, level = null, recentMins = null, mainKind = 'bike', sports = [], variant = 0, nameOf = (s) => s.name, hoursSet = null, push = 0, focus = 'cardio', strengthSport = null, dayLimits = {} } = {}) {
  const v = ((variant % VARIANTS) + VARIANTS) % VARIANTS;
  const why = [];
  let hours;
  if (hoursSet) {
    hours = hoursSet; // set by the person with + / −
  } else if (goal?.hours) {
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
  // «Härter, Leichter, Fokus»: a bit more or less time and effort; the focus changes the kind of week
  const pushed = Math.max(-1, Math.min(1, Math.round(push)));
  if (pushed === 1) (factor *= 1.15), why.push({ key: 'Harder: a little more time, more effort in the hard session.', vars: {} });
  if (pushed === -1) (factor *= 0.8), why.push({ key: 'Easier: a little less time and a calmer hard session.', vars: {} });
  const foc = FOCUS.includes(focus) ? focus : 'cardio';
  if (foc === 'ruhe') (factor *= 0.6), why.push({ key: 'Focus recovery: short and calm.', vars: {} });
  if (foc === 'hit') why.push({ key: 'Focus intervals: two hard sessions, the rest easy.', vars: {} });
  if (foc === 'kraft') why.push({ key: 'Focus strength: two strength sessions, easy riding.', vars: {} });
  if (foc === 'cardio') why.push({ key: 'Focus endurance: mostly calm sessions and a long one.', vars: {} });
  const total = Math.round(hours * 60 * factor);

  const limit = (dow) => (dow in dayLimits && Number.isFinite(dayLimits[dow]) ? Math.max(0, dayLimits[dow]) : Infinity);
  const isOff = (dow) => limit(dow) === 0;
  const free = FREE[v].filter((d) => !isOff(d));
  const sportSessions = [];
  const taken = new Set(LAYOUTS[v].map((d) => d[0]).filter((d) => !isOff(d)));
  const slots = free.filter((d) => !taken.has(d));
  sports.forEach((s) => {
    for (let i = 0; i < s.perWeek && slots.length; i++) sportSessions.push({ dow: slots.shift(), sport: s, mins: s.mins });
  });
  // sports take at most a third of the time
  let sportMin = sportSessions.reduce((a, s) => a + s.mins, 0);
  while (sportSessions.length && sportMin > total / 3) sportMin -= sportSessions.pop().mins;

  // focus strength: two strength sessions on free days (a sport of Aktiv when there is one)
  const strength = [];
  if (foc === 'kraft') {
    const free2 = free.filter((d) => !taken.has(d) && !sportSessions.some((x) => x.dow === d));
    free2.slice(0, 2).forEach((dow) => strength.push({ dow, mins: 40 }));
    sportMin += strength.length * 40;
  }
  const core = Math.max(30, total - sportMin);
  const base = goal?.base ?? 80;
  const days = weekOf(monday);
  let rows = LAYOUTS[v].map(([dow, share, role]) => ({ dow, mins: round5(core * share), role, zone: role === 'long' || role === 'easy' ? 2 : role === 'spin' ? 1 : 3 }));
  // days the person keeps free: the session moves to the nearest day that is open and unused, or falls away
  const keptFree = rows.filter((r) => isOff(r.dow));
  if (keptFree.length) {
    const used = new Set([...rows.filter((r) => !isOff(r.dow)).map((r) => r.dow), ...sportSessions.map((x) => x.dow), ...strength.map((x) => x.dow)]);
    rows = rows.filter((r) => !isOff(r.dow));
    let lost = 0;
    keptFree.forEach((r) => {
      const to = [0, 1, 2, 3, 4, 5, 6].filter((d) => !used.has(d) && !isOff(d)).sort((a, b) => Math.abs(a - r.dow) - Math.abs(b - r.dow) || a - b)[0];
      if (to == null) return void lost++;
      used.add(to);
      rows.push({ ...r, dow: to });
    });
    why.push({ key: 'Your free days stay free.', vars: {} });
    if (lost) why.push({ key: 'No day was left for {n} session(s): they are left out.', vars: { n: lost } });
  }
  const capped = Object.keys(dayLimits).some((d) => limit(+d) > 0 && limit(+d) < Infinity);
  if (capped) why.push({ key: 'On days with little time the sessions are shorter.', vars: {} });
  // keep the share in Z1–Z2 near the goal: a tempo session becomes an endurance one when the share would be too low
  const low = () => Math.round((rows.filter((r) => r.zone <= 2).reduce((a, r) => a + r.mins, 0) / Math.max(1, rows.reduce((a, r) => a + r.mins, 0))) * 100);
  const q = rows.find((r) => r.role === 'quality');
  if (foc === 'hit') {
    // two hard sessions: the tempo one and the first easy one become intervals
    const second = rows.find((r) => r.role === 'easy');
    [q, second].filter(Boolean).forEach((r) => ((r.role = 'hit'), (r.zone = 4)));
  } else if (foc === 'ruhe' || foc === 'kraft') {
    if (q) (q.zone = 2), (q.role = 'mid');
  } else if (q && low() < base) (q.zone = 2), (q.role = 'mid');
  // harder / easier moves the hard sessions one zone
  rows.filter((r) => r.zone >= 3).forEach((r) => (r.zone = Math.max(2, Math.min(5, r.zone + pushed))));
  rows.forEach((r) => {
    if (r.role === 'quality' && r.zone <= 2) r.role = 'mid';
    else if (r.role === 'quality' && r.zone >= 4) r.role = 'hit';
  });
  const sessions = [
    ...rows.map((r) => ({ day: days[r.dow], kind: mainKind, name: NAMES[r.role], mins: r.mins, zone: r.zone })),
    ...strength.map((x) => ({ day: days[x.dow], kind: 'other', sport: strengthSport || undefined, name: strengthSport ? '' : NAMES.strength, mins: x.mins, zone: null })),
    ...sportSessions.map((s) => ({ day: days[s.dow], kind: 'other', sport: s.sport.id, name: '', mins: s.mins, zone: null })),
  ]
    .map((s) => ({ ...s, mins: Math.max(5, Math.min(s.mins, limit(days.indexOf(s.day)))) }))
    .sort((a, b) => a.day.localeCompare(b.day))
    .filter((s) => s.day >= today)
    .map((s, i) => ({ ...s, id: `${SRC}-${s.day}-${i}`, src: SRC }));
  why.push({ key: 'About {n} % in Z1–Z2 (your goal: {goal} %).', vars: { n: low(), goal: base } });
  return { sessions, why, hours, mins: sessions.reduce((a, s) => a + s.mins, 0), shiftTo: shiftDay(monday, 7) };
}
