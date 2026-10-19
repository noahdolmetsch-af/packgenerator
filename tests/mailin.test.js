// «Mail in die App» (Noah 19.10.2026): a mail becomes one Eingang entry with its attachments; the tips (bill,
// booking, deadline, sender); the label, the task list and #pack appointments come in once; the new targets.
// Fictional mails, senders and trips only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import {
  fileKind, fileAction, keepFile, filesToFetch, mailNote, vcfLines, passLines, plusAddress, takenWith, findBooking, tripFor,
  findDeadline, senderKind, learnSender, tipOf, amountOf, ibanOf, eventFrom, dayOfNote, TAKEN_KEY, TAKEN_MAX, FILE_MAX, SMALL_PICTURE, LABEL_QUERY,
} from '../src/lib/mailin.js';
import { guessTarget, TARGETS, targetHref } from '../src/lib/inbox.js';
import { takeMail, fetchLabelled, fetchTaskList, fetchPackEvents, fetchOutside } from '../src/lib/mail/intake.svelte.js';

const MAIL = { id: 'g1', from: 'buchung@hotel.example.test', fromName: 'Hotel Muster', subject: 'Buchungsbestätigung Hotel Muster', date: '2026-10-19T08:00:00.000Z', text: 'Grüezi\nIhre Buchung ist bestätigt.\nCheck-in: 24.10.2026\nBuchungsnummer: HM-4711' };

describe('files of a mail', () => {
  it('knows the kinds and what each becomes', () => {
    expect(fileKind({ name: 'Rechnung.PDF' })).toBe('pdf');
    expect(fileKind({ name: 'x', type: 'text/calendar' })).toBe('ics');
    expect(fileKind({ name: 'ticket.pkpass' })).toBe('pkpass');
    expect(fileKind({ name: 'jura.gpx' })).toBe('gpx');
    expect(fileKind({ name: 'anna.vcf' })).toBe('vcf');
    expect(fileKind({ name: 'foto.jpg' })).toBe('photo');
    expect(fileKind({ name: 'a.zip' })).toBe('other');
    expect(fileAction({ name: 'Rechnung-123.pdf' })).toBe('bill');
    expect(fileAction({ name: 'Prospekt.pdf' })).toBe('doc');
    expect(fileAction({ name: 'termin.ics' })).toBe('event');
    expect(fileAction({ name: 'route.gpx' })).toBe('route');
    expect(fileAction({ name: 'karte.vcf' })).toBe('contact');
    expect(fileAction({ name: 'a.zip' })).toBe(null);
  });
  it('leaves logos, unknown and too big files in Gmail; at most 10 MB together', () => {
    expect(keepFile({ name: 'logo.png', size: SMALL_PICTURE - 1 })).toBe(false);
    expect(keepFile({ name: 'foto.jpg', size: 200_000 })).toBe(true);
    expect(keepFile({ name: 'a.pdf', size: FILE_MAX + 1 })).toBe(false);
    const big = (n) => ({ name: `${n}.pdf`, size: FILE_MAX - 10, att: n });
    const { take, skip } = filesToFetch([big('a'), big('b'), big('c'), big('d'), { name: 'logo.png', size: 2000, att: 'l' }, { name: 'x.zip', size: 10, att: 'z' }]);
    expect(take.map((f) => f.name)).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
    expect(skip).toEqual(['d.pdf']);
  });
  it('a mail becomes one open entry with sender, subject and its files', () => {
    const n = mailNote(MAIL, [{ name: 'Bestätigung.pdf', type: 'application/pdf', size: 9, data: 'data:application/pdf;base64,AA==' }], { id: 'n1', now: '2026-10-19T09:00:00.000Z', skipped: ['Plan.pdf'] });
    expect(n).toMatchObject({ id: 'n1', status: 'open', page: 'mail', to: null, mail: { id: 'g1', from: MAIL.from, subject: MAIL.subject, skipped: ['Plan.pdf'] } });
    expect(n.text.startsWith('Buchungsbestätigung Hotel Muster\n\nGrüezi')).toBe(true);
    expect(n.files).toEqual([{ id: 'f0', name: 'Bestätigung.pdf', type: 'application/pdf', size: 9, kind: 'pdf', data: 'data:application/pdf;base64,AA==', done: null }]);
  });
  it('reads a contact and a wallet ticket', () => {
    expect(vcfLines('BEGIN:VCARD\r\nFN:Anna Muster\r\nTEL;TYPE=cell:+41 79 000 00 00\r\nEMAIL:anna@example.test\r\nEND:VCARD')).toEqual(['Anna Muster', 'Tel. +41 79 000 00 00', 'anna@example.test']);
    const lines = passLines({ description: 'Zugbillett', organizationName: 'Bahn Muster', relevantDate: '2026-10-24T07:12:00+02:00', boardingPass: { primaryFields: [{ label: 'Von', value: 'Bern' }, { label: 'Nach', value: 'Biel' }] }, barcodes: [{ message: 'ABC123' }] });
    expect(lines).toEqual(['Zugbillett', 'Bahn Muster', '2026-10-24 07:12', 'Von: Bern', 'Nach: Biel', 'Code: ABC123']);
  });
  it('the +pack address and the taken ids', () => {
    expect(plusAddress('vorname.name@gmail.com')).toBe('vorname.name+pack@gmail.com');
    expect(plusAddress('vorname+alt@gmail.com')).toBe('vorname+pack@gmail.com');
    expect(plusAddress('kein')).toBe('');
    expect(takenWith(['a', 'b'], 'b')).toEqual(['b', 'a']);
    expect(takenWith(Array.from({ length: TAKEN_MAX }, (_, i) => `x${i}`), 'new').length).toBe(TAKEN_MAX);
    expect(LABEL_QUERY).toContain('label:packgenerator');
  });
});

