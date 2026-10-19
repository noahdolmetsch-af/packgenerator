// «Aus TWINT teilen» (mockup QR6, Noah 14.10.2026 04:00 «a»; since 19.10.2026 «2b» chosen in Rechnungen,
// sharing a picture goes to Dokumente): a TWINT screenshot chosen with «TWINT-Bildschirmfoto wählen» is
// read on the phone and the fitting open invoice is suggested: «Ja, bezahlt» marks it. The text reader
// (loaded from the CDN on first use) is faked here. Fictional data only.
import { test, expect } from '@playwright/test';
import { tr } from './home0460-fixture.js';
import { ready } from './settle.js';
import { put } from './aktiv-fixture.js';
import { TESSERACT_URL } from '../../src/lib/pay/twintshot.js';

const T = tr('de');
const inv = (seq, name, amount) => ({ id: `inv-${seq}`, seq, no: `R-0${seq}`, name, email: '', amount, purpose: 'Tennisstunde 60 min', refType: 'QRR', ref: '', ways: { qr: true, twint: true }, createdAt: '2026-10-12', status: 'open' });

test('a chosen TWINT screenshot marks the fitting invoice paid', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.route(TESSERACT_URL, (route) =>
    route.fulfill({ contentType: 'text/javascript', body: "export default { createWorker: async () => ({ recognize: async () => ({ data: { text: 'Geld erhalten\\n+ 80.00 CHF\\nvon Mia B.\\nMitteilung: R-0317' } }) }) };" }),
  );
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/me/pay');
  await ready(page);
  await put(page, { settings: [{ key: 'pay.invoices', value: [inv(317, 'Mia Beispiel', 8000), inv(318, 'Leo Muster', 8000)] }] });

  await page.goto('./#/me/pay/invoices');
  await ready(page);
  await expect(page.getByText(T('Choose a TWINT screenshot'))).toBeVisible();
  await page.getByTestId('twint-shot').setInputFiles({ name: 'test_twint.png', mimeType: 'image/png', buffer: Buffer.from('png') });
  const card = page.getByTestId('shot-result');
  await expect(card).toContainText(T('Picture read:'));
  await expect(card).toContainText('80.00 CHF · R-0317 · Mia B.');
  await expect(card).toContainText(`Mia Beispiel · 80.00 CHF`);
  await expect(card).toContainText(T('fits exactly'));
  await card.getByRole('button', { name: T('Yes, paid') }).click();
  await expect(page.getByRole('status')).toHaveText(T('{no} is marked as paid.', { no: 'R-0317' }));
  await expect(card).toHaveCount(0);
  await expect(page).toHaveURL(/#\/me\/pay\/invoices$/);
  // the picture is not kept: a reload shows no card
  await page.reload();
  await ready(page);
  await expect(page.getByTestId('invoice-row')).toHaveCount(2);
  await expect(page.getByTestId('shot-result')).toHaveCount(0);
});
