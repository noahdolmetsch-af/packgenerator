import { describe, it, expect, afterEach } from 'vitest';
import { SHEETS, shownSheets, isShown, chooseSheet, breakinAuto, firstServiceDone, NEW_KM } from '../src/lib/sheets.js';
import {
  BREAKIN, BREAKIN_MARKS, KIT, KIT_ROW, RIDE_TYPES, WARRANTY_PARTS, THEFT_FIELDS, THEFT_PHOTOS, THEFT_STEPS, addYears, addDays, breakIn, tickBreakin, breakinEntries,
  kitMatch, kitType, repairKit, tickKit, kitItem, kitToTrip, warranty, warrantyIcs, theftSheet, moreState, sheetReminders, laterChanges, breakinText, kitText,
  warrantyText, theftText, inText, LATER_DAYS,
} from '../src/lib/sheets2.js';
import { lang } from '../src/lib/i18n.svelte.js';
import DE from '../src/lib/i18n/de/index.js';

// v0.70.0 «Velo-Blätter Teil 2» (Noah W1–W7 a). Fictional bikes and items only (test_data_gtp_).
afterEach(() => (lang.v = 'en'));
const TODAY = '2026-10-10';
const BOUGHT = '2026-10-03';
const xc = (over = {}) => ({
  id: 'test_data_gtp_xc',
  name: 'Demo XC',
  type: 'full',
  km: 64,
  bought: BOUGHT,
  weightG: 11900,
  fit: { forkPressure: 85, shockPressure: 190, pressureF: 1.6, pressureR: 1.7, frameSize: 'M', forkSag: 15, shockSag: 25 },
  parts: [
    { key: 'wheelF', model: '', attrs: { size: '29' }, history: [] },
    { key: 'tyres', model: 'Demo Pneu', attrs: { widthF: '2.4' }, history: [] },
    { key: 'cassette', model: '', attrs: { cogs: '12' }, history: [] },
    { key: 'frame', model: 'Demo XC UDH', history: [] },
    { key: 'brakeF', model: '', attrs: { pistons: '2' }, history: [] },
  ],
  ...over,
});
const old = (over = {}) => ({ id: 'test_data_gtp_old', name: 'Demo Trail', type: 'full', km: 3100, parts: [], ...over });
const tubeless = { front: 'tubeless', rear: 'tubeless' };
const P = 'test_data_gtp_';
const item = (id, name, over = {}) => ({ id, name: `${P}${name}`, category: 'tools', weightG: 100, qty: 1, ownership: 'owned', defaultBag: 'tool', ...over });

