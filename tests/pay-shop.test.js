// Bezahlfunktion, Grundgerüst Shop und Buchung: api/_lib/shop.js and the order steps of api/pay.js
// with a fake Stripe and a fake Redis. Fictional catalog, sellers and accounts only.
import { describe, it, expect, vi } from 'vitest';
import { makeHandler, STRIPE } from '../api/pay.js';
import { CATALOG, shopEnv, publicCatalog, checkOrder, orderNote, readNote, orderForm } from '../api/_lib/shop.js';
import { startOrder } from '../src/lib/pay/shop.js';

const REDIS = 'https://redis.example.test';
const env = (over = {}) => () => ({ mode: 'test', stripeKey: 'sk_test_notreal', secret: 's', sellers: { test_partner: 'acct_TESTPARTNER' }, feePct: 10, redisUrl: REDIS, redisToken: 'r', ...over });

function world(stripeAnswers = {}, booked = {}) {
  const kv = { ...booked };
  const calls = [];
  const doFetch = vi.fn(async (url, init = {}) => {
    calls.push({ url, init });
    if (url === REDIS) {
      const [cmd, k, v] = JSON.parse(init.body);
      if (cmd === 'GET') return Response.json({ result: kv[k] ?? null });
      if (cmd === 'SET') return Response.json({ result: kv[k] != null ? null : ((kv[k] = v), 'OK') });
      if (cmd === 'INCRBY') return Response.json({ result: (kv[k] = String(Number(kv[k] ?? 0) + Number(v))) });
      return Response.json({ result: null });
    }
    const a = stripeAnswers[url.slice(STRIPE.length).split('?')[0]];
    return a ? Response.json(a) : Response.json({}, { status: 404 });
  });
  return { kv, calls, doFetch };
}
const origin = 'http://localhost:5173';
const order = (lines) => new Request('https://packgen-three.vercel.app/api/pay?step=order', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ lines, returnTo: 'http://localhost:5173/#/' }) });
const get = (q) => new Request(`https://packgen-three.vercel.app/api/pay?${q}`, { headers: { origin } });
const CHECKOUT = { '/checkout/sessions': { url: 'https://checkout.stripe.com/c/pay/cs_test_o' } };

describe('the shop code', () => {
  it('reads sellers and the fee safely', () => {
    expect(shopEnv({ PAY_SELLERS: '{"a":"acct_X1","b":"nope"}', PAY_PLATFORM_FEE_PCT: '7' })).toEqual({ sellers: { a: 'acct_X1' }, feePct: 7 });
    expect(shopEnv({ PAY_SELLERS: 'not json', PAY_PLATFORM_FEE_PCT: '99' })).toEqual({ sellers: {}, feePct: 0 });
  });
  it('never shows seller accounts and keeps prices on the server', () => {
    expect(JSON.stringify(publicCatalog())).not.toContain('acct_');
    const o = checkOrder({ lines: [{ id: 'test_product', qty: 2, amount: 1 }] });
    expect(o).toMatchObject({ total: CATALOG[0].amount * 2, seller: 'own' });
  });
  it('refuses unknown items, wrong amounts, missing slots and mixed sellers', () => {
    expect(checkOrder({ lines: [] }).error).toBe('bad_order');
    expect(checkOrder({ lines: [{ id: 'nope' }] }).error).toBe('bad_order');
    expect(checkOrder({ lines: [{ id: 'test_product', qty: 0 }] }).error).toBe('bad_order');
    expect(checkOrder({ lines: [{ id: 'test_booking', qty: 1 }] }).error).toBe('bad_slot');
    expect(checkOrder({ lines: [{ id: 'test_booking', qty: 3, slot: 'test_slot_1' }] }).error).toBe('bad_slot');
    expect(checkOrder({ lines: [{ id: 'test_product' }, { id: 'test_partner_product' }] }).error).toBe('one_seller');
  });
  it('writes and reads the order note', () => {
    const o = checkOrder({ lines: [{ id: 'test_product', qty: 2 }, { id: 'test_booking', qty: 1, slot: 'test_slot_1' }] });
    expect(orderNote(o.lines)).toBe('test_product:2,test_booking:1@test_slot_1');
    expect(readNote(orderNote(o.lines))).toEqual([{ id: 'test_product', qty: 2 }, { id: 'test_booking', qty: 1, slot: 'test_slot_1' }]);
  });
  it('sends another seller\'s money to their account minus the fee', () => {
    const o = checkOrder({ lines: [{ id: 'test_partner_product', qty: 2 }] });
    const f = orderForm(o, { successUrl: 's', cancelUrl: 'c', account: 'acct_TESTPARTNER', feePct: 10 });
    expect(f.get('payment_intent_data[transfer_data][destination]')).toBe('acct_TESTPARTNER');
    expect(f.get('payment_intent_data[application_fee_amount]')).toBe(String(Math.round(o.total * 0.1)));
    expect(orderForm(checkOrder({ lines: [{ id: 'test_product' }] }), { successUrl: 's', cancelUrl: 'c' }).has('payment_intent_data[transfer_data][destination]')).toBe(false);
  });
});

