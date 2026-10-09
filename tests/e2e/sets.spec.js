// v0.26.0 (Noah 1a, 2a/2b, 3a; AP10/AP11): building blocks (code: item sets) you can see and make,
// assigning many items at once, "+ {block}" in Pack, and kits that become templates on start.
// Fictional fixture plus test_data_gtp_ items; nothing outside the preview server.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const tr = (lang) => (en, vars) => {
  const text = (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const RAIN = ['RG91', 'RG92', 'RG93'];
const NAMES = { RG91: 'test_data_gtp_ Regenhose', RG92: 'test_data_gtp_ Überschuhe', RG93: 'test_data_gtp_ Handschuhe' };

function fixture(path, { block = false, kits = false } = {}) {
  const data = structuredClone(base);
  for (const id of RAIN) {
    data.tables.items.push({ id, name: NAMES[id], category: 'rain', weightG: id === 'RG93' ? null : 120, qty: 1, weightStatus: 'measured', defaultBag: 'seat', ownership: 'owned', role: null, sets: block ? ['u-test-data-gtp-regen'] : [], kits: kits ? ['W'] : [], domains: ['bikepacking'] });
  }
  // A given-away item in the block: shown greyed, never packed.
  data.tables.items.push({ id: 'RG94', name: 'test_data_gtp_ Alte Jacke', category: 'rain', weightG: 400, qty: 1, weightStatus: 'measured', defaultBag: 'seat', ownership: 'gone', role: null, sets: block ? ['u-test-data-gtp-regen'] : [], kits: kits ? ['W', 'D'] : [], domains: ['bikepacking'] });
  if (kits) {
    data.tables.kits = [
      { id: 'D', name: 'test_data_gtp_ Daily ride', use: 'test_data_gtp_ short rides up to 3 h', bike: 'any', bags: '-', domain: 'bikepacking' },
      { id: 'W', name: 'test_data_gtp_ Rain setup (add-on)', use: 'test_data_gtp_ extra for rain', bike: '-', bags: '-', domain: 'bikepacking' },
    ];
    for (const i of data.tables.items) if (['EL01', 'LI01', 'ON01'].includes(i.id)) i.kits = ['D'];
  }
  if (block) data.tables.settings.push({ key: 'sets', value: [{ key: 'u-test-data-gtp-regen', name: 'test_data_gtp_ Regen', qty: { RG93: 2 } }] });
  const bike = data.tables.bikes[0];
  data.tables.trips.push({
    id: 'trip-test_data_gtp_1', domain: 'bikepacking', title: 'test_data_gtp_ Tour', startDate: '2026-11-01', days: 1, bikeId: bike.id, bike: bike.name, setup: { ...bike.setup },
    entries: [{ itemId: 'EL01', slot: 'mounted', qty: 1, packed: true }, { itemId: 'RG91', slot: 'seat', qty: 3, packed: true }],
    ready: [{ id: 'wallet', label: 'Phone, wallet, keys', done: false }], ride: null, hours: null, sets: {}, purpose: {}, status: 'planned', copiedFrom: null, createdAt: '2026-10-01T08:00:00.000Z',
  });
  writeFileSync(path, JSON.stringify(data));
}

async function start(page, context, info, lang, opts = {}, viewport = null) {
  const file = info.outputPath('sets-fixture.json');
  fixture(file, opts);
  if (viewport) await page.setViewportSize(viewport);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript((l) => localStorage.setItem('lang', l), lang);
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = page.locator('details.data');
  // the app opens this panel by itself on an empty start: make sure it ends up open
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel(tr(lang)('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: tr(lang)('Replace all data') }).press('Enter');
  await expect(data.getByText(/importiert|Imported/)).toBeVisible();
}

/** All records of a table, read straight from the browser database. */
const table = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const tripOf = async (page) => (await table(page, 'trips')).find((t) => t.id === 'trip-test_data_gtp_1');
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

for (const lang of ['de', 'en']) {
  test(`3 items into a new building block, then the whole gear onto the trip once, ${lang}`, async ({ page, context }, info) => {
    const T = tr(lang);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await start(page, context, info, lang);
    await page.goto('./#/gear');
    await page.getByLabel(T('Search gear')).fill('test_data_gtp_');
    let clicks = 0;
    const click = async (loc) => {
      await loc.click();
      clicks++;
    };
    // Measured: "3 items into a new building block".
    await click(page.getByRole('button', { name: T('Select'), exact: true }));
    for (const id of RAIN) await click(page.getByRole('checkbox', { name: NAMES[id] }));
    const bar = page.getByRole('region', { name: T('Selected items') });
    await click(bar.getByRole('button', { name: T('Into a building block …') }));
    const dlg = page.getByRole('dialog', { name: T('Into a building block') });
    // No own block yet: "New building block …" is chosen already.
    await expect(dlg.getByLabel(T('Building block'), { exact: true })).toHaveValue('__new');
    await dlg.getByLabel(T('Name of the new building block')).fill('test_data_gtp_ Regen');
    await click(dlg.getByRole('button', { name: T('Assign'), exact: true }));
    await expect(bar.getByRole('status')).toContainText(T('Done: {n} items → {target}', { n: 3, target: 'test_data_gtp_ Regen' }));
    console.log(`[clicks] 3 items into a new building block (${lang}, ${info.project.name}): ${clicks} clicks + typing the name`);
    expect(clicks).toBe(6);
    const sets = (await table(page, 'settings')).find((s) => s.key === 'sets').value;
    expect(sets).toEqual([{ key: 'u-test-data-gtp-regen', name: 'test_data_gtp_ Regen' }]);

    // The building blocks page shows the 3 items, the gone one never.
    await page.goto('./#/blocks');
    const card = page.getByRole('listitem', { name: 'test_data_gtp_ Regen' });
    await expect(card).toContainText(T('{n} items', { n: 3 }));
    for (const id of RAIN) await expect(card).toContainText(NAMES[id]);
    await expect(card).toContainText(T('Add it in Pack: Add material → Building blocks'));
    // Honest weight: one weight is unknown.
    await expect(card).toContainText(T('{n} not weighed', { n: 1 }));

    // Whole inventory onto the trip: each item once, what is packed stays packed.
    await page.goto('./#/gear');
    const before = await tripOf(page);
    await page.getByRole('button', { name: T('Select'), exact: true }).click();
    await page.locator('.selrow').getByRole('button', { name: T('Select all'), exact: true }).click();
    await bar.getByRole('button', { name: T('Onto a trip …') }).click();
    const tdlg = page.getByRole('dialog', { name: T('Onto a trip') });
    await expect(tdlg.getByLabel(T('Trip'), { exact: true })).toHaveValue('trip-test_data_gtp_1');
    await tdlg.getByRole('button', { name: T('Assign'), exact: true }).click();
    // Owned or unclear, minus the bags (they sit on the bike), minus what is on the trip already.
    const on = new Set(before.entries.map((e) => e.itemId));
    const bags = new Set((await table(page, 'containers')).map((c) => c.itemId));
    const owned = (await table(page, 'items')).filter((i) => (i.ownership === 'owned' || i.ownership === 'unclear') && !bags.has(i.id) && !on.has(i.id)).length;
    await expect(bar.getByRole('status')).toContainText(T('Done: {n} items → {target}', { n: owned, target: 'test_data_gtp_ Tour' }));
    const after = await tripOf(page);
    const ids = after.entries.map((e) => e.itemId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(after.entries.find((e) => e.itemId === 'EL01')).toMatchObject({ packed: true });
    expect(after.entries.find((e) => e.itemId === 'RG91')).toMatchObject({ packed: true, qty: 3 });
    // The bags (on the bike) do not become items on the trip.
    expect(ids.filter((id) => bags.has(id))).toEqual([]);
    // Undo puts the trip back.
    await bar.getByRole('button', { name: T('Undo') }).click();
    await expect.poll(async () => (await tripOf(page)).entries.length).toBe(before.entries.length);
    // Twice: the second time adds nothing.
    for (const n of [1, 2]) {
      await page.locator('.selrow').getByRole('button', { name: T('Select all'), exact: true }).click();
      await bar.getByRole('button', { name: T('Onto a trip …') }).click();
      await page.getByRole('dialog', { name: T('Onto a trip') }).getByRole('button', { name: T('Assign'), exact: true }).click();
      if (n === 2) await expect(bar.getByRole('status')).toContainText(T('Nothing to change: already like that ({target}).', { target: 'test_data_gtp_ Tour' }));
    }
    expect((await tripOf(page)).entries).toHaveLength(after.entries.length);
    expect(await wide(page)).toBe(0);
    expect(errors).toEqual([]);
  });
}

test('"+ block" in Add material adds the block once, with its amount, Undo takes it back', async ({ page, context }, info) => {
  const T = tr('de');
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info, 'de', { block: true });
  await page.goto('./#/pack');
  const before = await tripOf(page);
  let clicks = 0;
  // Measured: "a whole building block onto a trip".
  await page.getByRole('button', { name: T('Add material') }).first().click();
  clicks++;
  const sheet = page.getByRole('dialog', { name: T('Add material') });
  // RG91 is on the trip already, RG94 is gone: 2 to add.
  const chip = sheet.getByRole('button', { name: T('Add {block}: {n} items', { block: 'test_data_gtp_ Regen', n: 2 }) });
  await expect(chip).toHaveText('+ test_data_gtp_ Regen (2)');
  await chip.click();
  clicks++;
  console.log(`[clicks] a whole building block onto a trip (from the Pack page): ${clicks} clicks`);
  expect(clicks).toBe(2);
  await expect(sheet.getByRole('status').first()).toContainText(T('{n} items of {block} added.', { n: 2, block: 'test_data_gtp_ Regen' }));
  let trip = await tripOf(page);
  expect(trip.entries.find((e) => e.itemId === 'RG91')).toMatchObject({ qty: 3, packed: true });
  expect(trip.entries.find((e) => e.itemId === 'RG93')).toMatchObject({ qty: 2, packed: false, src: 'set' });
  expect(trip.entries.find((e) => e.itemId === 'RG94')).toBeUndefined();
  await expect(sheet.getByRole('button', { name: T('{block}: everything is on the trip', { block: 'test_data_gtp_ Regen' }) })).toBeDisabled();
  await sheet.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await tripOf(page)).entries.length).toBe(before.entries.length);
  expect(errors).toEqual([]);
});

// v0.30.0 (Noah, finding 2): a new trip with Standard + Rain in 4 clicks (+, Plan a trip, the Rain chip, Create).
test('New trip window: Standard + a building block in 4 clicks, the live count on the button', async ({ page, context }, info) => {
  const T = tr('de');
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info, 'de', { block: true });
  let clicks = 0;
  const click = async (loc) => {
    await loc.click();
    clicks++;
  };
  await click(page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }));
  await click(page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }));
  const dlg = page.getByRole('dialog', { name: T('New trip') });
  await expect(dlg.getByRole('region', { name: T('Your packing list|preview') })).toContainText(T('always with you'));
  const create = dlg.getByRole('button', { name: T('Create trip') });
  const count = async () => Number((await create.textContent()).match(/(\d+)/)?.[1] ?? 0);
  await expect(create).toContainText('·');
  const before = await count();
  // RG94 is gone: the chip offers 3 items; Regenhandschuhe twice (the block's amount).
  const chip = dlg.getByRole('button', { name: /^\+ test_data_gtp_ Regen/ });
  await expect(chip).toContainText('3 ·');
  await click(chip);
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await expect(dlg).toContainText('test_data_gtp_ Regen: test_data_gtp_ Regenhose');
  await expect.poll(count).toBe(before + 3);
  if (info.project.name === 'phone') {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 740 });
      expect(await wide(page)).toBe(0);
      for (const b of await dlg.locator('.tp-chip, .toggle').all()) if (await b.isVisible()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
    }
  }
  await click(create);
  await expect(dlg).toBeHidden();
  expect(clicks, 'Standard + Rain in 4 clicks').toBe(4);
  const made = (await table(page, 'trips')).find((t) => t.id !== 'trip-test_data_gtp_1');
  expect(made.entries).toHaveLength(before + 3);
  for (const id of ['RG91', 'RG92']) expect(made.entries.find((e) => e.itemId === id)).toMatchObject({ qty: 1, packed: false, src: 'set' });
  expect(made.entries.find((e) => e.itemId === 'RG93')).toMatchObject({ qty: 2, src: 'set' });
  expect(made.entries.find((e) => e.itemId === 'RG94')).toBeUndefined();
  expect(made.entries.find((e) => e.itemId === 'RG91').slot).not.toBe('body');
  expect(errors).toEqual([]);
});

