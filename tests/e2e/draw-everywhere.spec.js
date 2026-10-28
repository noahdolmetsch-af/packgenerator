// Paket NE 1146 (Noah 20.10.2026 «1b»): draw on every photo of the app, not only in notes: setup photos,
// problem photos and wear photos get «Draw»; the drawn picture replaces the photo and the drawing stays on
// the same record (inks). Fictional data; the photos are generated PNGs that never leave the page.
import { test, expect } from './clock.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';
import { png as makePng } from './notes-helpers.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const fixture = fileURLToPath(new URL('./fixture.json', import.meta.url));
const bike = JSON.parse(readFileSync(fixture, 'utf8')).tables.bikes[0];
const PNG = makePng(120, 90);
const png = (name) => ({ name, mimeType: 'image/png', buffer: PNG });

async function load(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await importAndSettle(page, fixture);
  return errors;
}
const dbRows = (page, table) =>
  page.evaluate(
    (name) =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction(name).objectStore(name).getAll();
          q.onsuccess = () => {
            r.result.close();
            ok(q.result);
          };
        };
      }),
    table,
  );
/** The drawing window is open: draw one line and tap «Done». */
async function drawLine(page) {
  const dw = page.locator('dialog[data-draw]');
  const cv = dw.locator('[data-draw-canvas]');
  await expect(cv).toBeVisible();
  await expect(dw.getByRole('heading', { name: T('Draw on the photo') })).toBeVisible();
  await dw.locator('[data-tool="pen"]').click();
  const b = await cv.boundingBox();
  await page.mouse.move(b.x + b.width * 0.2, b.y + b.height * 0.2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.7, b.y + b.height * 0.6, { steps: 6 });
  await page.mouse.up();
  await dw.locator('[data-draw-save]').click();
  await expect(dw).toHaveCount(0);
}

test('setup photo: «Draw» in the big view; the row keeps the new picture and the drawing', async ({ page, context }) => {
  const errors = await load(page, context);
  await page.goto(`./#/bikes?tab=care&bike=${bike.id}&open=1`);
  await page.locator('header.vhead [data-head-photos]').click();
  const sheet = page.locator('dialog[data-setup-photos]');
  await sheet.locator('[data-setup-add]').setInputFiles(png('setup-test.png'));
  await expect(sheet.locator('[data-setup-photo]')).toHaveCount(1);
  const before = (await dbRows(page, 'photos')).find((p) => p.bikeId === bike.id).data;
  await sheet.locator('[data-setup-photo] button.th').click();
  await page.locator('[data-lb-draw]').click();
  await drawLine(page);
  await expect.poll(async () => Object.keys((await dbRows(page, 'photos')).find((p) => p.bikeId === bike.id)?.inks ?? {}).length).toBe(1);
  const row = (await dbRows(page, 'photos')).find((p) => p.bikeId === bike.id);
  expect(row.data).not.toBe(before);
  await expect(page.locator('dialog.lb img')).toHaveAttribute('src', row.data);
  expect(errors).toEqual([]);
});

test('problem photo: «Draw» beside the photo in the problem form; the problem keeps the drawing', async ({ page, context }) => {
  const errors = await load(page, context);
  await page.goto('./#/');
  await page.keyboard.press('n');
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: new RegExp(T('Problem with a bike')) }).click();
  const dlg = page.getByRole('dialog', { name: T('Problem with a bike') });
  const set = dlg.locator('[data-photo-set]');
  await set.locator('[data-photo-add]').setInputFiles(png('bremse-test.png'));
  await expect(set.locator('.thumbs li')).toHaveCount(1);
  const before = await set.locator('.thumbs img').getAttribute('src');
  await set.locator('[data-photo-draw]').click();
  await drawLine(page);
  await expect(set.locator('.thumbs img')).not.toHaveAttribute('src', before);
  await dlg.getByLabel(T('What is wrong? One problem per line or separated by commas')).fill('test_draw Bremse schleift');
  await dlg.getByRole('button', { name: T('High'), exact: true }).click();
  await dlg.getByRole('button', { name: T('Save problem') }).click();
  await expect.poll(async () => Object.keys((await dbRows(page, 'maintenance')).find((r) => r.task === 'test_draw Bremse schleift')?.inks ?? {}).length).toBe(1);
  const row = (await dbRows(page, 'maintenance')).find((r) => r.task === 'test_draw Bremse schleift');
  expect(row.photo).not.toBe(before);
  expect(errors).toEqual([]);
});

test('wear photo: «Draw» in the list of a part; the photo row keeps the drawing', async ({ page, context }) => {
  const errors = await load(page, context);
  await page.goto(`./#/bikes?tab=care&view=photos&bike=${bike.id}`);
  const part = page.locator('[data-shots]').first();
  await part.locator('label:not(.cam) input[type="file"]').setInputFiles(png('kette-test.png'));
  await expect(part.locator('[data-shot]')).toHaveCount(1);
  await part.locator('[data-shot-draw]').click();
  await drawLine(page);
  await expect.poll(async () => Object.keys((await dbRows(page, 'photos')).find((p) => p.wear)?.inks ?? {}).length).toBe(1);
  expect(errors).toEqual([]);
});
