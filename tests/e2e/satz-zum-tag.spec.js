// «Ein Satz zum Tag» (Noah 24.11.2026 «1a»): the free field of the evening page is called «Ein Satz zum Tag», stays optional,
// and its sentence also stands in the history («Alle Antworten»). On a phone and a computer, German, fixed clock in Europe/Zurich.
// Fictional data only. SHOTS=<folder> saves full-page screenshots.
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';
import { flowSeeded, putWall } from './wall-fixture.js';

const DAY = '2026-10-15';

async function shot(page, name) {
  if (!process.env.SHOTS) return;
  const w = page.viewportSize().width;
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${w <= 500 ? 390 : 1440}.png`, fullPage: true });
}

test('Satz zum Tag: the field of the evening page, its sentence is in the history', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(`${DAY}T21:10:00+02:00`) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/');
  await ready(page);
  await flowSeeded(page);
  await putWall(page);

  await page.goto('./#/check/evening'); // not Heute: its window would put today's questions away
  await page.reload();
  await ready(page);
  const field = page.locator('[data-story]');
  await expect(field).toHaveAttribute('placeholder', 'Ein Satz zum Tag');
  await field.fill('Ein ruhiger Abend am See.');
  await field.blur();
  await shot(page, 'satz-abend');
  await page.waitForTimeout(900);
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-story]')).toHaveValue('Ein ruhiger Abend am See.');

  await page.goto('./#/check/history');
  await ready(page);
  const row = page.locator('[data-row="tc.satz"]');
  await expect(row).toBeVisible();
  await expect(row).toContainText('Ein Satz zum Tag');
  await expect(row).toContainText('Ein ruhiger Abend am See.');
  await shot(page, 'satz-verlauf');
  expect(errors).toEqual([]);
});
