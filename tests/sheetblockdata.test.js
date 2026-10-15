// «Bausteine»: what the blocks show and the German text to the bike shop in the order of the blocks
// (B4 a: a block that is off is missing in the text too; BS2 a: «Before dropping it off» stays out;
// BS3 b: the chain forecast is on the Workshop order too).
import { describe, it, expect } from 'vitest';
import { blockView, ownView, shopLines, orderMessage, keepRest, partSizes, problemsSince, pickupSuggestion } from '../src/lib/sheetblockdata.js';
import { globalOf, blockDef } from '../src/lib/sheetblocks.js';

const glob = globalOf(null);
const chainHist = [
  { date: '2026-08-01', km: 1000, action: 'check', value: 0.1 },
  { date: '2026-10-10', km: 2000, action: 'check', value: 0.3 },
];
const bike = {
  id: 7,
  name: 'Demo Gravel',
  km: 2480,
  parts: [{ key: 'chain', history: chainHist }, { key: 'tyres', attrs: { widthF: '45', widthR: '45' } }],
  sheets: { wishes: 'Bitte das Knacken anschauen' },
  sheetBlocks: { data: { budget: { limit: 150 }, pickupWish: { date: '2026-10-22', text: 'nach 17 Uhr' }, partsBrought: [{ id: 'a', text: 'Kette Demo 12' }] } },
};
const picked = [
  { key: 'sealant:now', name: 'Refill sealant', de: 'Dichtmilch nachfüllen', chf: 25, action: 'service' },
  { key: 'chain:now', name: 'Chain', de: 'Kette prüfen, wenn nötig ersetzen', chf: 45, action: 'replace', part: 'chain' },
];
const c = (extra = {}) => ({ bike, view: bike, sheet: 'order', data: { picked, trip: { title: 'Demo Alpentour', startDate: '2026-10-24', days: 3 }, order: { shop: '' } }, again: [], keep: [], tasks: [], visits: [], today: '2026-10-15', ...extra });

describe('the blocks of the Workshop order', () => {
  it('the cost limit shows the estimate and the limit', () => {
    const v = blockView('budget', c());
    expect(v.rows.map((r) => r.id)).toEqual(['estimate', 'limit']);
    expect(v.rows[0].value).toBe('CHF 70');
  });
  it('the measured values have the chain forecast on the order too (BS3 b)', () => {
    const v = blockView('measured', c());
    const chain = v.rows.find((r) => r.id === 'chain');
    expect(chain.value).toBe('wear 0.3 %');
    expect(chain.note).toMatch(/km left to 0.5 %/);
    expect(shopLines('measured', c())[0]).toMatch(/^Zuletzt gemessen: Kettenverschleiss 0,3 % \(10\.10\.2026\), noch ca\. [\d’']+ km bis 0,5 %/);
  });
  it('lists only the values to keep that are not set again already', () => {
    const keep = [{ key: 'seatHeight', label: 'Saddle height', value: '742 mm' }, { key: 'pressureF', label: 'Target pressure front', value: '2 bar' }];
    expect(keepRest(keep, [{ key: 'seatHeight' }]).map((r) => r.key)).toEqual(['pressureF']);
  });
  it('is empty when there is nothing (left out of the PDF and the text)', () => {
    expect(blockView('nextDue', c({ profile: { next: [] } })).empty).toBe(true);
    expect(blockView('replaced', c()).empty).toBe(true);
  });
});

describe('the text to the bike shop', () => {
  it('follows the order of the blocks and leaves out what is off', () => {
    const text = orderMessage(c(), ['jobs', 'budget', 'wishes', 'pickupWish', 'partsBrought']);
    const lines = text.split('\n');
    expect(lines[2]).toBe('Ich möchte mein Demo Gravel vor dem 24.10.2026 (Demo Alpentour) in den Service bringen. Bitte:');
    expect(lines).toContain('- Dichtmilch nachfüllen');
    const at = (s) => lines.findIndex((l) => l.startsWith(s));
    expect(at('Nach meinen letzten Quittungen')).toBeLessThan(at('Wünsche:'));
    expect(at('Wünsche:')).toBeLessThan(at('Abholen:'));
    expect(text).toContain('Bitte rufen Sie mich an, bevor es mehr als CHF 150 kostet.');
    expect(text).toContain('Abholen: bis 22.10.2026, nach 17 Uhr');
    expect(text).toContain('Ich bringe mit: Kette Demo 12');
    expect(lines.at(-1)).toBe('Freundliche Grüsse');
    expect(text).toContain("Kilometerstand: 2’480 km".replace('’', (2480).toLocaleString('de-CH')[1]));
    // the wishes block off: no wishes in the text
    expect(orderMessage(c(), ['jobs', 'budget'])).not.toContain('Wünsche:');
  });
  it('without «Please do» the first line has no list', () => {
    const text = orderMessage(c(), ['wishes']);
    expect(text).toContain('in den Service bringen.\n');
    expect(text).not.toContain('Bitte:');
    expect(text).not.toContain('- Dichtmilch');
  });
  it('keeps «Before dropping it off» out of the text (BS2 a), an own text block goes in', () => {
    const before = blockDef('own:beforeDrop', glob);
    expect(shopLines('own:beforeDrop', c(), before)).toEqual([]);
    const note = { ...blockDef('own:note', glob), toShop: true };
    const withNote = { ...bike, sheetBlocks: { own: { note: { text: 'Kette ist gewachst' } } } };
    expect(shopLines('own:note', c({ bike: withNote }), note)).toEqual(['Note: Kette ist gewachst']);
  });
});

describe('own blocks', () => {
  it('a checklist shows its points with this bike\'s ticks', () => {
    const def = blockDef('own:beforeDrop', glob);
    const b = { ...bike, sheetBlocks: { own: { beforeDrop: { ticks: { bags: true } } } } };
    const v = ownView(def, b);
    expect(v.rows.length).toBe(5);
    expect(v.rows.find((r) => r.id === 'bags').ticked).toBe(true);
    expect(v.empty).toBe(false);
  });
  it('a text block is empty without a text', () => {
    expect(ownView(blockDef('own:note', glob), bike).empty).toBe(true);
  });
});

describe('helpers', () => {
  it('suggests the pick-up two days before the trip', () => {
    expect(pickupSuggestion({ title: 'Demo', startDate: '2026-10-24' }).date).toBe('2026-10-22');
    expect(pickupSuggestion(null)).toBe(null);
  });
  it('the sizes list only what is known', () => {
    expect(partSizes(bike).map((r) => r.id)).toEqual(['tyres']);
  });
  it('the problems since the last visit include the ones fixed at home', () => {
    const tasks = [
      { id: 1, bikeId: 7, task: 'Knacken beim Antreten', logDate: '2026-10-09', status: 'open' },
      { id: 2, bikeId: 7, task: 'Schaltung springt', logDate: '2026-10-12', status: 'done', fix: 'self' },
      { id: 3, bikeId: 7, task: 'Alt', logDate: '2026-01-01', status: 'done' },
      { id: 4, bikeId: 8, task: 'Anderes Velo', logDate: '2026-10-12', status: 'open' },
    ];
    const ps = problemsSince({ bike, tasks, visits: [{ bikeId: 7, date: '2026-03-01' }] });
    expect(ps.map((p) => p.id)).toEqual([1, 2]);
    expect(ps[1].self).toBe(true);
  });
});
