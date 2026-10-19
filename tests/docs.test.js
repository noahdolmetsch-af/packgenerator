// Dokumente-PDF: sorting, groups, search, name and date from the text, and the picture maths. Fictional data only.
import { describe, it, expect } from 'vitest';
import { sortDocs, groupDocs, ownGroups, searchDocs, findDate, suggestName, fileName, dataBytes, otsu, detectQuad, homography, project, quadSize, warp, applyMode, FULL_QUAD, SORTS, MODES, MAKES } from '../src/lib/docs.js';

const rows = [
  { id: 'a', kind: 'pdf', name: 'Quittung Veloladen Muster', group: '', createdAt: '2026-10-15T09:00:00Z', docDate: '2026-10-14', source: 'camera', text: 'Veloladen Muster\nKette ersetzt' },
  { id: 'b', kind: 'pdf', name: 'Garantieschein Lampe', group: 'Garantien', createdAt: '2026-10-12T09:00:00Z', docDate: '2024-03-01', source: 'gallery', text: 'Garantie 2 Jahre' },
  { id: 'c', kind: 'pdf', name: 'Brief Versicherung Muster', group: '', createdAt: '2026-10-03T09:00:00Z', docDate: null, source: 'file', text: '' },
  { id: 'd', kind: 'photo', name: 'Foto Zelt', group: '', createdAt: '2026-10-13T09:00:00Z', docDate: null, source: 'share', text: '' },
];

describe('sorting and groups', () => {
  it('knows its choices', () => {
    expect(SORTS).toEqual(['new', 'name', 'date', 'source']);
    expect(MODES[0]).toBe('bw');
    expect(MAKES[0]).toBe('one');
  });
  it('sorts newest first, by name, by the date in the document and by source', () => {
    expect(sortDocs(rows).map((r) => r.id)).toEqual(['a', 'd', 'b', 'c']);
    expect(sortDocs(rows, 'name').map((r) => r.id)).toEqual(['c', 'd', 'b', 'a']);
    expect(sortDocs(rows, 'date').map((r) => r.id)).toEqual(['a', 'd', 'c', 'b']);
    expect(sortDocs(rows, 'source').map((r) => r.id)).toEqual(['a', 'b', 'd', 'c']);
  });
  it('puts «Importierte PDF» first, own groups next and the photos last; empty own groups stay', () => {
    const g = groupDocs(rows, 'new', ['Ausweise']);
    expect(g.map((x) => [x.kind, x.name, x.rows.length])).toEqual([
      ['pdf', null, 2],
      ['own', 'Ausweise', 0],
      ['own', 'Garantien', 1],
      ['photo', null, 1],
    ]);
    expect(groupDocs([])).toHaveLength(1);
    expect(ownGroups(rows, ['garantien', 'Ausweise'])).toEqual(['Ausweise', 'Garantien']);
  });
  it('searches name, group and recognised text, without accents', () => {
    expect(searchDocs(rows, 'kette').map((r) => r.id)).toEqual(['a']);
    expect(searchDocs(rows, 'GARANTIE lampe').map((r) => r.id)).toEqual(['b']);
    expect(searchDocs(rows, '  ')).toHaveLength(4);
  });
});

describe('name and date from the text', () => {
  it('finds the first date in its usual forms', () => {
    expect(findDate('Rechnung vom 14.10.2026, fällig 30.10.2026')).toBe('2026-10-14');
    expect(findDate('Datum: 3. März 2025')).toBe('2025-03-03');
    expect(findDate('am 2026-01-31')).toBe('2026-01-31');
    expect(findDate('5.11.26')).toBe('2026-11-05');
    expect(findDate('31.02.2026 und Tel 044 000 00 00')).toBeNull();
  });
  it('suggests the first line that reads like words', () => {
    expect(suggestName('12.10.2026\n4000 Musterstadt 12\nQuittung Veloladen Muster\nTotal 85.00')).toBe('Quittung Veloladen Muster');
    expect(suggestName('|| ==\n1234 5678')).toBeNull();
    expect(suggestName('Ein sehr langer Titel einer Versicherung mit vielen Wörtern drin und noch mehr')).toMatch(/…$/);
  });
  it('makes a plain file name and knows the size of a data URL', () => {
    expect(fileName('Quittung Veloladen Müster!', '2026-10-15')).toBe('quittung-veloladen-muster-2026-10-15.pdf');
    expect(fileName('', null, 'jpg')).toBe('dokument.jpg');
    expect(dataBytes('data:application/pdf;base64,QUJD')).toBe(3);
    expect(dataBytes('data:x;base64,QUI=')).toBe(2);
  });
});

