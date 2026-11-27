/**
 * «Lichter» (Noah 26.11.2026 «1a 2b 3 4a»): any number of lights (front, rear, helmet …), each with its own modes and
 * its own charging. You type how much of the charge a mode uses in how many minutes («7 % in 60 min») and how much a
 * charge gives («20 % in 23 min»); the app works out the hours of light and the charging time from that. Pure; the
 * page keeps the list in this browser. Tested in tests/lichter.test.js.
 *   light = { id, name, left: 'full'|'half'|'low', mode: modeId, modes: [{ id, name, pct, min }], charge: { pct, min } | null }
 */
import { lampPlan, LAMP_H, LAMP_FRAC } from './lamp.js';

export const LIGHTS_KEY = 'pg-live-lights';
export const MAX_LIGHTS = 8;
export const MAX_MODES = 6;

const num = (v) => {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.min(100000, Math.round(n * 10) / 10) : 0;
};
const txt = (v, n = 40) => String(v ?? '').trim().slice(0, n);
let seq = 0;
export const newId = () => `l${Date.now().toString(36)}${(seq++).toString(36)}`;

/** % of the charge per minute for «pct % in min minutes»; 0 when either is missing. */
export const ratePerMin = (pct, min) => (num(pct) > 0 && num(min) > 0 ? Math.min(100, num(pct)) / num(min) : 0);
/** Hours a full charge lasts on this mode (0 if the mode is not filled in). */
export const modeHours = (mode) => (ratePerMin(mode?.pct, mode?.min) > 0 ? Math.round((100 / ratePerMin(mode.pct, mode.min) / 60) * 10) / 10 : 0);
/** Minutes from empty to full for this charge (0 if not filled in). */
export const chargeMinutes = (charge) => (ratePerMin(charge?.pct, charge?.min) > 0 ? Math.round(100 / ratePerMin(charge.pct, charge.min)) : 0);
/** Minutes to charge from what is left (0..1) to full. */
export const chargeFrom = (charge, frac) => Math.round(chargeMinutes(charge) * (1 - Math.max(0, Math.min(1, frac))));
/** What a stop of `min` minutes at a socket gives: { pct, hours (on this mode) }, or null without a charge rate. */
export function chargeGain(light, min, mode = modeOf(light), frac = LAMP_FRAC[light?.left] ?? 1) {
  const r = ratePerMin(light?.charge?.pct, light?.charge?.min);
  if (!(r > 0) || !(min > 0)) return null;
  const pct = Math.round(Math.min((1 - frac) * 100, r * min) * 10) / 10;
  const h = modeHours(mode);
  return { pct, hours: h > 0 ? Math.round(((pct / 100) * h) * 10) / 10 : 0 };
}

const cleanMode = (m, i) => ({ id: txt(m?.id, 20) || `m${i + 1}`, name: txt(m?.name, 30), pct: num(m?.pct), min: num(m?.min) });
/** What was stored → a clean list (≤ 8 lights, ≤ 6 modes each); anything unreadable → []. */
export function cleanLights(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const ids = new Set();
  return list.slice(0, MAX_LIGHTS).map((l, i) => {
    let id = txt(l?.id, 20) || `l${i + 1}`;
    while (ids.has(id)) id += 'x';
    ids.add(id);
    const modes = (Array.isArray(l?.modes) ? l.modes : []).slice(0, MAX_MODES).map(cleanMode);
    const ch = { pct: num(l?.charge?.pct), min: num(l?.charge?.min) };
    return { id, name: txt(l?.name), left: ['full', 'half', 'low'].includes(l?.left) ? l.left : 'full', mode: modes.some((m) => m.id === l?.mode) ? l.mode : (modes[0]?.id ?? ''), modes, charge: ch.pct > 0 && ch.min > 0 ? ch : null };
  });
}

/** The one light of the first version (10 h on a full charge) as «% in minutes»: 10 h = 100 % in 600 min. */
export const starterLight = (name) => ({ id: newId(), name, left: 'full', mode: 'm1', modes: [{ id: 'm1', name: '', pct: 100, min: LAMP_H * 60 }], charge: null });

/** The old lamp of this browser (burn hours, steps, charge hours, what is left) → one light. */
export function fromOldLamp(old, name) {
  const o = old && typeof old === 'object' ? old : {};
  const burn = Number(o.burn) > 0 ? Number(o.burn) : LAMP_H;
  const table = o.table && typeof o.table === 'object' ? o.table : {};
  const steps = [1, 2, 3].filter((l) => Number(table[l]) > 0);
  const modes = steps.length ? steps.map((l) => ({ id: `m${l}`, name: String(l), pct: 100, min: Math.round(Number(table[l]) * 60) })) : [{ id: 'm1', name: '', pct: 100, min: Math.round(burn * 60) }];
  const mode = steps.includes(Number(o.level)) ? `m${o.level}` : modes.at(-1).id;
  const ch = Number(o.chargeH) > 0 ? { pct: 100, min: Math.round(Number(o.chargeH) * 60) } : null;
  return cleanLights([{ id: newId(), name, left: o.left, mode, modes, charge: ch }]);
}

export const modeOf = (light) => light?.modes?.find((m) => m.id === light.mode) ?? light?.modes?.[0] ?? null;
/** Modes that are filled in, the brightest (uses the charge fastest) first. */
export const usableModes = (light) => (light?.modes ?? []).filter((m) => modeHours(m) > 0).sort((a, b) => modeHours(a) - modeHours(b));

/**
 * For every light: the mode in use, the hours of light left, whether it lasts through the dark ahead and which mode would.
 *   → [{ light, mode, fullH, restH, plan: lampPlan | null, advice: { kind: 'ok'|'lower'|'none'|'day', mode } }]
 */
export function lightsPlan(lights = [], { lat, lon, now = Date.now(), endAt = null } = {}) {
  return lights.map((light) => {
    const mode = modeOf(light);
    const fullH = modeHours(mode) || LAMP_H;
    const frac = LAMP_FRAC[light.left] ?? 1;
    const plan = Number.isFinite(lat) && Number.isFinite(lon) ? lampPlan({ lat, lon, now, endAt, burnH: fullH, frac }) : null;
    let advice = { kind: 'day', mode: null };
    if (plan && plan.state !== 'day') {
      if (plan.state !== 'short') advice = { kind: 'ok', mode };
      else {
        // the brightest mode that still reaches the end of the dark
        const better = usableModes(light).find((m) => modeHours(m) * frac >= plan.darkH);
        advice = better ? { kind: 'lower', mode: better } : { kind: 'none', mode: null };
      }
    }
    return { light, mode, fullH, restH: Math.round(fullH * frac * 10) / 10, plan, advice };
  });
}

/** The state of the worst light: short > tight > ok > day. */
export const worstState = (plans) => ['short', 'tight', 'ok', 'day'].find((s) => plans.some((p) => p.plan?.state === s)) ?? 'day';

/** The share of a full charge a light used in `min` minutes of darkness (its mode in use), 0..100. */
export const usedPct = (light, min) => Math.min(100, Math.round(ratePerMin(modeOf(light)?.pct, modeOf(light)?.min) * Math.max(0, min)));
