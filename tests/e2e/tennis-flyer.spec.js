// Flyer für Tennisstunden (Noah 07.11.2026 «ok Flyer», «modular ja»): Tennis › Flyer. Teile ein- und ausschalten, Art wählen,
// Stufen, Foto tauschen, speichern, vorbereitete E-Mail, Vorlage. Fiktive Daten, kein Netz: das Angebot liegt direkt im Gerät.
import { test, expect } from './clock.js';
import { tr } from './home0460-fixture.js';
import { ready } from './settle.js';

const T = tr('de');
// a 4×4 picture (PNG), only to have a file to choose
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEElEQVR4nGPQqIiCIwbiOACTYw+hIwiGLQAAAABJRU5ErkJggg==', 'base64');
const OFFER = {
  id: 'tennis-demo1', owner: 'k', offer: {
    id: 'tennis-demo1', kind: 'tennis', title: 'Unterstufe', place: 'Tennisplätze Musterdorf', venues: [], minutes: 90, mode: 'request',
    types: [{ key: 'g', label: 'Gruppe', places: 6, price: 14000 }],
    slots: [{ id: 'a', at: '2026-11-19T15:45' }, { id: 'b', at: '2026-11-26T15:45' }, { id: 'c', at: '2026-12-10T15:45' }],
  },
};

test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
});

async function seed(page) {
  await page.goto('./#/me');
  await ready(page);
  await page.evaluate((offer) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const tx = r.result.transaction('settings', 'readwrite');
      tx.objectStore('settings').put({ key: 'bookingOffers', value: [offer] });
      tx.oncomplete = () => { r.result.close(); ok(); };
    };
  }), OFFER);
}
const canvasPixels = (page) => page.$eval('[data-flyer-canvas]', (c) => {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let dark = 0;
  for (let i = 0; i < d.length; i += 4 * 97) if (d[i] < 60 && d[i + 1] < 120) dark++;
  return { w: c.width, h: c.height, dark };
});

test('Flyer: Vorschau, Teile, Art, Stufen, Foto, Speichern, E-Mail, Vorlage', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await seed(page);

  // the tab, the heading and the preview with a QR code (the band is dark green)
  await page.goto('./#/me/tennis/flyer');
  await ready(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Tennis flyer'));
  await expect(page.locator('[data-tennis-tabs]').getByRole('button', { name: T('Flyer') })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await canvasPixels(page)).w).toBe(1920);
  expect((await canvasPixels(page)).dark).toBeGreaterThan(50);

  // the kind sets the title
  await expect(page.locator('#tf-title')).toHaveAttribute('placeholder', 'Tennis Unterricht');
  await page.locator('[data-art="trial"]').click();
  await expect(page.locator('#tf-title')).toHaveAttribute('placeholder', 'Schnupperstunde');

  // a part off and on again, one moved down
  const cards = page.locator('[data-block="cards"]');
  await cards.getByRole('switch').first().click();
  await expect(cards.locator('#tf-card-gather')).toHaveCount(0);
  await cards.getByRole('switch').first().click();
  await expect(cards.locator('#tf-card-gather')).toHaveCount(1);
  const order = () => page.$$eval('[data-flyer-blocks] li[data-sort-id]', (els) => els.map((e) => e.dataset.sortId));
  expect((await order()).slice(0, 2)).toEqual(['title', 'table']);
  await page.locator('[data-block="table"] .sort-arrows button').nth(1).click();
  await expect.poll(async () => (await order()).indexOf('table')).toBe(2);

  // an own card and an own text, a level by hand, one flyer per level, German and English
  await page.locator('[data-add-card]').click();
  await expect(page.locator('[data-own-card]')).toHaveCount(1);
  await page.locator('[data-add-text]').click();
  await expect(page.locator('[data-own-text]')).toHaveCount(1);
  await page.locator('[data-add-level]').click();
  await expect(page.locator('[data-level]')).toHaveCount(2);
  await page.locator('[data-flyer-levels]').getByRole('switch', { name: T('One flyer per level') }).click();
  await page.locator('[data-lang="en"]').click();
  await expect(page.locator('[data-flyer-save]')).toContainText('12');

  // the photo: a file from the gallery or the computer
  await page.locator('[data-flyer-photo] input[type="file"]').first().setInputFiles({ name: 'platz.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.locator('[data-photo]')).toHaveCount(1);

  // save: the pictures come as downloads
  const first = page.waitForEvent('download');
  await page.locator('[data-flyer-save]').click();
  const d = await first;
  expect(d.suggestedFilename()).toMatch(/^[a-z0-9-]+-(169|a4|sq)-(de|en)\.png$/);

  // the prepared e-mail has the link in it and nobody in Bcc (no customers yet)
  const href = await page.locator('[data-flyer-mail]').getAttribute('href');
  expect(href).toMatch(/^mailto:\?subject=/);
  expect(decodeURIComponent(href)).toContain('buchen/#tennis-demo1');

  // a template, and everything is still there after a reload
  await page.locator('input[placeholder="' + T('Name of the template') + '"]').first().fill('Standard');
  await page.locator('[data-tpl-save]').click();
  await expect(page.locator('[data-tpl-row]')).toHaveCount(1);
  await page.waitForTimeout(700);
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-art="trial"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-level]')).toHaveCount(2);
  await expect(page.locator('[data-photo]')).toHaveCount(1);
  await expect(page.locator('[data-tpl]')).toHaveCount(1);

  expect(errors).toEqual([]);
});

