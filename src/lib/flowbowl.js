/**
 * v0.51.0 «Im Flow»: the singing bowl of the countdown (Noah 8). A bowl at the start and at the end,
 * plus optional bowls in between, per session or as the default:
 *   'none'     only start and end,
 *   'every'    every N minutes («regelmässig»),
 *   'marks'    at chosen minute marks («individuell»),
 *   'random'   N bowls at random times within the session («zufällig»), the same for one seed.
 * bowlTimes is pure (tested); strike() makes the sound with the Web Audio API: a few inharmonic
 * partials with a long decay, no audio file. Audio starts only after a tap (the browser's rule).
 */

export const BOWL_MODES = ['none', 'every', 'marks', 'random'];
export const BOWL_KEY = 'flowBowl';
export const DEFAULT_BOWL = { ends: true, mode: 'none', every: 5, marks: [], count: 2 };

/** A stored bowl setting made whole. */
export function bowlOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const marks = (Array.isArray(v.marks) ? v.marks : [])
    .map(Number)
    .filter((m) => Number.isFinite(m) && m > 0);
  return {
    ends: v.ends !== false,
    mode: BOWL_MODES.includes(v.mode) ? v.mode : 'none',
    every: Number(v.every) > 0 ? Math.max(1, Math.round(Number(v.every))) : DEFAULT_BOWL.every,
    marks: [...new Set(marks.map((m) => Math.round(m * 10) / 10))].sort((a, b) => a - b),
    count: Math.max(1, Math.min(10, Math.round(Number(v.count) || DEFAULT_BOWL.count))),
  };
}

/** A small seeded random generator (mulberry32): the same seed, the same times. */
export function rand(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Minute marks typed as text («3, 7,5 12») → [3, 7.5, 12]. */
export const parseMarks = (text = '') =>
  String(text)
    .replace(/(\d),(\d)/g, '$1.$2') // «7,5» is a decimal comma, «2, 7» a list
    .split(/[\s,;]+/)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0);

/**
 * The seconds at which a bowl sounds in a session of totalSec, sorted, each once.
 * Start (0) and end (totalSec) when ends; bowls in between never at the start or the end itself.
 * random: count times, at least 30 s from the start, the end and each other (fewer when it is short).
 */
export function bowlTimes(totalSec, setting = DEFAULT_BOWL, seed = 1) {
  const total = Math.max(0, Math.round(Number(totalSec) || 0));
  const s = bowlOf(setting);
  const between = [];
  if (s.mode === 'every') for (let x = s.every * 60; x < total; x += s.every * 60) between.push(x);
  if (s.mode === 'marks') for (const m of s.marks) between.push(Math.round(m * 60));
  if (s.mode === 'random') {
    const gap = 30;
    const r = rand(seed);
    const lo = gap;
    const hi = total - gap;
    for (let tries = 0; between.length < s.count && tries < 200 && hi > lo; tries++) {
      const x = Math.round(lo + r() * (hi - lo));
      if (between.every((y) => Math.abs(y - x) >= gap)) between.push(x);
    }
  }
  const inner = between.filter((x) => x > 0 && x < total);
  const all = s.ends ? [0, ...inner, total] : inner;
  return [...new Set(all)].sort((a, b) => a - b);
}

/** The next bowl after `elapsedSec` (seconds), or null. */
export const nextBowl = (times = [], elapsedSec = 0) => times.find((x) => x > elapsedSec) ?? null;

/* ---------- the sound (not in the tests: it needs a browser) ---------- */
/** Partials of a bowl: ratio to the fundamental, loudness, decay in seconds. Inharmonic on purpose. */
const PARTIALS = [
  [1, 1, 9],
  [2.76, 0.55, 6.5],
  [5.4, 0.3, 4],
  [8.93, 0.16, 2.6],
  [13.34, 0.08, 1.6],
];

let ctx = null;
/** The audio context, made or woken on a tap (call it from a click handler). */
export function wakeAudio() {
  try {
    const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** One stroke of the bowl, now. f0: the fundamental in Hz; gain 0…1. */
export function strike({ f0 = 196, gain = 0.35 } = {}) {
  const c = wakeAudio();
  if (!c) return false;
  const t0 = c.currentTime + 0.02;
  const out = c.createGain();
  out.gain.value = gain;
  out.connect(c.destination);
  for (const [ratio, amp, decay] of PARTIALS) {
    // two slightly detuned voices per partial: the slow beating of a real bowl
    for (const detune of [-0.6, 0.6]) {
      const o = c.createOscillator();
      const v = c.createGain();
      o.type = 'sine';
      o.frequency.value = f0 * ratio + detune;
      v.gain.setValueAtTime(0.0001, t0);
      v.gain.exponentialRampToValueAtTime(amp * 0.5, t0 + 0.012);
      v.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
      o.connect(v).connect(out);
      o.start(t0);
      o.stop(t0 + decay + 0.1);
    }
  }
  return true;
}
