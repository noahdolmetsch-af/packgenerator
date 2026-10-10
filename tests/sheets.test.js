import { describe, it, expect, afterEach } from 'vitest';
import {
  SHEETS, SHEET_KEYS, PASS, PLAN_PARTS, PICKUP_SAFE, PICKUP_VALUES, sheetsOf, shownSheets, bikePass, servicePlan, intervalText, orderPicked,
  keepValues, orderSheetText, startPickup, pickupCheck, tickPickup, pickupEntries, folderState, sheetText, sheetData, isSheetKey,
} from '../src/lib/sheets.js';
import { PART, CHECK_PARTS, fits } from '../src/lib/care.js';
import { FIT_KEY } from '../src/lib/bikespecs.js';
import { partStart } from '../src/lib/kmbook.js';
import { parseBikesHash, bikesHash } from '../src/lib/bikes.js';
import { lang } from '../src/lib/i18n.svelte.js';
import DE from '../src/lib/i18n/de/index.js';

// v0.69.0 «Velo-Blätter»: the folder of sheets per bike. Fictional bikes only (test_data_gtp_).
afterEach(() => (lang.v = 'en'));
const TODAY = '2026-10-10';
const e = (date, km, over = {}) => ({ date, km, value: null, action: 'service', result: 'done', by: 'self', model: null, note: '', ...over });
const trail = (over = {}) => ({
  id: 'test_data_gtp_trail',
  name: 'Demo Trail',
  type: 'full',
  km: 3100,
  fit: { seatHeight: 745, pressureF: 1.45, pressureR: 1.55, forkPressure: 72, shockPressure: 165, frameSize: 'M' },
  parts: [
    { key: 'chain', model: 'Demo Kette 12', history: [e('2026-09-05', 1300, { action: 'replace' }), e('2026-10-01', 3050, { action: 'check', result: 'ok', value: 0.3 })] },
    { key: 'fork', model: '', attrs: { travel: 140 }, history: [e('2025-05-02', 1100)] },
    { key: 'tyres', model: 'Demo Pneu 29 × 2.4', history: [e('2026-09-10', 2900)] },
    { key: 'padsF', model: '', history: [e('2026-10-01', 3050, { action: 'check', result: 'ok', value: 45 })] },
  ],
  ...over,
});
const tyres = { front: 'tubeless', rear: 'tubeless' };

describe('the folder', () => {
  it('has four sheets first (V2 a), each with a German name; the address keeps the sheet', () => {
    expect(SHEET_KEYS).toEqual(['pass', 'plan', 'order', 'pickup']);
    for (const s of SHEETS) {
      expect(DE[s.name], s.name).toBeTruthy();
      expect(DE[s.sub], s.sub).toBeTruthy();
    }
    for (const k of [...SHEET_KEYS, 'all']) {
      expect(isSheetKey(k)).toBe(true);
      const h = bikesHash({ tab: 'setup', bike: 'test_data_gtp_trail', sheet: k, from: 'care' });
      expect(parseBikesHash(h)).toMatchObject({ tab: 'setup', bike: 'test_data_gtp_trail', sheet: k, from: 'care' });
    }
    expect(parseBikesHash('#/bikes?bike=x&sheet=nonsense').sheet).toBeUndefined();
    expect(bikesHash({ tab: 'care', bike: 'x', sheet: 'pass' })).toBe('#/bikes?tab=care&bike=x');
  });

  it('a hidden sheet leaves the folder; nothing is hidden at first', () => {
    expect(shownSheets(trail()).map((s) => s.key)).toEqual(SHEET_KEYS);
    expect(shownSheets(trail({ sheets: { hidden: ['plan'] } })).map((s) => s.key)).toEqual(['pass', 'order', 'pickup']);
    expect(sheetsOf({})).toEqual({ hidden: [], orderOff: [], wishes: '', pickup: null });
  });
});

