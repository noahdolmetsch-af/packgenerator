// «Aktiv und Auswerten» 2a (Noah 03.11.2026 «2a»): «Alle n» of Auswerten stands in three groups by question.
// Fictional data (home0460-fixture.js), German UI. A computer lists the pages in the sidebar, so phone only.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { PLACE_TABS } from '../../src/lib/nav.js';

const noSideScroll = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test('AG-1 All n of Auswerten shows its pages in three groups by question', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'a computer lists the tabs in the sidebar');
  const T = await openHome(page, context, info);
  await page.goto('./#/auswerten');
  const more = page.locator('nav.ptabs .pmore');
  await expect(more).toBeVisible();
  await more.click();
  const dlg = page.locator('dialog.ptsheet');
  await expect(dlg.locator('h2')).toHaveText(T('All pages in {place}', { place: T('Analysis|place') }));
  const heads = dlg.locator('[data-pt-group]');
  await expect(heads).toHaveText([T('How am I doing?|group'), T('What did I do?|group'), T('What did I learn?|group')]);
  await expect(dlg.locator('[data-all-pages] a[data-page-tile]')).toHaveCount(PLACE_TABS.analysis.length);
  await page.screenshot({ path: info.outputPath('ag-alle.png') });
  await noSideScroll(page);
});
