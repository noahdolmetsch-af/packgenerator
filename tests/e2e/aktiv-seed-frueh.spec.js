// «UI-Test Flow» Fund 4 (Noah 17.11.2026 «c»): the walk (seed 2) is written with the first start of Aktiv, not on the first
// tap on «Meditation»: the number of goals stays the same when the sheet opens. Fictional data only.
import { test, expect } from '@playwright/test';
import { flowSeeded } from './wall-fixture.js';
import { D0 } from './aktiv-fixture.js';

const acts = (page) =>
  page.evaluate(
    () =>
      new Promise((res) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction('flowActs').objectStore('flowActs').getAll();
          q.onsuccess = () => {
            r.result.close();
            res(q.result.map((a) => a.id).sort());
          };
        };
      }),
  );

test('SF-1 the walk is there after the first start of Aktiv; tapping Meditation adds nothing', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/flow');
  await flowSeeded(page);
  await expect.poll(() => acts(page).then((l) => l.includes('walk'))).toBe(true);
  const before = await acts(page);
  await page.locator('main button.tile', { hasText: 'Meditation' }).first().click();
  await expect(page.getByRole('dialog').first()).toBeVisible();
  expect(await acts(page)).toEqual(before);
});
