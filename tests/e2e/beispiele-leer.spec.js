// «Beispiele auf leeren Seiten» (Noah 1.11.2026), German UI, empty app: Care, Equipment and My setup show a marked example, and it is gone with a bike.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

test('empty Care, Equipment and My setup show the example; a bike removes it', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  for (const tab of ['care', 'compare', 'rig']) {
    await page.goto(`./#/bikes?tab=${tab}`);
    const ex = page.locator('[data-example]');
    await expect(ex).toHaveCount(1);
    await expect(ex).toContainText(T('Example'));
    await expect(ex).toContainText(T('Made-up values. Your own show here once you add a bike.'));
  }
  await page.goto('./#/bikes?tab=care');
  await expect(page.locator('main')).not.toContainText(T('nothing due'));
  await page.getByRole('button', { name: T('Add bike') }).or(page.getByRole('link', { name: T('Add bike') })).first().click();
  const dlg = page.locator('dialog[open]');
  await dlg.getByLabel(T('Name'), { exact: true }).fill('Testvelo');
  await dlg.getByRole('button', { name: T('Add'), exact: true }).click();
  await expect(page.locator('[data-example]')).toHaveCount(0);
});
