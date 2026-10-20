// v0.102.0 «Vorschlag und Challenge» (Noah 12.10.2026 «d1-d5 freigeben», mockups D1b and D5): on Heute
// «Heute baden oder Sauna?» shows alternatives to choose from; the chosen one can be ticked off today
// and set as a challenge (how often, until when). It counts by itself and, once reached, is celebrated
// on the tile and under «Heute wichtig». Fictional data only (test_data_gtp_), clock from openHome.
import { test, expect } from '@playwright/test';
import { openHome, homeFixture } from './home0460-fixture.js';
import { withWall } from './wall-fixture.js';

test('a suggestion with alternatives becomes a challenge that counts by itself', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // «Heute neu» A (0.165.0): the suggestion tile left the ready wall (it stays in the catalog); a wall with it
  const T = await openHome(page, context, info, { data: withWall(homeFixture()) });
  const tile = page.getByRole('region', { name: T('Swim or sauna today?') });
  await tile.scrollIntoViewIfNeeded();
  await expect(tile.getByRole('button', { name: T('Swim'), exact: true })).toHaveAttribute('aria-pressed', 'true');

  // choose another alternative and add an own one
  await tile.getByRole('button', { name: T('Sauna'), exact: true }).click();
  await expect(tile.getByRole('button', { name: T('Sauna'), exact: true })).toHaveAttribute('aria-pressed', 'true');
  await tile.getByRole('button', { name: T('own|suggestion') }).click();
  await tile.getByLabel(T('Your own suggestion')).fill('test_data_gtp_ Kalt duschen');
  await tile.getByRole('button', { name: T('Add') }).click();
  await expect(tile.getByRole('button', { name: 'test_data_gtp_ Kalt duschen', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await tile.getByRole('button', { name: T('Sauna'), exact: true }).click();

  // set Sauna as a challenge: 2 times until the end of the month
  await tile.getByRole('button', { name: T('Set «{what}» as a challenge', { what: T('Sauna') }) }).click();
  const sheet = page.getByRole('dialog', { name: T('Set as a challenge') });
  await expect(sheet.getByLabel(T('Until when'))).toHaveValue('2026-10-31');
  await sheet.getByLabel(T('How often')).fill('2');
  await sheet.getByRole('button', { name: T('Start challenge') }).click();
  await expect(sheet).toBeHidden();
  await expect(tile.locator('[data-challenge]')).toContainText(T('{n} of {m}', { n: 0, m: 2 }));

  // tick it off today: it counts, a second tap takes it back
  const tick = tile.getByRole('button', { name: T('{what} today: tick off', { what: T('Sauna') }) });
  await tick.click();
  await expect(tile.locator('[data-challenge]')).toContainText(T('{n} of {m}', { n: 1, m: 2 }));
  await tile.getByRole('button', { name: T('{what}: done today', { what: T('Sauna') }) }).click();
  await expect(tile.locator('[data-challenge]')).toContainText(T('{n} of {m}', { n: 0, m: 2 }));

  // change it to once: reached at the next tick, celebrated on the tile and in the quiet «Gut gemacht» line (Noah 5a, 20.10.2026)
  await tile.locator('[data-challenge]').click();
  const mine = page.getByRole('dialog', { name: T('Your challenge') });
  await mine.getByLabel(T('How often')).fill('1');
  await mine.getByRole('button', { name: T('Save') }).click();
  await tick.click();
  await expect(tile.locator('[data-challenge-done]')).toContainText(T('Challenge reached!'));
  await expect(page.getByRole('region', { name: T('Well done') })).toContainText(T('Challenge reached: {n}× {what}', { n: 1, what: T('Sauna') }));

  // it stays after a reload (stored, goes into the backup)
  await page.reload();
  await expect(page.getByRole('region', { name: T('Swim or sauna today?') }).locator('[data-challenge-done]')).toBeVisible();
  await page.screenshot({ path: info.outputPath(`challenge-${info.project.name}.png`), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});
