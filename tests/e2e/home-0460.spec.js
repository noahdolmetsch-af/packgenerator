// v0.46.0 «Startseite neu» (Noah 1a 2b 3a 4b 5a+menu 6-33a): the new Today page on a computer and a
// phone: the sections, test trips hidden and cleaned up with Undo, the colour worlds and dark mode, the
// command "wiegen", no sideways scroll at 320 and 390 px. Fictional fixture plus test_data_gtp_ records;
// the clock stands on Friday 9 October 2026, 09:00; Open-Meteo is mocked, nothing leaves the preview.
import { test, expect } from '@playwright/test';
import { D0, homeFixture, openHome, trip, entries } from './home0460-fixture.js';

const stored = (page, table, id) =>
  page.evaluate(([table, id]) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(table).objectStore(table).get(id);
      q.onsuccess = () => { r.result.close(); ok(q.result ?? null); };
    };
  }), [table, id]);

const noSideScroll = async (page, what) => {
  for (const w of [390, 320]) {
    const vp = page.viewportSize();
    await page.setViewportSize({ width: w, height: vp.height });
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(sw, `no sideways scroll at ${w} px: ${what}`).toBeLessThanOrEqual(w);
    await page.setViewportSize(vp);
  }
};

/** Is the element's top-to-bottom within the first screen (no scrolling)? */
const inFirstScreen = async (page, loc) => {
  const box = await loc.boundingBox();
  return !!box && box.y >= 0 && box.y + box.height <= page.viewportSize().height;
};

test('sections, greeting with the weather, the trip card, 12 or 8 buttons in the first screen', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  const phone = info.project.name === 'phone';

  await expect(page.locator('#hello-h')).toContainText(T('Good morning.'));
  await expect(page.locator('[data-weather]')).toHaveText(T('{t}° and dry until {h}:00.', { t: 14, h: 19 }));
  // the next trip is tomorrow's, not the test trip of today
  await expect(page.locator('#next-h')).toHaveText('test_data_gtp_ Herbstrunde');
  await expect(page.locator('[data-countdown]')).toHaveText(T('Tomorrow · {h} h to go', { h: 23 }));
  await expect(page.locator('.steps li')).not.toHaveCount(0);
  await expect(page.locator('.steps li.cur')).toHaveCount(1);
  await expect(page.locator('section.trip .btn.hi')).toHaveCount(1);

  const buttons = page.locator('[data-section="actions"] .grid > button');
  await expect(buttons).toHaveCount(phone ? 8 : 12);
  await expect(buttons.first()).toHaveAttribute('data-fn', 'dayride');
  await expect(buttons.last()).toHaveAttribute('data-fn', 'all');
  // a number only where something waits: the notes and the bike care, not on Day ride
  await expect(page.locator('[data-fn="dayride"] .badge')).toHaveCount(0);
  await expect(page.locator('[data-section="actions"] .grid [data-fn="care"] .badge')).toHaveText('1');

  // Noah 2b: greeting, trip card and the buttons without scrolling
  expect(await inFirstScreen(page, page.locator('#hello-h')), 'greeting in the first screen').toBe(true);
  expect(await inFirstScreen(page, page.locator('section.trip')), 'trip card in the first screen').toBe(true);
  // v0.51.0 (Noah, approved mockup ImFlow-Heute): «Im Flow» is the second card, right under the trip,
  // so the buttons now follow it (no longer all in the first screen); the flow card starts in it.
  expect(await inFirstScreen(page, page.locator('#fc-h')), 'Im Flow starts in the first screen').toBe(true);
  const order = await page.locator('[data-section="trip"], [data-section="flow"], [data-section="actions"]').evaluateAll((els) => els.map((e) => e.dataset.section));
  expect(order.filter((x, i, a) => a.indexOf(x) === i)).toEqual(['trip', 'flow', 'actions']);

  // Important today, Tried it yet?, bikes, 12 months, customise
  const imp = page.getByRole('region', { name: T('Important today') });
  await expect(imp.locator('li')).toHaveCount(3);
  await expect(imp).toContainText(T('{bike}: lube the chain', { bike: 'test_data_gtp_ Scale' }));
  await expect(page.getByRole('region', { name: T('Tried it yet?') })).toContainText(/\d+ von 16 Funktionen · Stufe \d|\d+ of 16 functions · Level \d/);
  await expect(page.locator('[data-section="bikes"] a.bk')).toHaveCount(4);
  await expect(page.locator('[data-section="bikes"] [data-bike="test_data_gtp_lux"]')).toContainText(T('+ log km'));
  await expect(page.locator('[data-year-row] .bars span')).toHaveCount(12);
  await expect(page.locator('[data-year-row]')).toContainText(T('{n} weeks in a row', { n: 3 }));
  await expect(page.getByRole('button', { name: T('Customise the start page') })).toBeVisible();
  if (!phone) await expect(page.locator('[data-suggestion]')).toContainText(T('Start day ride'));

  // the bike card opens the bike in Bikes → Care
  await expect(page.locator('[data-bike="test_data_gtp_spark"]')).toHaveAttribute('href', '#/bikes?tab=care&bike=test_data_gtp_spark&open=1');
  await noSideScroll(page, 'Today');
  expect(errors).toEqual([]);
});

