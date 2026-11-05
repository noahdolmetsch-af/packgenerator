/**
 * «Gewitter-Hinweis mit Uhrzeit» (Noah 04.11.2026 «5 alle»): when thunderstorms are possible in the next 36
 * hours, as time spans («today 15:00–18:00»), not only «from 15:00». Built on the one rule of the weather
 * core (kern.js `thundery`). A hint for planning, never a rating of danger. Pure functions, tested in
 * tests/wetter-gewitter.test.js.
 */
import { thundery, localDate } from './kern.js';

const HOUR = 36e5;

/**
 * The spans of thundery hours from the start of the current hour for n hours; hours next to each other (or one
 * hour apart) belong to one span. → [{ from, to (end of the last hour), day: 'today' | 'tomorrow' | 'later',
 * rainP (highest chance in the span, % | null) }].
 */
export function thunderSpans(core, now = Date.now(), n = 36) {
  const start = Math.floor(now / HOUR) * HOUR;
  const off = core?.offset ?? 0;
  const hours = (core?.hours ?? []).filter((h) => h.ms >= start - 1 && h.ms < start + n * HOUR).sort((a, b) => a.ms - b.ms);
  const spans = [];
  for (const h of hours) {
    if (!thundery(h)) continue;
    const last = spans[spans.length - 1];
    if (last && h.ms - last.to <= HOUR) {
      last.to = h.ms + HOUR;
      if (typeof h.rainP === 'number') last.rainP = Math.max(last.rainP ?? 0, h.rainP);
    } else spans.push({ from: h.ms, to: h.ms + HOUR, rainP: typeof h.rainP === 'number' ? h.rainP : null });
  }
  const today = localDate(now, off);
  const tomorrow = localDate(now + 24 * HOUR, off);
  return spans.map((s) => {
    const d = localDate(s.from, off);
    return { ...s, day: d === today ? 'today' : d === tomorrow ? 'tomorrow' : 'later' };
  });
}
