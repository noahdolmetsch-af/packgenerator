import { describe, it, expect } from 'vitest';
import { detectFormat, formatOf, odtToMd, odpToMd, odsSheets, rtfToText } from '../src/lib/notes/files.js';

// Paket «Reste» 1152: LibreOffice files and RTF are shown; old binary Office files get a clear line.
describe('old and open office formats', () => {
  it('knows the kinds', () => {
    expect(detectFormat('brief.odt')).toBe('odt');
    expect(detectFormat('liste.ODS')).toBe('ods');
    expect(detectFormat('vortrag.odp')).toBe('odp');
    expect(detectFormat('notiz.rtf')).toBe('rtf');
    expect(detectFormat('x', 'application/vnd.oasis.opendocument.spreadsheet')).toBe('ods');
    for (const n of ['alt.doc', 'alt.xls', 'alt.ppt']) expect(detectFormat(n)).toBe('office');
    expect(formatOf('odt').show).toBe('doc');
    expect(formatOf('ods').show).toBe('table');
    expect(formatOf('rtf').show).toBe('text');
    expect(formatOf('office').show).toBe('file');
  });
  it('reads a text document with heading, list and table', () => {
    const xml = `<office:document-content><office:body><office:text>
      <text:h text:outline-level="2">Packliste <text:span>Herbst</text:span></text:h>
      <text:p>Zwei<text:s text:c="2"/>Taschen &amp; Licht</text:p>
      <text:list><text:list-item><text:p>Regenjacke</text:p></text:list-item></text:list>
      <table:table table:name="T"><table:table-row><table:table-cell><text:p>Ding</text:p></table:table-cell><table:table-cell><text:p>g</text:p></table:table-cell></table:table-row>
      <table:table-row><table:table-cell><text:p>Pumpe</text:p></table:table-cell><table:table-cell office:value="90"><text:p>90</text:p></table:table-cell></table:table-row></table:table>
    </office:text></office:body></office:document-content>`;
    const md = odtToMd(xml);
    expect(md).toContain('## Packliste Herbst');
    expect(md).toContain('Zwei Taschen & Licht');
    expect(md).toContain('- Regenjacke');
    expect(md).toContain('| Ding | g |');
    expect(md).toContain('| Pumpe | 90 |');
  });
  it('reads slides', () => {
    const xml = `<draw:page draw:name="a"><draw:frame><draw:text-box><text:p>Route</text:p><text:p>Tag 1</text:p></draw:text-box></draw:frame><presentation:notes><text:p>geheim</text:p></presentation:notes></draw:page><draw:page><text:p>Ende</text:p></draw:page>`;
    const md = odpToMd(xml, 'Folie');
    expect(md).toContain('### Folie 1: Route');
    expect(md).toContain('- Tag 1');
    expect(md).toContain('### Folie 2: Ende');
    expect(md).not.toContain('geheim');
  });
  it('reads sheets and keeps repeated cells within limits', () => {
    const xml = `<table:table table:name="Velos"><table:table-row><table:table-cell><text:p>A</text:p></table:table-cell><table:table-cell table:number-columns-repeated="2"><text:p>x</text:p></table:table-cell><table:table-cell table:number-columns-repeated="16000"/></table:table-row>
      <table:table-row table:number-rows-repeated="1048570"><table:table-cell table:number-columns-repeated="1024"/></table:table-row></table:table>`;
    const [s] = odsSheets(xml);
    expect(s.name).toBe('Velos');
    expect(s.rows).toEqual([['A', 'x', 'x']]);
  });
  it('takes the text out of RTF', () => {
    const rtf = '{\\rtf1\\ansi\\ansicpg1252\\deff0{\\fonttbl{\\f0 Arial;}}{\\colortbl;\\red0\\green0\\blue0;}{\\*\\generator Test;}\\f0\\fs24 Gr\\\'fcezi \\b Velo\\b0\\par Preis \\u8364?5 \\{ok\\}\\tab Ende\\par}';
    expect(rtfToText(rtf)).toBe('Grüezi Velo\nPreis €5 {ok}\tEnde');
    expect(rtfToText('plain')).toBe('plain');
  });
});
