// Termine buchen (BU1–BU5): api/booking.js with a fake Redis and a fake Stripe. Fictional names,
// contacts and keys only.
import { describe, it, expect, vi } from 'vitest';
import { makeHandler, STRIPE } from '../api/booking.js';
import { cleanOffer, zurichMs, publicOffer, canCancel, validAt } from '../api/_lib/booking.js';
import { fakeRedis } from './booking-fake.js';

const REDIS = 'https://redis.example.test';
const KEY = 'sk_test_notreal123';
const NOW = Date.parse('2026-10-14T10:00:00Z');
const origin = 'http://localhost:5173';

function world(stripe = {}) {
  const r = fakeRedis();
  const calls = [];
  const doFetch = vi.fn(async (url, init = {}) => {
    if (url === REDIS) return Response.json({ result: r.run(JSON.parse(init.body)) });
    calls.push({ url, init });
    const path = url.slice(STRIPE.length).split('?')[0];
    const a = typeof stripe[path] === 'function' ? stripe[path](init) : stripe[path];
    return a ? Response.json(a) : Response.json({ error: {} }, { status: 404 });
  });
  let n = 0;
  const handler = (over = {}, now = NOW) => makeHandler({ env: () => ({ mode: 'test', stripeKey: KEY, redisUrl: REDIS, redisToken: 't', ...over }), doFetch, now: () => now, newKey: () => `k${++n}abcdefghijklmnop` });
  return { r, calls, doFetch, handler };
}

const get = (q, auth) => new Request(`https://packgen-three.vercel.app/api/booking?${q}`, { headers: { origin, ...(auth ? { authorization: `Bearer ${auth}` } : {}) } });
const post = (step, body, auth) => new Request(`https://packgen-three.vercel.app/api/booking?step=${step}`, { method: 'POST', headers: { origin, 'content-type': 'application/json', ...(auth ? { authorization: `Bearer ${auth}` } : {}) }, body: JSON.stringify(body) });

const OFFER = {
  kind: 'tennis',
  title: 'Tennis-Lektion',
  place: 'Sandplatz',
  minutes: 60,
  pay: 'site',
  cancelHours: 24,
  types: [{ key: 'one', label: 'Einzel', places: 1, price: 6000 }, { key: 'group', label: 'Gruppe', places: 4, price: 2500 }],
  slots: [{ id: 'a1b2', at: '2026-10-21T17:00', type: 'one' }, { id: 'c3d4', at: '2026-10-21T18:00', type: 'group' }, { id: 'old1', at: '2026-10-01T18:00', type: 'one' }],
};

async function made(w, offer = OFFER) {
  const res = await w.handler()(post('create', { offer }));
  expect(res.status).toBe(200);
  return res.json();
}

describe('the booking rules', () => {
  it('keeps only clean offers', () => {
    expect(cleanOffer(OFFER).offer.slots.map((s) => s.id)).toEqual(['old1', 'a1b2', 'c3d4']);
    expect(cleanOffer({ ...OFFER, pay: 'cash' }).error).toBe('bad_offer');
    expect(cleanOffer({ ...OFFER, types: [] }).error).toBe('bad_offer');
    expect(cleanOffer({ ...OFFER, slots: [{ id: 'a1b2', at: '2026-02-30T10:00', type: 'one' }] }).error).toBe('bad_offer');
    expect(cleanOffer({ ...OFFER, slots: [{ id: 'a1b2', at: '2026-10-21T10:00', type: 'x' }] }).error).toBe('bad_offer');
    expect(validAt('2026-10-21T24:00')).toBe(false);
  });
  it('reads times in Zurich time, summer and winter', () => {
    expect(new Date(zurichMs('2026-07-01T12:00')).toISOString()).toBe('2026-07-01T10:00:00.000Z');
    expect(new Date(zurichMs('2026-12-01T12:00')).toISOString()).toBe('2026-12-01T11:00:00.000Z');
  });
  it('shows only future times and free places, never the owner', () => {
    const o = { ...cleanOffer(OFFER).offer, id: 'tennis-abc123', ownerHash: 'h' };
    const p = publicOffer(o, { c3d4: 2 }, NOW);
    expect(p.slots.map((s) => [s.id, s.free])).toEqual([['a1b2', 1], ['c3d4', 2]]);
    expect(JSON.stringify(p)).not.toContain('ownerHash');
  });
  it('lets people cancel up to 24 hours before', () => {
    const o = cleanOffer(OFFER).offer;
    const slot = o.slots.find((s) => s.id === 'a1b2');
    expect(canCancel(o, slot, zurichMs('2026-10-20T16:59'))).toBe(true);
    expect(canCancel(o, slot, zurichMs('2026-10-20T17:01'))).toBe(false);
  });
});

