/**
 * v0.60.0 «Material-Detail ruhig» (Noah 1a): the item window and the computer's detail column show
 * at the top only the name, the weight with its status and ONE line on how the item comes along
 * («Kommt mit: Standard · unter 10 °C · Satteltasche»). Everything else folds away row by row, each
 * row with a short summary, and only one row is open at a time (the last one opened is remembered
 * for the session). Pure functions, tested in tests/detail0540.test.js.
 */
import { BAG } from '../gear.js';
import { RIDES, rainOf } from '../layers.js';
import { comesOf } from './comes.js';
import { t, tn } from '../i18n.svelte.js';

/** The block's short label, as the chips show it (a built-in night block without "Night: "). */
export const blockLabel = (b) => (b.builtIn ? b.name.replace(/^(Night|Nacht): /, '') : b.name);

/** The weight's status in one or two words: 'weighed', 'from a list' or 'not weighed'. */
export function weightState(item) {
  if (item?.weightG == null || String(item.weightG).trim() === '') return t('not weighed');
  return item.weightStatus === 'measured' || !item.weightStatus ? t('weighed') : t('from a list');
}

/** The blocks the item is in, Standard first: ['Standard', 'Licht', …]. blocks: allSets(…). */
export function blockNames(item, blocks = []) {
  const out = comesOf(item).standard ? [t('Standard|block')] : [];
  for (const b of blocks) if (item?.sets?.includes(b.key)) out.push(blockLabel(b));
  return out;
}

/** The weather and riding-time rules in a few words: ['Daily ride', 'below 10 °C', 'when it rains']. */
export function ruleNames(item) {
  const out = [];
  const ride = RIDES.find((r) => r.key === item?.ride && r.key !== 'every');
  if (ride) out.push(t(ride.name));
  const cold = String(item?.coldBelow ?? '').trim();
  if (cold !== '') out.push(t('below {t} °C', { t: cold }));
  if (rainOf(item) && item?.rain) out.push(item.rain === 'yes' ? t('when it rains') : t('offered for rain'));
  if (String(item?.perHours ?? '').trim() !== '') out.push(t('1 per {n} h', { n: item.perHours }));
  return out;
}

/** Where it goes in one or two words: 'On me' or the usual bag. */
export function placeName(item) {
  if (comesOf(item).body) return t('On me');
  return BAG[item?.defaultBag] ? t(BAG[item.defaultBag]) : t('In a bag');
}

/**
 * The one summary line under the name: «Comes along: Standard · below 10 °C · Seat bag». Without a
 * block or a rule it says «by hand»; an item marked «stays at home» says so first.
 */
export function comesLine(item, blocks = []) {
  const how = [...blockNames(item, blocks), ...ruleNames(item)];
  const parts = [...(comesOf(item).optional ? [t('Stays at home')] : []), ...(how.length ? how : [t('by hand')]), placeName(item)];
  return t('Comes along: {what}', { what: parts.join(' · ') });
}

/** The summary of the «History» row: «8× along · 4× used», or that it was on no debriefed trip. */
export function lifeLine(u, lighter = 0) {
  const head = u?.taken ? [t('{n}× along', { n: u.taken }), t('{n}× used', { n: u.used })] : [t('on no reviewed trip yet')];
  if (lighter) head.push(tn(lighter, '{n} lighter option', '{n} lighter options'));
  return head.join(' · ');
}

/* ---------- the open row, remembered for the session ---------- */
const KEY = 'pack.itemFold';

/**
 * The row opened last in this session (sessionStorage), or null when all were closed. scope: 'item'
 * or 'panel'. fallback: the row open before anything was opened or closed in this session.
 */
export function lastFold(scope = 'item', fallback = null) {
  try {
    const v = sessionStorage.getItem(`${KEY}.${scope}`);
    return v == null ? fallback : v === '-' ? null : v;
  } catch {
    return fallback;
  }
}

/** Remember the open row (null: none open). */
export function keepFold(scope, key) {
  try {
    sessionStorage.setItem(`${KEY}.${scope}`, key || '-');
  } catch {
    /* private mode */
  }
}

/**
 * The next open row after a row was opened or closed (one open at a time): opening a row closes
 * the others; closing a row that is not the open one (the browser reporting the others) changes
 * nothing.
 */
export const nextFold = (current, key, open) => (open ? key : current === key ? null : current);
