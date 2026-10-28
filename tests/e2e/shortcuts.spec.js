// v0.24.0 (Noah, 7.10.2026: "fewer clicks, select all, create what the search does not find").
// A day ride from New to a saved debrief with the shortcuts, and new gear from the searches.
// Fictional fixture plus one test_data_gtp_ base-set item; nothing outside the preview server.
import { test, expect } from '@playwright/test';
import { STEP_BAR as BAR } from '../../src/lib/stepbar.js'; // Schrittleiste (Noah 26.10.2026 «1b», changed on purpose): the bar's short names
import { endToDebrief } from './ending.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

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
  // the start page may still render, and it opens this panel by itself on an empty start: openData waits, then opens it
  const data = await openData(page);
  await data.getByLabel(tr(lang)('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: tr(lang)('Replace all data') }).press('Enter');
  await settle(page); // the tidy-up after the import done, Today decided
  await expect(data.getByText(/importiert|Imported/)).toBeVisible();
}

for (const lang of ['de', 'en']) {
  test(`day ride with the shortcuts, ${lang}`, async ({ page, context }, info) => {
    const T = tr(lang);
    const title = `test_data_gtp_ Kurz ${info.project.name} ${lang}`;
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    // v0.67.0: the ride is over when it is ended (17:00, after the planned ride): ending asks nothing (U22a)
    await page.clock.setFixedTime(new Date(`${today()}T17:00:00+02:00`));
    await start(page, context, info, lang);
    let clicks = 0;
    const click = async (loc) => {
      await loc.click();
      clicks++;
    };

    // New → Plan a trip (v0.30.0: the window starts with the standard set); a day ride says the base set stays at home.
    await click(page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }));
    await click(page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }));
    const dlg = page.getByRole('dialog', { name: T('Conditions|newtrip') });
    await dlg.getByLabel(T('Name')).fill(title);
    await dlg.getByLabel(T('Start date')).fill(today());
    // v0.25.0 (M3): the live "Your packing list" leaves the overnight gear at home (v0.114.0: the whole list in the window).
    await expect(dlg.getByRole('region', { name: T('Your packing list') })).toBeVisible();
    await expect(dlg.getByRole('region', { name: T('Your packing list') })).not.toContainText('test_data_gtp_ Zahnbürste');
    await click(dlg.getByRole('button', { name: T('Create trip') }));
    await expect(dlg).toBeHidden();
    await expect(page.getByText('test_data_gtp_ Zahnbürste')).toHaveCount(0);

    // v0.24.1 (Noah 2a): a day ride packs everything and ticks the ready check in one tap, then
    // goes to On the way; packing bag by bag stays as the "Pack" tab (v0.29.0).
    const go = page.locator('.trip-band .go');
    // 0.182 (Klick-Rundgang H03): nothing packed yet, so the button says «Alles einpacken, los»
    await expect(go).toContainText(T("Pack everything, let's go"));
    await expect(page.getByRole('navigation', { name: T('Steps of this trip') }).getByRole('link', { name: new RegExp(`^${T(BAR.pack)}`) })).toBeVisible();
    await click(go);
    await expect(page).toHaveURL(/#\/ride/);

    // On the way → «Tour abschliessen» → «Tour beendet» → «Alles gut»: the short debrief of a day ride
    // (v0.67.0 «Übergänge 1», Ü5a; before: Next: Debrief → one page → Save).
    // 0.182 (Klick-Rundgang H06): «Losfahren» first records the real start time, then «Tour abschliessen»
    await expect(go).toHaveText(T('Start riding'));
    await click(go);
    await expect(go).toHaveText(T('Finish the trip'));
    await click(go);
    // U004: right after «Losfahren» the planned ride is still ahead, so ending asks once
    const sheet = page.locator('dialog.endsheet');
    await expect(sheet.or(page.getByRole('heading', { level: 1, name: T('Trip ended') })).first()).toBeVisible();
    if (await sheet.isVisible()) await click(sheet.getByRole('button', { name: T('End the trip'), exact: true }));
    await expect(page).toHaveURL(/#\/trip\/[^/]+\/ended$/);
    await click(page.locator('main .mainbar .btn.hi'));
    await expect(page.locator('.celebrate.small')).toContainText(T('Debrief saved'));
    // v0.24.1: 8 clicks; v0.29.0: 7; v0.30.0: 6; 0.182: 8 (New, Plan a trip, Create, Pack everything, Start riding,
    // Finish the trip, End the trip (asked: the ride just started), All good).
    expect(clicks, 'a whole day ride in at most 8 clicks').toBeLessThanOrEqual(8);
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
  const dlg = page.getByRole('dialog', { name: T('Conditions|newtrip') });
  await dlg.getByLabel(T('Name')).fill(title);
  await dlg.getByLabel(T('Start date')).fill(today());
  await dlg.getByRole('button', { name: T('2 days'), exact: true }).click(); // v0.40.0: the days field only after "More"
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
  await expect(go).toContainText(T('Continue to Pack'));
  await go.click();
  await expect(page).toHaveURL(/#\/pack\?day/);
  const whole = page.locator('.pd .pbag.cur').getByRole('button', { name: T('Whole bag packed') });
  await expect(whole).toBeVisible(); // the page is drawn (CI once started the loop before it was)
  for (let guard = 0; guard < 15 && (await whole.count()); guard++) {
    const bag = await page.locator('.pd .pbag.cur .bagh b').textContent();
    await whole.click();
    await expect(page.locator('.pd .pbag.cur .bagh b')).not.toHaveText(bag);
  }
  await expect(page.locator('.pd .pbag.cur')).toContainText(T('Ready check'));
  await expect(page.locator('.pd ul.items button[aria-pressed="false"]')).not.toHaveCount(0);
  // Not everything ticked: the one orange button («Packen abschliessen», v0.67.0) asks first.
  await expect(go).toContainText(T('Finish packing'));
  await go.click();
  const ask = page.locator('dialog.ask');
  await expect(ask).toBeVisible();
  await ask.getByRole('button', { name: T('Go anyway') }).click();
  // two days: the interstitial «Gepackt»; on the start day it leads on to On the way
  await expect(page).toHaveURL(/#\/trip\/[^/]+\/packed$/);
  await page.locator('main .mainbar .btn.hi').click();
  await expect(page).toHaveURL(/#\/ride/);

  await endToDebrief(page, T); // day 1 of 2: «Tour beenden …» asks, then «Tour beendet», the debrief
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
  await page.getByRole('searchbox', { name: T('What do you want to do? Search or say an action') }).fill(name);
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
  const dlg = page.getByRole('dialog', { name: T('Conditions|newtrip') });
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
