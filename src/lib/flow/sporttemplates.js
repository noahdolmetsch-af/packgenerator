/**
 * «Meine Sportarten» (Noah 02.11.2026 «5a»): templates for «New sport». A template only fills the form (name, symbol,
 * ring, goal, minimum duration); everything stays changeable and nothing is saved before «Save». Pure, tested in
 * tests/sporttemplates.test.js. name: English key for t(); the person's own name is typed, never translated.
 */
export const SPORT_TEMPLATES = [
  { key: 'strength', name: 'Strength training|template', icon: 'gym', ring: 'move', count: 2, days: 7, minMin: 30 },
  { key: 'running', name: 'Running|template', icon: 'run', ring: 'move', count: 2, days: 7, minMin: 30 },
  { key: 'swimming', name: 'Swimming|template', icon: 'swim', ring: 'move', count: 1, days: 7, minMin: 30 },
  { key: 'climbing', name: 'Climbing|template', icon: 'climb', ring: 'move', count: 1, days: 7, minMin: 60 },
  { key: 'walk', name: 'Walk|template', icon: 'walk', ring: 'move', count: 1, days: 1, minMin: 15 },
  { key: 'yoga', name: 'Yoga|template', icon: 'yoga', ring: 'mind', count: 2, days: 7, minMin: 15 },
  { key: 'meditation', name: 'Meditation|template', icon: 'lotus', ring: 'mind', count: 1, days: 1, minMin: 10 },
  { key: 'stretching', name: 'Stretching|template', icon: 'stretch', ring: 'rest', count: 3, days: 7, minMin: 15 },
  { key: 'sauna', name: 'Sauna|template', icon: 'sauna', ring: 'rest', count: 1, days: 7, minMin: 0 },
];

/** The fields of a template written into a blank activity (the name is given by the caller, translated). */
export function applyTemplate(act, tpl, name) {
  return { ...act, name, icon: tpl.icon, ring: tpl.ring, minMin: tpl.minMin, goals: [{ id: 'g', count: tpl.count, days: tpl.days }], season: null };
}
