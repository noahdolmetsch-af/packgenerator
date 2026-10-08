// v0.31.0 (Velopflege redesign): the last work per part, its state and the year on one bike.
// Fictional data only.
import { describe, it, expect, afterEach } from 'vitest';
import { shopSkip, lastWork, lastWorkByPart, lastLine, usualBy, partStatus, isDueState, yearSummary, groupOf, GROUPS, workWords } from '../src/lib/care/last.js';
import { ensureParts, logPart, PARTS } from '../src/lib/care.js';
import { withVisits, timeDue, workshopOrder } from '../src/lib/workshop.js';
import { lang } from '../src/lib/i18n.svelte.js';

afterEach(() => (lang.v = 'en'));

const e = (date, over = {}) => ({ date, km: null, value: null, action: 'check', result: 'ok', by: 'self', model: null, note: '', ...over });
const bike = (over = {}) => ({ id: 'test_data_gtp_spark', name: 'test_data_gtp_ Spark', type: 'Full suspension', km: 5000, parts: [], ...over });
const part = (key, history) => ({ key, model: '', history });

describe('last work per part', () => {
  it('is null without history, else the last service or replacement', () => {
    expect(lastWork(part('cassette', []))).toBe(null);
    const chain = part('chain', [e('2026-08-01', { action: 'replace', result: 'done', km: 4000, by: 'shop' }), e('2026-09-08', { action: 'service', result: 'done', km: 4700 }), e('2026-09-29', { value: 0.4 })]);
    const last = lastWork(chain);
    expect(last.main.date).toBe('2026-09-08');
    expect(last.by).toBe('self');
    expect(last.also).toMatchObject({ date: '2026-09-29', value: 0.4 });
  });

  it('a newer "work needed" wins; a check alone is the last work too', () => {
    const shifting = part('shifting', [e('2026-06-10', { action: 'replace', result: 'done', by: 'shop' }), e('2026-08-09', { result: 'needed', note: 'skips in 3rd' })]);
    expect(lastWork(shifting).main.result).toBe('needed');
    expect(lastWork(shifting).also).toBe(null);
    expect(lastWork(part('padsF', [e('2026-09-29', { value: 55 })])).main.value).toBe(55);
  });

  it('counts the jobs of a workshop visit, with km, CHF and "bike shop"', () => {
    const b = withVisits(bike({ parts: ensureParts(bike()) }), [{ id: 'v1', bikeId: 'test_data_gtp_spark', date: '2026-03-22', km: 3900, shop: 'test_data_gtp_ shop', parts: [{ part: 'cassette', action: 'replace', chf: 129, model: 'XT' }] }]);
    const last = lastWorkByPart(b);
    expect(last.cassette).toMatchObject({ by: 'shop', main: { date: '2026-03-22', km: 3900, chf: 129, visitId: 'v1' } });
    expect(last.fork).toBe(null);
    expect(lastLine('cassette', last.cassette)).toEqual(['replaced 22 Mar 2026', '3,900 km', 'CHF 129']);
  });

  it('says the work in words, in German too', () => {
    expect(workWords('chain', e('2026-09-08', { action: 'service', result: 'done' }))).toBe('waxed');
    expect(workWords('chain', e('2026-09-29', { value: 0.4 }))).toBe('measured 0.4 %');
    expect(workWords('tyres', e('2026-07-20', { action: 'service', result: 'done', sealantMl: 60 }))).toBe('60 ml sealant added');
    expect(workWords('shifting', e('2026-08-09', { result: 'needed', note: 'skips' }))).toBe('«skips»');
    expect(workWords('wheels', e('2026-06-10', { action: 'replace', result: 'done' }))).toBe('done');
    lang.v = 'de';
    const chain = part('chain', [e('2026-09-08', { action: 'service', result: 'done', km: 4700 }), e('2026-09-29', { value: 0.4 })]);
    expect(lastLine('chain', lastWork(chain))).toEqual(['gewachst 8. Sept. 2026', '4’700 km', 'gemessen 0.4 % am 29. Sept. 2026']);
  });

  it('knows who usually does the work', () => {
    expect(usualBy(part('fork', [e('2025-09-04', { action: 'service', result: 'done', by: 'shop' })]))).toBe('shop');
    expect(usualBy(part('chain', [e('2026-01-01', { action: 'service', result: 'done', by: 'shop' }), e('2026-02-01', { action: 'service', result: 'done' }), e('2026-03-01', { action: 'service', result: 'done' })]))).toBe('self');
    expect(usualBy(part('bolts', []))).toBe('self');
  });

  it('puts every part in one group', () => {
    for (const p of PARTS) expect(GROUPS.some((g) => g.parts.includes(p.key))).toBe(true);
    expect(groupOf('padsR')).toBe('brakes');
    expect(groupOf('something')).toBe('other');
  });
});

