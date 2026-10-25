/** Paket C: the part a link opens (?open=<key>), read once from the address. */
export function openFromHash(hash = typeof location === 'undefined' ? '' : location.hash) {
  const m = /[?&]open=([a-z0-9-]+)/.exec(String(hash));
  return m ? m[1] : '';
}
