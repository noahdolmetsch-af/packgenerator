// Paket D «Mit Freunden»: the messages, the contributions, the shelf, shared gear, blocks and layout (fictional data).
import { describe, it, expect } from 'vitest';
import { TOPICS, cleanEnvelope, cleanAsk, askEnvelope, replyEnvelope, noteOf, addNote, openQuestions, solveQuestion, ticksOf, tasksOf, pairRows, pairCount, groupNotes, stepRequest, shelfOf, toggleShelf, setShelfHow, shelfIdeas, shelfEnvelope, requestEnvelope, gearOf, availableOn, setEnvelope, matchSet, layoutOnly, layoutCount, applyLayout, needsFile, fileText, readFileText, inUrl, codeOf, LINK_MAX } from '../src/lib/freunde/freunde.js';
import { encodeEnvelope, decodeEnvelope } from '../src/lib/freunde/code.js';

const ask = (topic, extra = {}) => cleanAsk({ id: 'a1', topic, title: 'Seerunde', text: '', lines: [], ...extra });

describe('messages', () => {
  it('only our own kinds and topics come through; text is cut and cleaned', () => {
    expect(cleanEnvelope(null)).toBe(null);
    expect(cleanEnvelope({ v: 1, pg: 'x', k: 'ask' })).toBe(null);
    expect(cleanEnvelope({ v: 1, pg: 'f', k: 'ask', ask: { topic: 'nope' } })).toBe(null);
    const e = askEnvelope(ask('story', { text: 'Ein schöner Tag   am See' }), 'Mara', '2026-10-25');
    expect(e.k).toBe('ask');
    expect(e.ask.text).toBe('Ein schöner Tag am See');
    expect(e.by).toBe('Mara');
    expect(TOPICS.length).toBe(10);
  });
  it('a link: message → code → message, and the address carries the code', async () => {
    const e = askEnvelope(ask('duties', { lines: [{ id: 'x', text: 'Kocher' }, 'Zelt'] }), 'Mara', '2026-10-25');
    const code = await encodeEnvelope(e);
    expect(await decodeEnvelope(code)).toEqual(e);
    expect(await decodeEnvelope('kaputt')).toBe(null);
    const url = inUrl('https://example.org/app/#/me', code);
    expect(url).toBe(`https://example.org/app/#/me/freunde/in/${code}`);
    expect(codeOf(`#/me/freunde/in/${code}`)).toBe(code);
    expect(codeOf('#/me/freunde')).toBe('');
  });
  it('a photo or a voice note goes as a file; the file reads back', () => {
    const withPhoto = askEnvelope(ask('photo', { photo: 'data:image/jpeg;base64,AAAA', marks: [{ x: 0.2, y: 2, text: 'Hier?' }] }), 'Mara', '2026-10-25');
    expect(withPhoto.ask.marks[0].y).toBe(1);
    expect(needsFile(withPhoto)).toBe(true);
    expect(needsFile(askEnvelope(ask('story'), 'M', null))).toBe(false);
    expect(needsFile(askEnvelope(ask('story'), 'M', null), LINK_MAX + 1)).toBe(true);
    expect(readFileText(fileText(withPhoto))).toEqual(withPhoto);
    expect(readFileText('{nope')).toBe(null);
  });
  it('a reply leaves the photo out and keeps a voice note of at most a minute', () => {
    const a = ask('story', { photo: 'data:image/jpeg;base64,AAAA' });
    const r = replyEnvelope(a, { text: 'Mein Blick', voice: 'data:audio/webm;base64,BBBB', voiceS: 95 }, 'Jo', '2026-10-26');
    expect(r.ask.photo).toBeUndefined();
    expect(r.answer.voiceS).toBe(60);
    expect(needsFile(r)).toBe(true);
  });
});

