/**
 * «Garmin-Seiten» (GA-1–GA-10 and GA-A1–A3, Noah 14.10.2026 «1a 2b 3b 4a ga freigeben» and
 * «GA-A1–A3 freigegeben»): ten model data pages for a Garmin Edge, kept once per bike in the app
 * and set up on the device by hand. Everything here is a suggestion: pages and fields can be
 * switched off, added back and changed. The app never sends anything to the Edge.
 *
 * - 1a: a bike can have more than one Garmin profile (the bike's own and «Bikepacking», or own ones);
 * - 2b: the Edge 540 shows at most 6 fields per page (the long pages drop one field there);
 * - 3b: «Time in zones» on GA-6 comes from a free Connect IQ app (marked «Connect IQ»).
 *
 * The data lives on the bike record: bike.garmin = { sensors, profiles, fields, done }.
 * Without bike.garmin the suggestion is computed from the bike's type and sensors; the first
 * change stores the whole thing (garminOf → patch).
 * Texts are English and go through t() in the components (German in i18n/de/garmin.js).
 */

export const DEVICES = ['1040', '540'];
/** 2b: fields per page on each Edge. */
export const MAX_FIELDS = { 1040: 8, 540: 6 };
export const SENSORS = ['power', 'cadence', 'speed', 'hr'];
export const SENSOR_LABEL = { power: 'Power pedals', cadence: 'Cadence sensor', speed: 'Speed sensor', hr: 'Heart rate strap' };

const f = (k, label, sample, unit, why, more = {}) => ({ k, label, sample, unit, why, ...more });

/**
 * The ten pages. A field: k (key), label, sample value + unit (only for the drawing), why, rare
 * (rarely watched), gfx (a graphic field: line, bar3, gauge, elev, stam, zones), ciq (Connect IQ app),
 * need (a sensor; without it the field is left out or replaced by alt).
 * kind: easy (2–4 fields), mid (5–6), deep (7–8). drop540: the fields the Edge 540 leaves out (2b).
 */
