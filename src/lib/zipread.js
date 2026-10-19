/**
 * Paket N N13 (Google Keep über Takeout): read the files of a .zip in the browser, without a library.
 * Uses the central directory at the end of the file; «stored» and «deflate» entries (what Takeout
 * writes). DecompressionStream('deflate-raw') is in every current browser.
 * entries(file, keep?) → [{ name, text() }] for the names `keep(name)` accepts.
 */
const u16 = (v, o) => v.getUint16(o, true);
const u32 = (v, o) => v.getUint32(o, true);

export async function zipEntries(blob, keep = () => true) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (u32(v, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('not a zip');
  const count = u16(v, eocd + 10);
  let p = u32(v, eocd + 16);
  const dec = new TextDecoder();
  const out = [];
  for (let k = 0; k < count && p + 46 <= buf.length; k++) {
    if (u32(v, p) !== 0x02014b50) break;
    const method = u16(v, p + 10);
    const csize = u32(v, p + 20);
    const nlen = u16(v, p + 28);
    const elen = u16(v, p + 30);
    const clen = u16(v, p + 32);
    const local = u32(v, p + 42);
    const name = dec.decode(buf.subarray(p + 46, p + 46 + nlen));
    p += 46 + nlen + elen + clen;
    if (name.endsWith('/') || !keep(name)) continue;
    const start = local + 30 + u16(v, local + 26) + u16(v, local + 28);
    const data = buf.subarray(start, start + csize);
    out.push({
      name,
      async text() {
        if (method === 0) return dec.decode(data);
        if (method !== 8) throw new Error('unknown zip method');
        return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
      },
    });
  }
  return out;
}
