// «TSS vom Gerät in Form, Trainingseffekt in der Fahrtenliste» (Noah 28.10.2026 «1a»): a fictional FIT ride
// without a Strava twin, German, phone + desktop. The list of saved rides shows its training effect and TSS,
// and Körperwerte › Aktivität › Belastung counts its TSS on its day.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const DAY = addDays(TODAY, -1);
const ride = {
  id: 'test_data_fittss_ride', name: 'test_data_fittss Runde', file: 'runde.fit', date: DAY, startAt: `${DAY}T06:00:00Z`,
  km: 62.4, gainM: 540, lossM: 540, totalH: 2.6, pauseH: 0.2, movingH: 2.4, pauses: [], parts: { climb: { km: 0, gainM: 0, h: 0 }, flat: { km: 0, h: 0 } },
  line: [], profile: [], sensors: null, start: { lat: 47.1, lon: 8.1 }, end: { lat: 47.1, lon: 8.1 },
  source: 'fit', device: { np: 210, ifac: 0.82, tss: 118, te: 3.4, teAn: 1.2 },
};

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  await put(page, { rides: [ride] });
  return errors;
}
const go = async (page, hash) => {
  await page.goto(`./${hash}`);
  await page.reload();
  await ready(page);
};

test('FIT ride: training effect in the list, its TSS counts as load', async ({ page, context }) => {
  const errors = await open(page, context);
  await go(page, '#/debrief/ride');
  const row = page.locator(`[data-ride="${ride.id}"]`);
  await expect(row).toContainText(T('Training effect {a}').replace('{a}', ''));
  await expect(row).toContainText(/3[.,]4 \/ 1[.,]2/);
  await expect(row).toContainText('TSS 118');

  await go(page, '#/flow/stats/load');
  await expect(page.locator(`[data-body-day="${DAY}"]`)).toContainText('118');
  const w = page.viewportSize().width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  expect(errors).toEqual([]);
});
