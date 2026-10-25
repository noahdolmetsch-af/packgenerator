/**
 * Paket C › Können statt nur Besitz (996 Ideen UC-210-I3, UC-138-I2):
 *
 *   Fähigkeitskarte (SKILLS_KEY): next to the numbers, what you can do: skills per sport with a level you
 *     set yourself (to learn, tried, sure, understood) and examples with a day («first tube change on
 *     the road»). [{ id, name, sport, level, examples: [{ day, text }], tripId? }]
 *   Fehlte Wissen statt Material? after a trip: when something went wrong because a guide, the planning
 *     or a skill was missing (not a thing), it becomes a «to learn» card instead of a wish to buy.
 * Pure, tested in tests/ruhig.test.js.
 */
import { clean, isDay, uid, move } from './base.js';

export const SKILLS_KEY = 'ruhig.skills';
export const LEVELS = [
  { key: 'learn', label: 'To learn' },
  { key: 'tried', label: 'Tried' },
  { key: 'sure', label: 'Sure' },
  { key: 'understood', label: 'Understood' },
];
/** What was missing, after a trip (English keys). */
export const MISSING = [
  { key: 'guide', label: 'A guide', hint: 'e.g. how the stove works' },
  { key: 'plan', label: 'The planning', hint: 'e.g. where water is on the route' },
  { key: 'skill', label: 'A skill', hint: 'e.g. fixing a chain' },
];
const levelOk = (l) => (LEVELS.some((x) => x.key === l) ? l : 'learn');

export function skillsOf(value) {
  return (Array.isArray(value) ? value : [])
    .filter((s) => s && s.id && clean(s.name, 80))
    .map((s) => ({
      id: String(s.id),
      name: clean(s.name, 80),
      sport: typeof s.sport === 'string' ? s.sport : '',
      level: levelOk(s.level),
      examples: (Array.isArray(s.examples) ? s.examples : []).filter((e) => e && isDay(e.day) && clean(e.text, 200)).map((e) => ({ day: e.day, text: clean(e.text, 200) })),
      ...(s.tripId ? { tripId: String(s.tripId) } : {}),
      ...(MISSING.some((m) => m.key === s.missing) ? { missing: s.missing } : {}),
    }));
}
export function newSkill({ name, sport = '', level = 'learn', tripId = '', missing = '' }, id = uid('skill')) {
  const n = clean(name, 80);
  return n ? { id, name: n, sport, level: levelOk(level), examples: [], ...(tripId ? { tripId } : {}), ...(MISSING.some((m) => m.key === missing) ? { missing } : {}) } : null;
}
export const changeSkill = (list, id, fn) => list.map((s) => (s.id === id ? fn(s) : s));
export const setLevel = (s, level) => ({ ...s, level: levelOk(level) });
export function addExample(s, day, text) {
  const tx = clean(text, 200);
  return tx && isDay(day) ? { ...s, examples: [{ day, text: tx }, ...s.examples] } : s;
}
export const dropExample = (s, i) => ({ ...s, examples: s.examples.filter((_, k) => k !== i) });
export const moveSkill = move;
/**
 * The map: one column per sport that has skills (the app's sports in their order, then «Everyday»),
 * and per column the count per level. sports: [{ key, name }].
 */
export function skillMap(list, sports) {
  const cols = [...sports, { key: '', name: 'Everyday|skills' }];
  return cols
    .map((sp) => {
      const rows = list.filter((s) => (sp.key ? s.sport === sp.key : !sports.some((x) => x.key === s.sport)));
      return { ...sp, rows, n: Object.fromEntries(LEVELS.map((l) => [l.key, rows.filter((s) => s.level === l.key).length])) };
    })
    .filter((c) => c.rows.length);
}
/** The «to learn» cards that came from one trip. */
export const learnedFrom = (list, tripId) => list.filter((s) => s.tripId === tripId);
