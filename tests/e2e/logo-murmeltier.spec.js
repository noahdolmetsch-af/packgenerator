// «Geheimmenü» H2 «Murmeltier pfeift» (Noah 03.11.2026): five quick taps on PG can show a marmot at the bottom.
// Fictional data (home0460-fixture), nothing leaves the preview.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { fixChance } from './logo-helpers.js';

const mark = (page, info) => (info.project.name === 'phone' ? page.locator('header.top .brand .mark') : page.locator('.logo .mark'));
const five = async (m) => {
  for (let i = 0; i < 5; i++) await m.click();
};

test('the marmot whistles, then ducks away; the next five taps never show it twice in a row', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await fixChance(page, 'marmot');
  const m = mark(page, info);
  await five(m);
  const marmot = page.locator('[data-logo-marmot]');
  await expect(marmot).toBeVisible();
  await expect(marmot).toContainText(T('Peeep!')); // the fixed clock is at noon: it whistles
  await expect(marmot).toHaveCount(0, { timeout: 6000 }); // gone by itself
  await fixChance(page, 'bike', 'marmot'); // the marmot was just there: the choice has no marmot in it
  await five(m);
  await expect(page.locator('[data-logo-ride]')).toBeVisible();
  await expect(marmot).toHaveCount(0);
});

test('with reduce motion the marmot stands still at the bottom', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await fixChance(page, 'marmot');
  await five(mark(page, info));
  const marmot = page.locator('[data-logo-marmot]');
  await expect(marmot).toBeVisible();
  const box = await marmot.boundingBox();
  const vh = page.viewportSize().height;
  expect(box.y + box.height).toBeGreaterThan(vh - 4); // sits on the lower edge
});

test('with the switch «The marmot» off the marmot never comes', async ({ page, context }, info) => {
  await context.addInitScript(() => localStorage.setItem('ops.murmeltier', '0'));
  await openHome(page, context, info);
  await page.evaluate(() => (Math.random = () => 0.999)); // the last of the choice: the marmot, were it in the choice
  await five(mark(page, info));
  await expect(page.locator('[data-logo-ride], [data-logo-saying], [data-logo-flat]').first()).toBeVisible();
  await expect(page.locator('[data-logo-marmot]')).toHaveCount(0);
});
