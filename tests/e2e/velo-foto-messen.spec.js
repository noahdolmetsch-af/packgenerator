// «Velos-Pflege einbauen» (Noah 03.11.2026 «3a»): a wear photo of the chain from the window «Measure the chain». Fictional fixture.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import { importAndSettle } from './settle.js';

const fixture = fileURLToPath(new URL('./fixture.json', import.meta.url));
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNkYPhfz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC', 'base64');
const photos = (page) =>
  page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('photos').objectStore('photos').getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result.filter((p) => p.wear).map((p) => p.wear)); };
    };
  }));

test('Measure the chain: a photo is saved as a wear photo of the chain', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await page.goto('./');
  await importAndSettle(page, fixture);
  await page.goto('./#/bikes?tab=care');
  await page.getByRole('button', { name: /Measure the chain/ }).first().click();
  const box = page.locator('[data-messen="chain"] [data-measure-photo]');
  await expect(box).toBeVisible();
  await expect(page.locator('[data-measure-photo-done]')).toHaveCount(0);
  await box.locator('input[type="file"]').first().setInputFiles({ name: 'kette.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.locator('[data-measure-photo-done]')).toBeVisible();
  expect(await photos(page)).toContain('chain');
  await page.locator('[data-measure-photo-done] a').click();
  await expect(page).toHaveURL(/view=photos/);
  await expect(page.locator('[data-shots="chain"] img').first()).toBeVisible();
});
