// Ich › Bezahlen › Rechnungen (mockups QR1–QR4 + QR7, Noah 14.10.2026 04:00 «a»): the account is
// asked once and stays on the device, a new invoice shows TWINT and the payment part, «PDF teilen»
// makes a PDF, the list marks paid by amount («Geld erhalten») and opens again. German, no sideways
// scrolling. Fictional data only: the IBAN is the public sample QR-IBAN of the Swiss standard.
import { test, expect } from '@playwright/test';
import { tr } from './home0460-fixture.js';
import { ready } from './settle.js';
import { put } from './aktiv-fixture.js';
import { camt054 } from '../fixtures/camt054.js';
import { qrReference } from '../../src/lib/pay/qrbill.js';

const T = tr('de');

test.beforeEach(async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    // no share sheet in the test browser: «PDF teilen» saves the file instead
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
  });
  await page.goto('./#/me/pay');
  await ready(page);
});

const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

test('write a QR invoice with TWINT, then mark it paid by amount and open it again', async ({ page }) => {
  const row = page.locator('a.pay-inv');
  await expect(row).toContainText(T('Invoices'));
  await expect(row).toContainText(T('QR bill and TWINT, free'));
  await row.click();
  await expect(page).toHaveURL(/#\/me\/pay\/invoices$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Invoices'));
  await page.locator('a.invs-empty').click();

  // the account, once
  await expect(page).toHaveURL(/#\/me\/pay\/invoices\/new$/);
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(T('Your account, once'));
  await page.getByLabel('IBAN').fill('CH44 3199 9123 0008 8901 3');
  await page.getByLabel(T('Payable to (name)')).fill('Beispiel Velo-Werkstatt');
  await page.getByRole('textbox', { name: T('Postcode'), exact: true }).fill('8000');
  await page.getByRole('textbox', { name: T('Town'), exact: true }).fill('Zürich');
  await page.getByLabel(T('TWINT number (optional)')).fill('0790000000');
  await page.getByRole('button', { name: T('Save account') }).click();
  await expect(page.getByRole('alert')).toHaveText(T('This IBAN is not right. Please check it (CH or LI, 21 characters).'));
  await page.getByLabel('IBAN').fill('CH44 3199 9123 0008 8901 2');
  await page.getByRole('button', { name: T('Save account') }).click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('pg.pay.account')));
  expect(stored).toMatchObject({ iban: 'CH44 3199 9123 0008 8901 2', twint: '079 000 00 00' });

  // the invoice, with the preview of what the payer sees
  await page.getByLabel(T('For whom?')).fill('Mia Beispiel');
  await page.getByLabel(T('Amount|money')).fill('80');
  await page.getByLabel(T('What for?')).fill('Tennisstunde 60 min');
  const preview = page.getByTestId('bill-preview');
  await expect(preview).toContainText(T('Pay with TWINT'));
  await expect(preview).toContainText('079 000 00 00');
  await expect(preview).toContainText('CH44 3199 9123 0008 8901 2');
  await expect(preview).toContainText('80.00');
  await expect(preview.getByRole('img', { name: T('QR code of the bill') })).toBeVisible();
  await noSideways(page);

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: T('Share PDF') }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('R-0001.pdf');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Invoice {no}').replace('{no}', 'R-0001'));
  await expect(page).toHaveURL(/#\/me\/pay\/invoices\/[0-9a-f-]+$/);

  // the list: «Geld erhalten» finds it by amount
  await page.goto('./#/me/pay/invoices');
  await ready(page);
  await expect(page.getByTestId('invoice-row')).toHaveCount(1);
  await expect(page.getByTestId('invoice-row')).toContainText('Mia Beispiel');
  await page.getByRole('button', { name: T('Money received') }).click();
  await page.getByLabel(T('How much has arrived?')).fill('80.00');
  await page.getByRole('button', { name: T('This one') }).click();
  await expect(page.getByRole('status')).toHaveText(T('{no} is marked as paid.').replace('{no}', 'R-0001'));
  await expect(page.getByTestId('invoice-row')).toContainText(T('paid|invoice'));
  await noSideways(page);

  await page.getByRole('button', { name: T('Open {no} again').replace('{no}', 'R-0001') }).click();
  await expect(page.getByTestId('invoice-row').getByRole('button', { name: T('Paid'), exact: true })).toBeVisible();
  await expect(page.getByTestId('invoice-row').getByRole('button', { name: T('Paid + mail') })).toBeVisible();
});

// Step 1b (mockups QR2 + QR3 + QR8): a bank statement from the e-banking marks the recognised
// invoices paid, asks about the payment without reference, and «Rückgängig» opens them again.
test('upload a bank statement: recognised ones paid, the unclear one assigned, then undo', async ({ page }) => {
  const inv = (seq, amount, extra = {}) => ({
    id: `inv-${seq}`, seq, no: `R-000${seq}`, name: `Kunde ${seq}`, email: '', amount, purpose: `Stunde ${seq}`,
    refType: 'QRR', ref: qrReference(`R-000${seq}`), ways: { qr: true, twint: true }, createdAt: `2026-10-0${seq}`, status: 'open', ...extra,
  });
  await put(page, { settings: [{ key: 'pay.invoices', value: [inv(1, 8000), inv(2, 500, { ref: '' }), inv(3, 8000), inv(4, 2500)] }] });
  await page.goto('./#/me/pay/invoices');
  await ready(page);
  await expect(page.getByTestId('invoice-row')).toHaveCount(4);

  const sw = page.getByRole('switch', { name: T('Reminder to check payments') });
  await expect(sw).toHaveAttribute('aria-checked', 'true');

  await page.locator('input[type=file][accept*=".xml"]').setInputFiles({ name: 'konto.xml', mimeType: 'application/xml', buffer: Buffer.from(camt054()) });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Bank statement checked'));
  await expect(page.locator('.st-res')).toContainText(T('{n} payments recognised', { n: 2 }));
  await expect(page.locator('.st-res')).toContainText(T('{n} is unclear.', { n: 1 }));
  await expect(page.locator('.st-ok')).toHaveCount(2);
  await expect(page.locator('.st-ask')).toContainText('Noa Beispiel');
  await expect(page.locator('.st-ask')).toContainText('Kunde 3');
  await noSideways(page);

  await page.getByRole('button', { name: T('Yes, assign') }).click();
  await expect(page.locator('.st-ask')).toContainText(T('Assigned to {name}, {purpose}', { name: 'Kunde 3', purpose: 'Stunde 3' }));
  const paid = () => page.evaluate(async () => {
    const db = await new Promise((res) => { const r = indexedDB.open('pack-generator'); r.onsuccess = () => res(r.result); });
    const row = await new Promise((res) => { const q = db.transaction('settings').objectStore('settings').get('pay.invoices'); q.onsuccess = () => res(q.result); });
    db.close();
    return row.value.filter((x) => x.status === 'paid').map((x) => x.no).sort();
  });
  await expect.poll(paid).toEqual(['R-0001', 'R-0002', 'R-0003']);

  await page.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(paid).toEqual([]);
  await page.getByRole('button', { name: T('To the invoices') }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Invoices'));
  await expect(page.getByTestId('invoice-row')).toHaveCount(4);

  // a file that is no camt is refused with a hint
  await page.locator('input[type=file][accept*=".xml"]').setInputFiles({ name: 'liste.xml', mimeType: 'application/xml', buffer: Buffer.from('<x/>') });
  await expect(page.getByRole('alert')).toContainText('camt');

  // the Sunday reminder can be switched off
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect(sw).toHaveText(T('off|switch'));
});
