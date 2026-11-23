// «Bilder bei jeder Neuheit» (Noah 23.11.2026 «1b 2a 3a 4b 5a»): an update with pictures shows them above its lines
// (know/NewsBild.svelte); one with a «before» picture has a slider that moves; a missing picture leaves nothing behind.
// Fictional data only (gesamttest fixture).
import { test, expect } from './clock.js';
import { start, tr } from './gesamttest/lib.js';
import { settle } from './settle.js';
import { NEWS, NEWS_DE } from '../../src/lib/news/index.gen.js';

const T0 = tr('de');
const T = (en) => NEWS_DE[en] ?? T0(en);
const withBild = NEWS.filter((e) => e.bilder?.length);
const both = withBild.find((e) => e.bilder.some((b) => b.vorher));
const only = withBild.find((e) => e.bilder.every((b) => !b.vorher));

async function open(page, e) {
  await page.goto('./#/me/news');
  await page.locator('main h1').first().waitFor({ timeout: 8000 });
  await settle(page);
  await page.getByRole('searchbox', { name: T('Find an update') }).fill(e.version);
  await page.locator(`[data-row="${e.version}"]`).first().click();
  return page.locator(`.wn-vopen [data-version="${e.version}"], [data-newest="${e.version}"]`).first();
}

test('there are updates with pictures', () => {
  expect(withBild.length).toBeGreaterThan(0);
});

test('an update with pictures shows them and a before picture makes a slider that moves', async ({ page, context }, info) => {
  test.skip(!both, 'no update with a before picture yet');
  await start(page, context, info);
  const card = await open(page, both);
  const fig = card.locator('[data-news-bild]').first();
  await expect(fig).toBeVisible();
  // only the first picture is open, the others wait behind «More pictures»
  if (both.bilder.length > 1) await expect(card.locator('details.vn-more [data-news-bild]').first()).toBeHidden();
  const slider = fig.locator('input[type=range]');
  await expect(slider).toHaveCount(1);
  await expect(slider).toHaveAttribute('aria-label', T('Slide between before and after'));
  const img = fig.locator('img.nb-n');
  await expect.poll(() => img.evaluate((i) => i.complete && i.naturalWidth > 0)).toBe(true);
  const handle = fig.locator('.nb-h');
  const x0 = (await handle.boundingBox()).x;
  await slider.fill('20');
  await expect.poll(async () => (await handle.boundingBox()).x).toBeLessThan(x0);
  // «Try it» still works next to the pictures
  await expect(card.getByRole('link').first()).toBeVisible();
});

test('an update with only an after picture has no slider', async ({ page, context }, info) => {
  test.skip(!only, 'every update with pictures has a before picture');
  await start(page, context, info);
  const card = await open(page, only);
  const fig = card.locator('[data-news-bild]').first();
  await expect(fig).toBeVisible();
  await expect(fig.locator('input[type=range]')).toHaveCount(0);
  await expect(fig.locator('.nb-tag')).toHaveText(T('After|picture'));
});

test('a picture that does not load leaves nothing behind', async ({ page, context }, info) => {
  test.skip(!withBild.length, 'no update with pictures yet');
  await start(page, context, info);
  await page.route('**/news/**/*.webp', (r) => r.abort());
  const card = await open(page, withBild[0]);
  // (a picture inside the closed «More pictures» does not load, so it cannot fail yet: only the open ones count)
  await expect(card.locator('[data-news-bild]:visible')).toHaveCount(0, { timeout: 10_000 });
  await expect(card.getByRole('link').first()).toBeVisible();
});
