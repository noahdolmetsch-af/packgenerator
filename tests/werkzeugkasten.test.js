// Paket L «Werkzeugkasten» (Noah 19.10.2026): the pure parts of the tools (src/lib/tools/*.js).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { evaluate, tokens, pushHistory } from '../src/lib/tools/calc.js';
import { UNIT_KINDS, convert, roundUnit } from '../src/lib/tools/units.js';
import { offsetMinutes, diffText, dayShift, timeIn, validZone, placeOfZone, DEFAULT_ZONES } from '../src/lib/tools/zones.js';
import { headingOf, directionOf, norm, DIRECTIONS } from '../src/lib/tools/compass.js';
import { fitSize, centerCrop, clampCrop, dragCrop, outName, SIZES, SHAPES } from '../src/lib/tools/phototools.js';
import { isPdf, sizeText, fitOnA4, mergeParts, shrinkPdf, pagesOf } from '../src/lib/tools/pdftools.js';
import { PHRASES, PHRASE_LANGS, PHRASE_GROUPS, findPhrases } from '../src/lib/tools/phrases.js';
import { TOOLS, toolKeyOf, TOOLS_HASH, orderTools, suggestTools } from '../src/lib/tools/tools.js';
import { tiltOf, isEdge, angleOf, bubbleOf, isLevel, slopePct } from '../src/lib/tools/level.js';
import { WHEELS, circumference, teethOf, gear, gearTable, rangePct } from '../src/lib/tools/gears.js';
import { haversine, lineLength, distText, gpxOf } from '../src/lib/tools/geo.js';
import { cleanCode, checkDigitOk, itemsWithCode } from '../src/lib/tools/barcode.js';
import { isHeic, convertedName, TARGETS } from '../src/lib/tools/convert.js';
import { VIDEO_SIZES, videoPlan, videoGuess, recType, stillSize, probeStart, PROBE_SECONDS } from '../src/lib/tools/video.js';
import { SUGGESTED, WEB_GROUPS, cleanWeb, groupName, linkTrip, webLinks, linksIn, moveLink, deleteWebGroup, mapsUrl, calendarUrl } from '../src/lib/tools/weblinks.js';
import { STEPS, DEFAULT_CHAINS, brokenStep, cleanChains, kindOfFiles, runChain, chainName } from '../src/lib/tools/chains.js';
import { pageOf, placeOf } from '../src/lib/nav.js';
import { TILES } from '../src/lib/home/tiles.js';
import { FEATURES } from '../src/lib/features.js';
import de from '../src/lib/i18n/de/index.js';

