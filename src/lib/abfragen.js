/**
 * AB «Deine Abfragen» (Noah 14.10.2026 00:06:40 «freigabe», AB1–AB6): ONE set of questions instead of
 * the daily check and the weekly weight question (SN2l). 50 playful questions in 10 areas, 31 of them
 * on at the start (00:06:33: the other 19 are off and can be switched on). Every question has its own
 * interval (several times a day, daily, weekly, monthly or off); own questions can be added and removed.
 * «Lustig gefragt, nüchtern gespeichert»: the question may sound funny, the stored value stays plain.
 * Health values are observation only (no judgement words, no colours for good or bad).
 *
 * Pure rules only (tests/abfragen.test.js); reading and writing in abdb.js.
 * A question: { id, area, text (English source, German in i18n/de/abfragen.js), was?, form, every, src }
 *   form:  { kind: 'scale' | 'chips' | 'yesno' | 'number' | 'text', style?: 'battery' | 'emoji',
 *            options?: [{ key, label, v? }], multi?, unit?, note? (a sentence besides the scale) }
 *   every: { kind: 'times', times: ['08:00', …] } | { kind: 'daily', time } | { kind: 'weekly', dow (0 = Sunday), time }
 *          | { kind: 'monthly', time } (the 1st of the month) | { kind: 'off' }
 *   src:   where the value comes from, quiet tags: 'hand', 'fitbit' (filled in from Fitbit, fitbitFill), 'open' (not checked
 *          yet, by hand until then), 'only' (only by hand possible), 'app'
 */
import { addDays } from './flow.js';
import { HELLO_QUESTIONS } from './home/hallo.js'; // HG1 2b: the two questions behind the greeting on Today
import { clockOf } from './dayclock.js';
/** v0.144.0 RE: the day starts at 11:00, the evening at 18:00 (the one day clock). */
const DAY_FROM = clockOf('day');
const EVENING_FROM = clockOf('evening');

/** The settings record of «Deine Abfragen»: { since, q: { [id]: { on, every, since } }, own: [question], rounds }. */
export const AB_KEY = 'abfragen';
/** The settings record of «Jetzt nicht»: { [id]: slot } (the time of the question that was put away). */
export const AB_SNOOZE_KEY = 'abfragen.snooze';

/** The ten areas, in the order of AB5 (Noah's nine categories plus «Körper und Werte» of AB1). */
export const AREAS = [
  { key: 'erholung', name: 'Recovery|area', icon: 'battery-charging' },
  { key: 'spass', name: 'Fun|area', icon: 'smile' },
  { key: 'sport', name: 'Sport|area', icon: 'bike' },
  { key: 'achtsamkeit', name: 'Mindfulness|area', icon: 'flower' },
  { key: 'freunde', name: 'Friends|area', icon: 'users' },
  { key: 'natur', name: 'Nature|area', icon: 'trees' },
  { key: 'visionen', name: 'Visions|area', icon: 'telescope' },
  { key: 'ziele', name: 'Goals|area', icon: 'target' },
  { key: 'erreicht', name: 'Achieved|area', icon: 'trophy' },
  { key: 'koerper', name: 'Body and values|area', icon: 'heart-pulse' },
];
export const AREA = Object.fromEntries(AREAS.map((a) => [a.key, a]));
/** Own questions without an area of their own sit under «Eigene». */
export const OWN_AREA = 'eigene';

// the intervals of the list
const at = (...times) => ({ kind: 'times', times });
const daily = (time) => ({ kind: 'daily', time });
const weekly = (dow, time) => ({ kind: 'weekly', dow, time });
const monthly = (time) => ({ kind: 'monthly', time });
// the answer forms
const scale = (extra = {}) => ({ kind: 'scale', ...extra });
const chips = (options, extra = {}) => ({ kind: 'chips', options: options.map(([key, label, v]) => (v == null ? { key, label } : { key, label, v })), ...extra });
const yesno = (options) => ({ kind: 'yesno', options: options.map(([key, label, v]) => ({ key, label, v })) });
const number = (unit = '') => ({ kind: 'number', unit });
const text = () => ({ kind: 'text' });
const YES = ['yes', 'yes', 1];
const NO = ['no', 'no', 0];

const q = (area, key, textEn, form, every, src = ['hand'], was = null) => ({ id: `${area}.${key}`, area, key, text: textEn, form, every, src, ...(was ? { was } : {}) });

/**
 * The 50 questions (Paket P adds 4 evening questions: 54) (notes/deine-abfragen/lustige-fragen-2026-10-13.md, Noah «ok» 13.10.2026 23:37–23:40).
 * `was` names the earlier question that lives on in it («bisher: …»).
 */
