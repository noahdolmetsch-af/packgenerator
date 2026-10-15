// Ich › Bezahlen › Shop (mockups SHOP1–SHOP4b, Noah 14.10.2026 04:00 «a»): the seller adds a download
// and a thing by post, looks at the shop link as a buyer and orders with TWINT; the orders page
// fetches orders from the (faked) server, marks paid and sent. German, no sideways scrolling.
// Fictional data only: the IBAN is the public sample QR-IBAN of the Swiss standard.
import { test, expect } from '@playwright/test';
import { tr } from './home0460-fixture.js';
import { ready } from './settle.js';
import { put } from './aktiv-fixture.js';

const T = tr('de');
const KEY = 'd'.repeat(64);
const ACCOUNT = { iban: 'CH44 3199 9123 0008 8901 2', name: 'Beispiel Velo-Werkstatt', street: 'Musterweg', house: '1', zip: '8000', town: 'Zürich', twint: '079 000 00 00' };

test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(
    ([account, key]) => {
      localStorage.setItem('lang', 'de');
      localStorage.setItem('pg.pay.account', JSON.stringify(account));
      localStorage.setItem('pg.pay.box', key);
    },
    [ACCOUNT, KEY],
  );
});

const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

test('add products, view the shop as a buyer and order with TWINT', async ({ page, context }) => {
  const sent = [];
  await context.route(/\/api\/pay\?step=shop-order$/, async (route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill({ json: { no: 1001, total: 3800 } });
  });
  await page.goto('./#/me/pay');
  await ready(page);
  await page.locator('a.pay-shop').click();
  await expect(page).toHaveURL(/#\/me\/shop$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Shop'));
  await expect(page.getByText(T('No products yet. Add the first one with «New product».'))).toBeVisible();

  // a download
  await page.getByRole('button', { name: T('New product') }).click();
  await page.getByLabel(T('Name'), { exact: true }).fill('Packliste Bikepacking');
  await page.getByLabel(T('Price (CHF)')).fill('5');
  await page.getByLabel(T('Download link (stays on this device, goes into the mail)')).fill('https://example.test/packliste.pdf');
  await page.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(T('{name} is in the shop.', { name: 'Packliste Bikepacking' }));

  // a thing by post
  await page.getByRole('button', { name: T('New product') }).click();
  await page.getByLabel(T('Name'), { exact: true }).fill('Pflege-Set');
  await page.getByRole('button', { name: T('Post|shipping'), exact: true }).click();
  await page.getByLabel(T('Price (CHF)')).fill('24');
  await page.getByLabel(T('In stock (empty = no limit)')).fill('4');
  await page.getByRole('button', { name: T('Save'), exact: true }).click();
  const cards = page.getByTestId('product-card');
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(1)).toContainText(T('{amount} postage', { amount: '9.00' }));
  await expect(cards.nth(1)).toContainText(T('{n} left', { n: 4 }));
  await noSideways(page);

  // the buyer's view
  await page.getByRole('button', { name: T('View as buyer') }).click();
  await expect(page).toHaveURL(/#\/laden\//);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('{name} · Shop', { name: 'Beispiel Velo-Werkstatt' }));
  expect(page.url()).not.toContain('packliste.pdf');
  // each click turns the button into − 1 +, so the next one moves up
  await page.getByRole('button', { name: T('Add to cart') }).first().click();
  await page.getByRole('button', { name: T('Add to cart') }).first().click();
  await expect(page.getByRole('button', { name: T('Add to cart') })).toHaveCount(0);
  const cart = page.getByRole('region', { name: T('Cart') });
  await expect(cart).toContainText(T('Postage'));
  await expect(cart.getByRole('button', { name: T('Order · {amount} CHF', { amount: '38.00' }) })).toBeVisible();
  await noSideways(page);
  await cart.getByLabel(T('Your name')).fill('Mia Beispiel');
  await cart.getByLabel(T('E-mail')).fill('mia@example.test');
  await cart.getByRole('button', { name: T('Order · {amount} CHF', { amount: '38.00' }) }).click();
  await expect(cart.getByRole('alert')).toHaveText(T('Please enter the address for the parcel.'));
  await cart.getByLabel(T('Delivery address (only for post)')).fill('Musterweg 1, 8000 Zürich');
  await cart.getByRole('button', { name: T('Order · {amount} CHF', { amount: '38.00' }) }).click();

  const placed = page.getByTestId('order-placed');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Thank you!'));
  await expect(placed).toContainText('079 000 00 00');
  await expect(placed).toContainText('#1001');
  await noSideways(page);
  expect(sent).toHaveLength(1);
  expect(sent[0]).toMatchObject({ way: 'twint', buyer: { name: 'Mia Beispiel', email: 'mia@example.test', address: 'Musterweg 1, 8000 Zürich' } });
  expect(sent[0].lines.map((l) => [l.id, l.amount, l.qty])).toEqual([
    ['packliste-bikepacking', 500, 1],
    ['pflege-set', 2400, 1],
  ]);
  expect(JSON.stringify(sent)).not.toContain(KEY);
  expect(JSON.stringify(sent)).not.toContain('packliste.pdf');
});

test('orders come in, get paid and sent', async ({ page, context }) => {
  const forgot = [];
  const at = Math.floor(Date.now() / 1000) - 600;
  const order = { id: 'ord-1', no: 1001, way: 'twint', lines: [{ id: 'pflege-set', name: 'Pflege-Set', kind: 'post', amount: 2400, ship: 900, qty: 1 }], buyer: { name: 'Mia Beispiel', email: 'mia@example.test', address: 'Musterweg 1, 8000 Zürich' }, total: 3300, at };
  await context.route(/\/api\/pay\?step=shop-orders$/, (route) => route.fulfill({ json: { orders: [order] } }));
  await context.route(/\/api\/pay\?step=shop-forget$/, async (route) => {
    forgot.push(route.request().postDataJSON());
    await route.fulfill({ json: { ok: true } });
  });
  await page.goto('./#/me/pay');
  await ready(page);
  await put(page, { settings: [{ key: 'shop.products', value: [{ id: 'pflege-set', name: 'Pflege-Set', kind: 'post', price: 2400, note: '', ship: 900, stock: 4 }] }] });
  await page.goto('./#/me/shop/orders');
  await ready(page);
  await expect(page.getByRole('status')).toHaveText(T('{n} new order', { n: 1 }));
  const row = page.getByTestId('order-row');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('#1001 · Mia Beispiel · 33.00 CHF');
  await expect(row).toContainText(T('open|order'));
  expect(forgot).toEqual([{ key: KEY, ids: ['ord-1'] }]);
  await noSideways(page);

  await row.getByRole('button', { name: T('Paid'), exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(T('#{no} is marked as paid.', { no: 1001 }));
  await expect(row).toContainText(T('to send'));
  await expect(row).toContainText('Musterweg 1, 8000 Zürich');
  await row.getByRole('button', { name: T('Sent'), exact: true }).click();
  await row.getByLabel(T('Tracking number (optional)')).fill('99.00.123456.78901234');
  await row.getByRole('button', { name: T('Mark as sent') }).click();
  await expect(page.getByRole('status')).toHaveText(T('#{no} is sent.', { no: 1001 }));
  await expect(row).toContainText(T('sent|order'));
  await expect(row).toContainText('99.00.123456.78901234');
  await noSideways(page);

  // the stock went down once
  await page.goto('./#/me/shop');
  await ready(page);
  await expect(page.getByTestId('product-card')).toContainText(T('{n} left', { n: 3 }));
});