describe('contributions', () => {
  it('an answer is a new entry with name and day, kept once', () => {
    const r = replyEnvelope(ask('story'), { text: 'Schön' }, 'Jo', '2026-10-26');
    const n = noteOf(r, '2026-10-27T08:00:00.000Z');
    expect(n).toMatchObject({ kind: 'reply', askId: 'a1', by: 'Jo', at: '2026-10-26', state: 'new' });
    const list = addNote(addNote([], n), n);
    expect(list.length).toBe(1);
    expect(groupNotes(list)[0].notes.length).toBe(1);
  });
  it('handover: open questions until answered', () => {
    const a = ask('handover', { lines: [{ id: 'p', text: 'Pflanzen giessen' }, { id: 'b', text: 'Briefkasten' }] });
    const n = noteOf(replyEnvelope(a, { qs: { p: 'Wie viel Wasser?', b: '' } }, 'Kim', '2026-10-25'));
    const q = openQuestions([n], [a]);
    expect(q).toEqual([{ noteId: n.id, by: 'Kim', lineId: 'p', line: 'Pflanzen giessen', q: 'Wie viel Wasser?' }]);
    expect(openQuestions([solveQuestion(n, 'p')], [a])).toEqual([]);
  });
  it('pack together and workshop: who ticked and who takes a task', () => {
    const a = ask('workshop', { lines: [{ id: 't1', text: 'Kette wechseln' }, { id: 'q1', text: 'Wer bringt Öl?', q: true }] });
    const n1 = noteOf(replyEnvelope(a, { take: { t1: true }, answers: { q1: 'Ich' } }, 'Jo', '2026-10-25'));
    const n2 = noteOf(replyEnvelope(a, { done: { t1: true } }, 'Kim', '2026-10-26'));
    expect(tasksOf([n1, n2], 'a1')).toEqual({ t1: { take: ['Jo'], done: [{ by: 'Kim', at: '2026-10-26' }] } });
    expect(ticksOf([n2], 'a1')).toEqual({ t1: [{ by: 'Kim', at: '2026-10-26' }] });
    expect(a.lines[1].q).toBe(true);
  });
  it('agree on what comes along: no points, only take, talk, leave, open', () => {
    const lines = [{ id: 'a', text: 'Kissen', m: 'want' }, { id: 'b', text: 'Stuhl', m: 'skip' }, { id: 'c', text: 'Kaffee', m: 'want' }, { id: 'd', text: 'Buch' }];
    const rows = pairRows(lines, { a: 'skip', b: 'skip', c: 'want' });
    expect(rows.map((r) => r.verdict)).toEqual(['talk', 'leave', 'take', 'open']);
    expect(pairCount(rows)).toEqual({ take: 1, talk: 1, leave: 1, open: 1 });
  });
  it('a request goes step by step and keeps each day', () => {
    const shelfEnv = cleanEnvelope({ v: 1, pg: 'f', k: 'shelf', id: 'shelf', by: 'Mara', at: '2026-10-25', items: [{ id: 'T1', n: 'Zelt', how: 'lend' }, { id: 'J1', n: 'Jacke', how: 'swap' }] });
    const req = requestEnvelope(shelfEnv, { T1: 'borrow' }, { from: '2026-11-01', until: '2026-11-03', note: '' }, 'Jo', '2026-10-25');
    expect(req.items).toEqual([{ id: 'T1', n: 'Zelt', how: 'lend', w: 'borrow' }]);
    let n = noteOf(req, '2026-10-25T10:00:00.000Z');
    n = stepRequest(n, 'promised', '2026-10-26');
    n = stepRequest(n, 'handed', '2026-11-01', { lendId: 'L1' });
    expect(n.state).toBe('handed');
    expect(n.log.map((x) => x.s)).toEqual(['new', 'promised', 'handed']);
    expect(stepRequest(n, 'weird', '2026-11-02')).toBe(n);
  });
});

