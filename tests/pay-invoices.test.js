// Rechnungen (mockups QR1–QR4 + QR7, Noah 14.10.2026 04:00 «a»): Swiss QR bill data, references,
// the invoice list in the settings table, «Geld erhalten» and the mail texts, and the PDF wrapper.
// Fictional accounts only: the IBANs below are the public sample IBANs of the Swiss standard.
import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { createDb } from '../src/lib/db.js';
import {
  isIban, isQrIban, mod10, qrReference, scorReference, isScor, referenceFor, formatReference, formatIban, parseAmount, formatAmount, payload, accountProblems,
} from '../src/lib/pay/qrbill.js';
import { createInvoice, listInvoices, markPaid, markOpen, deleteInvoice, openWithAmount, openSummary, formatTwint, invoiceMail, paidMail, mailtoHref, INVOICES_KEY } from '../src/lib/pay/invoices.js';
import { pdfFromJpeg } from '../src/lib/pay/billpdf.js';
import { qrMatrix, swissCross } from '../src/lib/pay/qrmatrix.js';
import { buildBackup } from '../src/lib/backup.js';

const QR_IBAN = 'CH44 3199 9123 0008 8901 2'; // sample QR-IBAN of the standard
const IBAN = 'CH93 0076 2011 6238 5295 7'; // sample normal IBAN
const ACCOUNT = { iban: QR_IBAN, name: 'Beispiel Velo-Werkstatt', street: 'Musterweg', house: '1', zip: '8000', town: 'Zürich', twint: '079 000 00 00' };
const tr = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
let n = 0;
const freshDb = async () => {
  const db = createDb(`pay-invoices-${++n}`);
  await db.open();
  return db;
};

describe('Swiss QR bill data', () => {
  it('checks IBANs and tells QR-IBANs apart', () => {
    expect(isIban(QR_IBAN)).toBe(true);
    expect(isIban(IBAN)).toBe(true);
    expect(isIban('CH93 0076 2011 6238 5295 8')).toBe(false);
    expect(isIban('DE89370400440532013000')).toBe(false);
    expect(isQrIban(QR_IBAN)).toBe(true);
    expect(isQrIban(IBAN)).toBe(false);
    expect(formatIban('ch4431999123000889012')).toBe(QR_IBAN);
  });
  it('makes QR references with the modulo-10 check digit (sample of the standard)', () => {
    expect(mod10('21000000000313947143000901')).toBe(7);
    const ref = qrReference('R-0317');
    expect(ref).toHaveLength(27);
    expect(ref.endsWith(String(mod10(ref.slice(0, 26))))).toBe(true);
    expect(formatReference('210000000003139471430009017')).toBe('21 00000 00003 13947 14300 09017');
  });
  it('makes creditor references RF (sample of ISO 11649)', () => {
    expect(scorReference('539007547034')).toBe('RF18539007547034');
    expect(isScor(scorReference('R-0317'))).toBe(true);
    expect(isScor('RF19539007547034')).toBe(false);
  });
  it('picks the reference type from the account', () => {
    expect(referenceFor(QR_IBAN, 'R-0001').type).toBe('QRR');
    expect(referenceFor(IBAN, 'R-0001')).toEqual({ type: 'SCOR', ref: scorReference('R0001') });
  });
  it('reads amounts as people type them', () => {
    expect(parseAmount('80')).toBe(8000);
    expect(parseAmount('80,50')).toBe(8050);
    expect(parseAmount('CHF 1’250.00')).toBe(125000);
    expect(parseAmount('0')).toBe(null);
    expect(parseAmount('abc')).toBe(null);
    expect(formatAmount(8050)).toBe('80.50');
  });
  it('writes the code text in the order of the standard', () => {
    const lines = payload(ACCOUNT, { amount: 8000, refType: 'QRR', ref: qrReference('R-0317'), message: 'Tennisstunde · R-0317' }).split('\r\n');
    expect(lines.slice(0, 4)).toEqual(['SPC', '0200', '1', 'CH4431999123000889012']);
    expect(lines.slice(4, 11)).toEqual(['S', 'Beispiel Velo-Werkstatt', 'Musterweg', '1', '8000', 'Zürich', 'CH']);
    expect(lines[18]).toBe('80.00');
    expect(lines[19]).toBe('CHF');
    expect(lines[27]).toBe('QRR');
    expect(lines[28]).toBe(qrReference('R-0317'));
    expect(lines[29]).toBe('Tennisstunde · R-0317');
    expect(lines[30]).toBe('EPD');
    expect(lines).toHaveLength(31);
  });
  it('says what the account still needs', () => {
    expect(accountProblems(ACCOUNT)).toEqual([]);
    expect(accountProblems({ iban: 'x', name: '', zip: '', town: '' })).toEqual(['iban', 'name', 'town']);
  });
  it('draws a code with room for the Swiss cross', async () => {
    const m = await qrMatrix(payload(ACCOUNT, { amount: 8000, refType: 'QRR', ref: qrReference('1'), message: 'Größe äöü' }));
    expect(m.n).toBeGreaterThan(40);
    const x = swissCross(m.n);
    expect(x.box.w / m.n).toBeCloseTo(7 / 46, 5);
  });
});

