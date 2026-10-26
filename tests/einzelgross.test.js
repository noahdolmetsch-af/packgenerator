// Einzelideen Planen, grosse Teile (996 Ideen 10, 11, 15, 16; Noah 26.10.2026 «1a 2a 3a 4a 5a»):
// Pflanzenpass, doppelter Eingang, Mail als Vorgang, Erinnerungskarte. Fictional data only.
import { describe, it, expect } from 'vitest';
import DE from '../src/lib/i18n/de/index.js';
import { SUN, WIND, WET, passEntry, withEntry, moveTo, withoutEntry, spots, spotNow, passHint, passOf } from '../src/lib/merken/plantpass.js';
import { doublePairs, caseFor, caseSuggestions, mailRole, ROLES, newCase, renameCase, dropCase, moveEntries, entriesByCase, noKey, withNo, nameFrom, subjectCore } from '../src/lib/inbox/vorgang.js';
import { cardOf, newCard, cardParts, cardNotes, relOverview, RELS, AFTER } from '../src/lib/notes/context.js';

const P = 'test_data_eg_';
const plant = (extra = {}) => ({ id: `${P}olive`, text: `${P}Olivenbaum`, created: '2026-05-29T08:00:00Z', plant: { every: 4, place: 'Balkon', last: '2026-10-20' }, ...extra });

describe('Pflanzenpass', () => {
  it('an observation needs something to say; a move needs a place', () => {
    expect(passEntry({ day: '2026-10-21' })).toBeNull();
    expect(passEntry({ day: '2026-10-21', kind: 'move' })).toBeNull();
    expect(passEntry({ day: 'nope', sun: 'full' })).toBeNull();
    const e = passEntry({ id: 'e1', day: '2026-10-21', sun: 'full', wind: 'storm', wet: 'dry' });
    expect(e).toEqual({ id: 'e1', day: '2026-10-21', kind: 'obs', place: '', sun: 'full', wet: 'dry' });
  });
  it('the first move keeps the old spot from the day the plant was added; the place follows the newest move', () => {
    const td = moveTo(plant(), { id: 'm1', day: '2026-10-12', place: 'Terrasse, Ostecke' });
    expect(td.plant.place).toBe('Terrasse, Ostecke');
    expect(spots(td)).toEqual([
      { place: 'Balkon', from: '2026-05-29', to: '2026-10-12' },
      { place: 'Terrasse, Ostecke', from: '2026-10-12', to: null },
    ]);
    const back = withoutEntry(td, 'm1');
    expect(back.plant.place).toBe('Balkon');
    expect(passOf(back).length).toBe(1);
  });
  it('the hint comes from at least two observations at the spot now, and is only a question', () => {
    let td = moveTo(plant(), { id: 'm1', day: '2026-10-12', place: 'Terrasse' });
    td = withEntry(td, passEntry({ id: 'o1', day: '2026-10-21', sun: 'full', wet: 'dry' }));
    expect(passHint(td)).toBeNull();
    td = withEntry(td, passEntry({ id: 'o2', day: '2026-10-25', sun: 'full', wind: 'windy', wet: 'dry' }));
    expect(spotNow(td)).toMatchObject({ sun: 'full', wet: 'dry', n: 2 });
    expect(passHint(td)).toBe('Here it dries out fast: water a little more often?');
    expect(td.plant.every).toBe(4); // never changes the interval by itself
  });
});

const mail = (id, subject, from, at, extra = {}) => ({ id: `${P}${id}`, status: 'open', at, mail: { subject, from, fromName: from.split('@')[0], date: at }, text: '', ...extra });

