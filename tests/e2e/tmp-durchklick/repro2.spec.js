import { test } from '@playwright/test';
import { startE5, waitReady, OUT } from './e5lib.js';
import { sideways } from '../gesamttest/lib.js';
const LONG = 'Superkalifragilistischexpialigetischwiederholungsunterbrechungsmöglichkeit'.repeat(5);
test('repro dreams', async ({ page, context }, info) => {
  await startE5(page, context, info);
  const p = info.project.name;
  await page.goto('./#/trips/dreams'); await page.reload(); await waitReady(page);
  const inputs = page.locator('main :is(input:not([type=hidden]), textarea):visible');
  await inputs.nth(0).fill(LONG);
  const btn = page.locator('main button:visible', { hasText: /Hinzufügen/ }).first();
  console.log('btn', await btn.count());
  await btn.click();
  for (const ms of [50, 300, 1200, 3000]) {
    await page.waitForTimeout(ms);
    const sw = await sideways(page);
    console.log('after', ms, sw.sw, sw.w, sw.wide.slice(0, 3));
  }
  await page.screenshot({ path: `${OUT}/shots/repro-dreams-${p}.png` });
  await page.reload(); await waitReady(page);
  const sw = await sideways(page);
  console.log('after reload', sw.sw, sw.w, sw.wide.slice(0, 3));
  await page.screenshot({ path: `${OUT}/shots/repro-dreams-reload-${p}.png` });
});
