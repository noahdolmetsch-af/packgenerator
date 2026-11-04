/**
 * «Regen in den nächsten 24 Stunden» (Noah 04.11.2026 «2a»): one bar per hour from the kept weather core
 * (wetter/kern.js), so the page can say «rain from 16:00, strongest around 18:00» even when the Landi radar
 * cannot be shown in a window. Pure functions, tested in tests/wetter-regen24.test.js.
 */
import { wet } from './kern.js';

const fin = (x) => typeof x === 'number' && Number.isFinite(x);
const HOUR = 36e5;

/**
 * The 24 hours from the start of the current hour.
 * → { bars: [{ ms, mm, p, wet }], max (mm/h, at least 1), from (ms | null), to (ms | null), peak (ms | null),
 *     total (mm), nowWet (bool), dry (bool) } or null when the core has no hours in that range.
 */
export function rainStrip(core, now = Date.now(), n = 24) {
  const start = Math.floor(now / HOUR) * HOUR;
  const hours = (core?.hours ?? []).filter((h) => h.ms >= start - 1 && h.ms < start + n * HOUR);
  if (!hours.length) return null;
  const bars = hours.map((h) => ({ ms: h.ms, mm: fin(h.rainMm) ? Math.max(0, h.rainMm) : 0, p: fin(h.rainP) ? h.rainP : null, wet: wet(h) }));
  const wetBars = bars.filter((b) => b.wet);
  const peak = bars.reduce((a, b) => (b.mm > (a?.mm ?? 0) ? b : a), null);
  const nowWet = bars[0].wet;
  // the first wet hour after the dry one, or the end of the rain that already falls
  const from = wetBars.length ? wetBars[0].ms : null;
  let to = null;
  if (nowWet) {
    let i = 0;
    while (i < bars.length && bars[i].wet) i++;
    to = i < bars.length ? bars[i].ms : null;
  }
  return {
    bars,
    max: Math.max(1, ...bars.map((b) => b.mm)),
    from,
    to,
    peak: peak && peak.mm > 0 ? peak.ms : null,
    total: Math.round(bars.reduce((s, b) => s + b.mm, 0) * 10) / 10,
    nowWet,
    dry: wetBars.length === 0,
  };
}

/** Bar height in percent of the strip (a dry hour keeps a thin line, a wet hour at least a visible stub). */
export const barPct = (b, max) => (b.mm <= 0 ? (b.wet ? 8 : 3) : Math.max(8, Math.min(100, Math.round((b.mm / max) * 100))));
