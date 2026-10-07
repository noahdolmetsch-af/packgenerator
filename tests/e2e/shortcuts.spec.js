// v0.24.0 (Noah, 7.10.2026: "fewer clicks, select all, create what the search does not find").
// A day ride from New to a saved debrief with the shortcuts, and new gear from the searches.
// Fictional fixture plus one test_data_gtp_ base-set item; nothing outside the preview server.
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
  // Only for nights: a day ride must start without it.
  data.tables.items.push({ id: 'HY90', name: 'test_data_gtp_ Zahnbürste', category: 'hyg', weightG: 15, qty: 1, weightStatus: 'measured', defaultBag: 'seat', ownership: 'owned', role: null, sets: ['base'], kits: [], domains: ['bikepacking'] });
  writeFileSync(path, JSON.stringify(data));
}

async function start(page, context, info, lang) {
  const file = info.outputPath('shortcuts-fixture.json');
  fixture(file);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript((l) => localStorage.setItem('lang', l), lang);
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = page.locator('details.data');
  if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
  await data.getByLabel(tr(lang)('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: tr(lang)('Replace all data') }).press('Enter');
  await expect(data.getByText(/importiert|Imported/)).toBeVisible();
}

for (const lang of ['de', 'en']) {
  test(`day ride with the shortcuts, ${lang}`, async ({ page, context }, info) => {
    const T = tr(lang);
    const title = `test_data_gtp_ Kurz ${info.project.name} ${lang}`;
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await start(page, context, info, lang);
    let clicks = 0;
    const click = async (loc) => {
      await loc.click();
      clicks++;
    };

    // New → Plan a trip → Standard set; a day ride says the base set stays at home.
    await click(page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }));
    await click(page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }));
    await click(page.getByRole('dialog', { name: T('Plan a new trip') }).getByRole('button', { name: T('Standard set') }));
    const dlg = page.getByRole('dialog', { name: T('New trip') });
    await dlg.getByLabel(T('Name')).fill(title);
    await dlg.getByLabel(T('Start date')).fill(today());
    await expect(dlg).toContainText(T('Your standard set for a day: worn, standard pack and the items "On every trip". The overnight base set comes with 2 days or more.'));
    await click(dlg.getByRole('button', { name: T('Create trip') }));
    await expect(dlg).toBeHidden();
    await expect(page.getByText('test_data_gtp_ Zahnbürste')).toHaveCount(0);

    // Packing day: one tap packs everything and ticks the ready check.
    await click(page.locator('.next .go').filter({ visible: true }).first());
    const day = page.getByRole('dialog', { name: T('Packing day: {title}', { title }) });
    await expect(day.getByRole('button', { name: new RegExp(`^${T('All in, next: {step}', { step: '' })}`) })).toBeVisible();
    await click(day.getByRole('button', { name: T('Everything is packed') }));
    await expect(day).toBeHidden();
    const go = page.locator('.next .go').filter({ visible: true }).first();
    await expect(go).toContainText(T('Next: ride day'));

    // Ride day → End trip and debrief → "All as planned" → save.
    await click(go);
    await click(page.getByRole('button', { name: T('End trip and debrief'), exact: true }));
    await click(page.getByRole('button', { name: new RegExp(T('All as planned: weather, amount, bags')) }));
    await click(page.getByRole('button', { name: T('Save debrief') }));
    await expect(page.getByRole('heading', { name: T('Saved') })).toBeVisible();
    expect(clicks, 'a whole day ride in at most 10 clicks').toBeLessThanOrEqual(10);
    expect(errors).toEqual([]);
  });
}

