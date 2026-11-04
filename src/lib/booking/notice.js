/**
 * Termine buchen (BU4, Noah 14.10.2026 «3 a und b», «9a»): a new booking is one short row in
 * «Heute wichtig». bookingNotes: a store of { id, title, n, name, at } per offer with unseen
 * bookings (the offers on this device, their bookings fetched once); bookingRow turns one into a
 * row of Today's list. Kept here so Home only adds one line.
 */
import { readable } from 'svelte/store';
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { t, locale } from '../i18n.svelte.js';
import { localDay } from '../localday.js';
import { OFFERS_KEY, SEEN_KEY, allBookings } from './client.js';
import { unseen, dayOf, timeOf, addDays, remindersOf, contactHref } from './model.js';

export const bookingNotes = readable([], (set) => {
  let all = null;
  let seen = [];
  const show = () => {
    if (!all) return;
    const today = localDay();
    const d = new Date();
    const now = `${today}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    set([
      ...all.flatMap((o) => {
        const fresh = unseen(o.bookings, seen, today);
        return fresh.length ? [{ id: o.id, title: o.title, n: fresh.length, name: fresh[0].name, at: fresh[0].at, ask: fresh.every((b) => b.status === 'requested') }] : [];
      }),
      // reminders (Noah 04.11.2026 «2a»): lessons today and tomorrow, with a message Noah sends himself
      ...all.flatMap((o) => remindersOf(o.bookings, now).map((b) => ({ remind: true, id: o.id, title: o.title, b, today, tomorrow: addDays(today, 1) }))),
    ]);
  };
  const sub = liveQuery(async () => ({ offers: (await db.settings.get(OFFERS_KEY))?.value ?? [], seen: (await db.settings.get(SEEN_KEY))?.value ?? [] })).subscribe((q) => {
    seen = q.seen;
    if (all === null && q.offers.length) {
      all = [];
      allBookings(q.offers).then((x) => ((all = x), show()));
    }
    show();
  });
  return () => sub.unsubscribe();
});

export function bookingRow(n) {
  if (n.remind) return reminderRow(n);
  const when = `${new Date(`${dayOf(n.at)}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric' })} ${timeOf(n.at)}`;
  const text = n.ask
    ? n.n === 1 ? t('New request: {name} · {title} · {when}', { name: n.name, title: n.title, when }) : t('{n} new requests: {title}', { n: n.n, title: n.title })
    : n.n === 1 ? t('New booking: {name} · {title} · {when}', { name: n.name, title: n.title, when }) : t('{n} new bookings: {title}', { n: n.n, title: n.title });
  return { key: `book:${n.id}`, tone: 'info', text, act: { label: t('Look'), href: `#/me/offers/${n.id}` } };
}

/** «Tomorrow: lesson with Mia» + «Remind»: the button opens the message app with the text ready. */
function reminderRow(n) {
  const day = dayOf(n.b.at) === n.today ? t('today') : t('tomorrow');
  const text = t('Lesson {day} at {time}: {name} · {title}', { day, time: timeOf(n.b.at), name: n.b.name, title: n.title });
  const msg = t('Hello {name}! A reminder: {title} {day} at {time}. See you then!', { name: n.b.name, title: n.title, day, time: timeOf(n.b.at) });
  const href = contactHref(n.b.contact, msg) ?? `#/me/offers/${n.id}`;
  return { key: `remind:${n.b.id}`, tone: 'info', text, act: { label: t('Remind'), href } };
}
