// «Heute als Begleiter» PR 9 (Noah 28.10.2026 «1a 2a 3a»): «Belongs to App and help» on top of Me: small links,
// «all n ›» opens the catalogue by moment. German, phone and computer, fictional data (home0460-fixture), no sideways scroll.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { mkdirSync } from 'node:fs';

test('Belongs to: on Me a row of links, «all» opens the catalogue by moment', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 9 });
  await page.goto('./#/me');
  const row = page.locator('[data-gehoert="app"]');
  await expect(row).toBeVisible();
  await expect(row).toContainText(T('Belongs to {moment}', { moment: T('App and help|moment') }));
  const n = await row.locator('[data-gehoert-item]').count();
  expect(n).toBeGreaterThan(0);
  expect(n).toBeLessThanOrEqual(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  if (process.env.SHOTS) {
    mkdirSync(process.env.SHOTS, { recursive: true });
    await row.evaluate((e) => { e.style.outline = '3px solid #d9480f'; e.style.outlineOffset = '3px'; });
    await page.screenshot({ path: `${process.env.SHOTS}/gehoert-app-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await row.locator('[data-gehoert-all]').click();
  await expect(page).toHaveURL(/#\/features\?by=moment&moment=app/);
  await expect(page.locator('[data-moment-hint]')).toBeVisible();
  expect(errors).toEqual([]);
});
