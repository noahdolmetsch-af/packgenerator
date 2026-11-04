// «Versteckte Funktionen» Schritt 3 (Noah 03.11.2026 «1a»): «Alles hier» on top of Velos und Material.
// The tile list comes from the page itself (src/lib/alleshier.js cannot load in a plain spec: it reads features.js).
import { test, expect } from './clock.js';
import { start, tr } from './gesamttest/lib.js';
import { settle } from './settle.js';

const T = tr('de');
const fill = (key, name) => T(key).replace('{name}', name);

test('All here on Bikes: tiles open their page, change order, hide with Undo, show again', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto('./#/bikes');
  const box = page.locator('[data-all-here="bikes"]');
  await expect(box).toBeVisible();
  await settle(page);
  await expect(box.getByRole('heading', { name: T('All here') })).toBeVisible();
  const tiles = box.locator('[data-all-here-tile]');
  expect(await tiles.count()).toBeGreaterThan(10);
  const ids = await tiles.evaluateAll((as) => as.map((a) => a.dataset.allHereTile));
  const names = await tiles.allInnerTexts();
  const [first, second, third] = ids;
  // a tile opens its page
  const wear = box.locator('[data-all-here-tile="f.partwear"]');
  const href = await wear.getAttribute('href');
  await wear.click();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe(href);
  await page.goto('./#/bikes');
  await expect(box).toBeVisible();
  // change: second tile one up with the arrow
  await box.locator('[data-all-here-edit]').click();
  await box.locator(`li[data-sort-id="${second}"]`).getByRole('button', { name: fill('Move {name} up', names[1]), exact: true }).click();
  await expect(box.locator('li[data-sort-id]').first()).toHaveAttribute('data-sort-id', second);
  // hide the third one, Undo brings it back
  await box.getByRole('button', { name: fill('Hide {name}', names[2]), exact: true }).click();
  await expect(box.locator(`li[data-sort-id="${third}"]`)).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).last().click();
  await expect(box.locator(`li[data-sort-id="${third}"]`)).toHaveCount(1);
  // hide it again and show it from the hidden list
  await box.getByRole('button', { name: fill('Hide {name}', names[2]), exact: true }).click();
  await box.getByRole('button', { name: fill('Show {name}', names[2]), exact: true }).click();
  await expect(box.locator(`li[data-sort-id="${third}"]`)).toHaveCount(1);
  // done: the order stays after a reload
  await box.locator('[data-all-here-edit]').click();
  await page.reload();
  await expect(tiles.first()).toHaveAttribute('data-all-here-tile', second);
  await expect(tiles.nth(1)).toHaveAttribute('data-all-here-tile', first);
  // «As at the start»
  await box.locator('[data-all-here-edit]').click();
  await box.getByRole('button', { name: T('As at the start') }).click();
  await box.locator('[data-all-here-edit]').click();
  await expect(tiles.first()).toHaveAttribute('data-all-here-tile', first);
});

test('All here on Gear: the tiles show and open their page', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto('./#/gear');
  const box = page.locator('[data-all-here="gear"]');
  await expect(box).toBeVisible();
  await settle(page);
  expect(await box.locator('[data-all-here-tile]').count()).toBeGreaterThan(10);
  for (const id of ['favorites', 'f.supplies']) {
    const tile = box.locator(`[data-all-here-tile="${id}"]`);
    const href = await tile.getAttribute('href');
    await tile.click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe(href);
    await page.goto('./#/gear');
    await expect(box).toBeVisible();
  }
  // not on the wishlist view
  await page.goto('./#/gear?tab=wishlist');
  await page.locator('main').first().waitFor();
  await settle(page);
  await expect(box).toHaveCount(0);
});

test('All here on Trips: the tiles show and open their page, komoot stays in the row', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto('./#/trips');
  const box = page.locator('[data-all-here="trips"]');
  await expect(box).toBeVisible();
  await settle(page);
  expect(await box.locator('[data-all-here-tile]').count()).toBeGreaterThan(10);
  for (const id of ['templates', 'ski', 'f.fuel']) {
    const tile = box.locator(`[data-all-here-tile="${id}"]`);
    const href = await tile.getAttribute('href');
    await tile.click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe(href);
    await page.goto('./#/trips');
    await expect(box).toBeVisible();
  }
  await expect(page.locator('[data-quick="komoot"]')).toBeVisible();
  // «In numbers» opens the section on the same page (on a phone it waits behind one line)
  await box.locator('[data-all-here-tile="numbers"]').click();
  await expect(page.locator('#iz-h')).toBeVisible();
});
