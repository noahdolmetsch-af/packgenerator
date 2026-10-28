// «Gut zu wissen» über die Suche ausblenden (Noah 28.10.2026 «b»): «Gut zu wissen ausblenden» in the top
// search hides the tip line on every page, Undo brings it back, «Tipps einblenden» shows it again.
// German UI, the clock fixed in Europe/Zurich, no network, an empty app (fictional data only).
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const shots = process.env.SHOTS;

async function search(page, text) {
  const glass = page.getByRole('button', { name: T('Search everything') });
  if (await glass.first().isVisible()) await glass.first().click();
  const field = page.locator('input[type=search]:visible').first();
  await field.fill(text);
}

test('hide «Good to know» from the search, Undo, show it again', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date('2026-10-28T10:00:00+01:00') });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/me');
  await ready(page);
  const line = page.locator('main [data-tip]');
  await expect(line).toBeVisible();
  if (shots) await page.screenshot({ path: `${shots}/gzw-before-${info.project.name}.png` });

  await search(page, 'Gut zu wissen');
  const off = page.locator('[data-cmd="tipsoff"]:visible');
  await expect(off).toContainText(T('Hide «Good to know» on all pages'));
  await expect(page.locator('[data-cmd="tipson"]:visible')).toBeVisible();
  if (shots) await page.screenshot({ path: `${shots}/gzw-search-${info.project.name}.png` });
  await off.click();
  const done = page.locator('p.done:visible');
  await expect(done).toContainText(T('«Good to know» hidden on all pages. Back: search «show tips».'));
  await expect(line).toHaveCount(0);
  if (shots) await page.screenshot({ path: `${shots}/gzw-done-${info.project.name}.png` });

  // Undo brings it back at once
  await done.getByRole('button', { name: T('Undo') }).click();
  await expect(line).toBeVisible();

  // hidden again, it stays hidden on another page; «Tipps einblenden» shows it again
  await search(page, 'Gut zu wissen ausblenden');
  await page.locator('[data-cmd="tipsoff"]:visible').click();
  await page.reload();
  await ready(page);
  await expect(page.locator('main [data-tip]')).toHaveCount(0);
  if (shots) await page.screenshot({ path: `${shots}/gzw-after-${info.project.name}.png` });
  await page.goto('./#/auswerten');
  await ready(page);
  await expect(page.locator('main [data-tip]')).toHaveCount(0);
  await search(page, 'Tipps einblenden');
  await page.locator('[data-cmd="tipson"]:visible').click();
  await expect(page.locator('p.done:visible')).toContainText(T('«Good to know» is back on the pages.'));
  await expect(page.locator('main [data-tip]')).toBeVisible();
  expect(errors).toEqual([]);
});
