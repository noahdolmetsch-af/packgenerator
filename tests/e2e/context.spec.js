// v0.25.0 (M3, Noah 7.10.2026): the trip decides the packing list. The "New trip" dialog asks
// hours per day, overnight stay, weather and event; the list comes straight from it (6b), a later
// change in "Edit trip" applies at once with Undo (9b), and a short ride shows no bike care (10).
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
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

const item = (id, name, f) => ({ id, name: `test_data_gtp_ ${name}`, category: 'other', weightG: 50, qty: 1, weightStatus: 'measured', defaultBag: 'top', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...f });
const NIGHT = ['CX01', 'CX03', 'CX05']; // base, sleep, cook (v0.66.0: Bivouac, Cook; the old Warm item CX04 comes with the weather, below 10 °C)
function fixture(path) {
  const data = structuredClone(base);
  data.tables.items.push(
    item('CX01', 'Badetuch', { sets: ['base'] }),
    item('CX02', 'Zahnbürste', { sets: ['base', 'lodging'] }),
    item('CX03', 'Biwaksack', { sets: ['sleep'], defaultBag: 'seat' }),
    item('CX04', 'Daunenjacke', { sets: ['warm'], defaultBag: 'seat' }),
    item('CX05', 'Kocher', { sets: ['cook'], defaultBag: 'seat' }),
    item('CX06', 'Duschgel', { sets: ['lodging'] }),
    item('CX07', 'Gel', { role: 'standard', defaultBag: 'frame', perHours: 1, maxQty: 6, category: 'food' }),
    item('CX08', 'Beinlinge', { coldBelow: 15, defaultBag: 'seat' }),
  );
  writeFileSync(path, JSON.stringify(data));
}

async function start(page, context, info, lang) {
  const file = info.outputPath('context-fixture.json');
  fixture(file);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript((l) => localStorage.setItem('lang', l), lang);
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = page.locator('details.data');
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

/** The stored trip, read straight from IndexedDB. */
const stored = (page, title) =>
  page.evaluate((t) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('trips').objectStore('trips').getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result.find((x) => x.title === t) ?? null); };
    };
  }), title);
const ids = async (page, title) => ((await stored(page, title))?.entries ?? []).map((e) => e.itemId);

/** New → Plan a trip (v0.30.0: starts with the standard set); returns the open "New trip" dialog. */
async function openNew(page, T, click) {
  await click(page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }));
  await click(page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }));
  return page.getByRole('dialog', { name: T('New trip') });
}

for (const lang of ['de', 'en']) {
  test(`day ride: MTB, 2 h, 1 day, no overnight, chilly — straight to a list without night items, ${lang}`, async ({ page, context }, info) => {
    const T = tr(lang);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await start(page, context, info, lang);
    const title = `test_data_gtp_ Feierabend ${lang}`;
    let clicks = 0;
    const click = async (loc) => {
      await loc.click();
      clicks++;
    };
    const t0 = Date.now();
    const dlg = await openNew(page, T, click);
    await dlg.getByLabel(T('Name')).fill(title);
    await dlg.getByLabel(T('Riding hours per day')).fill('2');
    // 1 day: no night (v0.30.0: the question only comes from 2 days on; overnight 'none' is checked below).
    await expect(dlg.getByRole('button', { name: T('None|overnight'), exact: true })).toHaveCount(0);
    await click(dlg.getByRole('button', { name: new RegExp(`^${T('Chilly')}`) }));
    // The live box says what the list will be.
    const box = dlg.getByRole('region', { name: T('Your packing list|preview') });
    await expect(box).toContainText(`${T('By duration')}: test_data_gtp_ Gel 2`);
    await expect(box).toContainText('test_data_gtp_ Beinlinge');
    await expect(box).toContainText(T('Not included: overnight gear, event preparation'));
    await click(dlg.getByRole('button', { name: T('Create trip') }));
    await expect(dlg).toBeHidden();
    // v0.29.0 (Noah 5a): the bags are folded; the gel's bag opens with a tap.
    await page.locator('section.bag-group').filter({ hasText: 'test_data_gtp_ Gel' }).locator('button.bag-heading').click();
    const gel = page.locator('.planning-row').filter({ hasText: 'test_data_gtp_ Gel' });
    await expect(gel).toContainText('× 2');
    const ms = Date.now() - t0;
    info.annotations.push({ type: 'clicks', description: String(clicks) }, { type: 'seconds', description: (ms / 1000).toFixed(1) });
    console.log(`[context] ${info.project.name} ${lang}: ${clicks} clicks + 2 fields, ${(ms / 1000).toFixed(1)} s from New to the list`);
    expect(clicks, 'New to the list in a handful of clicks').toBeLessThanOrEqual(5);

    const on = await ids(page, title);
    for (const id of [...NIGHT, 'CX02', 'CX06']) expect(on).not.toContain(id);
    expect(on).toContain('CX04'); // v0.66.0 (6a): the old Warm item comes below 10 °C, also on a day ride
    expect(on).toContain('CX08');
    const trip = await stored(page, title);
    expect(trip).toMatchObject({ hours: 2, overnight: 'none', wx: { min: 6, max: 12, rain: 'none' }, event: false });
    // Header: hours per day, days and the overnight stay; nothing left "still to decide" (6b).
    // v0.29.0: in the conditions card (Duration, Per day).
    // v0.47.1 (Noah b): a one-day ride without a night: no duration field; the hours are in the top card.
    await expect(page.locator('.cond')).not.toContainText(T('no overnight stay'));
    await expect(page.locator('.trip-band [data-fact="duration"]')).toHaveText(T('{n} h', { n: 2 }));
    await expect(page.locator('.detail-link .tp-badge')).toHaveCount(0);
    // Answer 10: a short ride shows no bike care before the trip.
    await expect(page.locator('.calm-extra summary').filter({ hasText: T('Before the trip') })).not.toContainText(T('Bike care'));
    expect(errors).toEqual([]);
  });
}

