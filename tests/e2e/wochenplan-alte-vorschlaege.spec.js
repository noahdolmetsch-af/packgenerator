// Noah 24.11.2026 «5a»: the older «Woche vorschlagen» left sessions in the week that count beside the weekly plan; the weekly plan says so
// and takes them out with one tap, with Undo. Own and TrainingPeaks sessions stay. German, phone + desktop, fictional data only,
// clock fixed (Wednesday 2 Dec 2026, Europe/Zurich).
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
const ids = (page) =>
  page.evaluate(() => new Promise((ok) => { const r = indexedDB.open('pack-generator'); r.onsuccess = () => { const g = r.result.transaction('settings').objectStore('settings').get('training.plan'); g.onsuccess = () => { r.result.close(); ok((g.result?.value?.sessions ?? []).map((s) => s.id).sort()); }; }; }));
const ses = (id, day, o = {}) => ({ id, day, kind: 'bike', name: 'Test', mins: 60, zone: 2, ...o });

test('Wochenplan: old suggestions still in the week are taken out in one tap, Undo brings them back', async ({ page, context }) => {
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
  await expect(root.locator('[data-wp-oldsug]')).toHaveCount(0);
  await seed(page, [['settings', { key: 'training.plan', value: { sessions: [
    ses('s1', '2026-12-03', { src: 'sug' }), ses('s2', '2026-12-04', { src: 'sug' }), ses('s0', '2026-12-01', { src: 'sug' }),
    ses('own', '2026-12-05'), ses('tp1', '2026-12-04', { src: 'tp', time: '07:30' }), ses('pl', '2026-12-06', { src: 'tpl:ultra' }),
  ] } }]]);
  await page.reload();
  await ready(page);
  const line = root.locator('[data-wp-oldsug]');
  await expect(line).toContainText('2 alte Vorschläge aus «Woche vorschlagen» liegen noch in deiner Woche.');
  await line.locator('[data-wp-oldsug-go]').click();
  await expect(root.locator('[data-wp-oldsug]')).toHaveCount(0);
  await expect(root.locator('[data-wp-msg]')).toContainText('2 alte Vorschläge entfernt');
  expect(await ids(page)).toEqual(['own', 'pl', 's0', 'tp1']); // the one of yesterday, own, TrainingPeaks and the plan stay
  await root.locator('[data-wp-undo]').click();
  await expect(root.locator('[data-wp-oldsug]')).toHaveCount(1);
  expect(await ids(page)).toEqual(['own', 'pl', 's0', 's1', 's2', 'tp1']);
  expect(errors).toEqual([]);
});
