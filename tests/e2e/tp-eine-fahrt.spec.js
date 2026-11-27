// One ride fulfils one session (Noah 27.11.2026): two bike sessions on one day, one ride of 28 minutes at 09:14. Only the session
// that fits (the start time) shows as done; the other stays open. Made-up sessions and ride, German, phone + desktop, clock fixed
// (Friday 27 Nov 2026). FAHRT_SHOTS=<dir> saves screenshots.
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';

const SHOTS = process.env.FAHRT_SHOTS || '';
const S = (id, over) => ({ id, day: '2026-11-27', kind: 'bike', name: id, mins: 60, zone: null, src: 'tp', ...over });

async function seed(page, plan, acts) {
  await page.evaluate(
    ([p, a]) =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const tx = r.result.transaction(['settings', 'activities'], 'readwrite');
          tx.objectStore('settings').put({ key: 'training.plan', value: { sessions: p } });
          for (const x of a) tx.objectStore('activities').put(x);
          tx.oncomplete = () => (r.result.close(), ok());
        };
      }),
    [plan, acts],
  );
}

test('Training: one ride ticks only the session that fits, the other stays open', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date('2026-11-27T18:00:00+01:00'));
  await page.goto('./#/flow/training');
  await ready(page);
  await seed(
    page,
    [S('Bike: Beispiel Zwift', { mins: 60, time: '09:14', name: 'Bike: Beispiel Zwift' }), S('MTB: Beispiel Basemiles', { mins: 130, name: 'MTB: Beispiel Basemiles' }), S('Bike: Beispiel Samstag', { day: '2026-11-28', mins: 64, name: 'Bike: Beispiel Samstag' })],
    [{ id: 'z1', day: '2026-11-27', time: '09:14', kind: 'bike', type: 'VirtualRide', name: 'Beispiel Zwift', movingS: 1687, elapsedS: 1700, km: 15.9 }],
  );
  await page.reload();
  await ready(page);
  const zwift = page.locator('[data-planned="Bike: Beispiel Zwift"]');
  const long = page.locator('[data-planned="MTB: Beispiel Basemiles"]');
  await expect(zwift).toHaveClass(/ok/);
  await expect(long).not.toHaveClass(/ok/);
  await expect(page.locator('[data-planned="Bike: Beispiel Samstag"]')).not.toHaveClass(/ok/);
  if (SHOTS) {
    const vp = page.viewportSize();
    for (const h of info.project.name === 'desktop' ? [900, 800] : [vp.height]) {
      await page.setViewportSize({ width: vp.width, height: h });
      await page.evaluate(() => document.querySelector('[data-week-range]').scrollIntoView({ block: 'start' }));
      await page.evaluate(() => document.querySelector('[data-day="2026-11-27"]')?.scrollIntoView({ block: 'center' }));
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${SHOTS}/nachher-${vp.width}x${h}.png` });
    }
    await page.setViewportSize(vp);
  }
  expect(errors).toEqual([]);
});
