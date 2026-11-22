/**
 * «Belag und Schwierigkeit» (Noah 05.11.2026 «4a», Thread «Verbessern: Routing und Navigation»): BRouter tells in its answer
 * (properties.messages, one row per stretch: its length and the OpenStreetMap tags of the way) what the way is
 * made of. The app adds it up (paved, unpaved, unclear, rough, steps) and warns where it matters for the way of
 * riding chosen in «Wie fährst du?». Only a hint from map data: tags can be missing or old, so unclear stretches
 * are named as unclear and never counted as good. The reserve routers give no such data (no line then).
 * Pure functions, tested in tests/belag.test.js; shown by SurfaceNote.svelte.
 */

const PAVED = new Set(['asphalt', 'paved', 'concrete', 'concrete:plates', 'concrete:lanes', 'paving_stones', 'sett', 'cobblestone', 'chipseal', 'metal', 'wood']);
const UNPAVED = new Set(['unpaved', 'gravel', 'fine_gravel', 'compacted', 'ground', 'dirt', 'earth', 'grass', 'sand', 'mud', 'pebblestone', 'rock', 'gravel;grass', 'grass_paver', 'clay', 'woodchips', 'snow', 'ice']);
/** Ways that are paved when the map says nothing (the OpenStreetMap habit for roads). */
const ROAD = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street', 'service', 'cycleway', 'road', 'primary_link', 'secondary_link', 'tertiary_link', 'trunk_link']);
const ROUGH_SMOOTH = new Set(['bad', 'very_bad', 'horrible', 'very_horrible', 'impassable']);
const ROUGH_GRADE = new Set(['grade4', 'grade5']);

const tagsOf = (s) => Object.fromEntries(String(s ?? '').split(/\s+/).filter((x) => x.includes('=')).map((x) => { const i = x.indexOf('='); return [x.slice(0, i), x.slice(i + 1)]; }));

/** The kind of one stretch from its tags: 'paved' | 'unpaved' | 'unknown'. */
export function kindOfWay(tags = {}) {
  const s = tags.surface;
  if (s) return PAVED.has(s) ? 'paved' : UNPAVED.has(s) ? 'unpaved' : 'unknown';
  if (tags.highway === 'steps') return 'unknown';
  if (ROAD.has(tags.highway)) return 'paved';
  if (tags.highway === 'track' && (tags.tracktype === 'grade1')) return 'paved';
  if (tags.highway === 'track' && ['grade3', 'grade4', 'grade5'].includes(tags.tracktype)) return 'unpaved';
  return 'unknown';
}

/** Is a stretch rough? (bad smoothness, a very poor track, a mountain bike trail or a mountain hiking path) */
export function isRough(tags = {}) {
  if (ROUGH_SMOOTH.has(tags.smoothness) || ROUGH_GRADE.has(tags.tracktype)) return true;
  const mtb = Number(tags['mtb:scale']);
  if (Number.isFinite(mtb) && mtb >= 2) return true;
  return /^(demanding_)?(mountain_hiking|alpine_hiking|demanding_alpine_hiking|difficult_alpine_hiking)$/.test(String(tags.sac_scale ?? ''));
}

/**
 * BRouter's `messages` table (first row = the column names) → { km, paved, unpaved, unknown, rough, steps } in km
 * (steps in metres under `stepsM`), or null when the answer has no usable table.
 */
export function surfaceOf(messages) {
  if (!Array.isArray(messages) || messages.length < 2 || !Array.isArray(messages[0])) return null;
  const head = messages[0];
  const di = head.indexOf('Distance');
  const wi = head.indexOf('WayTags');
  if (di < 0 || wi < 0) return null;
  const m = { paved: 0, unpaved: 0, unknown: 0, rough: 0, stepsM: 0 };
  let total = 0;
  for (const row of messages.slice(1)) {
    const d = Number(row?.[di]);
    if (!(d > 0)) continue;
    const tags = tagsOf(row[wi]);
    total += d;
    m[kindOfWay(tags)] += d;
    if (isRough(tags)) m.rough += d;
    if (tags.highway === 'steps') m.stepsM += d;
  }
  if (!(total > 0)) return null;
  const km = (x) => Math.round(x / 10) / 100;
  return { km: km(total), paved: km(m.paved), unpaved: km(m.unpaved), unknown: km(m.unknown), rough: km(m.rough), stepsM: Math.round(m.stepsM) };
}

/** Share of a part in percent (whole numbers). */
export const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/**
 * The warnings for a way and the way of riding (BRouter profile): [{ key, vars }] with English keys for t().
 * Road and quiet roads warn about unpaved parts, gravel about rough ones, everybody about steps.
 */
export function warnOf(s, profile = 'trekking') {
  if (!s) return [];
  const out = [];
  const share = s.km > 0 ? s.unpaved / s.km : 0;
  const lim = profile === 'fastbike' ? 0.05 : 0.1;
  if ((profile === 'fastbike' || profile === 'trekking') && s.unpaved >= 0.3 && share >= lim) {
    out.push({ key: profile === 'fastbike' ? 'About {km} km of this way are unpaved. A road bike may find it hard.' : 'About {km} km of this way are unpaved. Check that your tyres suit it.', vars: { km: s.unpaved } });
  }
  if (s.stepsM >= 5) out.push({ key: 'Steps on the way ({m} m): you may have to carry the bike.', vars: { m: s.stepsM } });
  if (profile !== 'mtb' && s.rough >= 0.2) out.push({ key: 'Rough stretches (about {km} km): ride slowly.', vars: { km: s.rough } });
  return out;
}

/** The line about the surface: { key, vars } (English key for t()), or null without data. */
export function surfaceLine(s) {
  if (!s || !(s.km > 0)) return null;
  const vars = { paved: pct(s.paved, s.km), unpaved: pct(s.unpaved, s.km), unknown: pct(s.unknown, s.km) };
  return { key: vars.unknown >= 10 ? 'Surface: {paved} % paved, {unpaved} % unpaved, {unknown} % unclear' : 'Surface: {paved} % paved, {unpaved} % unpaved', vars };
}
