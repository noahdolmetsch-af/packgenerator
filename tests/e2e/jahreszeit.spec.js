// «Das Logo zieht sich der Jahreszeit an» (Noah 03.11.2026, Idee 30; Noah «D und C nachdem das geheime Menü aktiviert wurde»):
// the logo is plain «PG» until the five taps; then it is the bike sign (C), and Ich › Darstellung offers D and plain.
// Fictional data (home0460-fixture; the clock stands on 9 October = autumn), nothing leaves the preview.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { ANY_SURPRISE } from './logo-helpers.js';

const mark = (page, info) => (info.project.name === 'phone' ? page.locator('header.top .brand .mark') : page.locator('.logo .mark'));

test('plain PG until the secret, then the bike sign; Darstellung picks the other logos', async ({ page, context }, info) => {
  await openHome(page, context, info);
  const m = mark(page, info);
  await expect(m.locator('[data-logo]')).toHaveCount(0); // plain «PG»
  for (let i = 0; i < 5; i++) await m.click();
  await expect(m.locator('[data-logo="bike"][data-season="autumn"]')).toHaveCount(1);
  // one of the surprises, by chance: any of SURPRISES (the bike, a saying, the flat tyre, the marmot, the weather, the Alps)
  await expect(page.locator(ANY_SURPRISE).first()).toBeVisible();
  await page.goto('./#/me/look');
  const set = page.locator('[data-logo-set]');
  await set.scrollIntoViewIfNeeded();
  await set.getByRole('button', { name: 'PG mit Jahreszeit-Extra' }).click();
  await expect(m.locator('[data-logo="hat"][data-season="autumn"]')).toHaveCount(1);
  await set.getByRole('button', { name: 'PG', exact: true }).click();
  await expect(m.locator('[data-logo]')).toHaveCount(0);
  await page.reload();
  await expect(m).toBeVisible();
  await expect(page.locator('[data-logo-set]')).toHaveCount(1); // found once, stays found on this device
});

test('without the secret Darstellung shows no logo choice', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.goto('./#/me/look');
  await expect(page.locator('main h1').first()).toBeVisible();
  await expect(page.locator('[data-logo-set]')).toHaveCount(0);
});