describe('the invoice list', () => {
  it('numbers invoices, keeps them in settings and in the backup, without the account', async () => {
    const db = await freshDb();
    const a = await createInvoice({ name: 'Mia Beispiel', email: 'mia@example.com', amount: 8000, purpose: 'Tennisstunde 60 min' }, ACCOUNT, db);
    const b = await createInvoice({ name: 'Leo Muster', amount: 500, purpose: 'Packliste Vorlage', ways: { twint: false } }, ACCOUNT, db);
    expect([a.no, b.no]).toEqual(['R-0001', 'R-0002']);
    expect(a.refType).toBe('QRR');
    expect(a.ways).toEqual({ qr: true, twint: true });
    expect(b.ways).toEqual({ qr: true, twint: false });
    const list = await listInvoices(db);
    expect(list.map((x) => x.no)).toEqual(['R-0002', 'R-0001']);
    const backup = await buildBackup(db);
    const row = backup.tables.settings.find((r) => r.key === INVOICES_KEY);
    expect(row.value).toHaveLength(2);
    expect(JSON.stringify(backup)).not.toContain('CH4431999123000889012');
  });
  it('TWINT stays off without a number on the account', async () => {
    const db = await freshDb();
    const inv = await createInvoice({ name: 'Sara Test', amount: 100, purpose: 'Test' }, { ...ACCOUNT, twint: '' }, db);
    expect(inv.ways.twint).toBe(false);
  });
  it('marks paid, opens again and deletes', async () => {
    const db = await freshDb();
    const a = await createInvoice({ name: 'Mia Beispiel', amount: 8000, purpose: 'Tennis' }, ACCOUNT, db);
    await markPaid(a.id, 'amount', db);
    let [x] = await listInvoices(db);
    expect([x.status, x.paidVia]).toEqual(['paid', 'amount']);
    await markOpen(a.id, db);
    [x] = await listInvoices(db);
    expect(x.status).toBe('open');
    expect(x.paidVia).toBeUndefined();
    await deleteInvoice(a.id, db);
    expect(await listInvoices(db)).toEqual([]);
  });
  it('finds open invoices by amount and sums the open ones (Geld erhalten)', () => {
    const list = [
      { id: '1', amount: 8000, status: 'open' },
      { id: '2', amount: 8000, status: 'paid' },
      { id: '3', amount: 500, status: 'open' },
      { id: '4', amount: 8000, status: 'open' },
    ];
    expect(openWithAmount(list, 8000).map((x) => x.id)).toEqual(['1', '4']);
    expect(openSummary(list)).toEqual({ count: 3, sum: 16500 });
  });
});

