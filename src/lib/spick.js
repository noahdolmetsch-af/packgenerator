/**
 * «Velo im Griff» #327 «Werkstatt-Spick» (Noah 19.10.2026): a cheat sheet for the workshop and the
 * roadside, in the app bundle, so it works offline.
 * (a) a torque table of typical values (the value printed on the part always wins), plus own rows
 *     (settings TORQUE_OWN: [{ id, name, nm }], add, rename, change, delete, reorder);
 * (b) «Pannenhilfe»: short steps for the common breakdowns.
 * English source, German through t(). Pure functions for the own rows, tested in tests/spick.test.js.
 */

/** Key in the settings table: the own torque rows. */
export const TORQUE_OWN = 'torqueOwn';

/** Typical torque values in Nm (a range when it varies). note: one line where it matters. */
export const TORQUE = [
  { key: 'stem', name: 'Stem: handlebar clamp', nm: '5' },
  { key: 'steerer', name: 'Stem: steerer clamp', nm: '5–6' },
  { key: 'seatclamp', name: 'Seatpost clamp', nm: '5–6', note: 'Carbon: carbon paste, never more than printed.' },
  { key: 'saddle', name: 'Saddle rail clamp', nm: '8–12' },
  { key: 'axle', name: 'Thru axle', nm: '12–15' },
  { key: 'rotor', name: 'Rotor bolts (6 bolts)', nm: '6' },
  { key: 'lockring', name: 'Rotor lockring (Center Lock)', nm: '40' },
  { key: 'caliper', name: 'Brake caliper bolts', nm: '6–8' },
  { key: 'lever', name: 'Brake and shift lever clamp', nm: '4–6' },
  { key: 'derailleur', name: 'Rear derailleur mounting bolt', nm: '8–10' },
  { key: 'cable', name: 'Derailleur cable clamp', nm: '5–7' },
  { key: 'crank', name: 'Crank bolts', nm: '', note: 'Per manufacturer: look on the crank arm (often 12–14 for the pinch bolts).' },
  { key: 'chainring', name: 'Chainring bolts', nm: '8–10' },
  { key: 'cassette', name: 'Cassette lockring', nm: '40' },
  { key: 'pedal', name: 'Pedals', nm: '35–40' },
  { key: 'cage', name: 'Bottle cage bolts', nm: '3–4' },
];

/** The breakdowns, each with its short steps (in order). */
export const BREAKDOWNS = [
  {
    key: 'tubeless',
    name: 'Flat tyre, tubeless',
    steps: [
      'Turn the wheel so the hole is at the bottom and let the sealant work for a minute.',
      'Pump. If air still comes out, push a tyre plug into the hole and leave about 1 cm outside.',
      'Pump to riding pressure and check that it holds. Ride gently at first.',
      'Nothing holds: take out the valve and fit a tube (see «Flat tyre with a tube»).',
      'At home: top up the sealant. A tyre with a big cut needs replacing.',
    ],
  },
  {
    key: 'tube',
    name: 'Flat tyre with a tube',
    steps: [
      'Shift to the smallest cog, open the axle and take the wheel out.',
      'Push the tyre beads into the middle of the rim and lever one side off with tyre levers.',
      'Take out the tube. Feel carefully inside the tyre and remove the thorn or glass.',
      'Put a little air into the new tube, valve first into the rim, then tuck it in all round.',
      'Push the bead back on by hand, starting at the valve. The tube must not be pinched.',
      'Pump to pressure, refit the wheel, close the axle and check the brake.',
    ],
  },
  {
    key: 'chain',
    name: 'Broken chain',
    steps: [
      'Shift to a middle gear and find both broken ends.',
      'Push the damaged link out with the chain tool.',
      'Join the chain with a quick link of the same speed count (or a joining pin).',
      'Hold the rear brake and press the pedal to pull the link closed. Check that it moves freely.',
      'Chain shorter now: avoid the largest cog with the large chainring and ride home gently.',
    ],
  },
  {
    key: 'hanger',
    name: 'Bent derailleur hanger',
    steps: [
      'Signs: shifting jumps, the derailleur hangs crooked, the cage comes close to the spokes.',
      'Do not shift into the largest cog: the derailleur can go into the spokes.',
      'Bend it back carefully by hand. A spare hanger fits only your frame model: carry one on long trips.',
      'Still not working: shorten the chain to one gear and ride home.',
      'At home: replace the hanger and adjust the shifting.',
    ],
  },
  {
    key: 'brake',
    name: 'Rubbing brake',
    steps: [
      'Check that the wheel sits straight: open the axle, push the wheel in, close it again.',
      'Loosen the two caliper bolts, pull the brake lever and tighten the bolts while you hold it.',
      'Still rubbing: take the pads out and push the pistons back carefully with a plastic tyre lever.',
      'A bent rotor: straighten it gently with a clean adjustable spanner.',
      'Squealing after rain is often dirt: brake firmly a few times.',
    ],
  },
  {
    key: 'spoke',
    name: 'Broken spoke',
    steps: [
      'Wrap the broken spoke around its neighbour or take it out, so it cannot hit the frame.',
      'Spin the wheel: it must not touch the frame or the brake.',
      'Ride on gently and with less load. A spoke key can true a wobble a little.',
      'At home: replace the spoke and true the wheel, or have the bike shop do it.',
    ],
  },
  {
    key: 'bolt',
    name: 'Loose bolt or creaking',
    steps: [
      'Find when it creaks: standing, pedalling, braking or sitting.',
      'Check the bolts with the torque wrench: stem, handlebar, seatpost, saddle, thru axles, pedals, crank.',
      'Use the values in the table above. The value printed on the part always wins.',
      'Carbon parts: carbon paste, never more than the printed value.',
      'A creak that stays often comes from the bottom bracket or the headset: have it checked.',
    ],
  },
];

