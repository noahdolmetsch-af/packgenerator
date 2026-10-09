// v0.45.2 (Noah on the bike, 9.10.2026): several problems with one bike from the + menu, sorted by
// the app into a way to fix them (one tap changes it), with Undo. Fictional fixture only.
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

const repairs = (page) =>
  page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('maintenance').objectStore('maintenance').getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result.filter((x) => x.source === 'Problem')); };
    };
  }));
const shots = process.env.SHOTS;

test('three problems for one bike in one go, sorted, changed with one tap, undone', async ({ page, context }, info) => {
  const T = tr('de');
  await start(page, context, info, 'de');
  await page.goto('./#/');
  await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: new RegExp(T('Problem with a bike')) }).click();
  const dlg = page.getByRole('dialog', { name: T('Problem with a bike') });
  await expect(dlg.getByRole('button', { name: 'Test gravel bike' })).toHaveAttribute('aria-pressed', 'true');
  await dlg.getByRole('button', { name: `+ ${T('Too little air in the tyres')}` }).click();
  await dlg.getByRole('button', { name: `+ ${T('Saddle too low')}` }).click();
  const box = dlg.getByLabel(T('What is wrong? One problem per line'));
  await box.press('End');
  await box.pressSequentially('\nSchaltung vorne aufladen');
  // Priority is required: without it nothing is saved.
  await dlg.getByRole('button', { name: T('Save {n} problems', { n: 3 }) }).click();
  await expect(dlg.getByRole('alert')).toHaveText(T('Choose a priority.'));
  await dlg.getByRole('button', { name: T('High'), exact: true }).click();
  await dlg.getByRole('button', { name: T('Before the next ride') }).click();
  if (shots) await page.screenshot({ path: `${shots}/problem-${info.project.name}-1.png`, fullPage: true });
  await dlg.getByRole('button', { name: T('Save {n} problems', { n: 3 }) }).click();
  await expect(dlg.getByText(T('{n} problems saved for {bike}', { n: 3, bike: 'Test gravel bike' }))).toBeVisible();
  let rows = await repairs(page);
  expect(rows.every((r) => r.priority === 'high' && r.beforeRide === true)).toBe(true);
  expect(rows.map((r) => [r.task, r.topic, r.fix, r.bikeId])).toEqual([
    [T('Too little air in the tyres'), 'air', 'self', 'bike-test'],
    [T('Saddle too low'), 'saddle', 'self', 'bike-test'],
    ['Schaltung vorne aufladen', 'battery', 'self', 'bike-test'],
  ]);
  await expect(dlg.getByText(T('Pump to your pressure and check the valve.'))).toBeVisible();
  // One tap: the saddle goes to the bike shop.
  await dlg.getByRole('group', { name: T('How to fix: {task}', { task: T('Saddle too low') }) }).getByRole('button', { name: T('Bike shop') }).click();
  await expect.poll(async () => (await repairs(page)).find((r) => r.topic === 'saddle')?.fix).toBe('shop');
  if (shots) await page.screenshot({ path: `${shots}/problem-${info.project.name}-2.png` });
  await dlg.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await repairs(page)).length).toBe(0);
});
