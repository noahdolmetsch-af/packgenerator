// Termine buchen (BU1–BU5): the shared rules of the app pages and the booking page.
import { describe, it, expect } from 'vitest';
import { KINDS, newOffer, newSlots, mondayOf, weekDays, weekNo, slotsOn, bookedBySlot, slotState, chf, unseen, icsOf, contactHref, shareUrl } from '../src/lib/booking/model.js';
import { cleanOffer } from '../api/_lib/booking.js';
import { pageOf, placeOf } from '../src/lib/nav.js';

describe('the offers', () => {
  it('every kind makes an offer the server accepts', () => {
    for (const k of KINDS) {
      const o = newOffer(k.kind);
      expect(cleanOffer({ ...o, slots: newSlots(o, { day: '2026-10-21', time: '18:00', type: o.types[0].key, weeks: 2 }) }).error).toBeUndefined();
    }
    expect(newOffer('tour').pay).toBe('online');
    expect(newOffer('tennis').pay).toBe('site');
  });
  it('opens a time weekly without doubles', () => {
    const o = { slots: [{ id: 'x', at: '2026-10-28T18:00', type: 'one' }] };
    expect(newSlots(o, { day: '2026-10-21', time: '18:00', type: 'one', weeks: 3 }).map((s) => s.at)).toEqual(['2026-10-21T18:00', '2026-11-04T18:00']);
    expect(slotsOn({ slots: [{ id: 'b', at: '2026-10-21T18:00' }, { id: 'a', at: '2026-10-21T09:00' }] }, '2026-10-21').map((s) => s.id)).toEqual(['a', 'b']);
  });
  it('counts weeks like the calendar', () => {
    expect(mondayOf('2026-10-14')).toBe('2026-10-12');
    expect(weekDays('2026-10-19').at(-1)).toBe('2026-10-25');
    expect(weekNo('2026-10-19')).toBe(43);
    expect(weekNo('2027-01-01')).toBe(53);
  });
  it('shows free, partly booked and booked', () => {
    const n = bookedBySlot([{ slot: 'a' }, { slot: 'a' }, { slot: 'b' }]);
    expect(n).toEqual({ a: 2, b: 1 });
    expect([slotState(4, 0), slotState(4, 2), slotState(1, 1)]).toEqual(['free', 'part', 'full']);
    expect([chf(6000), chf(2550)]).toEqual(['60', '25.50']);
  });
  it('knows which bookings are new', () => {
    const list = [{ id: '1', at: '2026-10-21T18:00' }, { id: '2', at: '2026-10-21T19:00' }, { id: '3', at: '2026-10-01T18:00' }];
    expect(unseen(list, ['1'], '2026-10-14').map((b) => b.id)).toEqual(['2']);
  });
  it('writes a calendar file in Zurich time', () => {
    const f = icsOf({ title: 'Tennis, Gruppe', at: '2026-10-21T18:00', minutes: 60, uid: 'abc' });
    expect(f).toContain('DTSTART;TZID=Europe/Zurich:20261021T180000');
    expect(f).toContain('DTEND;TZID=Europe/Zurich:20261021T190000');
    expect(f).toContain('SUMMARY:Tennis\\, Gruppe');
  });
  it('writes to a phone or an e-mail', () => {
    expect(contactHref('079 123 45 67', 'Hi')).toBe('sms:0791234567?body=Hi');
    expect(contactHref('mia@example.test')).toBe('mailto:mia@example.test');
    expect(contactHref('Mia')).toBeNull();
    expect(shareUrl('tennis-abc123')).toBe('https://noahdolmetsch-af.github.io/packgenerator/buchen/#tennis-abc123');
  });
  it('Ich › Angebote is a page of Ich', () => {
    expect(pageOf('#/me/offers')).toBe('offers');
    expect(pageOf('#/me/offers/tennis-abc123')).toBe('offers');
    expect(placeOf('offers')).toBe('me');
  });
});
