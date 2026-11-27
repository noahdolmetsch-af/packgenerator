// «Abhaken» auf Heute (Noah 22.11.2026 «ja», Thread «Training erfassen vereinfachen»): since «Aktiv» sits under Woche › Training, a chip
// «Abhaken» under the greeting of Heute leads in one tap to «Heute abhaken» (#/flow). Fictional data only; the clock stands on
// Tuesday 10 November 2026, 09:00 in Europe/Zurich; German UI, phone + desktop. SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const SHOTS = process.env.SHOTS || '';

async function open(page, context, info) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date('2026-11-10T09:00:00+01:00'));
  await page.goto('./#/');
  await ready(page);
  return errors;
}
async function shot(page, info, name) {
  if (!SHOTS) return;
  const w = info.project.name === 'phone' ? 390 : 1440;
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${SHOTS}/${name}-${w}.png`, clip: { x: 0, y: 0, width: w, height: 420 } });
}

// Noah 27.11.2026 «2a»: the chip stands only where the block «Heute abhaken» does not (a fresh device has none; with activities the block does, see heute-haken-block.spec.js)
test('Heute has the chip «Abhaken» next to «Heute fahren» while the block is not there; one tap opens «Heute abhaken»', async ({ page, context }, info) => {
  const errors = await open(page, context, info);
  const chips = page.locator('[data-goals]');
  const chip = chips.locator('[data-goal="tick"]');
  await expect(chip).toBeVisible();
  await expect(chip).toHaveText(T('Tick off|goal'));
  await expect(chips.locator('[data-goal="ride"]')).toBeVisible(); // nothing fell away
  await shot(page, info, 'heute-abhaken');
  await chip.click();
  await expect(page).toHaveURL(/#\/flow\/?$/);
  await expect(page.locator('section[aria-labelledby="tick-h"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the chip can be switched off like the others (Heute anpassen)', async ({ page, context }, info) => {
  const errors = await open(page, context, info);
  await page.evaluate(
    () =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const tx = r.result.transaction('settings', 'readwrite');
          tx.objectStore('settings').put({ key: 'homeGoals', value: { order: ['count', 'ride', 'tick', 'trip', 'care', 'week', 'diary'], off: ['trip', 'care', 'week', 'diary', 'tick'] } });
          tx.oncomplete = () => (r.result.close(), ok());
        };
      }),
  );
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-goals] [data-goal="ride"]')).toBeVisible();
  await expect(page.locator('[data-goals] [data-goal="tick"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
