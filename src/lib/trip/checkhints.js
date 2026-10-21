/**
 * v0.111.0 Vorabend- und Schluss-Check (mockups V2, V3, V6): the quiet line under a row and the chips on
 * top of the sheet, only from what the app knows about the trip (weather, route, charge list, notes).
 * Without data a row has no line and the sheet no chip: nothing is made up.
 */
import { t, tn, num, locale } from '../i18n.svelte.js';
import { RAIN } from '../trips.js';
import { CHECK_LINKS } from '../checks.js';
import { dangerOf, dangerShort } from '../skiplan.js';

const wxText = (wx) => (wx?.min != null && wx?.max != null ? `${wx.min}–${wx.max} °C, ${t(RAIN[wx.rain ?? 'none'])}` : '');
const routeText = (r) => (r?.km ? [r.name, `${num(Math.round(r.km))} km`, r.gainM ? `${num(Math.round(r.gainM))} ${t('m up|short')}` : null].filter(Boolean).join(' · ') : '');

/** A day as «12 Dec» / «12. Dez.». */
export const shortDay = (iso) => (iso ? new Date(`${String(iso).slice(0, 10)}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' }) : '');

/** The line under a row (or ''). ctx: { trip, charged: { done, total } }. */
export function checkHint(row, kind, { trip = null, charged = null } = {}) {
  if (kind === 'eve') {
    if (row.id === 'bulletin') return t('A new bulletin every day at 17:00');
    if (row.id === 'weather') return wxText(trip?.wx);
    if (row.id === 'route' || row.id === 'gps') return routeText(trip?.route);
    if (row.id === 'charge' && charged?.total) return `${t('{done} of {n} charged', { done: charged.done, n: charged.total })} · ${t('from «Charge the evening before»')}`;
    return '';
  }
  if (row.id === 'broken') return t('Goes into the debrief');
  return '';
}

/** The link of a row (CHECK_LINKS), the charge list only before the trip. */
export const checkLink = (row, kind) => (kind === 'eve' || CHECK_LINKS[row.id]?.out ? CHECK_LINKS[row.id] ?? null : null);

/** The chips on top of the sheet: [{ key, text }]. */
export function checkChips(kind, { trip = null, notes = 0, debriefDone = false } = {}) {
  const out = [];
  if (kind === 'eve') {
    const wx = wxText(trip?.wx);
    if (wx) out.push({ key: 'wx', text: wx });
    const route = routeText(trip?.route);
    if (route) out.push({ key: 'route', text: route });
    // Paket P2: a ski tour's plan (#/ski/plan) on top of the evening-before check
    const plan = trip?.domain === 'ski' ? (trip.ski?.plan ?? {}) : {};
    const level = dangerOf(plan.level);
    if (level) out.push({ key: 'danger', text: t('Danger {level}', { level: dangerShort(plan) }) + ` · ${t(level.name)}` });
    if (plan.temp != null && plan.temp !== '') out.push({ key: 'temp', text: `${plan.temp} °C` });
    if (plan.wind) out.push({ key: 'wind', text: plan.wind });
    if (trip?.domain === 'ski' && trip.ski?.trainAt) out.push({ key: 'train', text: t('Last train {time}', { time: trip.ski.trainAt }) });
  } else {
    if (notes) out.push({ key: 'notes', text: tn(notes, '{n} note on the way', '{n} notes on the way') });
    if (!debriefDone) out.push({ key: 'debrief', text: t('Debrief waiting') });
  }
  return out;
}