const BASE_QUESTIONS = [
  // 1 Erholung
  q('erholung', 'schlaf', 'How well did you sleep: marmot or zombie?', scale(), daily('07:00'), ['hand', 'fitbit'], 'How well did you sleep?'),
  q('erholung', 'akku', 'How full is your battery right now?', scale({ style: 'battery' }), at('08:00', '13:00', '20:00'), ['hand'], 'How much energy do you have?'),
  q('erholung', 'koerper', 'Does your body feel more like a freshly oiled bike or a rusty chain today?', scale(), daily('08:00'), ['hand'], 'How rested does your body feel?'),
  q('erholung', 'kaffee', 'How many coffees do you need today to be human?', number('cups'), at('12:00', '18:00'), ['only'], 'own question «Coffee»'),
  q('erholung', 'sofa', 'Sofa or saddle: what is your body calling for today?', chips([['sofa', 'Sofa', 0], ['ratherSofa', 'rather sofa', 0.25], ['either', 'either', 0.5], ['ratherSaddle', 'rather saddle', 0.75], ['saddle', 'Saddle', 1]]), daily('08:00')),
  // Paket P «Was mir gut tut» (Noah 19.10.2026 «4a»): fixed in the evening check, each one can be switched off
  q('erholung', 'raeuber', 'What took energy from you today?', chips([['work', 'Work|drain'], ['screen', 'Screen|drain'], ['people', 'People|drain'], ['sleep', 'Little sleep|drain'], ['stress', 'Rush|drain'], ['weather', 'Weather|drain'], ['nothing', 'Nothing|drain']], { multi: true, note: true }), daily('20:00')),
  // 2 Spass
  q('spass', 'grinser', 'How many grins did the day have?', scale(), daily('20:00'), ['hand'], 'How much fun did you have?'),
  q('spass', 'emoji', 'Which emoji was your day today?', chips([['laugh', '😄'], ['cool', '😎'], ['crazy', '🤪'], ['sleepy', '😴'], ['upsideDown', '🙃'], ['starstruck', '🤩']], { style: 'emoji' }), daily('20:00')),
  q('spass', 'stimmung', 'How is the mood: rain cloud or sunglasses?', scale(), daily('13:00'), ['hand'], 'How is your mood?'),
  q('spass', 'coolstes', 'What was the coolest thing today?', chips([['fun', 'Fun'], ['sport', 'Sport|chip'], ['nature', 'Nature'], ['friends', 'Friends'], ['calm', 'Calm'], ['done', 'Done|day'], ['new', 'New']], { multi: true, note: true }), daily('20:00'), ['hand'], 'What was the coolest thing today?'),
  q('spass', 'gelacht', 'Did you laugh out loud today?', yesno([YES, NO, ['often', 'several times', 1]]), daily('20:00')),
  // 3 Sport
  q('sport', 'beine', 'How do your legs feel: gummy bear or turbo?', scale(), daily('08:00'), ['hand'], 'How do body and legs feel?'),
  q('sport', 'hoehenmeter', 'How much climbing would your head have liked today?', chips([['none', 'none|climb', 0], ['hill', 'a hill', 1 / 3], ['pass', 'a pass', 2 / 3], ['all', 'all of them', 1]]), daily('08:00')),
  q('sport', 'ueberholt', 'Did a road bike overtake you today?', chips([['yes', 'yes'], ['no', 'no'], ['passed', 'I overtook']]), daily('20:00')),
  q('sport', 'fit', 'How fit do you feel this week?', scale(), weekly(0, '19:00'), ['hand'], 'Fitness feeling'),
  q('sport', 'bewegung', 'How much movement was there today: sloth, walker or mountain goat?', chips([['sloth', 'Sloth', 0], ['walker', 'Walker', 0.5], ['goat', 'Mountain goat', 1]]), daily('20:00'), ['hand', 'fitbit']),
  // 4 Achtsamkeit
  q('achtsamkeit', 'kopf', 'How calm is your head: mountain lake or white water?', scale(), daily('13:00'), ['hand'], 'How calm is your mind?'),
  q('achtsamkeit', 'moment', 'Did you have a moment today when you just looked?', yesno([YES, NO]), daily('20:00'), ['hand'], 'Did you have a mindful moment?'),
  q('achtsamkeit', 'schultern', 'How relaxed are your shoulders right now: up by your ears or all the way down?', scale(), daily('13:00'), ['hand'], 'How relaxed do you feel?'),
  q('achtsamkeit', 'dank', 'What are you grateful for today, even if it is only the mid-morning snack?', scale({ note: true }), daily('20:00'), ['hand'], 'How grateful are you today?'),
  q('achtsamkeit', 'tabs', 'How many tabs are open in your head?', chips([['one', '1', 1], ['three', '3', 2 / 3], ['ten', '10', 1 / 3], ['crashed', 'browser crashed', 0]]), daily('08:00'), ['hand'], 'How focused can you work today?'),
  // 5 Freunde
  q('freunde', 'verbunden', 'How connected do you feel to others: hermit or pack animal?', scale(), daily('20:00'), ['hand'], 'How connected do you feel to others?'),
  q('freunde', 'zeit', 'Time with friends or family?', chips([['no', 'no', 0], ['short', 'short', 0.5], ['much', 'a lot', 1]]), daily('20:00'), ['hand'], 'Time with friends or family?'),
  q('freunde', 'runde', 'Who would you most like to ride a round with today?', chips([['alone', 'alone'], ['friends', 'with friends'], ['family', 'with family'], ['group', 'with a group']]), weekly(6, '09:00')),
  q('freunde', 'laecheln', 'Did you coax a smile out of someone today?', yesno([YES, NO, ['several', 'several', 1]]), daily('20:00')),
  q('freunde', 'gespraeche', 'How many real conversations instead of messages were there today?', number(''), daily('20:00')),
  q('freunde', 'allein', 'Were you alone on purpose today?', yesno([YES, NO]), daily('20:00')),
  q('freunde', 'alleingut', 'If you were alone: how good did it do you?', scale(), daily('20:00')),
  // 6 Natur
  q('natur', 'draussen', 'How long were you outside: cave dweller or marmot on the alp?', chips([['m0', '0', 0], ['m30', 'up to 30', 15], ['m90', '30–90', 60], ['more', 'over 90 min', 120]]), daily('20:00'), ['hand', 'app'], 'How much time did you spend outside?'),
  q('natur', 'wetter', 'Which weather did you have in your face?', chips([['sun', 'Sun'], ['wind', 'Wind'], ['rain', 'Rain'], ['fog', 'Fog'], ['snow', 'Snow']], { multi: true }), daily('20:00')),
  q('natur', 'tiere', 'Did you see something alive today that was not on a screen?', chips([['bird', 'Bird'], ['cow', 'Cow'], ['deer', 'Deer'], ['marmot', 'Marmot'], ['other', 'other|animal']], { multi: true }), daily('20:00')),
  q('natur', 'luft', 'How much fresh air was in your lungs?', scale(), daily('20:00')),
  q('natur', 'zug', 'How much did it pull you outside today?', scale(), daily('13:00')),
  // 7 Visionen
  q('visionen', 'vision', 'Did you get closer to your vision this week, even if only by one pedal stroke?', scale({ note: true }), weekly(0, '19:00'), ['hand'], 'Did you get closer to your vision?'),
  q('visionen', 'neues', 'How keen are you on something new: creature of habit or explorer?', scale(), daily('08:00'), ['hand'], 'How keen are you on something new?'),
  q('visionen', 'tour', 'Which tour is haunting your head right now?', text(), weekly(0, '19:00')),
  q('visionen', 'wohin', 'If you had tomorrow off and there was no weather: where to?', text(), weekly(6, '09:00')),
  q('visionen', 'jahr', 'What do you want to be able to do in a year that you cannot do today?', text(), monthly('19:00')),
  // 8 Ziele
  q('ziele', 'ziel', 'Your most important goal for today, in a sentence or a word.', text(), daily('08:00'), ['hand'], 'Your most important goal for today'),
  q('ziele', 'freude', 'What are you looking forward to most today?', chips([['nature', 'Nature'], ['sport', 'Sport|chip'], ['friends', 'Friends'], ['new', 'New'], ['calm', 'Calm'], ['food', 'Food'], ['own', 'own|thing']], { multi: true }), daily('08:00'), ['hand'], 'What are you looking forward to today?'),
  q('ziele', 'kette', 'What is your «chain lube» today, the small thing you otherwise put off?', text(), daily('08:00')),
  q('ziele', 'tempo', 'How much do you want to get done today: snail mail or express train?', scale(), daily('08:00')),
  q('ziele', 'liegen', 'What may stay undone today, for once?', text(), daily('08:00')),
  q('ziele', 'umplanen', 'Did you replan something on purpose today?', chips([['good', 'yes, and it was good', 1], ['notgood', 'yes, not so good', 0], ['no', 'no|replan']], { note: true }), daily('20:00')),
  // 9 Erreicht
  q('erreicht', 'zufrieden', 'How happy are you with the day: the best of both worlds?', scale(), daily('20:00'), ['hand'], 'How happy are you with the day?'),
  q('erreicht', 'ziel', 'Did you reach your goal from this morning?', yesno([YES, ['partly', 'partly', 0.5], NO]), daily('20:00'), ['hand'], 'Did you reach your goal?'),
  q('erreicht', 'gestern', 'How happy are you with yesterday, looking back with some distance?', scale(), daily('08:00'), ['hand'], 'How happy are you with yesterday?'),
  q('erreicht', 'stolz', 'What are you a tiny bit proud of today?', text(), daily('20:00')),
  q('erreicht', 'pokal', 'Which trophy goes to you today?', chips([['kept', 'Kept going'], ['brave', 'Brave'], ['patient', 'Patient'], ['helpful', 'Helpful'], ['lazy', 'Lazy and happy']]), daily('20:00')),
  // 10 Körper und Werte (plain on purpose: they flow into analyses like watts per kg)
  q('koerper', 'waage', 'What do the scales show today, without any judgement?', number('kg'), weekly(5, '08:00'), ['open'], 'Weight'),
  q('koerper', 'ruhepuls', 'How calmly does your heart beat in the morning?', number('bpm'), daily('07:00'), ['fitbit', 'hand'], 'Resting heart rate'),
  q('koerper', 'essen', 'How well did you eat: gourmet, petrol station or forgotten?', scale(), daily('20:00'), ['hand'], 'How well did you eat?'),
  q('koerper', 'wochenschlaf', 'How was your sleep this week overall?', scale(), weekly(0, '19:00'), ['hand'], 'Sleep of the week'),
  q('koerper', 'bildschirm', 'How many hours did a screen look at you today?', number('h'), daily('20:00'), ['only'], 'own question «Screen time»'),
];
/**
 * The 50 sample questions (Noah 20.10.2026 «zudem möchte ich von dir 50 neue fragen, die als muster hinterlegt
 * sind»; list notes/check-fragen/50-musterfragen.md, «1a 2a» taken as default with «3a»): 5 per area, all off
 * at the start (`sample`), each can be switched on, changed, moved or deleted like every other question.
 */
