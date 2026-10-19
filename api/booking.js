/**
 * /api/booking: Termine buchen (mockups BU1–BU5, Noah 14.10.2026 21:31 «BU1–BU5 freigegeben»).
 * People book Noah's free times through a link, without the app and without an account. The rules
 * are in _lib/booking.js; this file talks to the storage (Upstash Redis) and, for online payment,
 * to Stripe (test mode only, same keys as /api/pay).
 *
 * Everybody:
 *   GET  ?step=offer&id=…                         → { offer } (free places, never names)
 *   POST ?step=book { id, slot, name, contact, returnTo } → { booking } (pay on site) or { url } (Stripe)
 *   GET  ?step=confirm&session_id=…               → { booking } after the online payment (booked once)
 *   GET  ?step=mine&id=…&b=…&key=…                → { booking, offer } (the person's own booking)
 *   POST ?step=cancel { id, b, key }              → { ok } up to cancelHours before
 * The owner (Authorization: Bearer <owner key>):
 *   POST ?step=create { offer }                   → { id, owner } (the key is shown only once)
 *   POST ?step=save { id, offer }                 → { offer }
 *   GET  ?step=bookings&id=…                      → { bookings } with names and contacts
 *   POST ?step=cancel { id, b }                   → { ok } any time
 *   POST ?step=cancelSlot { id, slot }            → { bookings } (the ones that were cancelled)
 *
 * Storage keys: bk:o:<id> the offer (with the owner key's hash), bk:n:<id>:<slot> booked places,
 * bk:b:<id> a hash of the bookings, bk:p:<pend> a waiting online booking (1 hour), bk:s:<session>
 * the booking of a payment, bk:c:<day> offers created that day (at most 30).
 * Environment: KV_REST_API_URL / KV_REST_API_TOKEN (needed); for online payment also PAY_MODE=test
 * and STRIPE_SECRET_KEY (a test key). Values only in the Vercel project «packgen».
 */
import { route, json, redisEnv, needStore, ApiError } from './_lib/core.js';
import { jsonBody, safeReturn, hash, randomKey, bearer } from './_lib/oauth.js';
import { payEnv, isTestKey, CURRENCY } from './_lib/pay.js';
import { cleanOffer, publicOffer, cleanPerson, slotOf, typeOf, canCancel, bookable, stale, bookingForm, zurichMs, ID, MAX_BOOKINGS } from './_lib/booking.js';

export const STRIPE = 'https://api.stripe.com/v1';
const CREATE_PER_DAY = 30;
const PEND_TTL = 60 * 60;

