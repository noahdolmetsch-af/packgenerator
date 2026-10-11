/**
 * v0.86.0 «Meditation einfach»: the one way a meditation session starts, shared by the meditation page
 * (B, «Wie letztes Mal» and the template chips) and the start sheet of «Heute abhaken» (A). The plan
 * comes from flowmed.js sessionPlan; the running view opens (B7). data: the medQuery result.
 */
import { startSession, clockState, ui, actName } from '../ui.svelte.js';
import { artsOf, choiceList, sessionPlan, sortTemplates, lastSession, bowlWords, PLACES } from '../../flowmed.js';
import { SOUNDS, DEFAULT_SOUND } from '../../flowsounds.js';
import { artName, tplName } from './words.js';
import { t } from '../../i18n.svelte.js';

/** An activity with its own meditation page (Activity.svelte hrefOf: the same rule). */
export const isMedAct = (a) => !!a && (a.page === 'meditation' || a.id === 'meditation');

/** The kind of meditation by id, from the page settings. */
export const artOfData = (data, id) => (id ? (artsOf(data?.arts).all.find((a) => a.id === id) ?? null) : null);

/**
 * Start a session. A session already running opens again instead (the old page did the same).
 * opts: { minutes, bowl, sound, endSound, art, tplId, name }. Returns true when a new one started.
 */
export function beginMed(actId, data, { minutes, bowl, sound, endSound, art = null, tplId = null, name = null }) {
  if (clockState.tm) {
    ui.sessionOpen = true;
    return false;
  }
  const act = data?.acts?.find((a) => a.id === actId) ?? null;
  const places = choiceList(data?.places, PLACES);
  const cur = places.list.find((p) => p.id === places.cur) ?? null;
  const a = artOfData(data, art);
  const plan = sessionPlan({ minutes, bowl, sound, endSound, art, tplId, name, place: places.cur });
  plan.extra.session.artLabel = a ? artName(a) : act ? actName(act) : '';
  plan.extra.session.placeLabel = !cur ? '' : cur.own ? cur.name : t(cur.name);
  startSession(actId, plan);
  return true;
}

/** The start of a template (minutes can be changed: the start sheet's chips). */
export const tplStart = (x, minutes = null) => ({ minutes: minutes ?? x.minutes, bowl: x.bowl, sound: x.sound, endSound: x.endSound, art: x.art, tplId: x.id, name: tplName(x) });

/** The templates, the last used first; never used: the suggestions in their order. */
export const medTemplates = (data) => sortTemplates(data?.tpls ?? []);

/** «Wie letztes Mal»: the last session as a start, or null before the first one. */
export function lastStart(data, actId) {
  const last = data ? lastSession(data.sessions, data.log, actId) : null;
  if (!last) return null;
  const x = last.tplId ? medTemplates(data).find((y) => y.id === last.tplId) : null;
  return { last, tpl: x, start: { minutes: last.target ?? last.min, bowl: last.bowl, sound: last.sound, endSound: last.endSound, art: last.art, tplId: last.tplId, name: x ? tplName(x) : null } };
}

/** The muted line of a start: «Vorlage «Morgen 20» · Gong alle 5:00 · Klangschale tief». */
export function startLine(x) {
  if (!x) return '';
  const w = bowlWords(x.bowl);
  const parts = [];
  if (x.name) parts.push(t('Template «{name}»', { name: x.name }));
  parts.push(t('Gong {when}', { when: t(w.key, w.vars) }));
  parts.push(t(SOUNDS.find((s) => s.id === (x.sound ?? DEFAULT_SOUND))?.name ?? 'Singing bowl deep'));
  return parts.join(' · ');
}