const s = (area, key, textEn, form, every) => ({ ...q(area, key, textEn, form, every), sample: true });
export const SAMPLE_QUESTIONS = [
  // Musterfragen erholung
  s('erholung', 'lider', 'How heavy are your eyelids right now: feather or lead lid?', scale(), daily('08:00')),
  s('erholung', 'pause', 'Did you take a real break today, without any screen?', yesno([['yes', 'yes|cf', 1], ['no', 'no|cf', 0], ['several', 'several|cf', 1]]), daily('20:00')),
  { ...s('erholung', 'stunden', 'How many hours did you sleep?', number('h'), daily('07:00')), src: ['fitbit', 'hand'] },
  s('erholung', 'bett', 'When do you go to bed tonight?', chips([['before22', 'before 22:00|cf'], ['22to23', '22–23:00|cf'], ['after23', 'after 23:00|cf']]), daily('20:00')),
  s('erholung', 'augenzu', 'How long did you simply close your eyes today?', number('min'), daily('20:00')),
  // Musterfragen spass
  s('spass', 'ohrwurm', 'Which song ran in your head on repeat today?', text(), daily('20:00')),
  s('spass', 'erstesmal', 'What did you do for the first time today?', text(), daily('20:00')),
  s('spass', 'verspielt', 'How playful were you today: file folder or puppy?', scale(), daily('20:00')),
  s('spass', 'lust', 'What would you feel like today, if anything went?', chips([['icecream', 'Ice cream|cf'], ['bike', 'Bike|cf'], ['sofa', 'Sofa|cf'], ['party', 'Party|cf'], ['calm', 'Calm|cf'], ['adventure', 'Adventure|cf']], { multi: true }), daily('08:00')),
  s('spass', 'basteln', 'How much time did you have today for playing or tinkering?', chips([['none', 'none|cf', 0], ['short', 'short|cf', 0.5], ['much', 'a lot|cf', 1]]), daily('20:00')),
  // Musterfragen sport
  s('sport', 'km', 'How many kilometres did you ride today?', number('km'), daily('20:00')),
  s('sport', 'zwickt', 'Where does it pinch today?', chips([['nowhere', 'nowhere|cf'], ['knee', 'Knee|cf'], ['back', 'Back|cf'], ['neck', 'Neck|cf'], ['seat', 'Seat|cf'], ['hands', 'Hands|cf'], ['feet', 'Feet|cf']], { multi: true }), daily('08:00')),
  s('sport', 'dehnen', 'Did you stretch or roll today?', yesno([['yes', 'yes|cf', 1], ['no', 'no|cf', 0]]), daily('20:00')),
  s('sport', 'hart', 'How hard was today’s session: a stroll or a hill time trial?', scale(), daily('20:00')),
  s('sport', 'trainingslust', 'How keen on training are you today: couch potato or chain eater?', scale(), daily('08:00')),
  // Musterfragen achtsamkeit
  s('achtsamkeit', 'kopfwetter', 'What is the weather in your head right now?', chips([['sun', 'Sun|cf'], ['clouds', 'Clouds|cf'], ['fog', 'Fog|cf'], ['storm', 'Thunderstorm|cf'], ['rainbow', 'Rainbow|cf']]), daily('13:00')),
  s('achtsamkeit', 'atmen', 'How often did you take a deep breath on purpose today?', chips([['never', 'not at all|cf', 0], ['once', 'once|cf', 0.5], ['often', 'several times|cf', 1]]), daily('20:00')),
  s('achtsamkeit', 'unruhe', 'What threw you off balance today?', text(), daily('20:00')),
  s('achtsamkeit', 'fuermich', 'How much time did you have just for yourself today?', number('min'), daily('20:00')),
  s('achtsamkeit', 'sinne', 'What did you smell, hear or taste in a special way today?', text(), daily('20:00')),
  // Musterfragen freunde
  s('freunde', 'nachricht', 'Who would you like to send a message to today?', text(), daily('08:00')),
  s('freunde', 'gutgetan', 'Did someone do you good today?', yesno([['yes', 'yes|cf', 1], ['no', 'no|cf', 0], ['several', 'several|cf', 1]]), daily('20:00')),
  s('freunde', 'geholfen', 'Did you help someone today, even if only with chain oil?', yesno([['yes', 'yes|cf', 1], ['no', 'no|cf', 0]]), daily('20:00')),
  s('freunde', 'gesellschaft', 'How much company do you need today: quiet island or festival tent?', scale(), daily('08:00')),
  s('freunde', 'bald', 'Who would you like to spend time with again soon?', text(), weekly(0, '19:00')),
  // Musterfragen natur
  s('natur', 'himmel', 'Did you really look up at the sky today?', yesno([['yes', 'yes|cf', 1], ['no', 'no|cf', 0]]), daily('20:00')),
  s('natur', 'geraschelt', 'What bloomed, rustled or chirped today?', text(), daily('20:00')),
  s('natur', 'wo', 'Where were you outside today?', chips([['forest', 'Forest|cf'], ['lake', 'Lake|cf'], ['mountain', 'Mountain|cf'], ['town', 'Town|cf'], ['garden', 'Garden|cf'], ['field', 'Field|cf']], { multi: true }), daily('20:00')),
  s('natur', 'sonne', 'Did you see the sun rise or set today?', chips([['rise', 'Sunrise|cf'], ['set', 'Sunset|cf'], ['both', 'both|cf'], ['none', 'neither|cf']]), daily('20:00')),
  s('natur', 'boden', 'Did you have grass, earth or rock under your feet today?', yesno([['yes', 'yes|cf', 1], ['no', 'no|cf', 0]]), daily('20:00')),
  // Musterfragen visionen
  s('visionen', 'pass', 'Which pass do you absolutely still want to ride?', text(), monthly('19:00')),
  s('visionen', 'gelernt', 'What did you learn this week?', text(), weekly(0, '19:00')),
  s('visionen', 'fernweh', 'How big is your wanderlust right now: sofa cushion or world map?', scale(), weekly(6, '09:00')),
  s('visionen', 'faehigkeit', 'Which skill do you want to practise next?', text(), monthly('19:00')),
  s('visionen', 'traum', 'What did you dream of, at night or during the day?', text(), daily('08:00')),
  // Musterfragen ziele
  s('ziele', 'schritt', 'What is your smallest doable step today?', text(), daily('08:00')),
  s('ziele', 'plan', 'How clear is your plan for today: fog or satnav?', scale(), daily('08:00')),
  s('ziele', 'woche', 'What do you want to get done this week?', text(), weekly(1, '08:00')),
  s('ziele', 'liste', 'How much of your list did you get done today?', chips([['nothing', 'nothing|cf', 0], ['some', 'some|cf', 0.25], ['half', 'half|cf', 0.5], ['most', 'almost all|cf', 0.75], ['all', 'all|cf', 1]]), daily('20:00')),
  s('ziele', 'verzicht', 'What do you do without on purpose today?', text(), daily('08:00')),
  // Musterfragen erreicht
  s('erreicht', 'besser', 'What went better than expected today?', text(), daily('20:00')),
  s('erreicht', 'endlich', 'Which little thing did you finally get done today?', text(), daily('20:00')),
  s('erreicht', 'rueckenwind', 'How much tailwind did you have today: headwind or a push from behind?', scale(), daily('20:00')),
  s('erreicht', 'highlight', 'What was your best moment this week?', text(), weekly(0, '19:00')),
  s('erreicht', 'monat', 'What did you get done this month that makes you happy?', text(), monthly('19:00')),
  // Musterfragen koerper
  s('koerper', 'trinken', 'How much did you drink today?', number('l'), daily('20:00')),
  { ...s('koerper', 'schritte', 'How many steps does your counter show today?', number(''), daily('20:00')), src: ['fitbit', 'hand'] },
  s('koerper', 'sitzen', 'How many hours did you sit today?', number('h'), daily('20:00')),
  s('koerper', 'bauch', 'How does your belly feel: calm or roller coaster?', scale(), daily('20:00')),
  s('koerper', 'gemuese', 'How many portions of vegetables and fruit were there today?', number(''), daily('20:00')),
];
export const QUESTIONS = [...BASE_QUESTIONS, ...SAMPLE_QUESTIONS];
// HG1 2b: the answers to the greeting on Today land in the same history, so the lookup knows their questions too
export const QUESTION = Object.fromEntries([...QUESTIONS, ...HELLO_QUESTIONS].map((x) => [x.id, x]));