test('lodging for 2 days, then outdoor in Edit trip, and Undo', async ({ page, context }, info) => {
  const T = tr('de');
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info, 'de');
  const title = 'test_data_gtp_ Hotel';
  const dlg = await openNew(page, T, (l) => l.click());
  await dlg.getByLabel(T('Name')).fill(title);
  await dlg.getByLabel(T('Start date')).fill(today());
  await dlg.getByRole('button', { name: T('More'), exact: true }).click(); // v0.40.0: the days field only after "More"
  await dlg.getByLabel(T('Days')).fill('2');
  // 2 days: outdoor until something is chosen; "None" with 2 days gives a gentle hint.
  await expect(dlg.getByRole('button', { name: T('Bivouac + tent') })).toHaveAttribute('aria-pressed', 'true');
  await expect(dlg.getByRole('checkbox', { name: T('Cooking') })).toBeVisible();
  await dlg.getByRole('button', { name: T('None|overnight'), exact: true }).click(); // exact: "Copy the last trip" says "none yet" (v0.30.0)
  await expect(dlg).toContainText(T('More than one day without a night? Choose where you sleep.'));
  await expect(dlg.getByRole('checkbox', { name: T('Cooking') })).toHaveCount(0);
  await dlg.getByRole('button', { name: T('Hotel/hut'), exact: true }).click();
  await dlg.getByLabel(T('Riding hours per day')).fill('3');
  await dlg.getByRole('button', { name: T('Create trip') }).click();
  await expect(dlg).toBeHidden();
  await expect.poll(() => ids(page, title)).toContain('CX06');
  let on = await ids(page, title);
  expect(on).toContain('CX02');
  for (const id of NIGHT) expect(on).not.toContain(id);
  // 8a: 3 h × 2 days = 6 gels, the most you carry: "buy on the way?".
  await page.locator('section.bag-group').filter({ hasText: 'test_data_gtp_ Gel' }).locator('button.bag-heading').click();
  const gel = page.locator('.planning-row').filter({ hasText: 'test_data_gtp_ Gel' });
  await expect(gel).toContainText('× 6');
  await expect(gel).toContainText(T('Buy {name} on the way?', { name: 'test_data_gtp_ Gel' }));
  await expect(page.locator('.cond')).toContainText(`${T('{n} days', { n: 2 })} · ${T('Hotel/hut')}`);

  // 9b: Edit trip → Outdoor with cooking: night items come, lodging-only items go, at once.
  // v0.29.0: "Edit trip" is the Duration field of the conditions card (and in the ••• menu).
  await page.locator('.cond').getByRole('button', { name: new RegExp(T('Duration')) }).click();
  const edit = page.getByRole('dialog', { name: T('Trip details') });
  await expect(edit.getByRole('button', { name: T('Hotel/hut') })).toHaveAttribute('aria-pressed', 'true');
  await edit.getByRole('button', { name: T('Bivouac + tent') }).click();
  await edit.getByRole('checkbox', { name: T('Cooking') }).check();
  await edit.getByRole('button', { name: T('Save') }).click();
  await expect(edit).toBeHidden();
  await expect.poll(() => ids(page, title)).toContain('CX05');
  on = await ids(page, title);
  for (const id of [...NIGHT, 'CX02']) expect(on).toContain(id);
  expect(on).not.toContain('CX06');
  // Two days: bike care is a step before the trip again (no data on the test bike).
  await expect(page.locator('.calm-extra summary').filter({ hasText: T('Before the trip') })).toContainText(T('Bike care {state}', { state: T('no data') }));

  // Undo puts the lodging list back.
  await page.locator('.list-toolbar .undo').click();
  await expect.poll(() => ids(page, title)).toContain('CX06');
  on = await ids(page, title);
  for (const id of NIGHT) expect(on).not.toContain(id);
  expect((await stored(page, title)).overnight).toBe('lodging');
  expect(errors).toEqual([]);
});
