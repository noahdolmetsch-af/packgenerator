// «Jetzt dran» (Noah 05.11.2026): a retired bike must not lead on Heute: no «Idee: … fahren», no care row, no
// weighing, no bike card. German UI, phone 390 and desktop 1440, fictional data (home0460-fixture.js; Friday 9 Oct 2026, 09:00).
// SHOTS=<folder> saves the screenshots.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import { openHome, homeFixture } from './home0460-fixture.js';

async function shot(page, info, loc, name) {
  if (!process.env.SHOTS) return;
  mkdirSync(process.env.SHOTS, { recursive: true });
  await loc.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}

test('AH1: a retired bike is not in «Jetzt dran» and not among the bike cards', async ({ page, context }, info) => {
  const d = homeFixture();
  // «Spark» is the bike the idea of the day names, «Factor» has an open repair («1 fällig» before the fix): both are retired
  for (const id of ['test_data_gtp_spark', 'test_data_gtp_factor']) {
    const b = d.tables.bikes.find((x) => x.id === id);
    b.retired = { at: '2026-10-08', reason: 'sold', note: '' };
    b.archived = true;
  }
  d.tables.maintenance = [{ id: 9001, task: 'test_data_gtp_ Bremsbelag', bikeId: 'test_data_gtp_factor', status: 'needed', area: 'Bike', category: 'Repair', source: 'Quick note', logDate: '2026-10-08', priority: 'medium', note: '', done: false }];
  await openHome(page, context, info, { data: d });
  const today = page.locator('[data-section="today"]');
  await expect(today).toBeVisible();
  await expect(today.locator('li[data-row="idea"]')).toBeVisible();
  await shot(page, info, today, 'AH1-jetzt-dran');
  // the idea names another bike; no care or weighing row and no bike card names a retired one
  for (const name of ['Spark', 'Factor']) {
    await expect(today.locator('li[data-row="idea"]')).not.toContainText(name);
    await expect(today).not.toContainText(name);
    await expect(page.locator('[data-section="bikes"]')).not.toContainText(name);
  }
});