/** Noah 14.10.2026 00:06:33: 31 of the 50 are on at the start, as drawn in AB5 (per area 4·4·3·3·2·3·2·3·4·3); Paket P adds its 4 evening questions, on: 35. */
export const ON_AT_START = new Set([
  'erholung.schlaf', 'erholung.akku', 'erholung.koerper', 'erholung.kaffee',
  'spass.grinser', 'spass.emoji', 'spass.stimmung', 'spass.coolstes',
  'sport.beine', 'sport.fit', 'sport.bewegung',
  'achtsamkeit.kopf', 'achtsamkeit.moment', 'achtsamkeit.tabs',
  'freunde.verbunden', 'freunde.laecheln',
  'natur.draussen', 'natur.wetter', 'natur.luft',
  'visionen.vision', 'visionen.tour',
  'ziele.ziel', 'ziele.freude', 'ziele.liegen',
  'erreicht.zufrieden', 'erreicht.ziel', 'erreicht.stolz', 'erreicht.pokal',
  'koerper.waage', 'koerper.ruhepuls', 'koerper.wochenschlaf',
  // Paket P (Noah 19.10.2026 «4a»): the four evening questions of «Was mir gut tut»
  'erholung.raeuber', 'freunde.allein', 'freunde.alleingut', 'ziele.umplanen',
]);

/** The units an answer can have (AB2 quick choice kg, min, h, km; cups and bpm from the list). */
export const UNITS = { kg: 'kg', min: 'min', h: 'h', km: 'km', cups: 'cups', bpm: 'bpm' };
/** The answer kinds of an own question (AB2): scale, yes/no, number with unit, text. */
export const OWN_KINDS = ['scale', 'yesno', 'number', 'text'];

/* ---------------------------------------------------------------- time */

