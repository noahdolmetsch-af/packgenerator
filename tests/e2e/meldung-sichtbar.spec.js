// Durchklick Etappe 2, Design a (Noah 05.11.2026): a message stands where you caused it. A red message that a form writes far
// from the button you tapped (high up on a long page, out of the screen) must come into view after the tap, and only after a tap
// (src/lib/nav/alertseen.js). The robot scrolls a long page down, taps, and lets «a form» write a message at the top of the page
// (the same `role="alert"` the forms use). Invented data (home0460-fixture), phone.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

/** Writes a red message as the first thing of the page, like a form that shows its message above itself. */
const writeMessage = (page, text) =>
  page.evaluate((x) => {
    const p = document.createElement('p');
    p.setAttribute('role', 'alert');
    p.dataset.testMessage = '';
    p.textContent = x;
    document.querySelector('main').prepend(p);
  }, text);

async function longPageDown(page, T) {
  await page.goto('./#/me/news');
  await page.locator('main h1').first().waitFor();
  const long = await page.evaluate(() => document.documentElement.scrollHeight > 3 * innerHeight);
  expect(long, 'the page must be long for this test').toBe(true);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300);
}

test('a message that appears after a tap, out of sight, comes into view', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'phone: the screen is short');
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await longPageDown(page, T);
  // a tap on the page (the button of the form) …
  await page.mouse.move(2, 200);
  await page.mouse.down();
  await page.mouse.up();
  // … and the form writes its message far above
  await writeMessage(page, 'test_data_gtp_ Meldung');
  const msg = page.locator('[data-test-message]');
  await expect(msg).toBeInViewport({ ratio: 1 });
  expect(errors).toEqual([]);
});

test('a message that appears without a tap does not move the page', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'phone: the screen is short');
  const T = await openHome(page, context, info);
  await longPageDown(page, T);
  // no tap and no key for the next 6 s: wait it out (the scroll above came from the robot, not from a finger)
  await page.waitForTimeout(6500);
  const before = await page.evaluate(() => scrollY);
  await writeMessage(page, 'test_data_gtp_ Meldung');
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThanOrEqual(before - 1);
  await expect(page.locator('[data-test-message]')).not.toBeInViewport();
});
