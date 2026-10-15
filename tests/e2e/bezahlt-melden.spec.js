// «Ich habe bezahlt» (mockup QR5, Noah 14.10.2026 04:00 «a»): the payer opens the link of an invoice,
// sees TWINT and bank details and reports «paid»; the writer sees «Mia sagt: … bezahlt» on the invoice
// list and confirms with «Stimmt, bezahlt». The server is faked. Fictional data only: the IBAN is the
// public sample QR-IBAN of the Swiss standard.
import { test, expect } from '@playwright/test';
import { tr } from './home0460-fixture.js';
import { ready } from './settle.js';
import { put } from './aktiv-fixture.js';
import { boxOf, payLink } from '../../src/lib/pay/report.js';

const T = tr('de');
const KEY = 'c'.repeat(64);
const ACCOUNT = { iban: 'CH44 3199 9123 0008 8901 2', name: 'Beispiel Velo-Werkstatt', twint: '079 000 00 00' };
const INV = { id: 'inv-1', seq: 317, no: 'R-0317', name: 'Mia Beispiel', email: '', amount: 8000, purpose: 'Tennisstunde 60 min', refType: 'QRR', ref: '210000000003139471430009017', ways: { qr: true, twint: true }, createdAt: '2026-10-12', status: 'open' };

test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
});

test('the payer sees how to pay and reports «paid»', async ({ page, context }) => {
  const sent = [];
  await context.route(/\/api\/pay\?step=report$/, async (route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill({ json: { ok: true } });
  });
  const link = payLink(INV, ACCOUNT, await boxOf(KEY), './');
  await page.goto(link);
  await ready(page);
  await expect(page.getByText(T('Invoice from {name}', { name: 'Beispiel Velo-Werkstatt' }))).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tennisstunde 60 min · 80.00 CHF');
  await expect(page.locator('.plink-way').first()).toContainText('079 000 00 00');
  await expect(page.locator('.plink-way').first()).toContainText('R-0317');
  await expect(page.locator('.plink-way').nth(1)).toContainText('CH44 3199 9123 0008 8901 2');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: T('I have paid with TWINT') }).click();
  await expect(page.getByRole('status')).toContainText(T('Thank you! {name} now knows. You get a confirmation once the money has arrived.', { name: 'Beispiel Velo-Werkstatt' }));
  expect(sent).toEqual([{ box: await boxOf(KEY), no: 'R-0317', way: 'twint' }]);
  expect(JSON.stringify(sent)).not.toContain('Mia');
});

test('the writer confirms a report with «Stimmt, bezahlt»', async ({ page, context }) => {
  const forgot = [];
  await context.route(/\/api\/pay\?step=reports$/, (route) => route.fulfill({ json: { reports: [{ id: 'rep-1', no: 'R-0317', way: 'twint', at: Math.floor(Date.now() / 1000) - 120 }] } }));
  await context.route(/\/api\/pay\?step=forget$/, async (route) => {
    forgot.push(route.request().postDataJSON());
    await route.fulfill({ json: { ok: true } });
  });
  await context.addInitScript((key) => localStorage.setItem('pg.pay.box', key), KEY);
  await page.goto('./#/me/pay');
  await ready(page);
  await put(page, { settings: [{ key: 'pay.invoices', value: [INV] }] });
  await page.goto('./#/me/pay/invoices');
  await ready(page);
  const card = page.getByTestId('pay-report');
  await expect(card).toContainText(T('{name} says: {amount} CHF paid with TWINT', { name: 'Mia Beispiel', amount: '80.00' }));
  await expect(card).toContainText(T('{n} minutes ago', { n: 2 }));
  await card.getByRole('button', { name: T('Right, paid') }).click();
  await expect(card).toHaveCount(0);
  await expect(page.getByTestId('invoice-row')).toContainText(T('paid|invoice'));
  await expect.poll(() => forgot).toEqual([{ key: KEY, ids: ['rep-1'] }]);
});
