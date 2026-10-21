/**
 * /api/linkcheck (BF7 «Wartungs-Check», Noah 13.10.2026): is an outside address the app shows or needs
 * still there? A browser cannot read another site's answer, so this asks for the app.
 *
 *   GET ?u=<address>  → { ok, status }  (only the addresses of LINK_CHECKS; anything else: 400)
 *   GET ?read=<address> → { url, html }  Paket NE «Webseite als Text offline» (Noah 20.10.2026 «Alle»): the
 *       HTML of a public web page (at most 2 MB), so the app can keep it as readable text. Only http(s), no
 *       local or private addresses, no cookies; nothing is stored.
 *   GET ?img=<address>  → the picture (at most 3 MB, image/* only), for the pictures of such a page.
 *
 * HEAD first, GET when HEAD is refused (some servers answer 403/405 to HEAD); 5 seconds at most.
 * No key, no storage: it only says whether the address answers. A redirect that ends well counts as ok.
 */
import { route, json, ApiError, corsHeaders } from './_lib/core.js';
import { LINK_CHECKS } from './_lib/links.js';

export const TIMEOUT_MS = 5000;
export const PAGE_MAX = 2_000_000;
export const IMG_MAX = 3_000_000;

/** Only public web addresses: http(s), no localhost, no private or local IP, no user:pass. */
export function publicUrl(raw) {
  let u;
  try {
    u = new URL(String(raw ?? ''));
  } catch {
    return null;
  }
  if (!/^https?:$/.test(u.protocol) || u.username || u.password) return null;
  if (u.port && !['80', '443', '8080'].includes(u.port)) return null;
  const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!h.includes('.') || /(^|\.)(localhost|local|internal|intranet|home|lan|corp)$/.test(h)) return null;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
    const [a, b] = h.split('.').map(Number);
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224) return null;
  }
  if (h.includes(':')) return null; // IPv6 literals: never
  return u;
}
const UA = 'PackGenerator-linkcheck/1.0 (+https://noahdolmetsch-af.github.io/packgenerator/)';

export function makeHandler({ doFetch = (...a) => fetch(...a), timeout = TIMEOUT_MS } = {}) {
  async function probe(url, method) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    try {
      const res = await doFetch(url, { method, redirect: 'follow', signal: ctl.signal, headers: { 'User-Agent': UA } });
      return res.status;
    } catch {
      return 0; // no answer (or too slow)
    } finally {
      clearTimeout(timer);
    }
  }

  /** A page or a picture for the app (see the head of the file). */
  async function fetchFor(request, kind, raw) {
    const url = publicUrl(raw);
    if (!url) throw new ApiError(400, 'not_allowed', 'Only public web addresses can be read.');
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout * 2);
    try {
      let res;
      try {
        res = await doFetch(url.href, { redirect: 'follow', signal: ctl.signal, headers: { 'User-Agent': UA, Accept: kind === 'page' ? 'text/html,application/xhtml+xml' : 'image/*' } });
      } catch {
        throw new ApiError(502, 'unreachable', 'The page does not answer.');
      }
      if (res.url && !publicUrl(res.url)) throw new ApiError(400, 'not_allowed', 'Only public web addresses can be read.');
      if (!res.ok) throw new ApiError(502, 'page_error', `The page answered ${res.status}.`);
      const type = res.headers.get('content-type') ?? '';
      const max = kind === 'page' ? PAGE_MAX : IMG_MAX;
      if (Number(res.headers.get('content-length') ?? 0) > max) throw new ApiError(413, 'too_big', 'The page is too big.');
      if (kind === 'page' && !/text\/html|xhtml/.test(type)) throw new ApiError(415, 'not_html', 'This address is not a web page.');
      if (kind === 'img' && !/^image\//.test(type)) throw new ApiError(415, 'not_image', 'This address is not a picture.');
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.length > max) throw new ApiError(413, 'too_big', 'The page is too big.');
      if (kind === 'img') return new Response(buf, { status: 200, headers: { 'Content-Type': type, 'Cache-Control': 'no-store', ...corsHeaders(request) } });
      const charset = type.match(/charset=([\w-]+)/i)?.[1] ?? 'utf-8';
      let html;
      try {
        html = new TextDecoder(charset).decode(buf);
      } catch {
        html = new TextDecoder().decode(buf);
      }
      return json(request, 200, { url: res.url || url.href, html });
    } finally {
      clearTimeout(timer);
    }
  }

  return route(
    {
      GET: async (request) => {
        const q = new URL(request.url).searchParams;
        if (q.has('read') || q.has('img')) return fetchFor(request, q.has('read') ? 'page' : 'img', q.get('read') ?? q.get('img'));
        const u = q.get('u') ?? '';
        if (!LINK_CHECKS.includes(u)) throw new ApiError(400, 'not_allowed', 'Only the addresses of the app can be checked.');
        let status = await probe(u, 'HEAD');
        if (!(status >= 200 && status < 400)) {
          const again = await probe(u, 'GET');
          if (again) status = again;
        }
        return json(request, 200, { ok: status >= 200 && status < 400, status });
      },
    },
    'linkcheck',
  );
}

const handler = makeHandler();
export const GET = handler;
export const OPTIONS = handler;
