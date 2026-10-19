/**
 * Package G «Daten kommen von selbst» (#157, #158): read a few files out of a big .zip (the Google
 * Takeout export, often several hundred MB) without loading the whole zip. It reads the central
 * directory at the end, then only the wanted entries, one after the other, via Blob.slice and the
 * browser's own DecompressionStream('deflate-raw'). No library; memory stays at about one entry.
 * Loaded on demand (dynamic import) by FitbitImport.svelte, so the main bundle does not grow.
 */

const EOCD = 0x06054b50;
const ZIP64_LOC = 0x07064b50;
const ZIP64_EOCD = 0x06064b50;
const CEN = 0x02014b50;
const LOC = 0x04034b50;

const bytesOf = async (blob, from, to) => new DataView(await blob.slice(from, to).arrayBuffer());
const u64 = (v, at) => Number(v.getBigUint64(at, true));
const utf8 = new TextDecoder('utf-8');

/** The central directory: [{ name, method, csize, size, offset }]. Throws 'not_zip' when it is none. */
export async function zipEntries(blob) {
  const size = blob.size;
  const tailLen = Math.min(size, 22 + 0xffff);
  const tail = await bytesOf(blob, size - tailLen, size);
  let e = -1;
  for (let i = tail.byteLength - 22; i >= 0; i--) {
    if (tail.getUint32(i, true) === EOCD) {
      e = i;
      break;
    }
  }
  if (e < 0) throw new Error('not_zip');
  let count = tail.getUint16(e + 10, true);
  let cdSize = tail.getUint32(e + 12, true);
  let cdOffset = tail.getUint32(e + 16, true);
  // zip64: the locator sits right before the end record
  if ((count === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) && e >= 20 && tail.getUint32(e - 20, true) === ZIP64_LOC) {
    const at = u64(tail, e - 20 + 8);
    const z = await bytesOf(blob, at, at + 56);
    if (z.getUint32(0, true) === ZIP64_EOCD) {
      count = u64(z, 32);
      cdSize = u64(z, 40);
      cdOffset = u64(z, 48);
    }
  }
  const cd = await bytesOf(blob, cdOffset, cdOffset + cdSize);
  const out = [];
  let p = 0;
  for (let n = 0; n < count && p + 46 <= cd.byteLength; n++) {
    if (cd.getUint32(p, true) !== CEN) break;
    const method = cd.getUint16(p + 10, true);
    let csize = cd.getUint32(p + 20, true);
    let usize = cd.getUint32(p + 24, true);
    const nameLen = cd.getUint16(p + 28, true);
    const extraLen = cd.getUint16(p + 30, true);
    const commentLen = cd.getUint16(p + 32, true);
    let offset = cd.getUint32(p + 42, true);
    const name = utf8.decode(new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nameLen));
    // zip64 extra field (id 1): the values that are 0xffffffff above, in this order
    let x = p + 46 + nameLen;
    const xEnd = x + extraLen;
    while (x + 4 <= xEnd) {
      const id = cd.getUint16(x, true);
      const len = cd.getUint16(x + 2, true);
      if (id === 1) {
        let q = x + 4;
        if (usize === 0xffffffff) (usize = u64(cd, q)), (q += 8);
        if (csize === 0xffffffff) (csize = u64(cd, q)), (q += 8);
        if (offset === 0xffffffff) offset = u64(cd, q);
      }
      x += 4 + len;
    }
    out.push({ name, method, csize, size: usize, offset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

/** One entry's bytes as text (stored or deflated). */
export async function entryText(blob, entry) {
  const head = await bytesOf(blob, entry.offset, entry.offset + 30);
  if (head.getUint32(0, true) !== LOC) throw new Error('bad_entry');
  const start = entry.offset + 30 + head.getUint16(26, true) + head.getUint16(28, true);
  const data = blob.slice(start, start + entry.csize);
  if (entry.method === 0) return data.text();
  if (entry.method !== 8) throw new Error('unsupported_method');
  if (typeof DecompressionStream !== 'function') throw new Error('no_decompression');
  return new Response(data.stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
}

/**
 * The wanted entries of a zip, one at a time: for await (const { name, text } of zipTexts(file, want)).
 * want(name) decides by the path inside the zip; folders are left out.
 */
export async function* zipTexts(blob, want = () => true) {
  const list = (await zipEntries(blob)).filter((x) => !x.name.endsWith('/') && want(x.name));
  for (let i = 0; i < list.length; i++) yield { name: list[i].name, text: await entryText(blob, list[i]), index: i, total: list.length };
}
