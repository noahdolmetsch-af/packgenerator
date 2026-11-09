/**
 * Schrittleiste («Tour-Pfad» 1b, Noah 08.11.2026 «A», dann «b» auf «Wohin kommt Analyse?»): the bar of a trip
 * (ui/StepBar.svelte) shows the four phases of the Tour-Pfad, Planen · Vorbereiten · Unterwegs · Danach, and
 * «Auswertung» stays as the fifth point at the end, on the phone and the computer. Before it showed the five steps
 * Plan · Pack · Live · Review · Analyse (Noah 26.10.2026 «1b»). The pages are the same. Buttons and texts keep the
 * step names of tabs.js (TAB_NAMES, «Weiter zu Packen»). Keys for t(); the German text of the phases is in
 * i18n/de/tourpfad.js, «Auswertung» is 'Analysis|stage' (i18n/de/einetour.js). Plain module without imports, so the
 * e2e specs read it too.
 */
export const STEP_BAR = { plan: 'Planning|phase', pack: 'Preparing', ride: 'On the way', debrief: 'Afterwards', analysis: 'Analysis|stage' };
