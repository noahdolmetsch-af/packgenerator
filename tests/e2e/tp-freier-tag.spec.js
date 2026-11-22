// «Recovery Day» (Noah 22.11.2026 «Recovery Day ja»): a free day of TrainingPeaks (made up) stands as `rest` in training.plan;
// the weekly plan puts no free unit on it and says so. German, phone + desktop, fictional data only, clock fixed (Monday 30 Nov 2026).
// WOCHENPLAN_SHOTS=<dir> saves screenshots.
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';

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

async function seed(page, rows) {
  await page.evaluate(
    (list) =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const tx = r.result.transaction([...new Set(list.map((x) => x[0]))], 'readwrite');
          for (const [store, rec] of list) tx.objectStore(store).put(rec);
          tx.oncomplete = () => (r.result.close(), ok());
        };
      }),
    rows,
  );
}

test('Wochenplan: a Recovery Day from TrainingPeaks stays free, the plan says so', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date('2026-11-30T08:00:00+01:00'));
  await page.goto('./#/flow/wochenplan');
  await ready(page);
  const root = page.locator('[data-wochenplan]');
  await root.locator('[data-empty] button').first().click();
  await expect(root.locator('[data-wp-hvalue]')).toHaveText('15 Std');
  await expect(root.locator('[data-wp-tp]')).toHaveCount(0);
  // a day with a free unit of the plan (ids with # are the free ones, with @ the fixed ones)
  const days = await root.locator('[data-wp-week] .day').evaluateAll((els) => els.map((el) => [Number(el.getAttribute('data-day')), el.querySelectorAll('[data-unit*="#"]').length]));
  const busy = days.find(([, n]) => n > 0)?.[0];
  expect(busy).toBeDefined();
  await shot(page, info, 'recovery-vorher');
  const date = new Date(Date.UTC(2026, 10, 30 + busy, 12)).toISOString().slice(0, 10); // Monday 30 Nov + busy
  await seed(page, [['settings', { key: 'training.plan', value: { sessions: [], rest: [date] } }]]);
  await page.reload();
  await ready(page);
  await expect(root.locator(`[data-wp-week] .day[data-day="${busy}"] [data-unit*="#"]`)).toHaveCount(0);
  await expect(root.locator('[data-wp-tp]', { hasText: 'freien Tag' })).toHaveCount(1);
  await shot(page, info, 'recovery-nachher');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});