describe('the Bike pass (V5 a: values from the data, missing ones to enter)', () => {
  it('takes fit values, part values and the tubeless setting; an empty value links to where it is edited', () => {
    const p = bikePass(trail(), { tyres });
    const row = (id) => p.sections.flatMap((s) => s.rows).find((r) => r.id === id);
    expect(row('fit:forkPressure').value).toBe('72 psi');
    expect(row('fit:seatHeight').value).toBe('745 mm');
    expect(row('fit:pressureF').value).toBe('1.45 bar');
    expect(row('fork:attrs.travel').value).toBe('140 mm');
    expect(row('tyres:model').value).toBe('Demo Pneu 29 × 2.4');
    expect(row('tubeless').value).toBe('yes');
    expect(row('fit:barWidth')).toMatchObject({ value: null, edit: '#/bikes?bike=test_data_gtp_trail' });
    expect(row('rotorF:attrs.dia')).toMatchObject({ value: null, edit: '#/bikes?tab=compare' });
    expect(p.filled).toBeLessThan(p.total);
    // every label of the pass has a German entry (read from the source list)
    for (const s of PASS) {
      expect(DE[s.name], s.name).toBeTruthy();
      for (const r of s.rows) expect(DE[r.fit ? FIT_KEY[r.fit].name : r.label], JSON.stringify(r)).toBeTruthy();
    }
  });

  it('a bike without suspension has no suspension section', () => {
    const p = bikePass({ id: 'test_data_gtp_renn', name: 'Demo Rennvelo', type: 'Road bike', parts: [] }, { tyres: { front: 'tube', rear: 'tube' } });
    expect(p.sections.map((s) => s.key)).not.toContain('susp');
    expect(p.sections.flatMap((s) => s.rows).find((r) => r.id === 'tubeless').value).toBe('no, with tubes');
  });
});

describe('the Service plan', () => {
  it('lists every part with a rule, its interval, the last work, the km since and the state', () => {
    const b = trail();
    const plan = servicePlan(b, { time: [{ key: 'fork', every: 365, days: -160, next: '2026-05-02', never: false }], today: TODAY });
    const chain = plan.rows.find((r) => r.key === 'chain');
    expect(chain.interval).toBe('every 150 km · replace at 0.5 %');
    expect(chain.last).toBe('5 Sept 2026 · 1,300 km'); // the last replacement, not the check after it
    expect(chain.since).toBe('1,800 km');
    const fork = plan.rows.find((r) => r.key === 'fork');
    expect(fork.interval).toBe('yearly');
    expect(fork.state).toBe('overdue');
    expect(plan.rows.find((r) => r.key === 'padsF').state).toBe('due'); // 45 % is below the 50 % limit
    expect(plan.due).toBeGreaterThanOrEqual(2);
    // the plan reads its parts from care.js (one list): every part with a rule that fits the bike
    expect(PLAN_PARTS.every((k) => PART[k].everyKm || PART[k].everyDays || PART[k].limit != null)).toBe(true);
    expect(plan.rows.map((r) => r.key).every((k) => PLAN_PARTS.includes(k) && fits(b, PART[k]))).toBe(true);
    expect(intervalText('padsF')).toBe('replace below 50 %');
  });
});

describe('the Workshop order', () => {
  const order = { rows: [{ key: 'fork:now', name: 'Fork service', de: 'Gabel-Service', detail: 'overdue', chf: 180, part: 'fork', action: 'service' }, { key: 'chain:now', name: 'Chain: replace or fix', de: 'Kette prüfen, wenn nötig ersetzen', detail: 'worn', chf: null, part: 'chain', action: 'replace' }], shop: '' };

  it('a job taken off stays off; the text for the shop has km, wishes and the values to keep', () => {
    const b = trail({ sheets: { orderOff: ['chain:now'], wishes: 'Bitte anrufen' } });
    const picked = orderPicked(order, b);
    expect(picked.map((r) => r.key)).toEqual(['fork:now']);
    const text = orderSheetText(picked, { bike: b, wishes: b.sheets.wishes, keep: keepValues(b) });
    expect(text).toContain('- Gabel-Service');
    expect(text).not.toContain('Kette');
    expect(text).toContain('Kilometerstand: 3’100 km');
    expect(text).toContain('Wünsche: Bitte anrufen');
    expect(text).toContain('Gabeldruck 72 psi');
    expect(text.indexOf('Wünsche')).toBeGreaterThan(text.indexOf('- Gabel-Service'));
    expect(text.trim().endsWith('Freundliche Grüsse')).toBe(true);
  });
});

