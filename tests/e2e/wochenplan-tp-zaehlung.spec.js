// «TrainingPeaks zählt mit» (Noah 22.11.2026 «1a 2a 3a 4a»), W2: «Mein Trainingsplan» says «davon TrainingPeaks», the week
// counts TrainingPeaks as units and ticks the one that is done by hand. German, phone + desktop, fictional data only,
// clock fixed (Monday 30 Nov 2026, Europe/Zurich). WOCHENPLAN_SHOTS=<dir> saves screenshots.
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
const tp = (id, day, mins, name, o = {}) => ({ id, day, kind: 'bike', name, mins, zone: 2, src: 'tp', ...o });

test('TrainingPeaks counts: the line in Mein Trainingsplan, units in the week, a ticked one is done', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date('2026-12-02T09:00:00+01:00'));
  await page.goto('./#/flow/wochenplan');
  await ready(page);
  const root = page.locator('[data-wochenplan]');
  await root.locator('[data-empty] button').first().click();
  await expect(root.locator('[data-wp-hvalue]')).toHaveText('15 Std');
  // the card counts from what the page has loaded: wait for the number before reading it (a cold start shows it a moment later)
  await expect(root.locator('[data-wp-progress]')).toContainText('0 von');
  const before = await root.locator('[data-wp-progress]').innerText();
  await seed(page, [
    ['settings', { key: 'training.plan', value: { sessions: [
      tp('tp-a', '2026-12-01', 64, 'Test Endurance', { time: '07:30', done: true }),
      tp('tp-b', '2026-12-04', 250, 'Test Langer Tag', { time: '09:00' }),
    ] } }],
  ]);
  await page.reload();
  await ready(page);
  // after the reload the card first shows the week without TrainingPeaks and counts it once the plan is read: wait for it, never read it once
  await expect(root.locator('[data-wp-progress]')).toContainText('1 von');
  await expect(root.locator('[data-wp-progress]')).not.toHaveText(before);
  await shot(page, info, 'wochenplan-tp-stern');
  // the numbers page
  await page.goto('./#/flow/trainingsplan');
  await ready(page);
  const mp = page.locator('[data-meinplan]');
  await expect(mp.locator('[data-mp-tp]')).toContainText('TrainingPeaks');
  await expect(mp.locator('[data-mp-row="s:tp-a"]')).toContainText('TrainingPeaks');
  await shot(page, info, 'trainingsplan-tp');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});
