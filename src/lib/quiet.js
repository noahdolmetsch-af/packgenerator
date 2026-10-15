/**
 * FE8 «Nachtruhe» (Noah 13.10.2026 23:52): from 22:00 to 06:00 on the device's own clock, Heute shows
 * no calm hints or tips. One central check; the switch lives in Ich › Darstellung › Bedienung.
 */
import { DAY_CLOCK } from './dayclock.js';

/** v0.144.0 RE «Eine Tagesuhr»: the night of the one day clock (22–06). */
export const QUIET_FROM = DAY_CLOCK.night;
export const QUIET_TO = DAY_CLOCK.morning;

/** True between QUIET_FROM and QUIET_TO local time, when the night quiet is on. */
export function quietNow(now = new Date(), on = true) {
  if (!on) return false;
  const h = now.getHours();
  return h >= QUIET_FROM || h < QUIET_TO;
}