export const PAGES = [
  { id: 'GA-1', name: 'Short and big', kind: 'easy', why: 'The quiet page: two big numbers, no graphic. For the way to work, descents and days without numbers.', fields: [
    f('speed', 'Speed', '27.4', 'km/h', 'The one number you can read with half a glance, even on a trail.'),
    f('dist', 'Distance', '18.6', 'km', 'How far you are.'),
  ] },
  { id: 'GA-2', name: 'Load', kind: 'easy', why: 'The main training page: two graphics for the quick look, two numbers below. Am I on plan or too hard?', fields: [
    f('pzone', 'Power zone gauge', '', '', 'Shows how hard you pedal without reading: colour and pointer are enough.', { gfx: 'gauge', need: 'power', alt: 'speed' }),
    f('hrline', 'Heart rate graph', '142', 'bpm', 'If the heart rate climbs at the same power, you are getting tired.', { gfx: 'line', need: 'hr' }),
    f('hr', 'Heart rate', '142', 'bpm', 'The exact number to the line.', { need: 'hr' }),
    f('cad', 'Cadence', '86', 'rpm', 'Too low means too hard a gear. Spares the knees on long days.', { need: 'cadence', alt: 'speed' }),
  ] },
  { id: 'GA-3', name: 'Climbs', kind: 'mid', why: 'For passes and long climbs: the profile shows where you are, the numbers help to share out your strength.', fields: [
    f('elev', 'Elevation graph', '', '', 'Where you are on the climb and what is still to come.', { gfx: 'elev' }),
    f('grade', 'Grade', '7.4', '%', 'Shows if a steep bit comes and you should shift.'),
    f('ascleft', 'Ascent left', '186', 'm', 'The metres to the top say more than kilometres.'),
    f('vam', 'VAM', '812', 'm/h', 'Metres climbed per hour. Compares passes fairly, however long they are.', { rare: true }),
    f('wkg', 'Watts per kg', '3.1', 'W/kg', 'On a climb, power per body weight counts.', { need: 'power', alt: 'hr' }),
  ] },
  { id: 'GA-4', name: 'Long tour', kind: 'mid', why: 'The planning page for bikepacking and long rides. No training values, just: is the day still enough?', fields: [
    f('speedbar', 'Speed bars', '24', 'km/h', 'Now, average and maximum. If «now» stays below the average, you arrive later.', { gfx: 'bar3' }),
    f('todest', 'Distance to destination', '64', 'km', 'How much of the day is still ahead.'),
    f('eta', 'Arrival', '17:42', '', 'For the train, the place to sleep and dinner.'),
    f('sunset', 'Sunset', '18:51', '', 'With «Arrival» you see if you ride into the dark.', { rare: true }),
    f('temp', 'Temperature', '12', '°C', 'Tells you early when the jacket or gloves are due.', { rare: true }),
  ] },
  { id: 'GA-5', name: 'Energy and food', kind: 'mid', why: 'Against the bonk. On long days eating and drinking matter more than any watts.', fields: [
    f('stamina', 'Stamina', '', '', 'Two bars: how much strength is left and how much of it you can use at this pace.', { gfx: 'stam', rare: true }),
    f('kcal', 'Calories', '1840', 'kcal', 'What you used. It tells how much you should eat.'),
    f('ate', 'Eaten', '620', 'kcal', 'Logged on the Edge at each stop. The gap to «Calories» shows what is missing.'),
    f('drank', 'Drunk', '1.2', 'l', 'Are you drinking enough?'),
    f('kj', 'Work', '1650', 'kJ', 'The energy you pedalled. About as many kcal should you eat.', { rare: true, need: 'power', alt: 'time' }),
  ] },
  { id: 'GA-6', name: 'Power in detail', kind: 'deep', drop540: ['if'], why: 'For training rides with power pedals. The same values as in the app\'s training part, so the Edge and the app speak the same language.', fields: [
    f('pline', 'Power graph', '226', 'W', 'The last 100 seconds or so. Steady, or spikes all the time?', { gfx: 'line', need: 'power' }),
    f('np', 'NP', '226', 'W', 'Normalized power: counts hard spikes more.', { need: 'power' }),
    f('pavg', 'Avg power', '198', 'W', 'The plain average, to compare with NP.', { need: 'power' }),
    f('if', 'IF', '0.78', '', 'Intensity to FTP: below 0.75 easy, above 0.85 hard.', { rare: true, need: 'power' }),
    f('tss', 'TSS', '142', '', 'Training load of the ride, the same measure as in the app.', { rare: true, need: 'power' }),
    f('ftp', '% FTP', '88', '%', 'How close you ride to your threshold.', { need: 'power' }),
    f('zones', 'Time in zones', '', '', 'Seven bars: how long you were in each power zone. Needs a free Connect IQ app.', { gfx: 'zones', rare: true, ciq: true, need: 'power' }),
  ] },
  { id: 'GA-7', name: 'Pedalling technique', kind: 'deep', drop540: ['phase'], why: 'What power pedals measure but hardly anyone looks at. For calm technique rides, after a change to the saddle or cleats.', fields: [
    f('cadbar', 'Cadence bars', '88', 'rpm', 'Now, average and maximum: rounder or heavier than usual today?', { gfx: 'bar3', need: 'cadence' }),
    f('lr', 'Left/right', '48/52', '%', 'The split between the legs. More than 5 % apart can mean tiredness or the position.', { rare: true, need: 'power' }),
    f('smooth', 'Smoothness', '21/23', '%', 'How round you pedal. Higher is rounder.', { rare: true, need: 'power' }),
    f('torque', 'Torque effectiveness', '74/76', '%', 'How much force pushes forward instead of against the other leg.', { rare: true, need: 'power' }),
    f('pco', 'Pedal centre', '+3/−2', 'mm', 'Where your foot presses on the pedal. Helps with the cleats.', { rare: true, need: 'power' }),
    f('phase', 'Power phase', '22–188°', '', 'At which angle you push.', { rare: true, need: 'power' }),
    f('stand', 'Standing time', '04:12', 'min', 'How often you stand up, on climbs and for the position.', { rare: true, need: 'power' }),
  ] },
  { id: 'GA-8', name: 'Trail', kind: 'easy', why: 'The mountain bike page: one big number and a line for the quick look, the two trail values to compare with the last ride.', fields: [
    f('speed', 'Speed', '19.2', 'km/h', 'The main number on a trail.'),
    f('hrline', 'Heart rate graph', '156', 'bpm', 'Uphill on a trail the line shows if you overdo it.', { gfx: 'line', need: 'hr' }),
    f('grit', 'Grit', '34', '', 'How hard the trail was (steepness, ground, bends).', { rare: true }),
    f('flow', 'Flow', '4.6', '', 'How smoothly you rode. Lower is smoother.', { rare: true }),
  ] },
  { id: 'GA-9', name: 'Intervals and laps', kind: 'mid', why: 'For planned sessions from the training part. Every number is for the current lap.', fields: [
    f('pzone', 'Power zone gauge', '', '', 'In an interval you have to stay in the right zone. Colour and pointer show it even when it hurts.', { gfx: 'gauge', need: 'power', alt: 'lapspeed' }),
    f('laptime', 'Lap time', '04:38', '', 'How long the interval has been running.'),
    f('lappow', 'Lap avg power', '262', 'W', 'Do you hit the target on average?', { need: 'power', alt: 'lapspeed' }),
    f('laphr', 'Lap avg heart rate', '158', 'bpm', 'If it climbs lap by lap at the same power, you are tired.', { need: 'hr' }),
    f('lap', 'Lap', '3', '', 'How many intervals you have done.'),
    f('lapcad', 'Lap avg cadence', '92', 'rpm', 'Does the cadence drop in the interval?', { rare: true, need: 'cadence' }),
  ] },
  { id: 'GA-10', name: 'On the way and device', kind: 'deep', drop540: ['temp'], why: 'Everything you otherwise only see in Strava. Works on every bike, no sensor needed.', fields: [
    f('elev', 'Elevation graph', '1240', 'm', 'One picture instead of three numbers: height, ascent and descent.', { gfx: 'elev' }),
    f('moving', 'Moving time', '2:46', 'h', 'Time in motion.'),
    f('elapsed', 'Total time', '3:21', 'h', 'With breaks. The gap to moving time shows how long you stood.', { rare: true }),
    f('avgspeed', 'Avg speed', '24.1', 'km/h', 'The average, good for planning the next tour.'),
    f('maxspeed', 'Max speed', '63.8', 'km/h', 'The fastest descent.'),
    f('temp', 'Temperature', '12', '°C', 'Explains many a weak ride afterwards.', { rare: true }),
    f('batt', 'Edge battery', '64', '%', 'Will the battery last until tonight? On multi-day tours it decides.', { rare: true }),
  ] },
];
export const PAGE = Object.fromEntries(PAGES.map((p) => [p.id, p]));

