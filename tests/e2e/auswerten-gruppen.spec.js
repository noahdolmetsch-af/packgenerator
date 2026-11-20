// «Ganze App neu denken» Schritt 12 (Noah 18.11.2026): Auswerten has five tabs, sorted by the question you ask
// (before, «Aktiv und Auswerten» 2a: «Alle n» in three groups); the old pages are chips under the tabs and keep their addresses.
// Fictional data (home0460-fixture.js), German UI, nothing leaves the preview.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { TABS } from './placetab.js';
import { PLACE_TABS } from '../../src/lib/nav.js';

const noSideScroll = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test('AG-1 Auswerten has five tabs by question, the other pages are chips under them', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await page.goto('./#/auswerten');
  const tabs = page.locator(TABS).first();
  const all = PLACE_TABS.analysis;
  expect(all).toHaveLength(5);
  if (info.project.name === 'phone') {
    // a phone shows four tabs and «Alle 5» for the rest
    await expect(page.locator('nav.ptabs .pmore')).toContainText(T('All {n}|tabs', { n: 5 }));
    await page.locator('nav.ptabs .pmore').click();
    await expect(page.locator('dialog.ptsheet [data-all-pages] a[data-page-tile]')).toHaveCount(5);
    await page.locator('dialog.ptsheet').getByRole('button', { name: T('Close') }).click();
  } else {
    for (const x of all) await expect(tabs.locator(`a[href="${x.href}"]`)).toHaveCount(1);
  }
  const chips = page.locator('nav.psubs');
  await expect(chips.locator('a')).toHaveCount(2); // Überblick: Fragen, Übersicht
  await expect(chips.locator('a[data-sub="start"]')).toHaveAttribute('aria-current', 'page');
  await page.screenshot({ path: info.outputPath('ag-ueberblick.png') });
  // every old page opens at its old address and lights its chip (and the tab with it)
  for (const [hash, sub] of [['#/auswerten/fragen', 'fragen'], ['#/flow/form', 'form'], ['#/me/weight', 'weight'], ['#/me/insights', 'insights'], ['#/trips/rides', 'rides'], ['#/heatmap', 'heatmap'], ['#/neuland', 'neuland'], ['#/flow/gipfelbuch', 'gipfel'], ['#/jahr', 'year'], ['#/gelernt', 'learned'], ['#/me/abfragen', 'history'], ['#/me/wohl', 'wohl'], ['#/flow/impulse', 'impulse']]) {
    await page.goto(`./${hash}`);
    await expect(chips.locator(`a[data-sub="${sub}"]`), hash).toHaveAttribute('aria-current', 'page');
  }
  await page.goto('./#/trips/rides');
  await expect(chips.locator('a')).toHaveCount(8); // Fahrten: Fahrten, Haken, Meilensteine, Heatmap, Neuland, Gipfelbuch, Jahr, Gelernt
  await noSideScroll(page);
  expect(errors).toEqual([]);
});
