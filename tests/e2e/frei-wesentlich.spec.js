// «Was mir wesentlich ist» (Noah 05.11.2026 «8b»): once a quarter a quiet line on Heute asks to look again, and the
// page shows «Then and now». German, phone 390 and computer 1440, fictional data only. The clock stands on
// Friday 9 October 2026 (home0460-fixture); SHOTS=<folder> saves screenshots.
import { test, expect } from './clock.js';
import { homeFixture, openHome, day } from './home0460-fixture.js';

const stored = (page, table, id) =>
  page.evaluate(([table, id]) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(table).objectStore(table).get(id);
      q.onsuccess = () => { r.result.close(); ok(q.result ?? null); };
    };
  }), [table, id]);
async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
}
const ess = (id, ago, text) => ({ id, kind: 'essential', day: day(-ago), at: `${day(-ago)}T08:00:00.000Z`, text });
const data = (last = 100) => {
  const d = homeFixture();
  d.tables.frei = [ess('test_data_gtp_e1', 190, 'Friends, long weekends and the bike'), ess('test_data_gtp_e2', last, 'Quiet mornings, friends and the bike, less rushing')];
  return d;
};

test('after a quarter Heute asks to look again, Later waits, the page shows then and now', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  const line = page.locator('[data-ess-due]');
  await expect(line).toContainText('Seit 3 Monaten');
  await shot(page, info, 'wesentlich-1-heute');
  await line.locator('[data-ess-look]').click();
  await expect(page).toHaveURL(/#\/me\/frei\/wesentlich/);
  await expect(page.locator('[data-ess-page-due]')).toBeVisible();
  const cmp = page.locator('[data-ess-compare]');
  await expect(cmp.locator('[data-cmp-stayed]')).toContainText(/friends/i);
  await expect(cmp.locator('[data-cmp-added]')).toContainText('Quiet');
  await expect(cmp.locator('[data-cmp-dropped]')).toContainText('weekends');
  await shot(page, info, 'wesentlich-2-damals-heute');
  await page.goto('./#/');
  await page.locator('[data-ess-later]').click();
  await expect(page.locator('[data-ess-due]')).toHaveCount(0);
  expect((await stored(page, 'settings', 'frei')).value.essSnooze).toBe(day(14));
  expect(errors).toEqual([]);
});

test('the switch on the page turns the reminder off; a recent entry asks nothing', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/me/frei/wesentlich');
  await page.locator('[data-ess-remind]').uncheck();
  await expect(page.locator('[data-ess-remind-box]')).toContainText('Nichts fragt dich');
  await shot(page, info, 'wesentlich-3-aus');
  await page.goto('./#/');
  await expect(page.locator('[data-ess-due]')).toHaveCount(0);
  expect((await stored(page, 'settings', 'frei')).value.essRemind).toBe(false);
});

test('a recent entry asks nothing on Heute', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: data(10) });
  await expect(page.locator('[data-ess-due]')).toHaveCount(0);
});