/** Replacement fields when a sensor is missing (the bike has no power pedals, no cadence sensor). */
const ALT = {
  speed: f('speed', 'Speed', '24.1', 'km/h', 'Without the sensor the speed takes this place.'),
  hr: f('hr', 'Heart rate', '142', 'bpm', 'Without power pedals the heart rate takes this place.', { need: 'hr' }),
  time: f('moving', 'Moving time', '2:46', 'h', 'Without power pedals the moving time takes this place.'),
  lapspeed: f('lapspeed', 'Lap avg speed', '31.2', 'km/h', 'Without power pedals the lap speed takes this place.'),
};

export const KIND_LABEL = { easy: 'simple', mid: 'medium', deep: 'detailed' };

/** The default sensors: only the heart rate strap (the others are ticked by hand, they only change the suggestion). */
export const NO_SENSORS = { power: false, cadence: false, speed: false, hr: true };

const isMtb = (type = '') => /full|hardtail|mtb|mountain|trail|enduro|fully|e-?mtb/i.test(type);
const isGravel = (type = '') => /gravel/i.test(type);

/** The kind of a bike for the profile badge: Gravel, MTB, Road or Bike. */
export function rideType(bike) {
  const type = `${bike?.type ?? ''}`;
  if (isGravel(type)) return 'Gravel';
  if (isMtb(type)) return 'MTB';
  if (/road|renn/i.test(type)) return 'Road';
  return 'Bike';
}

