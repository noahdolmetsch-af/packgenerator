/**
 * Rundgang der Stärken, station 3 (Noah 23.11.2026 «1-5a», question 4a): the sample race gets example bag photos, so
 * «In which bag is the jacket?» has something to show. The pictures are drawn (an SVG with the name of the bag, its
 * label «Example», what is in it and its weight), no real photos. They are normal bag photos (db.photos, `bagShot`,
 * tripId = the sample race), so the race mode box «What lies where» shows them and «Delete the sample» takes them
 * away with the sample. Your own photos and trips are never touched: the ids start with «bagshot-sample-».
 * Pure apart from the small db helpers at the end; tested in tests/race-samplebags.test.js.
 */
import { SAMPLE_ID } from './sample.js';
import { formatWeight } from '../gear.js';

/** The example bags: slot, name and contents are English keys for t(); weight in grams. */
export const SAMPLE_BAGS = [
  { slot: 'seat', name: 'Seat pack 12 L', things: ['Down sleeping bag', 'Sleeping mat', 'Tarp|example'], g: 1710 },
  { slot: 'frame', name: 'Frame bag', things: ['Rain jacket|play', 'Tool kit', 'Spare tube|example', 'Power bank|play'], g: 780 },
  { slot: 'bar', name: 'Handlebar roll', things: ['Fleece jumper|example', 'Head torch'], g: 390 },
];

export const sampleShotId = (slot) => `bagshot-sample-${slot}`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** One drawn bag picture as an SVG data URL (4:3). weight: the text of the weight, e.g. «1.7 kg». */
export function bagDrawing({ name, things, weight, tag }) {
  const list = things.map((x, i) => `<text x="40" y="${174 + i * 29}" font-size="21" fill="#3b4540">• ${esc(x)}</text>`).join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300" font-family="system-ui, sans-serif">` +
    `<rect width="400" height="300" fill="#eef2ee"/>` +
    `<rect x="20" y="20" width="360" height="260" rx="28" fill="#fdfcf8" stroke="#4a7c6a" stroke-width="4"/>` +
    `<rect x="40" y="38" width="120" height="30" rx="15" fill="#4a7c6a"/>` +
    `<text x="100" y="59" font-size="17" font-weight="700" fill="#ffffff" text-anchor="middle">${esc(tag)}</text>` +
    `<text x="40" y="112" font-size="30" font-weight="700" fill="#1f2a25">${esc(name)}</text>` +
    `<text x="40" y="146" font-size="22" font-weight="600" fill="#4a7c6a">${esc(weight)}</text>` +
    list +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** The rows for db.photos: one drawn photo per example bag. tr: t(); kg: formats a weight in grams. */
export function sampleBagShots(today, tr = (s) => s, kg = formatWeight) {
  return SAMPLE_BAGS.map((b) => {
    const name = tr(b.name);
    return {
      id: sampleShotId(b.slot),
      bikeId: null,
      tripId: SAMPLE_ID,
      slot: b.slot,
      bagShot: true,
      sample: true,
      name,
      main: false,
      data: bagDrawing({ name, things: b.things.map((x) => tr(x)), weight: kg(b.g), tag: tr('Example') }),
      day: today,
      addedAt: '2000-01-01T00:00:00.000Z', // very old: your own photo of the same bag always wins
    };
  });
}

/** Put the example bag photos of the sample race (again); `force` replaces the ones that are there. */
export async function putSampleBags({ db, today, tr, kg, force = false }) {
  const have = new Set((await db.photos.where('tripId').equals(SAMPLE_ID).toArray()).filter((p) => p.sample).map((p) => p.slot));
  const rows = sampleBagShots(today, tr, kg).filter((r) => force || !have.has(r.slot));
  if (rows.length) await db.photos.bulkPut(rows);
  return rows.length;
}

/** Take the example bag photos away (the sample race is deleted); your own photos of it stay with their trip. */
export async function dropSampleBags(db) {
  const ids = (await db.photos.where('tripId').equals(SAMPLE_ID).toArray()).filter((p) => p.sample).map((p) => p.id);
  if (ids.length) await db.photos.bulkDelete(ids);
  return ids.length;
}
