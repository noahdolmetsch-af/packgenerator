// «Zu zahlen» (mockup QR9, Noah 14.10.2026 05:10 «1-4a», «a»): bills Noah gets, with due date
// (30 days when none), the reminder window (3 days before, changeable), «Später» for today, paid and
// open again, and the photo kept as a receipt. Fictional data; the IBAN is the standard's sample.
import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { createDb } from '../src/lib/db.js';
import { addBill, listBills, markBillPaid, markBillOpen, snoozeBill, deleteBill, billsSummary, billsToRemind, isDueSoon, daysLeft, addDays, daysBetween } from '../src/lib/pay/bills.js';
import { readQrPayload } from '../src/lib/pay/camt.js';
import { payload } from '../src/lib/pay/qrbill.js';
import { buildBackup } from '../src/lib/backup.js';

let n = 0;
const freshDb = async () => {
  const db = createDb(`pay-bills-${++n}`);
  await db.open();
  return db;
};
const T = '2026-10-14';

describe('calendar days', () => {
  it('adds days across months and years', () => {
    expect(addDays(T, 30)).toBe('2026-11-13');
    expect(addDays('2026-12-20', 14)).toBe('2027-01-03');
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26'); // over the clock change
    expect(daysBetween(T, '2026-10-17')).toBe(3);
    expect(daysBetween(T, '2026-10-12')).toBe(-2);
  });
});

describe('the list «Zu zahlen»', () => {
  it('keeps a bill with 30 days and 3 reminder days when none are given (4a, 2a)', async () => {
    const db = await freshDb();
    const b = await addBill({ to: 'Velo-Werkstatt Beispiel', iban: 'CH44 3199 9123 0008 8901 2', amount: 18950, ref: '21 00000 00003 13947 14300 09017', purpose: 'Service', photo: 'data:image/jpeg;base64,AAAA' }, db, T);
    expect(b).toMatchObject({ due: '2026-11-13', remindDays: 3, status: 'open', ref: '210000000003139471430009017', refType: 'QRR', photo: 'data:image/jpeg;base64,AAAA' });
    expect(await listBills(db)).toHaveLength(1);
  });

  it('sorts open by due date first, then paid; the photo stays after «Bezahlt» (3a)', async () => {
    const db = await freshDb();
    const late = await addBill({ to: 'B', amount: 32000, due: '2026-10-31' }, db, T);
    const soon = await addBill({ to: 'A', amount: 18950, due: '2026-10-17', photo: 'data:x' }, db, T);
    const old = await addBill({ to: 'C', amount: 2500, due: '2026-10-20' }, db, T);
    await markBillPaid(old.id, db, '2026-10-08');
    expect((await listBills(db)).map((x) => x.to)).toEqual(['A', 'B', 'C']);
    const s = billsSummary(await listBills(db));
    expect(s).toEqual({ count: 2, sum: 50950, next: '2026-10-17' });
    const paid = await markBillPaid(soon.id, db, T);
    expect(paid).toMatchObject({ status: 'paid', paidAt: T, photo: 'data:x' });
    await markBillOpen(soon.id, db);
    expect((await listBills(db)).find((x) => x.id === soon.id)).not.toHaveProperty('paidAt');
    await deleteBill(late.id, db);
    expect(await listBills(db)).toHaveLength(2);
  });

  it('travels in the backup file (settings table)', async () => {
    const db = await freshDb();
    await addBill({ to: 'A', amount: 100, due: '2026-10-20' }, db, T);
    const backup = await buildBackup(db);
    expect(JSON.stringify(backup)).toContain('pay.bills');
  });
});

describe('the reminder on Heute', () => {
  const b = (due, extra = {}) => ({ id: due, to: 'X', amount: 100, due, remindDays: 3, status: 'open', ...extra });
  it('shows from 3 days before until paid, overdue too', () => {
    expect(isDueSoon(b('2026-10-18'), T)).toBe(false);
    expect(isDueSoon(b('2026-10-17'), T)).toBe(true);
    expect(isDueSoon(b('2026-10-10'), T)).toBe(true);
    expect(daysLeft(b('2026-10-10'), T)).toBe(-4);
    expect(isDueSoon(b('2026-10-17', { status: 'paid' }), T)).toBe(false);
    expect(isDueSoon(b('2026-10-20', { remindDays: 7 }), T)).toBe(true);
    expect(isDueSoon(b('2026-10-15', { remindDays: 0 }), T)).toBe(false);
  });
  it('«Später» hides it for today only; the most urgent comes first', async () => {
    const db = await freshDb();
    const x = await addBill({ to: 'A', amount: 100, due: '2026-10-16' }, db, T);
    await addBill({ to: 'B', amount: 100, due: '2026-10-13' }, db, T);
    expect(billsToRemind(await listBills(db), T).map((y) => y.to)).toEqual(['B', 'A']);
    await snoozeBill(x.id, db, T);
    expect(billsToRemind(await listBills(db), T).map((y) => y.to)).toEqual(['B']);
    expect(billsToRemind(await listBills(db), '2026-10-15').map((y) => y.to)).toEqual(['B', 'A']);
  });
});

describe('reading the QR code of a received bill', () => {
  it('gives recipient, IBAN, amount, reference and message', () => {
    const qr = payload({ iban: 'CH44 3199 9123 0008 8901 2', name: 'Velo-Werkstatt Beispiel', street: 'Musterweg', house: '1', zip: '8000', town: 'Zürich' }, { amount: 18950, refType: 'QRR', ref: '210000000003139471430009017', message: 'Service' });
    expect(readQrPayload(qr)).toMatchObject({ name: 'Velo-Werkstatt Beispiel', iban: 'CH4431999123000889012', amount: 18950, ref: '210000000003139471430009017', message: 'Service' });
  });
});
