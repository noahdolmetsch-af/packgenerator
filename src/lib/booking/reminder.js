/**
 * Erinnerung an die Kunden (Noah 04.11.2026 «2a» Zeile auf Heute, «2b» E-Mail nur vorbereiten; 08.11.2026 Reihenfolge):
 * Heute shows a row for every lesson today and tomorrow, and its button opens the message app (mail or SMS) with the
 * text ready. This file is the text: a ready default (name, lesson, day, time, place, the cancel rule) or Noah's own
 * text with the words {name} {title} {day} {time} {place} {hours}. The setting lives in «booking.reminder»
 * ({ on, text }), on this device and in the backup. Nothing is ever sent by the app. Pure functions except the two
 * settings helpers.
 */
import { db as appDb } from '../db.js';

export const REMINDER_KEY = 'booking.reminder';
/** The words Noah can put in his own text, in English and in German (each language shows its own list; both work). */
export const REMINDER_WORDS = ['name', 'title', 'day', 'time', 'place', 'hours'];
export const REMINDER_WORDS_DE = ['Name', 'Angebot', 'Tag', 'Zeit', 'Ort', 'Stunden'];

/** {on: shown on Heute (default yes), text: own text, '' = the default}. */
export const reminderSetting = (value) => ({ on: value?.on !== false, text: typeof value?.text === 'string' ? value.text : '' });
export async function loadReminder(db = appDb) {
  return reminderSetting((await db.settings.get(REMINDER_KEY))?.value);
}
export const saveReminder = (value, db = appDb) => db.settings.put({ key: REMINDER_KEY, value: reminderSetting(value) });

/** The words of a text that are filled in (English or German, any case); unknown {words} stay as typed. */
export function fillReminder(text, vars = {}) {
  return String(text ?? '').replace(/\{(\w+)\}/g, (all, k) => {
    const i = Math.max(REMINDER_WORDS.indexOf(k.toLowerCase()), REMINDER_WORDS_DE.findIndex((w) => w.toLowerCase() === k.toLowerCase()));
    return i < 0 ? all : String(vars[REMINDER_WORDS[i]] ?? '');
  });
}

/**
 * The message for one lesson. tr: the translator (t). Own text: filled in as it is. Default: greeting and lesson, the
 * place when the lesson or the offer has one, the cancel rule when the offer has one.
 */
export function reminderMessage({ text = '', name, title, day, time, place = '', hours = null }, tr = (s) => s) {
  const vars = { name, title, day, time, place, hours: hours ?? '' };
  if (String(text).trim()) return fillReminder(text, vars).trim();
  const parts = [tr('Hello {name}! A reminder: {title} {day} at {time}.', vars)];
  if (place) parts.push(tr('Place: {place}.', vars));
  if (hours) parts.push(tr('If you cannot come, please tell me up to {hours} h before.', vars));
  parts.push(tr('See you then!'));
  return parts.join(' ');
}

/** The subject of the e-mail. */
export const reminderSubject = ({ title, day, time }, tr = (s) => s) => tr('Reminder: {title} {day} at {time}', { title, day, time });
