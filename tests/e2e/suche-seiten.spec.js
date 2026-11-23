// «Die Suche findet Seiten» (thread «Navigation ohne Sackgassen», Noah 23.11.2026 «ja»): a tab or chip of the map is found by its name,
// the row says where it is, a tap opens it. German UI, an empty app.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

test('the search finds «Erholung» under Woche › Training and opens it', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/');
  await ready(page);
  const glass = page.getByRole('button', { name: T('Search everything') });
  if (await glass.first().isVisible()) await glass.first().click();
  const field = page.locator('input[type=search]:visible').first();
  await field.fill('Erholung');
  const row = page.locator('li button:visible', { hasText: `${T('Plan|place')} › ${T('Training|tab')}` }).first();
  await expect(row).toBeVisible();
  await expect(row).toContainText(T('Recovery|tab'));
  await row.click();
  await expect(page).toHaveURL(/#\/flow\/rest$/);
});
