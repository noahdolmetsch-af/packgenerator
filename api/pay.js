/**
 * /api/pay: Bezahlfunktion, step 1 «vorbereiten» (Noah 14.10.2026 01:12 UTC, test mode only,
 * 0 costs, invisible in the app). Stripe over its REST API with fetch (no SDK, no fixed fee).
 *
 *   GET  ?step=plans                         → { mode, plans: [{ id, kind, interval, amount, currency }] }
 *   POST ?step=checkout { plan, returnTo }   → { url } (the Stripe payment page, test mode)
 *   GET  ?step=confirm&session_id=…          → { licence, plan, exp } once Stripe says «paid»
 *   POST ?step=redeem   { code }             → { licence, plan, exp } for a genuine unlock code
 *   POST ?step=check    { licence }          → { valid, plan, exp, licence? } (a subscription is asked at Stripe again)
 * Shop and bookings (Grundgerüst, see _lib/shop.js):
 *   GET  ?step=catalog                       → { items } (fictional test items for now)
 *   POST ?step=order { lines: [{ id, qty, slot? }], returnTo } → { url }
 *   GET  ?step=confirm&session_id=…          → { order: { lines, seller } } for an order (places are booked once)
 *
 * Environment (names only; values only in the Vercel project «packgen», never in code or chat):
 *   PAY_MODE=test (anything else = off), STRIPE_SECRET_KEY (sk_test_… only; a live key is refused),
 *   PAY_SIGNING_SECRET (signs licences and codes), optional KV_REST_API_URL / KV_REST_API_TOKEN
 *   (then a code works only once; bookings need it), optional PAY_SELLERS (JSON {"seller":"acct_…"},
 *   Stripe Connect accounts of other sellers) and PAY_PLATFORM_FEE_PCT (default 0).
 */
import { route, json, redis, redisEnv, ApiError } from './_lib/core.js';
import { jsonBody, safeReturn, hash } from './_lib/oauth.js';
import { PLANS, CURRENCY, payEnv, isTestKey, makeLicence, readLicence, readCode, codeExpiry, checkoutForm } from './_lib/pay.js';
import { CATALOG, shopEnv, publicCatalog, checkOrder, orderForm, readNote } from './_lib/shop.js';

export const STRIPE = 'https://api.stripe.com/v1';
const LIVE_SUB = ['active', 'trialing', 'past_due'];

