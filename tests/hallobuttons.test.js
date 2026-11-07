// Gruss B «Knöpfe anpassen»: add, rename, hide, delete, sort, groups; old answers keep their words
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { defaults, cfgOf, groupName, shown, offered, addItem, editItem, setHidden, dropItem, restoreItem, moveItem, addGroup, renameGroup, moveGroup, dropGroup, optionsOf, applyButtons, saveButtons, BUTTONS_KEY, NO_GROUP } from '../src/lib/home/hallobuttons.js';
import { HELLO_QUESTIONS, MOODS, PLANS, FEELINGS } from '../src/lib/home/hallo.js';
import { helloRows, saveHello } from '../src/lib/home/hallo-save.js';
import { valueText } from '../src/lib/abfragen/words.js';
import { db } from '../src/lib/db.js';

const Q = (id) => HELLO_QUESTIONS.find((q) => q.id === id);
beforeEach(async () => {
  await db.open();
  await db.abAnswers.clear();
  await db.settings.clear();
  applyButtons(defaults());
});

describe('defaults and the stored record', () => {
  it('without a record the built-in buttons; the constants stay untouched', () => {
    const d = cfgOf(undefined);
    expect(d.faces.map((f) => f.label)).toEqual(['Müed', 'Gaht so', 'Okay', 'Guet', 'Super']);
    expect(d.plans.map((p) => p.label)).toEqual(['Tour', 'Training', 'Ruhetag', 'Arbeit']);
    expect(d.groups.map((g) => g.id)).toEqual(['energy', 'feeling']);
    expect(d.groups.flatMap((g) => g.items)).toHaveLength(FEELINGS.length);
  });
  it('a broken record is made safe: no double keys, no empty names, no nameless groups', () => {
    const c = cfgOf({
      faces: [{ key: 'a', label: 'Eins' }, { key: 'a', label: 'Zwei' }, { key: 'b', label: '  ' }, null],
      groups: [{ id: 'g', name: 'G', items: [{ key: 'a', label: 'Dopp' }, { key: 'c', label: 'Drei', emoji: '😀😀😀😀😀😀' }] }, { id: 'h' }],
      plans: 'x',
    });
    expect(c.faces).toEqual([{ key: 'a', label: 'Eins', v: 0.5 }]);
    expect(c.groups).toHaveLength(1);
    expect(c.groups[0].items).toEqual([{ key: 'c', label: 'Drei', emoji: '😀😀😀😀' }]);
    expect(c.plans).toEqual([]);
  });
});

describe('edit the buttons', () => {
  it('add with an emoji (once per name), rename, hide, delete, restore', () => {
    let c = defaults();
    c = addItem(c, 'feeling', 'Kreativ', '🎨', 'own-1');
    expect(shown(c, 'feeling').at(-1)).toEqual({ key: 'own-1', label: 'Kreativ', emoji: '🎨', own: true });
    expect(addItem(c, 'feeling', 'kreativ', '', 'own-2')).toBe(c); // the same name again: unchanged
    expect(addItem(c, 'feeling', '  ', '', 'own-3')).toBe(c);
    c = editItem(c, 'feeling', 'own-1', { label: 'Voller Ideen', emoji: '💡' });
    expect(shown(c, 'feeling').at(-1)).toMatchObject({ label: 'Voller Ideen', emoji: '💡' });
    c = editItem(c, 'feeling', 'ruehig', { label: 'Gelassen' });
    expect(shown(c, 'feeling')[0]).toMatchObject({ key: 'ruehig', label: 'Gelassen', emoji: '😌' });
    expect(editItem(c, 'feeling', 'ruehig', { label: '' })).toBe(c);
    c = setHidden(c, 'feeling', 'ruehig', true);
    expect(offered(c, 'feeling').some((x) => x.key === 'ruehig')).toBe(false);
    expect(shown(c, 'feeling').some((x) => x.key === 'ruehig')).toBe(true); // the editor still lists it, dimmed
    c = setHidden(c, 'feeling', 'ruehig', false);
    expect(offered(c, 'feeling').some((x) => x.key === 'ruehig')).toBe(true);
    const before = c;
    c = dropItem(c, 'feeling', 'dankbar');
    expect(shown(c, 'feeling').some((x) => x.key === 'dankbar')).toBe(false);
    expect(restoreItem(c, 'feeling', 'dankbar')).toEqual(before); // Undo gives back the same record
  });
  it('faces and plans: rename, hide, delete, add an own plan', () => {
    let c = defaults();
    c = editItem(c, 'faces', 'okay', { label: 'Passt' });
    expect(shown(c, 'faces')[2].label).toBe('Passt');
    c = dropItem(c, 'faces', 'muede');
    expect(offered(c, 'faces').map((f) => f.key)).toEqual(['gahtso', 'okay', 'guet', 'super']);
    c = addItem(c, 'plans', 'Familie', '', 'own-p');
    expect(offered(c, 'plans').map((p) => p.label)).toEqual(['Tour', 'Training', 'Ruhetag', 'Arbeit', 'Familie']);
  });
  it('sort: arrows and drag give from → to; deleted ones stay at the end', () => {
    let c = dropItem(defaults(), 'plans', 'training');
    c = moveItem(c, 'plans', 0, 2);
    expect(shown(c, 'plans').map((p) => p.key)).toEqual(['ruhetag', 'arbeit', 'tour']);
    expect(c.plans.at(-1).key).toBe('training');
    expect(moveItem(c, 'plans', 0, 9)).toEqual(c);
  });
});

