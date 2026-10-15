// «Aus TWINT teilen» (mockup QR6, Noah 14.10.2026 04:00 «a»): a TWINT screenshot shared to the app
// is read on the phone and the fitting open invoice is suggested: «Ja, bezahlt» marks it. The text
// reader (loaded from the CDN on first use) is faked here; the shared picture is put where the
// service worker keeps it. Fictional data only.
import { test, expect } from '@playwright/test';
import { tr } from './home0460-fixture.js';
import { ready } from './settle.js';
import { put } from './aktiv-fixture.js';
import { TESSERACT_URL, SHOT_CACHE, SHOT_KEY } from '../../src/lib/pay/twintshot.js';

const T = tr('de');
const inv = (seq, name, amount) => ({ id: `inv-${seq}`, seq, no: `R-0${seq}`, name, email: '', amount, purpose: 'Tennisstunde 60 min', refType: 'QRR', ref: '', ways: { qr: true, twint: true }, createdAt: '2026-10-12', status: 'open' });

test('a shared TWINT screenshot marks the fitting invoice paid', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.route(TESSERACT_URL, (route) =>
    route.fulfill({ contentType: 'text/javascript', body: "export default { createWorker: async () => ({ recognize: async () => ({ data: { text: 'Geld erhalten\\n+ 80.00 CHF\\nvon Mia B.\\nMitteilung: R-0317' } }) }) };" }),
  );
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/me/pay');
  await ready(page);
  await put(page, { settings: [{ key: 'pay.invoices', value: [inv(317, 'Mia Beispiel', 8000), inv(318, 'Leo Muster', 8000)] }] });
  await page.evaluate(async ([name, key]) => {
    const base = new URL('./', location.href).pathname;
    const c = await caches.open(name);
    await c.put(`${base}${key}`, new Response(new Blob(['png'], { type: 'image/png' }), { headers: { 'X-File-Name': 'twint.png' } }));
  }, [SHOT_CACHE, SHOT_KEY]);

  await page.goto('./#/me/pay/invoices?shared=pay');
  await ready(page);
  const card = page.getByTestId('shot-result');
  await expect(card).toContainText(T('Picture read:'));
  await expect(card).toContainText('80.00 CHF · R-0317 · Mia B.');
  await expect(card).toContainText(`Mia Beispiel · 80.00 CHF`);
  await expect(card).toContainText(T('fits exactly'));
  await card.getByRole('button', { name: T('Yes, paid') }).click();
  await expect(page.getByRole('status')).toHaveText(T('{no} is marked as paid.', { no: 'R-0317' }));
  await expect(card).toHaveCount(0);
  await expect(page).toHaveURL(/#\/me\/pay\/invoices$/);
  // taken out once: a reload shows no card
  await page.reload();
  await ready(page);
  await expect(page.getByTestId('invoice-row')).toHaveCount(2);
  await expect(page.getByTestId('shot-result')).toHaveCount(0);
});
