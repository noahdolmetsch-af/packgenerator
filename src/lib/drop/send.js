/**
 * «Datei auf das Fenster ziehen» (Noah 23.11.2026 «3a»): hands the dropped file to the page that reads it, the way the share target of the
 * phone does (public/share-target.js): the file waits in the same cache under the same key, then the page opens. Nothing is saved here;
 * the page shows the file and asks (a ride is shown before it is saved, a backup goes through «Check import»).
 */
import { SHARE_CACHE, SHARE_KEY } from '../gpx.js';
import { SHARE_BACKUP_CACHE, SHARE_BACKUP_KEY } from '../sharebackup.js';
import { SHARE_DOCS_CACHE } from '../docs/share.js';
import { SHARE_TEXT } from '../komoot.js';
import { DROP_GO, pageOfHash } from './dropkind.js';

const base = () => location.pathname.replace(/[^/]*$/, '');

/** Keeps the files in the cache the reading page looks in and returns the address to open. Throws when the cache is not there. */
export async function stash(kind, files) {
  if (typeof caches === 'undefined') throw new Error('no cache');
  const b = base();
  const head = (f, type) => ({ 'Content-Type': f.type || type, 'X-File-Name': encodeURIComponent(f.name || 'file'), [SHARE_TEXT]: '' });
  if (kind === 'backup') {
    const c = await caches.open(SHARE_BACKUP_CACHE);
    await c.put(`${b}${SHARE_BACKUP_KEY}`, new Response(files[0], { headers: head(files[0], 'application/json') }));
  } else if (kind === 'doc') {
    const c = await caches.open(SHARE_DOCS_CACHE);
    for (const old of await c.keys()) await c.delete(old);
    for (const [i, f] of files.entries()) await c.put(`${b}shared-doc-${i}`, new Response(f, { headers: head(f, 'application/octet-stream') }));
  } else {
    const c = await caches.open(SHARE_CACHE);
    await c.put(`${b}${SHARE_KEY}`, new Response(files[0], { headers: head(files[0], 'application/gpx+xml') }));
  }
  return DROP_GO[kind];
}

/** Opens the address; when that page is already open the address is left and entered again, so the page reads the file. */
export function open(to) {
  if (pageOfHash(location.hash) === pageOfHash(to)) {
    location.hash = '#/';
    setTimeout(() => (location.hash = to), 60);
  } else location.hash = to;
}
