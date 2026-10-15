/**
 * TR5–TR7 «Analysen» (Noah 14.10.2026 «TR5–TR7 freigegeben»): every analysis card can be hidden on its
 * own («…» › Ausblenden, with Rückgängig), moved up or down, and switched back on in «Analysen anpassen».
 * One setting for all activities. Pure rules; the live state is analyses.svelte.js.
 *
 * Stored in db.settings under ANA_KEY: { hidden: [key], order: { act: [key], week: [key], weight: [key] } }.
 * head: the card's own heading where it is longer than the name in «Analysen anpassen».
 * A key the app does not know (any more) is dropped; a new one shows, at the end of its group.
 */
export const ANA_KEY = 'training.analyses';

/** The analyses per group, in their first order. title/sub are English sources for t(). */
export const ANALYSES = {
  act: [
    { key: 'more', title: 'More from the power', sub: 'W/kg, kJ, IF, VI' },
    { key: 'pzbars', title: 'Power zones as bars', sub: 'Minutes' },
    { key: 'cadence', title: 'Cadence spread', sub: 'Bars' },
    { key: 'climbs', head: 'Climbs of this ride', title: 'Climbs', sub: 'VAM per climb' },
    { key: 'sections', title: 'Sections|ana', sub: 'Table per 5 km' },
    { key: 'timeline', title: 'Course', sub: 'Elevation, heart rate and power' },
    { key: 'grid', title: 'Heart rate by power', sub: 'Grid in minutes' },
    { key: 'halves', title: 'First against second half', sub: 'Bars and one sentence' },
    { key: 'similar', title: 'Similar rides', sub: 'Dots' },
    { key: 'best', title: 'Best values', sub: 'Table' },
    // «Mehr Inhalt» (Noah 15.10.2026 «1-5 a»): T2 hard pieces, T5 the same route over time
    { key: 'intervals', head: 'Hard pieces of this ride', title: 'Intervals', sub: 'Found from the power' },
    { key: 'homeloop', head: 'Your home loop over time', title: 'Home loop', sub: 'Same route, time, power and heart rate' },
  ],
  week: [
    { key: 'form', head: 'Fitness, fatigue and form', title: 'Fitness, fatigue, form', sub: 'Lines' },
    { key: 'wload', title: 'Load per week', sub: 'Bars' },
    { key: 'pcurve', head: 'Power curve: 90 days against the year', title: 'Power curve 90 days / year', sub: 'Lines' },
    { key: 'eff', head: 'Efficiency: watts per heartbeat', title: 'Efficiency', sub: 'Watts per heartbeat' },
    { key: 'month', title: 'Month against month', sub: 'Bars' },
    { key: 'year', title: 'Year against year', sub: 'Bars' },
    // «Mehr Inhalt» (Noah 15.10.2026 «1-5 a»): T1 plan kept, T3 endurance check, T4 FTP over the months
    { key: 'plan', head: 'Plan kept?', title: 'Plan kept', sub: 'Planned zone against ridden zone' },
    { key: 'decouple', head: 'Endurance check', title: 'Endurance check', sub: 'Heart rate drift at the same power' },
    { key: 'ftp', head: 'FTP over the months', title: 'FTP over the months', sub: 'Estimated from your best 20 minutes' },
  ],
  weight: [
    { key: 'wtime', title: 'Weight over time', sub: 'Dots and 7-day mean' },
    { key: 'wkgtime', title: 'Watts per kg over time', sub: 'Line' },
  ],
};
export const GROUPS = Object.keys(ANALYSES);
export const GROUP_NAMES = { act: 'On the activity', week: 'In the week', weight: 'Weight|place' };
const ALL = new Set(GROUPS.flatMap((g) => ANALYSES[g].map((a) => a.key)));
export const groupOf = (key) => GROUPS.find((g) => ANALYSES[g].some((a) => a.key === key)) ?? null;
export const anaOf = (key) => ANALYSES[groupOf(key)]?.find((a) => a.key === key) ?? null;

/** The stored value, cleaned. */
export function anaState(v) {
  const hidden = Array.isArray(v?.hidden) ? [...new Set(v.hidden.filter((k) => ALL.has(k)))] : [];
  const order = {};
  for (const g of GROUPS) {
    const known = ANALYSES[g].map((a) => a.key);
    const saved = Array.isArray(v?.order?.[g]) ? v.order[g].filter((k) => known.includes(k)) : [];
    order[g] = [...new Set([...saved, ...known])];
  }
  return { hidden, order };
}

/** The keys of a group in their order; shown only the ones not hidden (shownOnly). */
export const keysOf = (state, group, shownOnly = true) => state.order[group].filter((k) => !shownOnly || !state.hidden.includes(k));

/** Hide or show one. */
export const setShown = (state, key, on) => ({ ...state, hidden: on ? state.hidden.filter((k) => k !== key) : [...new Set([...state.hidden, key])] });

/** One place up (-1) or down (+1) among the shown ones of its group; the hidden ones keep their place. */
export function move(state, key, dir) {
  const g = groupOf(key);
  if (!g) return state;
  const shown = keysOf(state, g);
  const i = shown.indexOf(key);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= shown.length) return state;
  const list = [...state.order[g]];
  const a = list.indexOf(key);
  const b = list.indexOf(shown[j]);
  [list[a], list[b]] = [list[b], list[a]];
  return { ...state, order: { ...state.order, [g]: list } };
}

/** «Wie am Anfang»: everything shown, the first order (of the groups given). */
export function reset(state, groups = GROUPS) {
  const keys = new Set(groups.flatMap((g) => ANALYSES[g].map((a) => a.key)));
  const order = { ...state.order };
  for (const g of groups) order[g] = ANALYSES[g].map((a) => a.key);
  return { hidden: state.hidden.filter((k) => !keys.has(k)), order };
}
