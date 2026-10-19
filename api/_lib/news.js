/**
 * Paket Q #148 «Hinweise und News-Feed» (Noah 19.10.2026 «1a 2a»): small readers for outside feeds,
 * pure (no fetch), tested in tests/news-server.test.js.
 *
 * - parseFeed: an RSS 2.0 or Atom text → [{ title, link, date }] (newest first, at most `max`).
 * - parseWarnings: the MeteoAlarm Atom feed of Switzerland (warnings of MeteoSwiss, CAP fields)
 *   → [{ event, area, severity, level, onset, expires, link }].
 * - avalancheLevel: the SLF bulletin (CAAML JSON) → the highest danger level 1–5 in it, or null.
 * - safeFeedUrl: only https addresses of public host names (no IP addresses, no local names).
 */

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
export function decode(s = '') {
  return String(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
      return ENT[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decode(m[1]) : '';
};
const atomLink = (block) => {
  const alt = block.match(/<link\b[^>]*rel=["']alternate["'][^>]*>/i) ?? block.match(/<link\b[^>]*href=[^>]*>/i);
  const href = alt?.[0].match(/href=["']([^"']+)["']/i);
  return href ? decode(href[1]) : '';
};
const iso = (s) => {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
};

export function parseFeed(text = '', max = 20) {
  const s = String(text);
  const items = [...s.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  const entries = items.length ? [] : [...s.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((m) => m[0]);
  const out = items.length
    ? items.map((b) => ({ title: tag(b, 'title'), link: tag(b, 'link') || tag(b, 'guid'), date: iso(tag(b, 'pubDate') || tag(b, 'dc:date')) }))
    : entries.map((b) => ({ title: tag(b, 'title'), link: atomLink(b), date: iso(tag(b, 'updated') || tag(b, 'published')) }));
  const title = tag(s.replace(/<(item|entry)\b[\s\S]*$/i, ''), 'title');
  return {
    title,
    items: out
      .filter((x) => x.title && /^https?:\/\//.test(x.link))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, max),
  };
}

const LEVEL = { minor: 1, moderate: 2, severe: 3, extreme: 4 };
export function parseWarnings(text = '') {
  return [...String(text).matchAll(/<entry\b[\s\S]*?<\/entry>/gi)]
    .map((m) => m[0])
    .map((b) => {
      const severity = tag(b, 'cap:severity');
      return {
        event: tag(b, 'cap:event') || tag(b, 'title'),
        area: tag(b, 'cap:areaDesc'),
        severity,
        level: LEVEL[severity.toLowerCase()] ?? 0,
        onset: iso(tag(b, 'cap:onset') || tag(b, 'cap:effective')),
        expires: iso(tag(b, 'cap:expires')),
        link: atomLink(b),
      };
    })
    .filter((w) => w.event && w.area);
}

/** The highest danger level in a CAAML JSON bulletin collection (SLF), or null. */
export function avalancheLevel(data) {
  const NUM = { low: 1, moderate: 2, considerable: 3, high: 4, very_high: 5 };
  let max = 0;
  for (const b of data?.bulletins ?? []) for (const r of b?.dangerRatings ?? []) max = Math.max(max, NUM[r?.mainValue] ?? 0);
  return max || null;
}

/** Only https, a public host name with a dot, no IP address, no local or internal name. */
export function safeFeedUrl(u) {
  let url;
  try {
    url = new URL(u);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return null;
  const h = url.hostname.toLowerCase();
  if (!h.includes('.') || /^[\d.]+$/.test(h) || h.includes(':') || /(^|\.)(localhost|local|internal|lan|home|corp)$/.test(h)) return null;
  return url.toString();
}
