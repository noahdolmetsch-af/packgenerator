// Paket A (Noah 18.10.2026 «1a»; app rule «every group can be renamed and deleted»): Ich › Dokumente, on a
// phone and a computer, in German. Fictional data only (tests/e2e/v048-fixture.js, a made-up one-page PDF).
// 1. «…» of an own group › «Umbenennen»: the heading and the document change; «Rückgängig» takes it back.
// 2. The default «Importierte PDF» can be renamed (only «Umbenennen», no «Löschen»).
// 3. «…» › «Löschen» asks once, keeps the document (back in the default group); «Rückgängig» restores.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { v048File } from './v048-fixture.js';
import { openData, settle } from './settle.js';
import { groupMenu, renameGroupVia, deleteGroupVia } from './groups.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');

test('Me - Documents: rename and delete a group, with Undo; no document is lost', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  const asked = [];
  page.on('dialog', (d) => {
    asked.push(d.message());
    d.accept();
  });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(v048File(info));
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  asked.length = 0;

  const main = page.locator('main');
  // the «Gruppe» field of one document: the select with «Neue Gruppe …»
  const groupSelect = () => main.locator('select').filter({ has: page.locator('option[value="+"]') });
  const back = () => main.getByRole('navigation', { name: T('Path') }).getByRole('link', { name: T('Documents') }).click();
  await page.goto('./#/me/docs');
  await main.getByLabel(T('Add PDF')).first().setInputFiles({ name: 'Reiseversicherung Muster.pdf', mimeType: 'application/pdf', buffer: PDF });
  await expect(page).toHaveURL(/#\/me\/docs\/doc-/);
  await groupSelect().selectOption('Travel');
  await back();
  await main.getByLabel(T('Add PDF')).first().setInputFiles({ name: 'Garantie Muster.pdf', mimeType: 'application/pdf', buffer: PDF });
  await expect(page).toHaveURL(/#\/me\/docs\/doc-/);
  await back();
  await expect(main.locator('[data-group-help]')).toHaveText(T('Change a group: «…» beside its name › «Rename» or «Delete». Deleting a group keeps its documents.'));

  // 1. rename an own group, then Undo, then again
  const travel = T('Travel|docs'); // «Reisen», not the bike's «Federweg»
  await expect(main.getByRole('heading', { level: 2, name: travel })).toBeVisible();
  await expect(page.getByRole('button', { name: T('More for the group {name}', { name: travel }) })).toHaveCSS('min-height', /^(4[4-9]|[5-9]\d)/);
  const form = await renameGroupVia(page, travel, 'Ferien Muster');
  await expect(form).toHaveCount(0);
  await expect(main.getByRole('heading', { level: 2, name: 'Ferien Muster' })).toBeVisible();
  await expect(main.getByRole('heading', { level: 2, name: travel })).toHaveCount(0);
  const undo = main.locator('[data-group-undo]');
  await expect(undo).toContainText(T('Renamed to «{name}».', { name: 'Ferien Muster' }));
  await undo.getByRole('button', { name: T('Undo') }).click();
  await expect(main.getByRole('heading', { level: 2, name: travel })).toBeVisible();
  await renameGroupVia(page, travel, 'Ferien Muster');
  await expect(main.getByRole('heading', { level: 2, name: 'Ferien Muster' })).toBeVisible();
  // the document itself is in the renamed group
  await main.getByRole('link', { name: /Reiseversicherung Muster/ }).click();
  await expect(page).toHaveURL(/#\/me\/docs\/doc-/);
  await expect(groupSelect()).toHaveValue('Ferien Muster');
  await back();

  // 2. the default group: only «Umbenennen»; the form's buttons are 44 px
  const imported = T('Imported PDFs');
  const items = await groupMenu(page, imported);
  await expect(items).toHaveCount(1);
  await expect(items.first()).toContainText(T('Rename'));
  await items.first().click();
  const rn = page.locator('[data-group-rename]');
  for (const b of await rn.getByRole('button').all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await rn.getByLabel(T('New name of the group')).fill('Scans Muster');
  await rn.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect(main.getByRole('heading', { level: 2, name: 'Scans Muster' })).toBeVisible();
  await expect(main.getByRole('heading', { level: 2, name: imported })).toHaveCount(0);

  // 3. delete the own group: the one delete window of the app (Paket B «Gruppen überall», changed on purpose)
  // asks where the document goes, «back to Scans Muster» chosen first; Undo brings the group back
  await deleteGroupVia(page, 'Ferien Muster');
  const sheet = page.locator('dialog.gds[open]');
  await expect(sheet.getByRole('heading', { name: T('Delete group «{name}»?', { name: 'Ferien Muster' }) })).toBeVisible();
  await expect(sheet.getByRole('radio').first()).toBeChecked();
  await expect(sheet).toContainText(T('PDFs to «{pdf}», photos to «{photo}». No document is deleted.', { pdf: 'Scans Muster', photo: T('Imported photos') }));
  await sheet.getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect(sheet).toHaveCount(0);
  expect(asked).toEqual([]);
  await expect(main.getByRole('heading', { level: 2, name: 'Ferien Muster' })).toHaveCount(0);
  const scans = main.locator('section', { has: page.getByRole('heading', { level: 2, name: 'Scans Muster' }) });
  await expect(scans).toContainText(T('{n} documents', { n: 2 }));
  await expect(main.getByRole('link', { name: /Reiseversicherung Muster/ })).toBeVisible();
  await expect(undo).toContainText(T('Group «{name}» deleted.', { name: 'Ferien Muster' }));
  await undo.getByRole('button', { name: T('Undo') }).click();
  await expect(main.getByRole('heading', { level: 2, name: 'Ferien Muster' })).toBeVisible();
  await expect(scans).toContainText(T('{n} document', { n: 1 }));
  expect(errors).toEqual([]);
});
