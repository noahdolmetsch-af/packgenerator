// «Packen in Schritten» (Warteliste 4; Noah 22.11.2026 «2a», «3a»): the list as steps, «Next: …» opens the next one, the arrows change the
// order, the view is kept. Fictional data (home0460 fixture), German.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { mkdirSync } from 'node:fs';

test('Packing list: Steps view with «Next», arrows and a remembered view', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 9 });
  await page.goto('./#/pack');
  const view = page.locator('[data-pack-view]');
  await expect(view).toBeVisible();
  await view.selectOption('steps');
  const heads = page.locator('.bag-group .bag-heading');
  await expect(heads.first()).toBeVisible();
  const names = await heads.locator('strong').allTextContents();
  expect(names.length).toBeGreaterThan(1);
  // only steps: every name is one of the step names
  const stepNames = ['Clothes', 'Sleeping', 'Food and water', 'Tech and charging', 'Bike and repair', 'Check'].map((n) => T(n));
  for (const n of names) expect(stepNames).toContain(n);
  // the first step opens; «Next: …» leads to the second
  await heads.first().click();
  const next = page.locator('[data-step-next]').first();
  await expect(next).toContainText(T('Next: {step}', { step: names[1] }));
  // Noah 24.11.2026 «a»: the two arrows that move a step stand at its heading (a row of their own beside the title), not under the items
  const firstGroup = page.locator('.bag-group').first();
  await expect(firstGroup.locator('.bag-head-row [data-step-up]')).toBeVisible();
  await expect(firstGroup.locator('.bag-head-row [data-step-down]')).toBeVisible();
  await expect(firstGroup.locator('[data-step-nav] [data-step-up]')).toHaveCount(0);
  if (process.env.SHOTS) {
    mkdirSync(process.env.SHOTS, { recursive: true });
    await heads.first().evaluate((el) => { el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -230); });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${process.env.SHOTS}/schritte-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await next.click();
  await expect(heads.nth(1)).toHaveAttribute('aria-expanded', 'true');
  // the arrow puts the second step first
  await page.locator('.bag-group').nth(1).locator('[data-step-up]').click();
  await expect(heads.first().locator('strong')).toHaveText(names[1]);
  // the view and the order are kept after a reload (the choice is saved in the settings: wait for the order before the reload, as below for the view)
  await expect.poll(() => page.evaluate(() => new Promise((ok) => { const r = indexedDB.open('pack-generator'); r.onsuccess = () => { const q = r.result.transaction('settings').objectStore('settings').get('pack.steps'); q.onsuccess = () => { r.result.close(); ok(q.result?.value?.order?.length ?? 0); }; }; }))).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator('[data-pack-view]')).toHaveValue('steps');
  await expect(page.locator('.bag-group .bag-heading').first().locator('strong')).toHaveText(names[1]);
  // «By bags» is the whole list as before
  await page.locator('[data-pack-view]').selectOption('bags');
  // the choice is saved in the settings; wait for it before the reload
  await expect.poll(() => page.evaluate(() => new Promise((ok) => { const r = indexedDB.open('pack-generator'); r.onsuccess = () => { const q = r.result.transaction('settings').objectStore('settings').get('pack.steps'); q.onsuccess = () => { r.result.close(); ok(q.result?.value?.view ?? null); }; }; }))).toBe('bags');
  await page.reload();
  await expect(page.locator('[data-pack-view]')).toHaveValue('bags');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});
