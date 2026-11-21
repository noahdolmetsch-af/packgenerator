// Noah 04.11.2026 «2a» (thread «Bereinigen: Doppeltes und Fehler auf Heute»): «Heute laut Plan» in «Diese Woche» shows only what
// is still open; what is done stands in «Aktiv heute» and in the day lines. Fictional data (home0460-fixture.js), clock on
// Friday 9 October 2026.
import { test, expect } from './clock.js';
import { openHome, homeFixture, day } from './home0460-fixture.js';

const withItems = (items, noTrips = false) => {
  const data = homeFixture();
  if (noTrips) data.tables.trips = []; // the fixture's test trip is an open entry of today
  data.tables.settings.push({ key: 'week.items', value: items });
  return data;
};

test('Heute laut Plan: done entries are gone, the open ones stay', async ({ page, context }, info) => {
  await openHome(page, context, info, {
    data: withItems([
      { id: 'test_data_gtp_d1', kind: 'date', title: 'test_data_gtp_ Zahnarzt', day: day(0), time: '07:45' },
      { id: 'test_data_gtp_t1', kind: 'todo', title: 'test_data_gtp_ Schlauch bestellen', day: day(0), done: true },
      { id: 'test_data_gtp_t3', kind: 'todo', title: 'test_data_gtp_ Reifen kaufen', day: day(0) },
    ]),
  });
  const card = page.locator('[data-section="week"]');
  await card.scrollIntoViewIfNeeded();
  const plan = card.locator('[data-today-plan]');
  await expect(plan.locator('[data-entry="test_data_gtp_d1"]')).toHaveCount(1);
  await expect(plan.locator('[data-entry="test_data_gtp_t3"]')).toHaveCount(1);
  await expect(plan.locator('[data-entry="test_data_gtp_t1"]')).toHaveCount(0);
  await expect(plan.locator('.done')).toHaveCount(0);
  if (process.env.SHOTS) await card.screenshot({ path: `${process.env.SHOTS}/doppelt2-plan-${info.project.name === 'phone' ? 390 : 1440}.png` });
});

test('Heute laut Plan: when everything is done it says so', async ({ page, context }, info) => {
  await openHome(page, context, info, {
    data: withItems([{ id: 'test_data_gtp_t1', kind: 'todo', title: 'test_data_gtp_ Schlauch bestellen', day: day(0), done: true }], true),
  });
  const card = page.locator('[data-section="week"]');
  await card.scrollIntoViewIfNeeded();
  const plan = card.locator('[data-today-plan]');
  await expect(plan.locator('[data-entry]')).toHaveCount(0);
  await expect(plan).toContainText(/Alles aus dem Plan von heute ist erledigt|Everything in today's plan is done/);
});
