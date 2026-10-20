/**
 * Garmin-Übersicht (20.10.2026): the small shared words and signs of its cards and pages.
 */
import { Bike, Footprints, Mountain, Activity } from '@lucide/svelte';
import { KIND_NAMES } from '../../training.js';
import { t, locale, num } from '../../i18n.svelte.js';

export const SPORT_ICON = { bike: Bike, run: Footprints, hike: Mountain, other: Activity };
export const sportName = (kind) => t(KIND_NAMES[kind] ?? KIND_NAMES.other);

/** 1:08:14 (Garmin's time), from seconds. */
export function hms(s) {
  const v = Math.round(Number(s) || 0);
  const h = Math.floor(v / 3600);
  const m = Math.floor((v % 3600) / 60);
  const sec = v % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
/** The first letter of the weekday (M, D, M … in German). */
export const wdLetter = (day) => new Date(`${day}T00:00:00Z`).toLocaleDateString(locale(), { weekday: 'narrow', timeZone: 'UTC' });
/** «14.–20. Okt.» or «28. Sep.–4. Okt.» */
export function rangeText(from, to) {
  const o = { day: 'numeric', month: 'short', timeZone: 'UTC' };
  const a = new Date(`${from}T00:00:00Z`);
  const b = new Date(`${to}T00:00:00Z`);
  if (a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear()) return `${a.getUTCDate()}.–${b.toLocaleDateString(locale(), o)}`;
  return `${a.toLocaleDateString(locale(), o)}–${b.toLocaleDateString(locale(), o)}`;
}
/** «14.10» */
export const dm = (day) => `${Number(day.slice(8, 10))}.${Number(day.slice(5, 7))}`;
/** A month as «Okt.» */
export const monthShort = (day) => new Date(`${day}T00:00:00Z`).toLocaleDateString(locale(), { month: 'short', timeZone: 'UTC' });
/** Two decimals for km like Garmin (100.73), one for big sums. */
export const km2 = (v) => num(Math.round((v ?? 0) * 100) / 100);
