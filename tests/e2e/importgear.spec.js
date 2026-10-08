// v0.36.0 "Import prüfen" (Noah 1a, 2a, 3b), German UI, phone and desktop:
// choose a fictional gear-import file in "Deine Daten" → the staging page (Schon da / Neu / Unsicher /
// Nicht im Import) → one "Unsicher" decided with a tap → "Alle sicheren übernehmen" → the items are in
// Gear → "Rückgängig" restores everything; archiving a "Nicht im Import" item keeps it (Gone).
// Fictional data only (fixture.json + importgear-fixture.json, test_data_gtp_ names); nothing leaves
// the preview server. (The test title has no umlaut: its output folder holds the fixture file.) V036_SHOTS=<folder> saves screenshots of the staging page there.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const GEAR = fileURLToPath(new URL('./importgear-fixture.json', import.meta.url));
const MARK = { key: 'test_data_gtp_marker', value: 1 };

const table = (page, name) =>
  page.evaluate((s) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(s).objectStore(s).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);

async function openData(page) {
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  return data;
}

async function start(page, context, info) {
  const file = info.outputPath('base.json');
  const data = structuredClone(base);
  data.tables.settings.push(MARK);
  writeFileSync(file, JSON.stringify(data));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect.poll(async () => (await table(page, 'settings')).some((s) => s.key === MARK.key)).toBe(true);
  await expect(panel.getByRole('dialog')).toHaveCount(0);
}

const section = (page, name) => page.locator('details.sec').filter({ has: page.locator('summary .h', { hasText: new RegExp(`^${name}$`) }) });
async function unfold(sec) {
  if (!(await sec.evaluate((d) => d.open))) await sec.locator('> summary').click();
  await expect.poll(() => sec.evaluate((d) => d.open)).toBe(true);
}

test('Import pruefen (Check import): choose the file, check, apply, see it in Gear, undo', async ({ page, context }, info) => {
  await start(page, context, info);
  const before = await table(page, 'items');

  // 1. The file in "Deine Daten": nothing changes yet, a link to the staging page.
  const panel = await openData(page);
  await panel.locator('input[type=file]').setInputFiles(GEAR);
  const box = panel.getByRole('dialog', { name: T('Check import') });
  await expect(box).toContainText('importgear-fixture.json');
  expect((await table(page, 'items')).length).toBe(before.length);
  await box.getByRole('link', { name: T('Check import') }).click();
  await expect(page).toHaveURL(/#\/gear\/import$/);

  // 2. The staging page: three folded groups with their counts, then "Nicht im Import".
  await expect(page.getByRole('heading', { level: 1, name: T('Check import') })).toBeVisible();
  const same = section(page, T('Already there'));
  const fresh = section(page, T('New'));
  const unsure = section(page, T('Unsure'));
  const notIn = section(page, T('Not in the import'));
  await expect(same.locator('summary .n')).toHaveText('2');
  await expect(fresh.locator('summary .n')).toHaveText('2');
  await expect(unsure.locator('summary .n')).toHaveText('1');
  await expect(notIn.locator('summary .n')).toHaveText(String(before.length - 3));
  for (const s of [same, fresh, unsure, notIn]) expect(await s.evaluate((d) => d.open)).toBe(false);

  // What "Schon da" adds is said quietly; the weight of the app item is not touched.
  await unfold(same);
  await expect(same.locator('li').filter({ hasText: 'Rain jacket' })).toContainText(T('Body zone'));
  await unfold(fresh);
  await expect(fresh.locator('li').filter({ hasText: 'test_data_gtp_Packraft' }).locator('.badge')).toHaveText([T('Wishlist'), T('Optional')]);

  // One tap decides the unsure one.
  await unfold(unsure);
  const pick = unsure.getByRole('button', { name: new RegExp(T('Same as {name}', { name: 'Sun cream' })) });
  await pick.click();
  await expect(pick).toHaveAttribute('aria-pressed', 'true');
  await expect(unsure.locator('summary .s')).toHaveText(T('{a} of {b} decided', { a: 1, b: 1 }));

  // No horizontal scroll, also at 320 px on the phone (all groups open).
  const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(await fits()).toBe(true);
  if (info.project.name === 'phone') {
    await unfold(section(page, T('Not in the import')));
    await page.setViewportSize({ width: 320, height: 700 });
    expect(await fits()).toBe(true);
    await page.setViewportSize({ width: 390, height: 844 });
  }

  const shots = process.env.V036_SHOTS;
  if (shots) {
    mkdirSync(shots, { recursive: true });
    await unfold(notIn);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${shots}/import-pruefen-${info.project.name}.png`, fullPage: true });
  }

  // 3. "Alle sicheren übernehmen": the main (orange) action.
  const apply = page.getByRole('button', { name: T('Apply all safe ones') });
  await expect(apply).toHaveClass(/\bhi\b/);
  await apply.click();
  await expect(page.locator('.done')).toContainText(T('Import applied {when}.', { when: '' }).replace(/\s*\.$/, ''));
  await expect(page.getByRole('button', { name: T('Undo') })).toBeVisible();
  if (shots) await page.screenshot({ path: `${shots}/import-applied-${info.project.name}.png`, fullPage: true });

  const items = await table(page, 'items');
  expect(items.length).toBe(before.length + 2);
  const rain = items.find((i) => i.id === 'RA01');
  const rainBefore = before.find((i) => i.id === 'RA01');
  expect(rain).toMatchObject({ name: rainBefore.name, weightG: rainBefore.weightG, category: rainBefore.category, sourceId: 'T0001', zone: 'torso' });
  expect(items.find((i) => i.id === 'HY01').sourceId).toBe('T0003');
  expect(items.find((i) => i.sourceId === 'T0005').ownership).toBe('wishlist');
  const learnings = await table(page, 'learnings');
  expect(learnings.find((l) => l.sourceId === 'L01')).toMatchObject({ source: 'import', date: '2021-06-12' });

  // 4. In Gear: the new item is there; Gear "•••" leads back to the staging page.
  await page.goto('./#/gear?q=Kompass');
  await expect(page.getByText('test_data_gtp_Kompass').first()).toBeVisible();
  await page.locator('details.gmore > summary').click();
  // The open menu fits the screen (no horizontal scroll).
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (shots) await page.screenshot({ path: `${shots}/gear-menu-${info.project.name}.png` });
  await page.getByRole('link', { name: T('Check import') }).click();
  await expect(page).toHaveURL(/#\/gear\/import$/);

  // 5. "Rückgängig": everything as before, the list waits again.
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect(page.getByRole('status').filter({ hasText: T('Undone: everything is as before the import. The list waits here again.') })).toBeVisible();
  await expect.poll(async () => (await table(page, 'items')).length).toBe(before.length);
  expect(await table(page, 'items')).toEqual(before);
  expect((await table(page, 'learnings')).length).toBe(0);
  await expect(section(page, T('Unsure')).locator('summary .n')).toHaveText('1');

  // 6. "Nicht im Import": archive keeps the item (Gear → Gone), with its own undo.
  const ni = section(page, T('Not in the import'));
  await unfold(ni);
  await ni.getByRole('button', { name: T('Archive {name}', { name: 'Paperback book' }) }).click();
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === 'LX01')?.ownership).toBe('gone');
  expect((await table(page, 'items')).length).toBe(before.length);
  await ni.getByRole('status').getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === 'LX01')?.ownership).toBe('owned');
});
