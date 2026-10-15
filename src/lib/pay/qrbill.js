/**
 * Swiss QR bill (mockups QR1 + QR4, Noah 14.10.2026 04:00 «a», all QR mockups approved): the data
 * a payment part carries, built by the app from the account on this device. Free and without any
 * provider: the bill follows the open Swiss standard (SIX «Swiss Payment Standards», QR bill v2).
 *
 * - QR-IBAN (bank id 30000–31999) → 27-digit QR reference (QRR, check digit modulo 10 recursive).
 * - Normal IBAN → creditor reference «RF…» (SCOR, ISO 11649).
 * The reference holds the invoice number, so a bank statement finds the payment again (camt, step 1b).
 */

/** Spaces out, upper case. */
export const cleanIban = (s) => String(s ?? '').replace(/\s+/g, '').toUpperCase();

/** «CH4431999123000889012» → «CH44 3199 9123 0008 8901 2». */
export const formatIban = (s) => cleanIban(s).replace(/(.{4})/g, '$1 ').trim();

/** Letters become numbers (A=10 … Z=35), as IBAN and RF check digits need. */
const toDigits = (s) => s.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));

/** Remainder of a long number string modulo 97. */
function mod97(digits) {
  let r = 0;
  for (const d of digits) r = (r * 10 + Number(d)) % 97;
  return r;
}

/** A Swiss or Liechtenstein IBAN with the right length and check digits. */
export function isIban(s) {
  const v = cleanIban(s);
  if (!/^(CH|LI)\d{2}[0-9A-Z]{17}$/.test(v)) return false;
  return mod97(toDigits(v.slice(4) + v.slice(0, 4))) === 1;
}

/** QR-IBAN: the bank id (positions 5–9) lies between 30000 and 31999. */
export function isQrIban(s) {
  const v = cleanIban(s);
  const iid = Number(v.slice(4, 9));
  return isIban(v) && iid >= 30000 && iid <= 31999;
}

/** Check digit of a QR reference (modulo 10, recursive). */
export function mod10(digits) {
  const T = [0, 9, 4, 6, 8, 2, 7, 1, 3, 5];
  let carry = 0;
  for (const d of String(digits)) carry = T[(carry + Number(d)) % 10];
  return (10 - carry) % 10;
}

/** 27-digit QR reference from the invoice number (digits only). */
export function qrReference(no) {
  const base = String(no).replace(/\D/g, '').padStart(26, '0').slice(-26);
  return base + mod10(base);
}

/** Creditor reference «RF» + 2 check digits + the invoice number (letters and digits). */
export function scorReference(no) {
  const base = String(no).replace(/[^0-9A-Za-z]/g, '').toUpperCase().slice(0, 21);
  const check = 98 - mod97(toDigits(base + 'RF00'));
  return 'RF' + String(check).padStart(2, '0') + base;
}

/** Is a creditor reference well formed (check digits right)? */
export const isScor = (s) => {
  const v = String(s ?? '').replace(/\s+/g, '').toUpperCase();
  return /^RF\d{2}[0-9A-Z]{1,21}$/.test(v) && mod97(toDigits(v.slice(4) + v.slice(0, 4))) === 1;
};

/** The reference of an invoice for this account: type and value. */
export function referenceFor(iban, no) {
  return isQrIban(iban) ? { type: 'QRR', ref: qrReference(no) } : { type: 'SCOR', ref: scorReference(no) };
}

/** «210000000003139471430009017» → «21 00000 00003 13947 14300 09017»; RF in blocks of four. */
export function formatReference(ref) {
  const v = String(ref ?? '').replace(/\s+/g, '');
  if (/^\d{27}$/.test(v)) return v.slice(0, 2) + ' ' + v.slice(2).replace(/(.{5})/g, '$1 ').trim();
  return v.replace(/(.{4})/g, '$1 ').trim();
}

/** Amount in rappen → «80.00». */
export const formatAmount = (cents) => (Math.round(Number(cents) || 0) / 100).toFixed(2);

/** «80», «80.5», «80,50», «CHF 80.00» → 8000 rappen; null when not a positive amount. */
export function parseAmount(s) {
  const m = String(s ?? '').replace(/[’'\s]/g, '').replace(/^CHF/i, '').replace(',', '.').match(/^\d+(\.\d{1,2})?$/);
  if (!m) return null;
  const cents = Math.round(Number(m[0]) * 100);
  return cents > 0 && cents <= 99999999999 ? cents : null;
}

const cut = (s, n) => String(s ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, n);

/**
 * The text inside the Swiss QR code (one field per line, version 0200, coding 1 = UTF-8).
 * account: { iban, name, street, house, zip, town }; bill: { amount (rappen), ref, refType, message }.
 * The payer stays empty: the person pays from their own account, and the standard wants a full
 * address once a payer is named.
 */
export function payload(account, bill) {
  const addr = (a) => ['S', cut(a.name, 70), cut(a.street, 70), cut(a.house, 16), cut(a.zip, 16), cut(a.town, 35), 'CH'];
  return [
    'SPC', '0200', '1',
    cleanIban(account.iban),
    ...addr(account),
    '', '', '', '', '', '', '', // ultimate creditor: not used
    bill.amount ? formatAmount(bill.amount) : '',
    'CHF',
    '', '', '', '', '', '', '', // payer: left open
    bill.refType ?? 'NON',
    bill.refType === 'NON' ? '' : String(bill.ref ?? ''),
    cut(bill.message, 140),
    'EPD',
  ].join('\r\n');
}

/** What is missing in the account before a bill can be made (empty = ready). */
export function accountProblems(a) {
  const p = [];
  if (!isIban(a?.iban)) p.push('iban');
  if (!cut(a?.name, 70)) p.push('name');
  if (!cut(a?.zip, 16) || !cut(a?.town, 35)) p.push('town');
  return p;
}
