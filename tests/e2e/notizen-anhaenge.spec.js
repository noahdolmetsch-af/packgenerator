// Paket NE «Notizen wie Evernote», part 2 (Noah 20.10.2026 «7a 8a», formats «Alle»): files on a note,
// read in the app: PDF (pages and searchable text), Word, Excel/CSV, GPX map, calendar and contact with
// «into my calendar / contacts», a web page kept offline (the server answer is faked), a scan straight
// into the note. In German, on a phone and a computer; no sideways scroll, no page errors. Fictional data only.
import { test, expect } from './clock.js';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import DE from '../../src/lib/i18n/de/index.js';
import { png, prep, newNote, storedNote, noSideScroll, zip } from './notes-helpers.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

async function pdfWith(text) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.addPage([400, 300]).drawText(text, { x: 40, y: 200, size: 18, font });
  doc.addPage([400, 300]).drawText('Seite zwei', { x: 40, y: 200, size: 18, font });
  return Buffer.from(await doc.save());
}
const DOCX = zip({
  '[Content_Types].xml': '<?xml version="1.0"?><Types/>',
  'word/document.xml': '<?xml version="1.0"?><w:document><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Packliste Jura</w:t></w:r></w:p><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Zelt</w:t></w:r><w:r><w:t> und Kocher</w:t></w:r></w:p></w:body></w:document>',
});
const XLSX = zip({
  'xl/workbook.xml': '<workbook><sheets><sheet name="Etappen" sheetId="1"/></sheets></workbook>',
  'xl/sharedStrings.xml': '<sst><si><t>Tag</t></si><si><t>km</t></si><si><t>Saignelégier</t></si></sst>',
  'xl/worksheets/sheet1.xml': '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row><row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>64</v></c></row></sheetData></worksheet>',
});
const GPX = '<?xml version="1.0"?><gpx version="1.1"><trk><trkseg><trkpt lat="47.2" lon="7.0"/><trkpt lat="47.25" lon="7.05"/><trkpt lat="47.3" lon="7.1"/></trkseg></trk></gpx>';
const ICS = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:x1\r\nDTSTART;VALUE=DATE:20261107\r\nSUMMARY:test_data_gtp_ Gravelrennen\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
const VCF = 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:test_data_gtp_ Velo Werkstatt\r\nTEL:+41 00 000 00 00\r\nEND:VCARD\r\n';

