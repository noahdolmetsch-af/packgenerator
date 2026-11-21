/**
 * TrainingPeaks-Plan (Noah 19.11.2026): fetch the planned workouts when the app opens or comes back, at most every
 * 60 minutes (isStale in lib/trainingpeaks.js), only when a link is set and switched on. Quiet: a failure is kept
 * for the card on Ich › Verbindungen, nothing pops up. The module loads only when a link exists.
 */
import { db } from '../db.js';
import { localDay } from '../localday.js';

export function watchTrainingpeaks() {
  if (typeof document === 'undefined') return;
  const go = async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    try {
      if (!(await db.settings.get('trainingpeaks'))?.value?.url) return;
      const { refresh } = await import('../trainingpeaks.js');
      await refresh(db, { today: localDay() });
    } catch {
      /* quiet */
    }
  };
  go();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') go();
  });
}
