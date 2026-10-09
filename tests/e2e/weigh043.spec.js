// v0.43.0 "Wiege-Modus und Mehrfachauswahl", German UI, phone and desktop:
// 1. Weigh: Gear's quiet line "… ohne Gewicht · wiegen" opens the weighing mode; the bike without a
//    weight comes first (skipped), then 3 items in the order bags/sleep/outer/rest, one per screen,
//    with the numeric keyboard; Undo brings the last one back; "Fertig" goes back to the list.
// 2. Select 3 items into a new building block, Undo; then again, and in the open building block
//    "Auswählen" removes 2 at once, Undo; in the wardrobe, 2 pieces get a zone at once, Undo.
// Fictional data only (fixture.json + test_data_gtp_ records made here); every outside request is
// blocked. V043_SHOTS=<folder> saves screenshots of the new screens there.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z0-9]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const MARK = { key: 'test_data_gtp_marker', value: 1 };
const P = 'test_data_gtp_';
const SHOTS = process.env.V043_SHOTS;

const item = (id, name, category, f = {}) => ({ id, name: `${P} ${name}`, category, weightG: null, qty: 1, weightStatus: 'missing', carry: 'luggage', defaultBag: 'seat', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...f });

function fixture() {
  const data = structuredClone(base);
  const t = data.tables;
  t.items.push(item('LX91', 'Kissen', 'lux'), item('RA91', 'Windjacke', 'rain'), item('SL91', 'Daunenschlafsack', 'sleep'));
  t.bikes.push({ id: 'bike-gtp-city', name: `${P} Stadtvelo`, weightG: null, slots: [], setup: {}, fixtures: [] });
  t.settings.push(MARK);
  return data;
}