describe('the Pick-up check (V4 a)', () => {
  const jobs = [
    { key: 'fork:now', name: 'Fork service', detail: '', part: 'fork', action: 'service' },
    { key: 'chain:now', name: 'Chain', detail: '', part: 'chain', action: 'replace' },
    { key: 'check:now', name: '1,000 km check', detail: '', part: 'check', action: 'check' },
    { key: 'repair:7', name: 'Creak', detail: '', part: null, action: 'repair', taskId: 7 },
  ];

  it('three sections: the jobs, the values as before, safe and complete; ticks are counted', () => {
    const b = trail();
    const c = pickupCheck(b, jobs, { today: TODAY });
    expect(c.sections.map((s) => s.key)).toEqual(['jobs', 'values', 'safe']);
    expect(c.sections[0].rows).toHaveLength(4);
    expect(c.sections[1].rows.map((r) => r.id)).toEqual(PICKUP_VALUES.map((k) => `val:${k}`));
    expect(c.sections[2].rows).toHaveLength(PICKUP_SAFE.length);
    expect(c.ticked).toBe(0);
    const p = tickPickup(tickPickup(c.pickup, 'job:fork:now', true), 'safe:brakes', true);
    const c2 = pickupCheck(trail({ sheets: { pickup: p } }), [], { today: TODAY });
    expect(c2.ticked).toBe(2);
    expect(c2.sections[0].rows).toHaveLength(4); // the stored jobs stay when the order is empty
    expect(folderState({ pickup: c2 }).pickup.text).toBe(`2 of ${c2.total} ticked`);
    for (const s of PICKUP_SAFE) expect(DE[s.label] && DE[s.hint], s.key).toBeTruthy();
  });

  it('the ticked jobs become care entries by the bike shop; a replaced part gets its start point; a repair is a task to close', () => {
    const b = trail();
    let p = startPickup(jobs, TODAY);
    for (const id of ['job:fork:now', 'job:chain:now', 'job:check:now', 'job:repair:7']) p = tickPickup(p, id, true);
    const out = pickupEntries(b, p, { today: TODAY, km: 3100, note: 'Pick-up check' });
    const part = (k) => out.parts.find((x) => x.key === k);
    expect(part('fork').history.at(-1)).toMatchObject({ date: TODAY, km: 3100, action: 'service', result: 'done', by: 'shop' });
    expect(partStart(part('chain'))).toMatchObject({ date: TODAY, km: 3100 });
    expect(out.replaced).toEqual(['chain']);
    expect(out.taskIds).toEqual([7]);
    // the 1000 km check counts for its check points, but not again for the parts worked on
    expect(CHECK_PARTS.filter((k) => out.parts.some((x) => x.key === k && x.history.at(-1)?.date === TODAY && x.history.at(-1).action === 'check'))).not.toContain('fork');
    expect(part('bolts').history.at(-1)).toMatchObject({ action: 'check', result: 'ok', by: 'shop' });
    // an unticked job is not recorded
    const none = pickupEntries(b, tickPickup(startPickup(jobs, TODAY), 'job:chain:now', true), { today: TODAY, km: 3100 });
    expect(none.parts.find((x) => x.key === 'fork').history).toHaveLength(1);
    expect(none.logged).toEqual(['chain']);
  });
});

describe('text and state', () => {
  it('a sheet as text: title, facts, sections, ticks', () => {
    const text = sheetText({ title: 'Pick-up check', facts: ['3,100 km'], sections: [{ name: 'Safe', rows: [{ id: 'a', label: 'Brakes', value: '' }, { id: 'b', label: 'Bar width', value: null }] }], ticks: { a: true } });
    expect(text.split('\n')).toEqual(['Pick-up check', '3,100 km', '', 'SAFE', '[x] Brakes', '[ ] Bar width: –']);
  });

  it('all four sheets of a bike from the tables, in German too', () => {
    lang.v = 'de';
    const d = sheetData(trail(), { visits: [], tasks: [], trips: [], today: TODAY });
    expect(Object.keys(d)).toEqual(expect.arrayContaining(['pass', 'plan', 'order', 'picked', 'pickup']));
    const st = folderState({ pass: d.pass, plan: d.plan, order: d.picked, pickup: d.pickup });
    expect(st.pickup.text).toBe('noch nicht begonnen');
    expect(st.pass.text).toMatch(/von \d+ Werten/);
  });
});
