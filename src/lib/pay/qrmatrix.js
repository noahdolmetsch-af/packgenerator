/**
 * The modules of a Swiss QR code (error correction M, as the standard asks). The code library
 * (qrcode-generator, MIT) loads only when a bill is shown, so the app stays small.
 * Returns { n, rows } where rows[r][c] is true for a dark module.
 */
export async function qrMatrix(text) {
  const { default: qrcode } = await import('qrcode-generator');
  const qr = qrcode(0, 'M');
  // The library writes each character as one byte: hand it the UTF-8 bytes (ä, é, …) one by one.
  qr.addData(String.fromCharCode(...new TextEncoder().encode(text)), 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  const rows = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)));
  return { n, rows };
}

/** SVG path of the dark modules, offset by a quiet zone q. */
export function modulesPath({ n, rows }, q = 0) {
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (rows[r][c]) d += `M${c + q} ${r + q}h1v1h-1z`;
  return d;
}

/**
 * The Swiss cross in the middle (7 mm on a 46 mm code): a black square with a white cross and a
 * thin white edge, in module units of a code n modules wide.
 */
export function swissCross(n) {
  const s = (n * 7) / 46;
  const x = (n - s) / 2;
  const edge = s * 0.08;
  const arm = s * 0.6;
  const bar = s * 0.2;
  const c = n / 2;
  return {
    edge: { x: x - edge, y: x - edge, w: s + 2 * edge },
    box: { x, y: x, w: s },
    crossV: { x: c - bar / 2, y: c - arm / 2, w: bar, h: arm },
    crossH: { x: c - arm / 2, y: c - bar / 2, w: arm, h: bar },
  };
}
