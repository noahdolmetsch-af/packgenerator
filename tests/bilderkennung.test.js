import { describe, it, expect } from 'vitest';
import { GEAR_LABELS, labelInfo, itemForLabel, packEmb, likeness, nearestKnown, teach, KNOWN_MAX, resolveRegion, matchTick, matchNew, regionsOf } from '../src/lib/vision/recognize.js';
import { angleAt, backAngle, sideOf, anglesOf, videoSummary, fitHints, KNEE_RANGE, addSitPos, removeSitPos, sitPosOf } from '../src/lib/vision/fit.js';
import { helperGroups, namesOut } from '../src/lib/vision/online.js';
import { prefsOf } from '../src/lib/vision/store.js';
import { MODEL_URLS, MP_URL, MP_WASM } from '../src/lib/vision/engine.js';
import { TASKS, TASK_NAMES, buildRequest, validate, forbiddenKey, pictureOf, PICTURE_MAX } from '../api/_lib/helper.js';
import { makeHandler } from '../api/helper.js';
import { TOOLS } from '../src/lib/tools/tools.js';
import { FEATURES } from '../src/lib/features.js';
import { HOWTO } from '../src/lib/know/howto.js';
import { HANDBOOK } from '../src/lib/handbook.js';
import { SINCE } from '../src/lib/know/wasneu.js';
import DE from '../src/lib/i18n/de/index.js';

// Paket L2 «Bilderkennung» (Noah 19.10.2026): fictional gear and made-up body points only.
const items = [
  { id: 'A1', name: 'Trinkflasche 750 ml' },
  { id: 'A2', name: 'Schlafsack Sommer' },
  { id: 'A3', name: 'Stirnlampe' },
  { id: 'A4', name: 'Kocher' },
  { id: 'A5', name: 'Sackmesser' },
];
const unit = (i, n = 8) => Float32Array.from({ length: n }, (_, k) => (k === i ? 1 : 0));

describe('labels from the device meet the gear names', () => {
  it('finds the gear row of an engine word, whole words only', () => {
    expect(labelInfo('bottle').en).toBe('Water bottle');
    expect(labelInfo('water bottle').en).toBe('Water bottle');
    expect(labelInfo('sleeping bag').en).toBe('Sleeping bag');
    expect(labelInfo('Crash helmet').en).toBe('Helmet');
    expect(labelInfo('person')).toBeNull();
    expect(labelInfo('')).toBeNull();
    expect(labelInfo('bottlecap')).toBeNull();
  });
  it('every row has keys, a German name and words', () => {
    for (const g of GEAR_LABELS) {
      expect(g.keys.length, g.en).toBeGreaterThan(0);
      expect(g.words.length, g.en).toBeGreaterThan(0);
      expect(DE[g.en], g.en).toBeTruthy();
    }
  });
  it('the item whose name holds a word of the row', () => {
    expect(itemForLabel(labelInfo('bottle'), items).id).toBe('A1');
    expect(itemForLabel(labelInfo('sleeping bag'), items).id).toBe('A2');
    expect(itemForLabel(labelInfo('knife'), items).id).toBe('A5');
    expect(itemForLabel(labelInfo('umbrella'), items)).toBeNull();
    expect(itemForLabel(null, items)).toBeNull();
  });
});

describe('fingerprints: taught once, found again', () => {
  it('packs to small numbers and keeps the likeness', () => {
    const a = unit(0);
    expect(packEmb(a)).toEqual([127, 0, 0, 0, 0, 0, 0, 0]);
    expect(likeness(packEmb(a), a)).toBeCloseTo(1, 5);
    expect(likeness(unit(0), unit(1))).toBe(0);
    expect(likeness([], unit(1))).toBe(-1);
  });
  it('the nearest taught thing above the bar, else nothing', () => {
    const known = [{ id: 'k1', emb: packEmb(unit(2)), itemId: 'A4', name: 'Kocher' }];
    expect(nearestKnown(unit(2), known).itemId).toBe('A4');
    expect(nearestKnown(unit(3), known)).toBeNull();
  });
  it('teach puts the newest first and keeps at most KNOWN_MAX', () => {
    let k = [];
    for (let i = 0; i < KNOWN_MAX + 5; i++) k = teach(k, { emb: unit(i % 8), name: `x${i}` }, '2026-10-19T10:00:00Z');
    expect(k.length).toBe(KNOWN_MAX);
    expect(k[0].name).toBe(`x${KNOWN_MAX + 4}`);
    expect(k[0].itemId).toBeNull();
  });
});

