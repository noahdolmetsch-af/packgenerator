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
import { unseen, dayOf, timeOf } from './model.js';

export const bookingNotes = readable([], (set) => {
  let all = null;
  let seen = [];
  const show = () => {
    if (!all) return;
    const today = localDay();
    set(all.flatMap((o) => {
      const fresh = unseen(o.bookings, seen, today);
      return fresh.length ? [{ id: o.id, title: o.title, n: fresh.length, name: fresh[0].name, at: fresh[0].at }] : [];
    }));
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
  const when = `${new Date(`${dayOf(n.at)}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric' })} ${timeOf(n.at)}`;
  const text = n.n === 1 ? t('New booking: {name} · {title} · {when}', { name: n.name, title: n.title, when }) : t('{n} new bookings: {title}', { n: n.n, title: n.title });
  return { key: `book:${n.id}`, tone: 'info', text, act: { label: t('Look'), href: `#/me/offers/${n.id}` } };
}
