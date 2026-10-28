// v0.46.0 «Startseite neu» (Noah 1a 2b 3a 4b 5a+menu 6-33a): the new Today page on a computer and a
// phone: the sections, test trips hidden and cleaned up with Undo, the colour worlds and dark mode, the
// command "wiegen", no sideways scroll at 320 and 390 px. Fictional fixture plus test_data_gtp_ records;
// the clock stands on Friday 9 October 2026, 09:00; Open-Meteo is mocked, nothing leaves the preview.
import { test, expect } from '@playwright/test';
import { READY } from '../../src/lib/home/tiles.js';
import { D0, homeFixture, openHome, trip, entries } from './home0460-fixture.js';
import { greetFor } from '../../src/lib/home/hallo.js';
import { WINDOWS_ON } from './settle.js';

// Heute's windows by the clock, as in the app (the other specs keep them quiet)
test.use({ storageState: WINDOWS_ON });

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

test('sections, greeting with the weather, the trip card, the 16 functions as small tiles', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  const phone = info.project.name === 'phone';

  await expect(page.locator('#hello-h')).toHaveText(greetFor(9, '')); // HG1: Swiss, by time of day (home/hallo.js)
  await expect(page.locator('[data-weather]')).toHaveText(T('{t}° and dry until {h}:00.', { t: 14, h: 19 }));
  // the next trip is tomorrow's, not the test trip of today
  await expect(page.locator('#next-h')).toHaveText('test_data_gtp_ Herbstrunde');
  await expect(page.locator('[data-countdown]')).toHaveText(T('Tomorrow · {h} h to go', { h: 23 }));
  await expect(page.locator('.steps li')).not.toHaveCount(0);
  await expect(page.locator('.steps li.cur')).toHaveCount(1);
  await expect(page.locator('section.trip .btn.hi')).toHaveCount(1);

  // v0.94.0 «Kachel-Wand» (Noah 3a, mockup A): the functions are small tiles on the ready wall;
  // «Heute neu» A (0.165.0, Noah «4a», changed on purpose): 8 chosen shortcuts, the others back through «+»
  const buttons = page.locator('.wall [data-fn]');
  const fns = READY.filter((x) => x.id.startsWith('fn:'));
  await expect(buttons).toHaveCount(fns.length);
  await expect(buttons.first()).toHaveAttribute('data-fn', fns[0].id.slice(3));
  // a number only where something waits: the open notes
  await expect(page.locator('.wall [data-fn="note"] .bd')).toHaveText('2');

  // Noah 2b: greeting and trip card without scrolling
  // «Neuer Schwung» (Noah 26.10.2026, changed on purpose): Heute no longer asks for the name (it is set in Ich › Darstellung)
  await expect(page.locator('[data-name-ask]')).toHaveCount(0);
  expect(await inFirstScreen(page, page.locator('#hello-h')), 'greeting in the first screen').toBe(true);
  // «Heute neu» N2 (0.169.0, Noah «5a», changed on purpose): one sentence, then the body and the Aktiv tiles; the
  // trip of tomorrow right under them, «Up now» after the trip
  await expect(page.locator('[data-say]')).toContainText(T('{n} day until {trip}.', { n: 1, trip: 'test_data_gtp_ Herbstrunde' }));
  // 0.180.0 P6 (Noah 21.10.2026 «2b»): the meditation card is first on the wall, the weekly weight under it.
  // «Heute ruhiger» (Noah 26.10.2026 «3a», mockup H3, changed on purpose): the tiles stand in areas with a heading;
  // «Jetzt» (meditation, the trip, the weekly weight, «Up now») comes first, then «Dein Körper» with the body and Aktiv
  await expect(page.locator('.wall > [data-tile]').first()).toHaveAttribute('data-tile', 'meditation');
  const areas = await page.locator('.wall [data-home-sec]').evaluateAll((els) => els.map((e) => e.dataset.homeSec));
  expect(areas.slice(0, 2)).toEqual(['now', 'body']);
  await expect(page.locator('[data-home-sec="now"] h2')).toHaveText(T('Now|home'));
  const order = await page.locator('[data-section="weighin"], [data-section="body"], [data-section="acts"], [data-section="trip"], [data-section="today"]').evaluateAll((els) => els.map((e) => e.dataset.section));
  expect(order.filter((x, i, a) => a.indexOf(x) === i)).toEqual(['trip', 'weighin', 'today', 'body', 'acts']);
  // a card that fills up its row reaches from where it starts to the end of the row (it once sat alone in the last column)
  if (!phone) {
    const fills = await page.locator('.wall.secs > .ti.fill').evaluateAll((els) => {
      const wall = els[0]?.parentElement.getBoundingClientRect();
      return els.map((e) => ({ id: e.dataset.tile, w: e.getBoundingClientRect().width / wall.width, right: wall.right - e.getBoundingClientRect().right }));
    });
    for (const f of fills) {
      expect(f.w, f.id).toBeGreaterThan(0.2);
      expect(Math.abs(f.right), f.id).toBeLessThan(2);
    }
  }

  // Up now, Tried it yet?, bikes, customise
  // «Heute neu» A (changed on purpose): at most 4 rows, «Show all» opens the rest; the 12 months left Heute (catalog)
  const imp = page.getByRole('region', { name: T('Up now') });
  await expect(imp.locator('li')).toHaveCount(4);
  await expect(imp.locator('button.more')).toHaveText(new RegExp(T('Show all {n}', { n: '(\\d+)' })));
  const all = Number((await imp.locator('button.more').textContent()).match(/\d+/)[0]);
  await imp.locator('button.more').click();
  await expect(imp.locator('li')).toHaveCount(all);
  await expect(imp).toContainText(T('{bike}: lube the chain', { bike: 'test_data_gtp_ Scale' }));
  await expect(page.getByRole('region', { name: T('Tried it yet?') })).toHaveCount(0);
  await expect(page.locator('[data-section="bikes"] a.bk')).toHaveCount(4);
  await expect(page.locator('[data-section="bikes"] [data-bike="test_data_gtp_lux"]')).toContainText(T('+ log km'));
  await expect(page.locator('[data-year-row]')).toHaveCount(0);
  await expect(page.locator('[data-all-areas]')).toBeVisible();
  if (!phone) await expect(page.getByRole('button', { name: T('Customise the start page') })).toBeVisible();

  // the bike card opens the bike in Bikes → Care
  await expect(page.locator('[data-bike="test_data_gtp_spark"]')).toHaveAttribute('href', '#/bikes?tab=care&bike=test_data_gtp_spark&open=1');
  await noSideScroll(page, 'Today');
  expect(errors).toEqual([]);
});

