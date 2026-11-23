// «Was ist neu» mit Datum und Bild (Warteliste 3; Noah 22.11.2026 «1b», «2a und Uhrzeit», «3a»): every entry has its day with the weekday,
// an entry with a picture shows «Show picture», the picture loads only after the tap. Fictional data (home0460 fixture), German.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { mkdirSync } from 'node:fs';

test('Was ist neu: the day with the weekday, and a picture that loads after the tap', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 9 });
  const pics = [];
  page.on('request', (r) => /\/news\/.*\.webp/.test(r.url()) && pics.push(r.url()));
  await page.goto('./#/me/news');
  const find = page.getByPlaceholder(T('Find an update'));
  await expect(find).toBeVisible();
  await find.fill('Abhaken auf der Karte Draussen');
  // the row of the entry opens its card
  await page.getByRole('button', { name: /Abhaken auf der Karte Draussen/ }).first().click();
  const card = page.locator('[data-version]').filter({ has: page.locator('[data-news-pic]') }).first();
  await expect(card).toBeVisible();
  // the day has a weekday and a year
  await expect(card.locator('.vn-h small')).toContainText(/\b(Mo|Di|Mi|Do|Fr|Sa|So)\b.*20\d\d/);
  // nothing was loaded before the tap
  expect(pics).toEqual([]);
  await card.locator('[data-news-pic]').click();
  await expect(card.locator('[data-news-figure] img')).toHaveCount(2);
  await expect.poll(() => pics.length).toBeGreaterThan(0);
  if (process.env.SHOTS) {
    mkdirSync(process.env.SHOTS, { recursive: true });
    await card.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${process.env.SHOTS}/neu-bild-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await card.locator('[data-news-figure] button').first().click();
  await expect(card.locator('[data-news-figure].big')).toHaveCount(1);
  await card.locator('[data-news-pic]').click();
  await expect(card.locator('[data-news-figure]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});
