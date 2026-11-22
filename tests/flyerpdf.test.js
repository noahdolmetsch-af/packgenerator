// A5 für den Druck: das PDF mit einem Bild (Noah 10.11.2026 «gerne»)
import { describe, it, expect } from 'vitest';
import { pdfFromJpeg } from '../src/lib/booking/flyerpdf.js';

const text = (u8) => new TextDecoder('latin1').decode(u8);

describe('pdfFromJpeg', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 1, 2, 3, 0xff, 0xd9]);
  const pdf = pdfFromJpeg(jpeg, 1818, 2550, 35);
  const s = text(pdf);
  it('is a PDF with one page the size of the picture and a trim box 3 mm inside', () => {
    expect(s.startsWith('%PDF-1.4')).toBe(true);
    expect(s.trimEnd().endsWith('%%EOF')).toBe(true);
    // 1818 px and 2550 px at 300 dpi are 436.32 pt and 612 pt (154 × 216 mm); 35 px are 8.4 pt (about 3 mm)
    expect(s).toContain('/MediaBox [0 0 436.32 612]');
    expect(s).toContain('/TrimBox [8.4 8.4 427.92 603.6]');
    expect(s).toContain('/Width 1818 /Height 2550');
  });
  it('holds the picture bytes unchanged', () => {
    const at = s.indexOf('stream\n', s.indexOf('/DCTDecode')) + 7;
    expect(Array.from(pdf.slice(at, at + jpeg.length))).toEqual(Array.from(jpeg));
    expect(s).toContain(`/Length ${jpeg.length}`);
  });
  it('the cross-reference table points at every object', () => {
    const start = Number(/startxref\n(\d+)/.exec(s)[1]);
    expect(s.slice(start, start + 4)).toBe('xref');
    const rows = s.slice(start).split('\n').slice(3, 8);
    rows.forEach((row, i) => {
      const off = Number(row.slice(0, 10));
      expect(s.slice(off, off + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`);
    });
  });
});