test('files on a note: PDF, Word, Excel, GPX, calendar, contact; the search finds what is in them', async ({ page, context }) => {
  const errors = await prep(page, context);
  const sheet = await newNote(page, 'test_data_gtp_ Unterlagen\nfür die Tour');
  await sheet.locator('[data-add-file]').setInputFiles([
    { name: 'rechnung.pdf', mimeType: 'application/pdf', buffer: await pdfWith('Bremsbelag Shimano') },
    { name: 'packliste.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: DOCX },
    { name: 'etappen.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: XLSX },
    { name: 'runde.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(GPX) },
    { name: 'rennen.ics', mimeType: 'text/calendar', buffer: Buffer.from(ICS) },
    { name: 'werkstatt.vcf', mimeType: 'text/vcard', buffer: Buffer.from(VCF) },
  ]);
  const files = sheet.locator('[data-note-files] li');
  await expect(files).toHaveCount(6, { timeout: 30_000 });
  await noSideScroll(page);

  // PDF: the pages are drawn
  await sheet.locator('[data-note-file="pdf"] .fo').click();
  const fv = page.locator('dialog[data-file-view]');
  await expect(fv.locator('[data-file-pdf] canvas')).toHaveCount(2, { timeout: 20_000 });
  await fv.getByRole('button', { name: T('Close') }).last().click();
  // Word as text
  await sheet.locator('[data-note-file="docx"] .fo').click();
  await expect(fv.locator('[data-file-md] h3')).toHaveText('Packliste Jura');
  await expect(fv.locator('[data-file-md] strong')).toHaveText('Zelt');
  await fv.getByRole('button', { name: T('Close') }).last().click();
  // Excel as a table
  await sheet.locator('[data-note-file="xlsx"] .fo').click();
  await expect(fv.locator('[data-file-table] td').first()).toHaveText('Saignelégier');
  await fv.getByRole('button', { name: T('Close') }).last().click();
  // GPX as a small map
  await sheet.locator('[data-note-file="gpx"] .fo').click();
  await expect(fv.locator('[data-file-map] svg')).toBeVisible();
  await fv.getByRole('button', { name: T('Close') }).last().click();
  // calendar: the event and «into my calendar»
  await sheet.locator('[data-note-file="ics"] .fo').click();
  await expect(fv.locator('[data-file-ics] li')).toContainText('Gravelrennen');
  const dl = page.waitForEvent('download');
  await fv.locator('[data-ics-open]').click();
  expect((await dl).suggestedFilename()).toMatch(/\.ics$/);
  await fv.getByRole('button', { name: T('Close') }).last().click();
  // contact: «into the note» adds its lines under the text
  await sheet.locator('[data-note-file="vcf"] .fo').click();
  await expect(fv.locator('[data-file-vcf] li')).toContainText('Velo Werkstatt');
  await fv.locator('[data-vcf-note]').click();
  await fv.getByRole('button', { name: T('Close') }).last().click();
  await noSideScroll(page);
  await sheet.getByRole('button', { name: T('Done'), exact: true }).click();

  await expect.poll(async () => ((await storedNote(page, 'Unterlagen'))?.atts ?? []).length).toBe(6);
  const n = await storedNote(page, 'Unterlagen');
  expect(n.atts.find((f) => f.fmt === 'pdf').text).toContain('Bremsbelag');
  expect(n.text).toContain('Velo Werkstatt');
  // the files are not in Ich › Dokumente, but the search of the notes finds the text of the PDF
  await page.locator('input[type="search"]').first().fill('bremsbelag');
  await expect(page.locator('li.ncard', { hasText: 'Unterlagen' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('a web page is kept as readable text with its pictures; it opens offline', async ({ page, context }) => {
  const errors = await prep(page, context);
  const pic = png(120, 80);
  await context.route(/packgen-three\.vercel\.app\/api\/linkcheck\?read=/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ url: 'https://example.org/tour', html: '<html><head><title>Jura im Herbst</title></head><body><nav>Menü</nav><article><h1>Jura im Herbst</h1><p>Drei Tage auf Schotter.</p><img src="/bild.png"><p>Zelten am Doubs.</p></article></body></html>' }) }),
  );
  await context.route(/packgen-three\.vercel\.app\/api\/linkcheck\?img=/, (route) => route.fulfill({ status: 200, contentType: 'image/png', headers: { 'access-control-allow-origin': '*' }, body: pic }));
  const sheet = await newNote(page, 'test_data_gtp_ Lesen\nhttps://example.org/tour');
  await sheet.locator('[data-keep-page]').click();
  await expect(sheet.locator('[data-note-file="web"]')).toHaveCount(1, { timeout: 20_000 });
  await context.setOffline(true);
  await sheet.locator('[data-note-file="web"] .fo').click();
  const fv = page.locator('dialog[data-file-view]');
  await expect(fv.locator('[data-file-web]')).toContainText('Drei Tage auf Schotter.');
  await expect(fv.locator('[data-file-web]')).not.toContainText('Menü');
  await expect(fv.locator('[data-file-web] img')).toHaveCount(1);
  await context.setOffline(false);
  expect(errors).toEqual([]);
});

test('scan straight into a note: the pages come back as a PDF of the note', async ({ page, context }) => {
  const errors = await prep(page, context);
  const sheet = await newNote(page, 'test_data_gtp_ Quittung\nVelo-Service');
  await sheet.locator('[data-add-scan]').click();
  await expect(page).toHaveURL(/#\/me\/docs\/scan\?note=/);
  await expect(page.locator('[data-scan-note]')).toHaveCount(0);
  await page.locator('input[type="file"][accept="image/*"]:not([capture])').first().setInputFiles({ name: 'seite.png', mimeType: 'image/png', buffer: png(600, 800) });
  await expect(page.locator('[data-scan-note]')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: T('Save as PDF') }).click();
  await expect(page).toHaveURL(/#\/notes/, { timeout: 60_000 });
  await expect(page.locator('dialog.nsheet [data-note-file="pdf"]')).toHaveCount(1);
  // not in Ich › Dokumente
  const docsRows = await page.evaluate(
    () =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const g = r.result.transaction('docs').objectStore('docs').getAll();
          g.onsuccess = () => ok(g.result.map((d) => d.noteId ?? null));
        };
      }),
  );
  expect(docsRows.every((x) => x)).toBe(true);
  expect(errors).toEqual([]);
});
