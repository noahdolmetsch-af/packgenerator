/**
 * «Velo-Weisheit» (Noah 03.11.2026, H6 aus dem Geheimmenü): the fifth tap on «PG» can show a short saying in a
 * speech bubble, a different one each time. Pairs [English, German]: the English text is the source (t() key), the
 * German one is Mundart and goes into the German texts (i18n/de/logo-sprueche.js reads this list), so both stay in
 * one place. A draft: every saying can be renamed, hidden, deleted and added to in «Listen und Typen»
 * (list 'sayings', applists.js); a typed text never goes through t().
 */
import { listOf, nameOf } from '../applists.js';

export const SAYINGS = [
  ['A headwind is free training.', 'Gägewind isch Gratis-Training.'],
  ['There is no bad weather, only bad cycling shorts.', 'Es git kes schlächts Wätter, nur e schlächti Velohose.'],
  ['Whoever rides up may roll down.', 'Wer ufe fahrt, darf abe rolle.'],
  ['The hill is only steep until you are at the top.', 'De Bärg isch nume steil, bis me obe isch.'],
  ['Slow is fine, as long as it keeps rolling.', 'Langsam isch guet, Hauptsach es rollt.'],
  ['A tailwind makes everyone a hero.', 'Mit Rückewind isch jede en Held.'],
  ['An oiled chain, a good mood.', 'Gölti Chette, gueti Luune.'],
  ['The best view is always after the last bend.', 'Di schönschti Ussicht chunnt immer nach de letschte Kurve.'],
  ['A flat tyre is just a short break with a pump.', 'En Platte isch nume e churzi Pause mit Pumpi.'],
  ['First the pass, then the cake.', 'Zerscht de Pass, denn de Chueche.'],
  ['Today I ride, tomorrow I rest, the day after I plan.', 'Hüt fahr i, morn rueh i, übermorn plan i.'],
  ['Legs hurt? That is the pass saying hello.', 'D Bei tüend weh? Das isch de Pass, wo Grüezi seit.'],
  ['Every kilometre is a small win.', 'Jede Kilometer isch en chliine Sieg.'],
  ['Better one snack too many than one too few.', 'Lieber en Snack zviel als zwenig.'],
  ['The marmot stays calm, so can you.', 'S Murmeli blibt ruhig, das chasch du au.'],
  ['A bell is cheaper than an apology.', 'Es Glöggli isch billiger als e Entschuldigung.'],
  ['Rest days are training days too.', 'Ruhetäg sind au Trainingstäg.'],
  ['Pack light, smile wide.', 'Liecht packe, breit lächle.'],
  ['Not every road leads to Rome, but many lead to a café.', 'Nöd jede Wäg füehrt nach Rom, aber vili is Café.'],
  ['Cows have the right of way.', 'D Chüe händ Vortritt.'],
];

/** The Standard list for «Listen und Typen»: [{ id, name }] (name: the English key). */
export const SAYINGS_STD = SAYINGS.map((q, i) => ({ id: `sy${i}`, name: q[0] }));

/** The sayings the person has and has not hidden: [{ id, name, own?, renamed? }]. */
export const sayingsOffered = () => listOf('sayings', SAYINGS_STD).filter((e) => !e.hidden);

/** The text of one saying for the screen (a typed or renamed one as it is, a Standard one through tr). */
export const sayingText = (id, tr = (s) => s) => nameOf('sayings', SAYINGS_STD, id, tr, '');

/** Picks one offered saying, not `prev` (unless it is the only one); null when none is left. rnd: 0 ≤ r < 1. */
export function pickSaying(offered = sayingsOffered(), prev = null, rnd = Math.random) {
  const pool = offered.length > 1 ? offered.filter((e) => e.id !== prev) : offered;
  return pool.length ? pool[Math.min(pool.length - 1, Math.floor(rnd() * pool.length))].id : null;
}
