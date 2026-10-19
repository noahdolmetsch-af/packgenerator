/**
 * «Mail in die App» (Noah 19.10.2026, thread «Mail aus Gmail»: «1a 2a 3b 4a 5a», then «1a oder neue ablage
 * erstellen vom benutzer 2a 3a», then «1a 2a 3a 4a 5a»):
 * - a mail becomes ONE entry in the Eingang (3b: always the Eingang first, you sort), with its text, the sender
 *   and its attachments (stored on the entry until they are sorted);
 * - from «Ich › Mail» with «In die App übernehmen» (1a), or by itself: every mail with the Gmail label
 *   «Packgenerator» is fetched once (2a). A Gmail filter can set that label for mails sent to «name+pack@…»;
 * - attachments (4a + 2a): PDF and photos › Dokumente, a calendar file › Termin, a wallet ticket (.pkpass) ›
 *   Dokumente, a GPX › Tour or Fahrt, a QR bill › Rechnungen, a contact (.vcf) › into the note;
 * - the tip in the Eingang (3a): «Sieht aus wie eine Rechnung», a booking with its day, a deadline; the app
 *   never moves anything by itself;
 * - a sender filed the same way twice is suggested that way next time (4a).
 * Pure functions here (tests/mailin.test.js); the fetching is in mail/intake.svelte.js.
 */
import { findDate } from './docs.js';
import { localDay } from './localday.js';

/** The Gmail label the app fetches (2a); the search Gmail gets. */
export const MAIL_LABEL = 'Packgenerator';
export const LABEL_QUERY = 'label:packgenerator newer_than:60d';
/** settings key: the Gmail ids already taken into the app (so a mail comes in once, on every device). */
export const TAKEN_KEY = 'mail.taken';
export const TAKEN_MAX = 500;
/** settings key: how each sender was filed ({ address: { kind, n } }), for 4a. */
export const SENDERS_KEY = 'mail.senders';
/**
 * The attachments of one mail together (and so the largest one): the entry must stay under the automatic
 * exchange's limit of one record (sync/engine.js RECORD_MAX, about 3.9 MB as text), else the other device
 * would never get it. The server allows a bit more (api/_lib/googlemail.js FILE_MAX). Bigger files stay in Gmail.
 */
export const FILES_MAX = 2.6 * 1024 * 1024;
export const FILE_MAX = FILES_MAX;
/** Pictures smaller than this are logos and signatures: left out. */
export const SMALL_PICTURE = 15 * 1024;
/** The text kept on the entry. */
export const TEXT_MAX = 6000;

