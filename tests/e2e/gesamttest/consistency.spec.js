// Gesamttest round 1, part 3: the same number in every place. With the big fictional data set:
// - things due per bike: Today ("Bikes ready?"), Bike care, the trip's Plan ("Before the trip") and
//   the count on the Bikes place in the bar,
// - open notes: the "More" button, the Inbox page and the stored notes,
// - inventory and wishlist: Today's Gear tile and the Gear page,
// - past trips: Today's Trips tile and the Past trips page.
import { test, expect } from '@playwright/test';
import { start, table, fixture, tr, esc } from './lib.js';

const T = tr('de');
const num = (s) => {
  const m = String(s ?? '').replace(/[’']/g, '').match(/\d+/);
  return m ? Number(m[0]) : 0;
};

test('due counts: Today, Plan, Bike care and the bar agree', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const { summary } = fixture();
  const bikes = await table(page, 'bikes');
  const nameOf = Object.fromEntries(bikes.map((b) => [b.id, b.name]));

  // Today: "Bikes ready?"
  await page.goto('./#/');
  await page.reload();
  const today = {};
  const rows = page.locator('ul.bikes li.br');
  await expect(rows.first()).toBeVisible();
  for (const row of await rows.all()) today[(await row.locator('.nm b').textContent()).trim()] = num(await row.locator('.lw').textContent());

  // Bike care
  await page.goto('./#/bikes?tab=care');
  await page.reload();
  const care = {};
  for (const id of summary.bikeIds) {
    const sec = page.locator(`section.acc[id="care-${id}"]`);
    await expect(sec).toBeVisible();
    care[nameOf[id]] = num(await sec.locator('.ah .r .badge').first().textContent());
  }
  expect(care, 'Bike care per bike = Today per bike').toEqual(today);

  // the bar: bikes with something due
  const due = Object.values(care).filter((n) => n > 0).length;
  const bar = page.locator('a[href="#/bikes"] .due').first();
  if (due) await expect(bar).toContainText(String(due));

  // Plan, "Before the trip": the bike's count (short day rides show none, on purpose)
  for (const tripId of [summary.tripIds.runningDay, summary.tripIds.event, summary.tripIds.day, summary.tripIds.tent]) {
    const trip = (await table(page, 'trips')).find((t) => t.id === tripId);
    await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), tripId);
    await page.goto('./#/pack');
    await page.reload();
    const line = page.locator('summary, button, a').filter({ hasText: T('Before the trip') }).first();
    await expect(line).toBeVisible();
    const text = (await line.textContent()).replace(/\s+/g, ' ');
    const m = text.match(new RegExp(`${esc(T('Bike care'))}[^·]*?(\\d+) ${esc(T('{n} due', { n: '' }).trim())}`)) ?? text.match(/Velopflege[^·]*?(\d+)\s*fällig/);
    const plan = m ? Number(m[1]) : /nichts fällig|nothing due/.test(text) ? 0 : null;
    // v0.25.0: a short ride (1 day, no event) shows no bike care list in the Plan (it stays in Bikes);
    // v0.45.1 (G013a): but when something is due, one quiet line with the same count and a link.
    const short = !(Number(trip.days) > 1) && !trip.event;
    const want = care[nameOf[trip.bikeId]];
    if (short && !want) expect.soft(text, `Plan of short ride ${trip.title} shows no bike care`).not.toMatch(/Velopflege|Bike care/);
    else expect.soft(plan, `Plan of ${trip.title}: "${text}" vs Bike care ${want}`).toBe(want);
    if (short && want) {
      await line.click();
      const link = page.locator('details[open] a.care-more').filter({ hasText: T('Bike care') }).first();
      await expect(link).toHaveAttribute('href', /#\/bikes\?.*tab=care/);
      await expect(page.locator('details[open] .in ul:not(.prep-rows) li')).toHaveCount(0);
    }
  }
  expect(errors).toEqual([]);
});

test('notes, gear and past trips: the same counts everywhere', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const notes = await table(page, 'notes');
  const open = notes.filter((n) => n.status === 'open').length;
  await page.goto('./#/');
  await page.reload();
  // "More, Inbox: n to sort"
  await expect(page.locator('.more-btn')).toHaveAttribute('aria-label', T('More, Inbox: {n} to sort', { n: open }));
  // Today: n notes to sort
  await expect(page.locator('main')).toContainText(T('{n} notes to sort', { n: open }).replace(/^\s+|\s+$/g, ''));

  // Gear tile on Today vs Gear
  const items = await table(page, 'items');
  const owned = items.filter((i) => i.ownership === 'owned' || i.ownership === 'unclear').length;
  const wish = items.filter((i) => i.ownership === 'wishlist' || i.ownership === 'to-buy').length;
  await expect(page.locator('main')).toContainText(String(owned));
  const pastLink = page.locator('main a, main button').filter({ hasText: new RegExp(`${esc(T('Past trips'))} \\(\\d+\\)`) }).first();
  const pastN = num(await pastLink.textContent());
  await page.goto('./#/gear');
  await page.reload();
  const tabs = page.locator('main');
  await expect(tabs).toContainText(String(owned));
  await expect(tabs).toContainText(String(wish));

  // Past trips page: as many rows as Today says
  await page.goto('./#/pack/past');
  await page.reload();
  const trips = await table(page, 'trips');
  const listed = await page.locator('main li a, main li button').filter({ hasText: 'test_data_gtp_' }).count();
  expect(listed, `Past trips page (${listed}) vs Today "(${pastN})"`).toBe(pastN);
  info.annotations.push({ type: 'past', description: `today ${pastN}, page ${listed}, stored past ${trips.filter((t) => t.startDate < new Date().toISOString().slice(0, 10)).length}` });

  // Inbox page
  await page.goto('./#/inbox');
  await page.reload();
  const inboxRows = await page.locator('main li').filter({ hasText: 'test_data_gtp_ note' }).count();
  expect(inboxRows, 'Inbox shows every open note').toBeGreaterThanOrEqual(open);
  expect(errors).toEqual([]);
});
