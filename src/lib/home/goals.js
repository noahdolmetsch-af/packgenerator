/**
 * UI-Ziele I2 / #17 (Noah 20.10.2026 «freigabe für alles»): the way in over the goal. Chips under the greeting
 * («Heute fahren», «Tour planen», «Velo schrauben», «Woche planen»); one tap starts the fitting flow with a
 * preselection. Every chip can be switched off and moved (arrows and drag, «Startseite anpassen»).
 * Stored in db.settings «homeGoals» = { order: [key …], off: [key …] } (in every backup).
 * Pure functions, tested in tests/goals.test.js.
 */
export const GOALS_KEY = 'homeGoals';

/** Every chip, in the ready order; `on`: shown without a stored choice. */
export const GOALS = [
  { key: 'ride', label: 'Ride today|goal', on: true },
  { key: 'trip', label: 'Plan a trip|goal', on: true },
  { key: 'care', label: 'Work on the bike|goal', on: true, href: '#/bikes?tab=care' },
  { key: 'week', label: 'Plan the week|goal', on: true, href: '#/week' },
  { key: 'diary', label: 'Write in the diary|goal', on: false, href: '#/tagebuch?neu' },
];
const BY = Object.fromEntries(GOALS.map((g) => [g.key, g]));

/** The chips in their order with on/off: the stored order first (unknown keys dropped), new chips after. → [{ …goal, on }] */
export function goalsOf(value) {
  const order = Array.isArray(value?.order) ? value.order.filter((k, i, a) => BY[k] && a.indexOf(k) === i) : [];
  const keys = [...order, ...GOALS.map((g) => g.key).filter((k) => !order.includes(k))];
  const off = Array.isArray(value?.off) ? value.off : [];
  // a chip the stored order knows is on unless switched off; a chip that came later starts as it comes
  return keys.map((k) => ({ ...BY[k], on: order.includes(k) ? !off.includes(k) : BY[k].on }));
}

/** The record to store for a list of chips. */
export const goalsRecord = (list) => ({ order: list.map((g) => g.key), off: list.filter((g) => !g.on).map((g) => g.key) });

/** Move chip `from` to place `to`. */
export function moveGoal(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const out = [...list];
  const [g] = out.splice(from, 1);
  out.splice(to, 0, g);
  return out;
}
/** Switch a chip on or off. */
export const toggleGoal = (list, key) => list.map((g) => (g.key === key ? { ...g, on: !g.on } : g));
