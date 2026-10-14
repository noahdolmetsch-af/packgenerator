/**
 * Read a Swiss QR bill from a picture (screenshot or photo) on the device, with the browser's
 * BarcodeDetector (Chrome on Android has it). Returns the fields of readQrPayload, or throws an Error
 * with a plain German/English message from t().
 */
import { t } from '../i18n.svelte.js';
import { readQrPayload } from './camt.js';

export async function readQrImage(file) {
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) throw new Error(t('The app reads the QR code from a picture. Please upload a screenshot or photo of the bill.'));
  if (!('BarcodeDetector' in window)) throw new Error(t('This browser cannot read QR codes. On the phone (Chrome) it works.'));
  let codes;
  try {
    const bmp = await createImageBitmap(file);
    codes = await new window.BarcodeDetector({ formats: ['qr_code'] }).detect(bmp);
  } catch {
    throw new Error(t('The picture could not be read.'));
  }
  const bill = codes.map((c) => readQrPayload(c.rawValue)).find(Boolean);
  if (!bill) throw new Error(t('No Swiss QR code found in this picture.'));
  return bill;
}
