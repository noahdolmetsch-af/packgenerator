// Paket «Reste» (21.10.2026), German UI, fictional data only (test_data_gtp_):
// - #194 Downhill: «Bikepark-Tage» is on from the start; a day with park, runs (+) and the protection check,
//   the line on top counts it; delete with Undo.
// - #1038 Packen on a big screen: «Alle Taschen nebeneinander» shows every bag as a column; a tick in any
//   column counts; the switch is remembered; on a phone the switch is not there.
// - #1041 Neue Tour: an empty name shows its message at the field (ui/Field), the dialog stays open.
// - #1152 Notizen: an .odt, .ods and .rtf file are read in the app; an old .doc says how to open it.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { BLOCK_NAMES } from '../../src/lib/sportsbase.js';
import { settle, importAndSettle } from './settle.js';
import { newButton } from './newbutton.js';
import { prep, newNote, noSideScroll, zip } from './notes-helpers.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const PACKING = 'test_data_gtp_trip27';

async function plain(page, context) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  await settle(page);
  return errors;
}

test('Downhill: a bike park day with park, runs and the protection check, deleted with Undo', async ({ page, context }) => {
  const errors = await plain(page, context);
  page.on('dialog', (d) => { throw new Error(`browser dialog: ${d.message()}`); });
  await page.goto('./#/flow/sport/trip%3Adownhill');
  const block = page.locator('[data-block="parkdays"]');
  await expect(block.getByRole('heading', { name: T(BLOCK_NAMES.parkdays) })).toBeVisible();
  await expect(block).toContainText(T('No bike park day yet.'));
  await expect(block.locator('[data-park-check]')).toContainText(T('Protection check: no list yet'));

  await block.locator('[data-add="parkday"]').click();
  await block.locator('[data-park-name]').fill('test_data_gtp_ Talpark');
  for (let i = 0; i < 3; i++) await block.locator('[data-park-plus]').click();
  await expect(block.locator('[data-park-runs]')).toHaveValue('3');
  await block.locator('[data-park-checked]').click();
  await block.getByRole('button', { name: T('Save'), exact: true }).click();

  const row = block.locator('li[data-entry="test_data_gtp_ Talpark"]');
  await expect(row).toContainText(T('{n} runs', { n: 3 }));
  await expect(row).toContainText(T('protection checked'));
  await expect(block.locator('[data-park-stats]')).toContainText(T('{n} day this year', { n: 1 }));

  await row.getByRole('button', { name: T('Delete «{name}»', { name: 'test_data_gtp_ Talpark' }) }).click();
  await page.locator('dialog[open]').getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect(row).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(row).toBeVisible();
  expect(errors).toEqual([]);
});

test('Packen on a big screen: all bags side by side, a tick in any column counts, the switch is kept', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.clock.setFixedTime(new Date('2026-10-12T10:00:00+02:00'));
  await page.goto('./');
  await importAndSettle(page, FIX);
  await page.evaluate((x) => localStorage.setItem('pack.currentTrip', x), PACKING);
  await page.goto('./#/pack?day');
  await page.reload();
  const bags = page.getByRole('region', { name: T('Bags'), exact: true });
  await expect(bags).toBeVisible();
  const sw = page.locator('[data-pack-side]');
  if (info.project.name === 'phone') {
    await expect(sw).toHaveCount(0);
    return;
  }
  await sw.click();
  const board = page.locator('[data-pack-board]');
  await expect(board).toBeVisible();
  const cols = board.locator('[data-board-bag]');
  expect(await cols.count()).toBeGreaterThan(1);
  // the columns stand next to each other
  const a = await cols.nth(0).boundingBox();
  const b = await cols.nth(1).boundingBox();
  expect(Math.abs(a.y - b.y)).toBeLessThan(4);
  expect(b.x).toBeGreaterThan(a.x + a.width - 1);
  // a tick in the second column counts
  const count = () => board.locator('.packed-count').textContent().then((s) => Number(s.match(/\d+/)[0]));
  const before = await count();
  await cols.nth(1).locator('button.it[aria-pressed="false"]').first().click();
  await expect.poll(count).toBe(before + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  // kept after a reload, and «Eine Tasche nach der anderen» goes back
  await page.reload();
  await expect(page.locator('[data-pack-board]')).toBeVisible();
  await page.locator('[data-pack-side]').click();
  await expect(page.locator('[data-pack-board]')).toHaveCount(0);
  await expect(page.locator('section.pbag.cur')).toBeVisible();
  expect(errors).toEqual([]);
});