test('building blocks page on a 320 px phone: gone item greyed, amount, rename built-in, delete own with undo', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'phone only');
  const T = tr('de');
  await start(page, context, info, 'de', { block: true }, { width: 320, height: 640 });
  await page.goto('./#/blocks');
  const card = page.getByRole('listitem', { name: 'test_data_gtp_ Regen' });
  // v0.32.0 (finding 5): the card shows the names; rows and changes fold away under "Change".
  await expect(card).toContainText('test_data_gtp_ Handschuhe × 2');
  await card.locator('details.edit > summary').click();
  await expect(card).toContainText(`${T('Gone')} · ${T('never packed')}`);
  await expect(card).toContainText('test_data_gtp_ Handschuhe × 2');
  await card.getByRole('button', { name: T('More: {name}', { name: 'test_data_gtp_ Handschuhe' }) }).click();
  await expect(card).toContainText('test_data_gtp_ Handschuhe × 3');
  expect(await wide(page)).toBe(0);
  // A built-in block can be renamed (Noah 5b); its key stays.
  // v0.32.0 (finding 5): in the group "With the night" a built-in block shows without "Night: ".
  const cook = page.getByRole('listitem', { name: T('Night: Cook').replace(/^[^:]+: /, ''), exact: true });
  await cook.locator('details.edit > summary').click();
  await cook.getByRole('button', { name: T('Rename {name}', { name: T('Night: Cook').replace(/^[^:]+: /, '') }) }).click();
  await cook.getByLabel(T('New name')).fill('test_data_gtp_ Küche');
  await cook.getByRole('button', { name: T('Save') }).click();
  await expect(page.getByRole('listitem', { name: 'test_data_gtp_ Küche' })).toBeVisible();
  expect((await table(page, 'settings')).find((s) => s.key === 'sets').value).toContainEqual({ key: 'cook', name: 'test_data_gtp_ Küche' });
  // Built-in blocks have no Delete; own ones do, with Undo.
  await expect(page.getByRole('listitem', { name: 'test_data_gtp_ Küche' }).getByRole('button', { name: T('Delete') })).toHaveCount(0);
  await card.getByRole('button', { name: T('Delete') }).click();
  await expect(page.getByRole('listitem', { name: 'test_data_gtp_ Regen' })).toHaveCount(0);
  expect((await table(page, 'items')).find((i) => i.id === 'RG91').sets).toEqual([]);
  await page.getByRole('status').getByRole('button', { name: T('Undo') }).click();
  await expect(page.getByRole('listitem', { name: 'test_data_gtp_ Regen' })).toBeVisible();
  expect((await table(page, 'items')).find((i) => i.id === 'RG91').sets).toEqual(['u-test-data-gtp-regen']);
  expect(await wide(page)).toBe(0);
});

