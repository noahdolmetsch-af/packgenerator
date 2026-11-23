// «Heute-Zeile» (Noah 23.11.2026, Thread «Zusammenhänge nützlicher machen»): the strongest lever of Zusammenhänge as one line in the tile
// «Heute-Check» on Heute; a tap opens the page. Fictional data only: 30 days of Fitbit sleep and the battery of «Wi gaht's?» (more sleep,
// fuller battery). The clock stands on 9 October 2026 (home0460-fixture).
import { test, expect } from './clock.js';
import { openHome, homeFixture, tr, D0 } from './home0460-fixture.js';
import { lastDays } from '../../src/lib/erkenntnisse.js';
import { put } from './aktiv-fixture.js';

const T = tr('de');

test('Heute: the strongest lever stands as one line in the check tile and leads to the page', async ({ page, context }, info) => {
  const d = homeFixture();
  const days = lastDays(D0, 30);
  const healthDays = days.map((date, i) => ({ date, sleep: { asleepMin: 360 + (i % 3) * 60 }, restingHr: 50, src: 'test' }));
  const abAnswers = days.map((day, i) => ({ id: `test_data_gtp_ab_${i}`, qid: 'erholung.akku', area: 'erholung', day, at: `${day}T07:10`, slot: `${day}T07:00`, kind: 'scale', value: 4 + (i % 3) * 2, note: null, unit: null, src: 'hand' }));
  d.tables.settings.push({ key: 'abfragen', value: { since: '2026-10-08T19:00', q: {}, own: [] } });
  await openHome(page, context, info, { data: d });
  await put(page, { healthDays, abAnswers });
  await page.locator('[data-ab-today]').click();
  const tile = page.locator('[data-section="heutecheck"]');
  await expect(tile).toBeVisible();
  const line = tile.locator('[data-hc-lever]');
  await expect(line).toContainText(T('Try it today: go to bed earlier.'));
  await line.click();
  await expect(page).toHaveURL(/#\/me\/insights$/);
});
