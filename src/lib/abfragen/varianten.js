/**
 * «Wechsel-Varianten» (Noah 04./05.11.2026, Thread «Wi gaht's? um Träume und Visionen erweitern», Antwort «2a» 23.11.2026):
 * each question that is on at the start has two more wordings. The wording changes from day to day (askVariant), the meaning
 * and the answer stay the same, so the history reads every wording as the same question. The switch «Always the main question»
 * (Ich › Deine Fragen, `cfg.mainOnly`) turns it off. An own or a changed question keeps its words as written.
 * Keys are English; the German texts are in i18n/de/varianten.js. Pure (tests/varianten.test.js).
 */
export const VARIANTS = {
  'erholung.schlaf': ['How did the night treat you: lullaby or alarm siren?', 'Did you sleep like a log?'],
  'erholung.akku': ['How much charge is left in you right now?', 'Battery check: how full are you?'],
  'erholung.koerper': ['How does your body feel today: ready to go or still in the garage?', 'How well-oiled does your body feel today?'],
  'erholung.kaffee': ['How many cups will it take to get you going today?', 'Coffee counter: how many today?'],
  'spass.stimmung': ['How is your mood right now: stormy or sunny?', 'How is the weather in your mood today?'],
  'spass.coolstes': ['What was the highlight of your day?', 'What made today a good one?'],
  'sport.bewegung': ['How much did you move today?', 'Couch, stroll or summit: what was today?'],
  'achtsamkeit.kopf': ['How quiet is it in your head right now?', 'Is your head a still lake today?'],
  'achtsamkeit.moment': ['Did you stop for a moment today and simply look around?', 'Was there a moment today just for looking?'],
  'achtsamkeit.tabs': ['How many things are going through your head at once?', 'How crowded is your head today?'],
  'freunde.verbunden': ['How close do you feel to the people around you?', 'Lone wolf or pack: how connected are you today?'],
  'freunde.laecheln': ['Did you make someone smile today?', 'Did someone smile because of you today?'],
  'natur.draussen': ['How much time did you spend outdoors today?', 'Fresh-air time today: how long?'],
  'natur.wetter': ['What did the weather do to your face today?', 'Which weather did you meet today?'],
  'natur.luft': ['How much fresh air did you get today?', 'How well did your lungs breathe the outdoors?'],
  'visionen.vision': ['Did you take a small step toward your vision this week?', 'How far did you get with your vision this week?'],
  'visionen.tour': ['Which tour keeps coming back to you?', 'Which route are you thinking about right now?'],
  'ziele.ziel': ['What is your one thing for today?', 'What do you want to get done today, in one sentence?'],
  'ziele.liegen': ['What is allowed to wait today?', 'What do you let go of today, just this once?'],
  'erreicht.zufrieden': ['How content are you with today?', 'If today were a ride, how would you rate it?'],
  'erreicht.ziel': ['Did you get done what you set out to do this morning?', 'Did the day go the way you planned it this morning?'],
  'erreicht.stolz': ['What are you quietly proud of today?', 'What would you tell a friend you managed today?'],
  'erreicht.pokal': ['Which cup do you take home today?', 'What do you deserve a medal for today?'],
  'koerper.waage': ['What does the scale say this morning?', 'Weigh-in: how many kilos today?'],
  'koerper.ruhepuls': ['What is your resting pulse this morning?', 'How slowly does your heart beat when you wake up?'],
  'erholung.raeuber': ['What drained your battery today?', 'What cost you the most energy today?'],
  'freunde.allein': ['Did you choose to be alone today?', 'Was today a day of chosen solitude?'],
  'freunde.alleingut': ['How did being alone feel?', 'How well did the quiet time suit you?'],
  'ziele.umplanen': ['Did you change your plan on purpose today?', 'Did the day take a different turn than planned, on purpose?'],
};

const dayNumber = (day) => {
  const [y, m, d] = String(day ?? '').split('-').map(Number);
  return Number.isFinite(y + m + d) ? Math.floor(Date.UTC(y, m - 1, d) / 864e5) : 0;
};
const hashOf = (id) => [...String(id)].reduce((n, c) => n + c.charCodeAt(0), 0);

/**
 * The words a question asks in on `day`: the main text or one of its variants, a different one each day (the same all day,
 * on the page and in the window). `main`: «Always the main question». An own or a changed question, one without variants: its text.
 */
export function askVariant(q, day, main = false) {
  const list = q && !q.own && !q.edited && !main ? VARIANTS[q.id] : null;
  if (!list?.length) return q?.text ?? '';
  const all = [q.text, ...list];
  return all[(dayNumber(day) + hashOf(q.id)) % all.length];
}
