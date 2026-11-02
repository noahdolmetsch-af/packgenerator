// «Sicherung prüfen» (Noah 02.11.2026 «1a»): a dry run of a backup file, nothing is imported; the line for a second
// copy outside the device. Fictional data only. SHOTS=<folder> saves pictures.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready, openFolds } from './settle.js';

const T = (en) => DE[en] ?? en;
const good = { app: 'pack-generator', schemaVersion: 1, exportedAt: '2026-10-01T10:00:00Z', tables: { trips: [{ id: 't1' }, { id: 't2' }], bikes: [{ id: 'b1' }], items: [{ id: 'EL01' }] } };
const bad = { app: 'pack-generator', schemaVersion: 1, tables: { trips: [{ id: 't1' }, { title: 'no id' }] } };
const file = (name, obj) => ({ name, mimeType: 'application/json', buffer: Buffer.from(typeof obj === 'string' ? obj : JSON.stringify(obj)) });
async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.waitForTimeout(300);
  await page.locator('[data-section="backup-file"]').screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}

test('Check backup says if a file is whole and changes nothing', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/me/data');
  await ready(page);
  await openFolds(page);
  const before = await page.evaluate(() => indexedDB.databases().then((d) => d.length));
  await expect(page.locator('[data-offsite="none"]')).toContainText(T('No second copy outside this device yet.'));
  await page.locator('[data-check-file]').setInputFiles(file('gut.json', good));
  const res = page.locator('[data-check-result]');
  await expect(res).toHaveAttribute('data-check-ok', '1');
  await expect(res).toContainText(T('This backup is good.'));
  await expect(res).toContainText('2 Touren');
  await shot(page, info, 'gut');
  await page.locator('[data-check-file]').setInputFiles(file('kaputt.json', bad));
  await expect(res).toHaveAttribute('data-check-ok', '0');
  await expect(res).toContainText(T('This backup has problems:'));
  await shot(page, info, 'kaputt');
  await page.locator('[data-check-file]').setInputFiles(file('foto.json', 'not json'));
  await expect(res).toHaveAttribute('data-check-ok', '0');
  // nothing was imported: no import window opened
  await expect(page.getByRole('dialog', { name: T('Import backup') })).toHaveCount(0);
  expect(await page.evaluate(() => indexedDB.databases().then((d) => d.length))).toBe(before);
  await page.locator('[data-offsite-done]').click();
  await expect(page.locator('[data-offsite="ok"]')).toContainText('0');
  await shot(page, info, 'zweite-kopie');
  expect(errors).toEqual([]);
});