/** The suggested pages for a bike's own profile, from its type and sensors. */
export function suggestPages(bike, sensors = NO_SENSORS) {
  const out = ['GA-1', 'GA-2'];
  const mtb = isMtb(bike?.type);
  if (sensors.power || sensors.cadence || !mtb) out.push('GA-3');
  if (sensors.power) out.push('GA-6', 'GA-7');
  if (mtb) out.push('GA-8');
  if (sensors.power || sensors.cadence) out.push('GA-9');
  out.push('GA-10');
  return out;
}
/** 1a: the «Bikepacking» profile. */
export const BIKEPACKING_PAGES = ['GA-1', 'GA-3', 'GA-4', 'GA-5', 'GA-10'];

/** The Garmin setup of a bike: the stored one, or the suggestion (stored: false). */
export function garminOf(bike) {
  if (bike?.garmin?.profiles?.length) return { sensors: { ...NO_SENSORS, ...bike.garmin.sensors }, profiles: bike.garmin.profiles, fields: bike.garmin.fields ?? {}, done: bike.garmin.done ?? {}, stored: true };
  const sensors = { ...NO_SENSORS, ...bike?.garmin?.sensors };
  const profiles = [{ id: 'own', name: bike?.name ?? '', own: true, pages: suggestPages(bike, sensors), off: [] }];
  if (isGravel(bike?.type)) profiles.push({ id: 'bp', name: 'Bikepacking', pages: [...BIKEPACKING_PAGES], off: [] });
  return { sensors, profiles, fields: {}, done: {}, stored: false };
}

/** What to store on the bike (bike.garmin) from a setup. */
export const toStore = (g) => ({ sensors: { ...g.sensors }, profiles: g.profiles.map((p) => ({ ...p, pages: [...p.pages], off: [...(p.off ?? [])] })), fields: structuredClone(g.fields ?? {}), done: structuredClone(g.done ?? {}) });

/** The name a profile shows: the bike's own profile follows the bike's name. */
export const profileName = (p, bike) => (p.own ? bike?.name ?? p.name : p.name);

/** The fields of a page on one device, after sensors (need/alt) and the hidden fields (limit: at most MAX_FIELDS). */
export function fieldsOf(pageId, device, sensors = NO_SENSORS, hidden = null, limit = true) {
  const page = PAGE[pageId];
  if (!page) return [];
  // power pedals measure the cadence too
  const has = (need) => !need || !!sensors[need] || (need === 'cadence' && !!sensors.power);
  const list = [];
  for (const x of page.fields) {
    if (has(x.need)) list.push(x);
    else if (x.alt && ALT[x.alt] && !list.some((y) => y.k === ALT[x.alt].k) && !page.fields.some((y) => y.k === ALT[x.alt].k && has(y.need))) list.push({ ...ALT[x.alt], instead: x.k });
  }
  const hide = hidden ?? (device === '540' ? page.drop540 ?? [] : []);
  const shown = list.filter((x) => !hide.includes(x.k));
  return limit ? shown.slice(0, MAX_FIELDS[device] ?? 8) : shown;
}

/** The fields hidden on a device (stored, or the default: on the 540 the page's drop540). */
export const hiddenOf = (g, pageId, device) => g.fields?.[pageId]?.[device] ?? (device === '540' ? PAGE[pageId]?.drop540 ?? [] : []);

/** All fields a page could show with these sensors (for the field list), with on1040 / on540. */
export function fieldRows(g, pageId) {
  const all = fieldsOf(pageId, '1040', g.sensors, []);
  const on = Object.fromEntries(DEVICES.map((d) => [d, new Set(fieldsOf(pageId, d, g.sensors, hiddenOf(g, pageId, d)).map((x) => x.k))]));
  return all.map((x) => ({ ...x, on: Object.fromEntries(DEVICES.map((d) => [d, on[d].has(x.k)])) }));
}

/** Switch one field on a device. 2b: the 540 refuses a 7th field, and a page keeps one field (both return null). */
export function toggleField(g, pageId, device, key) {
  const hidden = [...hiddenOf(g, pageId, device)];
  const at = hidden.indexOf(key);
  if (at >= 0) {
    hidden.splice(at, 1);
    if (fieldsOf(pageId, device, g.sensors, hidden, false).length > MAX_FIELDS[device]) return null;
  } else {
    if (fieldsOf(pageId, device, g.sensors, hidden, false).length <= 1) return null;
    hidden.push(key);
  }
  return { ...g, fields: { ...g.fields, [pageId]: { ...g.fields?.[pageId], [device]: hidden } } };
}