/** What kind of file: 'pdf' | 'photo' | 'ics' | 'pkpass' | 'gpx' | 'vcf' | 'other'. */
export function fileKind({ name = '', type = '' } = {}) {
  const n = String(name).toLowerCase();
  const ty = String(type).toLowerCase();
  if (ty === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
  if (ty === 'text/calendar' || n.endsWith('.ics')) return 'ics';
  if (ty === 'application/vnd.apple.pkpass' || n.endsWith('.pkpass')) return 'pkpass';
  if (n.endsWith('.gpx') || n.endsWith('.tcx') || ty === 'application/gpx+xml') return 'gpx';
  if (ty === 'text/vcard' || ty === 'text/x-vcard' || n.endsWith('.vcf')) return 'vcf';
  if (/^image\/(jpeg|png|webp|gif)$/.test(ty) || /\.(jpe?g|png|webp)$/.test(n)) return 'photo';
  return 'other';
}

const BILL = /\b(qr-?rechnung|einzahlungsschein|zahlbar\s+bis|zahlungsfrist|f[äa]llig|zahlteil|bitte\s+(be)?zahl|invoice|payment\s+due|rechnung(s)?(nummer|betrag)?)\b/i;
const IBAN = /\b(CH|LI)\d{2}(\s?[0-9A-Z]{4}){4}\s?[0-9A-Z]{1}\b/;

/** Where an attachment goes when you tap its button: 'doc' | 'event' | 'route' | 'bill' | 'contact' | null. */
export function fileAction(file, text = '') {
  const k = fileKind(file);
  if (k === 'ics') return 'event';
  if (k === 'gpx') return 'route';
  if (k === 'vcf') return 'contact';
  if (k === 'pdf' && (BILL.test(file?.name ?? '') || /rechnung|invoice|faktura/i.test(file?.name ?? '') || (BILL.test(text) && IBAN.test(text)))) return 'bill';
  if (k === 'pdf' || k === 'photo' || k === 'pkpass') return 'doc';
  return null;
}

/** Keep this attachment at all? Small pictures (logos) and files over the limit stay in Gmail. */
export const keepFile = (f) => {
  const k = fileKind(f);
  if (k === 'other') return false;
  if (k === 'photo' && (f.size ?? 0) < SMALL_PICTURE) return false;
  return (f.size ?? 0) <= FILE_MAX;
};

/** The files to fetch, in order, until FILES_MAX; the rest are named «too big, still in Gmail». */
export function filesToFetch(files = []) {
  const take = [];
  const skip = [];
  let sum = 0;
  for (const f of files) {
    if (!f?.att || !keepFile(f)) {
      if (f && fileKind(f) !== 'other' && !(fileKind(f) === 'photo' && (f.size ?? 0) < SMALL_PICTURE)) skip.push(f.name);
      continue;
    }
    if (sum + (f.size ?? 0) > FILES_MAX) {
      skip.push(f.name);
      continue;
    }
    sum += f.size ?? 0;
    take.push(f);
  }
  return { take, skip };
}

/**
 * The Eingang entry of a mail. mail: what step mail-get gives ({ id, from, fromName, subject, date, text });
 * files: [{ name, type, size, data (data URL) }]; skipped: names left in Gmail.
 */
export function mailNote(mail, files = [], { id, now = new Date().toISOString(), skipped = [] } = {}) {
  const subject = String(mail?.subject ?? '').trim();
  const body = String(mail?.text ?? '').trim();
  const text = [subject, body].filter(Boolean).join('\n\n').slice(0, TEXT_MAX);
  return {
    id,
    at: now,
    text: text || subject || '—',
    photo: null,
    page: 'mail',
    tripId: null,
    bikeId: null,
    status: 'open',
    to: null,
    sortedAt: null,
    mail: { id: mail.id, from: mail.from ?? '', fromName: mail.fromName ?? '', subject, date: mail.date ?? null, ...(skipped.length ? { skipped } : {}) },
    files: files.map((f, i) => ({ id: `f${i}`, name: f.name, type: f.type ?? '', size: f.size ?? 0, kind: fileKind(f), data: f.data, done: null })),
  };
}

/** base64 (standard) + type → data URL. */
export const dataUrlOf = (b64, type = 'application/octet-stream') => `data:${type || 'application/octet-stream'};base64,${b64}`;

/** A data URL → Blob (the GPX and the pkpass are read from it). */
export function blobOfData(dataUrl) {
  const s = String(dataUrl ?? '');
  const i = s.indexOf(',');
  const type = s.slice(5, s.indexOf(';')) || 'application/octet-stream';
  const bin = atob(s.slice(i + 1));
  const bytes = new Uint8Array(bin.length);
  for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
  return new Blob([bytes], { type });
}

/** A contact file → readable lines («Name», «Telefon …», «Mail …», «Adresse …»). */
export function vcfLines(text) {
  const out = [];
  const lines = String(text ?? '')
    .replace(/\r?\n[ \t]/g, '')
    .split(/\r?\n/);
  for (const line of lines) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const key = line.slice(0, i).split(';')[0].toUpperCase();
    const v = line
      .slice(i + 1)
      .replace(/\\n/g, ' ')
      .replace(/\\,/g, ',')
      .replace(/;+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!v) continue;
    if (key === 'FN') out.unshift(v);
    else if (key === 'TEL') out.push(`Tel. ${v}`);
    else if (key === 'EMAIL') out.push(v);
    else if (key === 'ADR') out.push(v);
    else if (key === 'ORG') out.push(v);
  }
  return [...new Set(out)];
}

/** A wallet ticket's pass.json → lines for a small PDF (what, when, where, seat, code). */
export function passLines(pass) {
  const p = pass ?? {};
  const style = p.boardingPass ?? p.eventTicket ?? p.generic ?? p.coupon ?? p.storeCard ?? {};
  const fields = ['headerFields', 'primaryFields', 'secondaryFields', 'auxiliaryFields', 'backFields'].flatMap((k) => style[k] ?? []);
  const lines = [String(p.description || p.organizationName || 'Ticket')];
  if (p.organizationName && p.organizationName !== lines[0]) lines.push(String(p.organizationName));
  if (p.relevantDate) lines.push(String(p.relevantDate).replace('T', ' ').slice(0, 16));
  for (const f of fields.slice(0, 24)) {
    const v = f?.value;
    if (v == null || v === '') continue;
    lines.push(`${f.label ? `${f.label}: ` : ''}${String(v).replace(/\s+/g, ' ').slice(0, 200)}`);
  }
  const code = p.barcodes?.[0]?.message ?? p.barcode?.message;
  if (code) lines.push(`Code: ${String(code).slice(0, 200)}`);
  return lines;
}

