/**
 * Bank statements (mockups QR2 + QR3, Noah 14.10.2026 02:36 «2 a und b», 03:39 «3a oder b», all
 * approved 04:00): read a camt.054 or camt.053 file from the e-banking and find the payments of open
 * invoices. Read on the device only; the file is not kept.
 *
 * Recognised = the bank reference (QR reference or RF) is the invoice's, or the free text carries the
 * invoice number («R-0317», the TWINT message). Unclear = no reference, but an open invoice has exactly
 * the amount: the app suggests it, Noah says yes, picks another one himself, or no.
 * Every other booking in the file is ignored.
 */

/** Inner texts of all <name>…</name> in a piece of XML (namespace prefixes ignored). */
function all(xml, name) {
  const re = new RegExp(`<(?:[\\w.-]+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w.-]+:)?${name}>`, 'g');
  return [...String(xml).matchAll(re)].map((m) => m[1]);
}
const one = (xml, name) => all(xml, name)[0] ?? '';
const text = (s) =>
  String(s ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
const cents = (s) => {
  const n = Number(text(s));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
};

/** Is this a camt.053 or camt.054 file? */
export const isCamt = (xml) => /urn:iso:std:iso:20022:tech:xsd:camt\.05[34]/.test(String(xml)) || /<(?:\w+:)?(BkToCstmrDbtCdtNtfctn|BkToCstmrStmt)\b/.test(String(xml));

/**
 * The incoming payments of a camt file: [{ amount (rappen), date, ref, text, from }].
 * A collective booking (several payments in one entry) gives one line per payment.
 */
export function readCamt(xml) {
  const out = [];
  for (const ntry of all(xml, 'Ntry')) {
    if (text(one(ntry, 'CdtDbtInd')) !== 'CRDT') continue;
    if (/<(?:\w+:)?RvslInd>\s*true/i.test(ntry)) continue;
    const date = text(one(one(ntry, 'BookgDt'), 'Dt')) || text(one(one(ntry, 'ValDt'), 'Dt'));
    const ntryAmt = cents(one(ntry, 'Amt'));
    const txs = all(ntry, 'TxDtls');
    const list = txs.length ? txs : [ntry];
    for (const tx of list) {
      const amtDtls = one(tx, 'AmtDtls');
      const amount = txs.length > 1 || amtDtls ? cents(one(amtDtls ? one(amtDtls, 'TxAmt') || amtDtls : tx, 'Amt')) || cents(one(tx, 'Amt')) : cents(one(tx, 'Amt')) || ntryAmt;
      const rmt = one(tx, 'RmtInf');
      const ref = text(one(one(one(rmt, 'Strd'), 'CdtrRefInf'), 'Ref')).replace(/\s+/g, '');
      const ustrd = all(rmt, 'Ustrd').map(text).join(' ').trim() || text(one(tx, 'AddtlTxInf')) || text(one(ntry, 'AddtlNtryInf'));
      const dbtr = one(one(tx, 'RltdPties'), 'Dbtr');
      const from = text(one(dbtr, 'Nm'));
      if (amount) out.push({ amount: amount || ntryAmt, date, ref, text: ustrd, from });
    }
  }
  return out;
}

const norm = (s) => String(s ?? '').replace(/\s+/g, '').toUpperCase();
/** Does a free text name this invoice number? «R-0317», «R0317», «r 0317». */
export const namesInvoice = (txt, no) => {
  const digits = String(no).replace(/\D/g, '');
  return !!digits && new RegExp(`\\bR[\\s-]?0*${Number(digits)}\\b`, 'i').test(String(txt ?? ''));
};

/**
 * Match the payments to the invoices. Returns { found: [{ pay, inv }], unclear: [{ pay, suggest }], ignored }.
 * An invoice is matched at most once; already paid invoices are not touched again.
 */
export function matchPayments(payments, invoices) {
  const open = invoices.filter((x) => x.status === 'open');
  const used = new Set();
  const found = [];
  const unclear = [];
  let ignored = 0;
  const rest = [];
  for (const pay of payments) {
    const byRef = pay.ref && open.find((x) => !used.has(x.id) && norm(x.ref) === norm(pay.ref));
    const byNo = !byRef && open.find((x) => !used.has(x.id) && namesInvoice(pay.text, x.no));
    const inv = byRef || byNo;
    if (inv) {
      used.add(inv.id);
      found.push({ pay, inv, how: byRef ? 'ref' : 'text' });
    } else rest.push(pay);
  }
  for (const pay of rest) {
    const known = pay.ref && invoices.some((x) => norm(x.ref) === norm(pay.ref));
    if (known) {
      ignored++;
      continue;
    }
    const same = open.filter((x) => !used.has(x.id) && x.amount === pay.amount).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    if (same.length) unclear.push({ pay, suggest: same[0] });
    else ignored++;
  }
  return { found, unclear, ignored };
}

/**
 * The fields of a Swiss QR code (SPC …): the bill from the e-banking. Returns
 * { iban, name, amount (rappen or 0), refType, ref, message, debtor } or null.
 */
export function readQrPayload(s) {
  const l = String(s ?? '').split(/\r?\n/);
  if (l[0] !== 'SPC' || !/^02\d\d$/.test(l[1] ?? '')) return null;
  const amount = Math.round(Number(l[18] || 0) * 100) || 0;
  return {
    iban: l[3] ?? '',
    name: l[5] ?? '',
    amount,
    currency: l[19] ?? 'CHF',
    debtor: l[21] ?? '',
    refType: l[27] ?? 'NON',
    ref: (l[28] ?? '').replace(/\s+/g, ''),
    message: l[29] ?? '',
  };
}
