// Gruppenfahrt für Events «5a»: the contact card and the people met at events, grouped by event. Fictional data only.
import { describe, it, expect } from 'vitest';
import { cardShown, addPerson, peopleOf, byGroup, renameGroup, moveGroup, deleteGroup, removePerson, updatePerson, instaLink, telLink, waLink, mailLink, webLink, stravaLink, komootLink, mapLink, cardVcf } from '../src/lib/freunde/people.js';

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
  it('Kontakt-QR-Code: the address stays off until ticked, the rest shows once filled in', () => {
    const card = { name: `${P}Sam`, email: 'sam@example.test', addr: 'Testweg 1', strava: '123', phone: '079' };
    expect(cardShown(card)).toEqual({ name: `${P}Sam`, email: 'sam@example.test', strava: '123' });
    expect(cardShown({ ...card, show: { addr: true, phone: true, email: false } })).toEqual({ name: `${P}Sam`, phone: '079', strava: '123', addr: 'Testweg 1' });
  });
  it('Kontakt-QR-Code: only safe links come out', () => {
    expect(waLink('079 000 00 00')).toBe('https://wa.me/41790000000');
    expect(waLink('+49 170 000')).toBe('https://wa.me/49170000');
    expect(mailLink('sam@example.test')).toBe('mailto:sam@example.test');
    expect(mailLink('nicht-mail')).toBe('');
    expect(webLink('example.test')).toBe('https://example.test/');
    expect(webLink('javascript:alert(1)')).toBe('');
    expect(stravaLink('123')).toBe('https://www.strava.com/athletes/123');
    expect(stravaLink('https://www.strava.com/athletes/123')).toBe('https://www.strava.com/athletes/123');
    expect(stravaLink('sam')).toBe('');
    expect(komootLink('sam-k')).toBe('https://www.komoot.com/user/sam-k');
    expect(mapLink('Testweg 1')).toBe('https://www.openstreetmap.org/search?query=Testweg%201');
  });
  it('Kontakt-QR-Code: the card as a contact file', () => {
    const v = cardVcf({ name: `${P}Sam Test;er`, phone: '079 000 00 00', email: 'sam@example.test', addr: 'Testweg 1, 0000 Testdorf', strava: '123', note: 'Gravel' });
    expect(v.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n')).toBe(true);
    expect(v).toContain('N:Test\\;er;test_data_gtp_Sam;;;');
    expect(v).toContain('TEL;TYPE=CELL:0790000000');
    expect(v).toContain('EMAIL;TYPE=INTERNET:sam@example.test');
    expect(v).toContain('ADR;TYPE=HOME:;;Testweg 1\\, 0000 Testdorf;;;;');
    expect(v).toContain('URL:https://www.strava.com/athletes/123');
    expect(v.trimEnd().endsWith('END:VCARD')).toBe(true);
    expect(cardVcf({ name: '' })).toBe('');
  });
});
