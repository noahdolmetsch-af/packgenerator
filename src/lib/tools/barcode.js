/**
 * Paket L «Werkzeugkasten» (Strichcode-Scanner → Material, Noah 19.10.2026): the camera reads a bar code
 * (the browser's own BarcodeDetector, free, on the device; Chrome on Android has it), or the number is
 * typed. A known code opens its item in Material; a new one becomes a new item with the code.
 * Pure parts tested in tests/werkzeugkasten.test.js.
 */
export const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code', 'itf'];

/** Only digits and letters, no spaces (as printed under the bars). */
export const cleanCode = (s) => String(s ?? '').replace(/[^0-9A-Za-z]/g, '').slice(0, 64);

/** Is the EAN-13 / EAN-8 / UPC-A check digit right? Other codes count as fine. */
export function checkDigitOk(code) {
  const c = cleanCode(code);
  if (!/^\d+$/.test(c) || ![8, 12, 13].includes(c.length)) return true;
  const d = c.split('').map(Number);
  const last = d.pop();
  const sum = d.reverse().reduce((s, n, i) => s + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === last;
}

/** The items that carry this code. */
export const itemsWithCode = (items, code) => (items ?? []).filter((i) => cleanCode(i.barcode) && cleanCode(i.barcode) === cleanCode(code));
