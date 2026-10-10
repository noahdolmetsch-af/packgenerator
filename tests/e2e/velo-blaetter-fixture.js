// v0.69.0 «Velo-Blätter»: one fictional data set (all ids start with test_data_gtp_), built on the Q1
// fixture. «Demo Trail» (a full suspension bike, an event in 10 days) gets fit values and a few part
// specs, so the Bike pass has values and empty lines; its workshop order comes from what is due
// (fork and shock service, sealant, an open repair for the bike shop). Dates are Zurich calendar days.
import { writeFileSync } from 'node:fs';
import { q1Data, TRAIL, NEU, P, day } from './q1km-fixture.js';

export { TRAIL, NEU, P, day };
export const REPAIR = 9101;

export function vbData() {
  const { fix } = q1Data();
  const T = fix.tables;
  const trail = T.bikes.find((b) => b.id === TRAIL);
  trail.fit = { seatHeight: 745, pressureF: 1.45, pressureR: 1.55, forkPressure: 72, forkSag: 20, shockPressure: 165, shockSag: 28, frameSize: 'M', stemLength: 45 };
  trail.parts = trail.parts.map((p) => (p.key === 'tyres' ? { ...p, model: 'Demo Pneu 29 × 2.4' } : p));
  trail.parts.push({ key: 'fork', model: 'Demo Gabel', attrs: { travel: 140 }, history: [] }, { key: 'shock', model: 'Demo Dämpfer', attrs: { travel: 130 }, history: [] });
  T.maintenance = [
    ...(T.maintenance ?? []),
    { id: REPAIR, area: 'Bike', bikeId: TRAIL, subject: trail.name, task: `${P} Knacken im Tretlager`, category: 'Repair', source: 'Care', logDate: day(-3), leadWeeks: null, priority: 'medium', status: 'open', note: '', fix: 'shop', beforeRide: true, done: false },
  ];
  return fix;
}

export function vbFile(info) {
  const path = info.outputPath('vb-fixture.json');
  writeFileSync(path, JSON.stringify(vbData()));
  return path;
}
