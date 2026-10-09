// v0.62.0 «Velo-Masse»: the fit and setup block on the bike page, first in «Compare bikes», the
// target pressure in the tyre service and the base check, and the bikeSpecs import with fit.
// Fictional data only (v0620 fixture, all names start with test_data_gtp_).
import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { v0620File, P, SPARK, SCALE } from './v0620-fixture.js';

const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const table = (page, name) =>
  page.evaluate(
    (name) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const all = req.result.transaction(name).objectStore(name).getAll();
          all.onsuccess = () => resolve(all.result);
          all.onerror = () => reject(all.error);
        };
      }),
    name,
  );
const bikeOf = async (page, id) => (await table(page, 'bikes')).find((b) => b.id === id);

async function start(page, context, info) {
  const file = v0620File(info);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  // The planned ride of today opens the ride page after the import; wait for the data instead.
  await expect.poll(async () => (await table(page, 'bikes')).length).toBe(4);
  return errors;
}

test('Masse: always open on the bike, set saddle height and target pressure in place, Undo', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?bike=${SCALE}`);
  const card = page.getByRole('region', { name: 'Masse' });
  await expect(card).toBeVisible();
  // Noah's three first; the old geometry.seatHeight of the Scale was moved to fit on import.
  await expect(card.locator('dt').first()).toHaveText('Sitzhöhe');
  await expect(card.locator('dt').nth(1)).toHaveText('Solldruck vorne');
  await expect(card.locator('dt').nth(3)).toHaveText('Lenkerbreite');
  await expect(card.getByRole('button', { name: /^Sitzhöhe:/ })).toHaveText('735 mm');
  await expect.poll(async () => (await bikeOf(page, SCALE)).fit?.seatHeight).toBe(735);
  expect((await bikeOf(page, SCALE)).geometry?.seatHeight).toBeUndefined();
  // A hardtail: fork rows, no shock rows.
  await expect(card.getByText('Gabeldruck')).toBeVisible();
  await expect(card.getByText('Dämpferdruck')).toHaveCount(0);

  await card.getByRole('button', { name: /^Sitzhöhe:/ }).click();
  await card.getByRole('textbox', { name: 'Sitzhöhe' }).fill('738');
  await card.getByRole('textbox', { name: 'Sitzhöhe' }).press('Enter');
  await expect(card.getByRole('button', { name: /^Sitzhöhe:/ })).toHaveText('738 mm');

  const front = card.getByRole('button', { name: /^Solldruck vorne:/ });
  await expect(front).toHaveText('–');
  await front.click();
  await card.getByRole('textbox', { name: 'Solldruck vorne' }).fill('1,7');
  await card.getByRole('textbox', { name: 'Solldruck vorne' }).press('Enter');
  await expect(front).toHaveText('1.7 bar');
  await expect.poll(async () => (await bikeOf(page, SCALE)).fit).toMatchObject({ seatHeight: 738, pressureF: 1.7 });
  // Undo puts the value back.
  const toast = page.getByRole('status').filter({ hasText: 'Solldruck vorne' });
  await expect(toast).toBeVisible();
  await toast.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(front).toHaveText('–');
  await expect.poll(async () => (await bikeOf(page, SCALE)).fit?.pressureF).toBeUndefined();
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('Velos vergleichen: the Masse rows come first and show the values', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/bikes?tab=compare');
  const region = page.getByRole('region', { name: 'Velos vergleichen' });
  await expect(region.locator('tbody .zl').first()).toHaveText('Masse');
  await expect(region.getByRole('button', { name: new RegExp(`^${P} Scott Spark 960: Sitzhöhe`) })).toHaveText('742 mm');
  await expect(region.getByRole('button', { name: new RegExp(`^${P} Scott Spark 960: Solldruck hinten`) })).toHaveText('1.6 bar');
  await expect(region.getByRole('button', { name: new RegExp(`^${P} Scott Scale 940: Sitzhöhe`) })).toHaveText('735 mm');
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('Quick care and base check name the target pressure; the pressure is prefilled with it', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/ride');
  await expect(page.getByRole('button', { name: /Reifendruck geprüft · Soll 1.5 \/ 1.6 bar/ })).toBeVisible();

  await page.goto(`./#/bikes?tab=care&bike=${SPARK}&open=1`);
  await page.locator('button.prow', { hasText: 'Reifen + Dichtmilch' }).click();
  const dlg = page.getByRole('dialog');
  await dlg.locator('button.tile', { hasText: 'Warten' }).click();
  await expect(dlg.getByTestId('pressure-target')).toContainText('Soll 1.5 / 1.6 bar');
  await expect(dlg.getByTestId('pressure-target')).toContainText('Zuletzt gemessen 1.4 / 1.55 bar');
  await dlg.getByRole('button', { name: 'Druck geprüft' }).click();
  await expect(dlg.getByRole('textbox', { name: 'Druck vorne (bar)' })).toHaveValue('1.5');
  await expect(dlg.getByRole('textbox', { name: 'Druck hinten (bar)' })).toHaveValue('1.6');
  await dlg.getByRole('textbox', { name: 'Druck hinten (bar)' }).fill('1.65');
  await dlg.getByRole('button', { name: 'Speichern' }).click();
  await expect.poll(async () => (await bikeOf(page, SPARK)).parts.find((p) => p.key === 'tyres').history.at(-1)).toMatchObject({ action: 'check', pressureF: 1.5, pressureR: 1.65 });
  expect(errors).toEqual([]);
});

test('Import: a bikeSpecs file with fit fills empty values, German names, unknown keys left out', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const path = info.outputPath('fit-specs.json');
  writeFileSync(path, JSON.stringify({ kind: 'bikeSpecs', bike: `${P} Scott Scale 940`, fit: { Lenkerbreite: 740, 'Solldruck hinten': '1,8 bar', seatHeight: 730, Lieblingsfarbe: 'blau' } }));
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel('Backup importieren').setInputFiles(path);
  const dlg = data.getByRole('dialog', { name: 'Datenblatt übernehmen' });
  await expect(dlg).toContainText('Lieblingsfarbe');
  // The saddle height differs from the one already there: it is only taken with a tick.
  await expect(dlg).toContainText('Masse: Sitzhöhe');
  await dlg.getByRole('button', { name: 'Datenblatt übernehmen' }).click();
  await expect.poll(async () => (await bikeOf(page, SCALE)).fit).toEqual({ seatHeight: 735, barWidth: 740, pressureR: 1.8 });
  await page.goto(`./#/bikes?bike=${SCALE}`);
  await expect(page.getByRole('region', { name: 'Masse' }).getByRole('button', { name: /^Lenkerbreite:/ })).toHaveText('740 mm');
  expect(errors).toEqual([]);
});
