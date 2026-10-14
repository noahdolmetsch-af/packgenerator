/**
 * Bezahlfunktion, Grundgerüst Shop und Buchung (Noah 14.10.2026 01:15–01:16 UTC: «6 a und b»,
 * «7 beides vorbereiten»: sold by Noah and by others). Invisible, test mode only.
 *
 * - CATALOG: what can be bought. kind 'product' (with stock later) or 'booking' (slots with
 *   places). The items here are fictional test items; real ones come with their own decision.
 *   Prices live on the server only: the app sends ids and amounts, never prices.
 * - Sellers: 'own' is Noah. Any other seller key needs a Stripe Connect account id in the
 *   environment PAY_SELLERS (JSON {"key":"acct_…"}); the payment then goes to that account and
 *   the platform keeps PAY_PLATFORM_FEE_PCT percent (default 0). One seller per order.
 * - Bookings need storage (Redis): pay:slot:<slot> counts the booked places.
 */
import { pick } from './core.js';

export const CATALOG = [
  { id: 'test_product', kind: 'product', name: 'Testprodukt', amount: 1000, seller: 'own' },
  { id: 'test_booking', kind: 'booking', name: 'Testtermin', amount: 2000, seller: 'own', slots: [{ id: 'test_slot_1', label: '2027-01-15 10:00', places: 2 }] },
  { id: 'test_partner_product', kind: 'product', name: 'Testprodukt Partner', amount: 1500, seller: 'test_partner' },
];
export const MAX_QTY = 10;
export const MAX_LINES = 10;

export function shopEnv(e = process.env) {
  let sellers = {};
  try {
    const v = JSON.parse(pick('PAY_SELLERS', e) || '{}');
    if (v && typeof v === 'object' && !Array.isArray(v)) sellers = Object.fromEntries(Object.entries(v).filter(([, a]) => typeof a === 'string' && /^acct_[A-Za-z0-9]{1,100}$/.test(a)));
  } catch {
    sellers = {};
  }
  const fee = Number(pick('PAY_PLATFORM_FEE_PCT', e) || 0);
  return { sellers, feePct: Number.isFinite(fee) && fee >= 0 && fee <= 50 ? fee : 0 };
}

/** The catalog as the app may see it (no seller accounts). */
export const publicCatalog = (catalog = CATALOG) =>
  catalog.map((i) => ({ id: i.id, kind: i.kind, name: i.name, amount: i.amount, seller: i.seller, ...(i.slots ? { slots: i.slots.map((s) => ({ id: s.id, label: s.label, places: s.places })) } : {}) }));

/**
 * Check an order from the app: { lines: [{ id, qty, slot? }] } → { lines, total, seller } or
 * { error } (the reason as a code). Places are checked later against storage.
 */
export function checkOrder(input, catalog = CATALOG) {
  const raw = Array.isArray(input?.lines) ? input.lines : [];
  if (!raw.length || raw.length > MAX_LINES) return { error: 'bad_order' };
  const lines = [];
  for (const l of raw) {
    const item = catalog.find((i) => i.id === l?.id);
    const qty = Number(l?.qty ?? 1);
    if (!item || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return { error: 'bad_order' };
    let slot = null;
    if (item.kind === 'booking') {
      slot = item.slots?.find((s) => s.id === l.slot);
      if (!slot || qty > slot.places) return { error: 'bad_slot' };
    }
    lines.push({ id: item.id, name: item.name, amount: item.amount, qty, seller: item.seller, ...(slot ? { slot: slot.id, places: slot.places, label: slot.label } : {}) });
  }
  const sellers = [...new Set(lines.map((l) => l.seller))];
  if (sellers.length !== 1) return { error: 'one_seller' };
  return { lines, total: lines.reduce((s, l) => s + l.amount * l.qty, 0), seller: sellers[0] };
}

/** A short note of the order for Stripe's metadata (at most 500 characters per value). */
export const orderNote = (lines) => lines.map((l) => `${l.id}:${l.qty}${l.slot ? `@${l.slot}` : ''}`).join(',').slice(0, 500);
export function readNote(note) {
  return String(note ?? '')
    .split(',')
    .filter(Boolean)
    .map((p) => {
      const m = /^([a-z0-9_]+):(\d+)(?:@([a-z0-9_]+))?$/.exec(p);
      return m ? { id: m[1], qty: Number(m[2]), ...(m[3] ? { slot: m[3] } : {}) } : null;
    })
    .filter(Boolean);
}

/** The Stripe Checkout form for an order. account: a Connect account id for another seller. */
export function orderForm(order, { successUrl, cancelUrl, account = null, feePct = 0, currency = 'chf' }) {
  const f = new URLSearchParams({ mode: 'payment', success_url: successUrl, cancel_url: cancelUrl, customer_creation: 'always', 'metadata[kind]': 'order', 'metadata[seller]': order.seller, 'metadata[order]': orderNote(order.lines) });
  order.lines.forEach((l, i) => {
    f.set(`line_items[${i}][quantity]`, String(l.qty));
    f.set(`line_items[${i}][price_data][currency]`, currency);
    f.set(`line_items[${i}][price_data][unit_amount]`, String(l.amount));
    f.set(`line_items[${i}][price_data][product_data][name]`, l.label ? `${l.name} (${l.label})` : l.name);
  });
  if (account) {
    f.set('payment_intent_data[transfer_data][destination]', account);
    const fee = Math.round((order.total * feePct) / 100);
    if (fee > 0) f.set('payment_intent_data[application_fee_amount]', String(fee));
  }
  return f;
}
