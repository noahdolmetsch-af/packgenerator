/**
 * Abbiege-Hinweise vom Router (Noah 23.11.2026 «2a»): brouter.de sends «voicehints» with every way it plans:
 * one entry per junction, [indexInTrack, command, roundaboutExit, distanceToNext, angle]. They know the real
 * junctions and roundabouts, so the live map uses them for a way the router planned (detour, way to a goal)
 * and keeps the shape of the line (turns.js) for a GPX route and when the router sent none (reserve routers).
 *
 * The commands are BRouter's own (VoiceHint.java, mode timode=2): 1 straight on, 2/5 turn left/right,
 * 3/6 slightly, 4/7 sharply, 8/17 keep or exit left, 9/18 keep or exit right, 10/11/15 U-turn,
 * 13/14 roundabout (right or left traffic) with the exit number, 12 off route and 16 beeline (no hint).
 * Pure functions, tested in tests/brouterturns.test.js.
 */

const DIR = { 2: 'left', 3: 'slight-left', 4: 'sharp-left', 5: 'right', 6: 'slight-right', 7: 'sharp-right', 8: 'slight-left', 9: 'slight-right', 17: 'slight-left', 18: 'slight-right', 10: 'u-turn', 11: 'u-turn', 15: 'u-turn' };
const ROUNDABOUT = [13, 14];
/** A roundabout exit above this is no real exit (a data error): the hint is left out. */
const MAX_EXIT = 8;

/**
 * BRouter's voicehints → [{ i, dir, deg, exit? }] with i = the index in the line the page keeps.
 * keep: raw index → kept index (the router's points that were dropped as invalid); null = the same.
 */
export function hintsOf(voicehints, keep = null) {
  if (!Array.isArray(voicehints)) return undefined;
  const out = [];
  for (const h of voicehints) {
    if (!Array.isArray(h)) continue;
    const [raw, cmd, exit, , angle] = h.map(Number);
    const i = keep ? keep.get(raw) : raw;
    if (!Number.isInteger(i) || i < 0) continue;
    const deg = Number.isFinite(angle) && Math.abs(angle) <= 180 ? Math.round(Math.abs(angle)) : 90;
    if (ROUNDABOUT.includes(cmd)) {
      if (exit >= 1 && exit <= MAX_EXIT) out.push({ i, dir: 'roundabout', deg, exit });
    } else if (DIR[cmd]) out.push({ i, dir: DIR[cmd], deg });
  }
  return out;
}

/**
 * The turns of the page (like turnsOf in turns.js: [{ km, dir, deg, lat, lon, exit? }] in km order) from the
 * hints and the line [{ lat, lon, km }] that has them by index.
 */
export function turnsFromHints(hints = [], pts = []) {
  const out = [];
  for (const h of hints ?? []) {
    const p = pts[h.i];
    if (!p) continue;
    const km = Math.round(p.km * 1000) / 1000;
    if (out.length && out.at(-1).km === km) continue; // two hints on one spot: the first counts (the page keys the list by km)
    out.push({ km, dir: h.dir, deg: h.deg, lat: p.lat, lon: p.lon, ...(h.exit ? { exit: h.exit } : {}) });
  }
  return out.sort((a, b) => a.km - b.km);
}
