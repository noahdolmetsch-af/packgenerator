/**
 * «Ich habe bezahlt» (mockup QR5, way A, Noah 14.10.2026 03:52 «alle A-D», approved 04:00 «a»).
 * The payer opens the link in the invoice (no app needed) and taps «Ich habe bezahlt»; the app of
 * the invoice writer fetches these reports and asks «Stimmt, bezahlt» or «Noch nicht da».
 *
 * Nothing personal goes to the server: a report is only { no: 'R-0317', way: 'twint'|'qr', at }.
 * The writer's app keeps a random key on the device; the link carries box = sha256(key) cut to 32 hex,
 * so a payer can drop a report into the box but only the key holder can read it.
 * Reports live 60 days, at most 200 per box. Needs only the Redis store (no Stripe, no PAY_MODE).
 */
import { createHash, randomUUID } from 'node:crypto';

export const REPORT_TTL_S = 60 * 86_400;
export const REPORT_MAX = 200;
export const boxOf = (key) => createHash('sha256').update(`pg-pay-box:${key}`).digest('hex').slice(0, 32);
export const boxKey = (box) => `pay:box:${box}`;

/** A checked report, or null. body: { box, no, way } */
export function readReport(body) {
  const box = String(body?.box ?? '');
  const no = String(body?.no ?? '');
  const way = String(body?.way ?? '');
  if (!/^[0-9a-f]{32}$/.test(box) || !/^R-\d{4,6}$/.test(no) || !['twint', 'qr'].includes(way)) return null;
  return { box, no, way };
}

/** The key the writer's app holds (64 hex). */
export const isKey = (k) => typeof k === 'string' && /^[0-9a-f]{64}$/.test(k);

export const newReport = (r, nowS) => JSON.stringify({ id: randomUUID(), no: r.no, way: r.way, at: nowS });

/** Parse what LRANGE gave back; broken rows are skipped. */
export const parseReports = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .map((s) => {
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
    })
    .filter((x) => x && typeof x.id === 'string' && /^R-\d{4,6}$/.test(x.no));
