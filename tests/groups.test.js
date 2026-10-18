// «Gruppen überall» (Noah 18.10.2026): every group can be renamed and deleted; deleting asks where the
// things go, first choice «Ohne Gruppe». Pure helpers plus a guard over the places (groups.js GROUP_PLACES).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { GROUP_PLACES, moveItems, moveNotes, retopicLearnings, targetsOf } from '../src/lib/groups.js';
import { setTopics, noteTopic, filterCounts } from '../src/lib/notebook.js';
import { STD_TOPICS, guessTopic } from '../src/lib/inbox.js';
import { STANDARD_LIST } from '../src/lib/standard.js';
import { valueGroups, groupCounts, moveGroupFields, setValueGroups, VALUE_GROUPS, addOwnField } from '../src/lib/valuefields.js';

const P = 'test_data_gtp_';

describe('guard: every group place renames and deletes with the one window', () => {
  it('each place uses GroupDeleteSheet and a way to rename', () => {
    expect(GROUP_PLACES.length).toBeGreaterThan(3);
    for (const p of GROUP_PLACES) {
      const src = readFileSync(new URL(`../${p.file}`, import.meta.url), 'utf8');
      expect(src, p.name).toContain('GroupDeleteSheet');
      expect(/RenameSheet|ListEntrySheet/.test(src), p.name).toBe(true);
    }
  });
  it('the note topics and the groups of the bike values are lists of «Listen und Typen»', () => {
    expect(STANDARD_LIST.noteTopics.entries().map((e) => e.id)).toEqual(STD_TOPICS.map((x) => x.key));
    expect(STANDARD_LIST.valueGroups.entries().map((e) => e.id)).toEqual(VALUE_GROUPS.map((g) => g.key));
  });
});

describe('moving things out of a deleted group', () => {
  it('items: only with a target', () => {
    const items = [{ id: 'a', category: 'x' }, { id: 'b', category: 'y' }];
    expect(moveItems(items, 'x', null)).toEqual([]);
    expect(moveItems(items, 'x', 'y', 'now')).toEqual([{ id: 'a', category: 'y', updatedAt: 'now' }]);
  });
  it('notes: a note without a topic counts as General; only kept notes', () => {
    const notes = [{ id: 'a', status: 'kept', title: `${P}a` }, { id: 'b', status: 'kept', topic: 'bike' }, { id: 'c', status: 'open' }];
    expect(moveNotes(notes, 'general', 'bike').map((n) => [n.id, n.topic])).toEqual([['a', 'bike']]);
  });
  it('learnings: rename and delete a topic; «Open question» stays', () => {
    const ls = [{ id: 1, topic: 'Gear' }, { id: 2, topic: 'Food' }, { id: 3, topic: 'Open question' }];
    expect(retopicLearnings(ls, 'Gear', ' Material ')).toEqual([{ id: 1, topic: 'Material' }]);
    expect(retopicLearnings(ls, 'Gear', '')).toEqual([{ id: 1, topic: '' }]);
    expect(retopicLearnings(ls, 'Open question', 'X')).toEqual([]);
  });
  it('targets leave out the group itself and hidden ones', () => {
    expect(targetsOf([{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C', hidden: true }], 'a')).toEqual([{ id: 'b', name: 'B' }]);
  });
});

describe('note topics as the person has them', () => {
  it('a deleted topic: its notes show under «Ohne Thema», it is never guessed', () => {
    setTopics(STD_TOPICS.filter((x) => x.key !== 'bike'));
    try {
      expect(noteTopic({ topic: 'bike' })).toBe('');
      expect(noteTopic({})).toBe('general');
      expect(guessTopic('Kette ölen')).toBe('general');
      expect(filterCounts([{ status: 'kept', topic: 'bike' }])['topic:']).toBe(1);
      setTopics(STD_TOPICS.filter((x) => x.key !== 'general'));
      expect(noteTopic({})).toBe('');
      expect(guessTopic('nichts')).toBeNull();
    } finally {
      setTopics(STD_TOPICS);
    }
  });
});

describe('groups of the bike values', () => {
  const fields = (stored) => valueGroups(null, stored, { all: true }).groups;
  it('a deleted group: its fields show under «Ohne Gruppe», or move to the chosen group', () => {
    const own = addOwnField({}, { name: `${P}Feld`, group: 'tyres' }).fields;
    setValueGroups(VALUE_GROUPS.filter((g) => g.key !== 'tyres'));
    try {
      const none = fields(own).find((g) => g.key === '');
      expect(none.rows.length).toBe(VALUE_GROUPS[0].fields.length + 1);
      const moved = moveGroupFields(own, 'tyres', 'fit');
      expect(fields(moved).some((g) => g.key === '')).toBe(false);
      expect(groupCounts(moved).fit).toBe(VALUE_GROUPS.find((g) => g.key === 'fit').fields.length + VALUE_GROUPS[0].fields.length + 1);
      expect(moveGroupFields(own, 'tyres', null)).toEqual(own);
    } finally {
      setValueGroups(VALUE_GROUPS);
    }
  });
});