const p2 = (n) => String(n).padStart(2, '0');
/** A local time stamp 'YYYY-MM-DDTHH:MM' (the device's clock, like localDay). */
export const stampOf = (d = new Date()) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
export const dayOf = (stamp) => String(stamp ?? '').slice(0, 10);
const hmOf = (stamp) => String(stamp ?? '').slice(11, 16);
/** The weekday of a day (0 = Sunday), calendar arithmetic. */
export const dowOf = (day) => new Date(`${day}T00:00:00Z`).getUTCDay();
const HM = /^([01]\d|2[0-3]):[0-5]\d$/;
/** A time 'H:MM' or 'HH:MM' made whole, null when it is none. */
export function timeOf(s) {
  const m = String(s ?? '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const v = `${p2(Number(m[1]))}:${m[2]}`;
  return HM.test(v) ? v : null;
}

/** An interval made safe: unknown kinds are «off», times sorted and without doubles. */
export function everyOf(e) {
  const kind = e?.kind;
  if (kind === 'times') {
    const times = [...new Set((Array.isArray(e.times) ? e.times : []).map(timeOf).filter(Boolean))].sort();
    if (!times.length) return { kind: 'off' };
    return times.length === 1 ? { kind: 'daily', time: times[0] } : { kind: 'times', times };
  }
  if (kind === 'daily') return { kind, time: timeOf(e.time) ?? '08:00' };
  if (kind === 'weekly') return { kind, dow: Number.isInteger(e.dow) && e.dow >= 0 && e.dow <= 6 ? e.dow : 0, time: timeOf(e.time) ?? '19:00' };
  if (kind === 'monthly') return { kind, time: timeOf(e.time) ?? '19:00' };
  return { kind: 'off' };
}
/** The times of a day an interval asks (several, one, or none). */
export const timesOf = (e) => (e.kind === 'times' ? e.times : e.kind === 'off' ? [] : [e.time]);

/** The last time the question was due at or before `now` (a stamp), null when it never is. */
export function lastSlot(every, now) {
  const e = everyOf(every);
  const day = dayOf(now);
  const hm = hmOf(now);
  if (e.kind === 'off') return null;
  if (e.kind === 'times' || e.kind === 'daily') {
    const ts = timesOf(e);
    const today = ts.filter((x) => x <= hm).at(-1);
    return today ? `${day}T${today}` : `${addDays(day, -1)}T${ts.at(-1)}`;
  }
  if (e.kind === 'weekly') {
    let d = addDays(day, -((dowOf(day) - e.dow + 7) % 7));
    if (d === day && e.time > hm) d = addDays(d, -7);
    return `${d}T${e.time}`;
  }
  // monthly: the 1st of the month
  let d = `${day.slice(0, 8)}01`;
  if (d === day && e.time > hm) d = `${addDays(d, -1).slice(0, 8)}01`;
  return `${d}T${e.time}`;
}
/** The next time after a slot (for «Jetzt nicht» and the missed rule). */
export function nextSlot(every, slot) {
  const e = everyOf(every);
  if (e.kind === 'off' || !slot) return null;
  const day = dayOf(slot);
  const hm = hmOf(slot);
  if (e.kind === 'times' || e.kind === 'daily') {
    const later = timesOf(e).find((x) => x > hm);
    return later ? `${day}T${later}` : `${addDays(day, 1)}T${timesOf(e)[0]}`;
  }
  if (e.kind === 'weekly') return `${addDays(day, 7)}T${e.time}`;
  const [y, m] = day.split('-').map(Number);
  return `${m === 12 ? y + 1 : y}-${p2(m === 12 ? 1 : m + 1)}-01T${e.time}`;
}

/* ---------------------------------------------------------------- the settings */

/**
 * Every question there is, as the person has it (Noah 20.10.2026 «editieren und löschen …, neue pro Gruppe,
 * Gruppen editieren, hinzufügen, löschen»): the list without the deleted ones, a changed text (`edited`, then
 * shown as typed), a question moved to another group, the own ones; in the order of the groups, then the
 * person's order inside a group. A question whose group is gone sits under «Eigene» (OWN_AREA).
 */
export function allQuestions(cfg) {
  const c = configOf(cfg);
  const keys = new Set(areasOf(c).map((a) => a.key));
  const fix = (x) => (keys.has(x.area) ? x : { ...x, area: OWN_AREA });
  const std = QUESTIONS.filter((x) => !c.gone.includes(x.id)).map((x) => fix({ ...x, ...(c.names[x.id] ? { text: c.names[x.id], edited: true } : {}), ...(c.moved[x.id] ? { area: c.moved[x.id] } : {}) }));
  const list = [...std, ...c.own.map(fix)];
  const rankArea = Object.fromEntries([...areasOf(c).map((a, i) => [a.key, i]), [OWN_AREA, 9999]]);
  const base = new Map(list.map((x, i) => [x.id, i]));
  const rank = (x) => {
    const i = (c.order[x.area] ?? []).indexOf(x.id);
    return i < 0 ? 100000 + base.get(x.id) : i;
  };
  return list.sort((a, b) => (rankArea[a.area] ?? 9998) - (rankArea[b.area] ?? 9998) || rank(a) - rank(b));
}
/** The questions of one group, in order. */
export const questionsIn = (cfg, area) => allQuestions(cfg).filter((x) => x.area === area);
/** A question by its id as the person has it (also a deleted one of the list, for the history), else null. */
export const questionOf = (cfg, id) => allQuestions(cfg).find((x) => x.id === id) ?? QUESTION[id] ?? null;

/* ---------------------------------------------------------------- the groups */

/**
 * The groups (areas) as the person has them, in order: [{ key, name (the person's or null), std (the
 * list name for t()), icon, own }]. «Eigene» (OWN_AREA) is not in it: it is the place without a group and
 * always comes last (it can be renamed, not deleted).
 */
export function areasOf(cfg) {
  const c = cfg && Array.isArray(cfg.areasGone) && cfg.areaNames ? cfg : configOf(cfg);
  const all = [
    ...AREAS.filter((a) => !c.areasGone.includes(a.key)).map((a) => ({ key: a.key, name: c.areaNames[a.key] ?? null, std: a.name, icon: a.icon, own: false })),
    ...c.ownAreas.map((a) => ({ key: a.key, name: a.name, std: null, icon: null, own: true })),
  ];
  const rank = (k) => {
    const i = c.areaOrder.indexOf(k);
    return i < 0 ? 1000 + all.findIndex((a) => a.key === k) : i;
  };
  return all.sort((a, b) => rank(a.key) - rank(b.key));
}
/** A group's name as it shows: the person's name, else the list name (through tr), «Eigene» for OWN_AREA. */
export function areaLabel(cfg, key, tr = (s) => s) {
  const c = configOf(cfg);
  if (c.areaNames[key]) return c.areaNames[key];
  if (key === OWN_AREA) return tr('Own|questions');
  const own = c.ownAreas.find((a) => a.key === key);
  if (own) return own.name;
  return AREA[key] ? tr(AREA[key].name) : '';
}

let seq = 0;
const newKey = (prefix, now) => `${prefix}-${now.toString(36)}-${(seq++).toString(36)}`;

/** Change a question's text (an own one: its name; one of the list: empty or the same brings back the original). */
export function renameQuestion(cfg, id, text) {
  const c = configOf(cfg);
  const v = String(text ?? '').trim().slice(0, 120);
  if (c.own.some((x) => x.id === id)) return v ? { ...c, own: c.own.map((x) => (x.id === id ? { ...x, text: v } : x)) } : c;
  const names = { ...c.names };
  if (v && v !== QUESTION[id]?.text) names[id] = v;
  else delete names[id];
  return { ...c, names };
}
/** Put a question into another group (OWN_AREA = «Eigene»). */
export function moveToArea(cfg, id, area) {
  const c = configOf(cfg);
  if (c.own.some((x) => x.id === id)) return { ...c, own: c.own.map((x) => (x.id === id ? { ...x, area } : x)) };
  const moved = { ...c.moved };
  if (QUESTION[id]?.area === area) delete moved[id];
  else moved[id] = area;
  return { ...c, moved };
}
/** Delete a question: an own one goes, one of the list is hidden («Gelöschte Fragen» brings it back). Answers stay. */
export function deleteQuestion(cfg, id) {
  const c = configOf(cfg);
  if (c.own.some((x) => x.id === id)) return dropOwn(c, id);
  return QUESTION[id] && !c.gone.includes(id) ? { ...c, gone: [...c.gone, id] } : c;
}
/** Bring a deleted question of the list back. */
export const restoreQuestion = (cfg, id) => {
  const c = configOf(cfg);
  return { ...c, gone: c.gone.filter((x) => x !== id) };
};
/** The deleted questions of the list (for «Gelöschte Fragen»). */
export const goneQuestions = (cfg) => configOf(cfg).gone.map((id) => QUESTION[id]).filter(Boolean);
/** Move a question inside its group (arrows and drag): from/to are indexes in questionsIn(area). */
export function moveQuestion(cfg, area, from, to) {
  const c = configOf(cfg);
  const ids = questionsIn(c, area).map((x) => x.id);
  if (from < 0 || from >= ids.length || to < 0 || to >= ids.length || from === to) return c;
  const [x] = ids.splice(from, 1);
  ids.splice(to, 0, x);
  return { ...c, order: { ...c.order, [area]: ids } };
}
/** Rename a group (empty: a list group goes back to its own name). */
export function renameArea(cfg, key, name) {
  const c = configOf(cfg);
  const v = String(name ?? '').trim().slice(0, 40);
  if (c.ownAreas.some((a) => a.key === key)) return v ? { ...c, ownAreas: c.ownAreas.map((a) => (a.key === key ? { ...a, name: v } : a)) } : c;
  const areaNames = { ...c.areaNames };
  if (v) areaNames[key] = v;
  else delete areaNames[key];
  return { ...c, areaNames };
}
/** Add an own group. → { cfg, key } (key null without a name). */
export function addArea(cfg, name, now = Date.now()) {
  const c = configOf(cfg);
  const v = String(name ?? '').trim().slice(0, 40);
  if (!v) return { cfg: c, key: null };
  const key = newKey('area', now);
  return { cfg: { ...c, ownAreas: [...c.ownAreas, { key, name: v }] }, key };
}
/**
 * Delete a group; its questions go to `to` (another group) or to «Eigene» (to null). The questions are
 * never deleted with it. «Eigene» itself cannot be deleted.
 */
export function deleteArea(cfg, key, to = null) {
  let c = configOf(cfg);
  if (key === OWN_AREA) return c;
  const dest = to && to !== key ? to : OWN_AREA;
  for (const x of questionsIn(c, key)) c = moveToArea(c, x.id, dest);
  if (c.ownAreas.some((a) => a.key === key)) c = { ...c, ownAreas: c.ownAreas.filter((a) => a.key !== key) };
  else if (AREA[key] && !c.areasGone.includes(key)) c = { ...c, areasGone: [...c.areasGone, key] };
  const areaNames = { ...c.areaNames };
  delete areaNames[key];
  return { ...c, areaNames, areaOrder: c.areaOrder.filter((x) => x !== key) };
}
/** Move a group (arrows and drag). */
export function moveArea(cfg, from, to) {
  const c = configOf(cfg);
  const keys = areasOf(c).map((a) => a.key);
  if (from < 0 || from >= keys.length || to < 0 || to >= keys.length || from === to) return c;
  const [x] = keys.splice(from, 1);
  keys.splice(to, 0, x);
  return { ...c, areaOrder: keys };
}
/** Has the person changed the questions or groups (then «Zurück zum Standard» shows)? */
export function listChanged(cfg) {
  const c = configOf(cfg);
  return !!(Object.keys(c.names).length || c.gone.length || Object.keys(c.moved).length || Object.keys(c.order).length || Object.keys(c.areaNames).length || c.ownAreas.length || c.areasGone.length || c.areaOrder.length);
}
/** «Zurück zum Standard»: the list's texts, groups and order back; own questions and the switches stay (own ones in a gone group: «Eigene»). */
export function resetList(cfg) {
  const c = configOf(cfg);
  const keys = new Set(AREAS.map((a) => a.key));
  return { ...c, names: {}, gone: [], moved: {}, order: {}, areaNames: {}, ownAreas: [], areasGone: [], areaOrder: [], own: c.own.map((x) => (keys.has(x.area) ? x : { ...x, area: OWN_AREA })) };
}

/** An own question made safe (AB2), null without a name. */
export function ownOf(x) {
  const name = String(x?.text ?? '').trim().slice(0, 120);
  if (!name || typeof x?.id !== 'string') return null;
  const kind = OWN_KINDS.includes(x?.form?.kind) ? x.form.kind : 'scale';
  const form = kind === 'number' ? { kind, unit: String(x.form?.unit ?? '').trim().slice(0, 20) } : kind === 'yesno' ? { kind, options: [{ key: 'yes', label: 'yes', v: 1 }, { key: 'no', label: 'no', v: 0 }] } : { kind };
  // a group of the list or an own group (its key starts with «area-»); anything else: «Eigene»
  const area = AREA[x?.area] || /^area-/.test(String(x?.area ?? '')) ? x.area : OWN_AREA;
  return { id: x.id, area, text: name, form, every: everyOf(x.every), src: ['only'], own: true, show: x.show !== false };
}
/** A new own question with a fresh id (the time it was made). */
export const newOwn = (fields = {}, now = new Date()) => ownOf({ ...fields, id: `own-${now.getTime().toString(36)}` });

/** The stored settings made safe: { since, q, own, rounds }. */
export function configOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const own = (Array.isArray(v.own) ? v.own : []).map(ownOf).filter(Boolean);
  const qs = v.q && typeof v.q === 'object' ? v.q : {};
  const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
  const strs = (x) => (Array.isArray(x) ? x.filter((y) => typeof y === 'string') : []);
  const texts = (x) => Object.fromEntries(Object.entries(obj(x)).filter(([, y]) => typeof y === 'string' && y.trim()));
  return {
    since: typeof v.since === 'string' ? v.since : null,
    q: qs,
    own,
    rounds: roundsOf(v.rounds),
    // Noah 20.10.2026: the person's changes to the list and its groups (a difference, so new questions of the app still come)
    names: texts(v.names),
    gone: strs(v.gone),
    moved: texts(v.moved),
    order: Object.fromEntries(Object.entries(obj(v.order)).map(([k, y]) => [k, strs(y)])),
    areaNames: texts(v.areaNames),
    ownAreas: (Array.isArray(v.ownAreas) ? v.ownAreas : []).filter((a) => a && typeof a.key === 'string' && typeof a.name === 'string' && a.name.trim()).map((a) => ({ key: a.key, name: a.name.trim() })),
    areasGone: strs(v.areasGone),
    areaOrder: strs(v.areaOrder),
  };
}

