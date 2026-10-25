/**
 * Paket C › Klangbriefe (996 Ideen UC-231-I3; Noah 24.10.2026 «4b»: voice notes up to 1 minute are
 * allowed): short spoken thoughts, for example after a meditation, kept as a private collection to
 * listen to on purpose, without any numbers. Each one is its own settings record SOUND_PREFIX + id =
 * { id, day, secs, mime, data (data URL), title, after } so it travels in the backup and the sync.
 * Pure, tested in tests/ruhig.test.js.
 */
import { clean, isDay } from './base.js';

export const SOUND_PREFIX = 'ruhig.sound.';
export const SOUND_MAX_S = 60;
/** What the thought came after (English keys); only a label, no group. */
export const AFTER = ['After a meditation', 'After a ride', 'In the evening'];

export function soundOf(value) {
  const v = value && typeof value === 'object' ? value : null;
  if (!v?.id || !isDay(v.day) || typeof v.data !== 'string' || !v.data.startsWith('data:audio')) return null;
  return { id: String(v.id), day: v.day, secs: Math.min(SOUND_MAX_S, Math.max(0, Math.round(Number(v.secs) || 0))), mime: clean(v.mime, 60) || 'audio/webm', data: v.data, title: clean(v.title, 80), after: clean(v.after, 40) };
}
/** The records → the voice letters, newest first (broken ones left out). */
export function soundsOf(rows = []) {
  return rows
    .map((r) => soundOf(r?.value))
    .filter(Boolean)
    .sort((a, b) => b.day.localeCompare(a.day) || b.id.localeCompare(a.id));
}
/** «0:42» */
export const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}`;
