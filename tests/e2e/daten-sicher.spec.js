// P3b «Daten sicher» (Noah 15.10.2026 «1a», rules 3a and 5a; Dokumente «1a»), on a phone and a computer,
// in German. Fictional data only (tests/e2e/v048-fixture.js, a made-up one-page PDF).
// 1. Daten und Backup: the dot «Vom Browser behalten», the section «Handy und Computer».
// 2. «Alle Daten ersetzen» on a device with data asks a second time and keeps a copy («Vor einem Import»);
//    the suggestion itself is checked in tests/datensicher.test.js (this fixture has no change time).
// 3. Ich › Dokumente: add a PDF, set «gültig bis» and «In die Packliste»; the overview shows the reminder
//    and «ID und Cash dabei?».
// 4. Rule 3a: a window closed with ✕ keeps the typed text; «Verwerfen» takes it back; a tap beside closes.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { v048File } from './v048-fixture.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');

async function start(page, context, info) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  // The PDF viewer frame has no localStorage (null): skip it there, or the test's own script throws
  // «Cannot read properties of null (reading 'getItem')» and the error check fails.
  await context.addInitScript(() => {
    let store = null;
    try { store = window.localStorage; } catch { return; }
    if (!store) return;
    if (!store.getItem('lang')) store.setItem('lang', 'de');
    if (!store.getItem('whatsnew.seen')) store.setItem('whatsnew.seen', '9.9.9');
  });
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(v048File(info));
  // an empty device has nothing to lose: no second question
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return { errors, data };
}

test('Data and backup: kept by the browser, phone and computer, the second question and the copy', async ({ page, context }, info) => {
  const { errors } = await start(page, context, info);
  await page.goto('./#/me/data');
  const main = page.locator('main');
  await expect(main.getByText(T('Kept by the browser'))).toBeVisible();
  const sync = main.locator('[data-section="sync"]');
  await expect(sync.getByRole('heading', { name: T('Phone and computer') })).toBeVisible();
  await expect(sync.getByText(/Letzter Austausch per Datei auf diesem Gerät/)).toBeVisible(); // the first import was an exchange
  await expect(sync.getByRole('button', { name: T('Open backup') })).toBeVisible();

  // the same file again: now there is data here
  await main.getByLabel(T('Import backup')).setInputFiles(v048File(info));
  await main.getByRole('button', { name: T('Replace all data') }).click();
  const sure = main.getByRole('group', { name: T('Really replace all data?') });
  await expect(sure).toBeVisible();
  await sure.getByRole('button', { name: T('Back|note') }).click();
  await expect(sure).toHaveCount(0);
  await main.getByRole('button', { name: T('Replace all data') }).click();
  await sure.getByRole('button', { name: T('Yes, replace all') }).click();
  await settle(page);
  await expect(main.getByText(T('The state before is kept as a copy under «Before updates».'))).toBeVisible();
  const copy = main.locator('[data-section="before-updates"] [data-snapshot="import"]');
  await expect(copy).toHaveCount(1);
  await expect(copy).toContainText(T('Before an import'));
  await expect(sync.getByText(/Letzter Austausch per Datei auf diesem Gerät/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

test('Me - Documents: add a PDF, valid until with a reminder, in the packing list', async ({ page, context }, info) => {
  const { errors } = await start(page, context, info);
  await page.goto('./#/me');
  await page.locator('main').getByRole('link', { name: new RegExp(T('Documents')) }).click();
  await expect(page).toHaveURL(/#\/me\/docs$/);
  const main = page.locator('main');
  await expect(main.getByRole('heading', { level: 1, name: T('Documents') })).toBeVisible();
  await expect(main.getByText(T('No documents yet'))).toBeVisible();
  await main.getByLabel(T('Add PDF')).first().setInputFiles({ name: 'Identitaetskarte Muster.pdf', mimeType: 'application/pdf', buffer: PDF });
  await expect(page).toHaveURL(/#\/me\/docs\/doc-/);
  await expect(main.getByRole('heading', { level: 1, name: 'Identitaetskarte Muster' })).toBeVisible();
  await main.getByLabel(T('Group')).selectOption('IDs');
  // valid until: 5 months from today, inside the 6 months of the reminder
  const until = await page.evaluate(() => {
    const d = new Date();
    const m = new Date(d.getFullYear(), d.getMonth() + 5, 15);
    return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
  });
  await main.getByLabel(T('Valid until')).fill(until);
  await main.getByLabel(T('Valid until')).blur();
  await expect(main.getByText(/Erinnerung ab/)).toBeVisible();
  await main.getByRole('switch').check();
  await expect(main.getByRole('switch')).toBeChecked();
  await main.getByRole('navigation', { name: T('Path') }).getByRole('link', { name: T('Documents') }).click();
  await expect(page).toHaveURL(/#\/me\/docs$/);
  await expect(main.getByRole('heading', { name: T('IDs') })).toBeVisible();
  await expect(main.locator('[data-doc-reminders]')).toContainText(T('Renew {name}', { name: 'Identitaetskarte Muster' }));
  const pack = main.locator('[data-doc-pack]');
  await expect(pack).toContainText(T('ID and cash with you?'));
  await expect(pack.getByRole('link', { name: T('See {name}', { name: 'Identitaetskarte Muster' }) })).toBeVisible();
  // Ich says it in the line of «Dokumente»
  await page.goto('./#/me');
  await expect(page.locator('main').getByRole('link', { name: new RegExp(T('{n} expires soon', { n: 1 })) })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

test('rule 3a: closing keeps the typed text, Discard takes it back, a tap beside closes', async ({ page, context }, info) => {
  const { errors } = await start(page, context, info);
  await page.goto('./#/inspiration');
  const main = page.locator('main');
  const url = 'https://example.org/test-rig';
  await main.getByPlaceholder(T('Paste a link, e.g. bikepacking.com/…')).first().fill(url);
  // the form's button («Was hier steht» on Inspiration has a jump mark with the same words)
  await main.locator('#if-add').getByRole('button', { name: T('Add link|insp') }).click();
  const dlg = page.getByRole('dialog', { name: T('Add link|insp') });
  await expect(dlg).toBeVisible();
  const title = dlg.getByLabel(T('Title: what do you call it?'));
  await title.fill('Test Jura Runde');
  await dlg.getByRole('button', { name: T('Close') }).click();
  await expect(dlg).toHaveCount(0);
  // the same link again: the title is back
  await main.getByPlaceholder(T('Paste a link, e.g. bikepacking.com/…')).first().fill(url);
  // the form's button («Was hier steht» on Inspiration has a jump mark with the same words)
  await main.locator('#if-add').getByRole('button', { name: T('Add link|insp') }).click();
  await expect(title).toHaveValue('Test Jura Runde');
  const bar = dlg.locator('[data-kept-bar]');
  await expect(bar).toContainText(T('Your text from before is back.'));
  await bar.getByRole('button', { name: T('Discard') }).click();
  await expect(title).toHaveValue('');
  await expect(bar).toHaveCount(0);
  // a tap beside the window closes it
  await title.fill('Test zweiter Versuch');
  await page.mouse.click(2, 2);
  await expect(dlg).toHaveCount(0);
  await main.getByPlaceholder(T('Paste a link, e.g. bikepacking.com/…')).first().fill(url);
  // the form's button («Was hier steht» on Inspiration has a jump mark with the same words)
  await main.locator('#if-add').getByRole('button', { name: T('Add link|insp') }).click();
  await expect(title).toHaveValue('Test zweiter Versuch');
  expect(errors).toEqual([]);
});
