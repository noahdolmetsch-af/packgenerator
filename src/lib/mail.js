/**
 * Google Mail (package GM): pure helpers for the page «Mail» (#/me/mail) and «Mails dazu» under an
 * appointment. Mails are not kept on the device: the page fetches what it shows (api/_lib/googlemail.js).
 */
export const MAIL_KEY = 'mail';
export const MAIL_HASH = '#/me/mail';

export const prefsOf = (v) => ({ allowed: v?.allowed === true, sig: typeof v?.sig === 'string' ? v.sig.slice(0, 500) : '' });

/** A Gmail search for the mails around an appointment: its title words (and place), a month around it. */
export function eventQuery(e) {
  const words = String(e?.title ?? '')
    .replace(/["()]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !/^\d+$/.test(w))
    .slice(0, 4);
  if (!words.length) return '';
  const day = e?.day && /^\d{4}-\d{2}-\d{2}$/.test(e.day) ? e.day : null;
  const shift = (n) => {
    const d = new Date(`${day}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10).replace(/-/g, '/');
  };
  return [words.map((w) => `"${w}"`).join(' OR '), day ? `after:${shift(-30)} before:${shift(2)}` : ''].filter(Boolean).join(' ');
}

/** «Re: Betreff» (no «Re: Re:»). */
export const replySubject = (s) => (/^\s*(re|aw|antw)\s*:/i.test(s ?? '') ? s : `Re: ${s ?? ''}`.trim());

/** The answer's text: an empty line for Noah, then the old mail quoted. */
export function quoteOf(m, when) {
  const lines = String(m?.text ?? '')
    .split('\n')
    .slice(0, 80)
    .map((l) => `> ${l}`);
  return `\n\n${when} ${m?.fromName || m?.from || ''}:\n${lines.join('\n')}`;
}

/** Today a time, this year a day, else a date. */
export function whenOf(iso, now = new Date(), locale = 'de-CH') {
  if (!iso) return '';
  const d = new Date(iso);
  const tz = { timeZone: 'Europe/Zurich' };
  const day = (x) => x.toLocaleDateString('sv-SE', tz);
  if (day(d) === day(now)) return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', ...tz });
  if (day(d).slice(0, 4) === day(now).slice(0, 4)) return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', ...tz });
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric', ...tz });
}

/** Size of an attachment as people read it. */
export const sizeOf = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