describe('the folder has eight sheets (W1 a: the Break-in plan comes by itself)', () => {
  it('every new sheet has a German name and line, and is marked as new in 0.70.0', () => {
    for (const s of SHEETS.filter((x) => x.since)) {
      expect(DE[s.name], s.name).toBeTruthy();
      expect(DE[s.sub], s.sub).toBeTruthy();
      expect(s.since).toBe('0.70.0');
    }
    expect(SHEETS.filter((x) => x.since).map((s) => s.key)).toEqual(['breakin', 'kit', 'warranty', 'theft']);
  });

  it('a new bike (under 500 km) shows the Break-in plan first; an old one does not; without km the purchase date counts', () => {
    expect(shownSheets(xc(), { today: TODAY })[0].key).toBe('breakin');
    expect(shownSheets(xc(), { today: TODAY })).toHaveLength(8);
    expect(isShown(old(), 'breakin', { today: TODAY })).toBe(false);
    expect(breakinAuto(xc({ km: NEW_KM }), { today: TODAY })).toBe(false);
    expect(breakinAuto(xc({ km: null }), { today: TODAY })).toBe(true);
    expect(breakinAuto(xc({ km: null, bought: '2025-01-01' }), { today: TODAY })).toBe(false);
    expect(breakinAuto(xc({ km: null, bought: undefined }), { today: TODAY })).toBe(false);
    // once a step is ticked it stays over 500 km until the first service
    expect(breakinAuto(xc({ km: 620, sheets: { breakin: { ticks: { 's1:bolts': { date: BOUGHT, km: 18 } } } } }), { today: TODAY })).toBe(true);
  });

  it('it goes after the first service: the inspection ticked, or a workshop visit two weeks after the purchase', () => {
    expect(firstServiceDone(xc({ sheets: { breakin: { ticks: { 's4:inspect': { date: TODAY, km: 320 } } } } }))).toBe(true);
    expect(firstServiceDone(xc(), [{ id: 'v', bikeId: 'test_data_gtp_xc', date: BOUGHT }])).toBe(false); // the receipt of the purchase
    expect(firstServiceDone(xc(), [{ id: 'v', bikeId: 'test_data_gtp_xc', date: '2027-01-05' }])).toBe(true);
    expect(isShown(xc(), 'breakin', { today: TODAY, visits: [{ id: 'v', bikeId: 'test_data_gtp_xc', date: '2026-12-01' }] })).toBe(false);
  });

  it('«Choose sheets» covers all eight: a sheet off is hidden; the Break-in plan on an old bike can be switched on', () => {
    const off = chooseSheet(xc(), 'theft', false, { today: TODAY });
    expect(off).toEqual({ hidden: ['theft'], shown: [] });
    expect(shownSheets(xc({ sheets: off }), { today: TODAY }).map((s) => s.key)).not.toContain('theft');
    const on = chooseSheet(old(), 'breakin', true, { today: TODAY });
    expect(on).toEqual({ hidden: [], shown: ['breakin'] });
    expect(isShown(old({ sheets: on }), 'breakin', { today: TODAY })).toBe(true);
    expect(chooseSheet(old({ sheets: on }), 'breakin', false, { today: TODAY })).toEqual({ hidden: ['breakin'], shown: [] });
  });
});

