import { test } from '@playwright/test';
import { startE5, waitReady, OUT } from './e5lib.js';
const TAG = process.env.TAG || 'before';
test('shot allhere', async ({ page, context }, info) => {
  await startE5(page, context, info);
  await page.goto('./#/flow'); await page.reload(); await waitReady(page);
  await page.locator('[data-all-here-edit]').click();
  await page.locator('[data-all-here]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/shots/pr1-${TAG}-${info.project.name}.png` });
});
