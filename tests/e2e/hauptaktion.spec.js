// Versteckte Funktionen (Noah 22.10.2026 «1a 2a 3a 4a 5a»): the rule «Hauptaktion nie im •••». The step a
// person came for is a visible button, «…» only holds the rest: «Erledigt» in every Velopflege row, «Tour
// beenden …» and «Notfall» on Unterwegs (sn-a.spec.js), «Notfall» on the live map (live.spec.js).
// German, fictional v0.77.0 data only.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { v0770File } from './v0770-fixture.js';
import { openData, settle } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

test('Velopflege: every due row shows «Erledigt» (or its own start) without opening «…»', async ({ page, context }, info) => {
  const file = v0770File(info);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await page.goto('./#/bikes?tab=care');
  const rows = page.locator('section[aria-labelledby="due-h"] li.dcard');
  await expect(rows.first()).toBeVisible();
  // the inspection is started and a look is a look: those rows keep their own visible step
  const own = [T('Done|task'), T('Start the inspection'), T('Look|check')];
  const n = await rows.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    const row = rows.nth(i);
    const names = await row.locator('.rowacts > .btn:not(.dots)').evaluateAll((els) => els.filter((e) => e.offsetParent).map((e) => e.textContent.trim()));
    expect(names.some((x) => own.some((o) => x.startsWith(o))), `row ${i}: ${names.join(' | ')}`).toBe(true);
  }
  expect(errors).toEqual([]);
});
