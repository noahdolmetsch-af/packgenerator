/**
 * «Ich habe bezahlt» (mockup QR5, way A, Noah 14.10.2026 03:52 «alle A-D», approved 04:00 «a»).
 * The invoice carries a link; the payer opens it (no app needed), sees how to pay and taps «Ich habe
 * bezahlt». The writer's app fetches these reports and asks «Stimmt, bezahlt» or «Noch nicht da».
 *
 * - The key stays on this device (localStorage), the link carries only box = sha256(key) cut to 32 hex
 *   (the same as api/_lib/report.js), so a payer can report but not read.
 * - The link holds what the payer needs to see (from, purpose, amount, invoice no, TWINT number, IBAN,
 *   reference) in the part after #, which the browser never sends to a server.
 * - The server only learns { no, way, at }.
 */
import { PAY_URL } from './licence.js';

export const KEY_LS = 'pg.pay.box';
export const SEEN_LS = 'pg.pay.seen';
/** Where the payer page lives (the app on GitHub Pages). */
export const APP_URL = 'https://noahdolmetsch-af.github.io/packgenerator/';

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

/** The key of this device (made once). */
export function readKey(make = true) {
  try {
    let k = localStorage.getItem(KEY_LS);
    if (!/^[0-9a-f]{64}$/.test(k ?? '') && make) {
      k = hex(crypto.getRandomValues(new Uint8Array(32)));
      localStorage.setItem(KEY_LS, k);
    }
    return /^[0-9a-f]{64}$/.test(k ?? '') ? k : null;
  } catch {
    return null;
  }
}

export async function boxOf(key) {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`pg-pay-box:${key}`))).slice(0, 32);
}

const b64url = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

/** The payer link of an invoice. */
export function payLink(inv, account, box, base = APP_URL) {
  const d = { v: 1, b: box, n: inv.no, a: inv.amount, p: inv.purpose, f: account?.name ?? '' };
  if (inv.ways?.twint && account?.twint) d.t = account.twint;
  if (inv.ways?.qr && account?.iban) Object.assign(d, { i: account.iban, r: inv.ref });
  return `${base}#/zahlen/${b64url(JSON.stringify(d))}`;
}

/** What the payer page shows, or null for a broken link. */
export function readLink(part) {
  try {
    const d = JSON.parse(unb64url(String(part ?? '')));
    if (d?.v !== 1 || !/^[0-9a-f]{32}$/.test(d.b) || !/^R-\d{4,6}$/.test(d.n) || !(d.a > 0)) return null;
    return { box: d.b, no: d.n, amount: d.a, purpose: String(d.p ?? ''), from: String(d.f ?? ''), twint: d.t ? String(d.t) : '', iban: d.i ? String(d.i) : '', ref: d.r ? String(d.r) : '' };
  } catch {
    return null;
  }
}

async function call(step, body, doFetch = fetch) {
  const res = await doFetch(`${PAY_URL}?step=${step}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`pay ${step} ${res.status}`);
  return res.json();
}

/** The payer: «Ich habe bezahlt». */
export const sendReport = (box, no, way, doFetch) => call('report', { box, no, way }, doFetch);

/** The writer: reports not handled yet (empty when the server is off or unreachable). */
export async function fetchReports(key = readKey(false), doFetch) {
  if (!key) return [];
  try {
    return (await call('reports', { key }, doFetch)).reports ?? [];
  } catch {
    return [];
  }
}

/** The writer handled these reports (Stimmt or Noch nicht da). */
export const forgetReports = (ids, key = readKey(false), doFetch) => (key ? call('forget', { key, ids }, doFetch).catch(() => null) : null);

/** Match the reports to open invoices: [{ report, inv }] (reports of unknown or paid invoices are dropped). */
export const reportsForOpen = (reports, invoices) =>
  reports.map((report) => ({ report, inv: invoices.find((x) => x.no === report.no && x.status === 'open') })).filter((x) => x.inv);
