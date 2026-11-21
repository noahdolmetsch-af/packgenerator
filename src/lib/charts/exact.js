import { num } from '../i18n.svelte.js';

/**
 * «Genaue Werte» (Noah 21.11.2026 «1a 2b 3a»): what a chart shows when you point or tap, and its table, is the exact
 * time in hours and minutes («34 h 24 min»), not a rounded «34». The short number on the bar itself stays short.
 */
export function hoursMin(mins) {
  const r = Math.max(0, Math.round(Number(mins) || 0));
  const h = Math.floor(r / 60);
  const m = r % 60;
  if (!h) return `${m} min`;
  return m ? `${num(h)} h ${m} min` : `${num(h)} h`;
}
