// «Letzte Woche: neue Sterne» (Noah 01.11.2026 «5a»): on Monday the tile «Aktiv heute» shows last week's stars; «Schliessen» hides the
// card until next Monday; on Wednesday it is gone. The clock stands in the afternoon: the morning questions do not open. Fictional ticks only. SHOTS=<folder> saves pictures.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

async function shot(page, info, name, at = null) {
  if (!process.env.SHOTS) return;
  if (at) await at.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}
async function tickOn(page, rows) {
  await page.evaluate(async (list) => {
    const db = await new Promise((r) => {
      const q = indexedDB.open('pack-generator');
      q.onsuccess = () => r(q.result);
    });
    const tx = db.transaction('flowLog', 'readwrite');
    const st = tx.objectStore('flowLog');
    list.forEach(([actId, day], i) => st.put({ id: `test_data_gtp_${actId}-${i}`, actId, day, n: 1 }));
    await new Promise((r) => (tx.oncomplete = r));
  }, rows);
}

test('Monday: last week stars in the active tile, close, gone on Wednesday', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  // five runs and five yoga ticks in the week 5 to 11 October: «Mal gemacht» reaches star 1 for both
  await tickOn(page, ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'].flatMap((d) => [['run', d], ['yoga', d]]));
  await expect(page.locator('[data-week-stars]')).toHaveCount(0); // Friday: not yet
  await page.clock.setFixedTime(new Date('2026-10-12T14:00:00+02:00'));
  await page.reload();
  const box = page.locator('[data-week-stars]');
  await expect(box).toBeVisible();
  const ask = page.locator('[data-ab-later]'); // the questions of a new day may open over the page: later
  if (await ask.isVisible()) await ask.click();
  await expect(box.getByRole('heading')).toContainText(T('Last week: {n} new stars', { n: '' }).split(':')[0]);
  await expect(box.locator('a')).not.toHaveCount(0);
  await expect(box.locator('[data-week-stars-saying]')).toBeVisible(); // start tone: funny
  await shot(page, info, 'wochen-sterne', page.locator('[data-section="acts"]'));
  await box.locator('[data-week-stars-close]').click();
  await expect(box).toHaveCount(0);
  await page.reload();
  await expect(page.locator('[data-week-stars]')).toHaveCount(0); // stays closed this week
  await page.clock.setFixedTime(new Date('2026-10-14T14:00:00+02:00'));
  await page.reload();
  await expect(page.locator('[data-week-stars]')).toHaveCount(0); // Wednesday
  expect(errors).toEqual([]);
});
