/**
 * Paket O «Sportarten»: the names on the sport pages. A typed name (an own sport, a renamed one, an
 * activity of Aktiv) never goes through t(); the app's own names do.
 */
import { t } from '../i18n.svelte.js';
import { actName } from '../flow/ui.svelte.js';
import { UNITS, valueText } from '../sportsprogress.js';

/** The name of a sport (sportsbase.js allSports). */
export const sportName = (s) => (!s ? '' : s.act ? actName(s.act) : s.raw ? s.name : t(s.name));
/** The name of a block (sportsbase.js blocksOf). */
export const blockName = (b) => (b.raw ? b.name : t(b.name));
/** The name of a measure: typed (raw) or the app's suggestion (an English key). */
export const measureName = (m) => (m.suggested || m.auto ? t(m.name) : m.name);
/** A value with its unit: «80 kg», «5:30 min/km», «6a+». */
export function withUnit(v, unit, fmt) {
  const s = valueText(v, unit, fmt);
  const short = UNITS[unit]?.short ? t(UNITS[unit].short) : '';
  return short && s ? `${s} ${short}` : s;
}