describe('state of a part', () => {
  const today = '2026-10-08';
  it('wear: pads below the warning are "soon", below the limit "due" with a red bar', () => {
    const b = bike();
    const soon = partStatus(b, part('padsF', [e('2026-09-29', { value: 55 })]), [], today);
    expect(soon).toMatchObject({ state: 'soon', tone: 'warn', next: 'replace below 50 %' });
    expect(soon.fill).toBeCloseTo(0.9);
    expect(partStatus(b, part('padsF', [e('2026-09-29', { value: 45 })]), [], today)).toMatchObject({ state: 'due', tone: 'bad', fill: 1 });
    expect(partStatus(b, part('rotorF', [e('2026-06-10', { value: 1.9 })]), [], today)).toMatchObject({ state: 'ok', next: 'replace below 1.5 mm' });
  });

  it('km interval: the chain is due for wax after 150 km, the worse of wax and wear counts', () => {
    const chain = part('chain', [e('2026-09-08', { action: 'service', result: 'done', km: 4700 }), e('2026-09-29', { value: 0.3, km: 4950 })]);
    expect(partStatus(bike(), chain, [], today)).toMatchObject({ state: 'due', fill: 1, next: 'Waxed chain: now (every 150 km)' });
    expect(partStatus(bike({ km: 4720 }), chain, [], today)).toMatchObject({ state: 'ok', next: 'replace at 0.5 %' });
    expect(partStatus(bike({ km: 4830 }), chain, [], today)).toMatchObject({ state: 'soon', next: 'in 20 km (every 150 km)' });
  });

  it('time interval: overdue fork, sealant soon, sealant on tubes only said', () => {
    let parts = ensureParts(bike());
    parts = logPart(parts, 'fork', e('2025-09-04', { action: 'service', result: 'done', by: 'shop' }));
    parts = logPart(parts, 'tyres', e('2026-07-20', { action: 'service', result: 'done', sealantMl: 60 }));
    const b = bike({ parts });
    const time = timeDue(b, { front: 'tubeless', rear: 'tubeless' }, today);
    const fork = partStatus(b, parts.find((p) => p.key === 'fork'), time, today);
    expect(fork).toMatchObject({ state: 'overdue', tone: 'bad', fill: 1, next: 'overdue for 5 weeks (yearly)' });
    const tyres = partStatus(b, parts.find((p) => p.key === 'tyres'), time, today);
    expect(tyres).toMatchObject({ state: 'soon', next: '18 Oct 2026 · in 10 days' });
    const tubes = timeDue(b, { front: 'tube', rear: 'tube' }, today);
    expect(partStatus(b, parts.find((p) => p.key === 'tyres'), tubes, today).next).toBe('only for tubeless wheels');
  });

  it('work needed beats everything; no history is "none"; a plain part says its age', () => {
    const shifting = part('shifting', [e('2026-08-09', { result: 'needed', note: 'skips' })]);
    expect(partStatus(bike(), shifting, [], today)).toMatchObject({ state: 'work', tone: 'bad', next: 'replace or fix' });
    expect(partStatus(bike(), part('fork', [e('2026-01-01', { action: 'service', result: 'done', by: 'shop' }), e('2026-08-09', { result: 'needed', by: 'shop' })]), [], today).next).toBe('have the bike shop do it');
    expect(partStatus(bike(), part('cassette', []), [], today).state).toBe('none');
    expect(partStatus(bike(), part('cassette', [e('2026-03-22', { action: 'replace', result: 'done', km: 3900, by: 'shop' })]), [], today)).toMatchObject({ state: 'ok', fill: null, next: '1,100 km old' });
    expect(partStatus(bike(), part('brakes', [e('2026-03-22', { action: 'service', result: 'done' })]), [], today).next).toBe('bleed when the lever feels soft');
    expect(['due', 'overdue', 'work'].every(isDueState)).toBe(true);
    expect(['ok', 'soon', 'none'].some(isDueState)).toBe(false);
  });
});

