/**
 * «Strava-Namen schöner» (Noah 21.10.2026 «2a»): Strava names an activity the person did not rename
 * «<Morning|Lunch|Afternoon|Evening|Night> <sport>», e.g. «Lunch Mountain Bike Ride». In German the app
 * shows a short German name instead: «MTB am Mittag». Only at display time: the stored name stays as
 * Strava sent it, so a later rename by the person wins and English shows Strava's name unchanged.
 * Any other name (the person's own, already German, only partly matching) stays as it is.
 * The German names are generated, not typed by the person, so they live here and not in t().
 */
// No import of i18n.svelte.js here: plain modules (aktivitaeten.js, spur.js) that e2e specs import load this
// file in Node, where the $state rune does not exist. i18n.svelte.js hands in the current language instead.
let langNow = () => 'en';
/** Set by i18n.svelte.js: a function that returns the current language ('de' or 'en'). */
export function setNameLang(fn) {
  langNow = fn;
}

/** Strava's day part (first word) → German, Swiss spelling. */
const PARTS = { morning: 'am Morgen', lunch: 'am Mittag', afternoon: 'am Nachmittag', evening: 'am Abend', night: 'in der Nacht' };

/** Strava's sport words (after the day part, lower case, single spaces) → a short German word. */
export const SPORTS = {
  ride: 'Velofahrt',
  'mountain bike ride': 'MTB',
  'gravel ride': 'Gravel',
  'e-bike ride': 'E-Bike-Fahrt',
  'e-mountain bike ride': 'E-MTB',
  'virtual ride': 'Indoor-Fahrt',
  'velomobile ride': 'Velomobil-Fahrt',
  'handcycle ride': 'Handbike-Fahrt',
  run: 'Lauf',
  'trail run': 'Traillauf',
  'virtual run': 'Indoor-Lauf',
  walk: 'Spaziergang',
  hike: 'Wanderung',
  swim: 'Schwimmen',
  workout: 'Training',
  'weight training': 'Krafttraining',
  yoga: 'Yoga',
  pilates: 'Pilates',
  hiit: 'HIIT',
  crossfit: 'Crossfit',
  'nordic ski': 'Langlauf',
  'backcountry ski': 'Skitour',
  'alpine ski': 'Skifahren',
  snowboard: 'Snowboarden',
  snowshoe: 'Schneeschuhtour',
  'ice skate': 'Eislaufen',
  'inline skate': 'Inlineskaten',
  'rock climb': 'Klettern',
  'rock climbing': 'Klettern',
  rowing: 'Rudern',
  'virtual row': 'Indoor-Rudern',
  kayaking: 'Kajak',
  canoeing: 'Kanu',
  'stand up paddling': 'SUP',
  'stand up paddle': 'SUP',
  elliptical: 'Crosstrainer',
  'stair-stepper': 'Stepper',
  tennis: 'Tennis',
  golf: 'Golf',
  soccer: 'Fussball',
  activity: 'Aktivität',
};

const RE = /^(morning|lunch|afternoon|evening|night) (.+)$/;

/**
 * The German name for one of Strava's default names, else the name unchanged.
 * lang: 'de' or 'en' (English: always unchanged).
 */
export function deName(name, language = 'de') {
  if (typeof name !== 'string' || language !== 'de') return name;
  const m = RE.exec(name.trim().replace(/\s+/g, ' ').toLowerCase());
  const sport = m ? SPORTS[m[2]] : null;
  return sport ? `${sport} ${PARTS[m[1]]}` : name;
}

/** The name as the app shows it now (current language). */
export const stravaName = (name) => deName(name, langNow());

/** Words to search in: the shown name and Strava's own, so both find the activity. */
export const nameWords = (name) => {
  const shown = stravaName(name);
  return shown === name ? String(name ?? '') : `${shown} ${name}`;
};
