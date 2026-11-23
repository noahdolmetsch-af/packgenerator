// «Datei auf das Fenster ziehen» (Noah 23.11.2026 «3a»): src/lib/drop/dropkind.js
import { describe, it, expect } from 'vitest';
import { kindOf, planDrop, DROP_GO, DOCS_MAX } from '../src/lib/drop/dropkind.js';

const file = (name, type = '', size = 100, text = '') => ({ name, type, size, text: async () => text });
const gpx = (timed) =>
  `<?xml version="1.0"?><gpx version="1.1"><trk><trkseg>${[0, 1, 2].map((i) => `<trkpt lat="47.${i}" lon="8.${i}"><ele>400</ele>${timed ? `<time>2026-10-0${i + 1}T08:0${i}:00Z</time>` : ''}</trkpt>`).join('')}</trkseg></trk></gpx>`;

describe('kindOf', () => {
  it('a GPX with times is a ride, without times a planned route', async () => {
    expect(await kindOf(file('tour.gpx', 'application/gpx+xml', 10, gpx(true)))).toBe('ride');
    expect(await kindOf(file('tour.gpx', '', 10, gpx(false)))).toBe('route');
  });
  it('a TCX is a ride; a GPX that cannot be read is left to the ride upload', async () => {
    expect(await kindOf(file('a.tcx'))).toBe('ride');
    const bad = { name: 'x.gpx', type: '', size: 5, text: async () => { throw new Error('no'); } };
    expect(await kindOf(bad)).toBe('ride');
  });
  it('a backup, a photo and a PDF', async () => {
    expect(await kindOf(file('pack-generator-2026.json', 'application/json'))).toBe('backup');
    expect(await kindOf(file('IMG.JPG', 'image/jpeg'))).toBe('doc');
    expect(await kindOf(file('ticket.pdf', 'application/pdf'))).toBe('doc');
    expect(await kindOf(file('foto.png'))).toBe('doc');
  });
  it('anything else does not fit', async () => {
    expect(await kindOf(file('notes.txt', 'text/plain'))).toBe('none');
    expect(await kindOf(file('archive.zip'))).toBe('none');
  });
});

describe('planDrop', () => {
  it('several photos and PDFs go together to Documents', async () => {
    const p = await planDrop([file('a.jpg', 'image/jpeg'), file('b.pdf', 'application/pdf')]);
    expect(p.kind).toBe('doc');
    expect(p.files).toHaveLength(2);
    expect(p.left).toBe(0);
  });
  it('more than 30 are cut', async () => {
    const many = Array.from({ length: 33 }, (_, i) => file(`p${i}.jpg`, 'image/jpeg'));
    const p = await planDrop(many);
    expect(p.files).toHaveLength(DOCS_MAX);
    expect(p.left).toBe(3);
  });
  it('a mix takes the first file that fits and counts the rest', async () => {
    const p = await planDrop([file('x.txt', 'text/plain'), file('r.gpx', '', 10, gpx(true)), file('a.jpg', 'image/jpeg')]);
    expect(p.kind).toBe('ride');
    expect(p.files.map((f) => f.name)).toEqual(['r.gpx']);
    expect(p.left).toBe(2);
  });
  it('nothing that fits: kind none, the file named', async () => {
    const p = await planDrop([file('x.txt', 'text/plain')]);
    expect(p.kind).toBe('none');
    expect(p.files).toHaveLength(1);
    expect((await planDrop([])).kind).toBe('none');
  });
  it('every kind has an address (the same as the share target of the phone)', () => {
    expect(DROP_GO).toEqual({ ride: '#/debrief/ride/shared', route: '#/komoot/shared', backup: '#/me/data?shared=backup', doc: '#/me/docs/scan?shared=1' });
  });
});