test('Flyer: der QR-Code kann auf eine eigene Seite führen', async ({ page }) => {
  await seed(page);
  await page.goto('./#/me/tennis/flyer');
  await ready(page);
  const qr = page.locator('[data-flyer-qr]');
  await expect(qr).toHaveValue('');
  await expect(page.locator('[data-block="cta"]')).toContainText(T('The QR code and the address lead to the sign-up page of your offer. The request arrives like every request.'));
  // not an address: a hint, the sign-up page stays
  await qr.fill('kein link');
  await expect(page.locator('[data-flyer-qr-bad]')).toBeVisible();
  // an address without https:// is fine; the text says it is the own page
  await qr.fill('tennisnoah.pages.dev/f');
  await expect(page.locator('[data-flyer-qr-bad]')).toHaveCount(0);
  await expect(page.locator('[data-block="cta"]')).toContainText(T('The QR code and the address lead to your own page. It is the same address on every flyer.'));
  // the preview still draws (QR code in the dark band) and the address stays after a reload
  await expect.poll(async () => (await canvasPixels(page)).dark).toBeGreaterThan(50);
  await page.waitForTimeout(700);
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-flyer-qr]')).toHaveValue('tennisnoah.pages.dev/f');
});

test('Flyer: A5 für den Druck kommt als PDF mit Beschnitt', async ({ page }) => {
  await seed(page);
  await page.goto('./#/me/tennis/flyer');
  await ready(page);
  // only A5 on: the preview is the print size (1748 × 2480 plus 3 mm bleed on each side), the file is a PDF
  await page.locator('[data-format="a5"]').click();
  for (const k of ['169', 'a4', 'sq']) await page.locator(`[data-format="${k}"]`).click();
  await expect.poll(async () => (await canvasPixels(page)).w).toBe(1818);
  expect((await canvasPixels(page)).h).toBe(2550);
  const dl = page.waitForEvent('download');
  await page.locator('[data-flyer-save]').click();
  const d = await dl;
  expect(d.suggestedFilename()).toMatch(/^[a-z0-9-]+-a5-de\.pdf$/);
  const file = await d.createReadStream();
  const chunks = [];
  for await (const c of file) chunks.push(c);
  const head = Buffer.concat(chunks).subarray(0, 8).toString('latin1');
  expect(head).toBe('%PDF-1.4');
});

test('Flyer: ohne Angebot ein leerer Zustand, vom Angebot ein Absprung', async ({ page }) => {
  await page.goto('./#/me/tennis/flyer');
  await ready(page);
  await expect(page.locator('[data-empty]')).toBeVisible();
  await seed(page);
  await page.goto('./#/me/offers/tennis-demo1');
  await ready(page);
  await expect(page.locator('[data-flyer-from-offer]')).toHaveAttribute('href', '#/me/tennis/flyer?o=tennis-demo1');
});
