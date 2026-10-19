/**
 * v0.144.0 RE «Pflege selbst einstellen»: the words of one care row (care/plan.js careRow), in the
 * current language: «alle 150 km», «alle 150 km oder 60 Tage», «Warnung 0,4 % · ersetzen 0,5 %».
 */
import { t, num } from '../i18n.svelte.js';
import { PART } from '../care.js';
import { CARE_ITEM } from './plan.js';

const unitOf = (key) => PART[CARE_ITEM[key]?.parts?.[0]]?.unit ?? '';
const withUnit = (v, unit) => `${num(v)} ${unit}`.trim();

/** The interval or limits as words. values: { everyKm, everyDays } | { warnAt, limit }. */
export function careText(row, values = row.values) {
  if (row.kind === 'wear') {
    const unit = unitOf(row.key);
    const low = !!PART[CARE_ITEM[row.key].parts[0]]?.lowIsWorn;
    const rep = low ? t('replace below {v}', { v: withUnit(values.limit, unit) }) : t('replace at {v}', { v: withUnit(values.limit, unit) });
    return values.warnAt != null ? `${t('warning {v}', { v: withUnit(values.warnAt, unit) })} · ${rep}` : rep;
  }
  const km = values.everyKm != null ? `${num(values.everyKm)} km` : '';
  const days = values.everyDays != null ? t('{n} days', { n: num(values.everyDays) }) : '';
  // «Velo im Griff» #193: riding hours as the third measure (fork, shock)
  const hours = values.everyHours != null ? `${num(values.everyHours)} h` : '';
  const all = [km, days, hours].filter(Boolean);
  if (all.length === 3) return t('every {a}, {b} or {c}, whichever comes first', { a: all[0], b: all[1], c: all[2] });
  if (all.length === 2) return t('every {a} or {b}, whichever comes first', { a: all[0], b: all[1] });
  return t('every {v}', { v: all[0] ?? '' });
}
/** What counts now. */
export const careValue = (row) => careText(row, row.values);
/** The standard of the row. */
export const careStdText = (row) => careText(row, row.std);
