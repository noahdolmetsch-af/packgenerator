// «Wochenplan» Teil 2 (Noah 09.11.2026): the page under Aktiv. An empty page says why and starts the plan; the hours and the
// units change the week; what changed is saved and can be taken back; two links lead to the page.
// German, phone + desktop, no data of Noah's, clock fixed (Monday 9 Nov 2026, Europe/Zurich). WOCHENPLAN_SHOTS=<dir> saves screenshots.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const SHOTS = process.env.WOCHENPLAN_SHOTS || '';

async function shot(page, info, name) {
  if (!SHOTS) return;
  const w = info.project.name === 'phone' ? 390 : 1440;
  await page.evaluate(() => window.scrollTo(0, 0));
  const vp = page.viewportSize();
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: vp.width, height: Math.max(vp.height, h) });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/${name}-${w}.png`, fullPage: true });
  await page.setViewportSize(vp);
}

async function open(page, context, hash = './#/flow/wochenplan') {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date('2026-11-09T10:00:00+01:00'));
  await page.goto(hash);
  await ready(page);
  return errors;
}

test('Wochenplan: empty page, start, the week with times, nothing overflows', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const root = page.locator('[data-wochenplan]');
  await expect(root.locator('h1')).toHaveText(T('Weekly plan'));
  await expect(root.locator('[data-empty]')).toContainText(T('No weekly plan yet'));
  await shot(page, info, 'wochenplan-leer');
  await root.locator('[data-empty] button', { hasText: T('Start my weekly plan') }).click();
  await expect(root.locator('[data-wp-hvalue]')).toHaveText('15 Std');
  await expect(root.locator('[data-wp-msg]')).toContainText(T('Your weekly plan is saved. Change the hours or a unit any time.'));
  // seven days, tennis three times, a rest block, meditation on some days
  await expect(root.locator('[data-wp-week] [data-day]')).toHaveCount(7);
  await expect(root.locator('[data-wp-week] [data-unit^="tennis@"]')).toHaveCount(3);
  await expect(root.locator('[data-wp-week] [data-unit^="rest"]')).toHaveCount(1);
  await expect(root.locator('[data-wp-week] [data-unit^="med@"]').first()).toBeVisible();
  await expect(root.locator('[data-wp-count="tennis"]')).toHaveText('3');
  await shot(page, info, 'wochenplan');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

test('Wochenplan: hours and units change the week, are saved and can be taken back', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const root = page.locator('[data-wochenplan]');
  await root.locator('[data-empty] button').first().click();
  await expect(root.locator('[data-wp-hvalue]')).toHaveText('15 Std');
  // many hours: above about 20 the plan says it only fits with overload (screenshot only)
  if (SHOTS) {
    for (let n = 16; n <= 22; n++) {
      await root.locator('[data-wp-hinc]').click();
      await expect(root.locator('[data-wp-hvalue]')).toHaveText(`${n} Std`);
    }
    await shot(page, info, 'wochenplan-22');
    await root.locator('[data-wp-reset]').click();
    await expect(root.locator('[data-wp-hvalue]')).toHaveText('15 Std');
  }
  // one hour more: the units are suggested anew
  await root.locator('[data-wp-hinc]').click();
  await expect(root.locator('[data-wp-hvalue]')).toHaveText('16 Std');
  await expect(root.locator('[data-wp-msg]')).toContainText(T('Units suggested for {n} hours.').replace('{n}', '16'));
  // undo: back to 15
  await root.locator('[data-wp-undo]').click();
  await expect(root.locator('[data-wp-hvalue]')).toHaveText('15 Std');
  await expect(root.locator('[data-wp-msg]')).toHaveText(T('Taken back.'));
  // one tennis unit less: two stay, the plan says it was changed by hand
  await root.locator('[data-wp-dec="tennis"]').click();
  await expect(root.locator('[data-wp-count="tennis"]')).toHaveText('2');
  await expect(root.locator('[data-wp-week] [data-unit^="tennis"]')).toHaveCount(2);
  await expect(root.locator('[data-wp-again]')).toBeVisible();
  await shot(page, info, 'wochenplan-von-hand');
  // saved: after a reload the same
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-wochenplan] [data-wp-count="tennis"]')).toHaveText('2');
  // the basic plan again
  await page.locator('[data-wochenplan] [data-wp-reset]').click();
  await expect(page.locator('[data-wochenplan] [data-wp-count="tennis"]')).toHaveText('3');
  expect(errors).toEqual([]);
});

test('Wochenplan: the units can all go to zero and the page says what to do', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const root = page.locator('[data-wochenplan]');
  await root.locator('[data-empty] button').first().click();
  for (const type of ['hockey', 'tennis', 'yoga', 'gym', 'sauna', 'rest', 'bikeOut', 'bikeIn', 'runOut', 'runIn', 'mini']) {
    const count = root.locator(`[data-wp-count="${type}"]`);
    for (let n = Number(await count.textContent()); n > 0; n--) {
      await root.locator(`[data-wp-dec="${type}"]`).click();
      await expect(count).toHaveText(String(n - 1));
    }
  }
  await expect(root.locator('[data-wp-week]')).toHaveCount(0);
  await expect(root.locator('[data-empty]')).toContainText(T('No units chosen'));
  await shot(page, info, 'wochenplan-keine');
  await root.locator('[data-empty] button', { hasText: T('Suggest from {n} hours').replace('{n}', '15') }).click();
  await expect(root.locator('[data-wp-week] [data-day]')).toHaveCount(7);
  expect(errors).toEqual([]);
});

test('Wochenplan: Aktiv and the week planner lead to the page', async ({ page, context }) => {
  const errors = await open(page, context, './#/flow');
  await page.locator('section[aria-labelledby="week-h"] [data-to-wochenplan]').click();
  await expect(page).toHaveURL(/#\/flow\/wochenplan/);
  await expect(page.locator('[data-wochenplan] h1')).toHaveText(T('Weekly plan'));
  await page.goto('./#/week');
  await ready(page);
  await page.locator('[data-to-wochenplan]').click();
  await expect(page).toHaveURL(/#\/flow\/wochenplan/);
  // from the page on: the next steps (after the start)
  await page.locator('[data-wochenplan] [data-empty] button').first().click();
  await expect(page.locator('[data-wp-to-goals]')).toHaveAttribute('href', '#/flow');
  await expect(page.locator('[data-wp-to-week]')).toHaveAttribute('href', '#/week');
  expect(errors).toEqual([]);
});
