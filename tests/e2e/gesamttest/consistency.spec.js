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
  const data = page.locator('details.data');
  await data.locator('summary').click();
  await expect(data.locator('.csum')).toContainText(T('{n} items', { n: items.length }));
  await expect(data.locator('.csum')).toContainText(T('{n} trips', { n: trips.length }));
  const weighToday = num(await page.locator('[data-section="actions"] .grid [data-fn="weigh"] .badge').textContent());
  await page.goto('./#/gear');
  await page.reload();
  const tabs = page.locator('main [role="tablist"] [role="tab"]');
  await expect(tabs.nth(0).locator('small')).toHaveText(String(owned));
  await expect(tabs.nth(1).locator('small')).toHaveText(String(wish));
  const weighGear = num(await tabs.nth(3).locator('small').textContent());
  expect(weighToday, `Today "Weigh" (${weighToday}) vs Gear "Weigh" tab (${weighGear})`).toBe(weighGear);

  // Today's "Last 12 months" vs the Review page: the same number of trips and km
  await page.goto('./#/');
  await page.reload();
  const year = page.locator('[data-year-row] dl > div');
  await expect(year.first()).toBeVisible();
  const yTrips = num(await year.nth(0).locator('dd').textContent());
  const yKm = num((await year.nth(1).locator('dd').textContent()).replace(/[’'\s]/g, ''));
  await page.goto('./#/review');
  await page.reload();
  const rv = page.locator('main li.r');
  await expect(rv.first()).toBeVisible();
  const rvVal = async (label) => num((await rv.filter({ has: page.locator('.k', { hasText: new RegExp(`^${esc(label)}$`) }) }).first().locator('.v').textContent()).replace(/[’'\s]/g, ''));
  expect(await rvVal(T('trips|count')), 'Today "Last 12 months" trips = Review').toBe(yTrips);
  expect(await rvVal(T('Distance')), 'Today "Last 12 months" km = Review').toBe(yKm);

  // Past trips: the open debriefs on the page = "n open" on Debrief
  await page.goto('./#/pack/past');
  await page.reload();
  await expect(page.locator('main li a').filter({ hasText: 'test_data_gtp_' }).first()).toBeVisible();
  // the rows with an open (or started) debrief: the badge with a dot ("Trips compared" has a plain one)
  const openPast = await page.locator('main li a .nbadge .udot').count();
  await page.goto('./#/debrief');
  await page.reload();
  // v0.47.0: read the line once the live data is in (it can show an earlier count for a moment)
  let sub = '';
  await expect
    .poll(async () => {
      sub = (await page.locator('main .page-sub').first().textContent()) ?? '';
      const om = sub.match(new RegExp(`(\\d+) ${esc(T('{n} open', { n: '' }).trim())}`));
      return om ? Number(om[1]) : 0;
    }, { message: `Past trips (${openPast} open) vs Debrief` })
    .toBe(openPast);
  info.annotations.push({ type: 'past', description: `year ${yTrips} trips ${yKm} km, ${openPast} open debriefs, weigh ${weighToday}` });

  // Inbox page
  await page.goto('./#/inbox');
  await page.reload();
  const inboxRows = await page.locator('main li').filter({ hasText: 'test_data_gtp_ note' }).count();
  expect(inboxRows, 'Inbox shows every open note').toBeGreaterThanOrEqual(open);
  expect(errors).toEqual([]);
});
