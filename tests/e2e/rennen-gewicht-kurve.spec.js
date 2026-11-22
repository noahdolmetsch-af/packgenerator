// «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»), PR 16: the weight along the route (Rennen › Vorbereiten) is a line chart
// with an axis, exact values on pointing, a window behind a tap and «Als Tabelle». The sample race (made up, in the app source).
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('Rennen › Vorbereiten: the weight along the route is a chart you can point at, tap and read as a table', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await page.goto('./#/trips');
  await page.locator('[data-to-races]').click();
  await page.locator('[data-race-sample-open]').click();
  await expect(page.locator('[data-race-sample]')).toBeVisible();
  await page.locator('[data-race-tab="prepare"]').click();
  const chart = page.locator('[data-chart="race-weight"]');
  await chart.scrollIntoViewIfNeeded();
  const plot = chart.locator('[data-plot]');
  await expect(plot).toHaveAttribute('data-n', /^\d+$/);
  const n = Number(await plot.getAttribute('data-n'));
  expect(n).toBeGreaterThan(3);
  // pointing: the km and the kg in the line above
  const box = await plot.boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2);
  await expect(chart.locator('[data-readout]')).toContainText('kg');
  // a tap: the window
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height / 2);
  await expect(page.locator('[data-race-weight-sheet]')).toContainText('kg');
  await page.keyboard.press('Escape');
  // the table
  await chart.getByRole('button', { name: T('As table') }).click();
  await expect(chart.locator('table tbody tr')).toHaveCount(Math.min(n, 14));
  await chart.getByRole('button', { name: T('Chart|table') }).click();
  await expect(plot).toBeVisible();
});