test('packing day bag by bag and select all in the debrief', async ({ page, context }, info) => {
  const T = tr('de');
  await start(page, context, info, 'de');
  const title = 'test_data_gtp_ Taschen';
  await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).click();
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }).click();
  await page.getByRole('dialog', { name: T('Plan a new trip') }).getByRole('button', { name: T('Standard set') }).click();
  const dlg = page.getByRole('dialog', { name: T('New trip') });
  await dlg.getByLabel(T('Name')).fill(title);
  await dlg.getByLabel(T('Start date')).fill(today());
  await dlg.getByLabel(T('Days')).fill('2');
  await dlg.getByRole('button', { name: T('Create trip') }).click();
  // Two days: the base set comes along (read from the stored trip; the bags start folded).
  await expect.poll(() => page.evaluate((t) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('trips').objectStore('trips').getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result.find((x) => x.title === t)?.entries.some((e) => e.itemId === 'HY90') ?? false); };
    };
  }), title)).toBe(true);

  await page.locator('.next .go').filter({ visible: true }).first().click();
  const day = page.getByRole('dialog', { name: T('Packing day: {title}', { title }) });
  const allIn = new RegExp(`^${T('All in, next: {step}', { step: '' })}`);
  for (let guard = 0; guard < 15 && (await day.getByRole('button', { name: allIn }).count()); guard++) {
    await day.getByRole('button', { name: allIn }).click();
  }
  await expect(day.getByRole('heading', { name: T('Ready check') })).toBeVisible();
  await expect(day.locator('ul.items button[aria-pressed="false"]')).not.toHaveCount(0);
  await day.getByRole('button', { name: T('All done, finish') }).click();
  await expect(day).toBeHidden();
  await expect(page.locator('.next .go').filter({ visible: true }).first()).toContainText(T('Next: ride day'));

  await page.locator('.next .go').filter({ visible: true }).first().click();
  await page.getByRole('button', { name: T('End trip and debrief'), exact: true }).click();
  await page.getByRole('button', { name: T('Next: go through the items') }).click();
  const first = page.locator('section.bag').first();
  await first.getByRole('button', { name: new RegExp(`^${T('None used: {bag}', { bag: '' })}`) }).click();
  const n = await first.locator('li.it').count();
  await expect(first.locator('li.it.unused')).toHaveCount(n);
  await first.getByRole('button', { name: new RegExp(`^${T('All used: {bag}', { bag: '' })}`) }).click();
  await expect(first.locator('li.it.unused')).toHaveCount(0);
});

test('create what the search does not find', async ({ page, context }, info) => {
  const T = tr('de');
  await start(page, context, info, 'de');
  const name = 'test_data_gtp_ Löffel';

  // Top bar search → "Add … as a new item" → the item dialog starts with that name.
  const phone = info.project.name === 'phone';
  if (phone) await page.getByRole('button', { name: T('Search everything') }).click();
  await page.getByRole('searchbox', { name: T('Search everything') }).fill(name);
  await page.getByRole('button', { name: `+ ${T('Add "{q}" as a new item', { q: name })}` }).click();
  await expect(page).toHaveURL(/#\/gear/);
  const item = page.getByRole('dialog').filter({ has: page.getByLabel(T('Name')) }).first();
  await expect(item.getByLabel(T('Name'))).toHaveValue(name);
  await item.getByLabel(T('Category')).selectOption('cook');
  await item.getByRole('button', { name: T('Save') }).click();
  await expect(item).toBeHidden();

  // A trip, then "Add material" → search → "Add … as a new item and pack it".
  await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).click();
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }).click();
  await page.getByRole('dialog', { name: T('Plan a new trip') }).getByRole('button', { name: T('Standard set') }).click();
  const dlg = page.getByRole('dialog', { name: T('New trip') });
  await dlg.getByLabel(T('Name')).fill('test_data_gtp_ Suche');
  await dlg.getByLabel(T('Start date')).fill(today());
  await dlg.getByRole('button', { name: T('Create trip') }).click();
  await page.getByRole('button', { name: T('Add material') }).filter({ visible: true }).first().click();
  const sheet = page.getByRole('dialog', { name: T('Add material') });
  await sheet.getByRole('searchbox', { name: T('Search your gear') }).fill('test_data_gtp_ Becher');
  await sheet.getByRole('button', { name: `+ ${T('Add "{q}" as a new item and pack it', { q: 'test_data_gtp_ Becher' })}` }).click();
  const nd = page.getByRole('dialog').filter({ has: page.getByLabel(T('Name')) }).last();
  await expect(nd.getByLabel(T('Name'))).toHaveValue('test_data_gtp_ Becher');
  await nd.getByLabel(T('Category')).selectOption('cook');
  await nd.getByRole('button', { name: T('Save') }).click();
  await expect(nd).toBeHidden();
  await sheet.getByRole('button', { name: T('Done') }).click();
  await expect(page.getByText('test_data_gtp_ Becher').first()).toBeVisible();
  // An item that already exists is packed, not made twice.
  await page.getByRole('button', { name: T('Add material') }).filter({ visible: true }).first().click();
  await sheet.getByRole('searchbox', { name: T('Search your gear') }).fill(name);
  await expect(sheet.getByText(name).first()).toBeVisible();
  await expect(sheet.locator('button.create')).toHaveCount(0);
});
