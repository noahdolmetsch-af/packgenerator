/**
 * Paket K #285 «Handschuh-Modus» (Noah 19.10.2026 «4a und kann manuell geändert werden»): big buttons
 * and bigger text, so the app works with gloves. It switches itself on below 5 °C or on a ski tour
 * day, and can be set by hand: «Automatisch», «An», «Aus» (Ich › Darstellung › Bedienung, and on
 * Unterwegs). Only on this device (localStorage).
 * The pure part; handschuh.svelte.js holds the live state, handschuh.css the look.
 */
export const GLOVE_KEY = 'ops.glove';
/** The automatic day of today: { day, on, why } (set by Unterwegs, where the weather is known). */
export const GLOVE_AUTO_KEY = 'ops.gloveAuto';
export const MODES = [
  { key: 'auto', name: 'Automatic' },
  { key: 'on', name: 'On|switch' },
  { key: 'off', name: 'Off|switch' },
];
/** Below this temperature the automatic mode switches on. */
export const COLD_C = 5;

export const modeOf = (v) => (MODES.some((m) => m.key === v) ? v : 'auto');

/** Should the automatic mode be on? temp: the coldest °C of now (or null), ski: a ski tour today. → { on, why } */
export function autoGlove({ temp = null, ski = false } = {}) {
  if (ski) return { on: true, why: 'ski' };
  if (Number.isFinite(temp) && temp < COLD_C) return { on: true, why: 'cold' };
  return { on: false, why: null };
}

/** The stored automatic day, read safely: on only for the same day. */
export function autoToday(raw, today) {
  try {
    const v = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return v && v.day === today && v.on === true ? { on: true, why: v.why ?? null } : { on: false, why: null };
  } catch {
    return { on: false, why: null };
  }
}

/** Is the mode on now? */
export const gloveOn = (mode, auto) => mode === 'on' || (mode === 'auto' && !!auto?.on);
