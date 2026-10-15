// Gesamttest round 1, part 3: the same number in every place. With the big fictional data set:
// - things due per bike: Today (the bike cards "N due" and the rows of "Important today"; v0.46.0
//   replaced "Bikes ready?"), Bike care, the trip's Plan ("Before the trip") and the count on the
//   Bikes place in the bar,
// - open notes: the "More" button, Today's "N notes to sort", the Inbox page and the stored notes,
// - inventory and wishlist: Today's "Your data" and "Weigh" counts and the Gear page (v0.46.0 has no
//   Gear tile any more),
// - trips: Today's "Last 12 months" and the Review page; open debriefs on Past trips and Debrief
//   (v0.46.0 has no Trips tile with "Past trips (n)" any more).
import { test, expect } from '@playwright/test';
import { start, table, fixture, tr, esc, openData } from './lib.js';

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

  // Today (v0.46.0): one card per bike, "12'800 km · 5 due" when something is due
  await page.goto('./#/');
  await page.reload();
  const today = {};
  const cards = page.locator('[data-section="bikes"] a.bk[data-bike]');
  await expect(cards).toHaveCount(summary.bikeIds.length);
  const dueWord = esc(T('{n} due', { n: '' }).trim());
  for (const card of await cards.all()) {
    const id = await card.getAttribute('data-bike');
    const line = (await card.locator('.ln').textContent()).trim();
    const m = line.match(new RegExp(`(\\d+) ${dueWord}$`));
    today[nameOf[id]] = (await card.getAttribute('data-tone')) === 'due' && m ? Number(m[1]) : 0;
  }
  // … and "Important today" names each bike with something due (the same number, or one job
  // "lube the chain" / "top up the sealant" with its own button)
  const more = page.locator('[data-section="today"] button.more');
  if ((await more.count()) && (await more.getAttribute('aria-expanded')) === 'false') await more.click();
  const careRows = page.locator('[data-section="today"] li[data-row="care"]');
  const fromRows = {};
  for (const row of await careRows.all()) {
    const text = (await row.locator('.tx').textContent()).trim();
    const name = Object.values(nameOf).find((n) => text.startsWith(`${n}:`));
    expect(name, `Important today row "${text}" names a bike`).toBeTruthy();
    const m = text.slice(name.length).match(/(\d+)/);
    fromRows[name] = m ? Number(m[1]) : 1;
  }
  expect(fromRows, 'Important today = the bike cards (bikes with something due)').toEqual(Object.fromEntries(Object.entries(today).filter(([, n]) => n > 0)));

  // Bike care (v0.105.0 Design-Refresh P7, V6/V7: the overview lists the bikes as rows; each bike's
  // care page carries its section with the count)
  const care = {};
  for (const id of summary.bikeIds) {
    await page.goto(`./#/bikes?tab=care&bike=${id}`);
    await page.reload();
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
  // "Me, Inbox: n to sort" (v0.76.0: «Ich» took the place of «More»)
  await expect(page.locator('a.me')).toHaveAttribute('aria-label', T('Me, Inbox: {n} to sort', { n: open }));
  // Today, "Important today": n notes to sort (v0.46.0: a row, maybe below "Show all")
  // The rows of "Important today" arrive one source after the other, so "Show all" can appear after the
  // first look: open it whenever it is there and closed, until the inbox row shows.
  const more = page.locator('[data-section="today"] button.more');
  const inboxRow = page.locator('[data-section="today"] li[data-row="inbox"] .tx');
  await expect(async () => {
    if ((await more.count()) && (await more.getAttribute('aria-expanded')) === 'false') await more.click();
    await expect(inboxRow).toHaveText(T('{n} notes to sort', { n: open }).trim(), { timeout: 1000 });
  }).toPass({ timeout: 15000 });

  // Today's "Your data" and "Weigh" (what waits to be weighed) vs the stored data and the Gear page
  const items = await table(page, 'items');
  const trips = await table(page, 'trips');
  const owned = items.filter((i) => i.ownership === 'owned' || i.ownership === 'unclear').length;
  const wish = items.filter((i) => i.ownership === 'wishlist' || i.ownership === 'to-buy').length;
  // v0.94.0 «Kachel-Wand»: «Weigh» is a small tile on Today's wall, «Data and backup» lives under Me
  const weighToday = num(await page.locator('.wall [data-fn="weigh"] .bd').textContent());
  const data = await openData(page);
  await expect(data.locator('.csum')).toContainText(T('{n} items', { n: items.length }));
  await expect(data.locator('.csum')).toContainText(T('{n} trips', { n: trips.length }));
  await page.goto('./#/gear');
  await page.reload();
  // v0.47.2: the views carry the counts; what waits for the scale is on "Record weights" in •••
  const views = page.getByRole('group', { name: T('Views') });
  await expect(views.locator('[data-view="all"] small')).toHaveText(String(owned));
  await expect(views.locator('[data-view="wish"] small')).toHaveText(String(wish));
  await page.getByLabel(T('More for Gear')).click();
  const weighGear = num(await page.locator('.gmenu button').filter({ hasText: T('Record weights') }).locator('.badge').textContent());
  expect(weighToday, `Today "Weigh" (${weighToday}) vs Gear "Record weights" (${weighGear})`).toBe(weighGear);

  // Today's "Last 12 months" vs the Rückblick page (v0.49.0 R1: #/review leads to its part «Letzte 12 Monate»)
  await page.goto('./#/');
  await page.reload();
  const year = page.locator('[data-year-row] dl > div');
  await expect(year.first()).toBeVisible();
  const yTrips = num(await year.nth(0).locator('dd').textContent());
  const yKm = num((await year.nth(1).locator('dd').textContent()).replace(/[’'\s]/g, ''));
  await page.goto('./#/review');
  await page.reload();
  const per = page.locator('main section.period');
  await expect(per).toBeVisible();
  // SN2 «Seiten neu» answer 2b: the long table under «Alle Kennzahlen» is open as before
  await expect(per.getByRole('button', { name: T('All figures') })).toHaveAttribute('aria-expanded', 'true');
  const rvVal = async (label) => num((await per.getByRole('row').filter({ has: page.getByRole('rowheader', { name: label, exact: true }) }).locator('td').first().textContent()).replace(/[’'\s]/g, ''));
  expect(await rvVal(T('Trips')), 'Today "Last 12 months" trips = Rückblick').toBe(yTrips);
  expect(await rvVal(T('Distance')), 'Today "Last 12 months" km = Rückblick').toBe(yKm);

  // Past trips: the open debriefs there = the open debriefs on the Rückblick page
  // (SN2/SN4 «Seiten neu»: each is a «Bewerten» button, in its row there and on top of the Rückblick)
  const rateName = new RegExp(`^${esc(T('Rate|debrief'))}: `);
  await page.goto('./#/pack/past');
  await page.reload();
  await expect(page.locator('main table.tt a').filter({ hasText: 'test_data_gtp_' }).first()).toBeVisible();
  // the Rückblick lists every open debrief, Vergangene Touren those of its period: show all years
  await page.getByRole('group', { name: T('Period') }).getByRole('button', { name: T('All|period') }).click();
  const openPast = await page.locator('main table.tt').getByRole('link', { name: rateName }).count();
  await page.goto('./#/debrief');
  await page.reload();
  const openOf = () => page.locator('main [data-open-debrief]').getByRole('link', { name: rateName }).count();
  await expect.poll(openOf, { message: `Past trips (${openPast} open) vs Rückblick` }).toBe(openPast);
  info.annotations.push({ type: 'past', description: `year ${yTrips} trips ${yKm} km, ${openPast} open debriefs, weigh ${weighToday}` });

  // Inbox page
  await page.goto('./#/inbox');
  await page.reload();
  const inboxRows = await page.locator('main li').filter({ hasText: 'test_data_gtp_ note' }).count();
  expect(inboxRows, 'Inbox shows every open note').toBeGreaterThanOrEqual(open);
  expect(errors).toEqual([]);
});
