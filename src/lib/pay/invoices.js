/**
 * Invoices without a provider (mockups QR1–QR4 + QR7, Noah 14.10.2026 04:00 «a»): the app writes a
 * QR bill with TWINT as a second way to pay, keeps a list (open / paid) and marks payments by hand
 * («Bezahlt», «Bezahlt + Mail») or by amount («Geld erhalten»). Bank statements come in step 1b.
 *
 * Where things live:
 * - The account (IBAN, name, address, TWINT number) stays ONLY on this device (localStorage), never
 *   in a backup file or the repo (mockup QR1 «nur auf diesem Gerät gespeichert»).
 * - The invoices live in the settings table (key 'pay.invoices'), so the backup file carries them
 *   to the other device. No new table, no schema change.
 */
import { db as appDb } from '../db.js';
import { localDay } from '../localday.js';
import { referenceFor, formatAmount } from './qrbill.js';

export const ACCOUNT_LS = 'pg.pay.account';
export const INVOICES_KEY = 'pay.invoices';
export const NEXT_NO_KEY = 'pay.invoiceNo';

/** The account on this device, or null. */
export function readAccount() {
  try {
    const a = JSON.parse(localStorage.getItem(ACCOUNT_LS) ?? 'null');
    return a && typeof a === 'object' ? a : null;
  } catch {
    return null;
  }
}

export function writeAccount(a) {
  try {
    localStorage.setItem(ACCOUNT_LS, JSON.stringify(a));
    return true;
  } catch {
    return false;
  }
}

/** All invoices, newest first. */
export async function listInvoices(db = appDb) {
  const row = await db.settings.get(INVOICES_KEY);
  const list = Array.isArray(row?.value) ? row.value : [];
  return [...list].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || b.seq - a.seq);
}

async function saveAll(db, list) {
  await db.settings.put({ key: INVOICES_KEY, value: list });
}

/** «R-0317»: the short code the payer writes into TWINT and the bank reference carries. */
export const invoiceNo = (seq) => 'R-' + String(seq).padStart(4, '0');

/**
 * A new invoice. input: { name, email?, amount (rappen), purpose, ways: { qr, twint } }.
 * Returns the stored invoice.
 */
export async function createInvoice(input, account, db = appDb) {
  return db.transaction('rw', db.settings, async () => {
    const seqRow = await db.settings.get(NEXT_NO_KEY);
    const seq = Number(seqRow?.value) > 0 ? Number(seqRow.value) : 1;
    const no = invoiceNo(seq);
    const { type, ref } = referenceFor(account?.iban ?? '', no);
    const inv = {
      id: crypto.randomUUID(),
      seq,
      no,
      name: String(input.name ?? '').trim(),
      email: String(input.email ?? '').trim(),
      amount: input.amount,
      purpose: String(input.purpose ?? '').trim(),
      refType: type,
      ref,
      ways: { qr: input.ways?.qr !== false, twint: input.ways?.twint !== false && !!account?.twint },
      createdAt: localDay(),
      status: 'open',
    };
    const list = await listInvoices(db);
    await saveAll(db, [inv, ...list]);
    await db.settings.put({ key: NEXT_NO_KEY, value: seq + 1 });
    return inv;
  });
}

/** Mark an invoice paid. via: 'hand' | 'amount' | 'statement'. */
export async function markPaid(id, via = 'hand', db = appDb) {
  return db.transaction('rw', db.settings, async () => {
    const list = await listInvoices(db);
    const inv = list.find((x) => x.id === id);
    if (!inv) return null;
    inv.status = 'paid';
    inv.paidAt = localDay();
    inv.paidVia = via;
    await saveAll(db, list);
    return inv;
  });
}

/** Back to open (undo). */
export async function markOpen(id, db = appDb) {
  return db.transaction('rw', db.settings, async () => {
    const list = await listInvoices(db);
    const inv = list.find((x) => x.id === id);
    if (!inv) return null;
    inv.status = 'open';
    delete inv.paidAt;
    delete inv.paidVia;
    await saveAll(db, list);
    return inv;
  });
}

export async function deleteInvoice(id, db = appDb) {
  return db.transaction('rw', db.settings, async () => saveAll(db, (await listInvoices(db)).filter((x) => x.id !== id)));
}

/** Open invoices with exactly this amount (mockup QR7 «Geld erhalten»). */
export const openWithAmount = (list, cents) => list.filter((x) => x.status === 'open' && x.amount === cents);

/** «2 offen · 85.00 CHF ausstehend»: count and sum of the open ones. */
export function openSummary(list) {
  const open = list.filter((x) => x.status === 'open');
  return { count: open.length, sum: open.reduce((s, x) => s + (x.amount || 0), 0) };
}

/** «079 000 00 00» from what was typed (digits, +41 becomes 0). */
export function formatTwint(s) {
  let d = String(s ?? '').replace(/[^\d+]/g, '');
  if (d.startsWith('+41')) d = '0' + d.slice(3);
  else if (d.startsWith('0041')) d = '0' + d.slice(4);
  d = d.replace(/\D/g, '');
  return /^0\d{9}$/.test(d) ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}` : '';
}

/**
 * The text of the invoice e-mail (opened in the mail program, nobody in between). tr = t() of the app.
 * Bank details and TWINT details only for the ways that are switched on.
 */
export function invoiceMail(inv, account, tr) {
  const lines = [
    tr('Hello {name},', { name: inv.name }),
    '',
    tr('here is the invoice for {purpose}: {amount} CHF.', { purpose: inv.purpose, amount: formatAmount(inv.amount) }),
    '',
  ];
  if (inv.ways?.twint && account?.twint) {
    lines.push(tr('With TWINT: send {amount} CHF to {phone}, message {no}.', { amount: formatAmount(inv.amount), phone: account.twint, no: inv.no }), '');
  }
  if (inv.ways?.qr) {
    lines.push(tr('Or by bank: scan the QR code in the attached PDF with your banking app.'));
    lines.push(tr('Account: {iban}, {name}', { iban: account?.iban ?? '', name: account?.name ?? '' }));
    lines.push(tr('Reference: {ref}', { ref: inv.ref }), '');
  }
  lines.push(tr('Thank you!'), account?.name ?? '');
  return {
    subject: tr('Invoice {no}: {purpose}', { no: inv.no, purpose: inv.purpose }),
    body: lines.join('\n'),
  };
}

/** The confirmation after payment («Bezahlt + Mail»). */
export function paidMail(inv, account, tr) {
  return {
    subject: tr('Payment received: {no}', { no: inv.no }),
    body: [
      tr('Hello {name},', { name: inv.name }),
      '',
      tr('thank you, your payment of {amount} CHF for {purpose} has arrived.', { amount: formatAmount(inv.amount), purpose: inv.purpose }),
      '',
      tr('Kind regards'),
      account?.name ?? '',
    ].join('\n'),
  };
}

/** mailto: link (the mail program opens with the text filled in). */
export const mailtoHref = (to, { subject, body }) =>
  `mailto:${encodeURIComponent(to ?? '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