/* ---------------------------------------------------------------- WG: the two fixed rounds */

/**
 * WG «Wi gaht's?» takes over the daily check (Noah 14.10.2026 «a) ja, alle drei übernehmen»): two fixed
 * rounds, 07:00 and 20:30. While they are on, a question whose own time is before 11:00 asks at the
 * morning time, from 11:00 at the evening time (Noah 21.10.2026 «2a»; 11:00–17:59 kept its own time before). A suggestion only:
 * the rounds can be switched off and both times changed (Ich › «Wi gaht's?» › «Feste Runden»).
 */
export const ROUNDS = { on: true, morning: '07:00', evening: '20:30' };
/** WG: the stored rounds made safe (missing: on, 07:00 and 20:30). */
export function roundsOf(r) {
  const v = r && typeof r === 'object' ? r : {};
  return { on: typeof v.on === 'boolean' ? v.on : ROUNDS.on, morning: timeOf(v.morning) ?? ROUNDS.morning, evening: timeOf(v.evening) ?? ROUNDS.evening };
}
/** WG: the rounds changed (on, morning, evening; the rest kept). */
export const setRounds = (cfg, patch = {}) => {
  const c = configOf(cfg);
  return { ...c, rounds: roundsOf({ ...c.rounds, ...patch }) };
};
/**
 * WG: the time a question asks at with the rounds: before 11:00 the morning, from 11:00 the evening time.
 * v0.144.0 RE «Eine Tagesuhr»: the borders of the one day clock (dayclock.js; the morning ended at 12:00 before).
 */
export function roundTime(time, rounds) {
  const r = roundsOf(rounds);
  const hm = timeOf(time);
  if (!r.on || !hm) return hm;
  // Noah 21.10.2026 «1a 2a»: the window comes only at the two rounds; a midday time (11:00–17:59) is asked
  // in the evening round (it kept its own time before and opened the window at noon)
  return hm < DAY_FROM ? r.morning : r.evening;
}
/** WG: an interval with the rounds applied (several times a day, daily, weekly and monthly alike). */
export function roundEvery(every, rounds) {
  const e = everyOf(every);
  if (!roundsOf(rounds).on || e.kind === 'off') return e;
  if (e.kind === 'times') return everyOf({ kind: 'times', times: e.times.map((x) => roundTime(x, rounds)) });
  return { ...e, time: roundTime(e.time, rounds) };
}
/**
 * WG: the part of the day an answer belongs to, by its question time (else the time it was given):
 * 'morning', 'day' or 'evening'; the two round times always count as their round.
 */
export function partOf(row, rounds) {
  const hm = hmOf(row?.slot || row?.at);
  if (!hm) return null;
  const r = roundsOf(rounds);
  if (r.on && hm === r.evening) return 'evening';
  if (r.on && hm === r.morning) return 'morning';
  return hm < DAY_FROM ? 'morning' : hm >= EVENING_FROM ? 'evening' : 'day';
}
/** WG: is it the evening round yet (from the evening time on; also with the rounds off, the time stays the border)? */
export const isEveningRound = (now, rounds) => hmOf(now) >= roundsOf(rounds).evening;

/** One question's setting: on, its interval and since when it asks (switched on later: from then). */
export function settingOf(cfg, question) {
  const c = configOf(cfg);
  const s = c.q[question.id] ?? {};
  const on = typeof s.on === 'boolean' ? s.on : question.own ? true : ON_AT_START.has(question.id);
  return { on, every: s.every ? everyOf(s.every) : everyOf(question.every), since: s.since ?? c.since };
}
/** Switch a question on or off: the new settings. Switched on, it asks from its next time on. */
export function setOn(cfg, id, on, now) {
  const c = configOf(cfg);
  const was = c.q[id] ?? {};
  return { ...c, q: { ...c.q, [id]: { ...was, on: !!on, ...(on ? { since: now } : {}) } } };
}
/** Give a question another interval: the new settings (an own question keeps it in its record). */
export function setEvery(cfg, id, every) {
  const c = configOf(cfg);
  return { ...c, q: { ...c.q, [id]: { ...(c.q[id] ?? {}), every: everyOf(every) } } };
}
/** Add or change an own question. */
export function putOwn(cfg, question, now) {
  const c = configOf(cfg);
  const own = ownOf(question);
  if (!own) return c;
  const has = c.own.some((x) => x.id === own.id);
  const next = { ...c, own: has ? c.own.map((x) => (x.id === own.id ? own : x)) : [...c.own, own] };
  // the interval lives in the question itself; a new one asks from its next time on
  const q = { ...next.q };
  const was = q[own.id] ?? {};
  const off = own.every.kind === 'off';
  // «Aus» in the sheet switches it off; a new one or one switched on again asks from its next time
  q[own.id] = { on: !off, since: !has || (!off && was.on === false) ? now : was.since ?? now };
  return { ...next, q };
}
/** Remove an own question (its answers stay in the history). */
export function dropOwn(cfg, id) {
  const c = configOf(cfg);
  const q = { ...c.q };
  delete q[id];
  return { ...c, own: c.own.filter((x) => x.id !== id), q };
}