test('New trip: an empty name shows its message at the field and the dialog stays open', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  await importAndSettle(page, FIX);
  await page.goto('./#/');
  await (await newButton(page, T('New'))).click();
  await page.locator('dialog.new').getByRole('button', { name: new RegExp(`^${T('Plan a trip')}`) }).click();
  const dlg = page.locator('dialog.trip-dlg');
  await expect(dlg).toBeVisible();
  const name = dlg.getByRole('textbox', { name: T('Name') });
  await name.fill('');
  await dlg.getByRole('button', { name: new RegExp(`^${T('Create trip')}`) }).click();
  await expect(dlg.locator('[data-field="tn-name"] .fieldmsg')).toHaveText(T('Give the trip a name.'));
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(name).toBeFocused();
  await expect(dlg.locator('.err')).toHaveText(T('{n} entry is missing or wrong. It is marked in red.', { n: 1 }));
  // typing takes the message away again
  await name.fill('test_data_gtp_ Reste-Tour');
  await expect(dlg.locator('[data-field="tn-name"] .fieldmsg')).toHaveCount(0);
  await expect(dlg.locator('.err')).toHaveText('');
  expect(errors).toEqual([]);
});

const ODT = zip({
  mimetype: 'application/vnd.oasis.opendocument.text',
  'content.xml': '<?xml version="1.0"?><office:document-content><office:body><office:text><text:h text:outline-level="1">Packliste Reste</text:h><text:p>Zelt und <text:span>Kocher</text:span></text:p></office:text></office:body></office:document-content>',
});
const ODS = zip({
  mimetype: 'application/vnd.oasis.opendocument.spreadsheet',
  'content.xml': '<?xml version="1.0"?><office:document-content><office:body><office:spreadsheet><table:table table:name="Etappen"><table:table-row><table:table-cell><text:p>Tag</text:p></table:table-cell><table:table-cell><text:p>km</text:p></table:table-cell></table:table-row><table:table-row><table:table-cell><text:p>Delémont</text:p></table:table-cell><table:table-cell office:value="58"><text:p>58</text:p></table:table-cell></table:table-row></table:table></office:spreadsheet></office:body></office:document-content>',
});
const RTF = '{\\rtf1\\ansi{\\fonttbl{\\f0 Arial;}}\\f0 Gr\\\'fcezi aus dem \\b Jura\\b0\\par Zweite Zeile\\par}';

test('LibreOffice and RTF files are read in the note; an old .doc says how to open it', async ({ page, context }) => {
  const errors = await prep(page, context);
  const sheet = await newNote(page, 'test_data_gtp_ Reste-Dateien\nalte Formate');
  await sheet.locator('[data-add-file]').setInputFiles([
    { name: 'packliste.odt', mimeType: 'application/vnd.oasis.opendocument.text', buffer: ODT },
    { name: 'etappen.ods', mimeType: 'application/vnd.oasis.opendocument.spreadsheet', buffer: ODS },
    { name: 'gruss.rtf', mimeType: 'application/rtf', buffer: Buffer.from(RTF, 'latin1') },
    { name: 'alt.doc', mimeType: 'application/msword', buffer: Buffer.from('not a real word file') },
  ]);
  await expect(sheet.locator('[data-note-files] li')).toHaveCount(4, { timeout: 30_000 });
  const fv = page.locator('dialog[data-file-view]');
  const close = () => fv.getByRole('button', { name: T('Close') }).last().click();

  await sheet.locator('[data-note-file="odt"] .fo').click();
  await expect(fv.locator('[data-file-md] h1, [data-file-md] h2, [data-file-md] h3').first()).toHaveText('Packliste Reste');
  await expect(fv.locator('[data-file-md]')).toContainText('Zelt und Kocher');
  await close();
  await sheet.locator('[data-note-file="ods"] .fo').click();
  await expect(fv.locator('[data-file-table]')).toContainText('Delémont');
  await close();
  await sheet.locator('[data-note-file="rtf"] .fo').click();
  await expect(fv).toContainText('Grüezi aus dem Jura');
  await expect(fv).not.toContainText('fonttbl');
  await close();
  await sheet.locator('[data-note-file="office"] .fo').click();
  await expect(fv.locator('[data-file-oldoffice]')).toBeVisible();
  await close();
  await noSideScroll(page);
  expect(errors).toEqual([]);
});
