// v0.27.0 (AP21, PF15): mobile use and basic accessibility, checked in a real (emulated) phone.
// 1. No core view scrolls sideways at 320 and 390 px (touch phone), also with a 60-letter item name.
// 2. Dialogs (New trip, Item, Assign, Pack's "Go anyway?"): focus moves in, Tab stays inside, Escape closes,
//    focus goes back to the button that opened it.
// 3. Every control on Today, Pack and Gear has a name a screen reader can read.
// Fictional fixture plus test_data_gtp_ records; nothing outside the preview server.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const TRIP = 'trip-test_data_gtp_a11y';
const LONG = 'test_data_gtp_ Ultraleichte Daunenjacke mit Kapuze Alpenpass'; // 60 letters
// tomorrow in Zurich: a trip running today would turn the start page into the ride day
const tomorrow = () => new Date(Date.now() + 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

function fixture(path) {
  const data = structuredClone(base);
  data.tables.items.push({ id: 'LONG1', name: LONG, category: 'offbike', weightG: 240, qty: 1, weightStatus: 'measured', defaultBag: 'top', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'] });
  const bike = data.tables.bikes[0];
  const ids = data.tables.items.filter((i) => i.category !== 'bags').slice(0, 6).map((i) => i.id).concat('LONG1');
  const trip = (id, title, startDate) => ({
    id, domain: 'bikepacking', title, startDate, days: 2, bikeId: bike.id, bike: bike.name, setup: { ...bike.setup },
    entries: ids.map((itemId, i) => ({ itemId, slot: ['top', 'frame', 'seat'][i % 3], qty: 1, packed: i < 2 })),
    ready: [{ id: 'wallet', label: 'Phone, wallet, keys', done: false }], ride: null, hours: null, sets: {}, purpose: {}, status: 'planned', copiedFrom: null, createdAt: '2026-10-01T08:00:00.000Z',
  });
  data.tables.trips.push(trip(TRIP, 'test_data_gtp_ Jura Runde mit einem recht langen Tournamen', tomorrow()));
  data.tables.trips.push(trip('trip-test_data_gtp_past', 'test_data_gtp_ Emmental', '2026-09-20'));
  data.tables.notes.push({ id: 'note-test_data_gtp_1', at: '2026-10-05T08:00:00.000Z', text: 'test_data_gtp_ Bremse quietscht', photo: null, page: 'home', tripId: null, bikeId: bike.id, status: 'open', to: null, sortedAt: null });
  writeFileSync(path, JSON.stringify(data));
}

async function start(page, context, info) {
  const file = info.outputPath('a11y-fixture.json');
  fixture(file);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect(data.getByText(/importiert|Imported/)).toBeVisible();
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), TRIP);
}

/** A fresh page load of one view (the hash alone would keep the old page state). */
const view = async (page, hash) => {
  await page.goto(`./${hash}`);
  await page.reload();
  await expect(page.locator('main')).toBeVisible();
};

/** Opens every gear category (a phone starts with them folded, a desktop open). */
const expandAll = async (page) => {
  const btn = page.getByRole('button', { name: T('Expand all') });
  if (await btn.count()) await btn.click();
};

/** No page may scroll sideways; names the elements that stick out. */
async function fits(page, where) {
  await page.waitForTimeout(150);
  const { sw, w, wide } = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    w: innerWidth,
    wide: [...document.querySelectorAll('body *')].filter((el) => el.getBoundingClientRect().right > innerWidth + 1).slice(0, 4).map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`),
  }));
  expect(sw, `${where} at ${w} px: page is ${sw} px wide; sticking out: ${wide.join(', ')}`).toBeLessThanOrEqual(w);
}

/** Controls without an accessible name in the accessibility tree of a part of the page. */
async function unnamed(locator) {
  const snap = await locator.ariaSnapshot();
  const re = /^\s*- (button|link|textbox|checkbox|combobox|radio|switch|slider|spinbutton|searchbox|menuitem|tab)(\s*\[[^\]]*\])*\s*(:.*)?$/;
  return snap.split('\n').filter((l) => re.test(l));
}

/** Opens a dialog with the keyboard and checks focus in, Tab inside, Escape and focus back
 *  (to the opener, or to `back` when the opener sat in a sheet that closed on the way). */
async function dialogKeys(page, opener, dialog, back = opener) {
  await opener.focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  const inside = () => dialog.evaluate((d) => d.contains(document.activeElement));
  await expect.poll(inside, { message: 'focus moves into the dialog' }).toBe(true);
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    expect(await inside(), `Tab ${i + 1} stays inside the dialog`).toBe(true);
  }
  await page.keyboard.press('Shift+Tab');
  expect(await inside(), 'Shift+Tab stays inside').toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(back, 'focus goes back to the opener').toBeFocused();
}

test('no core view scrolls sideways at 320 and 390 px', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'phone widths (touch, mobile) only');
  await start(page, context, info);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 740 });
    for (const hash of ['#/', '#/pack', '#/ride', '#/debrief/trip-test_data_gtp_past', '#/gear', '#/blocks', '#/bikes', '#/care', '#/inbox', '#/pack/templates', '#/pack/past']) {
      await view(page, hash);
      await fits(page, hash);
    }
    // the long name wraps in the gear list and the packing day
    await view(page, '#/gear');
    await expandAll(page);
    await expect(page.getByRole('button', { name: new RegExp(LONG) })).toBeVisible();
    await fits(page, 'gear, all open');
    await view(page, '#/pack');
    await page.getByRole('button', { name: T('Add material') }).first().click();
    await expect(page.getByRole('dialog', { name: T('Add material') })).toBeVisible();
    await fits(page, 'Add material');
    await page.keyboard.press('Escape');
    // Trip conditions: "Close" stays inside the sheet (it was cut off at 320 px)
    await page.getByLabel(T('More: other trip, edit trip, templates, print')).click();
    await page.getByRole('button', { name: T('Edit trip conditions') }).click();
    const cond = page.getByRole('dialog', { name: T('Edit trip conditions') });
    const sheet = await cond.boundingBox();
    const close = await cond.getByRole('button', { name: T('Close') }).boundingBox();
    expect(close.x + close.width, '"Close" inside the sheet').toBeLessThanOrEqual(sheet.x + sheet.width);
    await fits(page, 'Edit trip conditions');
    await page.keyboard.press('Escape');
    // v0.29.0: Pack is a normal page (the "Pack" tab in the band), no longer a full-screen dialog.
    await page.getByRole('navigation', { name: T('Steps of this trip') }).getByRole('link', { name: new RegExp(`^${T('Pack|stage')}`) }).click();
    const day = page.locator('.pd');
    await expect(day).toHaveAttribute('aria-label', T('Packing day: {title}', { title: 'test_data_gtp_ Jura Runde mit einem recht langen Tournamen' }));
    await expect(day.locator('ul.items button[aria-pressed]').first()).toBeVisible();
    await fits(page, 'packing day');
    // the packing rows are a thumb high (AP21: about 48 px)
    const row = await day.locator('ul.items button[aria-pressed]').first().boundingBox();
    expect(row.height).toBeGreaterThanOrEqual(44);
    // the four tabs in the band are a thumb high too
    for (const tab of await page.getByRole('navigation', { name: T('Steps of this trip') }).getByRole('link').all()) expect((await tab.boundingBox()).height).toBeGreaterThanOrEqual(44);
  }
});

test('dialogs: focus in, Tab stays inside, Escape closes, focus back', async ({ page, context }, info) => {
  await start(page, context, info);
  // New → Plan a trip → New trip (v0.30.0: the window opens straight away)
  await view(page, '#/');
  const newBtn = page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true });
  await newBtn.focus();
  await page.keyboard.press('Enter');
  await dialogKeys(page, page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }), page.getByRole('dialog', { name: T('New trip') }), newBtn);

  // Item dialog from the gear list
  await view(page, '#/gear');
  await expandAll(page);
  await dialogKeys(page, page.getByRole('button', { name: new RegExp(LONG) }), page.locator('dialog[open]'));

  // Assign dialog from the Select bar
  await view(page, '#/gear');
  await expandAll(page);
  await page.getByRole('button', { name: T('Select'), exact: true }).click();
  await page.getByRole('checkbox', { name: LONG }).check();
  await dialogKeys(page, page.getByRole('button', { name: T('Into a building block …') }), page.locator('dialog[open]'));

  // v0.29.0: Pack is a page now; its dialog is "{n} things are not ticked yet. Go anyway?" on the one orange button.
  await view(page, '#/pack?day');
  await dialogKeys(page, page.locator('.trip-band .go'), page.locator('dialog.ask'));
});

test('every control on Today, Pack and Gear has a name', async ({ page, context }, info) => {
  await start(page, context, info);
  for (const hash of ['#/', '#/pack', '#/gear']) {
    await view(page, hash);
    await page.waitForTimeout(300);
    expect(await unnamed(page.locator('body')), `${hash}: controls without a name`).toEqual([]);
  }
  await page.getByRole('button', { name: T('Select'), exact: true }).click();
  expect(await unnamed(page.locator('body')), 'Gear, Select: controls without a name').toEqual([]);
});