/** «name+pack@gmail.com» for an address (1a: forward to it; a Gmail filter puts the label on). */
export function plusAddress(email) {
  const m = String(email ?? '')
    .trim()
    .match(/^([^@\s+]+)(?:\+[^@\s]*)?@([^@\s]+)$/);
  return m ? `${m[1]}+pack@${m[2]}` : '';
}

/** The ids taken, with one more at the front (at most TAKEN_MAX). */
export const takenWith = (list, id) => [id, ...(Array.isArray(list) ? list : []).filter((x) => x !== id)].slice(0, TAKEN_MAX);

/* ---------- 3a: the tip, and Noah's «1a 2a 3a 4a 5a» (bookings, deadlines, senders) ---------- */

const BOOK = [
  { kind: 'hotel', re: /\b(hotel|unterkunft|zimmer|check-?in|booking\.com|airbnb|übernachtung|uebernachtung|jugendherberge|hostel|camping(platz)?)\b/i },
  { kind: 'train', re: /\b(sbb|zug|bahn|billett|ticket|fahrkarte|sitzplatz|wagen|gleis|db\s?navigator|trenitalia|sncf|öbb|oebb)\b/i },
  { kind: 'flight', re: /\b(flug|flight|boarding|gate|abflug|departure|airline|swiss\s?air|easyjet|lufthansa)\b/i },
  { kind: 'bike', re: /\b(velo-?service|veloservice|werkstatt|reparatur|abholbereit|abholen|service-?termin|inspektion)\b/i },
];
const CODE = /\b(?:buchungs(?:nummer|code)|reservations?(?:nummer)?|booking\s*(?:number|code|reference)|bestätigungs(?:nummer|code)|confirmation\s*(?:number|code)|auftrags?(?:nummer)?)\s*[:#]?\s*([A-Z0-9-]{4,20})\b/i;

/** A booking in the text: { kind: 'hotel'|'train'|'flight'|'bike', day, code } or null. */
export function findBooking(text) {
  const s = String(text ?? '');
  const hit = BOOK.find((b) => b.re.test(s));
  if (!hit) return null;
  const confirmed = /\b(buchung|booking|reservation|reserviert|bestätig|confirm|ticket|billett|termin|abholbereit|boarding)/i.test(s);
  if (!confirmed) return null;
  return { kind: hit.kind, day: findDate(s), code: s.match(CODE)?.[1] ?? null };
}

/** A trip the booking's day falls on (or the next one starting within 3 days after it). */
export function tripFor(trips = [], day) {
  if (!day) return null;
  const end = (tr) => {
    const d = new Date(`${tr.startDate}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + Math.max(1, Number(tr.days) || 1) - 1);
    return d.toISOString().slice(0, 10);
  };
  const live = trips.filter((tr) => tr.startDate && !tr.skipped);
  const on = live.find((tr) => tr.startDate <= day && day <= end(tr));
  if (on) return on;
  const soon = new Date(`${day}T12:00:00Z`);
  soon.setUTCDate(soon.getUTCDate() + 3);
  const lim = soon.toISOString().slice(0, 10);
  return live.filter((tr) => tr.startDate > day && tr.startDate <= lim).sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null;
}

const DEADLINES = [
  { what: 'due', re: /\b(zahlbar\s+bis|fällig\s+(am|bis)?|faellig|zahlungsfrist|payment\s+due|due\s+date|bitte\s+bis)\b/i },
  { what: 'warranty', re: /\b(garantie|gewährleistung|gewaehrleistung|warranty)\b/i },
  { what: 'return', re: /\b(rückgabe|rueckgabe|retoure|rücksend|ruecksend|umtausch|return(s)?\s+(by|until|within))\b/i },
  { what: 'cancel', re: /\b(kostenlos\s+stornier|kündigen\s+bis|kuendigen\s+bis|free\s+cancellation|stornierung\s+bis)\b/i },
];

/**
 * A deadline in the text: { what: 'due'|'warranty'|'return'|'cancel', day } or null. The day is the first date
 * after the word (else the first date in the text); a «Garantie 2 Jahre» without a date counts from the mail day.
 */
export function findDeadline(text, mailDay = localDay()) {
  const s = String(text ?? '');
  for (const d of DEADLINES) {
    const m = s.match(d.re);
    if (!m) continue;
    const after = findDate(s.slice(m.index, m.index + 160));
    if (after) return { what: d.what, day: after };
    if (d.what === 'warranty') {
      const y = s.slice(m.index, m.index + 80).match(/(\d{1,2})\s*(jahre?|years?)/i);
      if (y) {
        const dt = new Date(`${mailDay}T12:00:00Z`);
        dt.setUTCFullYear(dt.getUTCFullYear() + Number(y[1]));
        return { what: d.what, day: dt.toISOString().slice(0, 10) };
      }
    }
    const any = findDate(s);
    if (any) return { what: d.what, day: any };
  }
  return null;
}

/** A sender's address in lower case (the key of 4a). */
export const senderOf = (note) => String(note?.mail?.from ?? '').trim().toLowerCase();

/** 4a: the target this sender was filed to twice in a row, or null. */
export function senderKind(rules, note) {
  const r = rules?.[senderOf(note)];
  return r && r.n >= 2 ? r.kind : null;
}

/** 4a: remember how a sender's mail was filed (the same kind again counts up, another starts at 1). */
export function learnSender(rules, note, kind) {
  const from = senderOf(note);
  if (!from) return rules ?? {};
  const old = rules?.[from];
  const next = { ...(rules ?? {}), [from]: { kind, n: old?.kind === kind ? Math.min(9, old.n + 1) : 1 } };
  const keys = Object.keys(next);
  if (keys.length > 300) delete next[keys[0]];
  return next;
}

/**
 * 3a: the tip under an entry (never moves anything): { kind: 'bill'|'booking'|'deadline'|'sender', … } or null.
 * Works on any text (a mail, a recognised photo).
 */
export function tipOf(note, { trips = [], rules = null } = {}) {
  const text = String(note?.text ?? '');
  const sender = note?.mail ? senderKind(rules, note) : null;
  if (sender) return { kind: 'sender', target: sender };
  const book = findBooking(text);
  if (book) return { kind: 'booking', booking: book, trip: tripFor(trips, book.day) };
  const dl = findDeadline(text, note?.mail?.date ? localDay(new Date(note.mail.date)) : localDay());
  if (dl) return { kind: dl.what === 'due' ? 'bill' : 'deadline', deadline: dl };
  if (BILL.test(text) && (IBAN.test(text) || /chf\s*\d|\d+[.,]\d{2}\s*(chf|fr)/i.test(text))) return { kind: 'bill', deadline: null };
  return null;
}

/** An amount in CHF from the text («CHF 120.50», «Betrag: 89.–»), or null. */
export function amountOf(text) {
  const s = String(text ?? '');
  const m = s.match(/(?:chf|fr\.?)\s*([0-9'’]{1,7}(?:[.,]\d{2}|\.–|\.-)?)/i) ?? s.match(/([0-9'’]{1,7}[.,]\d{2})\s*(?:chf|fr)/i) ?? s.match(/betrag[^0-9]{0,20}([0-9'’]{1,7}(?:[.,]\d{2})?)/i);
  if (!m) return null;
  const n = Number(m[1].replace(/['’]/g, '').replace(/[.,](–|-)$/, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}
/** An IBAN from the text, without spaces, or ''. */
export const ibanOf = (text) => (String(text ?? '').match(IBAN)?.[0] ?? '').replace(/\s+/g, '');

/** «Termin» from a text: { title, day, from } (the first time after the date, if any). */
export function eventFrom(note, today = localDay()) {
  const text = String(note?.text ?? '');
  const title = (note?.mail?.subject || text.split('\n')[0] || '').replace(/^(fwd?|wg|aw|re)\s*:\s*/i, '').trim().slice(0, 120);
  const day = findDate(text) ?? today;
  const t = text.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\s*(uhr|h)?\b/i);
  return { title, day, from: t ? `${t[1].padStart(2, '0')}:${t[2]}` : '' };
}

/** The day the app suggests for a new trip or an appointment from an entry. */
export const dayOfNote = (note, today = localDay()) => note?.plan?.day ?? findDate(note?.text) ?? today;

/** 5a (the other way round): a short mail text of a packing list or a trip: lines → text. */
export const mailTextOf = (title, lines = []) => [title, '', ...lines.map((l) => `• ${l}`)].join('\n').slice(0, 45_000);
