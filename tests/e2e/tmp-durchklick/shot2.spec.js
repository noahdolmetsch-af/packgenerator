import { test } from '@playwright/test';
import { startE5, waitReady, OUT } from './e5lib.js';
const TAG = process.env.TAG || 'before';
test('shot2', async ({ page, context }, info) => {
  await startE5(page, context, info);
  const P = info.project.name;
  await page.goto('./#/trips/dreams'); await page.reload(); await waitReady(page);
  await page.getByPlaceholder(/Furka/).fill('Wunderlangeswort'.repeat(5));
  await page.getByRole('button', { name: 'Hinzufügen', exact: true }).first().click();
  await page.waitForTimeout(500);
  await page.locator('p.ok[role=status]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/shots/pr2-${TAG}-dreams-${P}.png` });
  await page.goto('./#/neuland'); await page.reload(); await waitReady(page);
  await page.locator('input[type=search]').first().fill('Wunderlangeswort'.repeat(20));
  await page.waitForTimeout(400);
  await page.locator('p.none').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/shots/pr2-${TAG}-neuland-${P}.png` });
});