/** Rows of the drawing: a graphic gets a row of its own, the numbers go in rows of two (three at the end of a long page). */
export function layout(fields) {
  const rows = [];
  let run = [];
  const total = fields.length;
  const flush = () => {
    if (!run.length) return;
    if (total <= 3) for (const x of run) rows.push([x]);
    else {
      let i = 0;
      if (run.length % 2 && total <= 4) rows.push([run[i++]]);
      while (i < run.length) {
        const take = run.length - i === 3 ? 3 : 2;
        rows.push(run.slice(i, i + take));
        i += take;
      }
    }
    run = [];
  };
  for (const x of fields) {
    if (x.gfx) { flush(); rows.push([x]); } else run.push(x);
  }
  flush();
  return rows;
}

/** Switch a page of a profile on or off («on the Edge»). */
export function togglePage(g, profileId, pageId) {
  return { ...g, profiles: g.profiles.map((p) => (p.id !== profileId ? p : { ...p, off: (p.off ?? []).includes(pageId) ? p.off.filter((x) => x !== pageId) : [...(p.off ?? []), pageId] })) };
}
/** Add a page to a profile (at its place in GA order). */
export function addPage(g, profileId, pageId) {
  const order = PAGES.map((p) => p.id);
  return { ...g, profiles: g.profiles.map((p) => (p.id !== profileId || p.pages.includes(pageId) ? p : { ...p, pages: [...p.pages, pageId].sort((a, b) => order.indexOf(a) - order.indexOf(b)), off: (p.off ?? []).filter((x) => x !== pageId) })) };
}
/** Remove a page from a profile (it goes back to «Add a page»). */
export function removePage(g, profileId, pageId) {
  return { ...g, profiles: g.profiles.map((p) => (p.id !== profileId ? p : { ...p, pages: p.pages.filter((x) => x !== pageId), off: (p.off ?? []).filter((x) => x !== pageId) })) };
}
/** A new profile: «Bikepacking» gets its pages, any other name the bike's suggestion. */
export function addProfile(g, bike, name, id = `p-${Date.now().toString(36)}`) {
  const bp = /bikepacking/i.test(name);
  return { ...g, profiles: [...g.profiles, { id, name, pages: bp ? [...BIKEPACKING_PAGES] : suggestPages(bike, g.sensors), off: [] }] };
}
export const renameProfile = (g, id, name) => ({ ...g, profiles: g.profiles.map((p) => (p.id === id ? { ...p, name } : p)) });
/** The bike's own profile stays; the others can go. */
export const removeProfile = (g, id) => ({ ...g, profiles: g.profiles.filter((p) => p.own || p.id !== id) });

/** Sensors changed: the bike's own profile gets the new suggestion as long as nobody changed its pages. */
export function setSensor(g, bike, key, on) {
  const sensors = { ...g.sensors, [key]: on };
  const before = suggestPages(bike, g.sensors).join();
  const profiles = g.profiles.map((p) => (p.own && p.pages.join() === before && !(p.off ?? []).length ? { ...p, pages: suggestPages(bike, sensors) } : p));
  return { ...g, sensors, profiles };
}

/** «Set up on the device?»: done[profileId:pageId] = { 1040: day, 540: day, ciq: day }. */
export const doneKey = (profileId, pageId) => `${profileId}:${pageId}`;
export function toggleDone(g, profileId, pageId, what, day) {
  const k = doneKey(profileId, pageId);
  const cur = { ...g.done?.[k] };
  if (cur[what]) delete cur[what];
  else cur[what] = day;
  return { ...g, done: { ...g.done, [k]: cur } };
}

/** Copy the Garmin setup of another bike (profiles, pages and fields; not its sensors and ticks). */
export const copyFrom = (other, bike) => ({ ...toStore(garminOf(other)), sensors: { ...garminOf(bike).sensors }, done: {} });

/** The pages a profile shows on the Edge (switched on), in order. */
export const onPages = (p) => p.pages.filter((x) => !(p.off ?? []).includes(x));