/** The own rows as stored (a list of { id, name, nm }; anything else is left out). */
export const normRows = (raw) => (Array.isArray(raw) ? raw : []).filter((r) => r && typeof r.id === 'string' && typeof r.name === 'string').map((r) => ({ id: r.id, name: r.name, nm: String(r.nm ?? '') }));

/** «5», «5–6», «5-6 Nm», «4,5» → the value as shown («5–6»), or null when it is not a number or range. */
export function readNm(text) {
  const s = String(text ?? '').trim().replace(/\s*nm$/i, '').replace(/,/g, '.');
  if (s === '') return '';
  const m = s.match(/^(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?$/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = m[2] != null ? Number(m[2]) : null;
  if (a <= 0 || a > 300 || (b != null && (b <= a || b > 300))) return null;
  const f = (n) => String(n).replace('.', ',');
  return b != null ? `${f(a)}–${f(b)}` : f(a);
}

let seq = 0;
/** Add an own row. → the new list (unchanged when the name is empty). */
export function addRow(rows, name, nm = '', now = Date.now()) {
  const text = String(name ?? '').trim();
  if (!text) return normRows(rows);
  return [...normRows(rows), { id: `tq-${now.toString(36)}-${(seq++).toString(36)}`, name: text, nm: String(nm ?? '') }];
}
/** Change the name and/or the value of an own row. */
export const changeRow = (rows, id, patch) =>
  normRows(rows).map((r) => (r.id === id ? { ...r, ...(patch.name != null && String(patch.name).trim() ? { name: String(patch.name).trim() } : {}), ...(patch.nm != null ? { nm: String(patch.nm) } : {}) } : r));
/** Remove an own row. → { rows, row, at } (row and at for Undo). */
export function removeRow(rows, id) {
  const list = normRows(rows);
  const at = list.findIndex((r) => r.id === id);
  return at < 0 ? { rows: list, row: null, at: -1 } : { rows: list.filter((r) => r.id !== id), row: list[at], at };
}
/** Put a removed row back at its place (Undo). */
export function restoreRow(rows, row, at) {
  const list = normRows(rows);
  if (!row || list.some((r) => r.id === row.id)) return list;
  list.splice(Math.max(0, Math.min(at, list.length)), 0, row);
  return list;
}
/** Move an own row (arrows and drag). */
export function moveRow(rows, from, to) {
  const list = normRows(rows);
  if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) return list;
  const [r] = list.splice(from, 1);
  list.splice(to, 0, r);
  return list;
}
