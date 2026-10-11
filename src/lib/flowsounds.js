/**
 * Hobby pages 2 «Kissenzeit» (B1, B2, B7; H4a): seven built-in sounds, made with the Web Audio API,
 * no audio file. Each sound is a small table of voices (sine partials with a loudness, a rise and a
 * decay, or a short noise through a band-pass), so `voices()` is pure and tested; `playSound()` turns
 * it into oscillators at a given time on the audio clock.
 *
 * In the background (B7): at the start and after «Weiter» every coming stroke is planned ahead on the
 * audio clock (`schedulePlan`), so it sounds on time even when the page's timers sleep. Pause and stop
 * cancel the plan. The countdown's own check (flowtimer.js dueBowls) stays as the safety net: a stroke
 * the audio clock did not reach (an iPhone stops audio when locked) sounds when the page wakes up.
 * «Vibration only» uses navigator.vibrate (an iPhone cannot: the page says so).
 */

/** The seven sounds: id, English name (German via t()), the kind of voice. */
export const SOUNDS = [
  { id: 'bowlHigh', name: 'Singing bowl bright' },
  { id: 'bowlLow', name: 'Singing bowl deep' },
  { id: 'gong', name: 'Gong' },
  { id: 'tingsha', name: 'Cymbals (tingsha)', sugg: true },
  { id: 'wood', name: 'Wood block', sugg: true },
  { id: 'bell', name: 'Soft bell', sugg: true },
  { id: 'vibrate', name: 'Vibration only', sugg: true },
];
export const SOUND_IDS = SOUNDS.map((s) => s.id);
/** The sound for the start and the end, and the one in between, unless chosen otherwise. */
export const DEFAULT_END_SOUND = 'bowlLow';
export const DEFAULT_SOUND = 'bowlHigh';
export const soundOk = (id, fallback = DEFAULT_SOUND) => (SOUND_IDS.includes(id) ? id : fallback);
export const soundInfo = (id) => SOUNDS.find((s) => s.id === id) ?? SOUNDS[0];

/** A bowl: inharmonic partials, two slightly detuned voices each (the slow beating of a real bowl). */
const BOWL = [
  [1, 1, 9],
  [2.76, 0.55, 6.5],
  [5.4, 0.3, 4],
  [8.93, 0.16, 2.6],
  [13.34, 0.08, 1.6],
];
const bowl = (f0) => BOWL.flatMap(([r, amp, decay]) => [-0.6, 0.6].map((d) => ({ type: 'sine', freq: f0 * r + d, amp: amp * 0.5, attack: 0.012, decay, at: 0 })));

/**
 * The voices of one sound: [{ type: 'sine'|'noise', freq, amp, attack, decay, at, q? }]; times in
 * seconds from the stroke. «Vibration only» has none.
 */
export function voices(id) {
  switch (id) {
    case 'bowlHigh':
      return bowl(330);
    case 'bowlLow':
      return bowl(196);
    case 'gong': {
      // many partials, a slow swell, a long tail
      const ratios = [1, 1.47, 2.03, 2.56, 3.1, 3.92, 4.6, 5.33];
      return ratios.map((r, i) => ({ type: 'sine', freq: 98 * r, amp: 0.6 / (1 + i * 0.6), attack: 0.35 + i * 0.05, decay: 11 - i, at: 0 }));
    }
    case 'tingsha':
      // two high, slightly detuned strokes
      return [0, 0.32].flatMap((at, k) =>
        [
          [1, 0.5, 3.2],
          [2.71, 0.22, 2],
          [4.1, 0.1, 1.2],
        ].map(([r, amp, decay]) => ({ type: 'sine', freq: 2093 * r + (k ? 7 : 0), amp, attack: 0.004, decay, at })),
      );
    case 'wood':
      // a short noise through a band-pass, plus a little body
      return [
        { type: 'noise', freq: 950, q: 9, amp: 0.9, attack: 0.002, decay: 0.12, at: 0 },
        { type: 'sine', freq: 640, amp: 0.35, attack: 0.002, decay: 0.09, at: 0 },
      ];
    case 'bell':
      // almost harmonic, a soft attack
      return [
        [1, 0.6, 5],
        [2, 0.3, 3.5],
        [3.01, 0.16, 2.4],
        [4.2, 0.08, 1.6],
      ].map(([r, amp, decay]) => ({ type: 'sine', freq: 523 * r, amp, attack: 0.03, decay, at: 0 }));
    default:
      return [];
  }
}
/** How long a sound rings (seconds). */
export const soundLength = (id) => voices(id).reduce((m, v) => Math.max(m, v.at + v.decay), 0);

/**
 * The strokes still to come in a running timer: [{ sec, sound, end }]. tm: flowtimer.js (bowls,
 * played, targetSec; and for a session sound, endSound, marks with their own sound).
 */