/** How many are on: { all, on, per: { [area]: { all, on } } } (AB5 «50 Fragen in 10 Bereichen, 31 davon an»). */
export function counts(cfg) {
  const per = {};
  let on = 0;
  const list = allQuestions(configOf(cfg));
  for (const x of list) {
    const a = x.area;
    per[a] ??= { all: 0, on: 0 };
    per[a].all++;
    if (settingOf(cfg, x).on) (per[a].on++, on++);
  }
  return { all: list.length, on, per };
}

/**
 * Impeccable Runde 2 «Tageslast»: about how many times a day the app asks, from the questions that are on:
 * «3× daily» counts 3, daily 1, weekly 1/7, monthly 1/30; rounded to a whole number.
 */
export function perDay(cfg) {
  const c = configOf(cfg);
  let n = 0;
  for (const x of allQuestions(c)) {
    const s = settingOf(c, x);
    if (!s.on) continue;
    const e = everyOf(s.every);
    n += e.kind === 'times' ? e.times.length : e.kind === 'daily' ? 1 : e.kind === 'weekly' ? 1 / 7 : e.kind === 'monthly' ? 1 / 30 : 0;
  }
  return Math.round(n);
}
/** More than this many a day: a calm hint how to ask less. */
export const BUSY_DAY = 15;

/* ---------------------------------------------------------------- what is due */

// Noah 14.10. 00:52:22 1a 2a 3b 4ab — 3b: a value that later comes from Fitbit does not switch its question
// off; it stays on until you switch it off yourself (since 0.171 the window fills in the Fitbit value, fitbitFill).

/**
 * Noah 14.10. 00:52:22 1a 2a 3b 4ab — 2a: a missed question STAYS until it is answered or tapped away.
 * The first time it was due after `floor` (switched on, the last answer, «Jetzt nicht»), null when none
 * has come since. A question switched on asks from its next time on.
 */
export function pendingSlot(every, floor, now) {
  const last = lastSlot(every, now);
  if (!last) return null;
  if (!floor) return last;
  if (last <= floor) return null;
  const before = lastSlot(every, floor);
  return before ? nextSlot(every, before) : last;
}

/**
 * All questions due now (a pure list; AbCard.svelte shows them, Noah 1a: together in one card):
 * [{ q, slot (the first time missed), last (the latest time) }] in the order of their time, then of the list.
 * answers: rows { qid, at } (at: stamp); snooze: { [qid]: stamp } («Jetzt nicht» until the next time).
 */
export function dueList(cfg, answers = [], now, snooze = {}) {
  const c = configOf(cfg);
  const lastAt = {};
  for (const a of answers) if (a?.qid && a.at && (!lastAt[a.qid] || a.at > lastAt[a.qid])) lastAt[a.qid] = a.at;
  const order = new Map(allQuestions(c).map((x, i) => [x.id, i]));
  const out = [];
  for (const x of allQuestions(c)) {
    const s = settingOf(c, x);
    if (!s.on) continue;
    const floor = [s.since, lastAt[x.id], snooze?.[x.id]].filter(Boolean).sort().at(-1) ?? null;
    const every = roundEvery(s.every, c.rounds); // WG: the fixed rounds move the morning and evening times
    const slot = pendingSlot(every, floor, now);
    if (!slot) continue;
    out.push({ q: x, slot, last: lastSlot(every, now) });
  }
  return out.sort((a, b) => a.slot.localeCompare(b.slot) || order.get(a.q.id) - order.get(b.q.id));
}
/**
 * Klick-Rundgang 22.10.2026 H15: the window fits its questions to the time of day. A missed evening question
 * stays (Noah 2a) and says from when it is (AbCard: «Frage von …»), after today's questions. In the evening it
 * asks about today (its latest time), not about a day missed before. due: dueList rows; → the rows to show now.
 */
export function fitNow(due = [], now, rounds) {
  const eve = isEveningRound(now, rounds);
  return due.map((d) => {
    const late = partOf({ slot: d.last ?? d.slot }, rounds) === 'evening';
    return eve && late && d.last && dayOf(d.slot) < dayOf(now) ? { ...d, slot: d.last } : d;
  });
}

/* ---------------------------------------------------------------- Fitbit fills in */

/**
 * Noah 20.10.2026 «bei Fitbit noch angezeigt, wird später geliefert, aber das haben wir bereits»: where a question
 * asks what Fitbit measures, the window fills in the measured value of the day (a suggestion, changeable;
 * saved with src 'fitbit' when left as it is). Feelings stay by hand: the night's sleep shows only as a hint.
 * health: the healthDays row of the question's day { restingHr, sleep: { asleepMin }, steps, azm }.
 * → { value, hint: { key, v } } or { value: null, hint } (only a hint) or null (nothing measured).
 */
export const FITBIT_MOVE = { goatAzm: 30, walkerAzm: 10, goatSteps: 12000, walkerSteps: 5000 };
export function fitbitFill(question, health) {
  if (!question || !health) return null;
  const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const sleepMin = fin(health.sleep?.asleepMin);
  const rhr = fin(health.restingHr);
  const steps = fin(health.steps);
  const azm = fin(health.azm);
  switch (question.id) {
    case 'koerper.ruhepuls':
      return rhr == null ? null : { value: String(Math.round(rhr)), hint: { key: 'rhr', v: Math.round(rhr) } };
    case 'erholung.stunden':
      return sleepMin == null ? null : { value: String(Math.round((sleepMin / 60) * 10) / 10), hint: { key: 'sleep', v: sleepMin } };
    case 'koerper.schritte':
      return steps == null ? null : { value: String(Math.round(steps)), hint: { key: 'steps', v: Math.round(steps) } };
    case 'erholung.schlaf':
      return sleepMin == null ? null : { value: null, hint: { key: 'sleep', v: sleepMin } };
    case 'sport.bewegung': {
      if (azm == null && steps == null) return null;
      const M = FITBIT_MOVE;
      const goat = (azm ?? 0) >= M.goatAzm || (steps ?? 0) >= M.goatSteps;
      const walker = (azm ?? 0) >= M.walkerAzm || (steps ?? 0) >= M.walkerSteps;
      return { value: goat ? 'goat' : walker ? 'walker' : 'sloth', hint: { key: azm != null ? 'azm' : 'steps', v: azm ?? Math.round(steps) } };
    }
    default:
      return null;
  }
}

/** «Später» on the window of the round (Noah 19.10.2026): kept in the snooze record under this key, until when. */
export const LATER_KEY = '_later';
/** The stamp one hour after `now` (a stamp 'YYYY-MM-DDTHH:MM', local time). */
export function laterStamp(now) {
  const [d, hm] = String(now).split('T');
  const [y, m, dd] = d.split('-').map(Number);
  const [h, mi] = hm.split(':').map(Number);
  return stampOf(new Date(y, m - 1, dd, h + 1, mi));
}
/** Save's fold: every question not shown put away until its next time. */
export const snoozeAll = (snooze = {}, due = []) => ({ ...(snooze ?? {}), ...Object.fromEntries(due.map((d) => [d.q.id, d.last ?? d.slot])) });

