/**
 * «Strava-Fahrt vollständig» (Noah 19.10.2026, answer 1a): every list that shows a Strava activity opens
 * the one page of that activity (Aktiv › Training › Aktivität, pages/flow/TrainingAct.svelte).
 * null without a Strava id.
 */
export const actHref = (id) => (id == null || id === '' ? null : `#/flow/training/a/${encodeURIComponent(String(id))}`);