describe('TWINT and mail texts', () => {
  it('writes Swiss mobile numbers the same way', () => {
    expect(formatTwint('0790000000')).toBe('079 000 00 00');
    expect(formatTwint('+41 79 000 00 00')).toBe('079 000 00 00');
    expect(formatTwint('12345')).toBe('');
  });
  it('puts only the ways that are on into the invoice mail', () => {
    const inv = { no: 'R-0317', name: 'Mia', amount: 8000, purpose: 'Tennisstunde', ref: '1', ways: { qr: false, twint: true } };
    const m = invoiceMail(inv, ACCOUNT, tr);
    expect(m.subject).toBe('Invoice R-0317: Tennisstunde');
    expect(m.body).toContain('079 000 00 00');
    expect(m.body).toContain('R-0317');
    expect(m.body).not.toContain('Reference');
    const p = paidMail(inv, ACCOUNT, tr);
    expect(p.body).toContain('80.00 CHF');
    expect(mailtoHref('mia@example.com', p)).toMatch(/^mailto:mia%40example\.com\?subject=/);
  });
});

describe('the PDF', () => {
  it('wraps a JPEG into a one-page A4 PDF with a correct cross-reference table', () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    const pdf = pdfFromJpeg(jpeg, 10, 20);
    const text = new TextDecoder('latin1').decode(pdf);
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text).toContain('/MediaBox [0 0 595.28 841.89]');
    expect(text).toContain('/Width 10 /Height 20');
    const start = Number(text.match(/startxref\n(\d+)/)[1]);
    expect(text.slice(start, start + 4)).toBe('xref');
    const offsets = [...text.slice(start).matchAll(/(\d{10}) 00000 n/g)].map((m) => Number(m[1]));
    offsets.forEach((o, i) => expect(text.slice(o, o + 7)).toBe(`${i + 1} 0 obj`));
  });
});

// ---------- Step 1b: bank statement, bill from the e-banking, Sunday reminder (mockups QR2, QR3, QR8) ----------
import { isCamt, readCamt, matchPayments, namesInvoice, readQrPayload } from '../src/lib/pay/camt.js';
import { markManyPaid, markManyOpen, readReminder, writeReminder, reminderDue, lastSundayEvening } from '../src/lib/pay/invoices.js';
import { camt054 } from './fixtures/camt054.js';

describe('the bank statement', () => {
  it('reads the incoming payments of a camt.054, one line per payment', () => {
    const xml = camt054();
    expect(isCamt(xml)).toBe(true);
    expect(isCamt('<html></html>')).toBe(false);
    const pays = readCamt(xml);
    expect(pays.map((p) => [p.amount, p.from])).toEqual([
      [8000, 'Mia Beispiel'],
      [500, 'Leo Muster'],
      [8000, 'Noa Beispiel'],
      [4000, 'Sara Test'],
    ]);
    expect(pays[0]).toMatchObject({ date: '2026-10-13', ref: qrReference('R-0001') });
  });
  it('finds the invoice number in a TWINT message', () => {
    expect(namesInvoice('TWINT Mitteilung: r-0002', 'R-0002')).toBe(true);
    expect(namesInvoice('R0317 danke', 'R-0317')).toBe(true);
    expect(namesInvoice('R-03170', 'R-0317')).toBe(false);
  });
  it('recognises by reference and by message, suggests by amount, ignores the rest', () => {
    const inv = (seq, amount, status = 'open', day = '2026-10-10') => ({ id: 'i' + seq, seq, no: 'R-000' + seq, ref: qrReference('R-000' + seq), amount, status, createdAt: day });
    const list = [inv(1, 8000), inv(2, 500), inv(3, 8000, 'open', '2026-10-12'), inv(4, 8000, 'open', '2026-10-11'), inv(5, 9900, 'paid')];
    const r = matchPayments(readCamt(camt054()), list);
    expect(r.found.map((f) => [f.inv.no, f.how])).toEqual([
      ['R-0001', 'ref'],
      ['R-0002', 'text'],
    ]);
    expect(r.unclear).toHaveLength(1);
    expect(r.unclear[0].pay.from).toBe('Noa Beispiel');
    expect(r.unclear[0].suggest.no).toBe('R-0004'); // the oldest open one with the same amount
    expect(r.ignored).toBe(1); // Sara's 40.00 matches nothing
  });
  it('marks many paid and opens them again', async () => {
    const db = await freshDb();
    const a = await createInvoice({ name: 'A', amount: 100, purpose: 'x' }, ACCOUNT, db);
    const b = await createInvoice({ name: 'B', amount: 200, purpose: 'y' }, ACCOUNT, db);
    expect(await markManyPaid([a.id, b.id], 'statement', db)).toEqual([b.id, a.id]);
    expect((await listInvoices(db)).every((x) => x.status === 'paid' && x.paidVia === 'statement')).toBe(true);
    await markManyOpen([a.id], db);
    expect((await listInvoices(db)).find((x) => x.id === a.id).status).toBe('open');
  });
});

