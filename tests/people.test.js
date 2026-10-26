// Gruppenfahrt für Events «5a»: the contact card and the people met at events, grouped by event. Fictional data only.
import { describe, it, expect } from 'vitest';
import { cardShown, addPerson, peopleOf, byGroup, renameGroup, moveGroup, deleteGroup, removePerson, updatePerson, instaLink, telLink } from '../src/lib/freunde/people.js';

const P = 'test_data_gtp_';
describe('Kontaktkarte und Leute von Events', () => {
  it('the card shows only what is ticked and filled in', () => {
    expect(cardShown({ name: `${P}Sam`, insta: '@velo', phone: '079', bike: '', show: { phone: false } })).toEqual({ name: `${P}Sam`, insta: '@velo' });
  });
  it('people by event: a new event is made, the same person is updated, without an event last', () => {
    let l = peopleOf(null);
    l = addPerson(l, { name: `${P}Lea`, insta: '@lea' }, `${P}Jura`);
    l = addPerson(l, { name: `${P}Tom` }, `${P}jura`);
    l = addPerson(l, { name: `${P}Lea`, insta: '@lea', bike: 'Gravel' }, `${P}Jura`);
    l = addPerson(l, { name: `${P}Sara` }, '');
    l = addPerson(l, { name: '' }, 'x');
    expect(l.groups).toHaveLength(1);
    const g = byGroup(l);
    expect(g.map((x) => [x.group?.name ?? null, x.people.map((p) => p.name)])).toEqual([[`${P}Jura`, [`${P}Lea`, `${P}Tom`]], [null, [`${P}Sara`]]]);
    expect(g[0].people[0].bike).toBe('Gravel');
  });
  it('events are renamed, sorted and deleted; their people stay', () => {
    let l = addPerson(addPerson(peopleOf(null), { name: 'A' }, 'E1'), { name: 'B' }, 'E2');
    const [e1, e2] = l.groups;
    l = renameGroup(l, e1.id, 'Event eins');
    expect(l.groups[0].name).toBe('Event eins');
    expect(renameGroup(l, e1.id, '  ')).toBe(l);
    l = moveGroup(l, 0, 1);
    expect(l.groups.map((g) => g.id)).toEqual([e2.id, e1.id]);
    const moved = deleteGroup(l, e1.id, e2.id);
    expect(moved.people.map((p) => p.group)).toEqual([e2.id, e2.id]);
    const none = deleteGroup(l, e1.id);
    expect(none.people.find((p) => p.name === 'A').group).toBe('');
    const id = none.people[0].id;
    expect(updatePerson(none, id, { memo: 'Tipp Schlafsack' }).people[0].memo).toBe('Tipp Schlafsack');
    expect(removePerson(none, id).people).toHaveLength(1);
  });
  it('links to Instagram and the phone', () => {
    expect(instaLink('@test_data_velo')).toBe('https://www.instagram.com/test_data_velo/');
    expect(telLink('+41 79 000 00 00')).toBe('tel:+41790000000');
    expect(instaLink('')).toBe('');
  });
});
