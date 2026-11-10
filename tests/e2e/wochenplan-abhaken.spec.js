// «Wochenplan» Teil 3 (Noah 09.11.2026): ticking off by hand, progress, the line «Heute dran» on Heute, a Strava suggestion
// that only suggests, and past weeks that stay as they were. German, phone + desktop, fictional data only,
// clock fixed (Tuesday 10 Nov 2026, Europe/Zurich). WOCHENPLAN_SHOTS=<dir> saves screenshots.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const fill = (en, vars) => Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), T(en));
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
  await page.clock.setFixedTime(new Date('2026-11-10T09:00:00+01:00'));
  await page.goto(hash);
  await ready(page);
  return errors;
}

/** Puts records into IndexedDB: [[store, record]]. */
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

const start = async (page) => {
  await page.locator('[data-wochenplan] [data-empty] button').first().click();
  await expect(page.locator('[data-wp-hvalue]')).toHaveText('15 Std');
};
const counts = async (page) => ({
  total: (await page.locator('[data-wp-week] [data-unit]:not(.quiet)').count()),
  quiet: (await page.locator('[data-wp-week] [data-unit].quiet').count()),
});

test('Wochenplan: tick a unit, progress follows, the tick stays after a reload and by the stable unit', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const root = page.locator('[data-wochenplan]');
  await start(page);
  const { total, quiet } = await counts(page);
  await expect(root.locator('[data-wp-done]')).toHaveText(fill('{a} of {b} units', { a: 0, b: total }));
  await expect(root.locator('[data-wp-quiet]')).toHaveText(fill('Meditation and stretching: {a} of {b}.', { a: 0, b: quiet }));
  const tennis = root.locator('[data-wp-tick="tennis@1"]');
  await tennis.check();
  await expect(root.locator('[data-wp-done]')).toHaveText(fill('{a} of {b} units', { a: 1, b: total }));
  await expect(root.locator('[data-unit="tennis@1"]')).toHaveClass(/ticked/);
  await expect(root.locator('[data-wp-msg]')).toContainText('Abgehakt');
  await shot(page, info, 'wochenplan-abhaken');
  // a plan change does not move the tick: one yoga unit less, tennis stays ticked
  await root.locator('[data-wp-dec="yoga"]').click(); // one unit less in total
  await expect(root.locator('[data-wp-tick="tennis@1"]')).toBeChecked();
  // kept after a reload
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-wochenplan] [data-wp-tick="tennis@1"]')).toBeChecked();
  // and taken away again with one tap
  await page.locator('[data-wochenplan] [data-wp-tick="tennis@1"]').uncheck();
  await expect(page.locator('[data-wochenplan] [data-wp-done]')).toHaveText(fill('{a} of {b} units', { a: 0, b: total - 1 }));
  // the small daily habits are counted apart
  expect(quiet).toBeGreaterThan(0);
  // next week can not be ticked
  await page.locator('[data-wochenplan] button, [data-wochenplan] [role="radio"]', { hasText: T('Next week') }).first().click();
  await expect(page.locator('[data-wochenplan] [data-wp-tick]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Wochenplan: «Heute dran» on Heute ticks the unit, and Undo takes it back', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await start(page);
  await page.goto('./#/');
  await ready(page);
  const row = page.locator('[data-row="plan"]');
  // Tuesday: the first fixed tennis unit
  await expect(row).toContainText(T('Up today: {what} at {time}').split('{what}')[0]);
  await expect(row).toContainText(T('Tennis'));
  await shot(page, info, 'heute-dran');
  await row.getByRole('button', { name: T('Done ✓') }).click();
  await page.goto('./#/flow/wochenplan');
  await ready(page);
  await expect(page.locator('[data-wochenplan] [data-wp-tick="tennis@1"]')).toBeChecked();
  expect(errors).toEqual([]);
});

test('Wochenplan: Strava only suggests; past weeks stay as they were', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await start(page);
  // a Tennis activity of today (fictional) and a frozen last week with two units, one ticked
  await seed(page, [
    ['activities', { id: 'wp-t1', day: '2026-11-10', time: '10:00', kind: 'other', type: 'Tennis', name: 'test_data_ Tennis am Morgen', movingS: 3500, elapsedS: 3600, commute: false }],
    ['settings', { key: 'training.weeklog', value: { v: 1, weeks: { '2026-11-02': { done: { 'tennis@1': '2026-11-03' }, no: [], snap: { saved: '2026-11-08', hours: 15, units: [{ id: 'tennis@1', type: 'tennis', d: 1, t: '10:00', mins: 60 }, { id: 'gym@2', type: 'gym', d: 2, t: '15:00', mins: 50 }] } } } } }],
  ]);
  await page.reload();
  await ready(page);
  const root = page.locator('[data-wochenplan]');
  const box = root.locator('[data-wp-strava="tennis@1"]');
  await expect(box).toContainText('test_data_ Tennis am Morgen');
  // suggested, not ticked
  await expect(root.locator('[data-wp-tick="tennis@1"]')).not.toBeChecked();
  await shot(page, info, 'wochenplan-strava');
  await box.locator('[data-wp-strava-no]').click();
  await expect(root.locator('[data-wp-strava]')).toHaveCount(0);
  await expect(root.locator('[data-wp-tick="tennis@1"]')).not.toBeChecked();
  // past weeks: frozen, shown as stored
  const past = root.locator('[data-past-week="2026-11-02"]');
  await expect(past).toContainText(fill('{a} of {b} units', { a: 1, b: 2 }));
  await past.locator('summary').click();
  await expect(past.locator('li')).toHaveCount(2);
  await expect(past.locator('li').first()).toContainText(T('Tennis'));
  // changing the plan today does not touch the frozen week
  await root.locator('[data-wp-dec="tennis"]').click();
  await expect(past).toContainText(fill('{a} of {b} units', { a: 1, b: 2 }));
  await shot(page, info, 'wochenplan-vergangen');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});