describe('/api/pay orders', () => {
  it('lists the catalog', async () => {
    const w = world();
    const r = await (await makeHandler({ env: env(), doFetch: w.doFetch })(get('step=catalog'))).json();
    expect(r.items.map((i) => i.id)).toEqual(CATALOG.map((i) => i.id));
  });
  it('starts an order, refuses a full slot and an unknown seller', async () => {
    const w = world(CHECKOUT, { 'pay:slot:test_slot_1': '2' });
    const h = makeHandler({ env: env(), doFetch: w.doFetch });
    expect((await (await h(order([{ id: 'test_product', qty: 1 }]))).json()).url).toContain('checkout.stripe.com');
    expect((await (await h(order([{ id: 'test_booking', qty: 1, slot: 'test_slot_1' }]))).json()).code).toBe('slot_full');
    const noSeller = makeHandler({ env: env({ sellers: {} }), doFetch: w.doFetch });
    expect((await (await noSeller(order([{ id: 'test_partner_product' }]))).json()).code).toBe('seller_not_set_up');
  });
  it('books the places once when the order is paid', async () => {
    const w = world({ '/checkout/sessions/cs_test_o': { status: 'complete', payment_status: 'paid', metadata: { kind: 'order', seller: 'own', order: 'test_booking:1@test_slot_1' } } });
    const h = makeHandler({ env: env(), doFetch: w.doFetch });
    const r = await (await h(get('step=confirm&session_id=cs_test_o'))).json();
    expect(r.order.lines).toEqual([{ id: 'test_booking', qty: 1, slot: 'test_slot_1' }]);
    await h(get('step=confirm&session_id=cs_test_o'));
    expect(w.kv['pay:slot:test_slot_1']).toBe('1');
  });
  it('the app sends ids and amounts only', async () => {
    const f = vi.fn(async () => Response.json({ url: 'https://checkout.stripe.com/x' }));
    expect(await startOrder([{ id: 'test_product', qty: 1 }], 'http://localhost/#/', f)).toMatchObject({ ok: true });
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ lines: [{ id: 'test_product', qty: 1 }], returnTo: 'http://localhost/#/' });
  });
});

describe('templates (kind download)', () => {
  it('gives a grant per bought template and checks it', async () => {
    const { grantFor, readGrant } = await import('../api/_lib/shop.js');
    const g = grantFor('s', 'test_template', 'cs_test_o');
    expect(readGrant('s', g)).toEqual({ id: 'test_template', ref: 'cs_test_o' });
    expect(readGrant('other', g)).toBeNull();
    expect(readGrant('s', grantFor('s', 'test_product', 'cs_test_o'))).toBeNull();
    const w = world({ '/checkout/sessions/cs_test_t': { status: 'complete', payment_status: 'paid', metadata: { kind: 'order', seller: 'own', order: 'test_template:1' } } });
    const h = makeHandler({ env: env(), doFetch: w.doFetch });
    const r = await (await h(get('step=confirm&session_id=cs_test_t'))).json();
    expect(r.downloads).toEqual([{ id: 'test_template', grant: grantFor('s', 'test_template', 'cs_test_t') }]);
    const dl = (grant) => new Request('https://packgen-three.vercel.app/api/pay?step=download', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ grant }) });
    expect(await (await h(dl(r.downloads[0].grant))).json()).toEqual({ id: 'test_template' });
    expect((await h(dl('test_template.x.' + 'A'.repeat(43)))).status).toBe(403);
  });
  it('keeps grants on this device only', async () => {
    const { keepDownloads, readDownloads, DOWNLOADS_LS } = await import('../src/lib/pay/shop.js');
    const m = new Map();
    const ls = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
    expect(keepDownloads([{ id: 'a', grant: 'g1' }, { id: '' }], ls)).toBe(true);
    expect(readDownloads(ls)).toEqual({ a: 'g1' });
    expect([...m.keys()]).toEqual([DOWNLOADS_LS]);
  });
});
