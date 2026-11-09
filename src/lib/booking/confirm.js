/**
 * Bestätigung an die Kunden (Noah 05.11.2026 «5c», 09.11.2026 «mit bestätigungsmail»): when a booking or request is
 * confirmed, the message to the customer is prepared with the lesson, the place, the cancel rule and three lines Noah
 * writes once: where to meet (Besammlung), pick-up (Abholung) and what happens when it rains. Empty lines are left
 * out. The setting lives in «booking.confirm» ({ meet, pickup, rain }), on this device and in the backup. Nothing is
 * ever sent by the app; Noah sends the mail or SMS himself. Pure functions except the two settings helpers.
 */
import { db as appDb } from '../db.js';

export const CONFIRM_KEY = 'booking.confirm';
export const CONFIRM_MAX = 160;

const line = (v) => (typeof v === 'string' ? v.trim().slice(0, CONFIRM_MAX) : '');
/** {meet, pickup, rain}: three short texts, '' = not mentioned. */
export const confirmSetting = (value) => ({ meet: line(value?.meet), pickup: line(value?.pickup), rain: line(value?.rain) });
export async function loadConfirm(db = appDb) {
  return confirmSetting((await db.settings.get(CONFIRM_KEY))?.value);
}
export const saveConfirm = (value, db = appDb) => db.settings.put({ key: CONFIRM_KEY, value: confirmSetting(value) });

/**
 * The message for one confirmed lesson. tr: the translator (t). Greeting and lesson first; then, only where there is
 * something to say: the place, the meeting point, the pick-up, the rain rule and the cancel rule of the offer.
 */
export function confirmMessage({ name, title, when, place = '', hours = null, meet = '', pickup = '', rain = '' }, tr = (s) => s) {
  const v = { name, title, when, place, hours: hours ?? '', meet, pickup, rain };
  const parts = [tr('Hello {name}! The lesson is booked: {title} on {when}.', v)];
  if (place) parts.push(tr('Place: {place}.', v));
  if (meet) parts.push(tr('Meeting point: {meet}.', v));
  if (pickup) parts.push(tr('Pick-up: {pickup}.', v));
  if (rain) parts.push(tr('If it rains: {rain}.', v));
  if (hours) parts.push(tr('If you cannot come, please tell me up to {hours} h before.', v));
  parts.push(tr('See you then!'));
  return parts.join(' ');
}

/** The subject of the e-mail. */
export const confirmSubject = ({ title, when }, tr = (s) => s) => tr('Confirmed: {title}, {when}', { title, when });
