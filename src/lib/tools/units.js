/**
 * Paket L «Werkzeugkasten» (#7 Masse umrechnen ohne Internet): fixed factors, no connection needed.
 * Each kind has units with a factor to its base unit (temperature has its own formulas).
 * Labels are English keys for t(). Pure, tested in tests/werkzeugkasten.test.js.
 */
export const UNIT_KINDS = [
  { key: 'length', label: 'Length', units: [['km', 1000], ['m', 1], ['cm', 0.01], ['mi', 1609.344], ['ft', 0.3048], ['in', 0.0254]] },
  { key: 'weight', label: 'Weight|unit', units: [['kg', 1], ['g', 0.001], ['lb', 0.45359237], ['oz', 0.028349523125]] },
  { key: 'temp', label: 'Temperature', units: [['°C'], ['°F']] },
  { key: 'speed', label: 'Speed', units: [['km/h', 1], ['m/s', 3.6], ['mph', 1.609344], ['min/km'], ['kn', 1.852]] },
  { key: 'volume', label: 'Volume', units: [['l', 1], ['dl', 0.1], ['ml', 0.001], ['gal', 3.785411784], ['fl oz', 0.0295735295625]] },
  { key: 'pressure', label: 'Tyre pressure', units: [['bar', 1], ['psi', 0.0689475729], ['kPa', 0.01]] },
  { key: 'height', label: 'Climbing', units: [['m', 1], ['ft', 0.3048]] },
];

export const kindOf = (key) => UNIT_KINDS.find((k) => k.key === key) ?? UNIT_KINDS[0];

/** value in unit `from` → unit `to` of the kind; null when it does not work (empty, 0 min/km). */
export function convert(kind, value, from, to) {
  const v = Number(String(value ?? '').replace(',', '.').replace(/[’'\s]/g, ''));
  if (String(value ?? '').trim() === '' || !Number.isFinite(v)) return null;
  const k = kindOf(kind);
  if (k.key === 'temp') {
    if (from === to) return v;
    return from === '°C' ? (v * 9) / 5 + 32 : ((v - 32) * 5) / 9;
  }
  const f = (u) => k.units.find((x) => x[0] === u);
  if (!f(from) || !f(to)) return null;
  // pace (min/km) is the inverse of speed
  let base;
  if (from === 'min/km') {
    if (v <= 0) return null;
    base = 60 / v;
  } else base = v * f(from)[1];
  if (to === 'min/km') return base > 0 ? 60 / base : null;
  return base / f(to)[1];
}

/** Rounded for the screen: 3 significant places after the point at most. */
export const roundUnit = (v) => (v == null ? null : Math.abs(v) >= 100 ? Math.round(v * 10) / 10 : Math.round(v * 1000) / 1000);