export function strokesOf(tm, elapsed = 0) {
  if (!tm) return [];
  const own = new Map((tm.marks ?? []).filter((m) => m?.sound).map((m) => [m.sec, m.sound]));
  return (tm.bowls ?? [])
    .filter((s) => s > elapsed && !(tm.played ?? []).includes(s))
    .map((sec) => {
      const end = sec === 0 || sec === tm.targetSec;
      return { sec, end, sound: end ? soundOk(tm.endSound, DEFAULT_END_SOUND) : soundOk(own.get(sec) ?? tm.sound, DEFAULT_SOUND) };
    });
}
/** The sound of one stroke of a timer (start/end or in between). */
export const soundAt = (tm, sec) => (sec === 0 || sec === tm?.targetSec ? soundOk(tm?.endSound, DEFAULT_END_SOUND) : soundOk((tm?.marks ?? []).find((m) => m.sec === sec)?.sound ?? tm?.sound, DEFAULT_SOUND));

/* ---------- the sound (not in the tests: it needs a browser) ---------- */
let ctx = null;
let master = null;
let volume = 0.8;
function audio() {
  try {
    const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}
/** Wake the audio on a tap (the browser's rule). */
export const wakeSounds = () => !!audio();
/** The volume 0…1 of every sound (also of the strokes already planned). */
export function setVolume(v) {
  volume = Math.max(0, Math.min(1, Number(v) || 0));
  if (master && ctx) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
}
let noiseBuf = null;
function noise(c) {
  if (noiseBuf) return noiseBuf;
  noiseBuf = c.createBuffer(1, Math.round(c.sampleRate * 0.3), c.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}
/** One stroke of a sound, `delay` seconds from now. Returns the nodes (to cancel) or null. */
export function playSound(id, delay = 0, gain = 0.4) {
  if (id === 'vibrate') {
    if (delay <= 0) vibrate();
    return null;
  }
  const c = audio();
  if (!c) return null;
  const t0 = c.currentTime + 0.02 + Math.max(0, delay);
  const out = c.createGain();
  out.gain.value = gain;
  out.connect(master);
  const nodes = [];
  for (const v of voices(id)) {
    const env = c.createGain();
    const ts = t0 + v.at;
    env.gain.setValueAtTime(0.0001, ts);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, v.amp), ts + v.attack);
    env.gain.exponentialRampToValueAtTime(0.0001, ts + v.attack + v.decay);
    let src;
    if (v.type === 'noise') {
      src = c.createBufferSource();
      src.buffer = noise(c);
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = v.freq;
      bp.Q.value = v.q ?? 5;
      src.connect(bp).connect(env);
    } else {
      src = c.createOscillator();
      src.type = 'sine';
      src.frequency.value = v.freq;
      src.connect(env);
    }
    env.connect(out);
    src.start(ts);
    src.stop(ts + v.attack + v.decay + 0.1);
    nodes.push(src);
  }
  return { nodes, at: t0, out };
}
/** «Vibration only»: true when the device can (an iPhone cannot). */
export const canVibrate = () => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
export function vibrate() {
  try {
    if (canVibrate()) navigator.vibrate([220, 120, 220]);
  } catch {
    /* no vibration */
  }
}

/* ---------- planned ahead on the audio clock (B7) ---------- */
let planned = new Map(); // sec → { nodes, at }
/** Cancel every planned stroke (pause, stop, a new plan). */
export function cancelPlan() {
  for (const p of planned.values()) for (const n of p.nodes) {
    try {
      n.stop(0);
      n.disconnect();
    } catch {
      /* already over */
    }
  }
  planned = new Map();
}
/** Plan the strokes still to come (strokesOf) from `elapsed` on. «Vibration only» is left to the safety net. */
export function schedulePlan(strokes, elapsed) {
  cancelPlan();
  if (!audio()) return 0;
  for (const s of strokes) {
    if (s.sound === 'vibrate') continue;
    const p = playSound(s.sound, s.sec - elapsed, s.end ? 0.45 : 0.38);
    if (p) planned.set(s.sec, p);
  }
  return planned.size;
}
/**
 * The safety net asks: did the audio clock already play the stroke at `sec`? Only when the audio ran
 * and its clock passed the planned time; else the planned one is cancelled and the caller plays it now.
 */
export function playedByPlan(sec) {
  const p = planned.get(sec);
  if (!p) return false;
  if (ctx && ctx.state === 'running' && ctx.currentTime >= p.at - 0.05) return true;
  for (const n of p.nodes) {
    try {
      n.stop(0);
    } catch {
      /* over */
    }
  }
  planned.delete(sec);
  return false;
}