describe('/api/booking', () => {
  it('needs the storage', async () => {
    const w = world();
    const res = await w.handler({ redisUrl: '' })(get('step=offer&id=tennis-abc123'));
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe('storage_not_set_up');
  });

  it('creates an offer, books it on site and shows the booking only to the owner', async () => {
    const w = world();
    const { id, owner } = await made(w);
    expect(id).toMatch(/^tennis-[a-z0-9]{6,8}$/);
    const h = w.handler();

    const pub = await (await h(get(`step=offer&id=${id}`))).json();
    expect(pub.offer.slots.map((s) => s.id)).toEqual(['a1b2', 'c3d4']);

    const res = await h(post('book', { id, slot: 'a1b2', name: 'Mia Muster', contact: '079 000 00 00' }));
    expect(res.status).toBe(200);
    const { booking } = await res.json();
    expect(booking).toMatchObject({ slot: 'a1b2', at: '2026-10-21T17:00', type: 'Einzel', price: 6000, pay: 'site', paid: false });
    expect(booking.key).toBeTruthy();

    // the single place is gone
    const full = await h(post('book', { id, slot: 'a1b2', name: 'Lea Beispiel', contact: 'lea@example.test' }));
    expect(full.status).toBe(409);
    expect((await full.json()).code).toBe('slot_full');
    const after = await (await h(get(`step=offer&id=${id}`))).json();
    expect(after.offer.slots.find((s) => s.id === 'a1b2').free).toBe(0);
    expect(JSON.stringify(after)).not.toContain('Mia');

    expect((await h(get(`step=bookings&id=${id}`))).status).toBe(401);
    expect((await h(get(`step=bookings&id=${id}`, 'wrong'))).status).toBe(401);
    const list = await (await h(get(`step=bookings&id=${id}`, owner))).json();
    expect(list.bookings).toEqual([expect.objectContaining({ name: 'Mia Muster', contact: '079 000 00 00', at: '2026-10-21T17:00' })]);
  });

  it('refuses past times and missing names', async () => {
    const w = world();
    const { id } = await made(w);
    const h = w.handler();
    expect((await (await h(post('book', { id, slot: 'old1', name: 'Mia Muster', contact: '079' }))).json()).code).toBe('slot_gone');
    expect((await (await h(post('book', { id, slot: 'c3d4', name: '', contact: '079' }))).json()).code).toBe('bad_person');
  });

  it('lets the person cancel in time, and the owner any time', async () => {
    const w = world();
    const { id, owner } = await made(w);
    const b1 = (await (await w.handler()(post('book', { id, slot: 'c3d4', name: 'Mia Muster', contact: '079' }))).json()).booking;
    const b2 = (await (await w.handler()(post('book', { id, slot: 'c3d4', name: 'Lea Beispiel', contact: '078' }))).json()).booking;

    const mine = await (await w.handler()(get(`step=mine&id=${id}&b=${b1.id}&key=${b1.key}`))).json();
    expect(mine.booking).toMatchObject({ name: 'Mia Muster', canCancel: true });
    expect((await w.handler()(get(`step=mine&id=${id}&b=${b1.id}&key=nope`))).status).toBe(404);

    // too late: 2 hours before
    const late = w.handler({}, zurichMs('2026-10-21T16:00'));
    expect((await (await late(post('cancel', { id, b: b1.id, key: b1.key }))).json()).code).toBe('too_late');
    expect((await w.handler()(post('cancel', { id, b: b1.id, key: b1.key }))).status).toBe(200);
    // the owner, 2 hours before
    expect((await late(post('cancel', { id, b: b2.id }, owner))).status).toBe(200);
    expect(w.r.kv.get(`bk:n:${id}:c3d4`)).toBe('0');
    expect((await (await w.handler()(get(`step=bookings&id=${id}`, owner))).json()).bookings).toEqual([]);
  });

  it('cancels a whole time and tells the owner who had booked', async () => {
    const w = world();
    const { id, owner } = await made(w);
    await w.handler()(post('book', { id, slot: 'c3d4', name: 'Mia Muster', contact: '079' }));
    const res = await (await w.handler()(post('cancelSlot', { id, slot: 'c3d4' }, owner))).json();
    expect(res.bookings.map((b) => b.name)).toEqual(['Mia Muster']);
    const pub = await (await w.handler()(get(`step=offer&id=${id}`))).json();
    expect(pub.offer.slots.map((s) => s.id)).toEqual(['a1b2']);
  });

  it('keeps a booked time when the owner saves without it', async () => {
    const w = world();
    const { id, owner } = await made(w);
    await w.handler()(post('book', { id, slot: 'a1b2', name: 'Mia Muster', contact: '079' }));
    const res = await (await w.handler()(post('save', { id, offer: { ...OFFER, slots: [] } }, owner))).json();
    expect(res.offer.slots.map((s) => s.id)).toEqual(['a1b2']);
    expect(JSON.stringify(res)).not.toContain('ownerHash');
    expect((await w.handler()(post('save', { id, offer: OFFER }, 'wrong'))).status).toBe(401);
  });

  it('books online through Stripe once the payment is done', async () => {
    let form;
    const w = world({
      '/checkout/sessions': (init) => ((form = new URLSearchParams(init.body)), { url: 'https://checkout.stripe.com/c/pay/cs_test_abc' }),
      '/checkout/sessions/cs_test_abc': () => ({ status: 'complete', payment_status: 'paid', metadata: { kind: 'booking', offer: form.get('metadata[offer]'), pend: form.get('metadata[pend]') } }),
    });
    const { id, owner } = await made(w, { ...OFFER, pay: 'online' });
    const res = await (await w.handler()(post('book', { id, slot: 'c3d4', name: 'Mia Muster', contact: 'mia@example.test', returnTo: `http://localhost:5173/buchen/#${id}` }))).json();
    expect(res.url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
    expect(form.get('line_items[0][price_data][unit_amount]')).toBe('2500');
    expect(form.get('success_url')).toBe(`http://localhost:5173/buchen/?session_id={CHECKOUT_SESSION_ID}#${id}`);
    // no name or contact at Stripe
    expect([...form.values()].join(' ')).not.toMatch(/Mia|example\.test/);

    const c1 = await (await w.handler()(get('step=confirm&session_id=cs_test_abc'))).json();
    expect(c1.booking).toMatchObject({ slot: 'c3d4', paid: true, name: 'Mia Muster' });
    const c2 = await (await w.handler()(get('step=confirm&session_id=cs_test_abc'))).json();
    expect(c2.booking.id).toBe(c1.booking.id);
    expect(w.r.kv.get(`bk:n:${id}:c3d4`)).toBe('1');
    expect((await (await w.handler()(get(`step=bookings&id=${id}`, owner))).json()).bookings).toHaveLength(1);
  });

  it('says when online payment is not set up', async () => {
    const w = world();
    const { id } = await made(w, { ...OFFER, pay: 'online' });
    const res = await w.handler({ mode: 'off' })(post('book', { id, slot: 'c3d4', name: 'Mia Muster', contact: '079' }));
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe('pay_not_set_up');
  });

  it('limits new offers per day', async () => {
    const w = world();
    for (let i = 0; i < 30; i++) await made(w);
    expect((await w.handler()(post('create', { offer: OFFER }))).status).toBe(429);
  });
});
