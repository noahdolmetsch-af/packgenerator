// Google Mail (GM): the app side (src/lib/mail.js, src/lib/mail/client.svelte.js) with a fake server. Fictional mails only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { eventQuery, replySubject, quoteOf, whenOf, sizeOf, MAIL_KEY } from '../src/lib/mail.js';
import { mail, loadList, openMail, sendMail, takeReturn } from '../src/lib/mail/client.svelte.js';

describe('mail helpers', () => {
  it('searches the mails around an appointment by its words', () => {
    expect(eventQuery({ title: 'Velo-Service bei Muster', day: '2026-10-20' })).toBe('"Velo-Service" OR "bei" OR "Muster" after:2026/09/20 before:2026/10/22');
    expect(eventQuery({ title: 'A 12' })).toBe('');
  });
  it('answers with «Re:» once and quotes the old mail', () => {
    expect(replySubject('Velo')).toBe('Re: Velo');
    expect(replySubject('AW: Velo')).toBe('AW: Velo');
    expect(quoteOf({ text: 'Hallo\nWelt', fromName: 'Anna' }, '12. Okt.')).toBe('\n\n12. Okt. Anna:\n> Hallo\n> Welt');
  });
  it('shows a time today and a day otherwise', () => {
    const now = new Date('2026-10-18T10:00:00Z');
    expect(whenOf('2026-10-18T07:05:00Z', now)).toBe('09:05');
    expect(whenOf('2026-10-12T07:05:00Z', now)).toMatch(/12\. Okt/);
    expect(sizeOf(12000)).toBe('12 KB');
  });
});

describe('the app side', () => {
  it('lists, opens, sends; the first answer remembers that mail is allowed', async () => {
    const db = createDb(`mail-${Math.random()}`);
    await db.open();
    const log = [];
    const c = async (step, o = {}) => {
      log.push({ step, ...o });
      if (step === 'mail-list') return { mails: o.params.page ? [{ id: 'm3', subject: 'C' }] : [{ id: 'm1', subject: 'A', unread: true }, { id: 'm2', subject: 'B' }], next: o.params.page ? null : '99' };
      if (step === 'mail-get') return { mail: { id: o.params.id, text: 'Hallo' } };
      if (step === 'mail-send') return { id: 's1' };
      return {};
    };
    await loadList({ q: '', db, c });
    expect(mail.list.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect((await db.settings.get(MAIL_KEY)).value.allowed).toBe(true);
    await loadList({ more: true, db, c });
    expect(mail.list.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);
    await openMail('m1', { db, c });
    expect(mail.open.text).toBe('Hallo');
    expect(mail.list[0].unread).toBe(false);
    expect(await sendMail({ to: 'a@example.test', text: 'x' }, { db, c })).toBe('s1');
    expect(log.at(-1)).toMatchObject({ step: 'mail-send', method: 'POST', body: { to: 'a@example.test' } });
  });
  it('a refused mail scope switches mail off', async () => {
    const db = createDb(`mail-${Math.random()}`);
    await db.open();
    await db.settings.put({ key: MAIL_KEY, value: { allowed: true } });
    const res = await loadList({ db, c: async () => Promise.reject(Object.assign(new Error('x'), { code: 'mail_not_allowed' })) });
    expect(res).toBeNull();
    expect((await db.settings.get(MAIL_KEY)).value.allowed).toBe(false);
  });
  it('reads the way back from the Google login only on its own page', () => {
    const loc = (hash) => ({ hash, pathname: '/', search: '' });
    expect(takeReturn(loc('#/me/agenda?google=connected'), null)).toBeNull();
    expect(takeReturn(loc('#/me/mail?google=error&error=denied'), null)).toEqual({ error: 'denied' });
  });
});
