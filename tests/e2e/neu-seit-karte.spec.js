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
  if (await skip.first().isVisible({ timeout: 3000 }).catch(() => false)) await skip.first().click();
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
  // a group opens to its news with «Try it»
  await groups.first().locator('summary').click();
  await expect(groups.first().locator('li').first()).toBeVisible();
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
