// Ich › Bezahlen › Zu zahlen (mockup QR9, Noah 14.10.2026 05:10 «1-4a», «a»): upload a picture of a
// QR bill, the app reads recipient, amount and reference, the bill goes into the list with 30 days;
// «Zahlteil» shows what to copy and the photo; «Bezahlt» marks it. By hand with a near due date it
// shows «fällig in 2 Tagen». German, no sideways scrolling. Fictional data only: the IBAN is the
// public sample QR-IBAN of the Swiss standard. The test browser has no BarcodeDetector, so a small
// stand-in returns the QR text.
import { test, expect } from './clock.js';
import { tr } from './home0460-fixture.js';
import { ready } from './settle.js';
import { payload } from '../../src/lib/pay/qrbill.js';

const T = tr('de');
const QR = payload({ iban: 'CH44 3199 9123 0008 8901 2', name: 'Velo-Werkstatt Beispiel', street: 'Musterweg', house: '1', zip: '8000', town: 'Zürich' }, { amount: 18950, refType: 'QRR', ref: '210000000003139471430009017', message: 'Service Gravel' });
// a 1×1 PNG, enough for the picture reader and the photo
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

/** today + n calendar days in Zurich, as YYYY-MM-DD */
const zurichDay = (n) => {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(new Date()).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

test.beforeEach(async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript((qr) => {
    localStorage.setItem('lang', 'de');
    window.BarcodeDetector = class {
      async detect() {
        return [{ rawValue: qr }];
      }
    };
  }, QR);
  await page.goto('./#/me/pay/bills');
  await ready(page);
});

const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

test('upload a received QR bill, see the payment part, mark it paid; by hand with a near due date', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('To pay'));
  await expect(page.getByRole('button', { name: T('To pay') })).toHaveAttribute('aria-pressed', 'true');

  await page.locator(".bills-up input[type=file]").last().setInputFiles({ name: 'rechnung.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.getByRole('heading', { level: 2, name: T('Bill read from the photo') })).toBeVisible();
  await expect(page.getByRole('textbox', { name: T('To|payee'), exact: true })).toHaveValue('Velo-Werkstatt Beispiel');
  await expect(page.getByLabel(T('Amount|money'))).toHaveValue('189.50');
  await expect(page.getByLabel(T('Due on'))).toHaveValue(zurichDay(30));
  await expect(page.getByLabel(T('Reminder'))).toHaveValue('3');
  await noSideways(page);
  await page.getByRole('button', { name: T('Add to «To pay»') }).click();
  await expect(page.getByRole('status')).toHaveText(T('{to} is in «To pay».', { to: 'Velo-Werkstatt Beispiel' }));

  const row = page.getByTestId('bill-row');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Service Gravel');
  await expect(row).toContainText('189.50 CHF');
  await row.getByRole('button', { name: T('Payment part') }).click();
  const part = page.getByTestId('bill-part');
  await expect(part).toContainText('CH44 3199 9123 0008 8901 2');
  await expect(part).toContainText('21 00000 00003 13947 14300 09017');
  await expect(part.getByRole('img', { name: T('Photo of the bill') })).toBeVisible();
  await noSideways(page);
  await row.getByRole('button', { name: T('Paid'), exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(T('{to} is marked as paid.', { to: 'Velo-Werkstatt Beispiel' }));
  await expect(page.getByTestId('bill-row')).toHaveCount(0); // the «Offen» tab
  await page.getByRole('button', { name: new RegExp(`^${T('Paid')}`) }).first().click();
  await expect(page.getByTestId('bill-row')).toContainText(T('paid|invoice'));

  // by hand, due in two days: shown as due soon
  await page.getByRole('button', { name: T('Enter by hand') }).click();
  await expect(page.getByRole('heading', { level: 2, name: T('Enter a bill') })).toBeVisible();
  await page.getByRole('textbox', { name: T('To|payee'), exact: true }).fill('Tennisclub Beispiel');
  await page.getByLabel(T('Amount|money')).fill('320');
  await page.getByLabel(T('Due on')).fill(zurichDay(2));
  await page.getByRole('button', { name: T('Add to «To pay»') }).click();
  const open = page.getByTestId('bill-row');
  await expect(open).toHaveCount(1);
  await expect(open).toContainText(T('due in {n} days', { n: 2 }));
  await expect(page.locator('.vsub')).toContainText('320.00 CHF');

  // the tab back to the invoices
  await page.getByRole('button', { name: new RegExp(`^${T('Invoices')}`) }).click();
  await expect(page).toHaveURL(/#\/me\/pay\/invoices$/);
  await expect(page.getByRole('button', { name: new RegExp(`^${T('To pay')}`) })).toContainText('1');

  // the reminder sits on Ich › Bezahlen only, not on Heute (Noah 15.10.2026 21:07 «4b»)
  await page.goto('./#/me/pay');
  await ready(page);
  const card = page.getByTestId('bill-reminder');
  await expect(card).toContainText(T('Bill due in {n} days', { n: 2 }));
  await expect(card).toContainText('Tennisclub Beispiel');
  await noSideways(page);
  await page.goto('./#/');
  await ready(page);
  await expect(page.getByTestId('bill-reminder')).toHaveCount(0);
  await page.goto('./#/me/pay');
  await ready(page);
  await page.getByTestId('bill-reminder').getByRole('button', { name: T('Later') }).click();
  await expect(page.getByTestId('bill-reminder')).toHaveCount(0);
});