describe('one photo against the list', () => {
  const known = [{ id: 'k1', emb: packEmb(unit(5)), itemId: 'A4', name: 'Kocher' }];
  const regions = [
    { label: 'bottle', cls: [], emb: unit(0), ask: true },
    { label: 'sleeping bag', cls: [], emb: unit(1), ask: true },
    { label: '', cls: [{ label: 'whatever', score: 0.9 }], emb: unit(5), ask: true }, // taught: the stove
    { label: 'teddy bear', cls: [], emb: unit(6), ask: true }, // unknown
    { label: 'umbrella', cls: [], emb: unit(7), ask: true }, // gear, but not on this list
    { label: '', cls: [{ label: 'water bottle', score: 0.9 }], emb: unit(4), ask: false, grid: true }, // a grid part: only learned things
  ];
  it('learned first, then the label', () => {
    expect(resolveRegion(regions[2], items, known)).toMatchObject({ itemId: 'A4', by: 'learned' });
    expect(resolveRegion(regions[0], items, known)).toMatchObject({ itemId: 'A1', by: 'label' });
    expect(resolveRegion(regions[5], items, known)).toMatchObject({ itemId: null, by: null });
  });
  it('«Abhaken»: open items to tick, packed ones apart, the rest asked or listed', () => {
    const entries = [
      { itemId: 'A1', packed: false },
      { itemId: 'A2', packed: true },
      { itemId: 'A4', packed: false },
    ];
    const r = matchTick(regions, entries, [...items, { id: 'B1', name: 'Regenschirm' }], known);
    expect(r.tick.map((x) => x.itemId)).toEqual(['A1', 'A4']);
    expect(r.packed).toEqual(['Schlafsack Sommer']);
    expect(r.other).toEqual(['Regenschirm']);
    expect(r.ask.map((x) => x.label)).toEqual(['teddy bear']);
  });
  it('«Neu erfassen»: what is in the gear, what could be added, what is unknown', () => {
    const r = matchNew(regions, items, known);
    expect(r.have.map((x) => x.itemId)).toEqual(['A1', 'A2', 'A4']);
    expect(r.add).toEqual([{ name: '', nameKey: 'Umbrella', region: regions[4] }]);
    expect(r.ask.length).toBe(1);
  });
  it('a name taught without an item is suggested as that name', () => {
    const k2 = [{ id: 'k2', emb: packEmb(unit(6)), itemId: null, name: 'Glücksbär' }];
    expect(matchNew([regions[3]], items, k2).add).toEqual([{ name: 'Glücksbär', nameKey: '', region: regions[3] }]);
  });
  it('the regions: each thing found plus a 2×2 and 3×3 grid that is never asked about', () => {
    const r = regionsOf([{ box: { x: 1, y: 2, w: 30, h: 40 }, label: 'cup', score: 0.8 }], 300, 300);
    expect(r.length).toBe(1 + 4 + 9);
    expect(r[0]).toMatchObject({ label: 'cup', ask: true });
    expect(r.slice(1).every((x) => x.grid && x.ask === false)).toBe(true);
    expect(r[1].box).toEqual({ x: 0, y: 0, w: 150, h: 150 });
  });
});

describe('the KI-Helfer answer as the same groups', () => {
  it('tick and new', () => {
    const entries = [{ itemId: 'A1', packed: false }, { itemId: 'A2', packed: true }];
    const t = helperGroups('tick', [{ itemId: 'A1', name: 'x' }, { itemId: 'A2', name: 'x' }, { itemId: '', name: 'Velohelm' }, { itemId: 'A1', name: 'x' }], { entries, items });
    expect(t.tick.map((x) => x.itemId)).toEqual(['A1']);
    expect(t.packed).toEqual(['Schlafsack Sommer']);
    expect(t.other).toEqual(['Velohelm']);
    const n = helperGroups('new', [{ itemId: 'A3', name: '' }, { itemId: '', name: 'Velohelm' }], { items });
    expect(n.have).toEqual([{ itemId: 'A3', name: 'Stirnlampe' }]);
    expect(n.add).toEqual([{ name: 'Velohelm', nameKey: '', region: null }]);
  });
  it('names only, cut', () => {
    expect(namesOut([{ id: 1, name: 'x'.repeat(100), weightG: 5 }])).toEqual([{ id: '1', name: 'x'.repeat(80) }]);
  });
});