describe('the Break-in plan (W1 a, W2 a, W3 a)', () => {
  it('four steps with German names; the marks of the km bar end at the first service', () => {
    expect(BREAKIN.map((s) => s.key)).toEqual(['s1', 's2', 's3', 's4']);
    for (const s of BREAKIN) {
      expect(DE[s.name], s.name).toBeTruthy();
      for (const r of s.rows) expect(DE[r.label], r.label).toBeTruthy();
    }
    expect(BREAKIN_MARKS.at(-1).km).toBe(NEW_KM);
  });

  it('a step is due by km or by date, whichever comes first; the values come from the bike', () => {
    const p = breakIn(xc(), { tyres: tubeless, today: TODAY });
    expect(p.steps.map((s) => s.state)).toEqual(['due', 'due', 'later', 'later']);
    expect(p.due.key).toBe('s1');
    const row = (id) => p.steps.flatMap((s) => s.rows).find((r) => r.id === id);
    expect(row('s1:sag').value).toBe('85 / 190 psi');
    expect(row('s1:sag').hint).toBe('Fork 15 % · Shock 25 %');
    expect(row('s2:tl').value).toBe('1.6 / 1.7 bar');
    expect(row('s3:pivots')).toBeTruthy(); // full suspension
    expect(row('s4:inspect').link.label).toBe('Workshop order');
    expect(p.steps[2].badge.text).toBe('in about 40 km');
    expect(p.steps[3].badge.text).toMatch(/^300–500 km or by /);
    // by date: 30 days after the purchase step 3 is due even at 64 km
    expect(breakIn(xc(), { today: addDays(BOUGHT, 30) }).steps[2].due).toBe(true);
    // on a gravel bike with tubes: no sag, no tubeless, no pivots
    const g = breakIn(xc({ type: 'Gravel bike' }), { tyres: { front: 'tube', rear: 'tube' }, today: TODAY });
    expect(g.steps.flatMap((s) => s.rows).map((r) => r.key)).not.toEqual(expect.arrayContaining(['sag']));
    expect(g.steps.flatMap((s) => s.rows).some((r) => ['sag', 'tl', 'pivots', 'sealant', 'pass'].includes(r.key))).toBe(false);
  });

  it('a tick keeps its day and km; a step with every tick is done; taking it off undoes it', () => {
    let b = {};
    for (const k of ['bolts', 'sag', 'brakes', 'shift']) b = tickBreakin(b, `s1:${k}`, true, { today: '2026-10-04', km: 18 });
    expect(b.ticks['s1:bolts']).toEqual({ date: '2026-10-04', km: 18 });
    const p = breakIn(xc({ sheets: { breakin: b } }), { today: TODAY });
    expect(p.steps[0].state).toBe('done');
    expect(p.steps[0].badge.text).toBe('done 4 Oct');
    expect(p.due.key).toBe('s2');
    expect(tickBreakin(b, 's1:bolts', false, { today: TODAY }).ticks['s1:bolts']).toBeUndefined();
  });

  it('W2 a: the ticked rows become care entries «by me» with the day and km of the tick, once; the inspection by the bike shop', () => {
    let b = tickBreakin({}, 's1:brakes', true, { today: '2026-10-04', km: 18 });
    b = tickBreakin(b, 's2:pads', true, { today: TODAY, km: 64 });
    b = tickBreakin(b, 's4:inspect', true, { today: TODAY, km: 64 });
    const bike = xc({ sheets: { breakin: b } });
    const out = breakinEntries(bike, b, { today: TODAY });
    expect(out.rows).toEqual(['s1:brakes', 's2:pads', 's4:inspect']);
    const last = (k) => out.parts.find((p) => p.key === k).history.at(-1);
    expect(last('brakeF')).toMatchObject({ date: '2026-10-04', km: 18, action: 'check', result: 'ok', by: 'self' });
    // the pads: a service by me; the inspection afterwards checks them as one of the check points
    expect(out.parts.find((p) => p.key === 'padsR').history.find((h) => h.action === 'service')).toMatchObject({ date: TODAY, km: 64, result: 'done', by: 'self' });
    expect(last('bearings')).toMatchObject({ action: 'check', by: 'shop' });
    expect(out.breakin.applied).toEqual({ 's1:brakes': TODAY, 's2:pads': TODAY, 's4:inspect': TODAY });
    // a second time nothing is written again
    expect(breakinEntries({ ...bike, parts: out.parts }, out.breakin, { today: TODAY }).rows).toEqual([]);
  });

  it('the text names each step with its state and the ticks', () => {
    lang.v = 'de';
    const text = breakinText(xc(), breakIn(xc(), { tyres: tubeless, today: TODAY }), { today: TODAY });
    expect(text).toContain('Einfahr-Plan');
    expect(text).toContain('1 · NACH DER ERSTEN AUSFAHRT (JETZT FÄLLIG)');
    expect(text).toContain('[ ] Sag vorne und hinten messen: 85 / 190 psi');
  });
});

