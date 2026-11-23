/**
 * «Eine Regen-Startzeit für die ganze Seite» (Wetterseite aufräumen, Noah 23.11.2026 «ja»): the one place that says
 * WHEN it rains. Before, the page told four different times (the tour card, Today, «Rain in 3 hours», «The next
 * hours»), because each part read the hours of the forecast in its own way: a window that starts at 07:00 cuts the
 * rain that began at 05:00, a window that starts an hour ago counts an hour that is over, and Open-Meteo stamps
 * its rain at the END of the hour (or quarter), so «06:00» means the rain between 05:00 and 06:00.
 *
 * Rules (all parts use them):
 * - An hourly value stands for the hour BEFORE its time stamp: its span is [ms - 1 h, ms] (hourSpan). A 15-minute
 *   value the same for its quarter (parseRain15 shifts it to the quarter's start).
 * - Wet hours that touch make one run: { from, to } (rainRuns). The start of a run is the start of the first wet hour.
 * - The next three hours come from the 15-minute rain when it is there (it is finer), the rest of the day from the
 *   hours. The 15-minute rain wins inside its three hours: when it says dry, an hourly run inside them is left out.
 *
 * rainStory(core, quarters, now): the rest of today → { kind: 'dry' } | { kind: 'now', since, to } |
 *   { kind: 'later', from, to } (since / to: ms or null when not known; «since» is the start of a rain that already falls).
 * rainDay(core, date, fromH, toH): a day that is still to come, for the hours of the ride → the same shape.
 * rainOnDay(core, date, now, quarters, win): today → rainStory, another day → rainDay.
 * rainWords(story, t, hm): one short phrase for a line («dry», «rain since 05:00», «rain from 07:00»).
 *
 * Pure functions, tested in tests/wetter-regenzeit.test.js.
 */
import { wet, localDate, atLocal } from './kern.js';
import { rain15Strip, QUARTER } from './regen15.js';

const HOUR = 36e5;

/** The time an hourly value stands for: the hour before its stamp. */
export const hourSpan = (h) => ({ from: h.ms - HOUR, to: h.ms });

/** Wet hours that touch make one run → [{ from, to }] in time order. */
export function rainRuns(hours = []) {
  const out = [];
  for (const h of [...hours].filter(wet).sort((a, b) => a.ms - b.ms)) {
    const s = hourSpan(h);
    const last = out[out.length - 1];
    if (last && s.from <= last.to) last.to = Math.max(last.to, s.to);
    else out.push({ ...s });
  }
  return out;
}

/** The hours whose span lies in the local day `date` (stamps after 00:00 up to and with the next 00:00). */
const dayHours = (core, date) => {
  const off = core?.offset ?? 0;
  const a = atLocal(date, 0, off);
  const b = atLocal(date, 24, off);
  return (core?.hours ?? []).filter((h) => h.ms > a && h.ms <= b);
};

const shape = (run, now) => (!run ? { kind: 'dry' } : run.from <= now ? { kind: 'now', since: run.from, to: run.to } : { kind: 'later', from: run.from, to: run.to });

/** The rest of today from `now` on. quarters: the kept 15-minute rain ([{ ms, mm }]) or null. */
export function rainStory(core, quarters = null, now = Date.now()) {
  if (!core) return null;
  const day = localDate(now, core.offset ?? 0);
  const runs = rainRuns(dayHours(core, day)).filter((r) => r.to > now);
  const s = quarters ? rain15Strip(quarters, now) : null;
  if (!s) return shape(runs[0], now);
  const horizon = s.bars[s.bars.length - 1].ms + QUARTER;
  const runAt = (ms) => runs.find((r) => r.from <= ms + 1 && r.to >= ms);
  if (s.nowWet) {
    const r = runAt(now);
    return { kind: 'now', since: r ? r.from : null, to: s.to ?? (r && r.to > horizon ? r.to : null) };
  }
  if (!s.dry) {
    const r = runAt(s.from);
    return { kind: 'later', from: s.from, to: s.to ?? (r && r.to > horizon ? r.to : null) };
  }
  // dry for the whole quarter range: an hourly run inside it is not believed; one that reaches past it starts at its end
  const rest = runs.map((r) => ({ from: Math.max(r.from, horizon), to: r.to })).filter((r) => r.to > r.from);
  return shape(rest[0], now);
}

/** A day still to come: the rain that touches the hours of the ride (fromH–toH local), from its true start. */
export function rainDay(core, date, fromH = 7, toH = 20) {
  if (!core) return null;
  const off = core.offset ?? 0;
  const a = atLocal(date, fromH, off);
  const b = atLocal(date, toH, off);
  const run = rainRuns(dayHours(core, date)).find((r) => r.to > a && r.from < b);
  if (!run) return { kind: 'dry' };
  return { kind: 'later', from: run.from, to: run.to, atStart: run.from <= a };
}

/** Today → rainStory (with the quarters), another day → rainDay. win: [fromH, toH] of the ride. */
export function rainOnDay(core, date, now = Date.now(), quarters = null, win = [7, 20]) {
  if (!core) return null;
  return date === localDate(now, core.offset ?? 0) ? rainStory(core, quarters, now) : rainDay(core, date, win[0], win[1]);
}

/** One short phrase. t and hm come from the page (the texts are spelled out here, so the German list finds them). */
export function rainWords(story, t, hm) {
  if (!story) return '';
  if (story.kind === 'dry') return t('dry');
  if (story.kind === 'now') return story.since ? t('rain since {at}', { at: hm(story.since) }) : t('it rains now');
  return t('rain from {at}', { at: hm(story.from) });
}
