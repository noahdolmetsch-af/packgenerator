/**
 * Spielerplus-Kalender (Noah 06.11.2026): fetch the team dates when the app opens or comes back, at most every
 * 30 minutes per calendar (isStale in lib/spielerplus.js), only for calendars that are switched on. Quiet:
 * a failure is kept on the calendar for the card on Ich › Verbindungen, nothing pops up.
 */
import { db } from '../db.js';
import { refreshAll } from '../spielerplus.js';
import { localDay } from '../localday.js';

export function watchSpielerplus() {
  if (typeof document === 'undefined') return;
  const go = () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    refreshAll(db, { today: localDay() }).catch(() => {});
  };
  go();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') go();
  });
}
