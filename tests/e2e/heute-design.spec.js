// v0.101.0 Design-Refresh P2 «Heute» (H1, H7; Noah 12.10.2026 «h1-h6 freigeben», «h7-h9 freigegeben»):
// the greeting holds only the greeting (date and weather under it), the trip card has number fields
// and the packing bar, every tile is a light card, the four new tiles are on the wall with «neu», and
// «New» is sorted by area. Fictional data only (test_data_gtp_), clock and weather from openHome.
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';

const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test('Heute in the new look: header, trip card, light tiles, new tiles, New by area', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  const phone = info.project.name === 'phone';

  // the greeting alone in the heading, the weather in the line under it
  await expect(page.locator('#hello-h [data-weather]')).toHaveCount(0);
  await expect(page.locator('.greet .dl [data-weather]')).toBeVisible();
  // «Customise the start page»: at the top on a computer, at the bottom on a phone
  const adapt = page.getByRole('button', { name: T('Customise the start page') });
  await expect(adapt).toBeVisible();
  const [a, h] = [await adapt.boundingBox(), await page.locator('#hello-h').boundingBox()];
  if (phone) expect(a.y).toBeGreaterThan(h.y + 400);
  else {
    // HG1 (mockups HG1a, HG1b): the longer greeting and the name question push it under the date line,
    // still in the greeting's header, above the trip card
    const g = await page.locator('section.greet').boundingBox();
    expect(a.y).toBeGreaterThan(h.y);
    expect(a.y + a.height).toBeLessThanOrEqual(g.y + g.height + 1);
    expect(a.y + a.height).toBeLessThan((await page.locator('section.trip').boundingBox()).y);
  }

  // the trip card: number fields, the packing bar, one strong button, no photo
  const card = page.locator('section.trip');
  await expect(card.locator('[data-boxes] dd').first()).toBeVisible();
  await expect(card.locator('[data-packed] [role="progressbar"]')).toHaveAttribute('aria-valuemax', /\d+/);
  // v0.131.0: the trip keeps its 6 entries (entries(6, 2)); Noah's one-time update readyClean2026 that
  // added a 7th to future trips is gone from the code (data cleanup).
  await expect(card.locator('[data-packed]')).toContainText(T('{n} of {m} packed', { n: 2, m: 6 }));
  await expect(card.locator('.btn.hi')).toHaveCount(1);
  await expect(card.locator('img')).toHaveCount(0);

  // light tiles: no dark tile left
  const dark = await page.locator('.wall .ti').evaluateAll((els) => els.filter((el) => {
    // a tile's frame is its first painted box (some tiles wrap their card in a plain div)
    const box = [...el.querySelectorAll('.body *')].find((x) => !/rgba\(0, 0, 0, 0\)|transparent/.test(getComputedStyle(x).backgroundColor));
    if (!box) return false;
    const c = getComputedStyle(box).backgroundColor.match(/[\d.]+/g).map(Number);
    return (c[0] + c[1] + c[2]) / 3 < 100;
  }).length);
  expect(dark).toBe(0);

  // the four new tiles on the wall (their «neu» sign counts from the release day: tests/tiles.test.js)
  // v0.155.0 «Heute neu geordnet» (HN4 3a, changed on purpose): «Next milestone» left the ready wall; three stay
  for (const id of ['week', 'month', 'yearago']) await expect(page.locator(`.wall [data-tile="${id}"] h2`)).toBeVisible();
  await expect(page.locator('.wall [data-tile="nextms"]')).toHaveCount(0);
  await expect(page.locator('[data-section="week"] li')).toHaveCount(7);
  await page.screenshot({ path: info.outputPath(`heute-${phone ? 390 : 1440}.png`), fullPage: true });
  await noSideways(page);

  // «New» by area: Merken first (PL1, Noah «5a»; Eigene Listen), then Trips, Gear, Bikes, Note; «Plan a trip» first of Trips
  await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' })));
  const sheet = page.locator('dialog.sheet.new');
  if (!(await sheet.isVisible())) await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).first().click();
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('h3.ngrp')).toHaveText([T('Remember'), T('Trips|place'), T('Gear|place'), T('Bikes|place'), T('Note|group')]);
  await expect(sheet.locator('h3.ngrp', { hasText: T('Trips|place') }).locator('xpath=following-sibling::ul[1]').locator('.opt').first()).toContainText(T('Plan a trip'));
  await page.screenshot({ path: info.outputPath(`neu-${phone ? 390 : 1440}.png`) });
  expect(errors).toEqual([]);
});
