/**
 * «Link auf den Abschnitt» (thread «Navigation ohne Sackgassen», Noah 23.11.2026 «ja», point 4): an address can name a section of its
 * page: `#/me/listen?at=names-h`. The page opens with that section in view and lights it for a moment (the same ring as «Ausprobieren»,
 * src/lib/know/spot.js), so a link from a hint, a bookmark or a letter lands where it means, not at the top.
 * The section is an element with that `id` or `data-at`. A section that never shows up (a closed window, a page without it) leaves the
 * page where it is, without a word.
 *   atOf(hash)        the section an address names, or ''.
 *   atHref(href, id)  the address with the section added (an existing one is replaced).
 *   goAt(hash)        wait for the section and show it (browser only).
 */
const WAIT = 4000;
const STEP = 120;

/** The section an address names: «#/x?a=1&at=names-h» → 'names-h'; '' when none. Pure. */
export function atOf(hash = '') {
  const q = String(hash).split('?')[1] ?? '';
  return new URLSearchParams(q).get('at') ?? '';
}

/** The address with the section added. Pure. */
export function atHref(href, id) {
  const [path, query = ''] = String(href).split('?');
  const q = new URLSearchParams(query);
  if (id) q.set('at', id);
  else q.delete('at');
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';

/** Show the section the address names: wait for it (pages load later), scroll to it, light it. */
export async function goAt(hash) {
  const id = atOf(hash);
  if (!id) return;
  const start = Date.now();
  while (Date.now() - start < WAIT) {
    if (location.hash !== hash && !location.hash.startsWith(String(hash).split('?')[0])) return; // the person has moved on
    const el = document.getElementById(id) ?? document.querySelector(`[data-at="${CSS.escape(id)}"]`);
    if (el && visible(el)) {
      const { light } = await import('../know/spot.js');
      light(el, `at:${id}`);
      return;
    }
    await new Promise((ok) => setTimeout(ok, STEP));
  }
}
