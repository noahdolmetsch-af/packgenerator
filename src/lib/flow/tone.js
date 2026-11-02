/**
 * «Meilensteine aktiver machen» PR 3 (Noah 01.11.2026 «3a»): the tone of the app's little words around stars and
 * reminders: Aus (nothing extra), Ruhig, Lustig (start). Plain module (no runes).
 * Setting `starTone` = { tone: 'off' | 'calm' | 'funny' }.
 */
export const TONE_KEY = 'starTone';
export const TONES = ['off', 'calm', 'funny'];
export const DEFAULT_TONE = 'funny';

/** The tone made safe; anything unknown is the start tone. */
export function toneOf(v) {
  const x = v && typeof v === 'object' ? v.tone : v;
  return TONES.includes(x) ? x : DEFAULT_TONE;
}

/** Sayings after a new star (keys go through t()). {sport} is the sport's name. */
export const SAYINGS = {
  funny: [
    'Another star. Your couch is taking it personally.',
    '{sport} says thank you, and so does your future self.',
    'Look at you, collecting stars like a magpie.',
    'That star was not going to earn itself.',
    'Legs, lungs and calendar agree: well done.',
    'Star number {k}: officially unstoppable. Unofficially a bit sweaty.',
  ],
  calm: [
    'Step by step, this is how it grows.',
    'A quiet star, well earned.',
    'Stars stay. So does what you built.',
    'Steady beats fast. Nicely done.',
    'You showed up again and again. That is the whole secret.',
  ],
};

/** Sayings for «Schon lange nicht» (the sub line of the card). */
export const NUDGES = {
  funny: ['{sport} is waving from the corner. Ten easy minutes are enough.', '{sport} misses you. Even a short tick counts.', 'Your shoes are asking questions. Ten minutes of {sport}?'],
  calm: ['Ten easy minutes are enough for a tick.', 'A short start is a good start.'],
};

const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** A saying for a tone, steady for the same seed (the same star keeps its words), '' for Aus. */
export function pick(pool, tone, seed = '') {
  const list = pool[tone];
  return list?.length ? list[hash(seed) % list.length] : '';
}

/** The stage names by family of sport (seven each); other sports keep the standard names (flowms STAGES). */
export const FAMILY_STAGES = {
  ride: ['First pedal|stage ride', 'Regular rider|stage ride', 'Road feeling|stage ride', 'Strong legs|stage ride', 'Long rides|stage ride', 'Master of the road|stage ride', 'Endless road|stage ride'],
  run: ['First steps|stage run', 'Running habit|stage run', 'Own pace|stage run', 'Strong stride|stage run', 'Long breath|stage run', 'Master runner|stage run', 'Endless trail|stage run'],
  climb: ['First hold|stage climb', 'Grip habit|stage climb', 'Trust the wall|stage climb', 'Strong fingers|stage climb', 'Calm on the wall|stage climb', 'Master climber|stage climb', 'Summit way|stage climb'],
  strength: ['First rep|stage strength', 'Training habit|stage strength', 'Solid base|stage strength', 'Real strength|stage strength', 'Iron calm|stage strength', 'Master of strength|stage strength', 'Strong for life|stage strength'],
  game: ['First rally|stage game', 'Game habit|stage game', 'Good feeling|stage game', 'Sharp play|stage game', 'Cool head|stage game', 'Master of the game|stage game', 'Game for life|stage game'],
};
const ICON_FAMILY = { bike: 'ride', spin: 'ride', run: 'run', walk: 'run', climb: 'climb', pushup: 'strength', gym: 'strength', tennis: 'game', hockey: 'game' };
/** 'ride' | 'run' | … for a sport by its icon, null for the rest. */
export const familyOf = (act) => ICON_FAMILY[act?.icon] ?? null;
/** The key of star k's stage for a sport (a fitting one, else null = the standard name). */
export const stageKey = (act, k) => FAMILY_STAGES[familyOf(act)]?.[Math.max(0, Math.min(6, k - 1))] ?? null;
