// v0.36.0 "Import prüfen" (Noah 1a, 2a, 3b), German UI, phone and desktop:
// choose a fictional gear-import file in "Deine Daten" → the staging page (Schon da / Neu / Unsicher /
// Nicht im Import) → one "Unsicher" decided with a tap → "Alle sicheren übernehmen" → the items are in
// Gear → "Rückgängig" restores everything; archiving a "Nicht im Import" item keeps it (Gone).
// Fictional data only (fixture.json + importgear-fixture.json, test_data_gtp_ names); nothing leaves
// the preview server. (The test title has no umlaut: its output folder holds the fixture file.) V036_SHOTS=<folder> saves screenshots of the staging page there.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData as openDataFold, settle } from './settle.js';

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
  return openDataFold(page);
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
  await settle(page); // the tidy-up after the import done, Today decided
  await expect.poll(async () => (await table(page, 'settings')).some((s) => s.key === MARK.key)).toBe(true);
  await expect(panel.getByRole('dialog')).toHaveCount(0);
}

// SN5 «Seiten neu»: the groups are open sections (data-sec); only «Nicht im Import» is a fold.
const section = (page, key) => page.locator(`[data-sec="${key}"]`);
const tiles = (page) => page.locator('dl.nums dd');
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

  // 2. The staging page: four numbers on top (new, already there, unsure, not in the import), the
  // groups open below; only «Nicht im Import» is folded (SN5 «Seiten neu»).
  await expect(page.getByRole('heading', { level: 1, name: T('Check import') })).toBeVisible();
  const same = section(page, 'same');
  const fresh = section(page, 'fresh');
  const unsure = section(page, 'unsure');
  const notIn = section(page, 'notin');
  await expect(tiles(page)).toHaveText(['2', '2', '1', String(before.length - 3)]);
  expect(await notIn.evaluate((d) => d.open)).toBe(false);
  // New: every item chosen.
  await expect(fresh.getByRole('button', { name: new RegExp(T('Apply {name}', { name: '' })) })).toHaveCount(2);
  for (const b of await fresh.locator('button[aria-pressed]').all()) await expect(b).toHaveAttribute('aria-pressed', 'true');

  // What "Schon da" adds is said quietly; the weight of the app item is not touched.
  await expect(same.locator('li').filter({ hasText: 'Rain jacket' })).toContainText(T('Body zone'));
  await expect(fresh.locator('li').filter({ hasText: 'test_data_gtp_Packraft' }).locator('.badge')).toHaveText([T('Wishlist'), T('Optional')]);

  // One tap decides the unsure one.
  const pick = unsure.getByRole('button', { name: new RegExp(T('Same as {name}', { name: 'Sun cream' })) });
  await pick.click();
  await expect(pick).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('region', { name: T('Unsure') })).toContainText(T('{a} of {b} decided', { a: 1, b: 1 }));

  // No horizontal scroll, also at 320 px on the phone (all groups open).
  const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(await fits()).toBe(true);
  if (info.project.name === 'phone') {
    await unfold(notIn);
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

  // 3. «Übernehmen» (SN5, was «Alle sicheren übernehmen»): the one main action in the head.
  const apply = page.getByRole('button', { name: T('Apply|import'), exact: true });
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
  await expect(tiles(page).nth(2)).toHaveText('1');

  // 6. "Nicht im Import": archive keeps the item (Gear → Gone), with its own undo.
  const ni = section(page, 'notin');
  await unfold(ni);
  await ni.getByRole('button', { name: T('Archive {name}', { name: 'Paperback book' }) }).click();
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === 'LX01')?.ownership).toBe('gone');
  expect((await table(page, 'items')).length).toBe(before.length);
  await ni.getByRole('status').getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === 'LX01')?.ownership).toBe('owned');
});