describe('shelf and shared gear', () => {
  const items = [{ id: 'T1', name: 'Tent', ownership: 'owned', category: 'sleep' }, { id: 'J1', name: 'Jacket', ownership: 'owned' }, { id: 'W1', name: 'Wish', ownership: 'wishlist' }];
  it('only what you put on the shelf goes out', () => {
    let s = shelfOf(null);
    s = toggleShelf(s, 'T1');
    s = setShelfHow(toggleShelf(s, 'J1'), 'J1', 'swap');
    expect(s.items).toEqual([{ itemId: 'T1', how: 'lend' }, { itemId: 'J1', how: 'swap' }]);
    expect(toggleShelf(s, 'T1').items.length).toBe(1);
    const e = shelfEnvelope(s, Object.fromEntries(items.map((i) => [i.id, i])), (i) => i?.name, (i) => i?.category ?? '', 'Mara', '2026-10-25');
    expect(e.items.map((x) => [x.n, x.how])).toEqual([['Tent', 'lend'], ['Jacket', 'swap']]);
    expect(shelfIdeas(items, new Set(['J1']), shelfOf(null)).map((i) => i.id)).toEqual(['T1']);
  });
  it('shared, borrowed, rented, lent: free on a day or not', () => {
    const [shared, borrowed, lent] = gearOf([
      { id: 'g1', itemId: 'T1', how: 'shared', who: 'Jo', from: '2026-11-01', until: '2026-11-05' },
      { id: 'g2', name: 'E-Bike', how: 'rented', who: 'Laden', from: '2026-11-02', until: '2026-11-02' },
      { id: 'g3', itemId: 'J1', how: 'lent', who: 'Kim' },
    ]);
    expect(availableOn(shared, '2026-11-03')).toBe('no');
    expect(availableOn(shared, '2026-11-10')).toBe('ask');
    expect(availableOn(borrowed, '2026-11-02')).toBe('yes');
    expect(availableOn(borrowed, '2026-11-03')).toBe('no');
    expect(availableOn(lent, '2026-11-03')).toBe('no');
    expect(gearOf([{ id: 'x', how: 'shared' }])).toEqual([]);
  });
});

describe('templates', () => {
  it('a block carries only names and amounts; the friend maps lines to own things', () => {
    const members = [{ id: 'A', name: 'Rain jacket' }, { id: 'B', name: 'Gloves' }];
    const e = setEnvelope({ name: 'Regen', note: '' }, members, (i) => i.name, () => 'clothes', (id) => (id === 'B' ? 2 : 1), 'Mara', '2026-10-25');
    expect(e.lines).toEqual([{ n: 'Rain jacket', q: 1, c: 'clothes' }, { n: 'Gloves', q: 2, c: 'clothes' }]);
    expect(JSON.stringify(e)).not.toContain('"A"');
    const mine = [{ id: 'm1', name: 'gloves', ownership: 'owned' }, { id: 'm2', name: 'Rain jacket', ownership: 'gone' }];
    expect(matchSet(e.lines, mine).map((l) => l.itemId)).toEqual([null, 'm1']);
  });
  it('a layout has no own names; applying it keeps yours', () => {
    const cfg = { pages: { home: { hide: ['x'], order: ['b', 'a'], names: { a: 'Mein Name' }, title: 'Privat' } }, menu: { hide: ['trips'], order: [], names: { me: 'Noah' } }, tabs: { gear: { hide: [], start: 'lend', names: { lend: 'Weg' } } } };
    const l = layoutOnly(cfg);
    expect(JSON.stringify(l)).not.toMatch(/Mein Name|Privat|Noah|Weg/);
    expect(layoutCount(l)).toEqual({ pages: 1, menu: 1, tabs: 1 });
    const mine = { pages: { home: { hide: [], order: [], names: { a: 'Eigen' } } }, menu: { hide: [], order: [], names: { me: 'Ich selbst' } }, tabs: {} };
    const out = applyLayout(mine, l);
    expect(out.pages.home).toMatchObject({ hide: ['x'], order: ['b', 'a'], names: { a: 'Eigen' } });
    expect(out.menu.names).toEqual({ me: 'Ich selbst' });
    expect(out.tabs.gear.start).toBe('lend');
  });
});
