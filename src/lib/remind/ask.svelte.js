/**
 * Erinnerungen überall (ER1–ER3): the one open question «Soll ich dich in Zukunft erinnern?».
 * A place calls offerActivity / offerTrip / offerCare right after it saved something; when the app may
 * ask there (remind.js shouldAsk), the question waits (ask.pending) until the next page, so the card never
 * covers the next step at that place (the sentence after a meditation, «Ausblenden»). RemindCard.svelte
 * then shows it (1a), never on Heute (HN0, 5b).
 */
import { db } from '../db.js';
import { localDay } from '../localday.js';
import { loadTodos, addTodo, restoreTodos } from '../merkendb.js';
import { ASK_KEY, OFFER_KEY, shouldAsk, answer, suggestRhythm, tripSteps } from '../remind.js';
import { pageOf } from '../nav.js';

export const ask = $state({ offer: null, pending: null, from: null });

const here = () => (typeof location !== 'undefined' ? pageOf(location.hash) : null);
/** Keeps the question until the page changes; showPending() shows it there. */
function hold(offer, from) {
  ask.pending = offer;
  ask.from = from;
  showPending();
}
/** On a page other than where it was asked, and not on Heute: the card shows. */
export function showPending() {
  const p = here();
  if (!ask.pending || p === ask.from || p === 'home') return;
  ask.offer = ask.pending;
  ask.pending = null;
}

const setting = async (key, fallback) => (await db.settings.get(key))?.value ?? fallback;
export const putSetting = (key, value) => db.settings.put({ key, value: JSON.parse(JSON.stringify(value)) });

async function may(src) {
  // Heute stays as it is (Home locked, HN0; Noah 5b): the app does not ask there
  if (here() === 'home') return false;
  const [answers, todos, offer] = await Promise.all([setting(ASK_KEY, {}), loadTodos(db), setting(OFFER_KEY, true)]);
  return shouldAsk(src, { answers, todos, today: localDay(), offer });
}

/** After an activity was ticked or a session ended (ER1): the rhythm from its last 3 weeks (3a). */
export async function offerActivity(act, name) {
  if (!act?.id) return;
  const src = `act:${act.id}`;
  const from = here();
  if (!(await may(src))) return;
  const entries = await db.flowLog.where('actId').equals(act.id).toArray();
  hold({ kind: 'activity', src, act: { id: act.id, name }, rhythm: suggestRhythm(entries, localDay()), id: Date.now() }, from);
}

/** The same by the activity's id (a timed session ended), with its name in the current language. */
export async function offerActivityById(actId, lang = 'de') {
  const a = actId ? await db.flowActs.get(actId) : null;
  if (a) await offerActivity(a, (lang === 'de' && a.nameDe ? a.nameDe : a.name) || '');
}

/** After a new trip was saved (ER2): the steps still ahead. */
export async function offerTrip(trip) {
  if (!trip?.id || !trip.startDate) return;
  const steps = tripSteps(trip.startDate, localDay());
  if (!steps.length) return;
  const src = `trip:${trip.id}`;
  const from = here();
  if (!(await may(src))) return;
  hold({ kind: 'trip', src, trip: { id: trip.id, title: trip.title ?? '' }, steps, id: Date.now() }, from);
}

/** After a care job on a bike (ER2 «Kette geölt»). */
export async function offerCare(bike, kind) {
  if (!bike?.id || kind !== 'chain') return;
  const src = `care:${bike.id}:${kind}`;
  const from = here();
  if (!(await may(src))) return;
  hold({ kind: 'care', src, bike: { id: bike.id, name: bike.name, km: bike.km ?? null }, care: kind, id: Date.now() }, from);
}

/** «Ja, erinnern»: saves the reminders; returns Undo. */
export async function acceptOffer(list) {
  const before = await loadTodos(db);
  for (const fields of list) await addTodo(db, fields);
  ask.offer = null;
  return () => restoreTodos(db, before);
}

/** «Nein danke» (asks again after 30 days, 2a) or «Nie fragen». */
export async function declineOffer(how) {
  const src = ask.offer?.src;
  ask.offer = null;
  if (!src) return;
  await putSetting(ASK_KEY, answer(await setting(ASK_KEY, {}), src, how, localDay()));
}

export const closeOffer = () => (ask.offer = null);
