// «Verbesserungs-Logbuch» step 3: the rules around the photo (size, memory cap, the note when there is none). Fictional data only.
import { describe, it, expect } from 'vitest';
import { dataBytes, photoBytes, capReached, fitSize, fullSize, FULL_MAX_HEIGHT, squeeze, PHOTO_CAP, PHOTO_TARGET, PHOTO_LIMIT, takePhoto } from '../src/lib/logbuch/photo.js';
import { makeEntry } from '../src/lib/logbuch/logbuch.js';

const url = (bytes) => `data:image/jpeg;base64,${'A'.repeat(Math.ceil((bytes * 4) / 3))}`;

describe('the photo of the log', () => {
  it('counts the bytes of a data URL and of all photos', () => {
    expect(dataBytes(url(3000))).toBe(3000);
    expect(dataBytes('')).toBe(0);
    expect(dataBytes(null)).toBe(0);
    expect(photoBytes([{ photo: url(3000) }, { photo: null }, { photo: url(6000) }])).toBe(9000);
  });
  it('the memory cap: one more picture only while it fits', () => {
    expect(capReached([{ photo: url(1000) }])).toBe(false);
    expect(capReached([{ photo: url(PHOTO_CAP - 1000) }])).toBe(true);
    expect(capReached([], 0)).toBe(false);
  });
  it('a big screen is made smaller, a small one stays as it is', () => {
    expect(fitSize(390, 844)).toEqual({ w: 390, h: 844 });
    expect(fitSize(2880, 1800, 1440)).toEqual({ w: 1440, h: 900 });
  });
  it('the whole page keeps its width up to 1000 px and is cut at 6000 px high', () => {
    expect(fullSize(390, 2000)).toMatchObject({ w: 390, h: 2000, cut: false });
    expect(fullSize(1440, 2880)).toMatchObject({ w: 1000, h: 2000, cut: false });
    const long = fullSize(390, 9000);
    expect(long).toMatchObject({ w: 390, h: FULL_MAX_HEIGHT, cut: true });
  });
  it('squeeze takes the best quality that fits the target, else the smallest under the limit, else nothing', () => {
    const sizes = { 0.72: 200 * 1024, 0.6: 140 * 1024, 0.5: 100 * 1024, 0.4: 60 * 1024, 0.3: 40 * 1024 };
    const seen = [];
    const hit = squeeze((q) => (seen.push(q), url(sizes[q])));
    expect(seen).toEqual([0.72, 0.6]);
    expect(dataBytes(hit)).toBeLessThanOrEqual(PHOTO_TARGET);
    expect(dataBytes(squeeze(() => url(300 * 1024)))).toBeLessThanOrEqual(PHOTO_LIMIT);
    expect(squeeze(() => url(PHOTO_LIMIT + 50 * 1024))).toBeNull();
  });
  it('without a screen to rebuild the entry gets «cap» or «failed», never a throw', async () => {
    expect(await takePhoto(null, { existing: [{ photo: url(PHOTO_CAP) }] })).toEqual({ photo: null, note: 'cap' });
    const r = await takePhoto(null, { win: undefined, doc: undefined });
    expect(r.photo).toBeNull();
    expect(r.note).toBe('failed');
  });
  it('an entry keeps the photo or says why it has none', () => {
    const base = { art: 'text', text: 'Fiktiv', page: '#/me', device: 'phone', width: 390 };
    expect(makeEntry({ ...base, photo: url(100) }).photoNote).toBeNull();
    expect(makeEntry({ ...base, photo: null, photoNote: 'cap' }).photoNote).toBe('cap');
    expect(makeEntry({ ...base, photo: null, photoNote: 'failed' }).photoNote).toBe('failed');
    expect(makeEntry({ ...base, photoNote: 'something' }).photoNote).toBeNull();
    expect(makeEntry(base).photoNote).toBeNull(); // written by hand: no photo and no note
  });
});
