// v0.24.1 (Noah 1a, 2a, 6a, 7.10.2026): a calmer packing list (a tap on a row opens amount, move
// and take out), a day ride packed in one tap ("All packed, let's go") and "Add material" with
// tick boxes. Fictional fixture plus test_data_gtp_ items; nothing outside the preview server.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const tr = (lang) => (en, vars) => {
  const text = (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

function fixture(path) {
  const data = structuredClone(base);
  // Two items of one category, so "Select all" of a group has something to select.
  // v0.27.0 (pffix): plus one in another category for the single "+" (before, the start-up update added Noah's full frame bag).
  for (const [id, name, category = 'cook'] of [['CK90', 'test_data_gtp_ Löffel'], ['CK91', 'test_data_gtp_ Tasse'], ['LX90', 'test_data_gtp_ Kissen', 'lux']])
    data.tables.items.push({ id, name, category, weightG: 20, qty: 1, weightStatus: 'measured', defaultBag: 'top', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'] });
  // A template to edit (TemplateEdit uses the same tick boxes).
  data.tables.settings.push({ key: 'templates', value: [{ id: 'tpl-gtp', name: 'test_data_gtp_ Vorlage', setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' }, entries: [{ itemId: 'TO01', slot: 'frame', qty: 1 }], ready: [], ride: null, hours: null, sets: {}, purpose: {}, fromTrip: null, updatedAt: '2026-10-01T10:00:00.000Z' }] });
  writeFileSync(path, JSON.stringify(data));
}

async function start(page, context, info, lang) {
  const file = info.outputPath('pack-calm-fixture.json');
  fixture(file);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript((l) => localStorage.setItem('lang', l), lang);
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = page.locator('details.data');
  // v0.24.1: the start page can still be rendering; open "Your data" until it stays open (was flaky under load).
  await expect(async () => {
    // the app opens this panel by itself on an empty start: make sure it ends up open
    await expect(async () => {
      if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
      expect(await data.evaluate((d) => d.open)).toBe(true);
    }).toPass();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel(tr(lang)('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: tr(lang)('Replace all data') }).press('Enter');
  await expect(data.getByText(/importiert|Imported/)).toBeVisible();
}

async function newTrip(page, T, title, days = 1) {
  await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).click();
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }).click();
  const dlg = page.getByRole('dialog', { name: T('New trip') });
  await dlg.getByLabel(T('Name')).fill(title);
  await dlg.getByLabel(T('Start date')).fill(today());
  // v0.40.0: the days field only after "More".
  if (days > 1) await dlg.getByRole('button', { name: T('More'), exact: true }).click();
  if (days > 1) await dlg.getByLabel(T('Days')).fill(String(days));
  await dlg.getByRole('button', { name: T('Create trip') }).click();
  await expect(dlg).toBeHidden();
  await expect(page).toHaveURL(/#\/pack/);
}

/** The stored trip, read straight from IndexedDB. */
const stored = (page, title) =>
  page.evaluate((t) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('trips').objectStore('trips').getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result.find((x) => x.title === t) ?? null); };
    };
  }), title);

for (const lang of ['en', 'de']) {
  test(`a tap on a row opens amount, move and take out, ${lang}`, async ({ page, context }, info) => {
    const T = tr(lang);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await start(page, context, info, lang);
    await newTrip(page, T, `test_data_gtp_ Ruhig ${lang}`);
    const list = page.locator('.calm-pack');
    // v0.27.0 (Noah): the templates are visible on the Trips page itself
    // v0.29.0: in the conditions card ("Start with … · Templates").
    await expect(list.locator('.cond').getByRole('link', { name: new RegExp(T('Templates')) })).toHaveAttribute('href', '#/pack/templates');

    // v0.29.0 (Noah 5a): the bags are folded, with their item names in one line; a tap opens one.
    const bag = list.locator('section.bag-group').filter({ hasText: 'Multi tool' });
    await expect(bag.locator('.preview')).toContainText('Multi tool');
    await bag.locator('button.bag-heading').click();
    await expect(bag.locator('button.bag-heading')).toHaveAttribute('aria-expanded', 'true');

    // Calm: no stepper and no "•••" on the rows until one is opened.
    await expect(list.locator('.planning-row').first()).toBeVisible();
    await expect(list.locator('.planning-row .amount')).toHaveCount(0);
    await expect(list.getByRole('button', { name: T('Actions for {name}', { name: 'Multi tool' }) })).toHaveCount(0);
    const row = list.locator('.planning-row').filter({ hasText: 'Multi tool' });
    await expect(row.locator('.item-qty')).toHaveCount(0); // amount 1: no "× 1"

    const open = row.getByRole('button', { name: T('Amount, move or take out: {name}', { name: 'Multi tool' }) });
    await expect(open).toHaveAttribute('aria-expanded', 'false');
    await open.click();
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    await expect(row.getByRole('group', { name: T('Amount for {name}', { name: 'Multi tool' }) })).toBeVisible();
    await expect(row.getByLabel(T('Move {name} to', { name: 'Multi tool' }))).toBeVisible();
    await expect(row.getByRole('button', { name: T('Take out'), exact: true })).toBeVisible();

    await row.getByRole('button', { name: T('One more {name}', { name: 'Multi tool' }) }).click();
    await expect(row.locator('.amount span')).toHaveText('2');
    await expect(row.locator('.item-qty')).toHaveText('× 2');
    await expect.poll(async () => (await stored(page, `test_data_gtp_ Ruhig ${lang}`)).entries.find((e) => e.itemId === 'TO01').qty).toBe(2);

    // Closes with a second tap; the keyboard opens it too.
    await open.click();
    await expect(row.locator('.amount')).toHaveCount(0);
    await open.focus();
    await page.keyboard.press('Enter');
    await expect(row.locator('.amount')).toBeVisible();
    await row.getByRole('button', { name: T('Take out'), exact: true }).click();
    await expect(list.locator('.planning-row').filter({ hasText: 'Multi tool' })).toHaveCount(0);
    await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(page.viewportSize().width);
    expect(errors).toEqual([]);
  });
}

test("a day ride: All packed, let's go lands on On the way with everything packed", async ({ page, context }, info) => {
  const T = tr('de');
  await start(page, context, info, 'de');
  const title = 'test_data_gtp_ Los';
  await newTrip(page, T, title);
  const go = page.locator('.trip-band .go');
  await expect(go).toHaveText(T("All packed, let's go"));
  // v0.29.0: packing bag by bag is the "Pack" tab in the band.
  await expect(page.getByRole('navigation', { name: T('Steps of this trip') }).getByRole('link', { name: new RegExp(`^${T('Pack|stage')}`) })).toHaveAttribute('href', '#/pack?day');
  const before = await stored(page, title);
  expect(before.entries.some((e) => !e.packed)).toBe(true);
  expect(before.ready.some((r) => !r.itemId && !r.done)).toBe(true);

  await go.click();
  await expect(page).toHaveURL(/#\/ride/);
  await expect(page.getByText(title).first()).toBeVisible();
  const after = await stored(page, title);
  expect(after.entries.length).toBe(before.entries.length);
  expect(after.entries.every((e) => e.packed)).toBe(true);
  // v0.45.1 (Noah): the base check is not ticked by "let's go": it waits on the ride page.
  expect(after.ready.filter((r) => !r.itemId).some((r) => !r.done)).toBe(true);
  const check = page.getByRole('region', { name: T('Base check') });
  await expect(check.getByRole('button', { name: T('Lock') })).toBeVisible();
  await check.getByRole('button', { name: T('All with me') }).click();
  await expect(check.getByRole('button', { name: T('Lock') })).toBeHidden();
  expect((await stored(page, title)).ready.filter((r) => !r.itemId).every((r) => r.done)).toBe(true);

  // Back on Pack the next step is the ride day.
  await page.goto('./#/pack');
  await expect(page.locator('.trip-band .go')).toContainText(T('Next: On the way'));
});

test('a trip of 2 days keeps the packing check', async ({ page, context }, info) => {
  const T = tr('de');
  await start(page, context, info, 'de');
  await newTrip(page, T, 'test_data_gtp_ Zwei Tage', 2);
  await expect(page.locator('.trip-band .go')).toContainText(T('Next: Pack'));
  await page.locator('.trip-band .go').click();
  await expect(page).toHaveURL(/#\/pack\?day/);
  await expect(page.locator('.pd')).toHaveAttribute('aria-label', T('Packing day: {title}', { title: 'test_data_gtp_ Zwei Tage' }));
  await expect(page.locator('.pd .pbag.cur ul.items button').first()).toBeVisible();
});

test('Add material with tick boxes adds 3 items in one go', async ({ page, context }, info) => {
  const T = tr('de');
  await start(page, context, info, 'de');
  const title = 'test_data_gtp_ Kästchen';
  await newTrip(page, T, title);
  const before = (await stored(page, title)).entries.length;

  await page.getByRole('button', { name: T('Add material') }).filter({ visible: true }).first().click();
  const sheet = page.getByRole('dialog', { name: T('Add material') });
  await expect(sheet.locator('.pick-bar')).toHaveCount(0);
  // "Select all" of one group ticks both of its items; "Select none" unticks them again.
  await sheet.locator('.gh', { hasText: T('Cooking') }).click();
  const all = sheet.getByRole('button', { name: T('Select all: {group}', { group: T('Cooking') }) });
  await all.click();
  await expect(sheet.getByRole('checkbox', { name: 'test_data_gtp_ Löffel' })).toBeChecked();
  await expect(sheet.getByRole('checkbox', { name: 'test_data_gtp_ Tasse' })).toBeChecked();
  await sheet.getByRole('button', { name: T('Select none: {group}', { group: T('Cooking') }) }).click();
  await expect(sheet.getByRole('checkbox', { name: 'test_data_gtp_ Löffel' })).not.toBeChecked();
  await all.click();
  // A tick in another group keeps the first ones (only one group is open at a time).
  await sheet.locator('.gh', { hasText: T('Sleep') }).click();
  await sheet.getByRole('checkbox', { name: 'Sleeping bag' }).check();
  const add = sheet.getByRole('button', { name: T('Add {n} items to {bag}', { n: 3, bag: 'Test Rahmentasche' }) });
  await expect(add).toBeVisible();
  await add.click();
  await expect(sheet.locator('.pick-bar')).toHaveCount(0); // the ticks clear after adding
  await expect(sheet.getByText(T('{n} items added to this trip.', { n: 3 }))).toBeVisible();

  const after = await stored(page, title);
  expect(after.entries.length).toBe(before + 3);
  for (const id of ['CK90', 'CK91', 'SL01']) expect(after.entries.find((e) => e.itemId === id)).toMatchObject({ slot: 'frame', qty: 1, packed: false });
  // The single "+" still adds one item.
  await sheet.locator('.gh').first().click();
  await sheet.locator('.np li .plus').first().click();
  await expect.poll(async () => (await stored(page, title)).entries.length).toBe(before + 4);
  await sheet.getByRole('button', { name: T('Done') }).click();

  // One write each: two Undo steps take all four back out.
  await page.getByRole('button', { name: T('Undo'), exact: true }).filter({ visible: true }).click();
  await expect.poll(async () => (await stored(page, title)).entries.length).toBe(before + 3);
  await page.getByRole('button', { name: T('Undo'), exact: true }).filter({ visible: true }).click();
  await expect.poll(async () => (await stored(page, title)).entries.length).toBe(before);
  await expect(page.getByRole('button', { name: T('Undo'), exact: true }).filter({ visible: true })).toHaveCount(0);
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(page.viewportSize().width);
});

test('a template takes several single items from the picker', async ({ page, context }, info) => {
  // v0.39.0 (AP28): the template page adds single items with "+ Item" (search, categories, one + each).
  const T = tr('de');
  await start(page, context, info, 'de');
  await page.goto('./#/pack/templates/tpl-gtp');
  await expect(page.getByRole('heading', { level: 1, name: 'test_data_gtp_ Vorlage' })).toBeVisible();
  await page.getByRole('button', { name: T('Item'), exact: true }).click();
  await page.locator('.picker .cat', { hasText: T('Cooking') }).click();
  await page.getByRole('button', { name: T('Add {name}', { name: 'test_data_gtp_ Löffel' }) }).click();
  await page.getByRole('button', { name: T('Add {name}', { name: 'test_data_gtp_ Tasse' }) }).click();
  await page.getByLabel(T('Search an item')).fill('Sleeping');
  await page.getByRole('button', { name: T('Add {name}', { name: 'Sleeping bag' }) }).click();
  const tpl = async () => page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('settings').objectStore('settings').get('templates');
      q.onsuccess = () => { r.result.close(); ok(q.result.value[0]); };
    };
  }));
  await expect.poll(async () => (await tpl()).entries.map((e) => e.itemId).sort()).toEqual(['CK90', 'CK91', 'SL01', 'TO01']);
  const saved = await tpl();
  expect(saved.extras.map((e) => e.itemId)).toEqual(expect.arrayContaining(['CK90', 'CK91', 'SL01']));
  expect(saved.entries.every((e) => e.qty === 1)).toBe(true);
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(page.viewportSize().width);
});
