/**
 * HG1 «Begrüssung auf Heute» (approved 14.10.2026; answers 1a 2b 3 4b and 1a 2a): the greeting on top of
 * Today and the two quick questions behind it.
 * HG1 1a: the greeting is always Swiss German, whatever the app language. So its words are plain
 * constants here and do not go through t() (a German entry would only repeat them, an English one
 * would be wrong). Other new texts of HG1 go through t() (i18n/de/hg1.js).
 * HG1 4b: Morge 05–11, Tag 11–18, Abig 18–22; 3: Nacht 22–05 only «Guät Nacht, Nachtülä» (no name,
 * no question, no tap line).
 * No imports on purpose: abfragen.js reads HELLO_QUESTIONS from here (the one history knows them).
 * v0.144.0 RE «Eine Tagesuhr» (4a): the hours come from dayclock.js (no imports itself); the morning now
 * starts at 06:00 like everywhere (was 05:00), the night is 22:00–05:59.
 */
import { partOfDay } from '../dayclock.js';

/** HG1: the question after the name. UI-Ziele #15 (Noah 20.10.2026 «freigabe»): short; «Was häsch vor?» became the goal chips under it. */
export const HELLO_ASK = 'wi gahts?';
/** HG1 3: the night, exactly so. */
export const HELLO_NIGHT = 'Guät Nacht, Nachtülä';
/** HG1 4b: the first words by time of day. */
export const HELLO_WORDS = { morning: 'Guete Morge', day: 'Hoi', evening: 'Guete Abig' };

/** HG1 4b with RE 4a: 'morning' 06:00–10:59, 'day' 11:00–17:59, 'evening' 18:00–21:59, 'night' 22:00–05:59 (dayclock.js). */
export const helloPart = (hour) => partOfDay(hour);

/** HG1: «Hoi Lena, wi gahts Dir hüt und was häsch vor?»; without a name «Hoi, wi gahts …»; at night «Guät Nacht, Nachtülä». */
export function greetFor(hour, name = '') {
  const part = helloPart(hour);
  if (part === 'night') return HELLO_NIGHT;
  const who = String(name ?? '').trim();
  return `${HELLO_WORDS[part]}${who ? ` ${who}` : ''}, ${HELLO_ASK}`;
}

/** HG1 2b: the quiet line under the greeting (not at night); UI-Ziele #15: gone on Heute, the greeting itself is the button (kept as its accessible hint). */
export const HELLO_TAP = "antippen: Wie gaht's? / Was häsch vor?";
/** HG1d: the sheet's title, «Hoi Lena» (just «Hoi» without a name). */
export const helloTitle = (name = '') => ['Hoi', String(name ?? '').trim()].filter(Boolean).join(' ');
export const HELLO_MOOD = "Wie gaht's?";
export const HELLO_PLAN = 'Was häsch vor?';
/** HG1d: «+ eigener» (an own plan, written into the field). */
export const HELLO_OWN = 'eigener';

/** HG1d: five calm answers, one neutral colour, observation only (the value only orders them). */
export const MOODS = [
  { key: 'muede', label: 'Müed', v: 0 },
  { key: 'gahtso', label: 'Gaht so', v: 0.25 },
  { key: 'okay', label: 'Okay', v: 0.5 },
  { key: 'guet', label: 'Guet', v: 0.75 },
  { key: 'super', label: 'Super', v: 1 },
];
/** HG1d: the plans as chips (several at once). */
export const PLANS = [
  { key: 'tour', label: 'Tour' },
  { key: 'training', label: 'Training' },
  { key: 'ruhetag', label: 'Ruhetag' },
  { key: 'arbeit', label: 'Arbeit' },
];

/**
 * HG1 2b: the two questions in the shape of «Deine Abfragen» (abfragen.js), so the answers land in its
 * ONE history and show there like any answer. They are not in the list of 50 and never asked on their own
 * (every: off); only the tap on the greeting asks them.
 */
export const HELLO_QUESTIONS = [
  { id: 'hallo.gaht', area: 'spass', key: 'gaht', text: HELLO_MOOD, form: { kind: 'chips', options: MOODS }, every: { kind: 'off' }, src: ['hand'], hello: true },
  { id: 'hallo.vor', area: 'ziele', key: 'vor', text: HELLO_PLAN, form: { kind: 'chips', options: PLANS, multi: true, note: true }, every: { kind: 'off' }, src: ['hand'], hello: true },
];

/** HG1b: the settings record that says the name was asked once («Nicht jetzt» or «Speichern»). */
export const NAME_ASKED_KEY = 'userName.asked';
