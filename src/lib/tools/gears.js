/**
 * Paket L «Werkzeugkasten» (Übersetzungs-Rechner, Noah 19.10.2026): chainring and cog → ratio, the metres
 * per crank turn and the speed at a cadence; the whole cassette as a table. The wheel comes from the tyre
 * (ETRTO width-diameter, e.g. 40-622). Pure, tested in tests/werkzeugkasten.test.js.
 */

/** Common wheels: rim diameter in mm (ETRTO) and a tyre width. Labels are names, not translated. */
export const WHEELS = [
  { key: '700x28', label: '700 × 28C', bead: 622, width: 28 },
  { key: '700x40', label: '700 × 40C (Gravel)', bead: 622, width: 40 },
  { key: '700x50', label: '29 × 2.0"', bead: 622, width: 50 },
  { key: '650bx47', label: '650B × 47', bead: 584, width: 47 },
  { key: '27.5x2.4', label: '27.5 × 2.4"', bead: 584, width: 61 },
  { key: '26x2.1', label: '26 × 2.1"', bead: 559, width: 54 },
];

/** Wheel circumference in mm from rim and tyre width (diameter + 2 × tyre height ≈ width). */
export const circumference = (bead, width) => Math.round(Math.PI * (bead + 2 * width));

/** Teeth as typed: «11-13-15» or «11,13,15» or «11 13 15»; only 6–60, sorted small to big. */
export function teethOf(s) {
  return [...new Set(String(s ?? '').split(/[^0-9]+/).map(Number).filter((n) => n >= 6 && n <= 60))].sort((a, b) => a - b);
}

/** One gear: ratio, metres per crank turn, km/h at the cadence (rpm). */
export function gear(ring, cog, circMm, rpm = 90) {
  if (!(ring > 0 && cog > 0 && circMm > 0)) return null;
  const ratio = ring / cog;
  const dev = (ratio * circMm) / 1000;
  return { ratio: Math.round(ratio * 100) / 100, dev: Math.round(dev * 100) / 100, kmh: Math.round(((dev * rpm * 60) / 1000) * 10) / 10 };
}

/** The table: every ring × every cog, the cogs from small (hard) to big (easy). */
export function gearTable(rings, cogs, circMm, rpm = 90) {
  return rings.map((r) => ({ ring: r, gears: cogs.map((c) => ({ cog: c, ...gear(r, c, circMm, rpm) })) }));
}

/** The range of a cassette: biggest cog / smallest cog in percent (e.g. 10-52 → 520 %). */
export const rangePct = (cogs) => (cogs.length > 1 ? Math.round((cogs.at(-1) / cogs[0]) * 100) : null);