describe('the server: the vision task takes one photo, only it', () => {
  const pic = { type: 'image/jpeg', data: 'QUJD' };
  it('is a task with the photo first in the message', () => {
    expect(TASK_NAMES).toContain('vision');
    const req = buildRequest('vision', { mode: 'tick', lang: 'de', items: [{ id: 'A1', name: 'Flasche' }], picture: pic });
    const content = req.messages[0].content;
    expect(content[0]).toEqual({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'QUJD' } });
    expect(content[1].text).toContain('"mode":"tick"');
    expect(content[1].text).not.toContain('QUJD');
    expect(TASKS.vision.schema.required).toEqual(['found']);
  });
  it('checks the picture', () => {
    expect(pictureOf({ picture: pic })).toEqual(pic);
    expect(pictureOf({ picture: { type: 'image/gif', data: 'QUJD' } })).toBeNull();
    expect(pictureOf({ picture: { type: 'image/jpeg', data: 'data:image/jpeg;base64,QUJD' } })).toBeNull();
    expect(pictureOf({ picture: { type: 'image/jpeg', data: 'A'.repeat(PICTURE_MAX + 1) } })).toBeNull();
    expect(forbiddenKey({ picture: pic })).toBe('picture');
  });
  it('keeps only known ids and short names', () => {
    const out = validate('vision', { items: [{ id: 'A1', name: 'Flasche' }] }, { found: [{ itemId: 'A1', name: 'egal' }, { itemId: 'ZZ', name: 'Velohelm' }, { itemId: 'A1', name: '' }, { itemId: '', name: '' }] });
    expect(out.found).toEqual([{ itemId: 'A1', name: 'Flasche' }, { itemId: '', name: 'Velohelm' }]);
  });
  const env = () => ({ token: 'T', apiKey: 'K', model: 'claude-sonnet-5-5', cap: 2, redisUrl: 'https://kv.example', redisToken: 'x' });
  const fakeFetch = (calls) => async (url, init) => {
    if (String(url).startsWith('https://kv.example')) {
      calls.push('redis');
      return new Response(JSON.stringify({ result: null }), { status: 200 });
    }
    calls.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ model: 'claude-sonnet-5-5', usage: { input_tokens: 10, output_tokens: 5 }, content: [{ type: 'tool_use', name: 'answer', input: { found: [{ itemId: 'A1', name: 'x' }] } }] }), { status: 200 });
  };
  const post = (body) => new Request('https://packgen-three.vercel.app/api/helper', { method: 'POST', headers: { authorization: 'Bearer T', 'content-type': 'application/json', origin: 'https://noahdolmetsch-af.github.io' }, body: JSON.stringify(body) });
  it('answers a vision request; refuses a photo on any other task and a vision request without one', async () => {
    const calls = [];
    const h = makeHandler({ env, doFetch: fakeFetch(calls) });
    const ok = await h(post({ task: 'vision', input: { mode: 'tick', items: [{ id: 'A1', name: 'Flasche' }], picture: pic } }));
    expect(ok.status).toBe(200);
    expect((await ok.json()).result.found).toEqual([{ itemId: 'A1', name: 'Flasche' }]);
    const other = await h(post({ task: 'search', input: { question: 'x', picture: pic } }));
    expect(other.status).toBe(400);
    const none = await h(post({ task: 'vision', input: { mode: 'tick', items: [] } }));
    expect(none.status).toBe(400);
  });
});

