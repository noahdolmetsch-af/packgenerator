// Bezahlfunktion step 1: the invisible app side (src/lib/pay/licence.js). Fictional values only.
import { describe, it, expect, vi } from 'vitest';
import { LOCKED, PRO_FEATURES, LICENCE_LS, peek, isPaid, hasAccess, readLicence, writeLicence, redeem, confirmFromUrl, checkLicence } from '../src/lib/pay/licence.js';

const tok = (d) => `${Buffer.from(JSON.stringify({ v: 1, ...d })).toString('base64url')}.sig`;
const memLs = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k), m };
};

describe('the licence on this device', () => {
  it('locks nothing yet (invisible step)', () => {
    expect(LOCKED).toBe(false);
    expect(hasAccess('anything', { token: null })).toBe(true);
  });
  it('reads plan and end, and knows when it is paid', () => {
    expect(peek(tok({ plan: 'app_once', exp: null }))).toMatchObject({ plan: 'app_once' });
    expect(peek('nonsense')).toBeNull();
    expect(isPaid(tok({ plan: 'app_once', exp: null }))).toBe(true);
    expect(isPaid(tok({ plan: 'app_month', exp: 100 }), 200)).toBe(false);
    expect(hasAccess('fitbit', { locked: true, token: tok({ plan: 'app_once', exp: null }) })).toBe(true);
    expect(hasAccess('strava', { locked: true, token: null })).toBe(false);
    expect(hasAccess('packing', { locked: true, token: null })).toBe(true);
    expect(PRO_FEATURES).toEqual(['strava', 'fitbit', 'garmin']);
  });
  it('keeps the licence in localStorage only, and survives a refusing storage', () => {
    const ls = memLs();
    expect(writeLicence('a.b', ls)).toBe(true);
    expect(readLicence(ls)).toBe('a.b');
    expect([...ls.m.keys()]).toEqual([LICENCE_LS]);
    const broken = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); } };
    expect(readLicence(broken)).toBeNull();
    expect(writeLicence('x', broken)).toBe(false);
  });
});

describe('talking to the server', () => {
  it('stores the licence after a code and after Stripe', async () => {
    const ls = memLs();
    const ok = vi.fn(async () => Response.json({ licence: 'L1.s', plan: 'app_once', exp: null }));
    expect(await redeem(' PG1-x ', ok, ls)).toMatchObject({ ok: true, plan: 'app_once' });
    expect(JSON.parse(ok.mock.calls[0][1].body)).toEqual({ code: 'PG1-x' });
    expect(readLicence(ls)).toBe('L1.s');
    expect(await confirmFromUrl('https://x/#/me?pay=done&session_id=cs_test_ABC', vi.fn(async () => Response.json({ licence: 'L2.s' })), ls)).toMatchObject({ ok: true });
    expect(readLicence(ls)).toBe('L2.s');
    expect((await confirmFromUrl('https://x/#/me', ok, ls)).code).toBe('none');
  });
  it('says offline or the server code instead of throwing', async () => {
    const ls = memLs();
    expect((await redeem('x', vi.fn(async () => { throw new Error('net'); }), ls)).code).toBe('offline');
    expect((await redeem('x', vi.fn(async () => Response.json({ code: 'bad_code' }, { status: 400 })), ls)).code).toBe('bad_code');
    expect(readLicence(ls)).toBeNull();
    expect(await checkLicence(vi.fn(), ls)).toEqual({ ok: true, valid: false });
  });
});