describe('the Repair kit (W4 a, W5 a)', () => {
  const items = [
    item('WZ01', 'Ersatzschlauch 29'),
    item('WZ02', 'Tubeless-Würste', { weightG: 25 }),
    item('WZ03', 'Kettenschloss 12-fach', { weightG: 5 }),
    item('WZ04', 'Multitool', { weightG: 150 }),
    item('WZ05', 'Minipumpe', { weightG: 95 }),
    item('WZ06', 'Dämpferpumpe', { weightG: 180 }),
    item('WZ07', 'Kabelbinder', { weightG: 10 }),
    item('WZ08', 'Panzertape', { weightG: 20 }),
    item('WZ09', 'Faltschloss', { weightG: 120 }),
    item('WZ10', 'Reifenheber', { ownership: 'gone' }),
    item('WZ11', 'Ersatz-Schaltauge', { ownership: 'to-buy' }),
  ];

  it('three kinds of ride; every row has a German label; the words find the items', () => {
    expect(RIDE_TYPES.map((r) => r.key)).toEqual(['evening', 'day', 'multi']);
    for (const s of KIT) {
      expect(DE[s.name], s.name).toBeTruthy();
      for (const r of s.rows) expect(DE[r.label], r.label).toBeTruthy();
    }
    expect(kitMatch(KIT_ROW.tube, items).own.map((i) => i.id)).toEqual(['WZ01']);
    expect(kitMatch(KIT_ROW.pump, items).own.map((i) => i.id)).toEqual(['WZ05']); // not the shock pump
    expect(kitMatch(KIT_ROW.lock, items).own.map((i) => i.id)).toEqual(['WZ09']); // not the chain link
    expect(kitMatch(KIT_ROW.ties, items).own.map((i) => i.id)).toEqual(['WZ07', 'WZ08']);
    expect(kitMatch(KIT_ROW.levers, items).own).toEqual([]); // archived
    expect(kitMatch(KIT_ROW.hanger, items).wish.id).toBe('WZ11');
  });

  it('sizes come from the bike: tube 29 × 2.4, 12-speed, UDH; rows per kind of ride; missing and packed', () => {
    const k = repairKit(xc({ sheets: { kit: { ticks: { day: { tube: true, link: true, levers: true } } } } }), { items, tyres: tubeless, type: 'day' });
    const row = (key) => k.rows.find((r) => r.key === key);
    expect(row('tube').label).toBe('Spare tube 29 × 2.4');
    expect(row('link').label).toBe('Chain quick link (12-speed)');
    expect(row('hanger').label).toBe('Spare derailleur hanger (UDH)');
    expect(row('pads').label).toBe('Spare brake pads (for 2-piston)');
    expect(row('pump').hint).toBe('the shock pump stays at home');
    expect(row('levers')).toMatchObject({ missing: true, packed: false }); // a tick without an item does not count
    expect(row('hanger').wish).toContain('Ersatz-Schaltauge');
    expect(row('shockpump')).toBeUndefined(); // only multi-day
    expect(k.packed).toBe(2);
    expect(k.g).toBe(105);
    const evening = repairKit(xc(), { items, tyres: tubeless, type: 'evening' });
    expect(evening.rows.map((r) => r.key)).toEqual(['tube', 'plugs', 'link', 'multitool', 'pump', 'levers', 'card']);
    expect(repairKit(xc(), { items, tyres: tubeless, type: 'multi' }).rows.some((r) => r.key === 'shockpump')).toBe(true);
  });

  it('the kind of ride: the stored one, else from the next trip', () => {
    expect(kitType(xc(), null)).toBe('day');
    expect(kitType(xc(), { days: 3 })).toBe('multi');
    expect(kitType(xc({ sheets: { kit: { type: 'evening' } } }), { days: 3 })).toBe('evening');
    expect(tickKit({}, 'day', 'tube', true)).toEqual({ ticks: { day: { tube: true } } });
  });

  it('«add» makes an owned item to weigh; W5 a puts the chosen items on the next trip in their place', () => {
    lang.v = 'de';
    const it2 = kitItem('levers', xc(), items, { de: true, now: '2026-10-10T10:00:00.000Z' });
    expect(it2).toMatchObject({ id: 'WZ12', name: 'Tyre levers (2)', nameDe: 'Reifenheber (2)', category: 'tools', ownership: 'owned', weightG: null, sets: ['repair'] });
    const trip = { id: 't', setup: { tool: 'bag-x' }, entries: [{ itemId: 'WZ01', slot: 'tool', qty: 1, packed: true }] };
    const k = repairKit(xc(), { items, tyres: tubeless, type: 'day', trip });
    expect(k.toTrip.map((i) => i.id)).not.toContain('WZ01');
    expect(k.rows.find((r) => r.key === 'tube').onTrip).toBe(true);
    const out = kitToTrip(trip, ['WZ04', 'WZ05', 'WZ01'], items);
    expect(out.added).toEqual(['WZ04', 'WZ05']);
    expect(out.entries.at(-1)).toEqual({ itemId: 'WZ05', slot: 'tool', qty: 1, packed: false });
  });

  it('the text lists the rows with their ticks and weights', () => {
    lang.v = 'de';
    const k = repairKit(xc({ sheets: { kit: { ticks: { day: { multitool: true } } } } }), { items, tyres: tubeless, type: 'day' });
    const text = kitText(xc(), k);
    expect(text).toContain('Repair-Kit');
    expect(text).toContain('[x] Multitool: 150 g');
    expect(text).toContain('[ ] Reifenheber (2): fehlt im Material');
  });
});