describe('a bill from the e-banking', () => {
  it('reads the fields of a Swiss QR code and keeps its reference in the list', async () => {
    const text = payload(ACCOUNT, { amount: 4500, refType: 'QRR', ref: qrReference('777'), message: 'Velo-Service' });
    const bill = readQrPayload(text);
    expect(bill).toMatchObject({ iban: 'CH4431999123000889012', name: 'Beispiel Velo-Werkstatt', amount: 4500, refType: 'QRR', ref: qrReference('777'), message: 'Velo-Service' });
    expect(readQrPayload('hello')).toBe(null);
    const db = await freshDb();
    const inv = await createInvoice({ name: 'Noa Beispiel', amount: bill.amount, purpose: bill.message, ref: bill.ref, refType: bill.refType, ways: { twint: false } }, null, db);
    expect(inv).toMatchObject({ ref: qrReference('777'), refType: 'QRR', from: 'ebanking', no: 'R-0001' });
  });
});

describe('the Sunday reminder', () => {
  // Wednesday 14.10.2026, 10:00 local; the Sunday before is 11.10.2026
  const wed = new Date(2026, 9, 14, 10, 0);
  it('knows the last Sunday 18:00', () => {
    expect(lastSundayEvening(wed)).toEqual(new Date(2026, 9, 11, 18, 0));
    expect(lastSundayEvening(new Date(2026, 9, 18, 17, 0))).toEqual(new Date(2026, 9, 11, 18, 0));
    expect(lastSundayEvening(new Date(2026, 9, 18, 18, 30))).toEqual(new Date(2026, 9, 18, 18, 0));
  });
  it('is due while invoices are open and nothing was checked since Sunday evening', () => {
    expect(reminderDue({ on: true }, 2, wed)).toBe(true);
    expect(reminderDue({ on: true }, 0, wed)).toBe(false);
    expect(reminderDue({ on: false }, 2, wed)).toBe(false);
    expect(reminderDue({ on: true, lastCheck: new Date(2026, 9, 12, 9, 0).toISOString() }, 2, wed)).toBe(false);
    expect(reminderDue({ on: true, lastCheck: new Date(2026, 9, 11, 17, 0).toISOString() }, 2, wed)).toBe(true);
    expect(reminderDue({ on: true, snoozedDay: '2026-10-14' }, 2, wed)).toBe(false);
  });
  it('keeps its setting in the settings table, on by default', async () => {
    const db = await freshDb();
    expect((await readReminder(db)).on).toBe(true);
    await writeReminder({ on: false }, db);
    await writeReminder({ snoozedDay: '2026-10-14' }, db);
    expect(await readReminder(db)).toMatchObject({ on: false, snoozedDay: '2026-10-14' });
  });
});
