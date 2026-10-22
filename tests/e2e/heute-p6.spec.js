// P6 «Heute ergänzen» (Noah 21.10.2026 «2b»; mockups ME1, TR1, AB3, SN2l, T3, H1), German UI, phone 390 and
// desktop 1440, fictional data (home0460-fixture.js; Friday 9 October 2026, 09:00):
// P6-1 meditation on top (ME1), the weekly weight under it (SN2l), the ring (T3) and «Last activity» after it (TR1);
// P6-2 the weight is saved where Ich › Gewicht keeps it; «Not today» puts the card away until tomorrow;
// P6-3 after an update «New» stands on top as a whole row (H1) and can be taken away.
import { test, expect } from '@playwright/test';
import { openHome, homeFixture } from './home0460-fixture.js';
import { SEEN_KEY } from '../../src/lib/whatsnew.js';

const closeCheck = async (page) => {
  const ab = page.locator('[data-section="abfragen"]');
  if (await ab.isVisible().catch(() => false)) await ab.locator('[data-ab-later]').click();
};
const order = (page) => page.evaluate(() => [...document.querySelectorAll('.wall > [data-tile]')].map((x) => x.dataset.tile));

test.describe('P6 Heute erganzen', () => {
  test('P6-1: meditation and the weekly weight on top, the ring and the last activity', async ({ page, context }, info) => {
    const T = await openHome(page, context, info, { data: homeFixture() });
    await closeCheck(page);
    await expect(page.locator('[data-section="weighin"]')).toBeVisible();
    const o = await order(page);
    expect(o.slice(0, 2)).toEqual(['meditation', 'weighin']);
    for (const id of ['body', 'acts', 'balance', 'strava']) expect(o, id).toContain(id);
    expect(o.indexOf('strava')).toBeGreaterThan(o.indexOf('balance'));
    await expect(page.locator('[data-tile="meditation"]').getByText(T('Meditation')).first()).toBeVisible();
    await expect(page.locator('[data-tile="strava"]')).toBeVisible();
    await expect(page.locator('[data-section="balance"] svg').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  });

  test('P6-2: the weight goes to Ich Gewicht; Not today until tomorrow', async ({ page, context }, info) => {
    const T = await openHome(page, context, info, { data: homeFixture() });
    await closeCheck(page);
    const card = page.locator('[data-section="weighin"]');
    await expect(card.getByRole('heading', { name: T('Weight this week?') })).toBeVisible();
    await card.locator('[data-weigh-kg]').fill('71,5');
    await card.locator('[data-weigh-save]').click();
    await expect(card.locator('[data-weigh-saved]')).toContainText('71');
    await page.goto('./#/me/weight');
    await expect(page.getByText(/71[.,]5/).first()).toBeVisible();
    // a week without a weight again: «Not today» puts the card away
    await page.evaluate(async () => {
      const req = indexedDB.open('pack-generator');
      const db = await new Promise((r) => (req.onsuccess = () => r(req.result)));
      const tx = db.transaction('settings', 'readwrite');
      tx.objectStore('settings').delete('me.weight');
      await new Promise((r) => (tx.oncomplete = r));
      db.close();
    });
    await page.goto('./#/');
    await page.reload(); // a change straight in IndexedDB reaches the app only with a new load
    await closeCheck(page);
    await card.locator('[data-weigh-later]').click();
    await expect(card).toHaveCount(0);
  });

  test('P6-3: after an update New on top as a whole row', async ({ page, context }, info) => {
    const T = await openHome(page, context, info, { data: homeFixture() });
    await page.evaluate((k) => localStorage.setItem(k, '0.150.0'), SEEN_KEY);
    await page.reload();
    await closeCheck(page);
    const row = page.locator('[data-news-row]');
    await expect(row).toBeVisible();
    const top = await row.evaluate((el) => el.getBoundingClientRect().top);
    const wall = await page.locator('.wall').evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeLessThan(wall);
    await row.getByRole('button', { name: T('Take away|tile') }).click();
    await expect(row).toHaveCount(0);
  });
});
