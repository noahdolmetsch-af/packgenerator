// «Stundenziel mit TrainingPeaks» (Noah 23.11.2026 «2a und b», 24.11.2026 «2b»): in weeks with TrainingPeaks the weekly plan
// offers an own hours goal (a suggestion of five hours more, then plus/minus), and takes it back with «Wie das Ziel oben».
// German, phone + desktop, fictional data only, clock fixed (Wednesday 2 Dec 2026, Europe/Zurich).
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';

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
const tp = (id, day, mins, name) => ({ id, day, kind: 'bike', name, mins, zone: 2, src: 'tp', time: '07:30' });

test('Wochenplan: weeks with TrainingPeaks get an own hours goal, suggested, changed and taken back', async ({ page, context }) => {
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
  // without TrainingPeaks in the week there is no own goal to set
  await expect(root.locator('[data-wp-tpgoal]')).toHaveCount(0);
  await seed(page, [['settings', { key: 'training.plan', value: { sessions: [tp('tp-a', '2026-12-03', 120, 'Test Ausdauer'), tp('tp-b', '2026-12-05', 180, 'Test Langer Tag')] } }]]);
  await page.reload();
  await ready(page);
  const g = root.locator('[data-wp-tpgoal]');
  await expect(g).toBeVisible();
  await expect(g.locator('[data-wp-tpvalue]')).toHaveText('15 Std');
  await expect(g.locator('[data-wp-tpsame]')).toHaveCount(0);
  // one tap sets the suggestion: five hours more than the goal above
  await root.locator('[data-wp-tpsuggest]').click();
  await expect(g.locator('[data-wp-tpvalue]')).toHaveText('20 Std');
  await expect(root.locator('[data-wp-hvalue]')).toHaveText('15 Std'); // the goal above stays
  await g.locator('[data-wp-tpdec]').click();
  await expect(g.locator('[data-wp-tpvalue]')).toHaveText('19 Std');
  // it is kept after a reload
  await page.reload();
  await ready(page);
  await expect(root.locator('[data-wp-tpgoal] [data-wp-tpvalue]')).toHaveText('19 Std');
  // «Wie das Ziel oben» takes it back
  await root.locator('[data-wp-tpsame]').click();
  await expect(root.locator('[data-wp-tpvalue]')).toHaveText('15 Std');
  await expect(root.locator('[data-wp-tpsame]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
