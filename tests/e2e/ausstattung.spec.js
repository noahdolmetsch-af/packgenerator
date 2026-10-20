// v0.83.0 «Ausstattung» (Noah 11.10.2026, A1–A5 a): Velos › Ausstattung shows one bike's parts in groups
// with name, weight and price; empty parts fold; a part is edited in a small sheet; «Velos vergleichen»
// shows only rows with values. Fictional v048 fixture (the Spark has parts, the Bergziege none).
import { test, expect } from '@playwright/test';
import { v048File, P, SPARK, GOAT } from './v048-fixture.js';
import { openData, settle } from './settle.js';
import { TABS } from './placetab.js';

const SHOTS = process.env.AUSSTATTUNG_SHOTS;
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const bikeOf = (page, id) =>
  page.evaluate(
    (id) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const one = req.result.transaction('bikes').objectStore('bikes').get(id);
          one.onsuccess = () => resolve(one.result);
          one.onerror = () => reject(one.error);
        };
      }),
    id,
  );

async function start(page, context, info) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(v048File(info));
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return errors;
}

test('Ausstattung: groups with name, weight and price; a part gets its price in the sheet', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=compare&bike=${SPARK}`);
  // Impeccable Runde 2 (Ausstattung 2): the short title «Ausstattung», the bike's name first in the line below.
  await expect(page.getByRole('heading', { level: 1, name: 'Teile', exact: true })).toBeVisible();
  await expect(page.locator('header.vhead .vsub')).toContainText(`${P} Scott Spark 960 · `);
  // The place tab is called «Ausstattung» (A1a).
  await expect(page.locator(TABS).getByRole('link', { name: 'Teile', exact: true })).toHaveAttribute('aria-current', /page|true/);
  // Noah's four measurements on top, the rest behind «+ n weitere Masse».
  // Impeccable Runde 2 (Ausstattung 1): no measure yet is one sentence and «Masse eintragen», which opens the first one
  await expect(page.getByText('Noch keine Masse.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Masse eintragen' }).click();
  await expect(page.getByRole('textbox', { name: 'Sitzhöhe' })).toBeFocused();
  await page.getByRole('textbox', { name: 'Sitzhöhe' }).press('Escape');
  await expect(page.getByRole('button', { name: /^Sitzhöhe:/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Sattelversatz:/ })).toHaveCount(0);
  await page.getByRole('button', { name: /weitere Masse/ }).click();
  await expect(page.getByRole('button', { name: /^Sattelversatz:/ })).toBeVisible();

  const drive = page.getByRole('region', { name: 'Antrieb' });
  await expect(drive.getByRole('button', { name: `Kassette: ${P} Zahnkranz 10-51` })).toContainText('470 g');
  await expect(drive.getByRole('button', { name: `Kassette: ${P} Zahnkranz 10-51` })).toContainText('Preis +');
  // Parts without a name are one folded line (A2a); it opens.
  const fold = drive.getByRole('button', { name: /ohne Angaben/ });
  await expect(fold).toHaveAttribute('aria-expanded', 'false');
  await fold.click();
  await expect(drive.getByRole('button', { name: 'Schalthebel: –' })).toBeVisible();

  // A price in the sheet: stored, the row and the group sum show it (A3a).
  await drive.getByRole('button', { name: `Kassette: ${P} Zahnkranz 10-51` }).click();
  const dlg = page.getByRole('dialog');
  await dlg.getByLabel('Preis (CHF)').fill('260');
  await dlg.getByRole('button', { name: 'Speichern' }).click();
  await expect(dlg).toBeHidden();
  await expect.poll(async () => (await bikeOf(page, SPARK)).parts.find((p) => p.key === 'cassette').priceChf).toBe(260);
  await expect(drive.getByRole('button', { name: `Kassette: ${P} Zahnkranz 10-51` })).toContainText('CHF 260');
  await expect(drive.locator('.gsum')).toContainText('CHF 260');
  await expect(page.getByRole('region', { name: 'Teuerste Teile' })).toContainText('CHF 260');
  await noSideways(page);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/ausstattung-${info.project.name}.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test('Ausstattung: another bike, a bike without parts, the area filter', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=compare&bike=${GOAT}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Teile', exact: true })).toBeVisible();
  await expect(page.locator('header.vhead .vsub')).toContainText(`${P} Bergziege 29`);
  await expect(page.getByText('0 Teile erfasst')).toBeVisible();
  // Impeccable Runde 2 (Ausstattung 1): no part weight yet is one sentence, not six «–» bars
  await expect(page.getByRole('region', { name: 'Gewicht pro Bereich' })).toContainText('Noch keine Teilgewichte.');
  await expect(page.getByRole('region', { name: 'Gewicht pro Bereich' }).locator('.bar')).toHaveCount(0);
  await expect(page.getByText('Noch keine Preise. Tippe auf ein Teil, um den Preis einzutragen.')).toBeVisible();
  // The area filter shows one group.
  await page.getByRole('group', { name: 'Bereich' }).getByRole('button', { name: 'Bremsen' }).click();
  await expect(page.locator('.grp')).toHaveCount(1);
  await expect(page.getByRole('region', { name: 'Bremsen' })).toBeVisible();
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('Velos vergleichen: only rows with a value, show all brings the rest (A5a)', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=compare&bike=${SPARK}`);
  await page.getByRole('link', { name: 'Velos vergleichen' }).click();
  await expect(page).toHaveURL(/tab=compare&view=all/);
  const region = page.getByRole('region', { name: 'Velos vergleichen' });
  await expect(region).toBeVisible();
  const rows = region.locator('tbody tr:not(.gh)');
  const few = await rows.count();
  await expect(page.getByText(/leere Zeilen ausgeblendet/)).toBeVisible();
  await page.getByRole('button', { name: 'alle zeigen' }).click();
  await expect.poll(() => rows.count()).toBeGreaterThan(few);
  await page.getByRole('button', { name: 'Leere Zeilen ausblenden' }).click();
  await expect.poll(() => rows.count()).toBe(few);
  // On a phone two bikes side by side to start with; a tap on a bike adds it.
  const heads = region.locator('thead th.bh');
  if (info.project.name === 'phone') {
    await expect(heads).toHaveCount(2);
    await page.getByRole('group', { name: 'Velos zum Vergleichen' }).locator('button[aria-pressed="false"]').first().click();
    await expect(heads).toHaveCount(3);
  }
  // Back goes to the Ausstattung.
  await page.getByRole('link', { name: 'Teile', exact: true }).first().click();
  await expect(page).toHaveURL(/tab=compare(?!&view)/);
  await noSideways(page);
  if (SHOTS) {
    await page.goto('./#/bikes?tab=compare&view=all');
    await page.screenshot({ path: `${SHOTS}/vergleichen-${info.project.name}.png`, fullPage: true });
  }
  expect(errors).toEqual([]);
});