export function makeHandler({ env = () => ({ ...payEnv(), ...redisEnv() }), doFetch = (...a) => fetch(...a), now = () => Date.now(), newKey = randomKey } = {}) {
  const store = (cfg) => needStore(cfg, doFetch);
  const okId = (id) => {
    if (typeof id !== 'string' || !ID.test(id)) throw new ApiError(400, 'bad_request', 'Unknown offer.');
    return id;
  };
  async function load(s, id) {
    const raw = await s.get(`bk:o:${okId(id)}`);
    if (!raw) throw new ApiError(404, 'not_found', 'This offer does not exist (any more).');
    return JSON.parse(raw);
  }
  const owns = (request, offer) => {
    const key = bearer(request);
    if (!key || hash(key) !== offer.ownerHash) throw new ApiError(401, 'unauthorized', 'Only the owner of this offer may do this.');
  };
  async function booked(s, offer) {
    if (!offer.slots.length) return {};
    const vals = await s.cmd('MGET', ...offer.slots.map((x) => `bk:n:${offer.id}:${x.id}`));
    return Object.fromEntries(offer.slots.map((x, i) => [x.id, Number(vals?.[i]) || 0]));
  }
  async function bookingsOf(s, offer) {
    const flat = (await s.cmd('HGETALL', `bk:b:${offer.id}`)) ?? [];
    const out = [];
    for (let i = 0; i + 1 < flat.length; i += 2) {
      try {
        out.push(JSON.parse(flat[i + 1]));
      } catch {
        /* a broken entry is skipped */
      }
    }
    return out;
  }
  /** Take one place of a slot, or refuse when it is full. */
  async function takePlace(s, offer, slot) {
    const n = Number(await s.cmd('INCRBY', `bk:n:${offer.id}:${slot.id}`, 1));
    if (n > (typeOf(offer, slot)?.places ?? 0)) {
      await s.cmd('DECRBY', `bk:n:${offer.id}:${slot.id}`, 1);
      throw new ApiError(409, 'slot_full', 'This time is fully booked.');
    }
  }
  async function writeBooking(s, offer, slot, person, paid) {
    const key = newKey(18);
    const b = { id: newKey(9).replace(/[^A-Za-z0-9]/g, 'x'), slot: slot.id, slotMs: zurichMs(slot.at), name: person.name, contact: person.contact, pay: offer.pay, paid, made: now(), keyHash: hash(key) };
    await s.cmd('HSET', `bk:b:${offer.id}`, b.id, JSON.stringify(b));
    return { b, key };
  }
  const own = (offer, slot, b, key) => ({ id: b.id, key, offer: offer.id, slot: slot.id, at: slot.at, type: typeOf(offer, slot)?.label ?? '', price: typeOf(offer, slot)?.price ?? 0, name: b.name, pay: b.pay, paid: b.paid });
  const forOwner = (offer, b) => ({ id: b.id, slot: b.slot, at: slotOf(offer, b.slot)?.at ?? null, name: b.name, contact: b.contact, pay: b.pay, paid: !!b.paid, made: b.made });
  async function drop(s, offer, b) {
    await s.cmd('HDEL', `bk:b:${offer.id}`, b.id);
    const left = Number(await s.cmd('DECRBY', `bk:n:${offer.id}:${b.slot}`, 1));
    if (left < 0) await s.cmd('SET', `bk:n:${offer.id}:${b.slot}`, 0);
  }
  const needStripe = (cfg) => {
    if (cfg.mode !== 'test' || !isTestKey(cfg.stripeKey)) throw new ApiError(503, 'pay_not_set_up', 'Online payment is not set up yet. Pay on site, or ask the owner.');
  };
  async function stripe(cfg, path, form = null) {
    let res;
    try {
      res = await doFetch(`${STRIPE}${path}`, { method: form ? 'POST' : 'GET', headers: { Authorization: `Bearer ${cfg.stripeKey}`, ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, ...(form ? { body: form.toString() } : {}) });
    } catch {
      throw new ApiError(502, 'stripe_unreachable', 'Stripe could not be reached.');
    }
    if (res.status === 404) throw new ApiError(404, 'not_found', 'Stripe does not know this payment.');
    if (!res.ok) throw new ApiError(502, 'stripe_error', 'Stripe answered with an error.');
    return res.json();
  }

  return route(
    {
      GET: async (request) => {
        const url = new URL(request.url);
        const q = (k) => url.searchParams.get(k) ?? '';
        const step = q('step');
        const cfg = env();
        const s = store(cfg);
        if (step === 'offer') {
          const offer = await load(s, q('id'));
          return json(request, 200, { offer: publicOffer(offer, await booked(s, offer), now()) });
        }
        if (step === 'bookings') {
          const offer = await load(s, q('id'));
          owns(request, offer);
          const all = await bookingsOf(s, offer);
          const old = all.filter((b) => stale(offer, b, now()));
          for (const b of old) await s.cmd('HDEL', `bk:b:${offer.id}`, b.id);
          const list = all.filter((b) => !old.includes(b)).map((b) => forOwner(offer, b));
          list.sort((a, b) => String(a.at).localeCompare(String(b.at)) || a.made - b.made);
          return json(request, 200, { bookings: list });
        }
        if (step === 'mine') {
          const offer = await load(s, q('id'));
          const raw = await s.cmd('HGET', `bk:b:${offer.id}`, q('b'));
          const b = raw ? JSON.parse(raw) : null;
          if (!b || hash(q('key')) !== b.keyHash) throw new ApiError(404, 'not_found', 'This booking does not exist (any more).');
          const slot = slotOf(offer, b.slot);
          if (!slot) throw new ApiError(404, 'not_found', 'This booking does not exist (any more).');
          return json(request, 200, { booking: { ...own(offer, slot, b, q('key')), canCancel: canCancel(offer, slot, now()) }, offer: publicOffer(offer, {}, 0) });
        }
        if (step === 'confirm') {
          needStripe(cfg);
          const sid = q('session_id');
          if (!/^cs_test_[A-Za-z0-9]{1,200}$/.test(sid)) throw new ApiError(400, 'bad_request', 'Unknown payment.');
          const done = await s.get(`bk:s:${sid}`);
          if (done && done !== 'wait') {
            const d = JSON.parse(done);
            return json(request, 200, { booking: d });
          }
          const ses = await stripe(cfg, `/checkout/sessions/${sid}`);
          if (ses.metadata?.kind !== 'booking') throw new ApiError(400, 'bad_request', 'Unknown payment.');
          if (ses.status !== 'complete' || ses.payment_status !== 'paid') throw new ApiError(402, 'not_paid', 'This payment is not finished.');
          if ((await s.cmd('SET', `bk:s:${sid}`, 'wait', 'NX', 'EX', 120)) !== 'OK') throw new ApiError(409, 'busy', 'The booking is being saved. Try again in a moment.');
          const offer = await load(s, ses.metadata.offer);
          const pend = JSON.parse((await s.get(`bk:p:${ses.metadata.pend}`)) ?? 'null');
          const slot = slotOf(offer, pend?.slot);
          if (!pend || !slot) throw new ApiError(410, 'gone', 'This booking ran out. Please contact the owner; the payment will be refunded.');
          await takePlace(s, offer, slot);
          const { b, key } = await writeBooking(s, offer, slot, pend, true);
          const out = own(offer, slot, b, key);
          await s.cmd('SET', `bk:s:${sid}`, JSON.stringify(out), 'EX', 86400 * 30);
          await s.del(`bk:p:${ses.metadata.pend}`);
          return json(request, 200, { booking: out });
        }
        throw new ApiError(400, 'bad_request', 'Unknown step.');
      },

      POST: async (request) => {
        const step = new URL(request.url).searchParams.get('step');
        const cfg = env();
        const body = await jsonBody(request, 40000);
        const s = store(cfg);

        if (step === 'create') {
          const c = cleanOffer(body.offer);
          if (c.error) throw new ApiError(400, c.error, 'This offer is not complete.');
          const day = new Date(now()).toISOString().slice(0, 10);
          const n = Number(await s.cmd('INCR', `bk:c:${day}`));
          if (n === 1) await s.expire(`bk:c:${day}`, 86400 * 2);
          if (n > CREATE_PER_DAY) throw new ApiError(429, 'too_many', 'Too many new offers today. Try again tomorrow.');
          const id = `${c.offer.kind}-${newKey(9).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8).padEnd(6, '0')}`;
          const owner = newKey(32);
          await s.set(`bk:o:${id}`, JSON.stringify({ ...c.offer, id, ownerHash: hash(owner), created: now() }));
          return json(request, 200, { id, owner });
        }

        if (step === 'save') {
          const offer = await load(s, body.id);
          owns(request, offer);
          const c = cleanOffer(body.offer);
          if (c.error) throw new ApiError(400, c.error, 'This offer is not complete.');
          // A time with bookings stays (it is cancelled with cancelSlot, so the people are told).
          const n = await booked(s, offer);
          const kept = offer.slots.filter((x) => n[x.id] > 0 && !c.offer.slots.some((y) => y.id === x.id));
          const slots = [...c.offer.slots, ...kept].sort((a, b) => a.at.localeCompare(b.at));
          const next = { ...c.offer, slots, id: offer.id, ownerHash: offer.ownerHash, created: offer.created };
          for (const x of slots) if (n[x.id] > (typeOf(next, x)?.places ?? 0)) throw new ApiError(409, 'places_taken', 'More people booked this time than the new number of places.');
          await s.set(`bk:o:${offer.id}`, JSON.stringify(next));
          const { ownerHash: _h, ...rest } = next;
          return json(request, 200, { offer: rest });
        }

        if (step === 'book') {
          const offer = await load(s, body.id);
          const slot = slotOf(offer, body.slot);
          if (!bookable(slot, now())) throw new ApiError(409, 'slot_gone', 'This time cannot be booked any more.');
          const person = cleanPerson(body);
          if (person.error) throw new ApiError(400, person.error, 'Please enter your name and a phone number or e-mail.');
          if (Number(await s.cmd('HLEN', `bk:b:${offer.id}`)) >= MAX_BOOKINGS) throw new ApiError(409, 'too_many', 'This offer has too many bookings.');
          const type = typeOf(offer, slot);
          if (offer.pay === 'online' && type.price > 0) {
            needStripe(cfg);
            const n = await booked(s, offer);
            if ((n[slot.id] ?? 0) >= type.places) throw new ApiError(409, 'slot_full', 'This time is fully booked.');
            const pend = newKey(12).replace(/[^A-Za-z0-9]/g, 'x');
            await s.set(`bk:p:${pend}`, JSON.stringify({ slot: slot.id, ...person }), PEND_TTL);
            // back to the booking page: …/buchen/?session_id=…#<offer>
            const r = safeReturn(body.returnTo);
            const base = r.split('#')[0];
            const frag = r.includes('#') ? r.slice(r.indexOf('#')) : '';
            const back = (x) => `${base}${base.includes('?') ? '&' : '?'}${x}${frag}`;
            const ses = await stripe(cfg, '/checkout/sessions', bookingForm(offer, slot, type, { successUrl: back('session_id={CHECKOUT_SESSION_ID}'), cancelUrl: back('pay=cancel'), pend, currency: CURRENCY }));
            if (typeof ses.url !== 'string' || !ses.url.startsWith('https://checkout.stripe.com/')) throw new ApiError(502, 'stripe_error', 'Stripe answered with an error.');
            return json(request, 200, { url: ses.url });
          }
          await takePlace(s, offer, slot);
          const { b, key } = await writeBooking(s, offer, slot, person, false);
          return json(request, 200, { booking: own(offer, slot, b, key) });
        }

        if (step === 'cancel') {
          const offer = await load(s, body.id);
          const raw = await s.cmd('HGET', `bk:b:${offer.id}`, String(body.b ?? ''));
          const b = raw ? JSON.parse(raw) : null;
          if (!b) throw new ApiError(404, 'not_found', 'This booking does not exist (any more).');
          if (bearer(request)) owns(request, offer);
          else {
            if (hash(String(body.key ?? '')) !== b.keyHash) throw new ApiError(404, 'not_found', 'This booking does not exist (any more).');
            if (!canCancel(offer, slotOf(offer, b.slot), now())) throw new ApiError(409, 'too_late', 'It is too late to cancel online. Please contact the owner.');
          }
          await drop(s, offer, b);
          return json(request, 200, { ok: true });
        }

        if (step === 'cancelSlot') {
          const offer = await load(s, body.id);
          owns(request, offer);
          const slot = slotOf(offer, body.slot);
          if (!slot) throw new ApiError(404, 'not_found', 'This time does not exist (any more).');
          const gone = (await bookingsOf(s, offer)).filter((b) => b.slot === slot.id);
          for (const b of gone) await s.cmd('HDEL', `bk:b:${offer.id}`, b.id);
          await s.del(`bk:n:${offer.id}:${slot.id}`);
          await s.set(`bk:o:${offer.id}`, JSON.stringify({ ...offer, slots: offer.slots.filter((x) => x.id !== slot.id) }));
          return json(request, 200, { bookings: gone.map((b) => forOwner(offer, b)) });
        }

        throw new ApiError(400, 'bad_request', 'Unknown step.');
      },
    },
    'booking',
  );
}

const handler = makeHandler();
export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
