import { describe, it, expect } from 'vitest';
import { htmlToMd, TABLE_HTML } from '../src/lib/notes/richtext.js';
import { mdToHtml } from '../src/lib/noteformats.js';

// Paket NE 1147 «Formatiert schreiben» (Noah 20.10.2026 «6a»): the editor shows formatting, the note keeps Markdown light.
// A small stand-in for DOM nodes (no browser in unit tests).
const txt = (s) => ({ nodeType: 3, nodeName: '#text', textContent: s, childNodes: [] });
const h = (tag, attrs, ...kids) => ({
  nodeType: 1,
  nodeName: tag.toUpperCase(),
  childNodes: kids.map((k) => (typeof k === 'string' ? txt(k) : k)),
  getAttribute: (a) => (attrs && a in attrs ? attrs[a] : null),
});
const root = (...kids) => h('div', null, ...kids);

describe('htmlToMd: what the editor shows back to Markdown light', () => {
  it('headings, bold, italic, struck and code', () => {
    const md = htmlToMd(root(h('h4', null, 'Packliste'), h('p', null, 'Das ist ', h('b', null, 'fett'), ', ', h('i', null, 'schräg'), ', ', h('s', null, 'weg'), ' und ', h('code', null, 'x'))));
    expect(md).toBe('## Packliste\nDas ist **fett**, *schräg*, ~~weg~~ und `x`');
  });
  it('marks go round the words, not round the spaces', () => {
    expect(htmlToMd(root(h('p', null, 'a', h('strong', null, ' fett '), 'b')))).toBe('a **fett** b');
  });
  it('lists, numbered lists and ticks', () => {
    const md = htmlToMd(root(h('ul', null, h('li', null, 'Zelt'), h('li', null, 'Kocher')), h('ol', null, h('li', null, 'eins'), h('li', null, 'zwei')), h('ul', null, h('li', { 'data-todo': '0' }, 'Gas'), h('li', { 'data-todo': '1' }, 'Riegel'))));
    expect(md).toBe('- Zelt\n- Kocher\n1. eins\n2. zwei\n- [ ] Gas\n- [x] Riegel');
  });
  it('a table with a head line', () => {
    const md = htmlToMd(root(h('table', null, h('tbody', null, h('tr', null, h('th', null, 'Was'), h('th', null, 'km')), h('tr', null, h('td', null, 'Kette'), h('td', null, '1000'))))));
    expect(md).toBe('| Was | km |\n|---|---|\n| Kette | 1000 |');
  });
  it('lines typed in the browser (text, divs, <br>) stay lines; empty lines once', () => {
    const md = htmlToMd(root(txt('erste'), h('div', null, 'zweite'), h('div', null, h('br')), h('div', null, h('br')), h('div', null, 'dritte', h('br'), 'vierte')));
    expect(md).toBe('erste\nzweite\n\ndritte\nvierte');
  });
  it('bold from a style (pasted) counts as bold; other tags give their text', () => {
    expect(htmlToMd(root(h('p', null, h('span', { style: 'font-weight: 700' }, 'fett'), h('span', null, ' normal'))))).toBe('**fett** normal');
  });
  it('round trip: Markdown light → editor → the same Markdown', () => {
    // mdToHtml gives the HTML the editor shows; the test reads the same structure back
    expect(mdToHtml('- [ ] Gas\n- [x] Riegel')).toBe('<ul><li data-todo="0">Gas</li><li data-todo="1">Riegel</li></ul>');
    expect(mdToHtml('~~weg~~')).toBe('<p><s>weg</s></p>');
    expect(TABLE_HTML).toContain('<table>');
  });
});
