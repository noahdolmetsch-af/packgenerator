/**
 * Bezahlfunktion, step 1 «vorbereiten» (Noah 14.10.2026 01:12 UTC: «1a und b 2 a 3 a und b
 * 4 beides vorbereiten 5 kosten 0, mit testmodus starten», invisible in the app for now).
 *
 * The parts of /api/pay that need no network, so they are easy to test:
 * - PLANS: the whole app, once or as a subscription (month, year). Prices are placeholders
 *   until Noah sets them; they only matter in test mode for now.
 * - payEnv: the mode is off unless PAY_MODE=test. A live Stripe key (sk_live_…) is refused,
 *   so no real money can move until Noah decides to go live.
 * - Licences: a small signed note (HMAC-SHA256 with PAY_SIGNING_SECRET) the app keeps on the
 *   device. No account needed; the Stripe customer (with the buyer's e-mail) is the account side.
 * - Unlock codes: PG1-<plan>-<id>-<signature>, made with tools/pay-code.mjs by Noah only.
 *
 * Never logged or answered: the Stripe key, the signing secret, card data (Stripe keeps those).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { pick } from './core.js';

/** The plans. amount in Rappen (CHF cents); interval only for subscriptions. */
export const PLANS = {
  app_once: { kind: 'once', amount: 2900, name: 'Pack Generator (einmal)' },
  app_month: { kind: 'sub', interval: 'month', amount: 300, name: 'Pack Generator (Monat)' },
  app_year: { kind: 'sub', interval: 'year', amount: 2500, name: 'Pack Generator (Jahr)' },
};
export const CURRENCY = 'chf';
const DAY_S = 86_400;
/** How long a subscription bought with a code lasts (a code has no Stripe subscription behind it). */
export const CODE_DAYS = { month: 31, year: 366 };

export function payEnv(e = process.env) {
  const mode = pick('PAY_MODE', e).toLowerCase();
  return {
    mode: mode === 'test' ? 'test' : 'off',
    stripeKey: pick('STRIPE_SECRET_KEY', e),
    secret: pick('PAY_SIGNING_SECRET', e),
  };
}

/** Only test keys count; a live key or anything else is treated as «no key». */
export const isTestKey = (k) => typeof k === 'string' && /^(sk|rk)_test_[A-Za-z0-9]+$/.test(k);

const b64 = (s) => Buffer.from(s).toString('base64url');
const sign = (secret, text) => createHmac('sha256', secret).update(text).digest('base64url');
function same(a, b) {
  const x = Buffer.from(String(a ?? ''));
  const y = Buffer.from(String(b ?? ''));
  return x.length > 0 && x.length === y.length && timingSafeEqual(x, y);
}

/**
 * A licence for this device: { v, plan, kind, src ('stripe'|'code'), ref, iat, exp (unix s or null
 * = forever), test }. ref is the Stripe subscription or payment id, or the code id.
 */
export function makeLicence(secret, data) {
  const body = b64(JSON.stringify({ v: 1, ...data }));
  return `${body}.${sign(secret, `lic:${body}`)}`;
}

/** The licence's content when the signature is right (expired ones too: the caller decides). */
export function readLicence(secret, token) {
  if (!secret || typeof token !== 'string' || token.length > 2000) return null;
  const [body, sig, extra] = token.split('.');
  if (!body || !sig || extra !== undefined || !same(sig, sign(secret, `lic:${body}`))) return null;
  try {
    const d = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return d && d.v === 1 && PLANS[d.plan] ? d : null;
  } catch {
    return null;
  }
}

/* ---------- unlock codes ---------- */
const CODE_RE = /^PG1-(app_once|app_month|app_year)-([A-Z0-9]{6,16})-([A-Za-z0-9_-]{16})$/;

export function makeCode(secret, plan, id) {
  if (!PLANS[plan] || !/^[A-Z0-9]{6,16}$/.test(id)) throw new Error('bad plan or id');
  return `PG1-${plan}-${id}-${sign(secret, `code:${plan}:${id}`).slice(0, 16)}`;
}

/** { plan, id } for a genuine code, else null. */
export function readCode(secret, code) {
  const m = CODE_RE.exec(String(code ?? '').trim());
  if (!secret || !m) return null;
  return same(m[3], sign(secret, `code:${m[1]}:${m[2]}`).slice(0, 16)) ? { plan: m[1], id: m[2] } : null;
}

/** Until when a code licence lasts (unix s), null for «once» (forever). */
export function codeExpiry(plan, nowS) {
  const p = PLANS[plan];
  return p.kind === 'once' ? null : nowS + CODE_DAYS[p.interval] * DAY_S;
}

/** The form fields of a Stripe Checkout Session for a plan (inline price, so no Stripe setup needed). */
export function checkoutForm(plan, { successUrl, cancelUrl }) {
  const p = PLANS[plan];
  const f = new URLSearchParams({
    mode: p.kind === 'once' ? 'payment' : 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': CURRENCY,
    'line_items[0][price_data][unit_amount]': String(p.amount),
    'line_items[0][price_data][product_data][name]': p.name,
    'metadata[plan]': plan,
  });
  if (p.kind === 'sub') f.set('line_items[0][price_data][recurring][interval]', p.interval);
  // 4a «Konto mit E-Mail»: Stripe keeps a customer with the e-mail the buyer types in.
  else f.set('customer_creation', 'always');
  return f;
}
