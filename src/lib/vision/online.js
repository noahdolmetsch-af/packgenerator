/**
 * Paket L2 «Bilderkennung» (Noah «5a und b»): the optional way over the KI-Helfer. Only when the person
 * chose «KI-Helfer» AND tapped «Foto senden»: the photo (made small, JPEG ≤ 1024 px) and the names of
 * the list or gear go to the helper once. The app keeps nothing of it on the server; the monthly limit
 * of the helper counts as for every other question.
 */
import { ask } from '../helper/client.svelte.js';
import { forHelper } from './picture.js';
import { lang } from '../i18n.svelte.js';

/** The names the helper may choose from (at most 400, names cut to 80 characters). */
export const namesOut = (items) => items.slice(0, 400).map((it) => ({ id: String(it.id), name: String(it.name ?? '').slice(0, 80) }));

/**
 * Asks the helper what is on the photo. mode 'tick' (items = the trip's list) or 'new' (items = the gear).
 * → { ok: true, found: [{ itemId, name }] } or { ok: false, error } (see helper/client ask()).
 */
export async function askVision(mode, items, canvas, { askFn = ask } = {}) {
  const picture = await forHelper(canvas);
  const r = await askFn('vision', { mode, lang: lang.v, items: namesOut(items), picture });
  if (!r.ok) return r;
  return { ok: true, found: Array.isArray(r.result?.found) ? r.result.found : [] };
}

/** The helper's answer as the same groups as on the device (no regions, no «Was ist das?»). */
export function helperGroups(mode, found, { entries = [], items = [] } = {}) {
  const byId = new Map(items.map((it) => [it.id, it]));
  if (mode === 'tick') {
    const onList = new Map((entries ?? []).map((e) => [e.itemId, e]));
    const tick = [];
    const packed = [];
    const other = [];
    for (const f of found) {
      const e = f.itemId ? onList.get(f.itemId) : null;
      if (e && byId.has(f.itemId)) {
        if (e.packed) packed.push(byId.get(f.itemId).name);
        else if (!tick.some((x) => x.itemId === f.itemId)) tick.push({ itemId: f.itemId, name: byId.get(f.itemId).name, by: 'helper', region: null });
      } else if (f.name && !other.includes(f.name)) other.push(f.name);
    }
    return { tick, packed, other, ask: [] };
  }
  const have = [];
  const add = [];
  for (const f of found) {
    if (f.itemId && byId.has(f.itemId)) have.some((x) => x.itemId === f.itemId) || have.push({ itemId: f.itemId, name: byId.get(f.itemId).name });
    else if (f.name && !add.some((x) => x.name === f.name)) add.push({ name: f.name, nameKey: '', region: null });
  }
  return { have, add, ask: [] };
}
