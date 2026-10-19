// Shop without fees (mockups SHOP1–SHOP4b, Noah 14.10.2026 04:00 «a»): products, the shop link,
// orders through the seller's box on the server (fake Redis), paid/sent and the own mail.
// Fictional data only.
import { describe, it, expect, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { makeHandler } from '../api/pay.js';
import { readShopOrder, orderTotal, SHOP_FIRST_NO } from '../api/_lib/shoporder.js';
import { createDb } from '../src/lib/db.js';
import { boxOf } from '../src/lib/pay/report.js';
import { saveProduct, listProducts, deleteProduct, slugOf, shopLink, readShopLink, cartTotal, needsAddress, placeOrder, syncOrders, listOrders, markOrderPaid, markOrderSent, ordersSummary, orderMail, labelText, payWays, available } from '../src/lib/pay/myshop.js';

const REDIS = 'https://redis.example.test';
const KEY = 'b'.repeat(64);
const ACCOUNT = { iban: 'CH44 3199 9123 0008 8901 2', name: 'Beispiel Velo-Werkstatt', street: 'Musterweg', house: '1', zip: '8000', town: 'Zürich', twint: '079 000 00 00' };
const tr = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
let n = 0;
const freshDb = () => createDb(`shop-test-${++n}`);

function store() {
  const kv = {};
  const doFetch = vi.fn(async (url, init = {}) => {
    if (url === REDIS) {
      const [cmd, k, ...rest] = JSON.parse(init.body);
      if (cmd === 'RPUSH') return Response.json({ result: (kv[k] = [...(kv[k] ?? []), ...rest]).length });
      if (cmd === 'LRANGE') return Response.json({ result: kv[k] ?? [] });
      if (cmd === 'LLEN') return Response.json({ result: (kv[k] ?? []).length });
      if (cmd === 'INCR') return Response.json({ result: (kv[k] = (kv[k] ?? 0) + 1) });
      if (cmd === 'LREM') {
        const i = (kv[k] ?? []).indexOf(rest[1]);
        if (i >= 0) kv[k].splice(i, 1);
        return Response.json({ result: i >= 0 ? 1 : 0 });
      }
      if (cmd === 'DEL') return Response.json({ result: delete kv[k] ? 1 : 0 });
      return Response.json({ result: 1 });
    }
    const req = new Request(url, { ...init, headers: { ...init.headers, origin: 'http://localhost:5173' } });
    return handler(req);
  });
  const handler = makeHandler({ env: () => ({ mode: 'off', redisUrl: REDIS, redisToken: 'r' }), doFetch, now: () => 1_800_000_000_000 });
  return { kv, doFetch };
}

const PACK = { name: 'Packliste Bikepacking', kind: 'download', price: 500, link: 'https://example.test/packliste.pdf' };
const CARE = { name: 'Pflege-Set', kind: 'post', price: 2400, ship: 900, stock: 4 };

describe('products', () => {
  it('get a short unique id, keep stock only for post and the link only for downloads', async () => {
    const db = freshDb();
    const a = await saveProduct(PACK, db);
    const b = await saveProduct({ ...PACK, kind: 'code', link: 'https://x.test' }, db);
    const c = await saveProduct(CARE, db);
    expect(a.id).toBe('packliste-bikepacking');
    expect(b.id).toBe('packliste-bikepacking-2');
    expect(b.link).toBeUndefined();
    expect(a.stock).toBeUndefined();
    expect(c).toMatchObject({ ship: 900, stock: 4 });
    expect(slugOf('Über Ölwechsel')).toBe('uber-olwechsel');
    await deleteProduct(b.id, db);
    expect((await listProducts(db)).map((p) => p.id)).toEqual(['packliste-bikepacking', 'pflege-set']);
    expect(available({ ...c, stock: 0 })).toBe(false);
    expect(available(a)).toBe(true);
  });
});

describe('the shop link', () => {
  it('carries the shop but not the download link or the key', async () => {
    const box = await boxOf(KEY);
    const db = freshDb();
    await saveProduct(PACK, db);
    await saveProduct(CARE, db);
    const link = shopLink(await listProducts(db), { name: 'Velo-Ecke' }, ACCOUNT, box, 'https://example.test/');
    expect(link.startsWith('https://example.test/#/laden/')).toBe(true);
    expect(link).not.toContain(KEY);
    const shop = readShopLink(link.split('#/laden/')[1]);
    expect(shop).toMatchObject({ box, name: 'Velo-Ecke', twint: '079 000 00 00' });
    expect(shop.account.iban).toBe(ACCOUNT.iban);
    expect(shop.products).toEqual([
      { id: 'packliste-bikepacking', name: 'Packliste Bikepacking', kind: 'download', price: 500, note: '' },
      { id: 'pflege-set', name: 'Pflege-Set', kind: 'post', price: 2400, note: '', ship: 900, stock: 4 },
    ]);
    expect(JSON.stringify(shop)).not.toContain('packliste.pdf');
  });
  it('needs a way to pay; a broken link gives null', async () => {
    const box = await boxOf(KEY);
    expect(payWays({ twint: '079' })).toEqual({ twint: true, qr: false });
    expect(readShopLink(shopLink([], {}, { name: 'X' }, box).split('#/laden/')[1])).toBeNull();
    expect(readShopLink('nonsense')).toBeNull();
    expect(readShopLink('')).toBeNull();
  });
});

describe('the cart', () => {
  it('adds the highest postage once and asks for an address only for post', () => {
    const lines = [
      { id: 'a', kind: 'download', price: 500, qty: 2 },
      { id: 'b', kind: 'post', price: 2400, ship: 900, qty: 1 },
      { id: 'c', kind: 'post', price: 1000, ship: 700, qty: 1 },
    ];
    expect(cartTotal(lines)).toEqual({ things: 4400, ship: 900, total: 5300 });
    expect(cartTotal(lines.slice(0, 1))).toEqual({ things: 1000, ship: 0, total: 1000 });
    expect(needsAddress(lines)).toBe(true);
    expect(needsAddress(lines.slice(0, 1))).toBe(false);
    expect(orderTotal(lines.map((l) => ({ ...l, amount: l.price, ship: l.ship ?? 0 })))).toBe(5300);
  });
});

describe('orders on the server', () => {
  const box = 'c'.repeat(32);
  const ok = { box, way: 'twint', buyer: { name: 'Mia Beispiel', email: 'mia@example.test' }, lines: [{ id: 'packliste', name: 'Packliste', kind: 'download', amount: 500, qty: 1 }] };
  it('checks orders strictly', () => {
    expect(readShopOrder(ok)).toBeTruthy();
    expect(readShopOrder({ ...ok, box: 'x' })).toBeNull();
    expect(readShopOrder({ ...ok, way: 'cash' })).toBeNull();
    expect(readShopOrder({ ...ok, lines: [] })).toBeNull();
    expect(readShopOrder({ ...ok, buyer: { name: 'Mia', email: 'no-mail' } })).toBeNull();
    expect(readShopOrder({ ...ok, lines: [{ ...ok.lines[0], amount: 5.5 }] })).toBeNull();
    expect(readShopOrder({ ...ok, lines: [{ ...ok.lines[0], id: '<b>' }] })).toBeNull();
    // post needs an address
    expect(readShopOrder({ ...ok, lines: [{ ...ok.lines[0], kind: 'post', ship: 900 }] })).toBeNull();
    expect(readShopOrder({ ...ok, buyer: { ...ok.buyer, address: 'Musterweg 1, 8000 Zürich' }, lines: [{ ...ok.lines[0], kind: 'post', ship: 900 }] })).toBeTruthy();
  });

  it('a buyer orders, the app fetches into its list, the server forgets; paid, sent and the mail', async () => {
    const { kv, doFetch } = store();
    const db = freshDb();
    await saveProduct(PACK, db);
    await saveProduct(CARE, db);
    const shop = readShopLink(shopLink(await listProducts(db), { name: 'Velo-Ecke' }, ACCOUNT, await boxOf(KEY)).split('#/laden/')[1]);
    const cart = shop.products.map((p) => ({ ...p, qty: 1 }));
    const first = await placeOrder(shop, cart, { name: 'Mia Beispiel', email: 'mia@example.test', address: 'Musterweg 1, 8000 Zürich' }, 'twint', doFetch);
    expect(first).toEqual({ no: SHOP_FIRST_NO + 1, total: 3800 });
    const second = await placeOrder(shop, cart.slice(0, 1), { name: 'Leo Muster', email: 'leo@example.test' }, 'qr', doFetch);
    expect(second.no).toBe(SHOP_FIRST_NO + 2);
    await expect(placeOrder(shop, cart, { name: 'Leo Muster', email: 'leo@example.test' }, 'qr', doFetch)).rejects.toThrow();

    expect(await syncOrders(KEY, db, doFetch)).toBe(2);
    expect(kv[`pay:shop:${shop.box}`]).toEqual([]);
    expect(await syncOrders(KEY, db, doFetch)).toBe(0);
    const list = await listOrders(db);
    expect(list.map((o) => [o.no, o.status])).toEqual([
      [1002, 'open'],
      [1001, 'open'],
    ]);
    expect(ordersSummary(list)).toEqual({ todo: 0, open: 2, finished: 0 });

    const parcel = list[1];
    const paid = await markOrderPaid(parcel.id, db, '2026-10-15');
    expect(paid).toMatchObject({ status: 'todo', paidAt: '2026-10-15', stocked: true });
    await markOrderPaid(parcel.id, db, '2026-10-15');
    expect((await listProducts(db)).find((p) => p.id === 'pflege-set').stock).toBe(3);
    expect(labelText(paid)).toBe('Mia Beispiel\nMusterweg 1\n8000 Zürich');

    const mail = orderMail(paid, { name: 'Velo-Ecke' }, await listProducts(db), tr);
    expect(mail.subject).toBe('Thank you for your order #1001');
    expect(mail.body).toContain('Hello Mia');
    expect(mail.body).toContain('Download now: https://example.test/packliste.pdf');
    expect(mail.body).toContain('The tracking number follows');
    expect(mail.body).toContain('Total: 38.00 CHF');

    const sent = await markOrderSent(parcel.id, '99.00.123456.78901234', db, '2026-10-16');
    expect(sent).toMatchObject({ status: 'sent', sentAt: '2026-10-16' });
    expect(orderMail(sent, {}, [], tr).body).toContain('Tracking number: 99.00.123456.78901234');
    expect((await markOrderPaid(list[0].id, db)).status).toBe('done');
    expect(ordersSummary(await listOrders(db))).toEqual({ todo: 0, open: 0, finished: 2 });
  });

  it('forget keeps an order that came in after the fetch', async () => {
    const { kv, doFetch } = store();
    const box = await boxOf(KEY);
    const shop = { box };
    const line = [{ id: 'packliste', name: 'Packliste', kind: 'download', price: 500, qty: 1 }];
    await placeOrder(shop, line, { name: 'Mia Beispiel', email: 'mia@example.test' }, 'twint', doFetch);
    const res = await doFetch('https://pay.example.test/?step=shop-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: KEY }) });
    const { orders } = await res.json();
    await placeOrder(shop, line, { name: 'Leo Muster', email: 'leo@example.test' }, 'twint', doFetch);
    await doFetch('https://pay.example.test/?step=shop-forget', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: KEY, ids: orders.map((o) => o.id) }) });
    expect(kv[`pay:shop:${box}`].map((r) => JSON.parse(r).buyer.name)).toEqual(['Leo Muster']);
  });

  it('a full box takes no more orders', async () => {
    const { kv, doFetch } = store();
    const box = await boxOf(KEY);
    kv[`pay:shop:${box}`] = Array.from({ length: 200 }, () => '{}');
    await expect(placeOrder({ box }, [{ id: 'a', name: 'A', kind: 'code', price: 100, qty: 1 }], { name: 'Mia', email: 'mia@example.test' }, 'twint', doFetch)).rejects.toThrow(/429/);
  });
});
