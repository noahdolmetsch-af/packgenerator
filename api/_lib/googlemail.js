/**
 * Google Mail (package GM «Google Teil 3», Noah 15.10.2026 12:04: «emails versenden in der app, email
 * eingang, kalendereinträge + zugehörige emails»; 12:16 «4a»: read and send in one package; 12:17
 * «vorerst ohne mockup»). Pure helpers: Gmail's messages become small rows, and a mail the app writes
 * becomes the raw message Gmail expects. The server keeps no mail.
 */
export const MAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'];
export const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';
/** Mails per page in the list. */
export const MAIL_PAGE = 20;
/** The longest text the app shows or sends. */
export const MAIL_TEXT_MAX = 50_000;

const header = (headers, name) => (headers ?? []).find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? '';
const oneLine = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/** «Velo Muster <info@example.test>» → { name: 'Velo Muster', email: 'info@example.test' } */
export function personOf(v) {
  const s = oneLine(v, 300);
  const m = s.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim() || m[2].trim(), email: m[2].trim() };
  return { name: s, email: s };
}

/** base64url (Gmail's bodies) → UTF-8 text. */
export function fromB64url(data) {
  if (!data) return '';
  return Buffer.from(String(data).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}
export const toB64url = (text) => Buffer.from(text, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** A HTML mail as plain text: no tags, no styles, line breaks kept. */
export function htmlText(html) {
  return String(html ?? '')
    .replace(/<(style|script|head)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** The readable text of a message (text/plain first, else the HTML as text) and its attachments' names. */
export function bodyOf(payload) {
  let plain = '';
  let html = '';
  const files = [];
  const walk = (p) => {
    if (!p) return;
    if (p.filename) files.push({ name: oneLine(p.filename, 200), size: Number(p.body?.size) || 0 });
    else if (p.mimeType === 'text/plain' && !plain) plain = fromB64url(p.body?.data);
    else if (p.mimeType === 'text/html' && !html) html = fromB64url(p.body?.data);
    for (const c of p.parts ?? []) walk(c);
  };
  walk(payload);
  const text = (plain.trim() ? plain.replace(/\r\n/g, '\n').trim() : htmlText(html)).slice(0, MAIL_TEXT_MAX);
  return { text, files };
}

/** One Gmail message (format metadata or full) → { id, thread, from, fromName, to, subject, snippet, date, unread, starred, inbox }. */
export function mailRow(m) {
  if (!m?.id) return null;
  const h = m.payload?.headers;
  const from = personOf(header(h, 'From'));
  const labels = m.labelIds ?? [];
  const at = Number(m.internalDate);
  return {
    id: m.id,
    thread: m.threadId ?? m.id,
    from: from.email,
    fromName: from.name,
    to: oneLine(header(h, 'To'), 500),
    cc: oneLine(header(h, 'Cc'), 500),
    subject: oneLine(header(h, 'Subject'), 300) || '(kein Betreff)',
    snippet: oneLine(String(m.snippet ?? '').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'), 200),
    date: Number.isFinite(at) && at > 0 ? new Date(at).toISOString() : null,
    unread: labels.includes('UNREAD'),
    starred: labels.includes('STARRED'),
    inbox: labels.includes('INBOX'),
    msgId: oneLine(header(h, 'Message-ID') || header(h, 'Message-Id'), 300),
    refs: oneLine(header(h, 'References'), 2000),
  };
}

const EMAIL = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/;
/** «a@x.ch, Name <b@y.ch>» → ['a@x.ch', 'Name <b@y.ch>']; throws when one is not an address. */
export function addresses(v, { max = 20 } = {}) {
  const list = String(v ?? '')
    .split(/[,;\n]/)
    .map((s) => s.replace(/[\u0000-\u001f]+/g, ' ').trim())
    .filter(Boolean);
  if (list.length > max) throw new Error('too_many');
  for (const a of list) if (!EMAIL.test(personOf(a).email)) throw new Error('address');
  return list;
}

/** A header value in RFC 2047 when it is not plain ASCII. */
export const encodeHeader = (v) => (/^[\x20-\x7e]*$/.test(v) ? v : `=?UTF-8?B?${Buffer.from(v, 'utf8').toString('base64')}?=`);

/**
 * The raw message Gmail sends (base64url). { to, cc?, subject, text, inReplyTo?, references? }
 * Throws 'to', 'address', 'text' or 'too_many' when something is missing or wrong.
 */
export function rawMail(v) {
  const to = addresses(v?.to);
  if (!to.length) throw new Error('to');
  const cc = addresses(v?.cc ?? '');
  const text = String(v?.text ?? '').replace(/\r\n/g, '\n');
  if (!text.trim()) throw new Error('text');
  if (text.length > MAIL_TEXT_MAX) throw new Error('text');
  const subject = oneLine(v?.subject, 300);
  const lines = [`To: ${to.join(', ')}`, ...(cc.length ? [`Cc: ${cc.join(', ')}`] : []), `Subject: ${encodeHeader(subject)}`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64'];
  if (v?.inReplyTo) {
    const id = oneLine(v.inReplyTo, 300);
    lines.push(`In-Reply-To: ${id}`, `References: ${oneLine(`${v.references ?? ''} ${id}`, 2000)}`);
  }
  const body = Buffer.from(text.replace(/\n/g, '\r\n'), 'utf8').toString('base64').replace(/.{76}/g, '$&\r\n');
  return toB64url(`${lines.join('\r\n')}\r\n\r\n${body}`);
}
