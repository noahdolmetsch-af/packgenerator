import { describe, it, expect } from 'vitest';
import { detectFormat, formatOf, isNoteFile, sizeText, dataBytes, fileMeta, withFile, withoutFile, allFiles, withOcr, unreadPhotos, ocrOf, pruneOcr, fileWords, csvRows, parseVcf, vcfOf, docxToMd, pptxToMd, slideOrder, xlsxStrings, xlsxSheet, xlsxSheetNames, fitPoints, thinTrack, readableOf, TEXT_MAX } from '../src/lib/notes/files.js';
import { toFit } from '../src/lib/unterwegs/umwandeln.js';
import { noteList, FILTERS } from '../src/lib/notebook.js';
import { setPhotos } from '../src/lib/noteformats.js';
import { publicUrl, makeHandler } from '../api/linkcheck.js';

// Paket NE 1148/1149 «Anhänge und Texterkennung» (Noah 20.10.2026 «7a 8a», formats «Alle»)
describe('the kinds of files', () => {
  it('finds the kind by the ending first, then by the type', () => {
    expect(detectFormat('Plan.DOCX')).toBe('docx');
    expect(detectFormat('x', 'application/pdf')).toBe('pdf');
    expect(detectFormat('IMG_1.HEIC')).toBe('heic');
    expect(detectFormat('runde.fit')).toBe('fit');
    expect(detectFormat('ride.tcx')).toBe('tcx');
    expect(detectFormat('a.ics')).toBe('ics');
    expect(detectFormat('b.vcf')).toBe('vcf');
    expect(detectFormat('clip.mov')).toBe('video');
    expect(detectFormat('liste.csv')).toBe('csv');
    expect(detectFormat('alt.doc')).toBe('office');
    expect(detectFormat('z.bin', '')).toBe('other');
    expect(formatOf('nope').show).toBe('file');
  });
  it('sizes and data URL bytes', () => {
    expect(sizeText(1_500_000)).toBe('1.5 MB');
    expect(sizeText(840_000)).toBe('840 KB');
    expect(dataBytes('data:text/plain;base64,aGFsbG8=')).toBe(5);
    expect(dataBytes('data:text/plain,hallo%20du')).toBe(8);
  });
  it('a docs row of a note is not one of Ich › Dokumente', () => {
    expect(isNoteFile({ noteId: 'n1' })).toBe(true);
    expect(isNoteFile({ kind: 'pdf' })).toBe(false);
  });
});

describe('the files and texts on a note', () => {
  const row = { id: 'f1', name: 'Rechnung.pdf', fmt: 'pdf', mime: 'application/pdf', bytes: 1000, data: 'data:…', text: 'Bremsbelag' };
  it('adds, changes and removes a file entry (never the data on the note)', () => {
    let n = withFile({ id: 'n' }, fileMeta(row));
    expect(n.atts).toEqual([{ id: 'f1', name: 'Rechnung.pdf', fmt: 'pdf', mime: 'application/pdf', bytes: 1000, text: 'Bremsbelag' }]);
    n = withFile(n, { id: 'f1', text: 'neu' });
    expect(n.atts[0].text).toBe('neu');
    expect('atts' in withoutFile(n, 'f1')).toBe(false);
    expect(fileMeta({ ...row, text: 'x'.repeat(TEXT_MAX + 50) }).text.length).toBe(TEXT_MAX);
  });
  it('shows the files that came by mail too; removing one keeps the others', () => {
    const n = { atts: [fileMeta(row)], files: [{ id: 'm1', name: 'ticket.pdf', type: 'application/pdf', size: 20, data: 'data:x' }, { id: 'm2', name: 'gone' }] };
    expect(allFiles(n).map((f) => [f.id, f.fmt, !!f.mail])).toEqual([['f1', 'pdf', false], ['m1', 'pdf', true]]);
    expect(withoutFile(n, 'm1').files.map((f) => f.id)).toEqual(['m2']);
  });
  it('keeps the text read in a photo; a removed photo takes its text away', () => {
    let n = withOcr({ id: 'n' }, 'data:p1', 'Kettenblatt 42');
    n = withOcr(n, 'data:p2', '');
    expect(ocrOf(n, 'data:p1')).toBe('Kettenblatt 42');
    expect(ocrOf(n, 'data:p3')).toBe(null);
    expect(unreadPhotos(n, ['data:p1', 'data:p2', 'data:p3'])).toEqual(['data:p3']);
    expect(Object.keys(pruneOcr(n, ['data:p2']).ocr)).toHaveLength(1);
    expect('ocr' in pruneOcr(n, [])).toBe(false);
    expect(setPhotos({ ...n, photo: 'data:p1', photos: ['data:p2'] }, ['data:p1']).ocr).toEqual({ [Object.keys(n.ocr)[0]]: 'Kettenblatt 42' });
  });
  it('the search of the notes finds the text of files and photos; the filter «File» counts them', () => {
    const notes = [
      { id: 'a', status: 'kept', title: 'Service', text: '', atts: [fileMeta(row)] },
      { id: 'b', status: 'kept', title: 'Foto', text: '', ocr: { x: 'Kettenblatt' } },
      { id: 'c', status: 'kept', title: 'Leer', text: '' },
    ];
    expect(fileWords(notes[0])).toContain('Bremsbelag');
    expect(noteList(notes, { query: 'bremsbelag' }).map((n) => n.id)).toEqual(['a']);
    expect(noteList(notes, { query: 'kettenblatt' }).map((n) => n.id)).toEqual(['b']);
    expect(noteList(notes, { filter: 'file' }).map((n) => n.id)).toEqual(['a']);
    expect(FILTERS.some((f) => f.key === 'file')).toBe(true);
  });
});

