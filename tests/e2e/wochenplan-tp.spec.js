// «TrainingPeaks im Wochenplan» (Noah 22.11.2026 «1a 2a 3a 4a»), W1: sessions from TrainingPeaks (made up) stand in training.plan;
// the weekly plan replaces the units of the same sport, says so, counts the hours and warns about hard days.
// German, phone + desktop, fictional data only, clock fixed (Monday 30 Nov 2026, Europe/Zurich). WOCHENPLAN_SHOTS=<dir> saves screenshots.
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

const tp = (id, day, mins, name, o = {}) => ({ id, day, kind: 'bike', name, mins, zone: 2, src: 'tp', ...o });

test('Wochenplan: TrainingPeaks replaces bike units, says so, counts the hours, is checked', async ({ page, context }, info) => {
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
  // without TrainingPeaks: one ride outdoors, one indoors, no TrainingPeaks line
  await expect(root.locator('[data-wp-week] [data-unit^="bikeOut"]')).toHaveCount(1);
  await expect(root.locator('[data-wp-week] [data-unit^="bikeIn"]')).toHaveCount(1);
  await expect(root.locator('[data-wp-tp]')).toHaveCount(0);
  await shot(page, info, 'wochenplan-tp-vorher');
  // five bike sessions from TrainingPeaks (fictional), three hard days in a row
  await seed(page, [
    ['settings', { key: 'training.plan', value: { sessions: [
      tp('tp-a', '2026-12-01', 64, 'Test Endurance', { time: '07:30' }),
      tp('tp-b', '2026-12-02', 79, 'Test Tempo', { time: '07:30', zone: 4 }),
      tp('tp-c', '2026-12-03', 72, 'Test Schwelle', { time: '07:30', zone: 4 }),
      tp('tp-d', '2026-12-04', 61, 'Test Locker', { time: '07:30' }),
      tp('tp-e', '2026-12-06', 250, 'Test Langer Tag', { time: '09:00' }),
    ] } }],
  ]);
  await page.reload();
  await ready(page);
  await expect(root.locator('[data-wp-week] [data-unit^="bikeOut"]')).toHaveCount(0);
  await expect(root.locator('[data-wp-week] [data-unit^="bikeIn"]')).toHaveCount(0);
  const lines = root.locator('[data-wp-tp]');
  await expect(lines.first()).toContainText('TrainingPeaks');
  await expect(root.locator('[data-wp-tp]', { hasText: 'Ersetzt durch TrainingPeaks' }).first()).toBeVisible();
  // the other sports stay
  await expect(root.locator('[data-wp-week] [data-unit^="tennis@"]')).toHaveCount(3);
  await expect(root.locator('[data-wp-plan]')).toContainText('Std von 15 Std');
  await shot(page, info, 'wochenplan-tp-nachher');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});
