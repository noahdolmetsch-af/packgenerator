// «Pässe sammeln» (Paket E, Idee 24): a ride over the Furka suggests the pass; collect it, change it, remove it with
// Undo, add an own pass. German UI, fictional data (the same as tourseite.spec.js).
import { test, expect } from './clock.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { sn4plusData, D0, day } from './sn4plus-fixture.js';
import { at1Acts } from './at1-acts.js';
import { importAndSettle } from './settle.js';
import { encodePolyline } from '../../src/lib/spur/polyline.js';

const A = 'test_pass_';
// a ride that crosses the top of the Furka (46.5726, 8.415) and one over flat country
const OVER = encodePolyline([[46.55, 8.36], [46.5726, 8.415], [46.59, 8.47]]);
const FLAT = encodePolyline([[47.3, 8.5], [47.35, 8.6]]);

async function open(page, context, info) {
  const d = sn4plusData();
  const acts = at1Acts(day, A);
  acts[0] = { ...acts[0], line: OVER };
  acts[1] = { ...acts[1], line: FLAT };
  d.tables.activities = acts;
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/paesse-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(d));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  await page.goto('./');
  await importAndSettle(page, file);
}

test('Idee 24: the Furka is suggested, collected as a yellow sign, changed, removed with Undo; an own pass is added', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info);
  // the way in: the row on the Rückblick
  await page.goto('./#/debrief');
  const row = page.locator('[data-m-row="paesse"]');
  await row.scrollIntoViewIfNeeded();
  await row.click();
  await expect(page).toHaveURL(/#\/debrief\/paesse$/);
  const root = page.locator('[data-paesse]');
  await expect(root).toBeVisible();
  // the suggestion: only the Furka, not the flat ride
  await expect(root.locator('[data-suggest]')).toHaveCount(1);
  await expect(root.locator('[data-suggest="furka"]')).toContainText('2’429');
  await root.locator('[data-suggest="furka"] [data-pass-take]').click();
  await expect(root.locator('[data-suggest]')).toHaveCount(0);
  const sign = root.locator('[data-pass="p-furka"] [data-pass-sign]');
  await expect(sign).toContainText('Furka');
  await expect(sign).toContainText('2’429 m');
  // change the name and height
  await root.locator('[data-pass="p-furka"] [data-pass-edit]').click();
  await root.locator('#pa-name').fill('Furkapass');
  await root.locator('#pa-m').fill('2430');
  await root.getByRole('button', { name: 'Speichern' }).click();
  await expect(root.locator('[data-pass="p-furka"] [data-pass-sign]')).toContainText('Furkapass');
  await expect(root.locator('[data-pass="p-furka"] [data-pass-sign]')).toContainText('2’430 m');
  // an own pass
  await root.locator('[data-pass-new]').click();
  await root.locator('#pa-name').fill('Col du Test');
  await root.locator('#pa-m').fill('1800');
  await root.getByRole('button', { name: 'Speichern' }).click();
  await expect(root.locator('[data-pass-sign]')).toHaveCount(2);
  // remove one: asked first, then Undo brings it back
  await root.locator('[data-pass="p-furka"] [data-pass-drop]').click();
  await page.getByRole('dialog').getByRole('button', { name: /Löschen|Entfernen/ }).last().click();
  await expect(root.locator('[data-pass-sign]')).toHaveCount(1);
  await page.getByRole('button', { name: /Rückgängig/ }).click();
  await expect(root.locator('[data-pass-sign]')).toHaveCount(2);
  // the collection stays after a reload; the suggestion does not come back for a collected pass
  await page.reload();
  await expect(page.locator('[data-paesse] [data-pass-sign]')).toHaveCount(2);
  await expect(page.locator('[data-paesse] [data-suggest]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Idee 24: «Not ridden» sends a suggestion away, and it can be let back in', async ({ page, context }, info) => {
  await open(page, context, info);
  await page.goto('./#/debrief/paesse');
  const root = page.locator('[data-paesse]');
  await root.locator('[data-suggest="furka"] [data-pass-skip]').click();
  await expect(root.locator('[data-suggest]')).toHaveCount(0);
  await expect(root.locator('[data-pass-reset]')).toBeVisible();
  await root.locator('[data-pass-reset]').click();
  await expect(root.locator('[data-suggest="furka"]')).toHaveCount(1);
});

test('Idee 24: without a pass the page says why and offers to add one', async ({ page, context }, info) => {
  const d = sn4plusData();
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/paesse-leer-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(d));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.goto('./');
  await importAndSettle(page, file);
  await page.goto('./#/debrief/paesse');
  await expect(page.locator('[data-paesse] [data-empty]')).toContainText('Noch kein Pass');
  await page.locator('[data-paesse] [data-empty]').getByRole('button', { name: 'Pass hinzufügen' }).click();
  await expect(page.locator('#pa-name')).toBeVisible();
});
