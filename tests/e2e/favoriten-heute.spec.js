// «Favoriten» auf Heute (Noah 27.11.2026 «1-5a», step 2): the tile stands first, before «Abhaken»; «All n ›» opens the window with the groups.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('Heute: the favourites tile stands above the habits, the window «All» renames a group, takes one out with Undo and orders', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  const tile = page.locator('[data-pins-tile]');
  await expect(tile).toBeVisible();
  // 1a: the tile is on top of everything else on the wall, before the habits block
  const top = await tile.evaluate((el) => el.getBoundingClientRect().top);
  const haken = page.locator('[data-haken], [data-haken-top]').first();
  if (await haken.count()) expect(top).toBeLessThan(await haken.evaluate((el) => el.getBoundingClientRect().top));

  await tile.locator('[data-pins-all]').click();
  const win = page.locator('[data-fav-all]');
  await expect(win).toBeVisible();
  const groups = win.locator('[data-fav-group]');
  expect(await groups.count()).toBeGreaterThan(1);
  const n = await win.locator('[data-fav-row]').count();

  // take the first favourite out with its star, then Undo
  await win.locator('.fa-star').first().click();
  await expect(win.locator('[data-fav-row]')).toHaveCount(n - 1);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(win.locator('[data-fav-row]')).toHaveCount(n);

  // order: the first goes down one place
  const first = win.locator('[data-fav-row]').first();
  const id = await first.getAttribute('data-fav-row');
  await first.locator('.sort-ar').nth(1).click();
  await expect(win.locator('[data-fav-row]').nth(1)).toHaveAttribute('data-fav-row', id);

  // a new group lands in the window
  const before = await groups.count();
  await win.locator('[data-fav-newgroup]').click();
  await win.locator('.fa-input').fill('Weekend');
  await win.getByRole('button', { name: T('Add'), exact: true }).click();
  await expect(win.locator('[data-fav-group]')).toHaveCount(before + 1);

  await win.locator('[data-fav-done]').click();
  await expect(win).toHaveCount(0);
  await expect(tile.locator('[data-pins-all]')).toBeVisible();
});