export function makeHandler({ env = () => ({ ...payEnv(), ...shopEnv(), ...redisEnv() }), catalog = CATALOG, doFetch = (...a) => fetch(...a), now = () => Date.now() } = {}) {
  const nowS = () => Math.floor(now() / 1000);

  const on = (cfg) => {
    if (cfg.mode !== 'test' || !cfg.secret) throw new ApiError(503, 'not_set_up', 'Payments are off on the server (PAY_MODE=test and PAY_SIGNING_SECRET).');
  };
  const needStripe = (cfg) => {
    on(cfg);
    if (!isTestKey(cfg.stripeKey)) throw new ApiError(503, 'not_set_up', 'Stripe is not set up for test mode (STRIPE_SECRET_KEY must be a test key).');
  };

  async function stripe(cfg, path, form = null) {
    let res;
    try {
      res = await doFetch(`${STRIPE}${path}`, {
        method: form ? 'POST' : 'GET',
        headers: { Authorization: `Bearer ${cfg.stripeKey}`, ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
        ...(form ? { body: form.toString() } : {}),
      });
    } catch {
      throw new ApiError(502, 'stripe_unreachable', 'Stripe could not be reached.');
    }
    if (res.status === 404) throw new ApiError(404, 'not_found', 'Stripe does not know this payment.');
    if (!res.ok) throw new ApiError(502, 'stripe_error', 'Stripe answered with an error.');
    return res.json();
  }

  const answer = (request, cfg, data) => json(request, 200, { licence: makeLicence(cfg.secret, { ...data, iat: nowS(), test: true }), plan: data.plan, exp: data.exp });

  const back = (returnTo) => {
    const b = safeReturn(returnTo);
    const sep = b.includes('?', b.indexOf('#')) ? '&' : '?';
    return { successUrl: `${b}${sep}pay=done&session_id={CHECKOUT_SESSION_ID}`, cancelUrl: `${b}${sep}pay=cancel` };
  };
  const slotKey = (slot) => `pay:slot:${slot}`;
  const bookedOf = async (store, slot) => Number((await store.get(slotKey(slot))) ?? 0) || 0;

  /** Until when a subscription is paid (Stripe moved the field onto the items in newer API versions). */
  const periodEnd = (sub) => Number(sub?.current_period_end ?? sub?.items?.data?.[0]?.current_period_end) || null;

  return route(
    {
      GET: async (request) => {
        const url = new URL(request.url);
        const step = url.searchParams.get('step');
        const cfg = env();
        if (step === 'plans') {
          return json(request, 200, {
            mode: cfg.mode === 'test' && cfg.secret ? 'test' : 'off',
            plans: Object.entries(PLANS).map(([id, p]) => ({ id, kind: p.kind, interval: p.interval ?? null, amount: p.amount, currency: CURRENCY })),
          });
        }
        if (step === 'catalog') {
          on(cfg);
          return json(request, 200, { items: publicCatalog(catalog) });
        }
        if (step === 'confirm') {
          needStripe(cfg);
          const id = url.searchParams.get('session_id') ?? '';
          if (!/^cs_test_[A-Za-z0-9]{1,200}$/.test(id)) throw new ApiError(400, 'bad_request', 'Unknown payment.');
          const s = await stripe(cfg, `/checkout/sessions/${id}?expand[]=subscription`);
          if (s.metadata?.kind === 'order') {
            if (s.status !== 'complete' || s.payment_status !== 'paid') throw new ApiError(402, 'not_paid', 'This payment is not finished.');
            const lines = readNote(s.metadata.order);
            const store = redis(cfg, doFetch);
            // Book the places once per payment, however often the app asks.
            if (store && (await store.cmd('SET', `pay:order:${id}`, String(nowS()), 'NX')) === 'OK') {
              for (const l of lines.filter((x) => x.slot)) await store.cmd('INCRBY', slotKey(l.slot), l.qty);
            }
            return json(request, 200, { order: { lines, seller: s.metadata.seller ?? 'own' } });
          }
          const plan = s.metadata?.plan;
          if (!PLANS[plan]) throw new ApiError(400, 'bad_request', 'Unknown plan.');
          if (s.status !== 'complete' || !['paid', 'no_payment_required'].includes(s.payment_status)) throw new ApiError(402, 'not_paid', 'This payment is not finished.');
          if (PLANS[plan].kind === 'sub') {
            const sub = s.subscription;
            return answer(request, cfg, { plan, kind: 'sub', src: 'stripe', ref: String(sub?.id ?? sub ?? ''), exp: periodEnd(sub) });
          }
          return answer(request, cfg, { plan, kind: 'once', src: 'stripe', ref: String(s.payment_intent ?? s.id), exp: null });
        }
        throw new ApiError(400, 'bad_request', 'Unknown step.');
      },

      POST: async (request) => {
        const step = new URL(request.url).searchParams.get('step');
        const cfg = env();
        const body = await jsonBody(request, 4000);

        if (step === 'checkout') {
          needStripe(cfg);
          if (!PLANS[body.plan]) throw new ApiError(400, 'bad_request', 'Unknown plan.');
          const form = checkoutForm(body.plan, back(body.returnTo));
          const s = await stripe(cfg, '/checkout/sessions', form);
          if (typeof s.url !== 'string' || !s.url.startsWith('https://checkout.stripe.com/')) throw new ApiError(502, 'stripe_error', 'Stripe answered with an error.');
          return json(request, 200, { url: s.url });
        }

        if (step === 'order') {
          needStripe(cfg);
          const order = checkOrder(body, catalog);
          if (order.error) throw new ApiError(400, order.error, 'This order is not possible.');
          const account = order.seller === 'own' ? null : cfg.sellers?.[order.seller];
          if (order.seller !== 'own' && !account) throw new ApiError(503, 'seller_not_set_up', 'This seller is not set up yet.');
          const slots = order.lines.filter((l) => l.slot);
          if (slots.length) {
            const store = redis(cfg, doFetch);
            if (!store) throw new ApiError(503, 'storage_not_set_up', 'Bookings need the storage.');
            for (const l of slots) if ((await bookedOf(store, l.slot)) + l.qty > l.places) throw new ApiError(409, 'slot_full', 'This slot is full.');
          }
          const s = await stripe(cfg, '/checkout/sessions', orderForm(order, { ...back(body.returnTo), account, feePct: cfg.feePct ?? 0, currency: CURRENCY }));
          if (typeof s.url !== 'string' || !s.url.startsWith('https://checkout.stripe.com/')) throw new ApiError(502, 'stripe_error', 'Stripe answered with an error.');
          return json(request, 200, { url: s.url });
        }

        if (step === 'redeem') {
          on(cfg);
          const c = readCode(cfg.secret, body.code);
          if (!c) throw new ApiError(400, 'bad_code', 'This code is not valid.');
          const store = redis(cfg, doFetch);
          if (store && (await store.cmd('SET', `pay:code:${hash(c.id)}`, String(nowS()), 'NX')) !== 'OK') throw new ApiError(409, 'code_used', 'This code was already used.');
          return answer(request, cfg, { plan: c.plan, kind: PLANS[c.plan].kind, src: 'code', ref: c.id, exp: codeExpiry(c.plan, nowS()) });
        }

        if (step === 'check') {
          on(cfg);
          const lic = readLicence(cfg.secret, body.licence);
          if (!lic) return json(request, 200, { valid: false, reason: 'unknown' });
          const fresh = lic.exp == null || lic.exp > nowS();
          if (lic.kind !== 'sub' || lic.src !== 'stripe' || fresh) return json(request, 200, { valid: fresh, plan: lic.plan, exp: lic.exp, ...(fresh ? {} : { reason: 'ended' }) });
          // A Stripe subscription past its paid period: ask Stripe whether it renewed.
          needStripe(cfg);
          if (!/^sub_[A-Za-z0-9]{1,200}$/.test(lic.ref)) return json(request, 200, { valid: false, reason: 'unknown' });
          const sub = await stripe(cfg, `/subscriptions/${lic.ref}`);
          const end = periodEnd(sub);
          if (!LIVE_SUB.includes(sub.status) || !end || end <= nowS()) return json(request, 200, { valid: false, plan: lic.plan, reason: 'ended' });
          const renewed = makeLicence(cfg.secret, { ...lic, exp: end, iat: nowS() });
          return json(request, 200, { valid: true, plan: lic.plan, exp: end, licence: renewed });
        }

        throw new ApiError(400, 'bad_request', 'Unknown step.');
      },
    },
    'pay',
  );
}

const handler = makeHandler();
export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
