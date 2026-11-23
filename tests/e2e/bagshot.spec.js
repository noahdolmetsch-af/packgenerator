// K1 «Taschen-Fotos» (Noah 23.11.2026): in Pack a photo of a packed bag (taken or chosen), small with the date, big
// on a tap, replaced, deleted with Undo; in race mode the box «What lies where» shows it again. Fictional data only.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
// a 40 × 30 px picture, drawn in the page (no file from outside)
async function picture(page, color = '#3b7a57') {
  const b64 = await page.evaluate((c) => {
    const cv = document.createElement('canvas');
    cv.width = 40;
    cv.height = 30;
    const g = cv.getContext('2d');
    g.fillStyle = c;
    g.fillRect(0, 0, 40, 30);
    g.fillStyle = '#fff';
    g.fillRect(8, 8, 12, 10);
    return cv.toDataURL('image/png').split(',')[1];
  }, color);
  return { name: 'tasche.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') };
}

// opens every bag of the list (the one «On the body» has no photo)
async function openBags(page) {
  const heads = page.locator('section.bag-group .bag-heading');
  await expect(heads.first()).toBeVisible();
  for (let i = 0; i < (await heads.count()); i++) if ((await heads.nth(i).getAttribute('aria-expanded')) !== 'true') await heads.nth(i).click();
}

test('Bag photos: take in Pack, big, replace, delete and undo; race mode box shows it', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  await importAndSettle(page, FIX);

  // Pack: a trip with bags (fictional backup)
  await page.evaluate(() => localStorage.setItem('pack.currentTrip', 'test_data_gtp_trip26'));
  await page.goto('./#/pack');
  await page.reload();
  await expect(page.locator('.calm-pack')).toBeVisible();
  await openBags(page);
  const shot = page.locator('[data-bag-shot]').first();
  await shot.scrollIntoViewIfNeeded();
  await expect(shot).toBeVisible();
  await expect(shot.getByText(T('No photo of this bag yet. A photo on the packing day shows you later what lies where.'))).toBeVisible();
  await shot.locator('input[type=file]').first().setInputFiles(await picture(page));
  await expect(shot.locator('[data-bag-shot-open] img')).toBeVisible();
  await expect(shot.getByText(/^Gepackt am /)).toBeVisible();
  expect(await wide(page)).toBeLessThanOrEqual(0);
  if (process.env.BAGSHOT_DIR) await shot.locator('xpath=ancestor::section[contains(@class,"bag-group")]').screenshot({ path: `${process.env.BAGSHOT_DIR}/k1-pack-${info.project.name}.png` });

  // big, then back
  await shot.locator('[data-bag-shot-open]').click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);

  // replace: still one photo
  await shot.locator('input[type=file]').first().setInputFiles(await picture(page, '#a05a2c'));
  await expect(shot.locator('[data-bag-shot-open] img')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => new Promise((res) => { const r = indexedDB.open('pack-generator'); r.onsuccess = () => { const q = r.result.transaction('photos').objectStore('photos').getAll(); q.onsuccess = () => res(q.result.filter((p) => p.bagShot).length); }; }))).toBe(1);

  // delete with Undo
  await shot.locator('[data-bag-shot-delete]').click();
  await page.locator('dialog[open] button', { hasText: T('Delete') }).first().click();
  await expect(page.locator('[data-bag-shot-open]')).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(page.locator('[data-bag-shot-open] img')).toHaveCount(1);

  // race mode: the box says how to get a photo, then lists the bag with a photo (a photo of the sample race, set in the data)
  await page.goto('./#/race');
  await page.locator('[data-race-sample-open]').click();
  await expect(page).toHaveURL(/#\/race\/race-sample$/);
  await page.locator('[data-race-tab="ride"]').click();
  const box = page.locator('[data-race-box="ride-bags"]');
  await expect(box).toBeVisible();
  await expect(box.getByText(T('No bag photo yet. Open a bag under «Pack» and take one on the packing day.'))).toBeVisible();
  const data = `data:image/png;base64,${(await picture(page)).buffer.toString('base64')}`;
  await page.evaluate((d) => new Promise((res) => { const r = indexedDB.open('pack-generator'); r.onsuccess = () => { const tx = r.result.transaction('photos', 'readwrite'); tx.objectStore('photos').put({ id: 'bagshot-test', bikeId: null, tripId: 'race-sample', slot: 'seat', bagShot: true, name: 'Satteltasche', main: false, data: d, day: '2026-11-20', addedAt: '2026-11-20T10:00:00.000Z' }); tx.oncomplete = () => res(); }; }), data);
  // the page does not see a write made behind its back: open it again
  await page.reload();
  await page.locator('[data-race-tab="ride"]').click();
  const row = page.locator('[data-race-bag-shot]').first();
  await expect(row).toBeVisible();
  await expect(row).toContainText('Satteltasche');
  await expect(box.locator('img')).toHaveCount(0);
  if (process.env.BAGSHOT_DIR) await box.screenshot({ path: `${process.env.BAGSHOT_DIR}/k1-race-${info.project.name}.png` });
  await row.click();
  await expect(page.locator('dialog[open] img')).toBeVisible();
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});
