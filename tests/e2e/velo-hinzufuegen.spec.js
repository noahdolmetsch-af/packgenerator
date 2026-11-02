// «Velo hinzufügen» (Noah 1.11.2026 «4a»), German UI, empty app: from Care the form opens and Care is where you land afterwards.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

test('Add bike from Care opens the form and comes back to Care', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/bikes?tab=care');
  await page.getByRole('button', { name: T('Add bike') }).or(page.getByRole('link', { name: T('Add bike') })).first().click();
  const dlg = page.locator('dialog[open]');
  await expect(dlg).toBeVisible();
  await dlg.getByLabel(T('Name'), { exact: true }).fill('Testvelo');
  await dlg.getByRole('button', { name: T('Add'), exact: true }).click();
  await expect(page).toHaveURL(/tab=care/);
});
