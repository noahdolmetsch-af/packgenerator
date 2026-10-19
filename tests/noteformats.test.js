// Paket N: new note formats (N1 photos and links, N2 place, N7 QR, N10 templates, N11 Markdown light,
// N13 Google Keep from Takeout, N14 share). Fictional data only.
import { describe, it, expect } from 'vitest';
import { photosOf, linksOf, addPhoto, removePhoto, addLinkTo, removeLinkAt, placeFrom, placeLinks, placeText, qrToNote, templatesOf, tplText, addTemplate, renameTemplate, removeTemplate, STD_TEMPLATES, mdToHtml, hasFormat, wrapSel, isKeepNote, keepToNote, keepImport, shareText } from '../src/lib/noteformats.js';

const P = 'test_data_gtp_';

describe('N1 photos and links', () => {
  it('keeps the first in photo/link and the rest in lists', () => {
    let n = { id: 'n', photo: null };
    n = addPhoto(addPhoto(addPhoto(n, 'a'), 'b'), 'c');
    expect(photosOf(n)).toEqual(['a', 'b', 'c']);
    expect(n.photo).toBe('a');
    n = removePhoto(n, 0);
    expect(n.photo).toBe('b');
    expect(photosOf(n)).toEqual(['b', 'c']);
    expect(photosOf(removePhoto(removePhoto(n, 0), 0))).toEqual([]);
    let l = addLinkTo(addLinkTo({ id: 'n' }, { title: 'A', url: 'https://example.org/a' }), { title: 'B', url: 'https://example.org/b' });
    expect(linksOf(l).map((x) => x.title)).toEqual(['A', 'B']);
    l = removeLinkAt(l, 0);
    expect(l.link.title).toBe('B');
    expect(l.links2).toBeUndefined();
  });
});

describe('N2 place', () => {
  it('rounds the position and gives map links', () => {
    const p = placeFrom({ latitude: 46.9480123456, longitude: 7.4474456789 }, ' Rastplatz ');
    expect(p).toEqual({ lat: 46.94801, lon: 7.44745, label: 'Rastplatz' });
    expect(placeLinks(p).maps).toBe('https://www.google.com/maps/search/?api=1&query=46.94801,7.44745');
    expect(placeLinks(p).swisstopo).toContain('map.geo.admin.ch');
    expect(placeText({ ...p, label: '' })).toBe('46.9480, 7.4474');
    expect(placeLinks(null)).toBe(null);
  });
});

describe('N7 QR code', () => {
  it('reads a web address, a Wi-Fi code and plain text', () => {
    expect(qrToNote('https://www.example.org/ticket?x=1')).toEqual({ title: 'example.org', text: '', link: { title: 'example.org', url: 'https://www.example.org/ticket?x=1' } });
    expect(qrToNote(String.raw`WIFI:T:WPA;S:${P}Hütte;P:geh\;eim;;`)).toEqual({ title: `WLAN ${P}Hütte`, text: `SSID: ${P}Hütte\nPasswort: geh;eim\n(WPA)` });
    expect(qrToNote('Hallo')).toEqual({ title: 'Hallo', text: '' });
  });
});

describe('N10 templates', () => {
  const tr = (s) => `T:${s.replace(/\|[a-z]+$/, '')}`;
  it('Standard ones until you have your own; own ones as typed', () => {
    expect(templatesOf(null).map((x) => x.key)).toEqual(STD_TEMPLATES.map((x) => x.key));
    expect(tplText(STD_TEMPLATES[3], tr).split('\n')[1]).toBe('- [ ] T:Tyre pressure');
    const mine = addTemplate(templatesOf(null), `${P} Packen`, '- Zelt', 'own');
    expect(tplText(mine.at(-1), tr)).toBe('- Zelt');
    const r = renameTemplate(mine, 'shopping', `${P} Migros`, tr);
    expect(r[0]).toMatchObject({ name: `${P} Migros`, raw: true, text: 'T:Shopping\n- \n- \n- ' });
    expect(removeTemplate(r, 'own').length).toBe(STD_TEMPLATES.length);
    expect(addTemplate(mine, '', 'x')).toBe(mine);
  });
});

describe('N11 Markdown light', () => {
  it('escapes everything and keeps headings, bold, lists and tables', () => {
    expect(mdToHtml('# Titel\n**fett** und *schräg*\n- a\n- b\n\n| A | B |\n|---|---|\n| 1 | 2 |')).toBe('<h3>Titel</h3><p><strong>fett</strong> und <em>schräg</em></p><ul><li>a</li><li>b</li></ul><table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>');
    expect(mdToHtml('<img src=x onerror=alert(1)>')).toBe('<p>&lt;img src=x onerror=alert(1)&gt;</p>');
    expect(hasFormat('nur Text')).toBe(false);
    expect(hasFormat('## Kopf')).toBe(true);
  });
  it('puts marks around the selection', () => {
    expect(wrapSel('ab cd', 3, 5, 'bold')).toEqual({ text: 'ab **cd**', start: 5, end: 7 });
    expect(wrapSel('a\nbc', 3, 3, 'heading').text).toBe('a\n## bc');
    expect(wrapSel('x', 1, 1, 'table').text).toBe('x\n| A | B |\n|---|---|\n|  |  |\n');
  });
});

describe('N13 Google Keep', () => {
  const keep = (x) => ({ title: '', textContent: '', isTrashed: false, isArchived: false, isPinned: false, userEditedTimestampUsec: 1760000000000000, ...x });
  it('turns a Keep note into a kept note; labels become #tags; trashed and empty ones are skipped', () => {
    const n = keepToNote(keep({ title: `${P} Einkauf`, listContent: [{ text: 'Brot', isChecked: true }, { text: '' }], labels: [{ name: 'Velo Tour' }], annotations: [{ url: 'https://example.org', title: 'Ex' }] }), { id: 'k1' });
    expect(n).toMatchObject({ id: 'k1', status: 'kept', title: `${P} Einkauf`, text: '#Velo-Tour', checklist: [{ text: 'Brot', done: true }], link: { title: 'Ex', url: 'https://example.org' } });
    expect(n.at).toBe(new Date(1760000000000).toISOString());
    expect(keepToNote(keep({ title: 'x', isTrashed: true }))).toBe(null);
    expect(keepToNote(keep({}))).toBe(null);
    expect(isKeepNote({ foo: 1 })).toBe(false);
  });
  it('a second import adds nothing twice', () => {
    const js = [keep({ title: 'A', textContent: 'eins' }), keep({ title: 'B', textContent: 'zwei', userEditedTimestampUsec: 1 }), keep({ isTrashed: true, title: 'C' })];
    const first = keepImport(js, [], { ids: (i) => `k${i}` });
    expect(first.add.map((n) => n.id)).toEqual(['k0', 'k1']);
    expect(first.skipped).toBe(1);
    const again = keepImport(js, first.add, { ids: (i) => `j${i}` });
    expect(again).toMatchObject({ add: [], already: 2 });
  });
});

describe('N14 share', () => {
  it('writes the note as plain text', () => {
    const n = { title: 'Titel', text: 'Text', checklist: [{ text: 'a', done: true }, { text: 'b', done: false }], link: { title: 'Ex', url: 'https://example.org' }, place: { lat: 46.9, lon: 7.4, label: 'Bern' } };
    expect(shareText(n)).toBe('Titel\nText\n☑ a\n☐ b\nEx: https://example.org\nPlace: Bern https://www.google.com/maps/search/?api=1&query=46.9,7.4');
  });
});
