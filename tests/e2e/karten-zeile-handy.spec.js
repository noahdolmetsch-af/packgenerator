// Durchklick Etappe 2, Frage 1a (Noah 05.11.2026): on a phone «Belongs to …» and «All here» start as ONE line on Packing, Trips,
// Material and Bikes; a tap opens the card, «Fold the card» closes it, the choice stays after a reload. On a computer «Belongs to» is a closed line too since Durchklick-Fund 2 (22.11.2026).
// Fictional data (home0460-fixture), German.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test.use({ cardsOpen: false });

const PAGES = [
  ['#/pack', 'gd:pack', '[data-gehoert]'],
  ['#/trips', 'gd:trips', '[data-gehoert]'],
  ['#/gear', 'gd:gear', '[data-gehoert]'],
  ['#/bikes', 'gd:bikes', '[data-gehoert]'],
  ['#/trips', 'ah:trips', '[data-all-here="trips"]'],
  ['#/gear', 'ah:gear', '[data-all-here="gear"]'],
  ['#/bikes', 'ah:bikes', '[data-all-here="bikes"]'],
];

test('phone: the two cards start as one line, open with a tap, fold again, and the choice is kept', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'phone only');
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 9 });
  for (const [hash, id, card] of PAGES) {
    await page.goto('./' + hash);
    const line = page.locator(`[data-card-line="${id}"]`);
    await expect(line).toBeVisible();
    await expect(line).toContainText(T('Open the card'));
    await expect(page.locator(card).first()).toHaveCount(0);
    // the line is one line, not a tower
    expect((await line.boundingBox()).height).toBeLessThan(70);
  }
  // open Packing's card: kept after a reload; the other cards stay lines
  await page.goto('./#/pack');
  await page.locator('[data-card-line="gd:pack"]').click();
  await expect(page.locator('[data-gehoert="packen"]')).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-gehoert="packen"]')).toBeVisible();
  await expect(page.locator('[data-card-line="gd:pack"]')).toHaveCount(0);
  // fold it again
  await page.locator('[data-card-fold="gd:pack"]').click();
  await expect(page.locator('[data-card-line="gd:pack"]')).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-card-line="gd:pack"]')).toBeVisible();
  // «All here» of Material opens with its tiles
  await page.goto('./#/gear');
  await page.locator('[data-card-line="ah:gear"]').click();
  await expect(page.locator('[data-all-here="gear"] [data-all-here-tile]').first()).toBeVisible();
  // Hilfen neu 1b (21.11.2026): «Alles hier» of Woche is a line at the end too (the only card line there), and no sideways scroll anywhere
  await page.goto('./#/week');
  await expect(page.locator('[data-card-line="ah:plan"]')).toBeVisible();
  await expect(page.locator('[data-all-here="plan"]')).toHaveCount(0);
  await expect(page.locator('[data-card-line]')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('computer: «Belongs to» is a closed line behind the title (Durchklick-Fund 2); «All here» is a line at the page end (Hilfen neu 1b)', async ({ page, context }, info) => {
  test.skip(info.project.name === 'phone', 'computer only');
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { hour: 9 });
  for (const [hash, id, card] of PAGES) {
    await page.goto('./' + hash);
    // Durchklick-Fund 2 (Noah «2a»): «Belongs to» is a closed line on a computer too, behind the title
    await expect(page.locator(`[data-card-line="${id}"]`)).toBeVisible();
    await expect(page.locator(card).first()).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
