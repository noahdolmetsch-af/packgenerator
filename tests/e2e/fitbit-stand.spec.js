// «Fitbit immer aktuell» (Noah 2.11.2026 «1a 2a 3a 4a 5a»): Heute shows «Stand …» under the Fitbit tiles and, when
// nothing new has come, the last values with «von gestern». German UI, fictional data (home0460-fixture.js).
import { test, expect } from './clock.js';
import { openHome, homeFixture, day } from './home0460-fixture.js';

test('FS1: Heute keeps the last values and says when they were fetched', async ({ page, context }, info) => {
  const d = homeFixture();
  d.tables.healthDays = [{ date: day(-1), restingHr: 52, azm: 30, sleep: { asleepMin: 420, efficiency: 91 } }];
  d.tables.settings.push({ key: 'health', value: { connected: true, values: ['sleep', 'steps', 'azm', 'restingHr', 'hrvMs'], fetch: 'manual', lastSync: `${day(0)}T05:42:00.000Z` } });
  const T = await openHome(page, context, info, { data: d });
  const ab = page.locator('[data-section="abfragen"]');
  if (await ab.isVisible().catch(() => false)) await ab.locator('[data-ab-later]').click();
  const body = page.locator('[data-section="body"]');
  await expect(body.locator('[data-body-last] [data-body="pulse"] b')).toHaveText('52');
  await expect(body.locator('[data-body-last]')).toContainText('von gestern');
  await expect(body.locator('[data-fitbit-stand]')).toContainText(/Stand \d\d[:.]\d\d/);
  if (process.env.SHOTS) await body.scrollIntoViewIfNeeded(), await body.screenshot({ path: `${process.env.SHOTS}/heute-${info.project.name}.png` });
});

test('FS2: three days without values: the last ones show, marked with their day', async ({ page, context }, info) => {
  const d = homeFixture();
  d.tables.healthDays = [{ date: day(-3), restingHr: 49, azm: 20, sleep: { asleepMin: 400, efficiency: 90 } }];
  d.tables.settings.push({ key: 'health', value: { connected: true, values: ['sleep', 'steps', 'azm', 'restingHr', 'hrvMs'], fetch: 'manual', lastSync: `${day(0)}T05:42:00.000Z` } });
  await openHome(page, context, info, { data: d });
  const ab = page.locator('[data-section="abfragen"]');
  if (await ab.isVisible().catch(() => false)) await ab.locator('[data-ab-later]').click();
  const last = page.locator('[data-section="body"] [data-body-last]');
  await expect(last.locator('[data-body="pulse"] b')).toHaveText('49');
  await expect(last).not.toContainText('von gestern');
  if (process.env.SHOTS) await last.locator('xpath=ancestor::section').screenshot({ path: `${process.env.SHOTS}/alt-${info.project.name}.png` });
});
