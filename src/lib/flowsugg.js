/**
 * Hobby pages, package 1 (mockup A, Noah H18a, H19a, H20a): what Aktiv › Aktivität suggests by itself.
 *   «Weitere Aktionen»: at most 8 small actions without their own page, by day, weather and rings,
 *     each one can be hidden (setting flow.hiddenSugg). One tap ticks it; a suggestion that is not an
 *     activity yet becomes one (changeable and deletable in the editor).
 *   «Erholen und Spass»: Sauna and Spaziergang always there, 13 ideas to tap and add.
 *   «Verbindungen»: weather is there, the rest is planned (shown grey).
 * Pure functions; the words are English keys for t().
 */
import { normAct, actState, addDays } from './flow.js';

export const HIDDEN_KEY = 'flow.hiddenSugg';
export const MAX_SUGG = 8;

/** Small actions that can become an activity when tapped (fictional defaults, all changeable). */
export const SUGG_TEMPLATES = {
  cold: { id: 'cold', name: 'Cold shower', nameDe: 'Kalt duschen', icon: 'waves', ring: 'rest' },
  breath: { id: 'breath', name: 'Breathing exercise', nameDe: 'Atemübung', icon: 'leaf', ring: 'mind' },
  miniworkout: { id: 'miniworkout', name: 'Mini workout', nameDe: 'Mini-Workout', icon: 'stretch', ring: 'move' },
  plank: { id: 'plank', name: 'Plank', nameDe: 'Plank', icon: 'pushup', ring: 'move' },
};
/** Minutes a suggestion takes (a hint on the row). */
const MINUTES = { stretch: 10, walk: 20, breath: 5, miniworkout: 7, plank: 1, run: 30, sauna: 60 };

/** The 13 ideas of «Erholen und Spass» (Noah 10.10.2026, 15:37); a tap adds one as an activity. */
export const FUN_IDEAS = [
  { id: 'cold', name: 'Cold shower / cold water', nameDe: 'Kalt duschen / Kaltwasser', icon: 'waves', ring: 'rest' },
  { id: 'massage', name: 'Massage / foam roller', nameDe: 'Massage / Faszienrolle', icon: 'heart', ring: 'rest' },
  { id: 'nap', name: 'Nap', nameDe: 'Nickerchen', icon: 'moon', ring: 'rest' },
  { id: 'readout', name: 'Reading outside', nameDe: 'Lesen draussen', icon: 'leaf', ring: 'rest' },
  { id: 'swim', name: 'Swimming / river', nameDe: 'Schwimmen / Aare', icon: 'swim', ring: 'move' },
  { id: 'dance', name: 'Dancing', nameDe: 'Tanzen', icon: 'heart', ring: 'move' },
  { id: 'cafe', name: 'Bike café ride', nameDe: 'Velo-Café-Runde', icon: 'bike', ring: 'move' },
  { id: 'sunrise', name: 'Sunrise', nameDe: 'Sonnenaufgang', icon: 'leaf', ring: 'mind' },
  { id: 'games', name: 'Games night', nameDe: 'Spielabend', icon: 'heart', ring: 'rest' },
  { id: 'friends', name: 'Family / friends outside', nameDe: 'Familie / Freunde draussen', icon: 'walk', ring: 'rest' },
  { id: 'nature', name: 'Nature without a goal', nameDe: 'Natur ohne Ziel', icon: 'walk', ring: 'rest' },
  { id: 'breath', name: 'Breathing exercise', nameDe: 'Atemübung', icon: 'leaf', ring: 'mind' },
  { id: 'detox', name: 'Digital detox evening', nameDe: 'Digital-Detox-Abend', icon: 'moon', ring: 'rest' },
];
/** Always in «Erholen und Spass» (H19a). */
export const ALWAYS = ['sauna', 'walk'];

/** A new activity from a template or an idea: a gentle goal (1× in 7 days), all changeable. */
export function actFromTemplate(tpl, acts = []) {
  const order = acts.reduce((m, a) => Math.max(m, Number(a.order) || 0), -1) + 1;
  return normAct({ ...tpl, goals: [{ id: 'g', count: 1, days: 7 }], order, fromIdea: true });
}

/** The ideas not added yet (an activity with the same id exists = added). */
export const openIdeas = (acts = []) => FUN_IDEAS.filter((i) => !acts.some((a) => a.id === i.id));

