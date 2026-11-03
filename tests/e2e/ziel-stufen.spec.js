// «Drei Ziel-Stufen» (Noah 02.11.2026 «2a»): three sentences per race (dream, good, least) written in
// Vorbereiten and kept. Made-up sample race.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('Race: the three goals are written in Prepare and kept after a reload', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.goto('./#/race');
  await page.locator('[data-race-sample-open]').click();
  await expect(page.locator('[data-race-sample]')).toBeVisible();
  await page.locator('[data-race-tab="prepare"]').click();
  const box = page.locator('[data-race-box="prep-tiers"]');
  await box.scrollIntoViewIfNeeded();
  await expect(box.locator('[data-race-tier]')).toHaveCount(3);
  const v = box.locator('[data-race-tier="vision"]');
  await v.fill('test_data_gtp_ Traumtag');
  await v.press('Tab');
  await box.locator('[data-race-tier="least"]').fill('test_data_gtp_ Checkpoint zwei');
  await box.locator('[data-race-tier="least"]').press('Tab');
  // the save is asynchronous: wait until it is in the database before the reload
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise((resolve) => {
            const req = indexedDB.open('pack-generator');
            req.onerror = () => resolve(null);
            req.onsuccess = () => {
              const g = req.result.transaction('settings').objectStore('settings').get('races');
              g.onsuccess = () => resolve(g.result?.value?.races?.['race-sample']?.tiers ?? null);
              g.onerror = () => resolve(null);
            };
          }),
      ),
    )
    .toMatchObject({ vision: 'test_data_gtp_ Traumtag', least: 'test_data_gtp_ Checkpoint zwei' });
  await page.reload();
  await page.locator('[data-race-tab="prepare"]').click();
  await expect(page.locator('[data-race-tier="vision"]')).toHaveValue('test_data_gtp_ Traumtag');
  await expect(page.locator('[data-race-tier="least"]')).toHaveValue('test_data_gtp_ Checkpoint zwei');
  await expect(page.locator('[data-race-tier="super"]')).toHaveValue('');
});