describe('Vorgänge: double entries and mail as a matter', () => {
  const now = Date.parse('2026-10-25T12:00:00Z');
  const hotel = mail('h1', 'Buchungsbestätigung Hotel Alpenblick Nr. 482913', 'info@hotel-beispiel.ch', '2026-10-23T10:00:00Z');
  const photo = { id: `${P}p1`, status: 'open', at: '2026-10-24T09:00:00Z', photo: 'data:image/png;base64,AA', text: 'Quittung Hotel Alpenblick 482913' };
  it('a mail and a photo with the same booking number are a pair; a «no» hides it', () => {
    const pairs = doublePairs([hotel, photo], { now });
    expect(pairs.length).toBe(1);
    expect(pairs[0].why[0]).toEqual({ kind: 'number', text: '482913' });
    expect(doublePairs([hotel, photo], { now, no: [noKey(photo.id, hotel.id)] })).toEqual([]);
    expect(doublePairs([hotel, { ...photo, caseId: 'c' }].map((n) => ({ ...n, caseId: 'c' })), { now })).toEqual([]);
  });
  it('a reply with the same subject fits the matter of the first mail', () => {
    const c = newCase('Hotel Alpenblick', 'now');
    const first = { ...hotel, caseId: c.id };
    const reply = mail('h2', 'Re: Buchungsbestätigung Hotel Alpenblick Nr. 482913', 'info@hotel-beispiel.ch', '2026-10-24T10:00:00Z');
    expect(caseFor(reply, [first, reply], [c])).toEqual({ caseId: c.id, why: 'subject' });
    expect(caseSuggestions([first, reply], [c], { no: [noKey(reply.id, c.id)] })).toEqual([]);
    expect(subjectCore('AW: Re: Buchung 12')).toBe('buchung 12');
    expect(nameFrom(reply)).toBe('Buchungsbestätigung Hotel Alpenblick Nr. 482913');
  });
  it('mail roles are a guess for the chip', () => {
    expect(mailRole(mail('r', 'Rechnung 2026-1187 Velo Service', 'a@b.ch', '2026-10-22T10:00:00Z'))).toBe('bill');
    expect(mailRole(mail('q', 'Kurze Frage zum Termin', 'a@b.ch', '2026-10-22T10:00:00Z'))).toBe('question');
    expect(Object.keys(ROLES)).toEqual(['confirm', 'question', 'bill']);
  });
  it('a matter is a group: add, rename, delete; its entries move or go out, never away', () => {
    const a = newCase(' Veloservice ', 'now');
    expect(newCase('  ')).toBeNull();
    const b = newCase('Hotel', 'now');
    let cases = renameCase([a, b], a.id, 'Veloservice Frühling');
    expect(cases[0].name).toBe('Veloservice Frühling');
    cases = dropCase(cases, a.id);
    expect(cases.map((c) => c.id)).toEqual([b.id]);
    const notes = [{ id: 'n1', caseId: a.id }, { id: 'n2', caseId: b.id }];
    expect(moveEntries(notes, a.id, null)).toEqual([{ id: 'n1', caseId: null }]);
    expect(moveEntries(notes, a.id, b.id)).toEqual([{ id: 'n1', caseId: b.id }]);
    expect(Object.keys(entriesByCase(notes))).toEqual([a.id, b.id]);
    expect(withNo(['x'], 'y')).toEqual(['y', 'x']);
  });
});

describe('Erinnerungskarte', () => {
  const n = { id: `${P}lake`, status: 'kept', title: `${P}Abend am Lac de Joux`, text: 'Wellen und **Wind**', photos: ['data:image/png;base64,AA'], place: { lat: 46.63, lon: 6.28, label: 'Lac de Joux' } };
  it('a card holds the picture index and a sound of at most one minute', () => {
    expect(newCard({ photo: -1, voice: 'http://x', voiceS: 90 }, 'now')).toEqual({ photo: 0, at: 'now' });
    expect(newCard({ photo: 0, voice: 'data:audio/webm;base64,AA', voiceS: 90 }, 'now')).toEqual({ photo: 0, at: 'now', voice: 'data:audio/webm;base64,AA', voiceS: 60 });
  });
  it('the scene takes text and place from the note; without a card there is none', () => {
    expect(cardOf(n)).toBeNull();
    const withCard = { ...n, card: newCard({ voice: 'data:audio/webm;base64,AA', voiceS: 12 }, '2026-10-20T18:00:00Z') };
    const s = cardOf(withCard);
    expect(s.place).toBe('Lac de Joux');
    expect(s.text).toBe('Wellen und Wind');
    expect(cardParts(s)).toBe(4);
    expect(cardNotes([n, withCard]).map((x) => x.id)).toEqual([n.id]);
  });
  it('the overview sorts links by meaning', () => {
    const a = { id: 'a', status: 'kept', title: `${P}a`, links: [{ kind: 'note', ref: 'b', rel: 'source' }, { kind: 'note', ref: 'c' }] };
    const o = relOverview([a, { id: 'b', status: 'kept', title: `${P}b` }, { id: 'c', status: 'kept', title: `${P}c` }]);
    expect(o.source.length).toBe(1);
    expect(o.none.length).toBe(1);
  });
});

describe('every label of the new parts has a German text', () => {
  it('lists, hints, roles and meanings', () => {
    const keys = [...SUN, ...WIND, ...WET].map((x) => x.label).concat(
      ['Here it dries out fast: water a little more often?', 'Here the soil stays wet: water a little less often?', 'A windy spot: a more sheltered place may suit it better.'],
      Object.values(ROLES),
      RELS.flatMap((r) => [r.own, r.back]),
      AFTER.flatMap((a) => [a.label, a.short]),
    );
    expect(keys.filter((k) => !DE[k])).toEqual([]);
  });
});
