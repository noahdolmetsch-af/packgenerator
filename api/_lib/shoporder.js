/**
 * Shop without fees (Bezahlfunktion step 3; mockups SHOP1–SHOP4b, Noah 14.10.2026 04:00 «a»).
 * A buyer opens the shop link (no app, no account), fills the cart and orders; the order waits in
 * the seller's box until the seller's app fetches it, then the server forgets it.
 *
 * - The box is the same as for «Ich habe bezahlt» (sha256 of the device key, see report.js): anyone
 *   with the shop link can drop an order in, only the key holder can read it.
 * - The server keeps an order only until the app fetched it (at most 60 days, 200 per box). It holds
 *   what the seller needs to deliver: lines, name, e-mail and, for things sent by post, the address.
 * - Prices come from the shop link. Payment is by TWINT or QR bill to the seller, who checks the
 *   amount before marking an order paid, so a changed price in a link only costs the buyer.
 * - Order numbers count per box from 1001 (Redis INCR), so the buyer sees «#1042» at once.
 */
import { randomUUID } from 'node:crypto';

export const SHOP_TTL_S = 60 * 86_400;
export const SHOP_MAX = 200;
export const SHOP_FIRST_NO = 1000;
export const shopKey = (box) => `pay:shop:${box}`;
export const shopNoKey = (box) => `pay:shopno:${box}`;

const text = (v, n) => String(v ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, n);
const cents = (v) => (Number.isInteger(v) && v >= 0 && v <= 10_000_000 ? v : null);

/**
 * A checked order, or null. body: { box, way: 'twint'|'qr', buyer: { name, email, address? },
 * lines: [{ id, name, kind: 'download'|'code'|'post', amount, ship?, qty }] }
 */
export function readShopOrder(body) {
  const box = String(body?.box ?? '');
  const way = String(body?.way ?? '');
  if (!/^[0-9a-f]{32}$/.test(box) || !['twint', 'qr'].includes(way)) return null;
  const raw = Array.isArray(body?.lines) ? body.lines : [];
  if (!raw.length || raw.length > 20) return null;
  const lines = [];
  for (const l of raw) {
    const id = String(l?.id ?? '');
    const kind = String(l?.kind ?? '');
    const qty = Number(l?.qty ?? 1);
    const amount = cents(l?.amount);
    const ship = kind === 'post' ? cents(l?.ship ?? 0) : 0;
    if (!/^[a-z0-9-]{1,40}$/.test(id) || !['download', 'code', 'post'].includes(kind) || !Number.isInteger(qty) || qty < 1 || qty > 20 || amount == null || ship == null) return null;
    lines.push({ id, name: text(l.name, 80) || id, kind, amount, ship, qty });
  }
  const name = text(body?.buyer?.name, 80);
  const email = text(body?.buyer?.email, 120);
  const address = text(body?.buyer?.address, 200);
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;
  if (lines.some((l) => l.kind === 'post') && !address) return null;
  return { box, way, lines, buyer: { name, email, ...(address ? { address } : {}) } };
}

/** What the order costs: things plus the highest postage of the lines sent by post (one parcel). */
export const orderTotal = (lines) => lines.reduce((s, l) => s + l.amount * l.qty, 0) + Math.max(0, ...lines.filter((l) => l.kind === 'post').map((l) => l.ship));

export const newShopOrder = (o, no, nowS) => JSON.stringify({ id: randomUUID(), no, way: o.way, lines: o.lines, buyer: o.buyer, total: orderTotal(o.lines), at: nowS });

/** Parse what LRANGE gave back; broken rows are skipped. */
export const parseShopOrders = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .map((s) => {
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
    })
    .filter((x) => x && typeof x.id === 'string' && Number.isInteger(x.no) && Array.isArray(x.lines));