test('lubed right on Today, with Undo; All 16 functions', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  const imp = page.getByRole('region', { name: T('Important today') });
  const row = imp.locator('li').filter({ hasText: T('{bike}: lube the chain', { bike: 'test_data_gtp_ Scale' }) });
  const lubed = row.getByRole('button', { name: T('Lubed ✓') });
  if (info.project.name === 'phone') expect((await lubed.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await lubed.click();
  await expect(imp.getByRole('status')).toContainText(T('{bike}: chain lubed.', { bike: 'test_data_gtp_ Scale' }));
  await expect(row).toHaveCount(0);
  expect((await stored(page, 'bikes', 'bike-test')).parts[0].history.at(-1)).toMatchObject({ date: D0, km: 2288, action: 'service' });
  await imp.getByRole('status').getByRole('button', { name: T('Undo') }).click();
  await expect(imp.locator('li').filter({ hasText: T('{bike}: lube the chain', { bike: 'test_data_gtp_ Scale' }) })).toHaveCount(1);
  expect((await stored(page, 'bikes', 'bike-test')).parts[0].history).toHaveLength(1);

  await page.locator('[data-section="actions"] [data-fn="all"]').click();
  const sheet = page.getByRole('dialog', { name: T('All {n} functions', { n: 16 }) });
  await expect(sheet.locator('.fnrow')).toHaveCount(16);
  await sheet.locator('[data-fn="review"]').click();
  await expect(page).toHaveURL(/#\/review$/);
  // the tap counts: Look back moves to the front of the rest
  await page.goto('./#/');
  // (care was tapped once too, by "Lubed"; with the same count the list order decides)
  await expect(page.locator('[data-section="actions"] .grid > button').nth(5)).toHaveAttribute('data-fn', 'review');
});

test('test trips: hidden as next trip, cleaned up after a question on the page, Undo', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await expect(page.locator('#next-h')).not.toHaveText(/TEST/);
  const imp = page.getByRole('region', { name: T('Important today') });
  await imp.locator('button.more').click();
  const row = imp.locator('li[data-row="tests"]');
  await expect(row).toContainText(T('Clean up {n} test trip', { n: 1 }));
  page.on('dialog', () => {
    throw new Error('no browser question');
  });
  await row.getByRole('button', { name: T('Clean up') }).click();
  await expect(row).toContainText(T('Archive {n} test trip? It stays in your data, Today leaves it out.', { n: 1 }));
  await row.getByRole('button', { name: T('Archive') }).click();
  await expect(imp.getByRole('status')).toContainText(T('{n} test trip archived.', { n: 1 }));
  await expect(imp.locator('li[data-row="tests"]')).toHaveCount(0);
  const archived = await stored(page, 'trips', 'test_data_gtp_TEST-Runde');
  expect(archived).toMatchObject({ skipped: true, title: 'test_data_gtp_ TEST-Runde' });
  expect(archived.archivedAt).toBeTruthy();
  await imp.getByRole('status').getByRole('button', { name: T('Undo') }).click();
  await expect(imp.locator('li[data-row="tests"]')).toHaveCount(1);
  const back = await stored(page, 'trips', 'test_data_gtp_TEST-Runde');
  expect(back.archivedAt).toBeUndefined();
  expect(back.skipped).toBeUndefined();
});

test('colour worlds and dark mode in More; every choice stays', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-palette', 'gletscher');
  await expect(html).toHaveAttribute('data-theme', 'light');
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(await bg()).toBe('rgb(238, 242, 244)');

  await page.getByRole('button', { name: /^(More|Mehr)/ }).click();
  const more = page.getByRole('dialog', { name: T('More') });
  await more.getByRole('group', { name: T('Colours') }).getByRole('button', { name: T('Sandstone|palette') }).click();
  await expect(html).toHaveAttribute('data-palette', 'sandstein');
  expect(await bg()).toBe('rgb(244, 239, 230)');
  await more.getByRole('group', { name: T('Light or dark') }).getByRole('button', { name: T('Dark|theme') }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  expect(await bg()).toBe('rgb(23, 19, 16)');
  await page.reload();
  await expect(html).toHaveAttribute('data-palette', 'sandstein');
  await expect(html).toHaveAttribute('data-theme', 'dark');
  // System follows the device
  await page.emulateMedia({ colorScheme: 'light' });
  await page.getByRole('button', { name: /^(More|Mehr)/ }).click();
  await page.getByRole('dialog', { name: T('More') }).getByRole('group', { name: T('Light or dark') }).getByRole('button', { name: T('System|theme') }).click();
  await expect(html).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(html).toHaveAttribute('data-theme', 'dark');
  // Today itself, with the More sheet closed again
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: T('More') })).toBeHidden();
  await noSideScroll(page, 'Today in the dark');
});

