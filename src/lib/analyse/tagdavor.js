/**
 * «Cardio-Belastung» Idee F (Noah 07.11.2026 «alle A–F»): what you did on a day, from every source the app knows:
 * the Fitbit workouts, your ticks in Aktiv and the Strava rides. Used by the column «Am Tag davor». Pure.
 */

/** The name of a Fitbit workout: the name Fitbit gave it, else its type in plain words («MOUNTAIN_BIKING» → «Mountain biking»). */
export function workoutName(e) {
  const name = typeof e?.name === 'string' ? e.name.trim() : '';
  if (name) return name;
  const type = typeof e?.type === 'string' ? e.type.trim() : '';
  if (!type || type === 'OTHER') return '';
  const plain = type.toLowerCase().replace(/_/g, ' ');
  return plain.charAt(0).toUpperCase() + plain.slice(1);
}

/**
 * The names of one day without doubles (Fitbit workouts first, then ticks, then rides), at most `max`:
 * { names, more } with more = how many were left out.
 */
export function doneOn({ ticked = [], rides = [], workouts = [] } = {}, max = 2) {
  const seen = new Set();
  const all = [];
  for (const raw of [...workouts.map(workoutName), ...ticked, ...rides]) {
    const name = typeof raw === 'string' ? raw.trim() : '';
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    all.push(name);
  }
  return { names: all.slice(0, max), more: Math.max(0, all.length - max) };
}

/** «Joggen, Velo +1», or '' when nothing was done. */
export const doneText = ({ names, more }) => (names.length ? names.join(', ') + (more ? ` +${more}` : '') : '');
