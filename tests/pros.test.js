// Paket R «Velomech und Guide» (src/lib/pros.js) and the app side of «Mit Google anmelden»
// (src/lib/sync/account.js). Fictional names and addresses only.
import { describe, it, expect } from 'vitest';
import { PRO_KINDS, newPro, savePro, removePro, movePro, requestMail, cleanLink, isMail, kindOf } from '../src/lib/pros.js';
import { readReturn, finishSignIn, signOut, readAccount, ACCOUNT, returnTo } from '../src/lib/sync/account.js';
import DE from '../src/lib/i18n/de/index.js';

describe('Velomech und Guide', () => {
  it('a new entry needs a name; mail, link and phone are cleaned', () => {
    expect(newPro({ name: '  ' })).toBeNull();
    const p = newPro({ name: ' Velo Test ', kind: 'guide', mail: 'shop@example.test', link: 'example.test/book', phone: '+41 00 000 00 00 x', note: 'Mo zu' }, 'p1');
    expect(p).toEqual({ id: 'p1', name: 'Velo Test', kind: 'guide', mail: 'shop@example.test', link: 'https://example.test/book', phone: '+41 00 000 00 00 ', note: 'Mo zu' });
    expect(newPro({ name: 'X', kind: 'nope', mail: 'bad' }, 'p2')).toMatchObject({ kind: 'mech', mail: '' });
    expect(cleanLink('javascript:alert(1)')).toBe('');
    expect(isMail('a@b.ch')).toBe(true);
    expect(kindOf('zzz').key).toBe('other');
  });
  it('add, change, delete and move', () => {
    const a = { id: 'a', name: 'A' };
    const b = { id: 'b', name: 'B' };
    const c = { id: 'c', name: 'C' };
    let list = savePro(savePro(savePro([], a), b), c);
    expect(list.map((x) => x.id)).toEqual(['a', 'b', 'c']);
    list = savePro(list, { id: 'b', name: 'B2' });
    expect(list[1].name).toBe('B2');
    expect(movePro(list, 2, 0).map((x) => x.id)).toEqual(['c', 'a', 'b']);
    expect(movePro(list, 0, 1).map((x) => x.id)).toEqual(['b', 'a', 'c']);
    expect(removePro(list, 'a').map((x) => x.id)).toEqual(['b', 'c']);
  });
  it('the request mail: subject per kind, the bike and the days', () => {
    const mech = newPro({ name: 'Velo Test', kind: 'mech', mail: 'shop@example.test' }, 'm');
    const href = requestMail(mech, { bike: 'Gravel', when: 'Di Vormittag', text: 'Bremsen quietschen' });
    expect(href.startsWith('mailto:shop@example.test?')).toBe(true);
    const q = new URLSearchParams(href.split('?')[1]);
    expect(q.get('subject')).toBe('Request: bike service');
    expect(q.get('body')).toContain('«Gravel»');
    expect(q.get('body')).toContain('Di Vormittag');
    expect(q.get('body')).toContain('Bremsen quietschen');
    expect(requestMail({ ...mech, mail: '' })).toBe('');
    // every kind's label and subject has a German text
    for (const k of PRO_KINDS) {
      expect(DE[k.label], k.label).toBeTruthy();
      expect(DE[k.subject], k.subject).toBeTruthy();
    }
  });
});

function memDb() {
  const m = new Map();
  return { meta: { get: async (k) => m.get(k), put: async (r) => m.set(r.key, r), delete: async (k) => m.delete(k) }, m };
}

describe('Mit Google anmelden: the app side', () => {
  it('reads the ticket or the error from the address and gives the address back without it', () => {
    expect(readReturn('#/me/data?konto=abcDEF_123-xyzabcdefghij')).toEqual({ ticket: 'abcDEF_123-xyzabcdefghij', rest: '#/me/data' });
    expect(readReturn('#/me/data?konto=error&error=denied')).toEqual({ error: 'denied', rest: '#/me/data' });
    expect(readReturn('#/me/data')).toBeNull();
    expect(returnTo({ origin: 'https://example.test', pathname: '/packgenerator/' })).toBe('https://example.test/packgenerator/#/me/data');
  });
  it('keeps the account on this device and signs out (forget asks the server first)', async () => {
    const db = memDb();
    const calls = [];
    const api = async (step, body) => (calls.push([step, body]), step === 'redeem' ? { code: 'C', email: 'velo@example.test', known: true, session: 's1' } : { ok: true });
    const r = await finishSignIn(db, 'tick', 'MINE', api, '2026-10-19T10:00:00Z');
    expect(r.code).toBe('C');
    expect(await readAccount(db)).toMatchObject({ key: ACCOUNT, email: 'velo@example.test', session: 's1' });
    await signOut(db, { forget: true, api });
    expect(calls.at(-1)).toEqual(['forget', { session: 's1' }]);
    expect(await readAccount(db)).toBeUndefined();
    // a failing forget keeps the sign-in, so the person can try again
    await finishSignIn(db, 'tick', 'MINE', api);
    await expect(signOut(db, { forget: true, api: async () => { throw Object.assign(new Error('x'), { code: 'offline' }); } })).rejects.toThrow();
    expect(await readAccount(db)).toBeTruthy();
    // a failing signout still signs out here
    await signOut(db, { api: async () => { throw new Error('x'); } });
    expect(await readAccount(db)).toBeUndefined();
  });
});