/**
 * At most 8 suggestions: [{ id, act? (existing), tpl? (to add), min?, key, vars, score }].
 * acts, log (recent), today, hour (0–23, Zurich), dry (true/false/null: today's home weather),
 * rings (flow.js rings()), favs (ids of the tiles), hidden (ids).
 */
export function suggestions({ acts = [], log = [], today, hour = 12, dry = null, rings = null, favs = [], hidden = [], tripDays = [] }) {
  const list = acts.map(normAct).filter((a) => !a.paused);
  const byId = new Map(list.map((a) => [a.id, a]));
  const exists = new Set(acts.map((a) => a.id)); // a paused one is not suggested and not made again
  const fav = new Set(favs);
  const moveOpen = rings ? rings.move.n < rings.move.of : true;
  const daysAgo = (id) => {
    const last = log.filter((e) => e.actId === id).reduce((m, e) => (e.day > m ? e.day : m), '');
    return last ? Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${last}T00:00:00Z`)) / 864e5) : null;
  };
  const did = (id, day) => log.some((e) => e.actId === id && e.day === day);
  const out = [];
  const add = (id, key, vars, score) => {
    if (hidden.includes(id) || fav.has(id) || out.some((x) => x.id === id)) return;
    const act = byId.get(id) ?? null;
    if (!act && exists.has(id)) return;
    const tpl = act ? null : SUGG_TEMPLATES[id] ?? null;
    if (!act && !tpl) return;
    out.push({ id, act, tpl, min: MINUTES[id] ?? null, key, vars, score });
  };

  // the special ones first, with a reason that fits the day
  if (byId.has('stretch')) {
    const twoBike = did('bike', today) || (did('bike', addDays(today, -1)) && did('bike', addDays(today, -2)));
    add('stretch', twoBike ? 'after 2 cycling days' : moveOpen ? 'Move ring still open' : 'good for the back', {}, twoBike ? 9 : 6);
  }
  add('cold', did('cold', today) ? 'done today' : 'not yet today', {}, did('cold', today) ? 1 : 5);
  if (byId.has('walk')) add('walk', dry === true ? 'dry today: good for outside' : dry === false ? 'short, even in the rain' : 'a breath of fresh air', {}, dry === true ? 8 : 5);
  if (byId.has('sauna')) {
    const n = daysAgo('sauna');
    add('sauna', n == null ? 'not yet this season' : n === 0 ? 'done today' : 'last one {n} days ago', { n }, n == null || n >= 5 ? 7 : 3);
  }
  add('breath', hour >= 18 ? 'before going to sleep' : 'for in between', {}, hour >= 18 ? 7 : 4);
  add('miniworkout', moveOpen ? 'Move ring still open' : 'for a short break', {}, moveOpen ? 6 : 3);
  if (fav.has('pushups') || byId.has('pushups')) add('plank', 'goes well with push-ups', {}, 4);
  // the other activities without a tile: an open goal first
  for (const a of list) {
    if (fav.has(a.id) || out.some((x) => x.id === a.id)) continue;
    const s = actState(a, log, today, tripDays);
    if (s.resting) continue;
    add(a.id, s.todayDone ? 'done today' : s.met ? 'goal met' : 'goal still open', {}, s.todayDone ? 0 : s.met ? 1 : 4);
  }
  return out.sort((a, b) => b.score - a.score).slice(0, MAX_SUGG);
}

/**
 * «Verbindungen» (H20a): weather first (it is there), the others planned. weather: { name, max, rain }
 * of today at home, or null. The texts are keys for t().
 */
export function connections(weather) {
  return [
    { id: 'strava', name: 'Strava / Garmin', state: 'planned', key: 'This week from Strava: rides, runs, minutes' },
    { id: 'fitbit', name: 'Fitbit', state: 'planned', key: 'Sleep, resting pulse and HRV: only as an observation, no score' },
    { id: 'ics', name: 'Calendar (.ics)', state: 'planned', key: 'Your next free slots for a session' },
    weather
      ? { id: 'weather', name: 'Weather for outside', state: 'active', key: weather.rain === 'none' ? '{max} °C and dry today: good for outside' : '{max} °C and wet today: maybe indoors', vars: { max: Math.round(weather.max) } }
      : { id: 'weather', name: 'Weather for outside', state: 'setup', key: 'Set your home place under «Me» to see the weather here', href: '#/me' },
    { id: 'intervals', name: 'intervals.icu / TrainingPeaks', state: 'later', key: 'Form and load as a curve, only to look at' },
    { id: 'media', name: 'YouTube / Spotify', state: 'planned', key: 'Playlists and guided sessions as links' },
  ];
}