test('lubed right on Today, with Undo; a function tile opens its page', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  const imp = page.getByRole('region', { name: T('Up now') });
  await imp.locator('button.more').click(); // «Heute neu» A: 4 rows, the lube row may wait behind «Show all»
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

  // v0.94.0 «Kachel-Wand»: every function is its own tile; the wall keeps the order the user set
  // «Heute neu» A (0.165.0): «Note» is one of the 8 shortcuts
  await page.locator('.wall [data-fn="note"]').click();
  await expect(page).not.toHaveURL(/#\/?$/);
});

test('test trips: hidden as next trip, cleaned up after a question on the page, Undo', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await expect(page.locator('#next-h')).not.toHaveText(/TEST/);
  const imp = page.getByRole('region', { name: T('Up now') });
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
  // v0.97.0 Design-Refresh R1 (Noah 2a): Salbei is the default, the earlier worlds stay under Ich › Darstellung
  await expect(html).toHaveAttribute('data-palette', 'salbei');
  await expect(html).toHaveAttribute('data-theme', 'light');
  // v0.76.0 «Fünf Orte»: the page ground is tinted a breath by the place; the colour world sets --ground.
  const bg = () => page.evaluate(() => {
    const d = document.body.appendChild(document.createElement('div'));
    d.style.background = 'var(--ground)';
    const c = getComputedStyle(d).backgroundColor;
    d.remove();
    return c;
  });
  // v0.169.0 UI-Grundlagen (UI-Ziele, Noah 17:05 «freigabe für alles», changed on purpose): Salbei ground is warmer, #f6f2ea
  expect(await bg()).toBe('rgb(246, 242, 234)');

  // v0.76.0: the colour world and light or dark are in «Ich» (top right), no longer in «More».
  await page.getByRole('link', { name: /^(Me|Ich)\b/ }).first().click();
  await expect(page).toHaveURL(/#\/me$/);
  await page.getByRole('link', { name: new RegExp(T('Appearance')) }).click();
  await expect(page).toHaveURL(/#\/me\/look$/);
  const more = page.locator('main');
  await more.getByRole('group', { name: T('Colour world') }).getByRole('button', { name: T('Sandstone|palette') }).click();
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
  await more.getByRole('group', { name: T('Light or dark') }).getByRole('button', { name: T('System|theme') }).click();
  await expect(html).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(html).toHaveAttribute('data-theme', 'dark');
  // Today itself, in the dark
  await page.goto('./#/');
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
  await expect(page.locator('#hello-h')).toHaveText(greetFor(19, '')); // HG1
  // Noah 19.10.2026 «1a» (changed on purpose): Herbstrunde starts tomorrow and is not packed, so the evening
  // brings its window; «Später» puts it away and Heute is as before
  await page.locator('dialog[data-window="eve"] [data-window-later]').click();
  await expect(page.locator('dialog[data-window]')).toBeHidden();
  // «Heute neu» A (changed on purpose): «Up now» starts with what is to start now (the meditation), then the
  // review of the day and the charging, in this order
  const up = page.getByRole('region', { name: T('Up now') });
  if (await up.locator('button.more').count()) await up.locator('button.more').click();
  const texts = await up.locator('li').allTextContents();
  const review = texts.findIndex((x) => x.includes(T('Review today: {trip}', { trip: 'test_data_gtp_ Abendrunde' })));
  // the fixture packs a few devices already (lamp, GPS …): the count is whatever needs charging
  const charge = texts.findIndex((x) => /(Akkus laden: \d+ Geräte? für|Charge batteries: \d+ devices? for) test_data_gtp_ Herbstrunde/.test(x));
  expect(review, texts.join(' | ')).toBeGreaterThanOrEqual(0);
  expect(charge).toBe(review + 1);

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
// label used the class name "sw" which app.css reserves for the 10 px colour swatch. v0.94.0 «Kachel-Wand»:
// customising happens on the wall; the picked tile's name in the tools bar must be readable on one line.
test('customise the start page: the picked tile\'s name readable, not squeezed into a 10 px column', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await page.getByRole('button', { name: T('Customise the start page') }).click();
  for (const id of ['important', 'fn:note', 'bikes']) {
    const tile = page.locator(`.wall [data-tile="${id}"]`);
    await tile.locator('.pick').click();
    const name = page.locator(`[data-tools="${id}"] .tn`);
    await expect(name).not.toHaveText('');
    const box = await name.boundingBox();
    expect(box.width, `${await name.textContent()} is wide enough`).toBeGreaterThan(30);
    expect(box.height, `${await name.textContent()} on one line`).toBeLessThan(40);
  }
  await noSideScroll(page, 'Customise the start page');
});
