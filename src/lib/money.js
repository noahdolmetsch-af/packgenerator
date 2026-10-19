/**
 * Impeccable (18.10.2026, Werkstatt 2): one way to write an amount in Care, Workshop & receipts and
 * Equipment: «CHF 1'716», «CHF 80», and the Rappen only when they are not 00: «CHF 80.50».
 */
import { locale } from './i18n.svelte.js';

export function chfText(n) {
  if (n == null || n === '' || !Number.isFinite(Number(n))) return '';
  const r = Math.round(Number(n) * 100) / 100;
  const cents = !Number.isInteger(r);
  return `CHF ${r.toLocaleString(locale(), { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })}`;
}
