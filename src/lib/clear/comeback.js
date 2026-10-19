/**
 * Paket Q #142 «Wiedereinstieg nach langer Pause»: after a long break the app first shows what is
 * due and what is new, in its own window (rule 19: «Später» = back in one hour, «Heute nicht» = not
 * before tomorrow). Per device (meta table, never exported or synced): the window greets the device
 * that was not opened for a while.
 * Pure, tested in tests/comeback.test.js.
 */
import { localDay } from '../localday.js';

/** meta key: when this device last opened the app ({ at }). */
export const LAST_OPEN = 'lastOpen';
/** meta key: a waiting greeting ({ since, until, made }). */
export const COMEBACK = 'comeback';
/** A break of this many days or more counts as long. */
export const PAUSE_DAYS = 21;
/** A greeting nobody looked at goes away after this many days. */
const KEEP_DAYS = 7;
const HOUR = 36e5;

/** Days between two moments (whole days, down). */
export const daysBetween = (a, b) => Math.floor((new Date(b) - new Date(a)) / 864e5);

/**
 * On start: the last open (or null) and a waiting greeting (or null) → the new greeting record to
 * store (or null when there is none). A first start never greets.
 */
export function startComeback(lastOpenIso, waiting, now = new Date(), pause = PAUSE_DAYS) {
  if (waiting && daysBetween(waiting.made, now) < KEEP_DAYS) return waiting;
  if (!lastOpenIso) return null;
  return daysBetween(lastOpenIso, now) >= pause ? { since: lastOpenIso, until: null, made: now.toISOString() } : null;
}

/** Is the greeting to be shown now? */
export const showComeback = (rec, now = new Date()) => !!rec && (!rec.until || new Date(rec.until) <= now);

/** «Später»: in one hour again. */
export const later = (rec, now = new Date()) => ({ ...rec, until: new Date(now.getTime() + HOUR).toISOString() });

/** «Heute nicht»: from tomorrow morning (local day) again. */
export function notToday(rec, now = new Date()) {
  const d = new Date(`${localDay(now)}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return { ...rec, until: d.toISOString() };
}

/**
 * The lines of the greeting, most important first; only lines with something in them.
 * input: { since, care (points due), trip ({ title, startDate } next planned or null), backupDays
 * (days since the last backup, null = never), backupDue, inbox (open notes), news (versions since) }.
 * Each line: { key, text (English key for t()), vars, href }.
 */
export function comebackLines({ care = 0, trip = null, backupDue = false, backupDays = null, inbox = 0, news = 0 }, today = localDay()) {
  const out = [];
  if (care > 0) out.push({ key: 'care', text: care === 1 ? '1 care point on your bikes is due' : '{n} care points on your bikes are due', vars: { n: care }, href: '#/bikes?tab=care' });
  if (trip?.startDate) {
    const d = daysBetween(`${today}T00:00:00`, `${trip.startDate}T00:00:00`);
    out.push({ key: 'trip', text: d <= 0 ? 'Next trip «{title}» is today' : d === 1 ? 'Next trip «{title}» is tomorrow' : 'Next trip «{title}» in {n} days', vars: { title: trip.title, n: d }, href: '#/pack' });
  }
  if (inbox > 0) out.push({ key: 'inbox', text: inbox === 1 ? '1 note waits in the Inbox' : '{n} notes wait in the Inbox', vars: { n: inbox }, href: '#/inbox' });
  if (backupDue) out.push({ key: 'backup', text: backupDays == null ? 'There is no backup yet' : 'Your last backup is {n} days old', vars: { n: backupDays }, href: '#/me/data' });
  if (news > 0) out.push({ key: 'news', text: news === 1 ? 'New since your last visit: 1 version' : 'New since your last visit: {n} versions', vars: { n: news }, href: '#/me/news' });
  return out;
}
