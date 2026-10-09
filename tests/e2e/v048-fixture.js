// v0.48.0 «Pflege-Übersicht, Teile pro Velo, Eingang und Notizen»: one fictional data set (all names
// start with test_data_gtp_), built on the v038 fixture. Four bikes: the Spark with a history and a
// part of its spec sheet, the Scale and the Gravel with a little, and the «Bergziege» without any
// part data (the start-values wizard). Problems, a workshop visit with a receipt, open notes, a note
// filed today, kept notes (one pinned with an open checklist).
import { writeFileSync } from 'node:fs';
import { v038Data, P, SPARK, SCALE, GRAVEL, day } from './v038-fixture.js';

export { P, SPARK, SCALE, GRAVEL, day };
export const GOAT = `${P}goat`;
// A tiny grey receipt (a 2×2 JPEG would do; an SVG data URL keeps the fixture small and fictional).
export const RECEIPT = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="60" height="80"><rect width="60" height="80" fill="#eee"/><text x="6" y="20" font-size="8">BELEG</text></svg>').toString('base64');

export function v048Data() {
  const fix = v038Data();
  const T = fix.tables;
  const at = (n, h = 8) => `${day(n)}T${String(h).padStart(2, '0')}:20:00.000Z`;
  T.bikes.push({ id: GOAT, name: `${P} Bergziege 29`, type: 'full', weightG: 10900, slots: ['seat', 'frame', 'cage1'], setup: { seat: null, frame: null, cage1: null }, fixtures: [], km: 1240, kmDate: day(-1) });
  const spark = T.bikes.find((b) => b.id === SPARK);
  const spec = { cassette: { model: `${P} Zahnkranz 10-51`, weightG: 470, attrs: { cogs: '10-51' } }, shifting: { model: `${P} Werfer 12`, weightG: 280 }, brakeF: { model: `${P} Stopper 4`, attrs: { pistons: 4 } }, brakeR: { model: `${P} Stopper 4`, attrs: { pistons: 4 } }, rotorF: { model: `${P} Rundling`, attrs: { dia: 180 } }, rotorR: { model: `${P} Rundling`, attrs: { dia: 160 } }, fork: { model: `${P} Federling 130`, attrs: { travel: 130 } }, shock: { model: `${P} Luftkissen`, attrs: { travel: 120 } }, wheelF: { attrs: { size: '29"' } } };
  spark.parts = spark.parts.map((p) => ({ ...p, ...(spec[p.key] ?? {}) }));
  for (const [key, v] of Object.entries(spec)) if (!spark.parts.some((p) => p.key === key)) spark.parts.push({ key, model: '', history: [], ...v });
  spark.geometry = { stack: 622, reach: 450, headAngle: 65.5 };
  const scale = T.bikes.find((b) => b.id === SCALE);
  scale.parts = [...(scale.parts ?? []), { key: 'cassette', model: `${P} Zahnkranz 10-51`, weightG: 470, history: [] }, { key: 'fork', model: `${P} Federling 120`, attrs: { travel: 120 }, history: [] }, { key: 'wheelF', model: '', attrs: { size: '29"' }, history: [] }];
  scale.geometry = { stack: 610, reach: 455 };
  // Problems: a flat list, newest on top.
  const problem = (id, bikeId, text, n, extra = {}) => ({ id, area: 'Bike', bikeId, subject: '', task: `${P} ${text}`, category: 'Repair', source: 'Problem', logDate: day(n), leadWeeks: null, priority: 'medium', status: 'open', note: '', fix: 'self', ...extra });
  T.maintenance.push(problem(9201, SPARK, 'Bremse hinten schleift', 0), problem(9202, GRAVEL, 'Kette knackt am Berg', -1, { fix: 'guide' }), problem(9203, SCALE, 'Steuersatz hat Spiel', -25, { fix: 'shop' }));
  // A workshop visit with a receipt photo.
  T.visits.push({ id: `${P}v9`, bikeId: SCALE, date: day(-25), km: 3100, shop: `${P} Velo shop`, totalChf: 89, photos: [RECEIPT], parts: [{ part: 'tyres', action: 'replace', chf: 89, what: `${P} Reifen vorne und hinten` }] });
  // The inbox: open notes and one filed today (faint until midnight).
  T.notes = [
    { id: `${P}n1`, text: `${P} Bell rattles`, status: 'open', at: at(-1, 7) },
    { id: `${P}n2`, text: `${P} New bottle cage?`, status: 'open', at: at(0, 7) },
    { id: `${P}n3`, text: `${P} Foto Rechnung`, status: 'open', at: at(0, 6), photo: RECEIPT, page: 'home' },
    { id: `${P}n4`, text: `${P} Schönes Café am See`, status: 'open', at: at(-4, 9) },
    { id: `${P}n5`, text: `${P} Bremse hinten schleift`, status: 'sorted', at: at(0, 5), sortedAt: new Date().toISOString(), to: { kind: 'repair', label: `Repair · ${P} Scott Spark 960`, ref: 9201 } },
    { id: `${P}n6`, text: `${P} Leichtere Isomatte anschauen`, status: 'sorted', at: at(-10, 5), sortedAt: `${day(-10)}T09:00:00.000Z`, to: { kind: 'wish', label: 'Wishlist', ref: null } },
    // Kept notes (the Notes page).
    { id: `${P}k1`, kind: 'note', status: 'kept', at: at(-6, 7), editedAt: at(0, 7), title: `${P} Jura-Wochenende: noch besorgen`, text: 'Vor Samstag erledigen.', topic: 'trips', pinned: true, checklist: [{ text: 'Gaskartusche', done: true }, { text: 'Kettenwachs', done: true }, { text: 'Ersatz-Schaltauge', done: false }] },
    { id: `${P}k2`, kind: 'note', status: 'kept', at: at(-2, 7), title: `${P} Reifendruck Gravel`, text: 'Vorne 2,1 bar, hinten 2,3 bar. #druck', topic: 'bike', bikeId: GRAVEL },
    { id: `${P}k3`, kind: 'note', status: 'kept', at: at(-3, 7), title: `${P} Via Valtellina, 4 Tage`, text: 'Mit Zug zurück.', topic: 'trips', link: { title: `${P} Via Valtellina Route`, url: 'https://example.org/route' } },
  ];
  return fix;
}

export function v048File(info) {
  const path = info.outputPath('v048-fixture.json');
  writeFileSync(path, JSON.stringify(v048Data()));
  return path;
}
