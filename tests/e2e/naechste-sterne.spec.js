// «Deine nächsten Sterne» (Noah 01.11.2026 «1a», «alle vier Stellen»): in «Aktiv heute» on Heute the three stars that
// are closest, with a bar and «noch N»; a tap opens the sport, «Ausblenden» switches the block off, «Nächste Sterne
// zeigen» brings it back; the sport page says its next star in one line. Fictional ticks only. SHOTS=<folder> saves pictures.
import { test, expect } from './clock.js';
import { openHome, D0 } from './home0460-fixture.js';

async function shot(page, info, name, at = null) {
  if (!process.env.SHOTS) return;
  if (at) await at.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}
const dayBefore = (n) => {
  const d = new Date(`${D0}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};
/** Fictional ticks: tennis 9 times (next star at 10), yoga 8, running 4, climbing 1. */
async function tickSome(page) {
  await page.evaluate(async ([counts, days]) => {
    const db = await new Promise((r) => {
      const q = indexedDB.open('pack-generator');
      q.onsuccess = () => r(q.result);
    });
    const tx = db.transaction('flowLog', 'readwrite');
    const st = tx.objectStore('flowLog');
    Object.entries(counts).forEach(([actId, n]) => {
      for (let i = 0; i < n; i++) st.put({ id: `test_data_gtp_${actId}-${i}`, actId, day: days[i + 1], n: 1 });
    });
    await new Promise((r) => (tx.oncomplete = r));
  }, [{ tennis: 9, yoga: 8, run: 4, climb: 1 }, Array.from({ length: 30 }, (_, i) => dayBefore(i))]);
}

test('next stars on Today: three rows, a tap opens the sport, hide and show again', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  const acts = page.locator('[data-section="acts"]');
  await expect(acts).toBeVisible();
  // without ticks there is nothing started: no block
  await expect(page.locator('[data-next-stars]')).toHaveCount(0);
  await tickSome(page);
  await page.reload();
  const box = page.locator('[data-next-stars]');
  await expect(box).toBeVisible();
  await expect(box.getByRole('heading', { name: T('Your next stars') })).toBeVisible();
  await expect(box.locator('li')).toHaveCount(3);
  await expect(box.locator('li').first()).toContainText(T('{left} to go', { left: '1' }));
  await shot(page, info, 'naechste-sterne-heute', acts);

  // hide and show again
  await box.locator('[data-next-stars-hide]').click();
  await expect(page.locator('[data-next-stars]')).toHaveCount(0);
  await shot(page, info, 'naechste-sterne-vorher', acts);
  await page.locator('[data-next-stars-show]').click();
  await expect(page.locator('[data-next-stars]')).toBeVisible();

  // a tap opens the sport, which says its next star
  await box.locator('li a').first().click();
  await expect(page).toHaveURL(/#\/flow\/sport\//);
  await expect(page.locator('[data-ms-next]')).toBeVisible();
  await shot(page, info, 'naechste-sterne-sportart', page.locator('[data-milestone-slot]'));
  expect(errors).toEqual([]);
});
