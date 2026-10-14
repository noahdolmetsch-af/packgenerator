// Bezahlfunktion step 1: api/pay.js with a fake environment, a fake Redis and a fake Stripe.
// Fictional values only (no real key, secret or payment anywhere).
import { describe, it, expect, vi } from 'vitest';
import { makeHandler, STRIPE } from '../api/pay.js';
import { PLANS, payEnv, isTestKey, makeLicence, readLicence, makeCode, readCode, codeExpiry, checkoutForm } from '../api/_lib/pay.js';

const SECRET = 'test-secret-not-real';
const KEY = 'sk_test_notreal123';
const REDIS = 'https://redis.example.test';
const NOW = Date.parse('2026-10-14T10:00:00Z');
const nowS = NOW / 1000;
const env = (over = {}) => () => ({ mode: 'test', stripeKey: KEY, secret: SECRET, redisUrl: '', redisToken: '', ...over });

function fakeStripe(answers = {}) {
  const used = new Set();
  const calls = [];
  const doFetch = vi.fn(async (url, init = {}) => {
    calls.push({ url, init });
    if (url === REDIS) {
      const [cmd, k] = JSON.parse(init.body);
      if (cmd === 'SET') return Response.json({ result: used.has(k) ? null : (used.add(k), 'OK') });
      return Response.json({ result: null });
    }
    const path = url.slice(STRIPE.length).split('?')[0];
    const a = answers[path];
    if (!a) return Response.json({ error: {} }, { status: 404 });
    return Response.json(a);
  });
  return { doFetch, calls };
}
const origin = 'http://localhost:5173';
const get = (q) => new Request(`https://packgen-three.vercel.app/api/pay?${q}`, { headers: { origin } });
const post = (step, body) => new Request(`https://packgen-three.vercel.app/api/pay?step=${step}`, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) });
const h = (w, over) => makeHandler({ env: env(over), doFetch: w.doFetch, now: () => NOW });

describe('the payment code', () => {
  it('is off unless PAY_MODE=test, and only test keys count', () => {
    expect(payEnv({}).mode).toBe('off');
    expect(payEnv({ PAY_MODE: 'live' }).mode).toBe('off');
    expect(payEnv({ PAY_MODE: ' TEST ' }).mode).toBe('test');
    expect(isTestKey('sk_test_abc')).toBe(true);
    expect(isTestKey('sk_live_abc')).toBe(false);
    expect(isTestKey('')).toBe(false);
  });
  it('signs licences and refuses changed ones', () => {
    const lic = makeLicence(SECRET, { plan: 'app_once', kind: 'once', exp: null });
    expect(readLicence(SECRET, lic)).toMatchObject({ v: 1, plan: 'app_once' });
    expect(readLicence('other', lic)).toBeNull();
    const [b, s] = lic.split('.');
    const forged = Buffer.from(JSON.stringify({ v: 1, plan: 'app_year', kind: 'sub', exp: null })).toString('base64url');
    expect(readLicence(SECRET, `${forged}.${s}`)).toBeNull();
    expect(readLicence(SECRET, `${b}.${s}.x`)).toBeNull();
  });
  it('makes and checks unlock codes', () => {
    const c = makeCode(SECRET, 'app_year', 'ABC234XYZ9');
    expect(readCode(SECRET, ` ${c} `)).toEqual({ plan: 'app_year', id: 'ABC234XYZ9' });
    expect(readCode(SECRET, c.replace('app_year', 'app_once'))).toBeNull();
    expect(readCode('other', c)).toBeNull();
    expect(codeExpiry('app_once', nowS)).toBeNull();
    expect(codeExpiry('app_month', nowS)).toBe(nowS + 31 * 86400);
  });
  it('builds a one-time payment with a customer and a subscription with an interval', () => {
    const once = checkoutForm('app_once', { successUrl: 's', cancelUrl: 'c' });
    expect(once.get('mode')).toBe('payment');
    expect(once.get('customer_creation')).toBe('always');
    expect(once.get('line_items[0][price_data][unit_amount]')).toBe(String(PLANS.app_once.amount));
    const sub = checkoutForm('app_year', { successUrl: 's', cancelUrl: 'c' });
    expect(sub.get('mode')).toBe('subscription');
    expect(sub.get('line_items[0][price_data][recurring][interval]')).toBe('year');
  });
});

