// «Tour nur einmal» (Noah 17.11.2026 «1-5a», Startseite ruhiger, Entwurf A): while «My tour» is on Heute, the sentence under
// the greeting, the countdown chip and «Your moment» (about the tour) do not say the same about the same tour again.
// German, phone and computer, fictional data (home0460-fixture: a trip that starts tomorrow, the clock on Friday 9 October 2026).
import { test, expect } from './clock.js';
import { openHome, homeFixture } from './home0460-fixture.js';
import { READY, wallRecord } from '../../src/lib/home/tiles.js';

test('the tour is named once: no countdown chip, no days-until sentence, no Your-moment card beside My tour', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 9 });
  await expect(page.locator('[data-section="meinetour"]')).toBeVisible();
  await expect(page.locator('[data-goal-countdown]')).toHaveCount(0);
  await expect(page.locator('[data-say]')).toBeVisible(); // «N things are up today» stays
  await expect(page.locator('[data-say]')).not.toContainText(/Tag(e)? bis|day(s)? until/);
  await expect(page.locator('[data-section="moment"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  void T;
});

test('without My tour on the wall the chip, the sentence and Your moment are back', async ({ page, context }, info) => {
  const d = homeFixture();
  d.tables.settings.push({ key: 'homeWall', value: wallRecord(READY.filter((x) => x.id !== 'meinetour')) });
  const T = await openHome(page, context, info, { data: d, hour: 9 });
  await expect(page.locator('[data-section="meinetour"]')).toHaveCount(0);
  await expect(page.locator('[data-goal-countdown]')).toHaveCount(1);
  await expect(page.locator('[data-say]')).toContainText(/Tag(e)? bis|day(s)? until/);
  await expect(page.locator('[data-section="moment"]')).toHaveCount(1);
  void T;
});
