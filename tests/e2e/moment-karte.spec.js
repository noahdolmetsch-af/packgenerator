// «Heute als Begleiter» PR 4 (Noah 28.10.2026 «1a 2a 3a»): the card «Your moment» on Today: it names the moment you are in,
// the trip, the five steps of the trip loop and one next step. German, phone and computer, fictional data
// (home0460-fixture: a trip that starts tomorrow, the clock on Friday 9 October 2026), no sideways scroll.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { mkdirSync } from 'node:fs';

test('Your moment: packing the day before a trip, the steps, the button opens the packing list', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 9 });
  const card = page.locator('[data-section="moment"]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveAttribute('data-moment', 'packen');
  await expect(card).toContainText(T('Your moment: {name}', { name: T('Packing|moment') }));
  await expect(card.locator('[data-moment-trip]')).toContainText(T('starts tomorrow'));
  await expect(card.locator('.strip li')).toHaveCount(5);
  await expect(card.locator('.strip li[aria-current="step"]')).toHaveText(T('Pack|loop'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  if (process.env.SHOTS) {
    mkdirSync(process.env.SHOTS, { recursive: true });
    await page.screenshot({ path: `${process.env.SHOTS}/moment-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await card.locator('[data-moment-step]').click();
  await expect(page).toHaveURL(/#\/pack/);
  expect(errors).toEqual([]);
});
