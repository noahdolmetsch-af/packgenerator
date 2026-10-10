// v0.70.0 «Velo-Blätter Teil 2»: one fictional data set (all ids start with test_data_gtp_), built on
// the Velo-Blätter fixture. «Demo XC» is a new full suspension bike (bought 7 days ago, 64 km) with
// fit values and part sizes, tubeless tyres, a purchase receipt from a fictional shop and a day trip
// in 5 days; the gear list gets a few more fictional tools (some kit rows stay «missing»).
// Dates are Zurich calendar days.
import { writeFileSync } from 'node:fs';
import { vbData, TRAIL, NEU, P, day } from './velo-blaetter-fixture.js';

export { TRAIL, NEU, P, day };
export const XC = `${P}xc`;
export const XC_TRIP = `${P}xctrip`;
export const BUY = `${P}vxc`;
// a 1×1 pixel PNG (the fictional receipt «photo», also the photo the Theft sheet test adds)
export const PIXEL_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const PIXEL = `data:image/png;base64,${PIXEL_B64}`;

export function vb2Data() {
  const fix = vbData();
  const T = fix.tables;
  const blank = (key, over = {}) => ({ key, model: '', history: [], ...over });
  T.bikes.push({
    id: XC,
    name: 'Demo XC',
    type: 'full',
    weightG: 11900,
    slots: ['seat', 'frame', 'top', 'cage1', 'cage2', 'tool'],
    setup: {},
    fixtures: [],
    km: 64,
    kmDate: day(-1),
    bought: day(-7),
    tyreSetup: { front: 'tubeless', rear: 'tubeless' },
    fit: { forkPressure: 85, shockPressure: 190, forkSag: 15, shockSag: 25, pressureF: 1.6, pressureR: 1.7, frameSize: 'M' },
    parts: [
      blank('frame', { model: 'Demo XC Rahmen UDH' }),
      blank('fork', { model: 'Demo Gabel', attrs: { travel: 110 } }),
      blank('shock', { model: 'Demo Dämpfer', attrs: { travel: 100 } }),
      blank('cassette', { attrs: { cogs: '12' } }),
      blank('brakeF', { attrs: { pistons: '2' } }),
      blank('wheelF', { attrs: { size: '29' } }),
      blank('tyres', { model: 'Demo Pneu', attrs: { widthF: '2.4' } }),
    ],
  });
  T.visits.push({ id: BUY, bikeId: XC, date: day(-7), km: 0, shop: `${P} Velo Werkstatt Nord`, totalChf: 4290, parts: [{ part: 'frame', action: 'replace', what: 'Kaufbeleg Demo XC' }], photos: [PIXEL] });
  const tool = (id, name, g) => ({ id: `${P}${id}`, name: `${P} ${name}`, category: 'tools', weightG: g, qty: 1, weightStatus: 'measured', carry: 'bike', defaultBag: 'tool', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'] });
  T.items.push(tool('WZ31', 'Tubeless-Würste', 25), tool('WZ32', 'Kettenschloss 12-fach', 5), tool('WZ33', 'Kettennieter', 45), tool('WZ34', 'Kabelbinder', 10), tool('WZ35', 'Reifenheber', 20));
  T.trips.push({ id: XC_TRIP, domain: 'bikepacking', title: `${P} Demo-Tour Jura`, startDate: day(5), days: 1, bikeId: XC, bike: 'Demo XC', setup: {}, entries: [{ itemId: `${P}WZ01`, slot: 'top', qty: 1, packed: false }], ready: [], status: 'planned', createdAt: `${day(-2)}T08:00:00.000Z` });
  return fix;
}

export function vb2File(info) {
  const path = info.outputPath('vb2-fixture.json');
  writeFileSync(path, JSON.stringify(vb2Data()));
  return path;
}