describe('Warranty & receipts (W6 a)', () => {
  const visits = [
    { id: 'v1', bikeId: 'test_data_gtp_xc', date: BOUGHT, shop: 'Demo Velo Nord', totalChf: 4290, parts: [{ part: 'frame', action: 'replace', what: 'Kaufbeleg Demo XC' }], photos: ['data:x'] },
    { id: 'v2', bikeId: 'test_data_gtp_xc', date: '2025-03-12', shop: 'Demo Shop', totalChf: 89, parts: [{ part: 'grips', action: 'replace' }] },
  ];

  it('per part from the purchase date (a suggestion; 2 years by law), with the end and a bar; replaced parts from the visits', () => {
    for (const p of WARRANTY_PARTS) expect(DE[p.name], p.name).toBeTruthy();
    const w = warranty(xc({ sheets: { warranty: { years: { fork: 3 } } } }), { visits, today: TODAY });
    expect(w.rows.map((r) => [r.key, r.years, r.end])).toEqual([
      ['frame', 5, '2031-10-03'],
      ['fork', 3, '2029-10-03'],
      ['shock', 2, '2028-10-03'],
      ['wheels', 2, '2028-10-03'],
      ['rest', 2, '2028-10-03'],
    ]);
    expect(w.rows.at(-1).yearsText).toBe('2 years (law)');
    expect(w.rows[0].fill).toBeGreaterThan(0.99);
    expect(w.longest.key).toBe('frame');
    expect(w.receipts.map((r) => r.id)).toEqual(['v1', 'v2']);
    expect(w.receipts[0]).toMatchObject({ label: 'Kaufbeleg Demo XC', chf: 4290, photo: true });
    expect(w.withPhoto).toBe(1);
    expect(w.replaced).toEqual([]); // the purchase itself and a part replaced before it do not count
    expect(warranty(xc({ bought: null }), { visits, today: TODAY }).rows).toEqual([]);
    expect(addYears('2024-02-29', 1)).toBe('2025-02-28');
  });

  it('a part replaced later has 2 years from the visit; 30 days before an end Today reminds (W6 a), «later» waits a week', () => {
    const v3 = { id: 'v3', bikeId: 'test_data_gtp_xc', date: '2025-03-12', shop: 'Demo Shop', totalChf: 89, parts: [{ part: 'grips', action: 'replace' }] };
    const bike = xc({ bought: '2024-01-01', km: 2000 });
    const w = warranty(bike, { visits: [v3], today: '2027-02-20' });
    expect(w.replaced.map((r) => r.end)).toEqual(['2027-03-12']);
    expect(w.soon.map((r) => r.key)).toEqual(['v:v3:grips']);
    expect(inText(20)).toBe('in 20 days');
    expect(inText(150)).toBe('in 5 months');
    const rem = sheetReminders([bike], { visits: [v3], today: '2027-02-20' });
    expect(rem).toHaveLength(1);
    expect(rem[0].text).toContain('ends on 12 Mar 2027');
    const later = { ...bike, sheets: laterChanges(bike, rem[0].key, '2027-02-20') };
    expect(sheetReminders([later], { visits: [v3], today: '2027-02-20' })).toEqual([]);
    expect(sheetReminders([later], { visits: [v3], today: addDays('2027-02-20', LATER_DAYS) })).toHaveLength(1);
    const off = { ...bike, sheets: { warranty: { remind: false } } };
    expect(sheetReminders([off], { visits: [v3], today: '2027-02-20' })).toEqual([]);
  });

  it('the calendar file has one all-day date 30 days before each end', () => {
    const w = warranty(xc(), { visits: [], today: TODAY });
    const ics = warrantyIcs(xc(), w.rows, { stamp: '20261010T100000Z' });
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(5);
    expect(ics).toContain('DTSTART;VALUE=DATE:20310903');
    expect(ics.trim().endsWith('END:VCALENDAR')).toBe(true);
  });

  it('the text: purchase, warranty per part, receipts', () => {
    lang.v = 'de';
    const bike = xc({ sheets: { warranty: { shop: 'Demo Velo Nord', price: 4290 } } });
    const text = warrantyText(bike, warranty(bike, { visits, today: TODAY }), { today: TODAY });
    expect(text).toContain('gekauft am 3. Okt. 2026 · bei Demo Velo Nord');
    expect(text).toContain(`Kaufpreis CHF ${(4290).toLocaleString('de-CH')}`);
    expect(text).toContain('Rahmen: 3. Okt. 2031 (5 Jahre)');
  });
});

