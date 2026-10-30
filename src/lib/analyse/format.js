/**
 * «Analyse»: how a value is written, the same on the tiles, the page of one value and «Eigenes Diagramm».
 * num: the number formatter of i18n (passed in, so this file stays plain).
 */
import { shown } from '../messwerte.js';
import { bedText } from '../koerper.js';

export function valueText(x, v, num) {
  if (v == null || !Number.isFinite(v)) return '–';
  if (x.key === 'sleep') return shown('sleep', v, num);
  if (x.key === 'bed') return bedText(v);
  if (x.key === 'skin') return `${v > 0 ? '+' : ''}${num(Math.round(v * 10) / 10)}`;
  if (x.dec) return num(Math.round(v * 10) / 10);
  if (x.key === 'actHours') return num(Math.round(v));
  if (Math.abs(v) < 20 && !x.sum) return num(Math.round(v * 10) / 10);
  return num(Math.round(v));
}

/** The unit after the number (sleep and bedtime carry it in the number). */
export const unitText = (x) => (x.key === 'sleep' || x.key === 'bed' ? '' : (x.unit ?? ''));
