// «Aktiv und Auswerten» 5 (Noah 03.11.2026): «Das tut mir gut» stands under Aktiv › Erholung: the link there shows
// today's count, and the list opens inside Aktiv with the tab «Erholung» lit and the path «‹ Erholung». German UI.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

test('RE-1 Erholung shows the daily list with today\'s count, and the list opens inside Aktiv › Erholung', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/flow/rest');
  await ready(page);
  const link = page.locator('[data-rest-routine]');
  await expect(link).toBeVisible();
  await expect(link.locator('xpath=..')).toContainText(/\d+ von \d+ heute abgehakt|Gewohnheiten zum Abhaken/);
  await link.click();
  await expect(page).toHaveURL(/#\/routine$/);
  await expect(page.locator('main[data-s2-place="active"]')).toHaveCount(1);
  await expect(page.locator('.crumb')).toContainText(info.project.name === 'phone' ? T('Recovery|page') : `${T('Active|place')}`);
  await page.screenshot({ path: info.outputPath('re-liste.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
});
