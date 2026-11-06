import { test } from '@playwright/test';
import { startE5, waitReady, OUT } from './e5lib.js';
import { sideways } from '../gesamttest/lib.js';
const LONG = 'Superkalifragilistischexpialigetischwiederholungsunterbrechungsmöglichkeit'.repeat(5);
test('repro neuland/dreams', async ({ page, context }, info) => {
  const errors = await startE5(page, context, info);
  const p = info.project.name;
  for (const hash of ['#/neuland', '#/trips/dreams']) {
    await page.goto(`./${hash}`); await page.reload(); await waitReady(page);
    const inputs = page.locator('main :is(input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]), textarea):visible');
    console.log(hash, 'inputs', await inputs.count(), await inputs.evaluateAll((els) => els.map((e) => `${e.tagName}/${e.type}/${e.getAttribute('aria-label') || e.placeholder || e.name}`)));
    for (let i = 0; i < await inputs.count(); i++) {
      await inputs.nth(i).fill(LONG).catch(() => {});
      const sw = await sideways(page);
      console.log(hash, 'after fill', i, sw.sw, sw.w, sw.wide.slice(0, 2));
    }
    await page.screenshot({ path: `${OUT}/shots/repro-${p}-${hash.replace(/\W+/g, '_')}-filled.png` });
  }
});