describe('the tip (3a) and the suggestion', () => {
  const trips = [{ id: 'tr1', title: 'Jura', startDate: '2026-10-24', days: 3 }, { id: 'tr2', title: 'Alt', startDate: '2026-09-01', days: 1, skipped: true }];
  it('finds a booking with its day and code and the trip it belongs to', () => {
    expect(findBooking(MAIL.text + '\nHotel')).toEqual({ kind: 'hotel', day: '2026-10-24', code: 'HM-4711' });
    expect(findBooking('Wir fahren mit dem Zug')).toBe(null);
    expect(tripFor(trips, '2026-10-25')?.id).toBe('tr1');
    expect(tripFor(trips, '2026-10-22')?.id).toBe('tr1'); // starts within 3 days
    expect(tripFor(trips, '2026-10-10')).toBe(null);
  });
  it('finds deadlines', () => {
    expect(findDeadline('Bitte zahlbar bis 30.10.2026.')).toEqual({ what: 'due', day: '2026-10-30' });
    expect(findDeadline('Rückgabe bis 2. November 2026 möglich')).toEqual({ what: 'return', day: '2026-11-02' });
    expect(findDeadline('Garantie: 2 Jahre', '2026-10-19')).toEqual({ what: 'warranty', day: '2028-10-19' });
    expect(findDeadline('Hallo')).toBe(null);
  });
  it('amount, IBAN, an appointment from the text', () => {
    expect(amountOf('Betrag CHF 1’240.50')).toBe(1240.5);
    expect(amountOf('Total 89.00 CHF')).toBe(89);
    expect(amountOf('nichts')).toBe(null);
    expect(ibanOf('IBAN CH93 0076 2011 6238 5295 7')).toBe('CH9300762011623852957');
    expect(eventFrom({ text: 'Fwd: Velo-Service\nAm 28.10.2026 um 14:30 Uhr', mail: { subject: 'Fwd: Velo-Service' } })).toEqual({ title: 'Velo-Service', day: '2026-10-28', from: '14:30' });
    expect(dayOfNote({ plan: { day: '2026-11-01' } })).toBe('2026-11-01');
  });
  it('a sender filed the same way twice is suggested (4a)', () => {
    const n = { mail: { from: 'Shop@Example.test' }, text: 'Hallo' };
    let rules = learnSender({}, n, 'doc');
    expect(senderKind(rules, n)).toBe(null);
    rules = learnSender(rules, n, 'doc');
    expect(senderKind(rules, n)).toBe('doc');
    expect(senderKind(learnSender(rules, n, 'bill'), n)).toBe(null); // another kind starts again
    expect(tipOf(n, { rules })).toEqual({ kind: 'sender', target: 'doc' });
  });
  it('the suggestion of a mail entry: booking → trip note, bill, deadline → task, files → document, #pack → new trip', () => {
    const base = { status: 'open', page: 'mail', mail: { from: 'x@example.test' } };
    expect(guessTarget({ ...base, text: MAIL.text + ' Hotel' }, { trips })).toBe('tour');
    expect(guessTarget({ ...base, text: MAIL.text + ' Hotel' }, { trips: [] })).toBe('event');
    expect(guessTarget({ ...base, text: 'Rechnung Nr. 5\nzahlbar bis 30.10.2026\nCHF 45.00' })).toBe('bill');
    expect(guessTarget({ ...base, text: 'Ihre Bestellung. Rückgabe bis 2.11.2026' })).toBe('task');
    expect(guessTarget({ ...base, text: 'Anbei die Unterlagen', files: [{ kind: 'pdf', done: null }] })).toBe('doc');
    expect(guessTarget({ ...base, text: 'Hallo' })).toBe('keep');
    expect(guessTarget({ status: 'open', page: 'calendar', plan: { title: 'Jura', day: '2026-10-24', days: 2 }, text: 'Jura' })).toBe('newtrip');
    // a note written in the app keeps the old rules
    expect(guessTarget({ status: 'open', text: 'Quittung Velo CHF 45.00' })).toBe('receipt');
    for (const k of ['newtrip', 'bill', 'event', 'task', 'doc', 'list']) expect(TARGETS.some((x) => x.key === k), k).toBe(true);
    expect(targetHref({ kind: 'doc' })).toBe('#/me/docs');
    expect(targetHref({ kind: 'list', ref: 'ls-1' })).toBe('#/calendar/list/ls-1');
  });
});

