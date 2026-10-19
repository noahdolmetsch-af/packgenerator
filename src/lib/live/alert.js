/**
 * Paket U3 «Live-Karte»: the small signals of the live map, each wrapped so a phone without it stays quiet.
 * - beep(): a short tone through WebAudio (the off-route warning);
 * - buzz(pattern): navigator.vibrate;
 * - say(text, lang): read a line aloud (readaloud.js voiceApi), German voice when the app is German.
 */
import { voiceApi } from '../readaloud.js';

export function beep({ hz = 880, ms = 250, times = 2 } = {}) {
  try {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return false;
    const ctx = new C();
    const g = ctx.createGain();
    g.gain.value = 0.2;
    g.connect(ctx.destination);
    for (let i = 0; i < times; i++) {
      const o = ctx.createOscillator();
      o.frequency.value = hz;
      o.connect(g);
      const at = ctx.currentTime + (i * ms * 1.6) / 1000;
      o.start(at);
      o.stop(at + ms / 1000);
      if (i === times - 1) o.onended = () => ctx.close?.();
    }
    return true;
  } catch {
    return false;
  }
}

export function buzz(pattern = [300, 150, 300]) {
  try {
    return !!navigator.vibrate?.(pattern);
  } catch {
    return false;
  }
}

export function say(text, lang = 'de-CH') {
  const v = voiceApi();
  if (!v || !text) return false;
  try {
    const u = new window.SpeechSynthesisUtterance(text);
    u.lang = lang;
    const voice = v.getVoices?.().find((x) => x.lang?.startsWith(lang.slice(0, 2)));
    if (voice) u.voice = voice;
    v.speak(u);
    return true;
  } catch {
    return false;
  }
}
