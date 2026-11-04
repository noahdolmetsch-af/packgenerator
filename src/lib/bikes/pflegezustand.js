/**
 * «Das Velo zeigt seine Pflege» (Noah 03.11.2026 «b», Paket C idea 22): how a bike looks on its card.
 * It gleams after washing, oiling or any service, and gets dusty (later a cobweb) when no care is
 * recorded for a long time. It is a quiet reminder, never a mark against anyone: without any record
 * the bike looks normal (nothing to judge by, never «dusty» out of ignorance).
 *
 * Care = a wash, a service or replacement, a finished repair, the service of the whole bike.
 * A «work needed» entry and a plain check are not care. Pure functions, tested in tests/pflegezustand.test.js.
 */
import { bikeLog } from '../care.js';
import { localDay } from '../localday.js';

/** Days: up to GLEAM the bike gleams; from DUST on it is dusty; from WEB on a cobweb hangs on the wheel. */
export const GLEAM_DAYS = 7;
export const DUST_DAYS = 45;
export const WEB_DAYS = 90;

const CARE = new Set(['wash', 'service', 'replace', 'repair']);
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);

/** The newest day of care on a bike (YYYY-MM-DD) or null. bike: from withVisits (workshop jobs count too). */
export function careDay(bike, tasks = []) {
  const days = bikeLog(bike, tasks)
    .filter((h) => CARE.has(h.action) && h.result !== 'needed' && h.date)
    .map((h) => h.date);
  if (bike?.service?.last?.day) days.push(bike.service.last.day);
  return days.sort().at(-1) ?? null;
}

/**
 * How the bike looks: { look, days } with look 'clean' | 'normal' | 'dusty' | 'web'; days since the
 * last care (null when none is recorded; then the look is 'normal'). A day in the future counts as today.
 */
export function careLook(bike, tasks = [], today = localDay()) {
  const day = careDay(bike, tasks);
  if (!day) return { look: 'normal', days: null };
  const days = Math.max(0, daysBetween(day, today));
  const look = days <= GLEAM_DAYS ? 'clean' : days >= WEB_DAYS ? 'web' : days >= DUST_DAYS ? 'dusty' : 'normal';
  return { look, days };
}