describe('groups', () => {
  it('add, rename, sort', () => {
    let c = addGroup(defaults(), 'Körper', 'g-k');
    expect(c.groups.map((g) => groupName(g, (s) => `T:${s}`))).toEqual(['T:Energy|hello', 'T:Feelings|hello', 'Körper']);
    expect(addGroup(c, 'körper')).toBe(c);
    c = renameGroup(c, 'energy', 'Kraft');
    expect(groupName(c.groups[0])).toBe('Kraft');
    c = moveGroup(c, 2, 0);
    expect(c.groups[0].id).toBe('g-k');
  });
  it('delete: the buttons go to another group or to «Ohne Gruppe» (made if needed); nothing is lost', () => {
    const all = (c) => c.groups.flatMap((g) => g.items.map((i) => i.key)).sort();
    const keys = all(defaults());
    let c = dropGroup(defaults(), 'energy', 'feeling');
    expect(c.groups.map((g) => g.id)).toEqual(['feeling']);
    expect(all(c)).toEqual(keys);
    c = dropGroup(defaults(), 'energy');
    expect(c.groups.map((g) => g.id)).toEqual(['feeling', NO_GROUP]);
    expect(c.groups.find((g) => g.id === NO_GROUP).items.map((i) => i.key)).toEqual(['wach', 'glade', 'schlaefrig', 'platt', 'ueberdreht']);
    expect(all(c)).toEqual(keys);
    // a deleted button moves along too (its words stay for the history)
    c = dropGroup(dropItem(defaults(), 'energy', 'platt'), 'energy');
    expect(c.groups.find((g) => g.id === NO_GROUP).items.find((i) => i.key === 'platt').gone).toBe(true);
  });
});

describe('old answers keep their words', () => {
  it('own, renamed and deleted buttons are options of the questions; the history shows them', async () => {
    let c = addItem(defaults(), 'feeling', 'Kreativ', '🎨', 'own-1');
    c = editItem(c, 'feeling', 'ruehig', { label: 'Gelassen' });
    applyButtons(c);
    const at = '2026-10-09T20:00';
    const rows = helloRows({ mood: 'guet', feelings: ['own-1', 'ruehig'], plans: [] }, at);
    expect(rows.find((r) => r.qid === 'hallo.gefuehl').value).toEqual(['own-1', 'ruehig']);
    expect(valueText(rows[1], Q('hallo.gefuehl'))).toBe('Kreativ · Gelassen');
    // deleted later: the answer still reads the same
    applyButtons(dropItem(c, 'feeling', 'own-1'));
    expect(valueText(rows[1], Q('hallo.gefuehl'))).toBe('Kreativ · Gelassen');
    // and a deleted button can no longer be saved by accident? it is still a valid key (the window does not offer it)
    expect(optionsOf(dropItem(c, 'feeling', 'own-1')).feelings.some((o) => o.key === 'own-1')).toBe(true);
  });
  it('the constants of hallo.js are never changed by applying', () => {
    applyButtons(editItem(defaults(), 'faces', 'okay', { label: 'Passt' }));
    expect(MOODS[2].label).toBe('Okay');
    expect(PLANS).toHaveLength(4);
    expect(Q('hallo.gaht').form.options[2].label).toBe('Passt');
  });
  it('saved in the setting; saveHello still works with own buttons', async () => {
    const c = addItem(defaults(), 'feeling', 'Kreativ', '🎨', 'own-1');
    await saveButtons(c);
    expect((await db.settings.get(BUTTONS_KEY)).value.groups[1].items.at(-1).key).toBe('own-1');
    applyButtons(c);
    expect(await saveHello({ feelings: ['own-1'] }, '2026-10-09T21:00')).toBe(1);
  });
});
