// «Velo-FAQ» (Noah 19.10.2026): questions by topic with a wink, the question of the day, the search and own questions.
import { describe, it, expect } from 'vitest';
import { FAQ, FAQ_TOPICS, FAQ_TEXTS, faqOfDay, nextFaq, searchFaq, normOwn, addOwn, changeOwn, removeOwn, restoreOwn, moveOwn } from '../src/lib/velofaq.js';
import DE from '../src/lib/i18n/de/index.js';

describe('Velo-FAQ', () => {
  it('every question has a topic, a known key, an answer and a wink; every text in German', () => {
    const topics = FAQ_TOPICS.map((x) => x.key);
    expect(new Set(FAQ.map((f) => f.key)).size).toBe(FAQ.length);
    for (const f of FAQ) {
      expect(topics, f.key).toContain(f.topic);
      expect(f.q && f.a && f.wink, f.key).toBeTruthy();
      if (f.link) expect(f.link.href, f.key).toMatch(/^#\/[a-z]/);
    }
    for (const tp of topics) expect(FAQ.some((f) => f.topic === tp), tp).toBe(true);
    expect(FAQ_TEXTS.filter((x) => !DE[x])).toEqual([]);
  });

  it('the question of the day stays all day and changes the next day; «Another question» goes round', () => {
    expect(faqOfDay('2026-10-19')).toBe(faqOfDay('2026-10-19'));
    expect(faqOfDay('2026-10-20')).not.toBe(faqOfDay('2026-10-19'));
    expect(faqOfDay('nope')).toBeTruthy();
    expect(faqOfDay('2026-10-19', [])).toBe(null);
    expect(nextFaq(FAQ[0].key)).toBe(FAQ[1]);
    expect(nextFaq(FAQ.at(-1).key)).toBe(FAQ[0]);
  });

  it('the search finds by English and shown words, every word must fit', () => {
    const de = (s) => DE[s] ?? s;
    expect(searchFaq(FAQ, 'squeal').map((f) => f.key)).toContain('squeal');
    expect(searchFaq(FAQ, 'quietschen', de).map((f) => f.key)).toContain('squeal');
    expect(searchFaq(FAQ, 'kette pizza', de).map((f) => f.key)).toEqual(['chainwear']);
    expect(searchFaq(FAQ, '   ')).toHaveLength(FAQ.length);
    expect(searchFaq(FAQ, 'xyzzy')).toEqual([]);
  });

  it('adds, changes, moves and removes own questions; Undo puts one back', () => {
    let list = addOwn([], 'test_data_gtp_ Welches Öl?', 'test_data_gtp_ Nassöl', 1);
    list = addOwn(list, 'test_data_gtp_ Wie viel Druck?', '', 2);
    expect(addOwn(list, '  ')).toHaveLength(2);
    const [a, b] = list;
    list = changeOwn(list, a.id, { q: 'test_data_gtp_ Welches Kettenöl?', a: ' test_data_gtp_ Wachs ' });
    expect(list[0]).toMatchObject({ q: 'test_data_gtp_ Welches Kettenöl?', a: 'test_data_gtp_ Wachs' });
    expect(changeOwn(list, a.id, { q: ' ' })[0].q).toBe('test_data_gtp_ Welches Kettenöl?');
    list = moveOwn(list, 0, 1);
    expect(list.map((r) => r.id)).toEqual([b.id, a.id]);
    expect(moveOwn(list, 0, 5).map((r) => r.id)).toEqual([b.id, a.id]);
    const res = removeOwn(list, b.id);
    expect(res.list.map((r) => r.id)).toEqual([a.id]);
    expect(restoreOwn(res.list, res.row, res.at).map((r) => r.id)).toEqual([b.id, a.id]);
    expect(removeOwn(list, 'nope').row).toBe(null);
    expect(normOwn([{ id: 1 }, null, { id: 'x', q: ' ' }, { id: 'y', q: 'z' }])).toEqual([{ id: 'y', q: 'z', a: '' }]);
  });
});
