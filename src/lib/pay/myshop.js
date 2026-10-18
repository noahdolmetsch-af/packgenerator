/**
 * Shop without fees (Bezahlfunktion step 3; mockups SHOP1–SHOP4b, Noah 14.10.2026 04:00 «a»;
 * answers 03:53 «digital und echt», 03:55 «2a und b 3a 4b 5a»).
 *
 * - Products live in the settings table ('shop.products'), so the backup carries them. Three kinds:
 *   'download' (a link the buyer gets by mail), 'code' (an unlock code the seller sends) and 'post'
 *   (a real thing with postage and stock).
 * - The shop link carries the shop in the part after # (never sent to a server): name, products,
 *   prices and how to pay (TWINT number, account for the QR bill). The download links stay on this
 *   device. The same page is the shop in the app (SHOP2a) and the public shop (SHOP2b).
 * - Orders go into the seller's box on the server (api/_lib/shoporder.js) and come into the app's
 *   list ('shop.orders') when «Bestellungen» opens; then the server forgets them.
 * - Payment by TWINT or QR bill, no fees. The seller marks «Bezahlt»; things by post then wait for
 *   «Versendet», digital things are done. The confirmation mail is the seller's own (SHOP4b).
 */
import { db as appDb } from '../db.js';
import { localDay } from '../localday.js';
import { PAY_URL } from './licence.js';
import { APP_URL, readKey } from './report.js';
import { formatAmount, referenceFor, isIban } from './qrbill.js';

export const PRODUCTS_KEY = 'shop.products';
export const ORDERS_KEY = 'shop.orders';
export const INFO_KEY = 'shop.info';
export const KINDS = ['download', 'code', 'post'];

const get = async (db, key, fallback) => (await db.settings.get(key))?.value ?? fallback;
const put = (db, key, value) => db.settings.put({ key, value });

export const listProducts = async (db = appDb) => {
  const v = await get(db, PRODUCTS_KEY, []);
  return Array.isArray(v) ? v : [];
};
export const readInfo = async (db = appDb) => {
  const v = await get(db, INFO_KEY, {});
  return v && typeof v === 'object' ? v : {};
};
export const writeInfo = (info, db = appDb) => put(db, INFO_KEY, { name: String(info?.name ?? '').trim() });

