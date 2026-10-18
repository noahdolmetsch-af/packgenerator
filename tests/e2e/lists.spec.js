// v0.134.0 «Listen und Typen» (mockups LI1–LI4, Noah «LI1–LI4 freigegeben» 14.10.2026, «a»: the
// categories first): Ich › Die App › Listen und Typen (LI1), the list Kategorien (LI2: arrows, eye,
// pen, own category, back to Standard), the window of one entry (LI3: rename, symbol, hide, delete with
// the number of items) and «Liste bearbeiten» in Material › Sortieren und filtern (LI4). The changes
// reach Material at once and stay in the backup (settings «listOverrides»). Fictional fixture only.
import { test, expect } from '@playwright/test';
import { pickLook } from './gear-look.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const FIXTURE = fileURLToPath(new URL('./fixture.json', import.meta.url));
// the Standard categories, read from their one home (gear.js imports the app's i18n, which only runs in the app)
const GEAR = readFileSync(fileURLToPath(new URL('../../src/lib/gear.js', import.meta.url)), 'utf8');
const STD_CATEGORIES = [...GEAR.slice(GEAR.indexOf('STD_CATEGORIES'), GEAR.indexOf('export const CATEGORIES')).matchAll(/\{ key: '(\w+)', name: '([^']+)'/g)].map(([, key, name]) => ({ key, name }));
const items = JSON.parse(readFileSync(FIXTURE, 'utf8')).tables.items;
const cat = (key) => STD_CATEGORIES.find((c) => c.key === key);
// two categories the fixture uses, read from the app
const A = cat(items[0].category);
const B = cat(items.find((i) => i.category !== A.key).category);
const nOf = (key) => items.filter((i) => i.category === key).length;

async function start(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(FIXTURE);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert|Imported/)).toBeVisible();
}
const overrides = (page) =>
  page.evaluate(() => new Promise((done, fail) => {
    const req = indexedDB.open('pack-generator');
    req.onerror = fail;
    req.onsuccess = () => {
      const get = req.result.transaction('settings').objectStore('settings').get('listOverrides');
      get.onsuccess = () => { req.result.close(); done(get.result?.value ?? {}); };
    };
  }));
const row = (page, key) => page.locator(`main li[data-id="${key}"]`);

test('LI1 + LI2 + LI3: rename, symbol, hide, own category and back to Standard reach Material', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/me');
  await page.locator('main').getByRole('link', { name: new RegExp(T('Lists and types')) }).click();
  await expect(page.getByRole('heading', { level: 1, name: T('Lists and types') })).toBeVisible();
  const catRow = page.locator('main').getByRole('link', { name: new RegExp(T('Categories')) });
  await expect(catRow).toContainText(T('Standard'));
  await catRow.click();
  await expect(page.getByRole('heading', { level: 1, name: T('Categories') })).toBeVisible();
  await expect(row(page, A.key)).toContainText(nOf(A.key) === 1 ? T('{n} item', { n: 1 }) : T('{n} items', { n: nOf(A.key) }));

  // LI3: rename A and give it another symbol
  await row(page, A.key).getByRole('button', { name: T('Edit: {name}', { name: T(A.name) }) }).click();
  const sheet = page.getByRole('dialog', { name: T('Edit category') });
  await expect(sheet).toContainText(T('Standard name: «{name}». Your name only applies for you.', { name: T(A.name) }));
  await sheet.getByLabel(T('Name')).fill('test_data_gtp_ Strom');
  await sheet.getByRole('radio', { name: T('Heart|symbol') }).click();
  await sheet.getByRole('button', { name: T('Save') }).click();
  await expect(row(page, A.key)).toContainText('test_data_gtp_ Strom');
  await expect(row(page, A.key)).toContainText(T('Adapted'));
  expect((await overrides(page)).categories).toMatchObject({ names: { [A.key]: 'test_data_gtp_ Strom' }, icons: { [A.key]: 'Heart' } });

  // LI2: B one step up, then hidden with the eye
  const before = await page.locator('main li[data-id]').evaluateAll((els) => els.map((e) => e.dataset.id));
  const iB = before.indexOf(B.key);
  if (iB > 0) {
    await row(page, B.key).getByRole('button', { name: T('Up: {name}', { name: T(B.name) }) }).click();
    await expect.poll(async () => (await page.locator('main li[data-id]').evaluateAll((els) => els.map((e) => e.dataset.id))).indexOf(B.key)).toBe(iB - 1);
  }
  // the eye on the computer; on the phone «Ausblenden» in the window of the entry
  const eye = row(page, B.key).getByRole('button', { name: T('Hide: {name}', { name: T(B.name) }) });
  if (await eye.isVisible()) await eye.click();
  else {
    await row(page, B.key).getByRole('button', { name: T('Edit: {name}', { name: T(B.name) }) }).click();
    await page.getByRole('dialog', { name: T('Edit category') }).getByRole('button', { name: T('Hide') }).click();
  }
  await expect(row(page, B.key)).toContainText(T('Hidden'));

  // own category
  await page.getByRole('button', { name: T('Own category') }).click();
  const own = page.getByRole('dialog', { name: T('Own category') });
  await own.getByLabel(T('Name')).fill('test_data_gtp_ Fotografie');
  await own.getByRole('radio', { name: T('Camera|symbol') }).click();
  await own.getByRole('button', { name: T('Save') }).click();
  await expect(page.locator('main li[data-id]').last()).toContainText('test_data_gtp_ Fotografie');
  await expect(page.locator('main li[data-id]').last()).toContainText(T('Own|entry'));

  // Material: the new name shows, the hidden category is not offered for a new item, the own one is
  await page.goto('./#/gear');
  await settle(page);
  await expect(page.locator('main')).toContainText('test_data_gtp_ Strom');
  await page.locator('main').getByRole('button', { name: T('Add item') }).click();
  const dlg = page.getByRole('dialog', { name: T('Add item') });
  const opts = await dlg.getByLabel(T('Category')).locator('option').allInnerTexts();
  expect(opts).toContain('test_data_gtp_ Fotografie');
  expect(opts).toContain('test_data_gtp_ Strom');
  expect(opts).not.toContain(T(B.name));
  await page.keyboard.press('Escape');

  // back to Standard: everything as the app comes
  await page.goto('./#/me/lists?categories');
  await settle(page);
  await page.getByRole('button', { name: T('Back to Standard|list') }).click();
  await expect(row(page, A.key)).toContainText(T(A.name));
  await expect(page.locator('main li[data-id]')).toHaveCount(STD_CATEGORIES.length);
  await expect.poll(async () => (await overrides(page)).categories).toBeUndefined();
});

