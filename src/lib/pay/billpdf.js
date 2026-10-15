/**
 * The invoice as a PDF (mockup QR1 «PDF teilen», Noah 14.10.2026 04:00 «a»), made on the device
 * without a library or a server: the A4 page is drawn on a canvas (letter on top, payment part with
 * receipt at the bottom, as the Swiss standard places it) and wrapped as one JPEG in a small PDF.
 */
import { qrMatrix, swissCross } from './qrmatrix.js';
import { payload, formatIban, formatReference, formatAmount } from './qrbill.js';
import { dateOf } from '../i18n.svelte.js';

const MM = 2480 / 210; // pixels per millimetre at 300 dpi
const W = 2480;
const H = 3508;

/** A one-page PDF around a JPEG (bytes), page size A4. Pure, so it is tested without a browser. */
export function pdfFromJpeg(jpeg, width, height) {
  const enc = new TextEncoder();
  const parts = [];
  const offsets = [];
  let length = 0;
  const push = (chunk) => {
    const bytes = typeof chunk === 'string' ? enc.encode(chunk) : chunk;
    parts.push(bytes);
    length += bytes.length;
  };
  const obj = (n, body) => {
    offsets[n] = length;
    push(`${n} 0 obj\n${body}\nendobj\n`);
  };
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
  offsets[4] = length;
  push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  push(jpeg);
  push('\nendstream\nendobj\n');
  const draw = 'q 595.28 0 0 841.89 0 0 cm /Im0 Do Q';
  obj(5, `<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`);
  const xref = length;
  push(`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('')}`);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out = new Uint8Array(length);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** Draw the invoice page. tr = t() of the app (texts follow the app language). */
async function drawPage(ctx, account, bill, tr) {
  const font = (pt, bold = false) => (ctx.font = `${bold ? '700' : '400'} ${Math.round((pt * 300) / 72)}px "Helvetica Neue", Arial, sans-serif`);
  const text = (s, xmm, ymm) => ctx.fillText(String(s ?? ''), xmm * MM, ymm * MM);
  const lines = (arr, xmm, ymm, step) => arr.filter(Boolean).forEach((s, i) => text(s, xmm, ymm + i * step));
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#111';
  ctx.textBaseline = 'alphabetic';

  const street = [account.street, account.house].filter(Boolean).join(' ');
  const place = [account.zip, account.town].filter(Boolean).join(' ');

  // Letter
  font(10);
  lines([account.name, street, place], 20, 22, 5);
  font(20, true);
  text(tr('Invoice {no}', { no: bill.no }), 20, 62);
  font(11);
  lines([tr('For: {name}', { name: bill.name }), tr('Date: {date}', { date: dateOf(bill.createdAt) }), bill.purpose], 20, 74, 6.5);
  font(16, true);
  text(`${formatAmount(bill.amount)} CHF`, 20, 102);
  let y = 116;
  if (bill.ways?.twint && account.twint) {
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 3;
    ctx.strokeRect(20 * MM, y * MM, 120 * MM, 26 * MM);
    font(11, true);
    text(tr('Pay with TWINT'), 25, y + 8);
    font(11);
    text(tr('Send {amount} CHF to {phone}', { amount: formatAmount(bill.amount), phone: account.twint }), 25, y + 15);
    text(tr('Message: {no}', { no: bill.no }), 25, y + 21.5);
    y += 34;
  }
  if (bill.ways?.qr) {
    font(11);
    text(tr('Or by bank: scan the QR code below with your banking app.'), 20, y + 4);
  }
  if (!bill.ways?.qr) return;

  // Payment part: 105 mm high at the bottom, receipt 62 mm on the left
  const top = 297 - 105;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(0, top * MM);
  ctx.lineTo(W, top * MM);
  ctx.moveTo(62 * MM, top * MM);
  ctx.lineTo(62 * MM, H);
  ctx.stroke();
  ctx.setLineDash([]);

  const receipt = [
    [tr('Account / Payable to'), [formatIban(account.iban), account.name, street, place]],
    [tr('Reference'), [formatReference(bill.ref)]],
  ];
  font(11, true);
  text(tr('Receipt|qrbill'), 5, top + 10);
  let ry = top + 17;
  for (const [h, v] of receipt) {
    font(6, true);
    text(h, 5, ry);
    font(8);
    v.filter(Boolean).forEach((s, i) => text(s, 5, ry + 3.5 * (i + 1)));
    ry += 3.5 * (v.filter(Boolean).length + 1) + 2;
  }
  font(6, true);
  text(tr('Currency'), 5, top + 68);
  text(tr('Amount|money'), 20, top + 68);
  font(8);
  text('CHF', 5, top + 72);
  text(formatAmount(bill.amount), 20, top + 72);
  font(6, true);
  text(tr('Acceptance point'), 38, top + 85);

  font(11, true);
  text(tr('Payment part'), 67, top + 10);
  const m = await qrMatrix(payload(account, { amount: bill.amount, ref: bill.ref, refType: bill.refType, message: [bill.purpose, bill.no].filter(Boolean).join(' · ') }));
  const size = 46 * MM;
  const cell = size / m.n;
  const qx = 67 * MM;
  const qy = (top + 17) * MM;
  ctx.fillStyle = '#000';
  for (let r = 0; r < m.n; r++) for (let c = 0; c < m.n; c++) if (m.rows[r][c]) ctx.fillRect(qx + c * cell, qy + r * cell, Math.ceil(cell), Math.ceil(cell));
  const x = swissCross(m.n);
  const box = (b, fill) => {
    ctx.fillStyle = fill;
    ctx.fillRect(qx + b.x * cell, qy + b.y * cell, (b.w ?? 0) * cell, (b.h ?? b.w) * cell);
  };
  box(x.edge, '#fff');
  box(x.box, '#000');
  box(x.crossV, '#fff');
  box(x.crossH, '#fff');
  ctx.fillStyle = '#111';
  font(8, true);
  text(tr('Currency'), 67, top + 72);
  text(tr('Amount|money'), 82, top + 72);
  font(10);
  text('CHF', 67, top + 77);
  text(formatAmount(bill.amount), 82, top + 77);

  const info = [
    [tr('Account / Payable to'), [formatIban(account.iban), account.name, street, place]],
    [tr('Reference'), [formatReference(bill.ref)]],
    [tr('Additional information'), [[bill.purpose, bill.no].filter(Boolean).join(' · ')]],
  ];
  let iy = top + 10;
  for (const [h, v] of info) {
    font(8, true);
    text(h, 118, iy);
    font(10);
    v.filter(Boolean).forEach((s, i) => text(s, 118, iy + 4.5 * (i + 1)));
    iy += 4.5 * (v.filter(Boolean).length + 1) + 3;
  }
}

/** The invoice as a PDF file (File object), drawn on this device. */
export async function invoicePdf(account, bill, tr) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  await drawPage(canvas.getContext('2d'), account, bill, tr);
  const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', 0.9));
  const jpeg = new Uint8Array(await blob.arrayBuffer());
  return new File([pdfFromJpeg(jpeg, W, H)], `${bill.no}.pdf`, { type: 'application/pdf' });
}