test('kits become templates after the start; the rain kit becomes a building block', async ({ page, context }, info) => {
  const T = tr('de');
  await start(page, context, info, 'de', { kits: true });
  const settings = await table(page, 'settings');
  const tpls = settings.find((s) => s.key === 'templates')?.value ?? [];
  const daily = tpls.find((x) => x.id === 'tpl-kit-D');
  expect(daily).toMatchObject({ name: 'test_data_gtp_ Daily ride', note: 'test_data_gtp_ short rides up to 3 h' });
  // Only owned items, each in its usual bag; the gone jacket stays out.
  expect(daily.entries.map((e) => e.itemId).sort()).toEqual(['EL01', 'LI01', 'ON01']);
  expect(tpls.some((x) => /Rain/.test(x.name))).toBe(false);
  expect(settings.find((s) => s.key === 'sets').value).toEqual([{ key: 'u-test-data-gtp-rain-setup', name: 'test_data_gtp_ Rain setup', note: 'test_data_gtp_ extra for rain' }]);
  expect((await table(page, 'kits')).length).toBe(2);
  // v0.39.0 (AP28): the list shows name and composition; the note sits on the template's own page.
  await page.goto('./#/pack/templates');
  await expect(page.getByRole('link', { name: /test_data_gtp_ Daily ride/ }).first()).toBeVisible();
  await page.goto('./#/pack/templates/tpl-kit-D');
  await expect(page.getByText('test_data_gtp_ short rides up to 3 h')).toBeVisible();
  await page.goto('./#/blocks');
  await expect(page.getByRole('listitem', { name: 'test_data_gtp_ Rain setup' })).toContainText(T('{n} items', { n: 3 }));
});