test('the command line: wiegen opens weighing, kette geoelt spark saves with Undo', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  if (info.project.name === 'phone') await page.getByRole('button', { name: /Search everything|Alles durchsuchen/ }).click();
  const field = page.getByRole('searchbox', { name: T('What do you want to do? Search or say an action') });
  await field.fill('kette geölt spark');
  await expect(page.locator('[data-cmd="chain"]')).toContainText(T('{bike}: chain lubed', { bike: 'test_data_gtp_ Spark' }));
  await field.press('Enter');
  await expect(page.locator('.search .done')).toContainText(T('{bike}: chain lubed.', { bike: 'test_data_gtp_ Spark' }));
  expect((await stored(page, 'bikes', 'test_data_gtp_spark')).parts[0].history).toHaveLength(2);
  await page.locator('.search .done').getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await stored(page, 'bikes', 'test_data_gtp_spark')).parts[0].history.length).toBe(1);

  await field.fill('wiegen');
  await expect(page.locator('[data-cmd="weigh"]')).toBeVisible();
  await field.press('Enter');
  await expect(page).toHaveURL(/#\/gear\?tab=weigh$/);
});

test('the evening: review of the day and charging first; a phone swipes to the next trip', async ({ page, context }, info) => {
  const data = homeFixture();
  const herbst = data.tables.trips[0];
  herbst.entries.push({ itemId: 'test_data_gtp_lamp', slot: 'top', qty: 1, packed: false });
  data.tables.items.push({ id: 'test_data_gtp_lamp', name: 'test_data_gtp_ Front light', category: 'light', weightG: 90, qty: 1, weightStatus: 'measured', carry: 'bike', defaultBag: null, ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'] });
  data.tables.trips.push(trip('Abendrunde', D0, { entries: entries(3, 3), createdAt: `${D0}T06:00:00.000Z` }));
  const T = await openHome(page, context, info, { data, hour: 19 });
  await expect(page.locator('#hello-h')).toContainText(T('Good evening.'));
  const rows = page.getByRole('region', { name: T('Important today') }).locator('li');
  await expect(rows.nth(0)).toContainText(T('Review today: {trip}', { trip: 'test_data_gtp_ Abendrunde' }));
  // the fixture packs a few devices already (lamp, GPS …): the count is whatever needs charging
  await expect(rows.nth(1)).toContainText(/(Akkus laden: \d+ Geräte? für|Charge batteries: \d+ devices? for) test_data_gtp_ Herbstrunde/);

  // the card shows the trip of today first; "1 / 3 ›" (and a swipe on a phone) goes to the next
  const title = page.locator('#next-h');
  const first = await title.textContent();
  if (info.project.name === 'phone') {
    const box = await page.locator('section.trip').boundingBox();
    await page.locator('section.trip').evaluate((el, b) => {
      const ev = (type, x) => new PointerEvent(type, { bubbles: true, pointerType: 'touch', clientX: x, clientY: b.y + 30, isPrimary: true });
      el.dispatchEvent(ev('pointerdown', b.x + b.width - 30));
      el.dispatchEvent(ev('pointerup', b.x + 30));
    }, box);
  } else {
    await page.locator('section.trip .pos').click();
  }
  await expect(title).not.toHaveText(first);
});

// v0.46.2 (Noah, phone): «Startseite anpassen» showed the section names as one letter per line, because the
// label used the class name "sw" which app.css reserves for the 10 px colour swatch. Each name must be
// readable on one line, wide enough, and next to its checkbox.
test('customise the start page: every section name readable, not squeezed into a 10 px column', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await page.getByRole('button', { name: T('Customise the start page') }).click();
  const panel = page.locator('section.cust');
  await expect(panel).toBeVisible();
  const rows = panel.locator('li');
  expect(await rows.count()).toBeGreaterThanOrEqual(4);
  for (const li of await rows.all()) {
    const name = li.locator('label span');
    await expect(name).not.toHaveText('');
    const box = await name.boundingBox();
    expect(box.width, `${await name.textContent()} is wide enough`).toBeGreaterThan(30);
    expect(box.height, `${await name.textContent()} on one or two lines`).toBeLessThan(60);
  }
  await noSideScroll(page, 'Customise the start page');
});