const table = (page, name) =>
  page.evaluate((s) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(s).objectStore(s).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const one = async (page, name, id) => (await table(page, name)).find((x) => x.id === id);

async function start(page, context, info) {
  const file = info.outputPath('base.json');
  writeFileSync(file, JSON.stringify(fixture()));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const panel = page.locator('details.data');
  // The app opens this panel by itself on an empty start: make sure it ends up open (also after the pick).
  const opened = () =>
    expect(async () => {
      if (!(await panel.evaluate((d) => d.open))) await panel.locator('summary').click();
      expect(await panel.evaluate((d) => d.open)).toBe(true);
    }).toPass();
  await opened();
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await opened();
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect.poll(async () => (await table(page, 'settings')).some((s) => s.key === MARK.key)).toBe(true);
  await expect(panel.getByRole('dialog')).toHaveCount(0);
  return errors;
}

async function noSideScroll(page) {
  for (const w of [320, 390]) {
    const size = page.viewportSize();
    await page.setViewportSize({ width: w, height: size.height });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
    await page.setViewportSize(size);
  }
}

async function shot(page, info, name) {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name}.png`, fullPage: false });
}

test('Wiege-Modus: Velo ueberspringen, 3 Teile wiegen, Undo, Fertig', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/gear');
  // The quiet line counts the bike and the 3 items.
  const row = page.getByRole('button', { name: T('{n} without weight · weigh', { n: 4 }) });
  await expect(row).toBeVisible();
  await shot(page, info, 'material-wiegen-zeile');
  await row.click();

  const weigh = page.locator('section.weigh');
  await expect(weigh.getByRole('heading', { name: T('Record weights') })).toBeVisible();
  const pos = weigh.locator('.pos');
  const name = weigh.locator('.name');
  const grams = weigh.getByLabel(T('Weight in grams'));
  await expect(grams).toHaveAttribute('inputmode', 'numeric');
  await expect(pos).toHaveText(T('{a} of {b}|weigh', { a: 1, b: 4 }));
  // The bike first; it is skipped and comes back at the end.
  await expect(name).toHaveText(`${P} Stadtvelo`);
  await expect(weigh.locator('.kind')).toHaveText(T('Bike|weigh'));
  await shot(page, info, 'wiegen-velo');
  await weigh.getByRole('button', { name: T('Skip') }).click();

  // Sleep, then the outer layer (rain wear), then the rest.
  await expect(name).toHaveText(`${P} Daunenschlafsack`);
  await expect(pos).toHaveText(T('{a} of {b}|weigh', { a: 2, b: 4 }));
  await expect(grams).toBeFocused();
  // A wrong value says so and saves nothing.
  await grams.fill('12,5');
  await grams.press('Enter');
  await expect(weigh.getByRole('alert')).toContainText('1 bis 30');
  await grams.fill('980');
  await grams.press('Enter');
  await expect(name).toHaveText(`${P} Windjacke`);
  await expect(page.getByRole('status')).toContainText(T('{name}: {w} saved', { name: `${P} Daunenschlafsack`, w: '980 g' }));
  await grams.fill('210');
  await shot(page, info, 'wiegen-teil');
  await weigh.getByRole('button', { name: T('Save & next') }).click();
  await expect(name).toHaveText(`${P} Kissen`);
  await grams.fill('55');
  await weigh.getByRole('button', { name: T('Save & next') }).click();
  await expect(name).toHaveText(`${P} Stadtvelo`);
  await expect.poll(async () => (await one(page, 'items', 'LX91'))?.weightG).toBe(55);

  // Undo: the pillow is back on screen and without weight.
  await page.getByRole('status').getByRole('button', { name: T('Undo') }).click();
  await expect(name).toHaveText(`${P} Kissen`);
  await expect.poll(async () => (await one(page, 'items', 'LX91'))?.weightG).toBe(null);
  await grams.fill('60');
  await grams.press('Enter');
  await expect(name).toHaveText(`${P} Stadtvelo`);
  await noSideScroll(page);

  expect(await one(page, 'items', 'SL91')).toMatchObject({ weightG: 980, weightStatus: 'measured' });
  expect(await one(page, 'items', 'RA91')).toMatchObject({ weightG: 210, weightStatus: 'measured' });
  expect(await one(page, 'items', 'LX91')).toMatchObject({ weightG: 60, weightStatus: 'measured' });
  expect((await one(page, 'bikes', 'bike-gtp-city')).weightG).toBe(null);

  // Done: back to the list, the quiet line counts only the bike now.
  await weigh.getByRole('button', { name: T('Done') }).first().click();
  await expect(page.getByRole('button', { name: T('{n} without weight · weigh', { n: 1 }) })).toBeVisible();
  // The ••• of the page opens it too.
  await page.getByLabel(T('More for Gear')).click();
  await page.getByRole('button', { name: new RegExp(T('Record weights')) }).click();
  await expect(name).toHaveText(`${P} Stadtvelo`);
  expect(errors).toEqual([]);
});

test('Mehrfachauswahl: 3 Teile in einen Baustein, Undo; im Baustein und im Kleiderschrank', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/gear');
  const PICK = ['Bike computer', 'Front light', 'Multi tool'];
  const ids = ['EL01', 'LI01', 'TO01'];
  const KEY = 'u-test-data-gtp-werkzeug';
  // In the new block or not (the migrations add the built-in keys like standard on their own).
  const setsOf = async () => (await table(page, 'items')).filter((i) => ids.includes(i.id)).map((i) => i.sets.includes(KEY));

  // Calm until "Auswählen": no bar, no boxes.
  await expect(page.getByRole('region', { name: T('Selected items') })).toHaveCount(0);
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.getByRole('button', { name: T('Select'), exact: true }).click();
  // On a phone the categories start folded: "Alle auswählen" per category is not needed, open them.
  if (info.project.name === 'phone') await page.getByRole('button', { name: T('Expand all') }).click();
  for (const n of PICK) await page.getByRole('checkbox', { name: n }).check();
  const bar = page.getByRole('region', { name: T('Selected items') });
  await expect(bar).toContainText(T('{n} selected', { n: 3 }));
  await bar.getByLabel(T('More actions')).click();
  await expect(bar.getByRole('button', { name: T('Area …') })).toBeVisible();
  await shot(page, info, 'auswahl-leiste');
  await noSideScroll(page);
  await bar.getByLabel(T('More actions')).click();
  await bar.getByRole('button', { name: T('Into a building block …') }).click();
  const dlg = page.getByRole('dialog', { name: T('Into a building block') });
  await dlg.getByLabel(T('Name of the new building block')).fill(`${P} Werkzeug`);
  await dlg.getByRole('button', { name: T('Assign'), exact: true }).click();
  await expect(bar.getByRole('status')).toContainText(T('Done: {n} items → {target}', { n: 3, target: `${P} Werkzeug` }));
  await expect.poll(setsOf).toEqual([true, true, true]);
  // One Undo takes all 3 out again (and the new block goes).
  await bar.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(setsOf).toEqual([false, false, false]);
  expect((await table(page, 'settings')).find((s) => s.key === 'sets')).toBeFalsy();

  // Area for the 3 at once ("also this area"), Undo.
  for (const n of PICK) await page.getByRole('checkbox', { name: n }).check();
  await bar.getByLabel(T('More actions')).click();
  await bar.getByRole('button', { name: T('Area …') }).click();
  const adlg = page.getByRole('dialog', { name: T('Area') });
  await adlg.getByLabel(T('Area'), { exact: true }).selectOption('ski');
  await adlg.getByRole('button', { name: T('Assign'), exact: true }).click();
  await expect.poll(async () => (await table(page, 'items')).filter((i) => ids.includes(i.id)).map((i) => i.domains)).toEqual(ids.map(() => ['bikepacking', 'ski']));
  await bar.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await table(page, 'items')).filter((i) => ids.includes(i.id)).map((i) => i.domains)).toEqual(ids.map(() => ['bikepacking']));

  // Again into the block, then in the open block: select 2 and remove them at once, Undo.
  for (const n of PICK) await page.getByRole('checkbox', { name: n }).check();
  await bar.getByRole('button', { name: T('Into a building block …') }).click();
  await dlg.getByLabel(T('Name of the new building block')).fill(`${P} Werkzeug`);
  await dlg.getByRole('button', { name: T('Assign'), exact: true }).click();
  await expect.poll(setsOf).toEqual([true, true, true]);
  await page.goto('./#/blocks');
  const card = page.getByRole('listitem', { name: `${P} Werkzeug` });
  await card.locator('summary').click();
  await card.getByRole('button', { name: T('Select'), exact: true }).click();
  await card.getByRole('checkbox', { name: 'Bike computer' }).check();
  await card.getByRole('checkbox', { name: 'Front light' }).check();
  const bbar = page.getByRole('region', { name: T('Selected items') });
  await expect(bbar).toContainText(T('{n} selected', { n: 2 }));
  await shot(page, info, 'baustein-auswahl');
  await noSideScroll(page);
  await bbar.getByRole('button', { name: T('Remove'), exact: true }).click();
  await expect(bbar.getByRole('status')).toContainText(T('{n} items taken out of {block}.', { n: 2, block: `${P} Werkzeug` }));
  await expect.poll(setsOf).toEqual([false, false, true]);
  await bbar.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(setsOf).toEqual([true, true, true]);
  await bbar.getByRole('button', { name: T('Done') }).click();
  await expect(bbar).toHaveCount(0);

  // The wardrobe: two pieces get the zone Legs at once, Undo.
  await page.goto('./#/wardrobe');
  await page.locator('.bar').getByRole('button', { name: T('Select'), exact: true }).click();
  await page.getByRole('checkbox', { name: 'Arm warmers' }).check();
  await page.getByRole('checkbox', { name: 'Bib shorts' }).check();
  const wbar = page.getByRole('region', { name: T('Selected clothing') });
  await expect(wbar).toContainText(T('{n} selected', { n: 2 }));
  await wbar.getByRole('button', { name: T('Zone …') }).click();
  await shot(page, info, 'kleiderschrank-auswahl');
  await wbar.getByRole('button', { name: T('Legs'), exact: true }).click();
  const zones = async () => (await table(page, 'items')).filter((i) => ['RA02', 'ON01'].includes(i.id)).map((i) => i.zone ?? null);
  await expect.poll(zones).toEqual(['legs', 'legs']);
  await wbar.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(zones).toEqual([null, null]);
  await noSideScroll(page);
  expect(errors).toEqual([]);
});
