// v0.134.0 «Listen und Typen» (LI1–LI4): a person's categories and how they reach the app.
import { describe, it, expect, afterEach } from 'vitest';
import { categoriesFrom, applyLists, move, toggleHidden, edit, addOwn, remove, OWN_COLORS } from '../src/lib/lists.js';
import { listFor } from '../src/lib/standard.js';
import { STD_CATEGORIES, CATEGORIES, CATEGORY, choosable, groupByCategory, catApplies } from '../src/lib/gear.js';
import { catIcon, stdIconName, ICON_CHOICES } from '../src/lib/gear/caticon.js';

const STD = STD_CATEGORIES.map((c) => c.key);
const first = STD[0];
const second = STD[1];
afterEach(() => applyLists({}));

describe('the categories as the person has them', () => {
  it('without changes they are the Standard', () => {
    expect(categoriesFrom({}).map((c) => c.key)).toEqual(STD);
    applyLists({});
    expect(CATEGORIES.map((c) => c.key)).toEqual(STD);
    expect(Object.keys(CATEGORY)).toEqual(STD);
  });
  it('rename, own, hidden, deleted and order reach CATEGORIES and CATEGORY in place', () => {
    const { value } = addOwn({ names: { [first]: 'Akkus' }, hidden: [second], deleted: [STD[2]] }, { name: 'Fotografie', icon: 'Camera' }, 'own-x');
    applyLists({ categories: move(value, listFor('categories', { categories: value }), 'own-x', -1) });
    expect(CATEGORY[first].name).toBe('Akkus');
    expect(CATEGORY[second].hidden).toBe(true);
    expect(CATEGORY[STD[2]]).toBeUndefined();
    expect(CATEGORY['own-x']).toMatchObject({ name: 'Fotografie', own: true, color: OWN_COLORS[0], icon: 'Camera' });
    expect(CATEGORIES.at(-2).key).toBe('own-x');
    expect(catIcon('own-x')).toBe(ICON_CHOICES.Camera.I);
  });
  it('a hidden category is not offered, unless the item already has it', () => {
    applyLists({ categories: { hidden: [second] } });
    expect(choosable().some((c) => c.key === second)).toBe(false);
    expect(choosable(second).some((c) => c.key === second)).toBe(true);
  });
  it('items of a deleted category show under «Ohne Kategorie», nothing is lost', () => {
    applyLists({ categories: { deleted: [first] } });
    const groups = groupByCategory([{ id: 'X1', name: 'Lampe', category: first }]);
    expect(groups).toHaveLength(1);
    expect(groups[0].unknown).toBe(true);
  });
  it('the Standard itself never changes', () => {
    applyLists({ categories: { names: { [first]: 'Neu' }, deleted: [second] } });
    expect(STD_CATEGORIES.map((c) => c.key)).toEqual(STD);
    expect(listFor('categories', {}).find((e) => e.id === first).name).toBe(STD_CATEGORIES[0].name);
  });
});

describe('editing one list', () => {
  const shown = (v) => listFor('categories', { categories: v });
  it('arrows move one step, not past the ends', () => {
    const v = move({}, shown({}), second, -1);
    expect(shown(v).slice(0, 2).map((e) => e.id)).toEqual([second, first]);
    expect(move({}, shown({}), first, -1).order).toEqual([]);
  });
  it('the eye hides and shows again', () => {
    expect(toggleHidden(toggleHidden({}, first), first).hidden).toEqual([]);
  });
  it('a name equal to the Standard and the Standard symbol are no change', () => {
    const e = shown({})[0];
    const v = edit({}, e, { name: e.std, icon: stdIconName(e.id), stdIcon: stdIconName(e.id) });
    expect(v.names).toEqual({});
    expect(v.icons).toEqual({});
    expect(edit({}, e, { name: 'Strom', icon: 'Sun', stdIcon: stdIconName(e.id) })).toMatchObject({ names: { [first]: 'Strom' }, icons: { [first]: 'Sun' } });
  });
  it('own entries get the next colour, can be renamed and deleted for good', () => {
    const a = addOwn({}, { name: 'A' }, 'own-a').value;
    const b = addOwn(a, { name: 'B' }, 'own-b').value;
    expect(b.own.map((e) => e.color)).toEqual([OWN_COLORS[0], OWN_COLORS[1]]);
    const own = shown(b).find((e) => e.id === 'own-a');
    expect(edit(b, own, { name: 'Tennis' }).own[0].name).toBe('Tennis');
    expect(remove(b, own).own.map((e) => e.id)).toEqual(['own-b']);
  });
  it('deleting a Standard entry (answer 1b) also forgets its name, symbol, order and hidden', () => {
    const e = shown({})[0];
    const v = remove({ names: { [first]: 'X' }, icons: { [first]: 'Sun' }, hidden: [first], order: [second, first] }, e);
    expect(v).toMatchObject({ names: {}, icons: {}, hidden: [], order: [second], deleted: [first] });
  });
});

// LI3 «Gilt für» (Noah «2b» 15.10.2026): a category for some trip areas only.
describe('«Gilt für»: the trip areas of a category', () => {
  const shown = (v) => listFor('categories', { categories: v });
  it('without a choice a category applies to every area', () => {
    expect(catApplies(first, 'ski')).toBe(true);
    expect(catApplies(first, 'bikepacking')).toBe(true);
    expect(catApplies('no-such-category', 'ski')).toBe(true);
  });
  it('chosen areas reach CATEGORY and decide where the items are suggested', () => {
    const v = edit({}, shown({})[0], { name: '', areas: ['bikepacking', 'hiking'] });
    expect(v.areas).toEqual({ [first]: ['bikepacking', 'hiking'] });
    applyLists({ categories: v });
    expect(CATEGORY[first].areas).toEqual(['bikepacking', 'hiking']);
    expect(catApplies(first, 'hiking')).toBe(true);
    expect(catApplies(first, 'ski')).toBe(false);
    expect(catApplies(first, null)).toBe(true);
    expect(catApplies(second, 'ski')).toBe(true);
  });
  it('all areas again (null) or none stores nothing; leaving areas out keeps them', () => {
    const v = edit({}, shown({})[0], { name: '', areas: ['ski'] });
    expect(edit(v, shown(v)[0], { name: '' }).areas).toEqual({ [first]: ['ski'] });
    expect(edit(v, shown(v)[0], { name: '', areas: null }).areas).toEqual({});
    expect(edit(v, shown(v)[0], { name: '', areas: [] }).areas).toEqual({});
  });
  it('an own category can have areas from the start, deleting forgets them', () => {
    const { value, id } = addOwn({}, { name: 'Tennis', areas: ['weekend'] }, 'own-t');
    expect(shown(value).find((e) => e.id === id).areas).toEqual(['weekend']);
    const v = remove(edit({}, shown({})[0], { name: '', areas: ['ski'] }), shown({})[0]);
    expect(v.areas).toEqual({});
  });
  it('areas count as a change, «Auf Standard zurücksetzen» drops them', () => {
    const v = edit({}, shown({})[0], { name: '', areas: ['ski'] });
    expect(shown(v)[0].areas).toEqual(['ski']);
    expect(shown({})[0].areas).toBe(null);
  });
});
