// SL3 «Scrollen und Listen» (Noah 14.10.2026 «SL1–SL4 freigegeben», answers «alle a»): the ride ledger of a
// bike by month with its km, the newest month open. Fictional data only (q1km-fixture.js).
import { test, expect } from './clock.js';
import { q1File, NEU } from './q1km-fixture.js';
import { openData, settle } from './settle.js';

async function shot(page, info, name, full = false) {
  if (!process.env.SHOTS) return;
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: full });
}
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test('SL3: the ride ledger by month with its km, the newest month open', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(q1File(info));
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await page.goto(`./#/bikes?tab=care&bike=${NEU}&open=1`);
  const kb = page.locator(`#care-${NEU} section.kmbook`);
  const months = kb.locator('.mg');
  await expect(months.first()).toHaveClass(/open/);
  expect(await months.count()).toBeGreaterThan(1);
  await expect(kb.locator('.mg.open')).toHaveCount(1);
  await expect(months.first().locator('.mk')).toContainText('km');
  await months.nth(1).locator('.mh').click();
  await expect(months.nth(1)).toHaveClass(/open/);
  await months.first().evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 72));
  await noSideways(page);
  await shot(page, info, 'SL3-fahrten-buch');
});