// a small grey JPEG (64 × 48), made up for the test
const JPG = Uint8Array.from(Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAwAEADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDsKKKK5z48KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/2Q==', 'base64'));

describe('calculator', () => {
  it('computes in the right order, with brackets, comma and the signs of the keys', () => {
    expect(evaluate('1+2*3')).toBe(7);
    expect(evaluate('(1+2)×3')).toBe(9);
    expect(evaluate('2,5 × 4')).toBe(10);
    expect(evaluate('10 ÷ 4')).toBe(2.5);
    expect(evaluate('−3 + 5')).toBe(2);
    expect(evaluate('0.1+0.2')).toBe(0.3);
    expect(evaluate("1'200 / 3")).toBe(400);
  });
  it('percent: on its own a share, after + or − of the value before', () => {
    expect(evaluate('50%')).toBe(0.5);
    expect(evaluate('80 + 10 %')).toBe(88);
    expect(evaluate('80 - 25%')).toBe(60);
    expect(evaluate('200 × 15%')).toBe(30);
  });
  it('gives nothing for an unfinished line, a division by 0 or other signs', () => {
    for (const l of ['', '1+', '(2', '10/0', 'abc', '2)']) expect(evaluate(l), l).toBeNull();
    expect(tokens('2 € 3')).toBeNull();
  });
  it('keeps the 10 newest lines, no line twice', () => {
    let h = [];
    for (let i = 0; i < 12; i++) h = pushHistory(h, `${i}+1`, i + 1);
    expect(h).toHaveLength(10);
    expect(h[0].line).toBe('11+1');
    h = pushHistory(h, '5+1', 6);
    expect(h.filter((x) => x.line === '5+1')).toHaveLength(1);
    expect(h[0].line).toBe('5+1');
  });
});

describe('units', () => {
  it('converts length, weight, temperature, pressure and pace', () => {
    expect(roundUnit(convert('length', '10', 'mi', 'km'))).toBe(16.093);
    expect(roundUnit(convert('weight', '1', 'kg', 'lb'))).toBe(2.205);
    expect(convert('temp', '100', '°C', '°F')).toBe(212);
    expect(roundUnit(convert('temp', '-40', '°F', '°C'))).toBe(-40);
    expect(roundUnit(convert('pressure', '3.2', 'bar', 'psi'))).toBe(46.412);
    expect(convert('speed', '5', 'min/km', 'km/h')).toBe(12);
    expect(convert('speed', '20', 'km/h', 'min/km')).toBe(3);
    expect(convert('length', '1,5', 'km', 'm')).toBe(1500);
  });
  it('gives nothing for an empty or wrong value', () => {
    expect(convert('length', '', 'km', 'm')).toBeNull();
    expect(convert('length', 'x', 'km', 'm')).toBeNull();
    expect(convert('speed', '0', 'min/km', 'km/h')).toBeNull();
  });
  it('every kind has at least two units and a German name', () => {
    for (const k of UNIT_KINDS) {
      expect(k.units.length).toBeGreaterThan(1);
      expect(de[k.label], k.label).toBeTruthy();
    }
  });
});

describe('time zones', () => {
  const winter = new Date('2026-01-15T12:00:00Z');
  const summer = new Date('2026-07-15T12:00:00Z');
  it('knows the offset in winter and summer', () => {
    expect(offsetMinutes('Europe/Zurich', winter)).toBe(60);
    expect(offsetMinutes('Europe/Zurich', summer)).toBe(120);
    expect(offsetMinutes('Asia/Kolkata', winter)).toBe(330);
  });
  it('shows the difference to here and the day', () => {
    expect(diffText('Asia/Tokyo', 'Europe/Zurich', winter)).toBe('+8 h');
    expect(diffText('America/New_York', 'Europe/Zurich', summer)).toBe('−6 h');
    expect(diffText('Asia/Kolkata', 'Europe/Zurich', winter)).toBe('+4 h 30');
    expect(diffText('Europe/Zurich', 'Europe/Zurich', winter)).toBe('±0');
    expect(dayShift('Asia/Tokyo', 'Europe/Zurich', new Date('2026-01-15T20:00:00Z'))).toBe(1);
    expect(dayShift('America/New_York', 'Europe/Zurich', new Date('2026-01-15T02:00:00Z'))).toBe(-1);
    expect(timeIn('Asia/Tokyo', winter)).toBe('21:00');
  });
  it('checks zones and suggests a place name', () => {
    expect(validZone('Europe/Zurich')).toBe(true);
    expect(validZone('Mars/Base')).toBe(false);
    expect(placeOfZone('America/New_York')).toBe('New York');
    for (const z of DEFAULT_ZONES) expect(validZone(z.tz)).toBe(true);
  });
});

describe('compass', () => {
  it('reads the iPhone and the Android heading', () => {
    expect(headingOf({ webkitCompassHeading: 90.4 })).toBe(90);
    expect(headingOf({ alpha: 90, absolute: true })).toBe(270);
    expect(headingOf({ alpha: 90, absolute: false })).toBeNull();
    expect(headingOf(null)).toBeNull();
  });
  it('names the direction', () => {
    expect(directionOf(0)).toBe('N|compass');
    expect(directionOf(44)).toBe('NE|compass');
    expect(directionOf(350)).toBe('N|compass');
    expect(directionOf(225)).toBe('SW|compass');
    expect(norm(-10)).toBe(350);
    for (const d of DIRECTIONS) expect(de[d], d).toBeTruthy();
  });
});

describe('photos', () => {
  it('fits a size and never makes a photo bigger', () => {
    expect(fitSize(4000, 3000, 1280)).toEqual({ w: 1280, h: 960 });
    expect(fitSize(600, 800, 1280)).toEqual({ w: 600, h: 800 });
    expect(fitSize(4000, 3000, 0)).toEqual({ w: 4000, h: 3000 });
  });
  it('cuts the biggest shape in the middle', () => {
    expect(centerCrop(4000, 3000, 1)).toEqual({ x: 500, y: 0, w: 3000, h: 3000 });
    expect(centerCrop(3000, 4000, 16 / 9)).toEqual({ x: 0, y: 1156, w: 3000, h: 1688 });
    expect(centerCrop(100, 50, 0)).toEqual({ x: 0, y: 0, w: 100, h: 50 });
  });
  it('drags the frame and its corners inside the photo, keeping the shape', () => {
    const r = { x: 100, y: 100, w: 200, h: 200 };
    expect(dragCrop(r, 'move', 1000, -500, 1000, 800)).toEqual({ x: 800, y: 0, w: 200, h: 200 });
    expect(dragCrop(r, 'se', 100, 50, 1000, 800)).toEqual({ x: 100, y: 100, w: 300, h: 250 });
    expect(dragCrop(r, 'se', 100, 50, 1000, 800, 1)).toEqual({ x: 100, y: 100, w: 250, h: 250 });
    expect(dragCrop(r, 'nw', -500, -500, 1000, 800)).toEqual({ x: 0, y: 0, w: 300, h: 300 });
    expect(dragCrop(r, 'nw', 500, 0, 1000, 800).w).toBe(16);
    expect(clampCrop({ x: -5, y: 900, w: 50, h: 50 }, 100, 100)).toEqual({ x: 0, y: 50, w: 50, h: 50 });
  });
  it('names the result', () => {
    expect(outName('velo.JPG', 'klein', 'jpg')).toBe('velo-klein.jpg');
    expect(outName('', 'freigestellt', 'png')).toBe('foto-freigestellt.png');
  });
  it('every size and shape has a German name', () => {
    for (const s of [...SIZES, ...SHAPES]) expect(de[s.label], s.label).toBeTruthy();
  });
});

describe('PDF', () => {
  it('knows a PDF and writes sizes', () => {
    expect(isPdf(new TextEncoder().encode('%PDF-1.7'))).toBe(true);
    expect(isPdf(JPG, 'x.jpg', 'image/jpeg')).toBe(false);
    expect(sizeText(1_234_567)).toBe('1.2 MB');
    expect(sizeText(340_000)).toBe('340 KB');
    expect(fitOnA4(2000, 1000).page[0]).toBeGreaterThan(fitOnA4(2000, 1000).page[1]);
  });
  it('merges PDFs and photos in the given order', async () => {
    const one = await mergeParts([{ kind: 'jpg', bytes: JPG }]);
    expect(one.pages).toBe(1);
    const all = await mergeParts([{ kind: 'pdf', bytes: one.bytes }, { kind: 'jpg', bytes: JPG }, { kind: 'pdf', bytes: one.bytes }]);
    expect(all.pages).toBe(3);
    expect(await pagesOf(all.bytes)).toBe(3);
  });
  it('makes the photos inside smaller and leaves the rest', async () => {
    const big = (await mergeParts([{ kind: 'jpg', bytes: JPG }, { kind: 'jpg', bytes: JPG }])).bytes;
    const seen = [];
    const recode = async (bytes, o) => (seen.push(o), { bytes: JPG.slice(0, 200), width: 32, height: 24 });
    const out = await shrinkPdf(big, recode, { quality: 0.5, maxSide: 800 });
    expect(out.images).toBeGreaterThan(0);
    expect(seen[0]).toEqual({ quality: 0.5, maxSide: 800 });
    expect(await pagesOf(out.bytes)).toBe(2);
    const none = await shrinkPdf(big, async () => null);
    expect(none.images).toBe(0);
  });
});

describe('phrases', () => {
  it('every sentence has all six languages and a German line', () => {
    expect(PHRASE_LANGS.map((l) => l.key)).toEqual(['fr', 'it', 'en', 'es', 'pt', 'nl']);
    for (const p of PHRASES) {
      for (const l of PHRASE_LANGS) expect(p[l.key], `${p.en} ${l.key}`).toBeTruthy();
      expect(de[p.en], p.en).toBeTruthy();
      expect(PHRASE_GROUPS.some((g) => g.key === p.g)).toBe(true);
    }
  });
  it('finds by the own line or the translation', () => {
    expect(findPhrases('flat').map((p) => p.en)).toEqual(['I have a flat tyre']);
    expect(findPhrases('stazione').map((p) => p.en)).toEqual(['Where is the train station?']);
    expect(findPhrases('', (s) => s, 'help').every((p) => p.g === 'help')).toBe(true);
  });
});

describe('toolbox page', () => {
  it('has its page under Me, each tool its address, a German name and line', () => {
    expect(pageOf(TOOLS_HASH)).toBe('tools');
    expect(placeOf('tools')).toBe('trips'); // «Alles finden 2» (Noah 22.10.2026 «4a»): a tab of Touren
    for (const x of TOOLS) {
      expect(toolKeyOf(`${TOOLS_HASH}/${x.key}`)).toBe(x.key);
      expect(de[x.title], x.title).toBeTruthy();
      expect(de[x.sub], x.sub).toBeTruthy();
    }
    expect(toolKeyOf('#/me/tools')).toBe('');
    expect(toolKeyOf('#/me/tools/nothing')).toBe('');
  });
  it('a tile on Today (only from the catalog) and three functions in the catalogue', () => {
    expect(TILES.find((x) => x.id === 'tools')).toBeTruthy();
    for (const id of ['f.tools', 'f.pdftools', 'f.phototools']) expect(FEATURES.some((f) => f.id === id), id).toBe(true);
  });
  it('the heavy parts load only when used (the start bundle stays small)', () => {
    expect(readFileSync('src/lib/tools/MapMeasure.svelte', 'utf8')).not.toMatch(/^\s*import .*leaflet/m);
    for (const f of ['pdftools.js', 'phototools.js']) {
      const s = readFileSync(`src/lib/tools/${f}`, 'utf8');
      expect(s).not.toMatch(/^import .*(pdf-lib|transformers)/m);
    }
  });
});

describe('links and small files (Ablage)', async () => {
  const { cleanUrl, titleOf, moved, addLink, addFile, readLinks, readFiles, removeFile, restoreFile, fileData, FILE_MAX } = await import('../src/lib/tools/ablage.js');
  it('makes a typed address usable and gives a title', () => {
    expect(cleanUrl('sbb.ch')).toBe('https://sbb.ch/');
    expect(cleanUrl('https://www.example.org/a?b=1')).toBe('https://www.example.org/a?b=1');
    expect(cleanUrl('mailto:a@example.org')).toBe('mailto:a@example.org');
    expect(cleanUrl('javascript:alert(1)')).toBeNull();
    expect(cleanUrl('hallo')).toBeNull();
    expect(cleanUrl('')).toBeNull();
    expect(titleOf('https://www.example.org/x')).toBe('example.org');
  });
  it('moves an entry and leaves the list as it is for a wrong place', () => {
    expect(moved(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moved(['a', 'b'], 0, 5)).toEqual(['a', 'b']);
  });
  it('keeps links and files in the settings and brings a deleted file back', async () => {
    const rows = new Map();
    const settings = { get: async (k) => rows.get(k), put: async (r) => void rows.set(r.key, r), delete: async (k) => void rows.delete(k) };
    const db = { settings, transaction: async (_m, _t, fn) => fn() };
    expect(await addLink({ url: 'nope' }, db)).toBeNull();
    const l = await addLink({ url: 'example.org', title: '' }, db);
    expect(l.title).toBe('example.org');
    expect((await readLinks(db)).length).toBe(1);
    expect(await addFile({ name: 'x.txt', type: 'text/plain', size: FILE_MAX + 1, data: '' }, db)).toBe('big');
    const f = await addFile({ name: 'ticket.txt', type: 'text/plain', size: 5, data: 'data:text/plain;base64,aGFsbG8=' }, db);
    expect(await fileData(f.id, db)).toBe('data:text/plain;base64,aGFsbG8=');
    const gone = await removeFile(f.id, db);
    expect(await readFiles(db)).toEqual([]);
    expect(await fileData(f.id, db)).toBeNull();
    await restoreFile(gone, db);
    expect((await readFiles(db)).map((x) => x.name)).toEqual(['ticket.txt']);
  });
});

describe('trip costs and currencies', async () => {
  const { ME, cleanCosts, totalChf, balances, settle, defaultTrip, readReceipt } = await import('../src/lib/tools/costs.js');
  const { parseAmount, convertMoney, fresh, loadRates, currenciesOf, fmtMoney } = await import('../src/lib/tools/money.js');
  const people = [{ id: ME, name: '' }, { id: 'a', name: 'Anna' }, { id: 'b', name: 'Ben' }];
  it('reads typed amounts the Swiss and the other ways', () => {
    expect(parseAmount('12,50')).toBe(12.5);
    expect(parseAmount("1'234.50")).toBe(1234.5);
    expect(parseAmount('1.234,50')).toBe(1234.5);
    expect(parseAmount('12.–')).toBe(12);
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('zwölf')).toBeNull();
    expect(fmtMoney(1234.5)).toBe('1’234.50');
  });
  it('converts with «1 CHF = x» rates, across two currencies too', () => {
    const rates = { EUR: 1.05, USD: 1.25 };
    expect(convertMoney(105, 'EUR', 'CHF', rates)).toBeCloseTo(100);
    expect(convertMoney(100, 'CHF', 'USD', rates)).toBeCloseTo(125);
    expect(convertMoney(105, 'EUR', 'USD', rates)).toBeCloseTo(125);
    expect(convertMoney(1, 'XYZ', 'CHF', rates)).toBeNull();
    expect(currenciesOf({ AUD: 1, EUR: 1 })).toEqual(['CHF', 'EUR', 'AUD']);
  });
  it('fetches the rates once a day and keeps the old ones offline', async () => {
    const rows = new Map();
    const db = { meta: { get: async (k) => rows.get(k), put: async (r) => void rows.set(r.key, r) } };
    let calls = 0;
    const doFetch = async () => (calls++, { ok: true, json: async () => ({ date: '2026-10-16', rates: { EUR: 1.07 } }) });
    const a = await loadRates(db, { doFetch, today: '2026-10-19' });
    expect(a.rates.EUR).toBe(1.07);
    await loadRates(db, { doFetch, today: '2026-10-19' });
    expect(calls).toBe(1);
    const off = await loadRates(db, { doFetch, today: '2026-10-20', online: false });
    expect(off.day).toBe('2026-10-19');
    expect(fresh(off, '2026-10-20')).toBe(false);
    const broken = await loadRates(db, { doFetch: async () => ({ ok: false }), today: '2026-10-21' });
    expect(broken.rates.EUR).toBe(1.07);
  });
  it('splits evenly, also for some only, and keeps the Rappen exact', () => {
    const items = [
      { id: '1', what: 'Hotel', chf: 90, paidBy: ME, for: [] },
      { id: '2', what: 'Znacht', chf: 30, paidBy: 'a', for: [ME, 'a'] },
      { id: '3', what: 'Kaffee', chf: 10, paidBy: 'b', for: [] },
    ];
    const b = balances(people, items);
    expect(totalChf(items)).toBe(130);
    expect(b[ME]).toEqual({ paid: 9000, share: 3000 + 1500 + 334, diff: 4166 });
    expect(Object.values(b).reduce((s, v) => s + v.diff, 0)).toBe(0);
    const pays = settle(b);
    expect(pays.every((p) => p.to === ME)).toBe(true);
    expect(pays.reduce((s, p) => s + p.cents, 0)).toBe(4166);
  });
  it('a broken record is made safe; a deleted payer counts as you', () => {
    const c = cleanCosts({ people: [{ id: 'a', name: 'Anna' }], items: [{ id: 'x', chf: 5, paidBy: 'gone', for: ['gone', 'a'] }, { id: 'y' }] });
    expect(c.people[0].id).toBe(ME);
    expect(c.items).toHaveLength(1);
    expect(c.items[0].paidBy).toBe(ME);
    expect(c.items[0].for).toEqual(['a']);
  });
  it('shows today’s trip first, else the next, else the last', () => {
    const trips = [{ id: 'old', startDate: '2026-09-01', days: 2 }, { id: 'now', startDate: '2026-10-18', days: 3 }, { id: 'next', startDate: '2026-11-01', days: 1 }];
    expect(defaultTrip(trips, '2026-10-19').id).toBe('now');
    expect(defaultTrip(trips, '2026-10-25').id).toBe('next');
    expect(defaultTrip(trips, '2026-12-01').id).toBe('next');
    expect(defaultTrip([trips[0]], '2026-12-01').id).toBe('old');
    expect(defaultTrip([], '2026-12-01')).toBeNull();
  });
  it('reads amount, date and currency from the text of a receipt (made-up shop)', () => {
    const text = 'Beispiel Laden AG\nBrot 4.20\nKäse 12.80\nTOTAL CHF 17.00\nBar 20.00\n14.10.2026 12:31';
    expect(readReceipt(text)).toEqual({ amount: 17, date: '2026-10-14', cur: 'CHF' });
    expect(readReceipt('Café Muster\n2 x Espresso 5,40 €\nSumme 5,40\n03.08.2026')).toEqual({ amount: 5.4, date: '2026-08-03', cur: 'EUR' });
    expect(readReceipt('nothing here')).toEqual({ amount: null, date: null, cur: null });
  });
});

describe('spirit level', () => {
  it('reads the sensor, flat both ways, on the edge one angle', () => {
    expect(tiltOf({ beta: null, gamma: 1 })).toBeNull();
    const flat = tiltOf({ beta: 1.2, gamma: -3.4 });
    expect(isEdge(flat)).toBe(false);
    expect(angleOf(flat)).toBe(-3.4);
    const edge = { x: 2.04, y: 88 };
    expect(isEdge(edge)).toBe(true);
    expect(angleOf(edge)).toBe(2);
    expect(bubbleOf({ x: 20, y: -5 })).toEqual({ x: 1, y: -0.5 });
  });
  it('a zero offset for a crooked case, level within half a degree, slope in percent', () => {
    expect(angleOf({ x: 1.5, y: 0.2 }, { x: 1.5, y: 0.2 })).toBe(0);
    expect(isLevel(0.4)).toBe(true);
    expect(isLevel(-0.6)).toBe(false);
    expect(slopePct(5.71)).toBe(10);
    expect(slopePct(null)).toBeNull();
  });
});

describe('gear ratios', () => {
  it('teeth as typed, wheel circumference and one gear', () => {
    expect(teethOf('11-13, 15 13 99 3')).toEqual([11, 13, 15]);
    expect(circumference(622, 28)).toBe(2130);
    const w = WHEELS.find((x) => x.key === '700x40');
    const g = gear(40, 40, circumference(w.bead, w.width), 90);
    expect(g.ratio).toBe(1);
    expect(g.dev).toBe(2.21);
    expect(g.kmh).toBe(11.9);
    expect(gear(0, 11, 2100)).toBeNull();
  });
  it('the table: every ring with every cog, and the range', () => {
    const tbl = gearTable([50, 34], [11, 34], 2100);
    expect(tbl.map((r) => r.ring)).toEqual([50, 34]);
    expect(tbl[0].gears.map((x) => x.cog)).toEqual([11, 34]);
    expect(rangePct([10, 52])).toBe(520);
    expect(rangePct([11])).toBeNull();
  });
});

describe('measure a route', () => {
  it('distance between points and along a line', () => {
    expect(Math.round(haversine([47, 8], [48, 8]))).toBe(111195);
    expect(lineLength([[47, 8]])).toBe(0);
    expect(Math.round(lineLength([[47, 8], [47.01, 8], [47.02, 8]]))).toBe(2224);
    expect(distText(850.4)).toBe('850 m');
    expect(distText(12400)).toBe('12.4 km');
  });
  it('a GPX file with the points and an escaped name', () => {
    const g = gpxOf([[47.1, 8.2], [47.2, 8.3]], 'Weg <See>');
    expect(g).toContain('<name>Weg &lt;See&gt;</name>');
    expect(g.match(/<trkpt /g)).toHaveLength(2);
    expect(g).toContain('lat="47.100000" lon="8.200000"');
  });
});

describe('bar code → gear', () => {
  it('cleans the code and checks EAN digits', () => {
    expect(cleanCode(' 4 006381 333931 ')).toBe('4006381333931');
    expect(checkDigitOk('4006381333931')).toBe(true);
    expect(checkDigitOk('4006381333932')).toBe(false);
    expect(checkDigitOk('96385074')).toBe(true);
    expect(checkDigitOk('ABC-123')).toBe(true);
  });
  it('finds the items with the code', () => {
    const items = [{ id: 'a', barcode: '4006381333931' }, { id: 'b' }, { id: 'c', barcode: '' }];
    expect(itemsWithCode(items, '4006 3813 33931').map((i) => i.id)).toEqual(['a']);
    expect(itemsWithCode(items, '1')).toEqual([]);
  });
});

describe('picture format and video', () => {
  it('knows HEIC by type or name and names the result', () => {
    expect(isHeic({ type: 'image/heic', name: 'x' })).toBe(true);
    expect(isHeic({ type: '', name: 'IMG_1.HEIF' })).toBe(true);
    expect(isHeic({ type: 'image/webp', name: 'a.webp' })).toBe(false);
    expect(convertedName('IMG_0042.HEIC', 'jpg')).toBe('IMG_0042.jpg');
    expect(TARGETS.map((x) => x.key)).toEqual(['jpg', 'png']);
  });
  it('video: the short side to the chosen size, even numbers, a size guess and the recording type', () => {
    const small = VIDEO_SIZES.find((x) => x.key === '480');
    expect(videoPlan(1920, 1080, small)).toMatchObject({ w: 854, h: 480 });
    expect(videoPlan(1080, 1920, small)).toMatchObject({ w: 480, h: 854 });
    expect(videoPlan(640, 360, small)).toMatchObject({ w: 640, h: 360 });
    expect(videoGuess(60, 1_200_000)).toBe(9_960_000);
    expect(recType((x) => x === 'video/webm')).toBe('video/webm');
    expect(recType((x) => x.startsWith('video/mp4'))).toBe('video/mp4;codecs=avc1,mp4a.40.2');
    expect(recType(() => false)).toBe('');
  });
  it('video test piece: 5 seconds from the middle, never cut short, from the start when the video is short', () => {
    expect(PROBE_SECONDS).toBe(5);
    expect(probeStart(60)).toBe(27.5);
    expect(probeStart(10)).toBe(2.5);
    expect(probeStart(5)).toBe(0);
    expect(probeStart(3)).toBe(0);
    expect(probeStart(0)).toBe(0);
  });
  it('video still picture: the long side at most 1200, never bigger, never 0', () => {
    expect(stillSize(1920, 1080)).toEqual({ w: 1200, h: 675 });
    expect(stillSize(1080, 1920)).toEqual({ w: 675, h: 1200 });
    expect(stillSize(640, 360)).toEqual({ w: 640, h: 360 });
    expect(stillSize(0, 0)).toEqual({ w: 1, h: 1 });
  });
});

describe('tool chains', () => {
  it('two ready chains whose steps fit, every step and chain has German', () => {
    expect(cleanChains(null).map((c) => c.id)).toEqual(DEFAULT_CHAINS.map((c) => c.id));
    for (const c of DEFAULT_CHAINS) {
      expect(brokenStep(c.steps, 'img')).toBe(-1);
      expect(de[c.name], c.name).toBeTruthy();
    }
    for (const s of STEPS) expect(de[s.label], s.label).toBeTruthy();
    expect(chainName({ name: 'Receipts as one PDF', builtin: true }, (x) => `T:${x}`)).toBe('T:Receipts as one PDF');
    expect(chainName({ name: 'Meine Kette', builtin: false }, (x) => `T:${x}`)).toBe('Meine Kette');
  });
  it('finds the step that does not fit what comes to it', () => {
    expect(brokenStep([{ kind: 'shrink' }], 'img')).toBe(0);
    expect(brokenStep([{ kind: 'pdf' }, { kind: 'resize' }], 'img')).toBe(1);
    expect(brokenStep([{ kind: 'shrink' }, { kind: 'share' }], 'pdf')).toBe(-1);
    expect(brokenStep([{ kind: 'nope' }])).toBe(0);
    expect(kindOfFiles([{ type: 'image/jpeg', name: 'a.jpg' }, { type: 'application/pdf', name: 'b.pdf' }])).toBe('any');
    expect(kindOfFiles([{ type: 'text/plain', name: 'a.txt' }])).toBe('other');
    expect(kindOfFiles([])).toBe('');
  });
  it('cleans what comes from the settings: unknown steps go, typed names stay', () => {
    const l = cleanChains([{ id: 1, name: 'Belege', steps: [{ id: 2, kind: 'pdf' }, { id: 3, kind: 'xx' }] }, { nope: true }]);
    expect(l).toEqual([{ id: '1', name: 'Belege', builtin: false, steps: [{ id: '2', kind: 'pdf' }] }]);
  });
  it('runs the steps in order with the files', async () => {
    const log = [];
    const ops = {
      resize: async (f, px) => (log.push(`resize ${f.name} ${px}`), { ...f, name: `s-${f.name}` }),
      pdf: async (fs) => (log.push(`pdf ${fs.length}`), { name: 'all.pdf', type: 'application/pdf' }),
      shrink: async (f) => (log.push(`shrink ${f.name}`), f),
      ablage: async (f) => log.push(`ablage ${f.name}`),
      share: async (fs) => log.push(`share ${fs.map((f) => f.name)}`),
    };
    const steps = [];
    const out = await runChain(DEFAULT_CHAINS[0], [{ name: 'a.jpg' }, { name: 'b.jpg' }], ops, (i) => steps.push(i));
    expect(log).toEqual(['resize a.jpg 1600', 'resize b.jpg 1600', 'pdf 2', 'shrink all.pdf', 'share all.pdf']);
    expect(steps).toEqual([0, 1, 2, 3, 4]);
    expect(out.map((f) => f.name)).toEqual(['all.pdf']);
  });
});

describe('the toolbox list: own order and «Fits right now»', () => {
  it('keeps the own order, drops unknown keys, new tools at the end', () => {
    const l = orderTools(['map', 'nope', 'calc', 'map']);
    expect(l.slice(0, 2).map((x) => x.key)).toEqual(['map', 'calc']);
    expect(l).toHaveLength(TOOLS.length);
    expect(orderTools(null).map((x) => x.key)).toEqual(TOOLS.map((x) => x.key));
  });
  it('a trip abroad soon: currencies and phrases; mountains: compass; at most 3; nothing without a trip', () => {
    const today = '2026-10-19';
    expect(suggestTools([], today)).toEqual([]);
    expect(suggestTools([{ startDate: '2026-12-01', country: 'FR' }], today)).toEqual([]);
    const abroad = suggestTools([{ startDate: '2026-10-25', days: 3, country: 'FR', domain: 'bikepacking' }], today);
    expect(abroad.map((x) => x.key)).toEqual(['money', 'phrases', 'map']);
    expect(suggestTools([{ startDate: '2026-10-20', domain: 'ski' }], today).map((x) => x.key)).toEqual(['compass', 'costs']);
    expect(suggestTools([{ startDate: '2026-10-14', days: 2 }], today)).toEqual([{ key: 'costs', why: 'Your trip is over: who owes whom?' }]);
    expect(suggestTools([{ startDate: '2026-10-20', idea: true, country: 'IT' }], today)).toEqual([]);
    for (const w of ['For your trip abroad', 'For the mountains', 'To plan your trip', 'Share the costs of the trip', 'Your trip is over: who owes whom?']) expect(de[w], w).toBeTruthy();
  });
});

describe('page «Werkzeuge und Links»', () => {
  const trip = { id: 't', title: 'Testtour Jura', startDate: '2026-10-24', days: 2, place: { name: 'Delémont', lat: 47.3649, lon: 7.3445 } };
  it('starts with the suggested groups and links, every one with German', () => {
    const st = cleanWeb(null);
    expect(st.groups.map((g) => g.id)).toEqual(WEB_GROUPS.map((g) => g.id));
    for (const g of WEB_GROUPS) expect(de[g.label], g.label).toBeTruthy();
    for (const x of SUGGESTED) {
      expect(de[x.sub], x.sub).toBeTruthy();
      expect(st.groups.some((g) => g.id === x.group), x.id).toBe(true);
      expect(x.url({}).startsWith('https://'), x.id).toBe(true);
    }
    expect(de['Tools and links']).toBe('Werkzeuge und Links');
    expect(pageOf('#/me/links')).toBe('weblinks');
    expect(placeOf('weblinks')).toBe('week'); // «Alles finden 2» (Noah 22.10.2026 «4a»): a tab of Planen
  });
  it('links carry the next trip (place and day), only links with the pin', () => {
    expect(linkTrip([trip, { startDate: '2026-12-01' }], '2026-10-19')).toBe(trip);
    expect(linkTrip([{ startDate: '2026-11-20' }], '2026-10-19')).toBeNull();
    const ls = webLinks(cleanWeb(null), [], { trip, place: trip.place, lang: 'de' });
    const sbb = ls.find((l) => l.id === 'sbb');
    expect(sbb.href).toContain('nach=Del%C3%A9mont');
    expect(sbb.href).toContain('datum=24.10.2026');
    expect(sbb.trip).toBe(true);
    expect(ls.find((l) => l.id === 'trello').trip).toBe(false);
    expect(mapsUrl(trip.place)).toBe('https://www.google.com/maps/dir/?api=1&destination=47.365,7.345&travelmode=bicycling');
    expect(calendarUrl(trip)).toBe('https://calendar.google.com/calendar/render?action=TEMPLATE&text=Testtour%20Jura&dates=20261024/20261026');
    expect(calendarUrl(null)).toBe('https://calendar.google.com/');
  });
  it('own links from «Links und Dateien» in their group; switched-off suggestions left out; own order', () => {
    const own = [{ id: 'a', title: 'Testseite', url: 'https://example.org/', group: 'everyday' }, { id: 'b', title: 'Ohne', url: 'https://example.com/' }];
    const st = { ...cleanWeb(null), hidden: ['trello'] };
    let ls = webLinks(st, own);
    expect(ls.some((l) => l.id === 'trello')).toBe(false);
    expect(linksIn(ls, 'everyday').map((l) => l.key)).toContain('o:a');
    expect(linksIn(ls, '').map((l) => l.key)).toEqual(['o:b']);
    const order = moveLink(ls, 'everyday', linksIn(ls, 'everyday').length - 1, 0);
    ls = webLinks({ ...st, order }, own);
    expect(linksIn(ls, 'everyday')[0].key).toBe('o:a');
  });
  it('deleting a group keeps its links: to «Ohne Gruppe» or another group; typed names never through t()', () => {
    const own = [{ id: 'a', title: 'X', url: 'https://example.org/', group: 'files' }];
    const r = deleteWebGroup(cleanWeb(null), own, 'files', '');
    expect(r.state.groups.some((g) => g.id === 'files')).toBe(false);
    expect(r.own[0].group).toBe('');
    const ls = webLinks(r.state, r.own);
    expect(linksIn(ls, '').map((l) => l.id)).toEqual(['tinywow', 'ilovepdf', 'squoosh', 'a']);
    const r2 = deleteWebGroup(cleanWeb(null), own, 'files', 'bike');
    expect(linksIn(webLinks(r2.state, r2.own), 'bike').map((l) => l.id)).toContain('squoosh');
    expect(groupName({ id: 'g1', name: 'Meine Gruppe' }, () => 'T')).toBe('Meine Gruppe');
    expect(groupName({ id: 'bike', label: 'Bike|links' }, (x) => `T:${x}`)).toBe('T:Bike|links');
    expect(cleanWeb({ groups: [{ id: 'g1', name: 'Eigene' }], hidden: ['nope', 'sbb'] })).toMatchObject({ groups: [{ id: 'g1', name: 'Eigene' }], hidden: ['sbb'] });
  });
});
