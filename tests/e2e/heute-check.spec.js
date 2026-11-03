// «Heute-Check» (Noah 30.10.2026 «1-5a», Thread «Tagescheck optimieren»): the tile on Heute always leads to the questionnaire
// (also with nothing open); the page has the three ways: Heute, Was zusammenpasst, Alle Antworten.
import { test, expect } from './clock.js';
import { openHome, homeFixture } from './home0460-fixture.js';

test('Heute-Check: Kachel führt zum Fragebogen, die Analysen sind einen Tipp entfernt', async ({ page, context }, info) => {
  const d = homeFixture();
  d.tables.settings.push({ key: 'abfragen', value: { since: '2026-10-08T19:00', q: {}, own: [] } });
  await openHome(page, context, info, { data: d });
  // the round's window comes first (modal); «Not today» puts it away, the tile stays
  await page.locator('[data-ab-today]').click();
  const tile = page.locator('[data-section="heutecheck"]');
  await expect(tile).toBeVisible();
  await expect(tile.locator('[data-hc-count]')).toBeVisible();
  await tile.locator('[data-hc-open]').click();
  await expect(page).toHaveURL(/#\/check\/morning$/);
  const tabs = page.locator('[data-check-tabs]');
  await expect(tabs).toBeVisible();
  // step 2: «Was zusammenpasst» is a tab of the daily check itself, with the way back to the questionnaire
  await tabs.locator('[data-tab-insights]').click();
  await expect(page).toHaveURL(/#\/check\/insights$/);
  await expect(page.locator('[data-check="insights"] [data-check-tabs]')).toBeVisible();
  // step 3: «Alle Antworten» is a tab of the daily check too
  await page.locator('[data-check-tabs] a').nth(2).click();
  await expect(page).toHaveURL(/#\/check\/history$/);
  await expect(page.locator('[data-check="history"] [data-check-tabs]')).toBeVisible();
  await page.locator('[data-check-tabs] a').first().click();
  await expect(page).toHaveURL(/#\/check\/morning$/);
});
