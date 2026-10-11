/**
 * Hobby pages, package 1: the words of the tiles and milestones in the current language (names,
 * stages, numbers, days). The numbers come from flowms.js and flowtiles.js.
 */
import { t, tn, num, locale, lang } from '../../i18n.svelte.js';
import { actName } from '../ui.svelte.js';
import { STAGES } from '../../flowms.js';
import { dayShort } from '../words.js';

/** The tile name: the playful name (a suggestion, renamable), else the activity's name. */
export const tileName = (a) => (a ? (lang.v === 'de' && a.nickDe ? a.nickDe : a.nick) || actName(a) : '');
/** A milestone's name. */
export const msName = (m) => t(m.name, m.vars);
/** «4th star · Depth» */
export const stageName = (k) => t(STAGES[Math.max(0, Math.min(6, k - 1))]);
export const starLine = (k) => t('Star {k} · {stage}', { k, stage: stageName(k) });
/** A value with its unit: «212 h», «45 min», «4'610». */
export function val(v, unit = '') {
  const n = Number(v) || 0;
  const s = Number.isInteger(n) ? num(n) : n.toLocaleString(locale(), { maximumFractionDigits: 1 });
  return unit === 'days' ? tn(n, '{n} day', '{n} days') : unit ? `${s} ${unit}` : s;
}
/** «today», «28 Sept». */
export const dayWord = (day, today) => (!day ? '' : day === today ? t('today') : dayShort(day));
/** «Sept.» for a day. */
export const monthWord = (day, month = 'short') => new Date(`${day}T00:00:00Z`).toLocaleDateString(locale(), { month, timeZone: 'UTC' });
