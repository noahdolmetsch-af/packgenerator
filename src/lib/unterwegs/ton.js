/**
 * Paket X (Noah 20.10.2026 «2a»): the soft tone of «Zeit zu essen». Two low, quiet notes (a sine,
 * 523 and 659 Hz) that swell in and fade out, instead of a sharp beep. Nothing when the browser has
 * no sound; the line and the vibration stay.
 */
export const TONE = [
  { hz: 523.25, at: 0, len: 0.55 },
  { hz: 659.25, at: 0.35, len: 0.7 },
];
export const TONE_GAIN = 0.08;

export function softTone() {
  try {
    const A = window.AudioContext ?? window.webkitAudioContext;
    if (!A) return;
    const ctx = new A();
    const t0 = ctx.currentTime;
    for (const n of TONE) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = n.hz;
      g.gain.setValueAtTime(0.0001, t0 + n.at);
      g.gain.exponentialRampToValueAtTime(TONE_GAIN, t0 + n.at + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.at + n.len);
      o.connect(g).connect(ctx.destination);
      o.start(t0 + n.at);
      o.stop(t0 + n.at + n.len + 0.02);
    }
    setTimeout(() => ctx.close?.(), 1500);
  } catch {
    /* no sound here */
  }
}
