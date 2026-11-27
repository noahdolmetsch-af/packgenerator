// «Bilder bei jeder Neuheit» PR 3 (Noah 23.11.2026 «1b 2a 3a 4b 5a»): the card «N Neuheiten seit …» at the end of Today counts
// the news since the last visit, opens a window that groups them by place and counts them as seen when it is closed.
// Fictional data only (gesamttest fixture).
import { test, expect } from './clock.js';
import { start, tr } from './gesamttest/lib.js';
import { settle } from './settle.js';
import { NEWS } from '../../src/lib/news/index.gen.js';

const T = tr('de');
const FROM = NEWS[Math.min(4, NEWS.length - 1)].version; // the 4 newest updates are «new»
const CURRENT = NEWS[0].version;

async function seed(page, { card = null } = {}) {
  await page.goto('./#/');
  await page.evaluate(
    ([from, current, c]) => {
      localStorage.setItem('wasneu.update', JSON.stringify({ v: current, from, at: '2026-11-23' }));
      localStorage.setItem('whatsnew.seen', current);
      if (c) localStorage.setItem('wasneu.card', c);
      else localStorage.removeItem('wasneu.card');
    },
    [FROM, CURRENT, card],
  );
  await page.reload();
  await page.locator('main').first().waitFor({ timeout: 10_000 });
  await settle(page);
  // an update also brings the short intro of Today: skip it, it is not what is tested here
  const skip = page.getByRole('button', { name: T('Skip|intro') });
  // the bubble comes about 0.7 s after Today is laid out: wait for it (isVisible does not wait)
  const shown = await skip.first().waitFor({ state: 'visible', timeout: 4000 }).then(() => true, () => false);
  if (shown) await skip.first().click();
}

test('the card counts the news since the last visit and its window groups them by place', async ({ page, context }, info) => {
  test.skip(NEWS.length < 2, 'needs two news files');
  await start(page, context, info);
  await seed(page);
  const card = page.locator('[data-neu-seit]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible({ timeout: 10_000 });
  await expect(card.locator('h2')).toContainText(new RegExp(`\\d+ ${T('{n} news items since {when}').replace('{n} ', '').replace(' {when}', '')}|\\d+ ${T('{n} news item since {when}').replace('{n} ', '').replace(' {when}', '')}`));
  // the card sits under the content of Today, not above it
  const top = await page.locator('main h1, main h2').first().boundingBox();
  const cb = await card.boundingBox();
  expect(cb.y).toBeGreaterThan(top.y);
  await card.locator('[data-neu-seit-open]').click();
  const sheet = page.locator('[data-neu-seit-sheet]');
  await expect(sheet).toBeVisible();
  const groups = sheet.locator('details.grp');
  await expect(groups.first()).toBeVisible({ timeout: 10_000 });
  expect(await groups.count()).toBeGreaterThan(0);
  // the first (largest) place is open at once, so a picture shows without a tap; the others open with a tap
  await expect(groups.first()).toHaveAttribute('open', '');
  await expect(groups.first().locator('li').first()).toBeVisible();
  if ((await groups.count()) > 1) {
    await expect(groups.nth(1)).not.toHaveAttribute('open', '');
    await groups.nth(1).locator('summary').click();
    await expect(groups.nth(1).locator('li').first()).toBeVisible();
  }
  // no version number in the lines (impeccable 24.11.2026)
  await expect(sheet.locator('.meta .num')).toHaveCount(0);
  await expect(sheet.getByRole('link', { name: T('Everything under Me › What is new') })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  // closed: counted as seen, the card is gone and stays gone
  await expect(card).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('wasneu.card'))).toBe(CURRENT);
  await page.reload();
  await settle(page);
  await expect(page.locator('[data-neu-seit]')).toHaveCount(0);
});

test('closing with the cross counts the news as seen, and nothing new means no card', async ({ page, context }, info) => {
  await start(page, context, info);
  await seed(page);
  const card = page.locator('[data-neu-seit]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible({ timeout: 10_000 });
  await card.locator('[data-neu-seit-close]').click();
  await expect(card).toHaveCount(0);
  await seed(page, { card: CURRENT });
  await expect(page.locator('[data-neu-seit]')).toHaveCount(0);
});

test('the line under the chips opens the same window, and closing it counts the news as seen (one way into the list)', async ({ page, context }, info) => {
  await start(page, context, info);
  await seed(page);
  const banner = page.locator('[data-news-banner]');
  await expect(banner).toBeVisible({ timeout: 10_000 });
  await banner.locator('[data-news-more]').click();
  const sheet = page.locator('[data-neu-seit-sheet]');
  await expect(sheet).toBeVisible();
  // «Testrunde» (Noah 27.11.2026): from the line the window opens by update (every news with its steps); a switch brings the places
  await expect(sheet.locator('[data-nss-release]').first()).toBeVisible({ timeout: 10_000 });
  await sheet.locator('[data-nss-mode="place"]').click();
  await expect(sheet.locator('details.grp').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  // the line is closed for this update, and the card at the end counts as seen too
  await expect(banner).toHaveCount(0);
  await expect(page.locator('[data-neu-seit]')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('wasneu.card'))).toBe(CURRENT);
});