describe('the sitting position', () => {
  it('angles: straight, right angle, the back against the ground', () => {
    expect(angleAt({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 })).toBeCloseTo(180);
    expect(angleAt({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 })).toBeCloseTo(90);
    expect(angleAt({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 1 })).toBeNull();
    expect(backAngle({ x: 0, y: 1 }, { x: 1, y: 0 })).toBeCloseTo(45);
    expect(backAngle({ x: 0, y: 1 }, { x: 0, y: 0 })).toBeCloseTo(90);
  });
  // made-up points: a rider facing right, left side to the camera
  const rider = (knee = { x: 0.52, y: 0.62 }, vis = 0.9, w = 1) => {
    const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.1 }));
    const set = (i, x, y) => (lm[i] = { x, y, visibility: vis });
    set(11, 0.6, 0.3); // shoulder
    set(13, 0.7, 0.4); // elbow
    set(15, 0.78, 0.42); // wrist
    set(23, 0.4, 0.45); // hip
    set(25, knee.x * w, knee.y); // knee
    set(27, 0.45, 0.85); // ankle
    return lm;
  };
  it('the side the camera sees, and the angles of one picture', () => {
    const lm = rider();
    expect(sideOf(lm)).toBe('left');
    const a = anglesOf(lm, 1000, 1000);
    expect(a.side).toBe('left');
    expect(a.sure).toBe(true);
    expect(a.knee).toBe(Math.round(angleAt({ x: 400, y: 450 }, { x: 520, y: 620 }, { x: 450, y: 850 })));
    expect(a.back).toBe(Math.round((Math.atan2(150, 200) * 180) / Math.PI));
    expect(anglesOf(rider(undefined, 0.3)).sure).toBe(false);
    expect(anglesOf(null)).toBeNull();
  });
  it('the picture size counts: points are scaled to pixels first', () => {
    const square = anglesOf(rider(), 1000, 1000).back;
    const wide = anglesOf(rider(), 2000, 1000).back;
    expect(wide).toBeLessThan(square);
  });
  it('a video: the knee straightest and most bent, frames not seen well left out', () => {
    const frames = [150, 152, 120, 100, 80, 75, 90, 130, 151, 149].map((k) => ({ side: 'left', knee: k, hip: k - 60, back: 40, elbow: 160, sure: true }));
    frames.push({ side: 'right', knee: 179, hip: 1, back: 1, sure: false });
    const s = videoSummary(frames);
    expect(s.knee).toBe(152);
    expect(s.kneeTop).toBe(75);
    expect(s.back).toBe(40);
    expect(s.frames).toBe(10);
    expect(s.side).toBe('left');
    expect(videoSummary(frames.slice(0, 3))).toBeNull();
  });
  it('suggestions only, in words with numbers; every one in German', () => {
    expect(fitHints({ knee: KNEE_RANGE[1] + 5, back: 40, sure: true })[0].kind).toBe('lower');
    expect(fitHints({ knee: KNEE_RANGE[0] - 5, sure: true })[0].kind).toBe('higher');
    expect(fitHints({ knee: 148, sure: true })[0].kind).toBe('ok');
    const cmp = fitHints({ knee: 150, back: 45, sure: true }, { knee: 156, back: 40 });
    expect(cmp.map((h) => h.d).filter(Boolean)).toEqual(['−6', '+5']);
    const all = [...fitHints({ knee: 170, back: 40, sure: false }, { knee: 160, back: 30 }), ...fitHints({ knee: 120 }), ...fitHints({ knee: 148 })];
    for (const h of all) expect(DE[h.key], h.key).toBeTruthy();
    expect(fitHints(null)).toEqual([]);
  });
  it('kept with the bike: newest first, delete one', () => {
    const bike = { id: 'b1', sitPos: [{ id: 'old', date: '2026-09-01', knee: 156 }] };
    const ch = addSitPos(bike, { source: 'photo', knee: 150, back: 42, seatHeight: 738, note: '', kneeTop: null }, { date: '2026-10-19', id: 'new' });
    expect(ch.sitPos[0]).toEqual({ id: 'new', date: '2026-10-19', source: 'photo', knee: 150, back: 42, seatHeight: 738 });
    expect(sitPosOf({ ...bike, ...ch }).map((r) => r.id)).toEqual(['new', 'old']);
    expect(removeSitPos({ ...bike, ...ch }, 'old').sitPos.map((r) => r.id)).toEqual(['new']);
    expect(sitPosOf({})).toEqual([]);
  });
});

describe('in the app', () => {
  it('two tools, functions with how-to, handbook and version, choices kept', () => {
    for (const key of ['packphoto', 'sitpos']) expect(TOOLS.some((x) => x.key === key), key).toBe(true);
    for (const id of ['f.packphoto', 'f.sitpos']) {
      const f = FEATURES.find((x) => x.id === id);
      expect(f, id).toBeTruthy();
      expect(DE[f.title] && DE[f.text], id).toBeTruthy();
      expect(HOWTO[id].length).toBe(3);
      expect(HANDBOOK[id].steps.length).toBe(3);
      expect(SINCE[id]).toBeTruthy();
      for (const s of [...HOWTO[id], ...HANDBOOK[id].steps, HANDBOOK[id].example, HANDBOOK[id].on]) expect(DE[s], s).toBeTruthy();
    }
    expect(prefsOf(null)).toEqual({ engine: 'device', mode: 'tick', video: false });
    expect(prefsOf({ engine: 'helper', mode: 'new', video: true })).toEqual({ engine: 'helper', mode: 'new', video: true });
  });
  it('the recognition loads from the CDN and model storage, one fixed version', () => {
    expect(MP_URL).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/npm\/@mediapipe\/tasks-vision@\d+\.\d+\.\d+\/vision_bundle\.mjs$/);
    expect(MP_WASM).toMatch(/@\d+\.\d+\.\d+\/wasm$/);
    for (const u of Object.values(MODEL_URLS)) expect(u).toMatch(/^https:\/\/storage\.googleapis\.com\/mediapipe-models\//);
  });
});
