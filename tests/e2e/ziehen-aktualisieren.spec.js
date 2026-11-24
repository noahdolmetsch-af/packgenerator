// «Ziehen zum Aktualisieren mit Velorad» (Noah 03.11.2026 «b», Paket D, Idee 10): on Heute a pull from the top shows a bike
// wheel and refreshes; elsewhere or from the middle of the page nothing happens. Touch only, so the phone project.
// Fictional data (home0460-fixture), nothing leaves the preview.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

// The touch events are made in the page (a Touch and a TouchEvent per step, as a finger sends them), not through the browser's
// touch input (CDP Input.dispatchTouchEvent): Chrome passes that to the page only in part (measured: after the first one or two
// moves the rest, and sometimes the touchend, never arrived; 6 of 8 pulls stood at 10–40 px of 96 and stayed there, also with
// slower moves or touch-action: none). The app's handlers get the same events either way, and this test is about them.
async function pull(page, context, { from = 200, by = 220 } = {}) {
  const send = (type, y) =>
    page.evaluate(
      async ([type, y]) => {
        const target = document.elementFromPoint(190, Math.min(Math.max(y, 1), innerHeight - 1)) ?? document.body;
        const touch = new Touch({ identifier: 1, target, clientX: 190, clientY: y, pageX: 190, pageY: y + scrollY });
        const list = type === 'touchend' ? [] : [touch];
        target.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: list, targetTouches: list, changedTouches: [touch] }));
        await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))); // the page draws what the finger did
      },
      [type, y],
    );
  await send('touchstart', from);
  for (let d = 20; d <= by; d += 20) await send('touchmove', from + d);
  return { release: () => send('touchend', from + by) };
}

test.describe('pull to refresh', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'phone', 'touch only'));

  test('a long pull from the top turns the wheel and says when it is up to date', async ({ page, context }, info) => {
    const T = await openHome(page, context, info);
    await page.goto('./#/');
    await page.evaluate(() => window.scrollTo(0, 0));
    const { release } = await pull(page, context);
    const wheel = page.locator('[data-pull-wheel]');
    await expect(wheel).toBeVisible();
    await expect(wheel).toContainText(T('Let go to refresh'));
    await release();
    await expect(wheel).toHaveAttribute('data-pull-wheel', 'busy');
    await expect(wheel).toHaveAttribute('data-pull-wheel', 'done', { timeout: 10_000 });
    await expect(wheel).toContainText(T('Up to date'));
    await expect(page.locator('[data-pull-wheel]')).toHaveCount(0, { timeout: 10_000 });
  });

  test('a short pull lets the wheel go back and loads nothing', async ({ page, context }, info) => {
    await openHome(page, context, info);
    await page.goto('./#/');
    await page.evaluate(() => window.scrollTo(0, 0));
    const { release } = await pull(page, context, { by: 80 });
    await expect(page.locator('[data-pull-wheel="pulling"]')).toBeVisible();
    await release();
    await expect(page.locator('[data-pull-wheel]')).toHaveCount(0);
  });

  test('no pull on another page', async ({ page, context }, info) => {
    await openHome(page, context, info);
    await page.goto('./#/trips');
    await page.evaluate(() => window.scrollTo(0, 0));
    await pull(page, context);
    await expect(page.locator('[data-pull-wheel]')).toHaveCount(0);
  });
});