describe('readers without a browser', () => {
  it('CSV with semicolons, quotes and line ends', () => {
    expect(csvRows('Tag;km\r\n"Jura; Nord";64\n\nDoubs;51')).toEqual([['Tag', 'km'], ['Jura; Nord', '64'], ['Doubs', '51']]);
    expect(csvRows('a,b\n1,"x ""y"""')).toEqual([['a', 'b'], ['1', 'x "y"']]);
    expect(csvRows('a\tb\n1\t2')).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('vCard: name, phone, mail; back to a small vCard', () => {
    const c = parseVcf('BEGIN:VCARD\nVERSION:3.0\nN:Muster;Anna;;;\nTEL;TYPE=cell:+41 00 000 00 00\nEMAIL:anna@example.org\nORG:Velo AG\nEND:VCARD');
    expect(c).toEqual([{ name: 'Anna Muster', tel: ['+41 00 000 00 00'], email: ['anna@example.org'], org: 'Velo AG', adr: '', note: '', url: '' }]);
    expect(vcfOf(c[0])).toContain('FN:Anna Muster');
    expect(parseVcf('nothing')).toEqual([]);
  });
  it('Word: headings, bold, lists and a table', () => {
    const xml = '<w:document><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Plan</w:t></w:r></w:p><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Zelt</w:t></w:r><w:r><w:t xml:space="preserve"> und Kocher</w:t></w:r></w:p><w:p><w:pPr><w:numPr/></w:pPr><w:r><w:t>Gas</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Tag</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>km</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t>1</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>64</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>';
    expect(docxToMd(xml)).toBe('# Plan\n**Zelt** und Kocher\n- Gas\n\n| Tag | km |\n|---|---|\n| 1 | 64 |');
  });
  it('PowerPoint: one heading per slide, in the right order', () => {
    expect(slideOrder(['ppt/slides/slide10.xml', 'ppt/slides/slide2.xml', 'ppt/slides/slide1.xml', 'ppt/slides/_rels/x.xml'])).toEqual(['ppt/slides/slide1.xml', 'ppt/slides/slide2.xml', 'ppt/slides/slide10.xml']);
    const md = pptxToMd(['<p:sld><a:p><a:r><a:t>Jura</a:t></a:r></a:p><a:p><a:r><a:t>3 Tage</a:t></a:r></a:p></p:sld>'], 'Folie');
    expect(md).toBe('### Folie 1: Jura\n- 3 Tage');
  });
  it('Excel: shared strings, numbers, inline text, the sheet names', () => {
    const strings = xlsxStrings('<sst><si><t>Tag</t></si><si><r><t>Saigne</t></r><r><t>légier</t></r></si></sst>');
    expect(strings).toEqual(['Tag', 'Saignelégier']);
    const rows = xlsxSheet('<sheetData><row><c r="A1" t="s"><v>0</v></c><c r="C1" t="inlineStr"><is><t>Notiz</t></is></c></row><row><c r="A2" t="s"><v>1</v></c><c r="B2"><v>64</v></c></row></sheetData>', strings);
    expect(rows).toEqual([['Tag', '', 'Notiz'], ['Saignelégier', '64', '']]);
    expect(xlsxSheetNames('<sheets><sheet name="Etappen" sheetId="1"/><sheet name="Kosten &amp; Essen" sheetId="2"/></sheets>')).toEqual(['Etappen', 'Kosten & Essen']);
  });
  it('FIT: the positions of the records (a course the app makes itself)', () => {
    const pts = [{ lat: 47.2, lon: 7.0 }, { lat: 47.25, lon: 7.05 }, { lat: 47.3, lon: 7.1 }];
    const back = fitPoints(toFit(pts, 'Runde'));
    expect(back).toHaveLength(3);
    expect(back[0].lat).toBeCloseTo(47.2, 4);
    expect(back[2].lon).toBeCloseTo(7.1, 4);
    expect(fitPoints(new Uint8Array([1, 2, 3]))).toEqual([]);
    expect(thinTrack(Array.from({ length: 1000 }, (_, i) => ({ lat: i, lon: i })), 100).length).toBeLessThanOrEqual(101);
  });
  it('a web page: title, text, pictures; menus and scripts go', () => {
    const r = readableOf('<html><head><title>Jura &amp; Doubs</title></head><body><nav>Menü</nav><article><h1>Jura</h1><p>Drei <b>Tage</b>.</p><img src="/a.jpg"><img src="logo.svg"><ul><li>Zelt</li></ul><script>x()</script></article></body></html>', 'https://example.org/p/');
    expect(r.title).toBe('Jura & Doubs');
    expect(r.md).toBe('## Jura\nDrei Tage.\n[[img:0]]\n- Zelt');
    expect(r.images).toEqual(['https://example.org/a.jpg']);
  });
});

describe('/api/linkcheck reads public pages for «keep offline»', () => {
  it('only public web addresses', () => {
    expect(publicUrl('https://example.org/a')?.hostname).toBe('example.org');
    for (const bad of ['http://localhost:3000/', 'http://127.0.0.1/', 'http://10.0.0.5/', 'http://192.168.1.1/', 'http://172.20.0.1/', 'http://169.254.169.254/latest', 'file:///etc/passwd', 'http://user:pw@example.org/', 'http://intranet/', 'http://[::1]/', 'http://router.local/', 'https://example.org:22/', 'nope']) expect(publicUrl(bad), bad).toBe(null);
  });
  const req = (q) => new Request(`https://packgen-three.vercel.app/api/linkcheck?${q}`, { headers: { origin: 'http://localhost:5173' } });
  it('gives the HTML of a page; refuses other kinds and private addresses', async () => {
    const page = makeHandler({ doFetch: async () => new Response('<html><title>X</title></html>', { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } }) });
    const res = await page(req(`read=${encodeURIComponent('https://example.org/')}`));
    expect(res.status).toBe(200);
    expect((await res.json()).html).toContain('<title>X</title>');
    const pdf = makeHandler({ doFetch: async () => new Response('%PDF', { status: 200, headers: { 'content-type': 'application/pdf' } }) });
    expect((await pdf(req(`read=${encodeURIComponent('https://example.org/a.pdf')}`))).status).toBe(415);
    expect((await page(req(`read=${encodeURIComponent('http://127.0.0.1/')}`))).status).toBe(400);
    const img = makeHandler({ doFetch: async () => new Response(new Uint8Array([1, 2]), { status: 200, headers: { 'content-type': 'image/png' } }) });
    const ir = await img(req(`img=${encodeURIComponent('https://example.org/a.png')}`));
    expect(ir.status).toBe(200);
    expect(ir.headers.get('content-type')).toBe('image/png');
  });
});
