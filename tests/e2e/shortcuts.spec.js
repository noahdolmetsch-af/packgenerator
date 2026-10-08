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
    // v0.25.0 (M3): the live "Your packing list" says the overnight gear stays at home.
    await expect(dlg).toContainText(T('Not included: overnight gear, event preparation'));
    await click(dlg.getByRole('button', { name: T('Create trip') }));
    await expect(dlg).toBeHidden();
    await expect(page.getByText('test_data_gtp_ Zahnbürste')).toHaveCount(0);

    // v0.24.1 (Noah 2a): a day ride packs everything and ticks the ready check in one tap, then
    // goes to On the way; packing bag by bag stays as the "Pack" tab (v0.29.0).
    const go = page.locator('.trip-band .go');
    await expect(go).toContainText(T("All packed, let's go"));
    await expect(page.getByRole('navigation', { name: T('Steps of this trip') }).getByRole('link', { name: new RegExp(`^${T('Pack|stage')}`) })).toBeVisible();
    await click(go);
    await expect(page).toHaveURL(/#\/ride/);

    // On the way → Next: Debrief → one page, everything filled in → Save (v0.29.0, Noah 9a).
    await click(go);
    await expect(page).toHaveURL(/#\/debrief\//);
    await click(page.getByRole('button', { name: T('Save debrief') }));
    await expect(page.getByRole('heading', { name: T('Saved') })).toBeVisible();
    // v0.24.1: 8 clicks; v0.29.0: 7 (New, Plan a trip, Standard set, Create, All packed, Next: Debrief, Save).
    expect(clicks, 'a whole day ride in at most 7 clicks').toBeLessThanOrEqual(7);
    info.annotations.push({ type: 'clicks', description: String(clicks) });
    expect(errors).toEqual([]);
  });
}

test('Pack bag by bag with Whole bag packed, and select all in the debrief', async ({ page, context }, info) => {
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

  // v0.29.0 (Noah 6a): Pack is a page; "Whole bag packed" fills a bag and the next one opens by itself.
  const go = page.locator('.trip-band .go');
  await expect(go).toContainText(T('Next: Pack'));
  await go.click();
  await expect(page).toHaveURL(/#\/pack\?day/);
  const whole = page.locator('.pd .pbag.cur').getByRole('button', { name: T('Whole bag packed') });
  for (let guard = 0; guard < 15 && (await whole.count()); guard++) {
    const bag = await page.locator('.pd .pbag.cur .bagh b').textContent();
    await whole.click();
    await expect(page.locator('.pd .pbag.cur .bagh b')).not.toHaveText(bag);
  }
  await expect(page.locator('.pd .pbag.cur')).toContainText(T('Ready check'));
  await expect(page.locator('.pd ul.items button[aria-pressed="false"]')).not.toHaveCount(0);
  // Not everything ticked: the one orange button asks first.
  await expect(go).toContainText(T('Next: On the way'));
  await go.click();
  const ask = page.locator('dialog.ask');
  await expect(ask).toBeVisible();
  await ask.getByRole('button', { name: T('Go anyway') }).click();
  await expect(page).toHaveURL(/#\/ride/);

  await go.click();
  await expect(page).toHaveURL(/#\/debrief\//);
  const fold = page.locator('details.items-fold');
  if (!(await fold.evaluate((d) => d.open))) await fold.locator('summary').click();
  const first = fold.locator('section.bag').first();
  await first.getByRole('button', { name: new RegExp(`^${T('None used: {bag}', { bag: '' })}`) }).click();
  const n = await first.locator('li').count();
  await expect(first.locator('button.state.unused')).toHaveCount(n);
  await first.getByRole('button', { name: new RegExp(`^${T('All used: {bag}', { bag: '' })}`) }).click();
  await expect(first.locator('button.state.unused')).toHaveCount(0);
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