describe('coming in (2a, round 4)', () => {
  const fake = () => {
    const log = [];
    const c = async (step, o = {}) => {
      log.push(step);
      if (step === 'mail-list') return { mails: [{ id: 'g1' }, { id: 'g2' }] };
      if (step === 'mail-get') return { mail: { ...MAIL, id: o.params.id, files: [{ name: 'Bestätigung.pdf', type: 'application/pdf', size: 20_000, att: 'a1' }, { name: 'logo.png', type: 'image/png', size: 900, att: 'a2' }] } };
      if (step === 'mail-file') return { data: Buffer.from('%PDF').toString('base64'), size: 4 };
      if (step === 'task-lists') return { lists: [{ id: 'L1', title: 'Einkauf' }, { id: 'L2', title: 'packgenerator' }] };
      if (step === 'tasks') return { tasks: [{ id: 't1', title: 'Schlauch kaufen', due: '2026-10-21', done: false }, { id: 't2', title: 'erledigt', done: true }] };
      return {};
    };
    return { c, log };
  };
  it('takes a mail once, with the PDF and without the logo', async () => {
    const db = createDb(`mailin-${Math.random()}`);
    await db.open();
    const { c, log } = fake();
    const a = await takeMail('g1', { db, c });
    expect(a.existed).toBe(false);
    expect(a.note.files.map((f) => [f.name, f.data])).toEqual([['Bestätigung.pdf', `data:application/pdf;base64,${Buffer.from('%PDF').toString('base64')}`]]);
    expect(log.filter((s) => s === 'mail-file').length).toBe(1);
    const b = await takeMail('g1', { db, c });
    expect(b.existed).toBe(true);
    expect((await db.settings.get(TAKEN_KEY)).value).toEqual(['g1']);
  });
  it('the label brings each mail once; the task list «Packgenerator» brings open tasks once', async () => {
    const db = createDb(`mailin-${Math.random()}`);
    await db.open();
    const { c } = fake();
    expect(await fetchLabelled({ db, c })).toBe(2);
    expect(await fetchLabelled({ db, c })).toBe(0);
    expect(await fetchTaskList({ db, c })).toBe(1);
    expect(await fetchTaskList({ db, c })).toBe(0);
    const task = (await db.notes.toArray()).find((n) => n.page === 'tasks');
    expect(task).toMatchObject({ text: 'Schlauch kaufen', due: '2026-10-21', status: 'open' });
    expect(guessTarget(task)).toBe('task');
  });
  it('#pack appointments from today on become a trip suggestion, once', async () => {
    const db = createDb(`mailin-${Math.random()}`);
    await db.open();
    await db.gEvents.bulkPut([
      { id: 'c|e1', gid: 'e1', cal: 'c', title: 'Jura-Runde #pack', day: '2026-10-24', lastDay: '2026-10-26', where: 'Biel' },
      { id: 'c|e2', gid: 'e2', cal: 'c', title: 'Zahnarzt', day: '2026-10-24', lastDay: '2026-10-24' },
      { id: 'c|e3', gid: 'e3', cal: 'c', title: 'Alt #pack', day: '2026-10-01', lastDay: '2026-10-01' },
    ]);
    expect(await fetchPackEvents({ db, today: '2026-10-19' })).toBe(1);
    expect(await fetchPackEvents({ db, today: '2026-10-19' })).toBe(0);
    const n = (await db.notes.toArray())[0];
    expect(n.plan).toEqual({ title: 'Jura-Runde', day: '2026-10-24', days: 3 });
  });
  it('looks outside at most every 10 minutes unless asked', async () => {
    const db = createDb(`mailin-${Math.random()}`);
    await db.open();
    const store = {};
    const ls = { getItem: (k) => store[k] ?? null, setItem: (k, v) => (store[k] = v) };
    expect(await fetchOutside({ db, ls, now: 1_000_000 })).toBe(0); // no key on this device: only the calendar copy
    expect(store['pg.mailin.looked']).toBe('1000000');
    expect(await fetchOutside({ db, ls, now: 1_000_000 + 60_000 })).toBe(0);
  });
});

