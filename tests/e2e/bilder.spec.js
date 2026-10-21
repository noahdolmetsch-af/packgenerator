// «Bilder in der App» (Noah 20.10.2026 «1b 2a 3a 4a 5a»): the bike's photo pale behind the head of Bike care
// and Workshop, the setup photos as a timeline with «+ Foto», several photos per problem with «Zuschneiden»
// and «Als PDF», and a pale trip photo on top of the tour page. Fictional data; the photos are tiny
// generated PNGs that never leave the page.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';
import { sn4plusData, D0, day } from './sn4plus-fixture.js';
import { at1Acts } from './at1-acts.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const fixture = fileURLToPath(new URL('./fixture.json', import.meta.url));
const bike = JSON.parse(readFileSync(fixture, 'utf8')).tables.bikes[0];
const B64 = 'iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAIAAAADnC86AAAAMElEQVR4nO3NMQ0AAAgDsPl3yc+BBEyQ8DTp30zXi4jFYrFYLBaLxWKxWCwWi8V3Fmz2HkDU8QY8AAAAAElFTkSuQmCC';
const png = (name) => ({ name, mimeType: 'image/png', buffer: Buffer.from(B64, 'base64') });
const SHOTS = process.env.SHOTS;
const shot = (page, info, name) => (SHOTS ? page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true }) : null);
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

async function load(page, context, file = fixture) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await importAndSettle(page, file);
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

test('1b 2a: a setup photo added from Bike care shows pale behind the bike there and in the Workshop', async ({ page, context }, info) => {
  const errors = await load(page, context);
  await page.goto(`./#/bikes?tab=care&bike=${bike.id}&open=1`);
  const head = page.locator('header.vhead');
  await expect(head.locator('[data-head-photo]')).toHaveCount(0);
  await head.locator('[data-head-photos]').click();
  const sheet = page.locator('dialog[data-setup-photos]');
  await expect(sheet.getByRole('heading', { name: T('Setup photos') })).toBeVisible();
  await expect(sheet.getByText(T('No setup photo yet. Add one of how the bike looks now; later ones line up here by date.'))).toBeVisible();
  await sheet.locator('[data-setup-add]').setInputFiles([png('setup-sommer.png'), png('setup-winter.png')]);
  await expect(sheet.locator('[data-setup-photo]')).toHaveCount(2);
  await shot(page, info, 'B2-zeitstrahl');
  // «…» › change the day: the photo moves to its month
  await sheet.locator('[data-setup-photo]').filter({ hasText: 'setup-winter' }).locator('button.dots').click();
  await page.getByRole('menuitem', { name: new RegExp(T('Change the day')) }).click();
  await sheet.locator('[data-setup-photo]').filter({ hasText: 'setup-winter' }).locator('input').fill('2025-01-15');
  await expect(sheet.locator('.mon h3')).toHaveCount(2);
  await sheet.getByRole('button', { name: T('Done') }).click();
  await expect(head.locator('[data-head-photo]')).toBeVisible();
  await expect(head.locator('[data-head-photos]')).toContainText('2');
  await noSideways(page);
  await shot(page, info, 'B1-velopflege');
  await page.goto(`./#/bikes?tab=shop&bike=${bike.id}`);
  await expect(page.locator('header.vhead [data-head-photo]')).toBeVisible();
  const rows = (await dbRows(page, 'photos')).filter((p) => p.bikeId === bike.id);
  expect(rows.map((p) => p.day).sort()).toEqual(['2025-01-15', rows.find((p) => p.name === 'setup-sommer').day].sort());
  expect(errors).toEqual([]);
});

test('3a 4a: a problem with two photos, one cut, all as one PDF; later more photos in Bike care', async ({ page, context }, info) => {
  const errors = await load(page, context);
  await page.goto('./#/');
  await page.keyboard.press('n');
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: new RegExp(T('Problem with a bike')) }).click();
  const dlg = page.getByRole('dialog', { name: T('Problem with a bike') });
  const set = dlg.locator('[data-photo-set]');
  await set.locator('[data-photo-add]').setInputFiles([png('kette-1.png'), png('kette-2.png')]);
  await expect(set.locator('.thumbs li')).toHaveCount(2);
  await set.locator('[data-photo-crop]').first().click();
  const crop = page.getByRole('dialog', { name: T('Cut the edges') });
  await expect(crop.locator('[data-crop-box]')).toBeVisible();
  await crop.locator('[data-crop-save]').click();
  await expect(crop).toHaveCount(0);
  await set.locator('[data-photo-pdf]').click();
  await expect(set.locator('[data-photo-pdf-done]')).toBeVisible();
  await shot(page, info, 'B3-problem-fotos');
  await dlg.getByLabel(T('What is wrong? One problem per line or separated by commas')).fill('Kette knackt');
  await dlg.getByRole('button', { name: T('High'), exact: true }).click();
  await dlg.getByRole('button', { name: T('Save problem') }).click();
  await expect.poll(async () => (await dbRows(page, 'maintenance')).find((r) => r.task === 'Kette knackt')?.photos?.length).toBe(2);
  const row = (await dbRows(page, 'maintenance')).find((r) => r.task === 'Kette knackt');
  expect(row.photo).toBe(row.photos[0]);
  expect(row.docId).toBeTruthy();
  const docs = await dbRows(page, 'docs');
  expect(docs.find((d) => d.id === row.docId)).toMatchObject({ kind: 'pdf', pages: 2 });
  // Bike care: the photos small in the row; «…» › «Fotos und PDF» adds one more
  await page.goto(`./#/bikes?tab=care`);
  const prob = page.locator(`[data-repair-id="${row.id}"]`).first();
  await expect(prob.locator('[data-problem-photos] img')).toHaveCount(2);
  await prob.locator('button.dots').click();
  await page.getByRole('menuitem', { name: new RegExp(T('Photos and PDF')) }).click();
  const ps = page.locator('dialog.pps');
  await ps.locator('[data-photo-add]').setInputFiles(png('kette-3.png'));
  await expect(ps.locator('.thumbs li')).toHaveCount(3);
  await ps.getByRole('button', { name: T('Done') }).click();
  await expect(prob.locator('[data-problem-photos] img')).toHaveCount(3);
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('5a: a photo of the trip shows pale on top of the tour page; the star chooses which', async ({ page, context }, info) => {
  mkdirSync(info.project.outputDir, { recursive: true });
  const A = 'test_bild_';
  const d = sn4plusData();
  d.tables.activities = at1Acts(day, A);
  const file = `${info.project.outputDir}/bilder-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(d));
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  const errors = await load(page, context, file);
  await page.goto(`./#/tour/${encodeURIComponent(`a:${A}1`)}`);
  const tour = page.locator('[data-tour-page]');
  await expect(tour.locator('[data-tour-landscape]')).toBeVisible();
  await expect(tour.locator('[data-tour-sky]')).toHaveCount(0);
  await tour.locator('[data-tour-photos]').setInputFiles([png('pass.png'), png('see.png')]);
  await expect(tour.locator('[data-tour-sky]')).toBeVisible();
  const first = await tour.locator('[data-tour-sky]').getAttribute('src');
  await expect(tour.locator('[data-tour-cover]').first()).toHaveAttribute('aria-pressed', 'true');
  await tour.locator('[data-tour-cover]').nth(1).click();
  await expect(tour.locator('[data-tour-cover]').nth(1)).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('[data-tour-page] [data-tour-cover]').nth(1)).toHaveAttribute('aria-pressed', 'true');
  expect(typeof first).toBe('string');
  await shot(page, info, 'B5-tour');
  expect(errors).toEqual([]);
});