/*
 * Noah 21.10.2026 «wenn ein TagesCheck mit ignorieren oder heute nicht geklickt wurde, dass dann nie mehr eine
 * Erinnerung»: «Heute nicht», ✕ and «Überspringen» put away until the end of the day (not only until the next
 * time, which brought questions asked several times a day back at noon). After «Heute nicht» or ✕ the window
 * and every hint on Heute stay quiet the whole day (QUIET_KEY = that day), also for questions due later.
 */
export const QUIET_KEY = '_quiet';
/** The last minute of the stamp's day: a question put away until then comes back tomorrow at its time. */
export const dayEnd = (now) => `${String(now).slice(0, 10)}T23:59`;
/** One question skipped: away for the rest of the day. */
export const skipToday = (snooze = {}, qid, now) => ({ ...(snooze ?? {}), [qid]: dayEnd(now) });
/** «Heute nicht» / ✕: the shown questions away for the day, and the window quiet until tomorrow. */
export const quietToday = (snooze = {}, due = [], now) => ({ ...(snooze ?? {}), ...Object.fromEntries(due.map((d) => [d.q.id, dayEnd(now)])), [QUIET_KEY]: String(now).slice(0, 10) });
/** true when «Heute nicht» or ✕ was tapped on this day (a stamp or a day 'YYYY-MM-DD'). */
export const isQuiet = (snooze, now) => !!snooze?.[QUIET_KEY] && snooze[QUIET_KEY] === String(now).slice(0, 10);

/* ---------------------------------------------------------------- answers */

/** The answer made whole for its form, null when there is none (an empty field, an unknown chip). */
export function valueOf(form, raw) {
  if (raw == null || raw === '') return null;
  if (form.kind === 'scale') {
    const v = Number(raw);
    return Number.isInteger(v) && v >= 1 && v <= 10 ? v : null;
  }
  if (form.kind === 'number') {
    const v = Number(String(raw).replace(',', '.'));
    return Number.isFinite(v) && v >= 0 ? Math.round(v * 100) / 100 : null;
  }
  if (form.kind === 'text') {
    const s = String(raw).trim().slice(0, 500);
    return s || null;
  }
  const keys = new Set((form.options ?? []).map((o) => o.key));
  if (form.kind === 'chips' && form.multi) {
    const list = (Array.isArray(raw) ? raw : [raw]).filter((k) => keys.has(k));
    return list.length ? [...new Set(list)] : null;
  }
  const k = Array.isArray(raw) ? raw[0] : raw;
  return keys.has(k) ? k : null;
}

/** The number an answer stands for in the analyses (1–10, 1 · 0.5 · 0, a number, a chip's value), else null. */
export function numberOf(form, value) {
  if (value == null || !form) return null;
  if (form.kind === 'scale' || form.kind === 'number') return typeof value === 'number' ? value : null;
  if (form.kind === 'text') return null;
  const vs = (Array.isArray(value) ? value : [value]).map((k) => form.options?.find((o) => o.key === k)?.v).filter((v) => typeof v === 'number');
  return vs.length ? vs.reduce((s, v) => s + v, 0) / vs.length : null;
}

/** A history row from an answer: { id, qid, area, day, at, slot, kind, value, note, unit, src }. */
export function answerRow(question, raw, { at = null, day = null, slot = null, note = '', src = 'hand' } = {}) {
  const value = valueOf(question.form, raw);
  const n = String(note ?? '').trim().slice(0, 500);
  if (value == null && !n) return null;
  return {
    id: `ab-${question.id}-${at ?? day}-${Math.random().toString(36).slice(2, 6)}`,
    qid: question.id,
    area: question.area,
    day: day ?? dayOf(at),
    at,
    slot,
    kind: question.form.kind,
    value,
    note: n || null,
    unit: question.form.unit || null,
    src: src === 'fitbit' ? 'fitbit' : 'hand',
  };
}

/* ---------------------------------------------------------------- the old daily check */

/**
 * The daily check (table flowChecks, v0.51.0) lives on in the questions: sleep, energy and mood and the
 * rotating ones with an exact match. Old answers stay where they are; the history reads both (fromChecks).
 * A pool question without a match keeps its own key `tc.<id>`.
 */
export const CHECK_MAP = {
  sleep: 'erholung.schlaf',
  energy: 'erholung.akku',
  mood: 'spass.stimmung',
  body: 'erholung.koerper',
  new: 'visionen.neues',
  calm: 'achtsamkeit.kopf',
  yesterday: 'erreicht.gestern',
  food: 'koerper.essen',
  people: 'freunde.verbunden',
  ease: 'achtsamkeit.schultern',
  thanks: 'achtsamkeit.dank',
};
/** Back the other way: which field of the daily check an answer fills too (only the three fixed ones). */
export const MIRROR = { 'erholung.schlaf': 'sleep', 'erholung.akku': 'energy', 'spass.stimmung': 'mood' };

const scaleV = (x) => (Number.isInteger(Number(x)) && Number(x) >= 1 && Number(x) <= 10 ? Number(x) : null);
/**
 * The rows of the old daily checks, in the shape of the history (src 'hand', from: 'check', no time).
 * pool: the rotating questions (for the text of a key without a match).
 */
export function fromChecks(checks = [], pool = []) {
  const out = [];
  for (const c of checks) {
    if (!c?.day) continue;
    const add = (field, qid, label = null) => {
      const v = scaleV(c[field]);
      if (v == null) return;
      const area = QUESTION[qid]?.area ?? 'erholung';
      out.push({ id: `tc-${c.day}-${qid}`, qid, area, day: c.day, at: null, slot: null, kind: 'scale', value: v, note: null, unit: null, src: 'hand', from: 'check', ...(label ? { label } : {}) });
    };
    add('sleep', CHECK_MAP.sleep);
    add('energy', CHECK_MAP.energy);
    add('mood', CHECK_MAP.mood);
    if (c.q) {
      const p = pool.find((x) => x.id === c.q);
      const qid = CHECK_MAP[c.q] ?? `tc.${c.q}`;
      add('extra', qid, CHECK_MAP[c.q] ? null : { text: p?.text ?? c.q, textDe: p?.textDe ?? null });
    }
  }
  return out;
}

/**
 * The one history (AB4): the answers and the old daily checks, newest first. An old check of a day
 * that has an answer to the same question gives way (the answer was saved into both).
 */
export function mergeHistory(answers = [], checks = [], pool = []) {
  const have = new Set(answers.map((a) => `${a.day}|${a.qid}`));
  const old = fromChecks(checks, pool).filter((r) => !have.has(`${r.day}|${r.qid}`));
  return [...answers, ...old].sort((a, b) => b.day.localeCompare(a.day) || String(b.at ?? '').localeCompare(String(a.at ?? '')) || a.qid.localeCompare(b.qid));
}

/** The latest answer of a question in the history (AB3 «zuletzt 72.4 kg am …»), null without one. */
export const lastAnswer = (rows = [], qid) => rows.filter((r) => r.qid === qid && r.value != null).sort((a, b) => b.day.localeCompare(a.day) || String(b.at ?? '').localeCompare(String(a.at ?? '')))[0] ?? null;

/** History filters (AB4): by question (or area) and by source. */
export function filterHistory(rows = [], { qid = null, src = null } = {}) {
  return rows.filter((r) => (!qid || r.qid === qid) && (!src || r.src === src));
}
/** The rows grouped by day, newest first: [{ day, rows }]. */
export function byDay(rows = []) {
  const out = [];
  for (const r of rows) {
    const last = out.at(-1);
    if (last?.day === r.day) last.rows.push(r);
    else out.push({ day: r.day, rows: [r] });
  }
  return out;
}
