/**
 * «Kuhglocken» (Noah 03.11.2026, H1 aus dem Geheimmenü): the sound of the bell surprise behind the logo. Two cow bells
 * (a deeper and a higher one) ring in turn and fade out. Only when the switch «Cow bells» in Me › Appearance › Handling
 * is on (`ops.kuhglocke`, off by default): LogoRide.svelte asks it before it rings. A bell is a short sine with a few
 * inharmonic overtones, like struck metal. Nothing happens where the browser has no sound.
 */
export const BELLS = [
  { hz: 540, gain: 0.05, decay: 0.95 }, // the deeper bell
  { hz: 810, gain: 0.04, decay: 0.8 }, // the higher bell
];
/** The overtones of a struck bell: the ratio to the base note and how loud, compared with the base. */
export const OVERTONES = [
  { ratio: 1, level: 1 },
  { ratio: 2.76, level: 0.45 },
  { ratio: 5.4, level: 0.18 },
];
/** Which bell rings when (seconds after the start); the strokes get quieter, the bells swing out. */
export const STROKES = [
  { bell: 0, at: 0, vol: 1 },
  { bell: 1, at: 0.3, vol: 0.9 },
  { bell: 0, at: 0.62, vol: 0.8 },
  { bell: 1, at: 0.9, vol: 0.7 },
  { bell: 0, at: 1.35, vol: 0.5 },
  { bell: 1, at: 1.6, vol: 0.4 },
  { bell: 0, at: 2.05, vol: 0.25 },
];

/** Every single note to play: { hz, at, gain, decay }. Pure, so a test can read it. */
export function notes() {
  return STROKES.flatMap((s) => {
    const b = BELLS[s.bell];
    return OVERTONES.map((o) => ({ hz: b.hz * o.ratio, at: s.at, gain: b.gain * s.vol * o.level, decay: b.decay / (1 + 0.6 * (o.ratio - 1) / 4.4) }));
  });
}

/** The time until the last note has faded (seconds). */
export const bellLength = () => Math.max(...notes().map((n) => n.at + n.decay));

/** Rings the bells once; never throws. Returns true when it started a sound. */
export function ringBells() {
  try {
    const A = window.AudioContext ?? window.webkitAudioContext;
    if (!A) return false;
    const ctx = new A();
    const t0 = ctx.currentTime + 0.02;
    for (const n of notes()) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = n.hz;
      g.gain.setValueAtTime(0.0001, t0 + n.at);
      g.gain.exponentialRampToValueAtTime(n.gain, t0 + n.at + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.at + n.decay);
      o.connect(g).connect(ctx.destination);
      o.start(t0 + n.at);
      o.stop(t0 + n.at + n.decay + 0.02);
    }
    setTimeout(() => ctx.close?.(), Math.ceil(bellLength() * 1000) + 500);
    return true;
  } catch {
    return false; // no sound here
  }
}
