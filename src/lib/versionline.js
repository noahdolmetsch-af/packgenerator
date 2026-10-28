// «Neueste Version» in Ich (Noah 27.10.2026 «1-5 a», questions 1 and 2): the device's version next to the one
// that is online, so you can tell «not online yet» from «this device is stuck».
import { newer } from './behind.js';

/**
 * What the line says. `running` is this device's version, `live` the one online (null: not known).
 * 'unknown' offline or no answer · 'newer' a newer one is online · 'current' this device has the newest.
 */
export function versionState(running, live) {
  if (!live) return 'unknown';
  return newer(live, running) ? 'newer' : 'current';
}
