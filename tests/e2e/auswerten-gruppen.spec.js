// «Ganze App neu denken» Schritt 12 (Noah 18.11.2026): Auswerten has five tabs, sorted by the question you ask
// (before, «Aktiv und Auswerten» 2a: «Alle n» in three groups); the old pages are chips under the tabs and keep their addresses.
// Fictional data (home0460-fixture.js), German UI, nothing leaves the preview.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { TABS } from './placetab.js';
import { PLACE_TABS } from '../../src/lib/nav.js';

const noSideScroll = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test('AG-1 Auswerten has three tabs (Heute, Woche, Verlauf), the other pages are chips under them', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info);
  await page.goto('./#/auswerten');
  const tabs = page.locator(TABS).first();
  const all = PLACE_TABS.analysis;
  expect(all).toHaveLength(3); // «Auswerten neu» (Noah 24.11.2026 «2a»): Heute, Woche, Verlauf
  // all tabs stand side by side, on the phone too, and there is no «Alle n»
  for (const x of all) await expect(tabs.locator(`a[href="${x.href}"]`)).toHaveCount(1);
  if (info.project.name === 'phone') await expect(page.locator('nav.ptabs .pmore')).toHaveCount(0);
  const chips = page.locator('nav.psubs');
  await expect(chips.locator('a')).toHaveCount(3); // Heute: Heute, Fragen, Übersicht («Auswerten neu», Noah 24.11.2026)
  await expect(chips.locator('a[data-sub="heute"]')).toHaveAttribute('aria-current', 'page');
  await page.goto('./#/auswerten/uebersicht');
  await expect(chips.locator('a[data-sub="start"]')).toHaveAttribute('aria-current', 'page');
  await page.screenshot({ path: info.outputPath('ag-ueberblick.png') });
  // every old page opens at its old address and lights its chip (and the tab with it)
  for (const [hash, sub] of [['#/auswerten/fragen', 'fragen'], ['#/flow/form', 'form'], ['#/me/weight', 'weight'], ['#/me/insights', 'insights'], ['#/trips/rides', 'rides'], ['#/heatmap', 'heatmap'], ['#/neuland', 'neuland'], ['#/flow/gipfelbuch', 'gipfel'], ['#/jahr', 'year'], ['#/gelernt', 'learned'], ['#/flow/milestones', 'milestones'], ['#/flow/challenges', 'challenges'], ['#/me/abfragen', 'history'], ['#/me/wohl', 'wohl'], ['#/flow/ideen', 'ideen']]) {
    await page.goto(`./${hash}`);
    await expect(chips.locator(`a[data-sub="${sub}"]`), hash).toHaveAttribute('aria-current', 'page');
  }
  await page.goto('./#/trips/rides');
  await expect(chips.locator('a')).toHaveCount(10); // Woche: Woche, Fahrten, Haken, Gelernt, Meilensteine, Challenges, Heatmap, Neuland, Gipfelbuch, Jahr
  await expect(chips.locator('a')).toHaveText([/./, /./, /./, /Erkenntnisse/, /Meilensteine/, /Challenges/, /Heatmap/, /Neuland/, /Gipfel/, /Jahr/]);
  await page.goto('./#/auswerten/verlauf');
  await expect(chips.locator('a')).toHaveCount(9); // Verlauf: Verlauf, Form, Körperwerte, Erkenntnisse, Gewicht, Wi gaht's, Was mir gut tut, Ideen, Eigenes Diagramm
  await expect(chips.locator('a[data-sub="verlauf"]')).toHaveAttribute('aria-current', 'page');
  await noSideScroll(page);
  expect(errors).toEqual([]);
});
