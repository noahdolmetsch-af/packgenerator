// Paket T «Freie Zeit»: small on purpose, backup.js imports it (without the content of frei.js).
/*
 * Sound at a favourite place (Noah 19.10.2026 «4b wenn nicht zu gross»): the browser's own MediaRecorder,
 * no library; at most 30 s, about 24 kbit/s (30 s ≈ 120 KB in the backup). Only on this device and in the
 * backup; «Recordings in the backup» off leaves them out of every backup file.
 */
export const SOUND_MAX_SEC = 30;
export const SOUND_BITS = 24000;
/** A stored recording { src: data URL, sec, day } or null. */
export const soundOf = (s) => (s && typeof s.src === 'string' && s.src.startsWith('data:audio/') ? { src: s.src, sec: Math.min(Math.max(Math.round(Number(s.sec) || 0), 0), SOUND_MAX_SEC), day: s.day ?? null } : null);
/** The first sound format this browser records (opus first: smallest); '' lets the browser choose. */
export const soundType = (supported = () => false) => ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find((x) => supported(x)) ?? '';
/** Recordings go into the backup unless switched off. */
export const soundsInBackup = (cfg) => cfg?.soundsBackup !== false;
/** The backup tables without recordings when the switch says so (backup.js). */
export function backupSounds(tables) {
  const cfg = tables?.settings?.find((r) => r?.key === 'frei')?.value;
  if (soundsInBackup(cfg) || !Array.isArray(tables?.frei)) return tables;
  return { ...tables, frei: tables.frei.map((r) => (r?.sound ? { ...r, sound: null } : r)) };
}
