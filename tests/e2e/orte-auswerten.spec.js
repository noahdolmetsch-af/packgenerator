// «Aktiv und Auswerten» 3a (Noah 03.11.2026): Heatmap, Neuland, Gelernt and Jahr are pages of Auswerten now (the addresses
// stay); Touren › Rückblick keeps its buttons (tests/aktiv-bereich.test.js reads them). German UI, no data needed.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto(`./${hash}`);
  await ready(page);
}

const PAGES = [
  { key: 'heatmap', href: '#/heatmap' },
  { key: 'neuland', href: '#/neuland' },
  { key: 'gelernt', href: '#/gelernt' },
];

test('OA-1 «Alle n» of Auswerten lists the four pages, and Heatmap opens inside Auswerten', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'a computer lists the tabs in the sidebar');
  await open(page, context, '#/auswerten');
  await page.locator('nav.ptabs .pmore').click();
  const dlg = page.locator('dialog.ptsheet');
  for (const href of ['#/heatmap', '#/neuland', '#/gelernt', '#/jahr']) await expect(dlg.locator(`[data-all-pages] a[href="${href}"]`)).toHaveCount(1);
  await dlg.locator('[data-all-pages] a[href="#/heatmap"]').click();
  await expect(page).toHaveURL(/#\/heatmap$/);
  await expect(page.locator('main[data-s2-place="analysis"]')).toHaveCount(1);
  await expect(page.locator('.pcrumbs')).toContainText(T('Analysis|place'));
  await expect(page.locator('h1[data-page-title]')).toHaveText(T('Heatmap'));
});

for (const p of PAGES) {
  test(`OA-2 ${p.key}: the address stays and the page stands in Auswerten`, async ({ page, context }) => {
    await open(page, context, p.href);
    await expect(page).toHaveURL(new RegExp(`${p.href}$`));
    await expect(page.locator('main[data-s2-place="analysis"]')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  });
}
