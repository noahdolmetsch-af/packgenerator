// «Verbesserungs-Logbuch» step 4: the order text, fictional entries only.
import { describe, it, expect } from 'vitest';
import { makeEntry } from '../src/lib/logbuch/logbuch.js';
import { ordered, pictureNumbers, imageName, images, buildOrder, orderSize } from '../src/lib/logbuch/auftrag.js';

const at = (min) => new Date(2026, 10, 21, 12, min);
const mk = (o) => makeEntry({ device: 'phone', width: 390, now: at(o.min ?? 0), ...o });
const LIST = [
  mk({ id: 'a', min: 1, art: 'text', text: 'Fiktiv A: Text auf der Woche-Seite.', page: '#/flow/training', pageTitle: 'Training', block: 'Woche 47', urgent: 'later', photo: 'data:image/jpeg;base64,AAAA' }),
  mk({ id: 'b', min: 2, art: 'anordnung', text: 'Fiktiv B: Block nach oben.', page: '#/me', pageTitle: 'Ich', urgent: 'later' }),
  mk({ id: 'c', min: 3, art: 'fehler', text: 'Fiktiv C: springt nach oben.', page: '#/me', pageTitle: 'Ich', block: 'Hilfe', urgent: 'now', photo: 'data:image/jpeg;base64,BBBB' }),
  mk({ id: 'd', min: 4, art: 'gutso', text: 'Fiktiv D: Abhaken ist gut.', page: '#/flow/training', pageTitle: 'Training' }),
  mk({ id: 'e', min: 5, art: 'text', text: 'Fiktiv E: schon erledigt.', page: '#/me', state: 'done' }),
  mk({ id: 'f', min: 6, art: 'layout', text: 'Fiktiv F: ohne Seite.', page: '', urgent: 'later' }),
];
LIST.find((e) => e.id === 'e').state = 'done';

describe('Auftrag kopieren', () => {
  it('open entries by page, the page with «now» first, inside a page «now» first; notes and done ones apart', () => {
    const o = ordered(LIST);
    expect(o.groups.map((g) => g.page)).toEqual(['#/me', '', '#/flow/training']);
    expect(o.groups[0].items.map((e) => e.id)).toEqual(['c', 'b']);
    expect(o.notes.map((e) => e.id)).toEqual(['d']);
    expect(o.groups.flatMap((g) => g.items).map((e) => e.id)).not.toContain('e');
    expect(orderSize(LIST)).toEqual({ items: 4, notes: 1 });
  });
  it('picture numbers follow the order of the text; the file names carry the number and the page', () => {
    const nums = pictureNumbers(ordered(LIST));
    expect([...nums.entries()]).toEqual([['c', 1], ['a', 2]]);
    expect(imageName(2, '#/flow/training')).toBe('logbuch-02-flow-training.jpg');
    expect(imageName(10, '')).toBe('logbuch-10.jpg');
    expect(images(LIST).map((p) => [p.n, p.name])).toEqual([[1, 'logbuch-01-me.jpg'], [2, 'logbuch-02-flow-training.jpg']]);
  });
  it('the text has the pages with their addresses, the entries in order and the notes at the end', () => {
    const text = buildOrder(LIST, '21. November 2026');
    const at = (s) => text.indexOf(s);
    expect(at('#/me')).toBeGreaterThan(-1);
    expect(at('Fiktiv C')).toBeLessThan(at('Fiktiv B'));
    expect(at('Fiktiv B')).toBeLessThan(at('Fiktiv F'));
    expect(at('Fiktiv F')).toBeLessThan(at('#/flow/training'));
    expect(at('Fiktiv A')).toBeLessThan(at('Fiktiv D'));
    expect(text).not.toContain('Fiktiv E');
    expect(text).toContain('1. [');
    expect(text).toContain('#/flow/training');
    expect(text.split('\n').filter((l) => /^\d+\. \[/.test(l))).toHaveLength(4);
  });
  it('an empty log gives a short text without errors', () => {
    expect(buildOrder([], 'x')).toContain('0');
    expect(orderSize([])).toEqual({ items: 0, notes: 0 });
    expect(images([])).toEqual([]);
  });
});