describe('/api/pay', () => {
  it('lists the plans and says when it is off', async () => {
    const w = fakeStripe();
    expect(await (await h(w)(get('step=plans'))).json()).toMatchObject({ mode: 'test', plans: expect.arrayContaining([expect.objectContaining({ id: 'app_month', interval: 'month', currency: 'chf' })]) });
    expect((await (await h(w, { mode: 'off' })(get('step=plans'))).json()).mode).toBe('off');
    expect(w.doFetch).not.toHaveBeenCalled();
  });
  it('refuses checkout when off or with a live key, without calling Stripe', async () => {
    const w = fakeStripe();
    expect((await (await h(w, { mode: 'off' })(post('checkout', { plan: 'app_once' }))).json()).code).toBe('not_set_up');
    expect((await (await h(w, { stripeKey: 'sk_live_real' })(post('checkout', { plan: 'app_once' }))).json()).code).toBe('not_set_up');
    expect(w.doFetch).not.toHaveBeenCalled();
  });
  it('starts a Stripe checkout that comes back into the app', async () => {
    const w = fakeStripe({ '/checkout/sessions': { url: 'https://checkout.stripe.com/c/pay/cs_test_x' } });
    const r = await h(w)(post('checkout', { plan: 'app_month', returnTo: 'http://localhost:5173/#/me' }));
    expect(await r.json()).toEqual({ url: 'https://checkout.stripe.com/c/pay/cs_test_x' });
    const form = new URLSearchParams(w.calls[0].init.body);
    expect(w.calls[0].init.headers.Authorization).toBe(`Bearer ${KEY}`);
    expect(form.get('success_url')).toBe('http://localhost:5173/#/me?pay=done&session_id={CHECKOUT_SESSION_ID}');
    expect(form.get('metadata[plan]')).toBe('app_month');
    expect((await h(w)(post('checkout', { plan: 'gold' }))).status).toBe(400);
  });
  it('confirms a paid one-time payment and a subscription', async () => {
    const w = fakeStripe({
      '/checkout/sessions/cs_test_once': { status: 'complete', payment_status: 'paid', metadata: { plan: 'app_once' }, payment_intent: 'pi_1' },
      '/checkout/sessions/cs_test_sub': { status: 'complete', payment_status: 'paid', metadata: { plan: 'app_year' }, subscription: { id: 'sub_1', items: { data: [{ current_period_end: nowS + 1000 }] } } },
      '/checkout/sessions/cs_test_open': { status: 'open', payment_status: 'unpaid', metadata: { plan: 'app_once' } },
    });
    const once = await (await h(w)(get('step=confirm&session_id=cs_test_once'))).json();
    expect(readLicence(SECRET, once.licence)).toMatchObject({ plan: 'app_once', src: 'stripe', ref: 'pi_1', exp: null, test: true });
    const sub = await (await h(w)(get('step=confirm&session_id=cs_test_sub'))).json();
    expect(sub).toMatchObject({ plan: 'app_year', exp: nowS + 1000 });
    expect((await h(w)(get('step=confirm&session_id=cs_test_open'))).status).toBe(402);
    expect((await h(w)(get('step=confirm&session_id=cs_live_x'))).status).toBe(400);
  });
  it('redeems a code once when storage is there, and refuses fake codes', async () => {
    const w = fakeStripe();
    const code = makeCode(SECRET, 'app_once', 'TESTCODE22');
    const hs = h(w, { redisUrl: REDIS, redisToken: 'r' });
    const first = await (await hs(post('redeem', { code }))).json();
    expect(readLicence(SECRET, first.licence)).toMatchObject({ plan: 'app_once', src: 'code' });
    expect((await (await hs(post('redeem', { code }))).json()).code).toBe('code_used');
    expect((await (await hs(post('redeem', { code: 'PG1-app_once-TESTCODE22-AAAAAAAAAAAAAAAA' }))).json()).code).toBe('bad_code');
  });
  it('checks a licence and renews a subscription that Stripe renewed', async () => {
    const w = fakeStripe({ '/subscriptions/sub_1': { status: 'active', current_period_end: nowS + 5000 }, '/subscriptions/sub_2': { status: 'canceled', current_period_end: nowS - 10 } });
    const once = makeLicence(SECRET, { plan: 'app_once', kind: 'once', src: 'code', ref: 'X', exp: null });
    expect(await (await h(w)(post('check', { licence: once }))).json()).toMatchObject({ valid: true, plan: 'app_once' });
    expect(await (await h(w)(post('check', { licence: 'junk.sig' }))).json()).toMatchObject({ valid: false });
    const old = makeLicence(SECRET, { plan: 'app_month', kind: 'sub', src: 'stripe', ref: 'sub_1', exp: nowS - 1 });
    const renewed = await (await h(w)(post('check', { licence: old }))).json();
    expect(renewed).toMatchObject({ valid: true, exp: nowS + 5000 });
    expect(readLicence(SECRET, renewed.licence).exp).toBe(nowS + 5000);
    const gone = makeLicence(SECRET, { plan: 'app_month', kind: 'sub', src: 'stripe', ref: 'sub_2', exp: nowS - 1 });
    expect(await (await h(w)(post('check', { licence: gone }))).json()).toMatchObject({ valid: false, reason: 'ended' });
  });
});
