// «Jetzt dran» (Noah 05.11.2026 «3a»): only the urgent rows (red, amber, blue) are «Up now» and counted; the calm hints
// (care outlook, weighing, unused parts, learning, tidy-up) wait in a folded line «Gut zu wissen · N» under it.
// German UI, phone and desktop, fictional data (home0460-fixture.js). SHOTS=<folder> saves the screenshots.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import { openHome } from './home0460-fixture.js';

test('JR1: calm hints are folded away from Up now and not counted', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  const today = page.locator('[data-section="today"]');
  await expect(today).toBeVisible();
  const imp = page.getByRole('region', { name: T('Up now') });
  const shot = async (name) => {
    if (!process.env.SHOTS) return;
    mkdirSync(process.env.SHOTS, { recursive: true });
    await today.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
  };
  const more = imp.locator('button.more');
  if (await more.isVisible()) await more.click();
  const up = imp.locator(':scope > ul > li');
  const calm = imp.locator('details[data-good] li');
  await shot('JR1-zu');
  // the counter counts the rows of «Up now» only
  await expect(imp.locator('.cnt')).toHaveText(String(await up.count()));
  // no calm row (grey circle) stands in the list of «Up now»
  await expect(imp.locator(':scope > ul > li.quiet')).toHaveCount(0);
  // the fold names how many hints wait, and is closed
  const fold = imp.locator('details[data-good]');
  await expect(fold).toBeVisible();
  const n = await calm.count();
  expect(n).toBeGreaterThan(0);
  await expect(fold.locator('summary')).toContainText(`${T('Good to know')} · ${n}`);
  await expect(fold).not.toHaveAttribute('open', '');
  // «Show all» does not add them to «Up now»
  await fold.locator('summary').click();
  await expect(calm.first()).toBeVisible();
  await expect(fold.locator('li.quiet')).toHaveCount(n);
  await shot('JR1-offen');
  await fold.locator('summary').click();
  await expect(calm.first()).toBeHidden();
});