describe('the year on one bike', () => {
  it('counts my jobs once per day and action, the visits and what they cost', () => {
    let parts = ensureParts(bike());
    for (const k of ['padsF', 'padsR', 'chain', 'bolts']) parts = logPart(parts, k, e('2026-09-29', { note: '1000 km check' }));
    parts = logPart(parts, 'chain', e('2026-09-08', { action: 'service', result: 'done' }));
    parts = logPart(parts, 'chain', e('2025-12-08', { action: 'service', result: 'done' }));
    parts = logPart(parts, 'fork', e('2026-02-01', { action: 'service', result: 'done', by: 'shop' }));
    const visits = [
      { id: 'v1', bikeId: 'test_data_gtp_spark', date: '2026-03-22', km: 3900, totalChf: 129, parts: [] },
      { id: 'v2', bikeId: 'test_data_gtp_spark', date: '2026-06-10', km: 4300, parts: [{ part: 'padsR', action: 'replace', chf: 68.5 }] },
      { id: 'v3', bikeId: 'test_data_gtp_spark', date: '2026-07-01', km: 4500, parts: [] },
      { id: 'v4', bikeId: 'test_data_gtp_other', date: '2026-07-01', totalChf: 999, parts: [] },
    ];
    const tasks = [{ id: 7, bikeId: 'test_data_gtp_spark', status: 'done', statusDate: '2026-05-01', by: 'self', task: 'x' }];
    const view = withVisits(bike({ parts }), visits);
    const y = yearSummary(view, visits, tasks, '2026');
    expect(y).toMatchObject({ year: '2026', self: 3, shop: 3, chf: 197.5, unknown: 1 });
    expect(y.per).toMatchObject({ chf: 180, km: 1100 });
  });
});

describe('the workshop order takes only what I do not usually do myself', () => {
  const today = '2026-10-08';
  let parts = ensureParts(bike());
  parts = logPart(parts, 'fork', e('2025-09-04', { action: 'service', result: 'done', by: 'shop' }));
  parts = logPart(parts, 'tyres', e('2026-06-01', { action: 'service', result: 'done', km: 4000 }));
  parts = logPart(parts, 'padsF', e('2026-09-29', { value: 45, km: 3900 }));
  const b = bike({ parts, tyreSetup: { front: 'tubeless', rear: 'tubeless' } });
  const tasks = [{ id: 7, area: 'Bike', bikeId: 'test_data_gtp_spark', task: 'test_data_gtp_ creak', status: 'open' }];
  const setup = { front: 'tubeless', rear: 'tubeless' };

  it('skips my own parts and the check, keeps the shop parts, parts without work and repairs', () => {
    const skip = shopSkip(b);
    expect(skip('fork')).toBe(false); // the shop does it
    expect(skip('tyres')).toBe(true); // I top up the sealant
    expect(skip('padsF')).toBe(false); // only measured, never replaced: stays in
    expect(skip('check')).toBe(true); // I do the 1000 km check
    const all = workshopOrder(b, null, tasks, [], setup, today);
    const mine = workshopOrder(b, null, tasks, [], setup, today, { skip });
    expect(all.rows.map((r) => r.key)).toEqual(expect.arrayContaining(['fork:now', 'tyres:now', 'check:now', 'padsF:now', 'repair:7']));
    expect(mine.rows.map((r) => r.key).sort()).toEqual(['fork:now', 'padsF:now', 'repair:7', 'shock:now'].filter((k) => all.rows.some((r) => r.key === k)).sort());
  });

  it('keeps the 1000 km check when the bike shop did most checks', () => {
    let p2 = parts;
    for (const k of ['padsR', 'chain', 'bolts']) p2 = logPart(p2, k, e('2025-01-01', { km: 1000, by: 'shop' }));
    expect(shopSkip(bike({ parts: p2 }))('check')).toBe(false);
    expect(shopSkip(bike())('check')).toBe(true);
  });
});