describe('the new targets (fileMore) and «Rückgängig»', async () => {
  const { fileMore, fileToPlan, undoMore, fileContact, fileToDoc } = await import('../src/lib/inbox/filemore.js');
  const { LISTS_KEY } = await import('../src/lib/ownlists.js');
  const { BILLS_KEY } = await import('../src/lib/pay/bills.js');
  const entry = (extra = {}) => ({ ...mailNote(MAIL, [{ name: 'Bestätigung.pdf', type: 'application/pdf', size: 4, data: 'data:application/pdf;base64,JVBERg==' }], { id: 'n1' }), ...extra });
  const fresh = async () => {
    const db = createDb(`mailin-${Math.random()}`);
    await db.open();
    return db;
  };
  it('Dokument: the PDF and the text as a PDF; undo removes both', async () => {
    const db = await fresh();
    const n = await fileMore(entry(), 'doc', { name: 'Hotel Jura', text: true }, { db });
    expect(n).toMatchObject({ status: 'sorted', to: { kind: 'doc' } });
    expect(n.files[0]).toMatchObject({ done: 'doc', byEntry: true });
    const docs = await db.docs.toArray();
    expect(docs.length).toBe(2);
    expect(docs.every((d) => d.source === 'mail' && d.kind === 'pdf')).toBe(true);
    await undoMore(n.to.made, { db });
    expect(await db.docs.count()).toBe(0);
  });
  it('Rechnung: a bill with amount and day, the PDF along', async () => {
    const db = await fresh();
    const n = await fileMore(entry(), 'bill', { to: 'Hotel Muster', amount: 120.5, due: '2026-10-30', keepPdf: true }, { db });
    const bills = (await db.settings.get(BILLS_KEY)).value;
    expect(bills[0]).toMatchObject({ to: 'Hotel Muster', amount: 12050, due: '2026-10-30', status: 'open' });
    expect(await db.docs.count()).toBe(1);
    await undoMore(n.to.made, { db });
    expect((await db.settings.get(BILLS_KEY)).value).toEqual([]);
  });
  it('Liste: a point on a new list; undo takes the point away', async () => {
    const db = await fresh();
    const n = await fileMore(entry(), 'list', { newName: 'Ferien' }, { db });
    const lists = (await db.settings.get(LISTS_KEY)).value;
    expect(lists[0].name).toBe('Ferien');
    expect(lists[0].items[0].text).toBe('Buchungsbestätigung Hotel Muster');
    await undoMore(n.to.made, { db });
    expect((await db.settings.get(LISTS_KEY)).value[0].items).toEqual([]);
  });
  it('Neue Tour: a trip with its packing list; a booking before the trip: a planning note', async () => {
    const db = await fresh();
    const bike = { id: 'b1', name: 'Gravel Muster', setup: {}, slots: [] };
    const n = await fileMore(entry(), 'newtrip', { title: 'Jura', startDate: '2026-10-24', days: 2, bike, trips: [], items: [] }, { db });
    const trip = await db.trips.get(n.to.ref);
    expect(trip).toMatchObject({ title: 'Jura', startDate: '2026-10-24', days: 2, bikeId: 'b1' });
    const p = await fileToPlan(entry({ id: 'n2' }), trip, { db, now: new Date('2026-10-19T10:00:00Z') });
    expect((await db.trips.get(trip.id)).planNotes[0].text).toBe('Buchungsbestätigung Hotel Muster');
    expect(p.to).toMatchObject({ kind: 'tour', plan: true, ref: trip.id });
    await undoMore(p.to.made, { db });
    expect((await db.trips.get(trip.id)).planNotes).toEqual([]);
    await undoMore(n.to.made, { db });
    expect(await db.trips.count()).toBe(0);
  });
  it('one attachment: a PDF into Documents, a contact into the note', async () => {
    const db = await fresh();
    const vcf = `data:text/vcard;base64,${Buffer.from('BEGIN:VCARD\nFN:Anna Muster\nTEL:+41 79 000 00 00\nEND:VCARD').toString('base64')}`;
    const e = entry({ files: [{ id: 'f0', name: 'a.pdf', kind: 'pdf', size: 4, data: 'data:application/pdf;base64,JVBERg==', done: null }, { id: 'f1', name: 'anna.vcf', kind: 'vcf', size: 9, data: vcf, done: null }] });
    const a = await fileToDoc(e, 'f0', { db });
    expect(a.files[0].done).toBe('doc');
    expect(a.status).toBe('open'); // the entry itself stays to sort
    const b = await fileContact(a, 'f1', { db });
    expect(b.text.endsWith('Anna Muster\nTel. +41 79 000 00 00')).toBe(true);
  });
});