/** A short id from the name, unique in the list («packliste-bikepacking», «packliste-bikepacking-2»). */
export function slugOf(name, taken = []) {
  const base =
    String(name ?? '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'produkt';
  let id = base;
  for (let i = 2; taken.includes(id); i++) id = `${base}-${i}`;
  return id;
}

/** Save a product (new when it has no id). p: { id?, name, kind, price, ship?, stock?, note?, link? } */
export async function saveProduct(p, db = appDb) {
  return db.transaction('rw', db.settings, async () => {
    const list = await listProducts(db);
    const kind = KINDS.includes(p.kind) ? p.kind : 'download';
    const clean = {
      id: p.id || slugOf(p.name, list.map((x) => x.id)),
      name: String(p.name ?? '').trim(),
      kind,
      price: p.price,
      note: String(p.note ?? '').trim(),
      ...(kind === 'post' ? { ship: p.ship ?? 0, stock: Number.isInteger(p.stock) && p.stock >= 0 ? p.stock : null } : {}),
      ...(kind === 'download' && p.link ? { link: String(p.link).trim() } : {}),
    };
    const i = list.findIndex((x) => x.id === clean.id);
    if (i >= 0) list[i] = clean;
    else list.push(clean);
    await put(db, PRODUCTS_KEY, list);
    return clean;
  });
}

export const deleteProduct = (id, db = appDb) => db.transaction('rw', db.settings, async () => put(db, PRODUCTS_KEY, (await listProducts(db)).filter((x) => x.id !== id)));

/** Things that can still be bought: not sold out. */
export const available = (p) => p.kind !== 'post' || p.stock == null || p.stock > 0;

const b64url = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

/** What the shop needs from the account to take money: TWINT or a QR bill. */
export const payWays = (account) => ({ twint: !!account?.twint, qr: isIban(account?.iban) && !!account?.name && !!account?.town });

/** The shop link (download links and the device key stay here). */
export function shopLink(products, info, account, box, base = APP_URL) {
  const ways = payWays(account);
  const d = {
    v: 1,
    b: box,
    s: info?.name || account?.name || '',
    p: products.map((p) => ({ k: p.id, n: p.name, d: p.kind, a: p.price, ...(p.note ? { o: p.note } : {}), ...(p.kind === 'post' ? { s: p.ship ?? 0, ...(p.stock != null ? { q: p.stock } : {}) } : {}) })),
  };
  if (ways.twint) d.t = account.twint;
  if (ways.qr) d.q = { iban: account.iban, name: account.name, street: account.street ?? '', house: account.house ?? '', zip: account.zip ?? '', town: account.town };
  return `${base}#/laden/${b64url(JSON.stringify(d))}`;
}

/** The shop in a link, or null when it is broken. */
export function readShopLink(part) {
  try {
    const d = JSON.parse(unb64url(String(part ?? '')));
    if (d?.v !== 1 || !/^[0-9a-f]{32}$/.test(d.b) || !Array.isArray(d.p) || !(d.t || d.q)) return null;
    const products = d.p
      .filter((p) => p && /^[a-z0-9-]{1,40}$/.test(p.k) && KINDS.includes(p.d) && Number.isInteger(p.a) && p.a >= 0)
      .map((p) => ({ id: p.k, name: String(p.n ?? p.k), kind: p.d, price: p.a, note: String(p.o ?? ''), ...(p.d === 'post' ? { ship: Number(p.s) || 0, stock: Number.isInteger(p.q) ? p.q : null } : {}) }));
    return { box: d.b, name: String(d.s ?? ''), twint: d.t ? String(d.t) : '', account: d.q && isIban(d.q.iban) ? d.q : null, products };
  } catch {
    return null;
  }
}

/** Cart lines → what the order costs: things plus the highest postage (one parcel). Same as the server. */
export function cartTotal(lines) {
  const things = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const ship = Math.max(0, ...lines.filter((l) => l.kind === 'post').map((l) => l.ship ?? 0));
  return { things, ship, total: things + ship };
}
export const needsAddress = (lines) => lines.some((l) => l.kind === 'post');

/** The QR bill reference and the TWINT message of an order number. */
export const orderRef = (account, no) => referenceFor(account?.iban ?? '', String(no));
export const orderMessage = (no) => `#${no}`;

async function call(step, body, doFetch = fetch) {
  const res = await doFetch(`${PAY_URL}?step=${step}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`pay ${step} ${res.status}`);
  return res.json();
}

/** The buyer orders: → { no, total }. */
export function placeOrder(shop, cart, buyer, way, doFetch) {
  const lines = cart.map((l) => ({ id: l.id, name: l.name, kind: l.kind, amount: l.price, qty: l.qty, ...(l.kind === 'post' ? { ship: l.ship ?? 0 } : {}) }));
  return call('shop-order', { box: shop.box, way, buyer, lines }, doFetch);
}

export const listOrders = async (db = appDb) => {
  const v = await get(db, ORDERS_KEY, []);
  return (Array.isArray(v) ? v : []).sort((a, b) => b.no - a.no);
};

/**
 * Fetch new orders from the server into the list, then let the server forget them.
 * Returns how many came in (0 when the server is off or unreachable).
 */
export async function syncOrders(key = readKey(false), db = appDb, doFetch) {
  if (!key) return 0;
  let incoming;
  try {
    incoming = (await call('shop-orders', { key }, doFetch)).orders ?? [];
  } catch {
    return 0;
  }
  if (!incoming.length) return 0;
  const added = await db.transaction('rw', db.settings, async () => {
    const list = await listOrders(db);
    const fresh = incoming.filter((o) => !list.some((x) => x.id === o.id)).map((o) => ({ ...o, status: 'open', day: localDay(new Date(o.at * 1000)) }));
    await put(db, ORDERS_KEY, [...fresh, ...list]);
    return fresh.length;
  });
  await call('shop-forget', { key, ids: incoming.map((o) => o.id) }, doFetch).catch(() => null);
  return added;
}

async function change(id, fn, db) {
  return db.transaction('rw', db.settings, async () => {
    const list = await listOrders(db);
    const o = list.find((x) => x.id === id);
    if (!o) return null;
    fn(o);
    await put(db, ORDERS_KEY, list);
    return o;
  });
}

/** Paid: things by post wait for «Versendet» ('todo'), the rest is done. Stock goes down once. */
export async function markOrderPaid(id, db = appDb, today = localDay()) {
  return db.transaction('rw', db.settings, async () => {
    const o = await change(
      id,
      (x) => {
        x.status = x.lines.some((l) => l.kind === 'post') ? 'todo' : 'done';
        x.paidAt = today;
      },
      db,
    );
    if (!o || o.stocked) return o;
    const products = await listProducts(db);
    for (const l of o.lines) {
      const p = products.find((x) => x.id === l.id);
      if (p?.kind === 'post' && p.stock != null) p.stock = Math.max(0, p.stock - l.qty);
    }
    await put(db, PRODUCTS_KEY, products);
    return change(id, (x) => (x.stocked = true), db);
  });
}

export const markOrderSent = (id, track = '', db = appDb, today = localDay()) =>
  change(
    id,
    (x) => {
      x.status = 'sent';
      x.sentAt = today;
      x.track = String(track ?? '').trim();
    },
    db,
  );

export const markOrderMailed = (id, db = appDb) => change(id, (x) => (x.mailed = true), db);
export const deleteOrder = (id, db = appDb) => db.transaction('rw', db.settings, async () => put(db, ORDERS_KEY, (await listOrders(db)).filter((x) => x.id !== id)));

/** «1 to ship · 1 waits for payment» counts and the tab groups. */
export function ordersSummary(list) {
  return {
    todo: list.filter((o) => o.status === 'todo').length,
    open: list.filter((o) => o.status === 'open').length,
    finished: list.filter((o) => o.status === 'sent' || o.status === 'done').length,
  };
}

/** «Pflege-Set + Packliste» */
export const linesLine = (o) => o.lines.map((l) => (l.qty > 1 ? `${l.qty}× ${l.name}` : l.name)).join(' + ');

/** The address in lines for the parcel label. */
export const labelText = (o) => [o.buyer.name, ...String(o.buyer.address ?? '').split(/,\s*/)].filter(Boolean).join('\n');

/**
 * The seller's own confirmation mail (mockup SHOP4b): thanks, then per thing the download link,
 * «code follows» or «on its way by post». tr is t() (English keys, German texts).
 */
export function orderMail(o, info, products, tr) {
  const shop = info?.name || tr('the shop');
  const first = o.buyer.name.split(/\s+/)[0];
  const way = o.way === 'twint' ? 'TWINT' : tr('QR bill');
  const parts = o.lines.map((l) => {
    const p = products.find((x) => x.id === l.id);
    if (l.kind === 'download') return `${l.name}\n${p?.link ? tr('Download now: {link}', { link: p.link }) : tr('The download link follows in a separate mail.')}`;
    if (l.kind === 'code') return `${l.name}\n${tr('Your unlock code follows in a separate mail.')}`;
    return `${l.name}\n${o.status === 'sent' && o.track ? tr('On its way by post. Tracking number: {no}', { no: o.track }) : tr('On its way by post. The tracking number follows once it is sent.')}`;
  });
  return {
    subject: tr('Thank you for your order #{no}', { no: o.no }),
    body: [tr('Hello {name}, thank you! Your payment by {way} has arrived.', { name: first, way }), ...parts, tr('Total: {amount} CHF', { amount: formatAmount(o.total) }), tr('Best regards, {shop}', { shop })].join('\n\n'),
  };
}
