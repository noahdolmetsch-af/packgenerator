// «Schon lange nicht» (Noah 01.11.2026 «2a und b»): under «Aktiv heute» a card for a sport that waits longer than its rhythm,
// «Später» hides it, «Pause» pauses the sport (Undo), and the sport page sets the days or switches it off. Fictional ticks
// only. SHOTS=<folder> saves pictures.
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

test('Not for a while: two cards, later, pause with undo, own days on the sport page', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await expect(page.locator('[data-section="acts"]')).toBeVisible();
  await expect(page.locator('[data-nudges]')).toHaveCount(0);
  await tickOn(page, [['yoga', '2026-09-20'], ['yoga', '2026-09-25'], ['tennis', '2026-09-15'], ['tennis', '2026-09-22'], ['run', '2026-10-08'], ['run', '2026-10-07']]);
  await page.reload();
  const box = page.locator('[data-nudges]');
  await expect(box.getByRole('heading', { name: T('Not for a while') })).toBeVisible();
  await expect(box.locator('[data-nudge]')).toHaveCount(2); // run was ticked yesterday: no card
  await expect(box.locator('[data-nudge]').first()).toHaveAttribute('data-nudge', 'tennis'); // 17 days, the longest
  await shot(page, info, 'schon-lange-nicht-heute', page.locator('[data-section="acts"]'));

  // later: the card is gone
  await box.locator('[data-nudge="tennis"] [data-nudge-later]').click();
  await expect(box.locator('[data-nudge="tennis"]')).toHaveCount(0);
  // pause: the sport pauses, undo brings it back
  await box.locator('[data-nudge="yoga"] [data-nudge-pause]').click();
  await expect(page.locator('[data-nudges]')).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).first().click().catch(() => {});

  // the sport page: own days, then off
  await page.goto('./#/flow/sport/act%3Atennis');
  const set = page.locator('[data-nudge-setting]');
  await expect(set).toBeVisible();
  const before = await set.locator('[data-nudge-days]').innerText();
  await set.getByRole('button', { name: T('One day more') }).click();
  await expect(set.locator('[data-nudge-days]')).not.toHaveText(before);
  await expect(set.locator('[data-nudge-auto]')).toBeVisible();
  await shot(page, info, 'schon-lange-nicht-sportart', set);
  await set.locator('[data-nudge-off]').click();
  await expect(set.locator('[data-nudge-on]')).toBeVisible();
  expect(errors).toEqual([]);
});