test('LI3: delete a Standard category, its items show under «Ohne Kategorie», the reset brings it back', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/me/lists?categories');
  await settle(page);
  await row(page, A.key).getByRole('button', { name: T('Edit: {name}', { name: T(A.name) }) }).click();
  const sheet = page.getByRole('dialog', { name: T('Edit category') });
  await expect(sheet).toContainText(nOf(A.key) === 1 ? T('Delete: {n} item has this category. It then shows under «No category».', { n: 1 }) : T('Delete: {n} items have this category. They then show under «No category».', { n: nOf(A.key) }));
  await sheet.getByRole('button', { name: T('Delete') }).click();
  await expect(row(page, A.key)).toHaveCount(0);
  expect((await overrides(page)).categories.deleted).toEqual([A.key]);

  await page.goto('./#/gear');
  await settle(page);
  await pickLook(page, T('Show as'), T('List')); // Impeccable runde 2: on a phone in «Sort and filter»
  await expect(page.locator('section.cat').filter({ has: page.locator('#gh-other') }).locator('h2')).toContainText(T('Other / unknown category'));

  await page.goto('./#/me/lists?categories');
  await settle(page);
  await page.getByRole('button', { name: T('Back to Standard|list') }).click();
  await expect(row(page, A.key)).toHaveCount(1);
});

test('LI4: «Liste bearbeiten» in Material › Sortieren und filtern opens the list Kategorien', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/gear');
  await settle(page);
  await page.locator('.fbtn').click();
  const fs = page.getByRole('dialog', { name: T('Sort and filter') });
  await fs.getByRole('link', { name: T('Edit list') }).click();
  await expect(page).toHaveURL(/#\/me\/lists\?categories$/);
  await expect(page.getByRole('heading', { level: 1, name: T('Categories') })).toBeVisible();
});

// LI3 «Gilt für» (Noah «2b» 15.10.2026): a category for some trip areas only, read from domains.js
const DOMAINS_SRC = readFileSync(fileURLToPath(new URL('../../src/lib/domains.js', import.meta.url)), 'utf8');
const AREA_NAMES = [...DOMAINS_SRC.matchAll(/^ {4}key: (?:BIKEPACKING|'(\w+)'),\n {4}name: '([^']+)'/gm)].map(([, , name]) => name);

test('LI3 Gilt fuer: a category for some trip areas only, all again stores nothing', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/me/lists?categories');
  await settle(page);
  await row(page, A.key).getByRole('button', { name: T('Edit: {name}', { name: T(A.name) }) }).click();
  const sheet = page.getByRole('dialog', { name: T('Edit category') });
  const group = sheet.getByRole('group', { name: T('Applies to|areas') });
  // every trip area is chosen at first
  expect(AREA_NAMES.length).toBeGreaterThan(2);
  for (const n of AREA_NAMES) await expect(group.getByRole('button', { name: T(n) })).toHaveAttribute('aria-pressed', 'true');
  // keep only the first one
  for (const n of AREA_NAMES.slice(1)) await group.getByRole('button', { name: T(n) }).click();
  // the last one cannot be taken away
  await group.getByRole('button', { name: T(AREA_NAMES[0]) }).click();
  await expect(group.getByRole('button', { name: T(AREA_NAMES[0]) })).toHaveAttribute('aria-pressed', 'true');
  await sheet.getByRole('button', { name: T('Save') }).click();
  await expect(row(page, A.key)).toContainText(T('Only {areas}', { areas: T(AREA_NAMES[0]) }));
  await expect(row(page, A.key)).toContainText(T('Adapted'));
  await expect.poll(async () => Object.values((await overrides(page)).categories?.areas ?? {})).toEqual([[expect.any(String)]]);

  // all areas again: nothing stored, the list is the Standard
  await row(page, A.key).getByRole('button', { name: T('Edit: {name}', { name: T(A.name) }) }).click();
  for (const n of AREA_NAMES.slice(1)) await page.getByRole('dialog', { name: T('Edit category') }).getByRole('group', { name: T('Applies to|areas') }).getByRole('button', { name: T(n) }).click();
  await page.getByRole('dialog', { name: T('Edit category') }).getByRole('button', { name: T('Save') }).click();
  await expect(row(page, A.key)).not.toContainText(T('Only {areas}', { areas: T(AREA_NAMES[0]) }));
  await expect.poll(async () => (await overrides(page)).categories).toBeUndefined();
});