/** A fictional photo: dark table, a bright tilted sheet with the given corners. */
function photo(w, h, corners) {
  const gray = new Uint8ClampedArray(w * h).fill(40);
  const inside = (x, y) => {
    let s = 0;
    for (let i = 0; i < 4; i++) {
      const a = corners[i];
      const b = corners[(i + 1) % 4];
      const c = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
      if (c < 0) return false;
      s++;
    }
    return s === 4;
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inside(x + 0.5, y + 0.5)) gray[y * w + x] = 230;
  return gray;
}

describe('finding and straightening the paper', () => {
  it('otsu splits dark and bright', () => {
    const t = otsu(Uint8ClampedArray.from([10, 12, 11, 200, 210, 205]));
    expect(t).toBeGreaterThanOrEqual(12);
    expect(t).toBeLessThan(200);
  });
  it('finds the four corners of a tilted sheet', () => {
    const c = [
      { x: 30, y: 20 },
      { x: 150, y: 35 },
      { x: 135, y: 190 },
      { x: 15, y: 175 },
    ];
    const q = detectQuad(photo(180, 220, c), 180, 220);
    expect(q).toHaveLength(4);
    q.forEach((p, i) => {
      expect(Math.abs(p.x * 180 - c[i].x)).toBeLessThan(5);
      expect(Math.abs(p.y * 220 - c[i].y)).toBeLessThan(5);
    });
  });
  it('gives up when there is no clear paper', () => {
    expect(detectQuad(new Uint8ClampedArray(100 * 100).fill(120), 100, 100)).toBeNull();
    expect(detectQuad(null, 0, 0)).toBeNull();
  });
  it('the projection maps the corners exactly', () => {
    const from = FULL_QUAD.map((p) => ({ x: p.x * 100, y: p.y * 140 }));
    const to = [
      { x: 10, y: 5 },
      { x: 90, y: 12 },
      { x: 95, y: 150 },
      { x: 3, y: 140 },
    ];
    const H = homography(from, to);
    from.forEach((p, i) => {
      const r = project(H, p.x, p.y);
      expect(r.x).toBeCloseTo(to[i].x, 6);
      expect(r.y).toBeCloseTo(to[i].y, 6);
    });
    expect(quadSize(to, 1000)).toEqual({ w: 93, h: 138 });
    expect(quadSize(to, 69)).toEqual({ w: 46, h: 69 });
  });
  it('warp copies the inside of the quad, and black and white keeps writing dark', () => {
    const w = 40;
    const h = 40;
    const src = { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
    for (let i = 0; i < w * h; i++) {
      const x = i % w;
      const v = x >= 10 && x < 30 ? 230 : 30;
      src.data.set([v, v, v, 255], i * 4);
    }
    const out = { width: 20, height: 20, data: new Uint8ClampedArray(20 * 20 * 4) };
    warp(src, [{ x: 10, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 40 }, { x: 10, y: 40 }], out);
    expect([...out.data.slice(0, 4)]).toEqual([230, 230, 230, 255]);
    // a dark line on a page with a shadow on the right
    const page = { width: 64, height: 64, data: new Uint8ClampedArray(64 * 64 * 4) };
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const base = x < 32 ? 230 : 150;
        const v = y === 30 ? base - 110 : base;
        page.data.set([v, v, v, 255], (y * 64 + x) * 4);
      }
    }
    applyMode(page, 'bw');
    const at = (x, y) => page.data[(y * 64 + x) * 4];
    expect(at(10, 30)).toBe(0);
    expect(at(50, 30)).toBe(0);
    expect(at(10, 10)).toBe(255);
    expect(at(50, 10)).toBe(255);
  });
});

describe('reading the text', () => {
  it('keeps the document without text when offline or when the reader cannot be reached', async () => {
    const { readText } = await import('../src/lib/docs/ocr.js');
    expect(await readText(['data:image/jpeg;base64,AA'], { online: false })).toBe('');
    expect(await readText([], {})).toBe('');
    expect(await readText(['data:image/jpeg;base64,AA'], { doFetch: async () => { throw new Error('offline'); } })).toBe('');
    expect(await readText(['data:image/jpeg;base64,AA'], { doFetch: async () => ({ ok: false }) })).toBe('');
  });
});
