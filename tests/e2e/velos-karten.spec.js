// «Neuer Schwung» Velos (Noah 27.10.2026 «1a 2a 3a», style S2 «Kacheln mit Tiefe»): the bikes on Velos are small
// cards with a drawn bike, the name and «type · km»; the chosen one is framed and its bike rolls in; the cards come
// in one after another; nothing moves with «Bewegung reduzieren». Fictional data.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const anim = (loc) => loc.evaluate((el) => getComputedStyle(el).animationName);

test('Velos: the bikes are cards with a drawing, name and km; a tap chooses one', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.goto('./#/bikes');
  const cards = page.locator('section.setup-band [data-bike-card]');
  await expect(cards.nth(1)).toBeVisible(); // the page loads later: wait for the cards before counting
  expect(await cards.count()).toBeGreaterThan(1);
  await expect(cards.first().locator('svg.mini')).toBeVisible();
  await expect(cards.first().locator('.bs')).toContainText('km');
  expect(await anim(cards.first())).toMatch(/vb-in$/);
  const second = cards.nth(1);
  const name = await second.locator('.bn').textContent();
  await second.click();
  await expect(page.locator('section.setup-band [data-bike-card][aria-selected="true"] .bn')).toHaveText(name);
  const sel = page.locator('section.setup-band [data-bike-card][aria-selected="true"]');
  expect(await anim(sel.locator('svg.mini'))).toMatch(/vb-roll$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('Velos with reduce motion: the cards stand still', async ({ page, context }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page, context, info);
  await page.goto('./#/bikes');
  const card = page.locator('section.setup-band [data-bike-card]').first();
  await expect(card).toBeVisible();
  expect(await anim(card)).toBe('none');
});