test('Assign in the item dialog shows where the item is and puts it into a template', async ({ page, context }, info) => {
  const T = tr('en');
  await start(page, context, info, 'en', { block: true, kits: true });
  await page.goto('./#/gear');
  await page.getByLabel(T('Search gear')).fill('Regenhose');
  await page.getByRole('button', { name: /test_data_gtp_ Regenhose/ }).click();
  const item = page.getByRole('dialog', { name: 'test_data_gtp_ Regenhose' });
  // v0.32.0 (finding 5): its building blocks as pressed buttons, templates and the trip folded away.
  const blocks = item.getByRole('group', { name: `${T('Comes along')} · ${T('Building blocks')}` });
  for (const name of ['test_data_gtp_ Regen', 'test_data_gtp_ Rain setup']) await expect(blocks.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(blocks.getByRole('button', { name: new RegExp(`^${T('Standard|block')}`) })).toHaveAttribute('aria-pressed', 'false');
  const fold = item.locator('details.fold').filter({ hasText: T('In templates') });
  await expect(fold.locator('summary')).toContainText(`0 · ${T('on the current trip')}`);
  await fold.locator('summary').click();
  await expect(fold).toContainText(T('Trip "{name}"', { name: 'test_data_gtp_ Tour' }));
  await fold.getByRole('button', { name: T('Assign …') }).click();
  const dlg = page.getByRole('dialog', { name: T('Assign "{name}"', { name: 'test_data_gtp_ Regenhose' }) });
  await dlg.getByLabel(T('Into a template')).check();
  await dlg.getByLabel(T('Template'), { exact: true }).selectOption({ label: 'test_data_gtp_ Daily ride' });
  await dlg.getByRole('button', { name: T('Assign'), exact: true }).click();
  await expect(dlg.getByRole('status')).toContainText(T('Done: {n} item → {target}', { n: 1, target: 'test_data_gtp_ Daily ride' }));
  await expect(dlg).toContainText(T('Template "{name}"', { name: 'test_data_gtp_ Daily ride' }));
  const tpl = (await table(page, 'settings')).find((s) => s.key === 'templates').value.find((x) => x.id === 'tpl-kit-D');
  expect(tpl.entries.find((e) => e.itemId === 'RG91')).toEqual({ itemId: 'RG91', slot: 'seat', qty: 1 });
  await dlg.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await table(page, 'settings')).find((s) => s.key === 'templates').value.find((x) => x.id === 'tpl-kit-D').entries.some((e) => e.itemId === 'RG91')).toBe(false);
});
