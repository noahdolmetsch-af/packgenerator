/**
 * Vouchers (Noah 04.11.2026 «9a»): a voucher is an amount in CHF or a number of lessons, with a code, kept on the
 * customer (settings «booking.customers», also in the backup). When Noah prepares an invoice for that person the
 * voucher is deducted in the draft: a lessons voucher makes lessons free, an amount voucher takes off its rest.
 * { id, code, kind: 'amount' | 'lessons', total, left, createdAt } – amount in Rappen, lessons as a count.
 */
import { t } from '../i18n.svelte.js';
import { chf } from './model.js';
import { parseRate, keyOf } from './customers.js';

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** «GUT-7K2M»: short, easy to read out; no 0/O/1/I. */
export const newCode = (rnd = Math.random) => `GUT-${Array.from({ length: 4 }, () => LETTERS[Math.floor(rnd() * LETTERS.length)]).join('')}`;

export const vouchersOf = (customer) => (Array.isArray(customer?.vouchers) ? customer.vouchers : []);
export const openVouchers = (customer) => vouchersOf(customer).filter((v) => v.left > 0);

/** The form fields → a voucher, or undefined when wrong (kind «amount»: «100» or «62,50»; «lessons»: 1–100). */
export function parseVoucher(kind, value, id = crypto.randomUUID(), today = '', rnd = Math.random, code = '') {
  if (kind === 'lessons') {
    const n = Number(String(value ?? '').trim());
    if (!Number.isInteger(n) || n < 1 || n > 100) return undefined;
    return { id, code: code || newCode(rnd), kind, total: n, left: n, createdAt: today };
  }
  const r = parseRate(value);
  if (!r) return undefined; // null (empty) and undefined (wrong) and 0 are all «no voucher»
  return { id, code: code || newCode(rnd), kind: 'amount', total: r, left: r, createdAt: today };
}

/** «100 CHF, 60 left» / «5 lessons, 3 left». */
export const voucherText = (v) =>
  v.kind === 'lessons' ? t('{total} lessons, {left} left', { total: v.total, left: v.left }) : t('{total} CHF, {left} left', { total: chf(v.total), left: chf(v.left) });

/**
 * Deducts the open vouchers of the person from one invoice draft (name, amount in CHF text, purpose).
 * `count` is the number of lessons on the invoice (1 for a single lesson). → { draft, customers, used } where
 * `used` is the list of { code, text } deducted; the draft stays as it was when nothing applies (or the name is
 * several people). Nothing is sent; Noah can change the amount in the form.
 */
export function applyVouchers(draft, customers = [], count = 1) {
  const c = customers.find((x) => keyOf(x.name) === keyOf(draft?.name));
  const rappen = parseRate(draft?.amount);
  if (!c || !rappen || !openVouchers(c).length || (draft.name ?? '').includes(',')) return { draft, customers, used: [] };
  let left = rappen;
  let lessonsToCover = count;
  const used = [];
  const next = vouchersOf(c).map((v) => {
    if (v.left <= 0 || left <= 0) return v;
    if (v.kind === 'lessons') {
      const n = Math.min(v.left, lessonsToCover);
      if (n <= 0) return v;
      const worth = Math.min(left, Math.round((rappen / count) * n));
      lessonsToCover -= n;
      left -= worth;
      used.push({ code: v.code, text: t('{n} lessons', { n }) });
      return { ...v, left: v.left - n };
    }
    const take = Math.min(v.left, left);
    left -= take;
    used.push({ code: v.code, text: `${chf(take)} CHF` });
    return { ...v, left: v.left - take };
  });
  if (!used.length) return { draft, customers, used };
  const note = used.map((u) => `${t('Voucher')} ${u.code}: ${u.text}`).join(', ');
  return {
    draft: { ...draft, amount: chf(left), purpose: [draft.purpose, note].filter(Boolean).join(', ') },
    customers: customers.map((x) => (x === c ? { ...x, vouchers: next } : x)),
    used,
  };
}