describe('the Theft sheet (W7 a)', () => {
  it('values from the bike and typed on the sheet; four photo tiles (the main photo is the side view); what to do', () => {
    for (const f of THEFT_FIELDS) expect(DE[f.label], f.label).toBeTruthy();
    for (const p of THEFT_PHOTOS) expect(DE[p.label], p.label).toBeTruthy();
    for (const s of THEFT_STEPS) expect(DE[s.title] && DE[s.text], s.key).toBeTruthy();
    const bike = xc({ sheets: { theft: { frameNo: 'DEMO 0000 XC', colour: 'mattgrün', sum: 5000 } } });
    const photos = [{ id: 'ph1', bikeId: bike.id, data: 'data:frame', theft: 'frame' }];
    const s = theftSheet(bike, { photos, gallery: [{ id: 'g', src: 'data:main', main: true }] });
    const row = (id) => [...s.id, ...s.marks, ...s.insurance].find((r) => r.id === id);
    expect(row('frameNo').value).toBe('DEMO 0000 XC');
    expect(row('model').value).toBe('Demo XC · Full suspension');
    expect(row('size').value).toBe('M · 29 inch');
    expect(row('weight').value).toBe('11.9 kg measured');
    expect(row('sum').value).toBe(`CHF ${(5000).toLocaleString('en')}`);
    expect(row('policy')).toMatchObject({ value: null, field: 'policy' });
    expect(row('price').edit).toContain('sheet=warranty');
    expect(s.photos.map((p) => !!p.src)).toEqual([true, true, false, false]);
    expect(s.photosMissing).toBe(2);
    expect(moreState({ theft: s }).theft).toEqual({ text: '2 photos missing', tone: 'warn' });
    expect(moreState({ theft: theftSheet(xc()) }).theft.text).toBe('frame number missing');
  });

  it('W7 a: the frame number is in the copied text, with the steps', () => {
    lang.v = 'de';
    const bike = xc({ sheets: { theft: { frameNo: 'DEMO 0000 XC' } } });
    const text = theftText(bike, theftSheet(bike), { today: TODAY });
    expect(text).toContain('Rahmennummer: DEMO 0000 XC');
    expect(text).toContain('Policen-Nummer: –');
    expect(text).toContain('1. Polizei: Anzeige machen');
  });
});

describe('the folder lines and the reminders of the Break-in plan (W3 a)', () => {
  it('states: step due, packed, warranty, theft', () => {
    lang.v = 'de';
    const st = moreState({
      breakin: breakIn(xc(), { today: TODAY }),
      kit: repairKit(xc(), { items: [], type: 'day' }),
      warranty: warranty(xc(), { today: TODAY }),
    });
    expect(st.breakin).toEqual({ text: 'Schritt 1 fällig', tone: 'warn' });
    expect(st.kit.tone).toBe('warn');
    expect(st.warranty).toEqual({ text: 'Rahmen bis 2031', tone: 'ok' });
    expect(moreState({ warranty: warranty(xc({ bought: null }), { today: TODAY }) }).warranty.text).toBe('Kaufdatum fehlt');
  });

  it('a due step reminds on Today unless the sheet is hidden, the reminder is off or put off', () => {
    const r = sheetReminders([xc(), old()], { today: TODAY });
    expect(r.map((x) => x.key)).toEqual(['breakin:s1']);
    expect(r[0].href).toBe('#/bikes?bike=test_data_gtp_xc&sheet=breakin');
    expect(sheetReminders([xc({ sheets: { hidden: ['breakin'] } })], { today: TODAY })).toEqual([]);
    expect(sheetReminders([xc({ sheets: { breakin: { remind: false } } })], { today: TODAY })).toEqual([]);
    expect(sheetReminders([{ ...xc(), sheets: laterChanges(xc(), 'breakin:s1', TODAY) }], { today: TODAY })).toEqual([]);
  });
});
