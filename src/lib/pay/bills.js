/**
 * «Zu zahlen»: bills Noah gets (mockup QR9, Noah 14.10.2026 05:02 «a», 05:10 «1-4a» and «a»).
 * A photo or screenshot of a QR bill goes in; the app reads recipient, amount and reference, Noah sets
 * the due date (30 days when the bill names none, answer 4a). Three days before (changeable, 2a) a card
 * on Heute reminds him. He pays in the e-banking as always; «Zahlteil» shows what to copy. After
 * «Bezahlt» the photo stays as a receipt (3a).
 *
 * The bills live in the settings table (key 'pay.bills') like the invoices, so the backup carries them.
 */
import { db as appDb } from '../db.js';
import { localDay } from '../localday.js';

export const BILLS_KEY = 'pay.bills';
export const DUE_DAYS = 30;
export const REMIND_DAYS = 3;

/** «2026-10-14» + n calendar days. */
export function addDays(day, n) {
  const [y, m, d] = String(day).split('-').map(Number);
  const x = new Date(Date.UTC(y, m - 1, d + n));
  return x.toISOString().slice(0, 10);
}

/** Calendar days from a to b (b later = positive). */
export function daysBetween(a, b) {
  const ms = (s) => {
    const [y, m, d] = String(s).split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((ms(b) - ms(a)) / 864e5);
}

/** All bills: open first by due date, then the paid ones, newest first. */
export async function listBills(db = appDb) {
  const row = await db.settings.get(BILLS_KEY);
  const list = Array.isArray(row?.value) ? row.value : [];
  const open = list.filter((x) => x.status !== 'paid').sort((a, b) => String(a.due).localeCompare(String(b.due)));
  const paid = list.filter((x) => x.status === 'paid').sort((a, b) => String(b.paidAt).localeCompare(String(a.paidAt)));
  return [...open, ...paid];
}

const saveAll = (db, list) => db.settings.put({ key: BILLS_KEY, value: list });

/** A new bill. input: { to, iban, amount (rappen), ref, refType, purpose, due, remindDays, photo }. */
export async function addBill(input, db = appDb, today = localDay()) {
  return db.transaction('rw', db.settings, async () => {
    const bill = {
      id: crypto.randomUUID(),
      to: String(input.to ?? '').trim(),
      iban: String(input.iban ?? '').trim(),
      amount: input.amount,
      ref: String(input.ref ?? '').replace(/\s+/g, ''),
      refType: input.refType ?? (input.ref ? 'QRR' : 'NON'),
      purpose: String(input.purpose ?? '').trim(),
      due: input.due || addDays(today, DUE_DAYS),
      remindDays: Number.isFinite(input.remindDays) ? input.remindDays : REMIND_DAYS,
      ...(input.photo ? { photo: input.photo } : {}),
      createdAt: today,
      status: 'open',
    };
    const row = await db.settings.get(BILLS_KEY);
    await saveAll(db, [bill, ...(Array.isArray(row?.value) ? row.value : [])]);
    return bill;
  });
}

async function change(id, fn, db) {
  return db.transaction('rw', db.settings, async () => {
    const row = await db.settings.get(BILLS_KEY);
    const list = Array.isArray(row?.value) ? row.value : [];
    const bill = list.find((x) => x.id === id);
    if (!bill) return null;
    fn(bill);
    await saveAll(db, list);
    return bill;
  });
}

export const markBillPaid = (id, db = appDb, today = localDay()) =>
  change(id, (b) => {
    b.status = 'paid';
    b.paidAt = today;
    delete b.snoozedDay;
  }, db);

export const markBillOpen = (id, db = appDb) =>
  change(id, (b) => {
    b.status = 'open';
    delete b.paidAt;
  }, db);

/** «Später» on the Heute card: hidden for today. */
export const snoozeBill = (id, db = appDb, today = localDay()) => change(id, (b) => (b.snoozedDay = today), db);

/** Delete one bill. → the bill as it was (for «Undo», restoreBill). */
export async function deleteBill(id, db = appDb) {
  return db.transaction('rw', db.settings, async () => {
    const row = await db.settings.get(BILLS_KEY);
    const list = Array.isArray(row?.value) ? row.value : [];
    await saveAll(db, list.filter((x) => x.id !== id));
    return list.find((x) => x.id === id) ?? null;
  });
}

/** «Undo» after deleteBill: the bill comes back (once). */
export async function restoreBill(bill, db = appDb) {
  if (!bill) return;
  return db.transaction('rw', db.settings, async () => {
    const row = await db.settings.get(BILLS_KEY);
    const list = Array.isArray(row?.value) ? row.value : [];
    if (!list.some((x) => x.id === bill.id)) await saveAll(db, [...list, bill]);
  });
}

/** { count, sum, next } of the open bills; next = the earliest due date. */
export function billsSummary(list) {
  const open = list.filter((x) => x.status !== 'paid');
  return { count: open.length, sum: open.reduce((s, x) => s + (x.amount || 0), 0), next: open.map((x) => x.due).sort()[0] ?? null };
}

/** Days until due (0 = today, negative = overdue). */
export const daysLeft = (bill, today = localDay()) => daysBetween(today, bill.due);

/** Is the bill in its reminder window (and not snoozed today)? */
export const isDueSoon = (bill, today = localDay()) => bill.status !== 'paid' && daysLeft(bill, today) <= (bill.remindDays ?? REMIND_DAYS);

/** The bills for the Heute card: open, in the reminder window, not snoozed today; most urgent first. */
export const billsToRemind = (list, today = localDay()) =>
  list.filter((b) => isDueSoon(b, today) && b.snoozedDay !== today).sort((a, b) => String(a.due).localeCompare(String(b.due)));
