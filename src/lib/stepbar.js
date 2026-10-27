/**
 * Schrittleiste (Noah 26.10.2026 23:16 «1b nur die schrittleiste (mobile und computer)»): the short names of the
 * steps in the step bar of a trip (ui/StepBar.svelte), on the phone and the computer. Only the bar uses them;
 * buttons and texts keep the step names of tabs.js (TAB_NAMES, «Weiter zu Packen»). Keys for t(); the German
 * text is the same word (i18n/de/uitest.js). Plain module without imports, so the e2e specs read it too.
 */
export const STEP_BAR = { plan: 'Plan|bar', pack: 'Pack|bar', ride: 'Live|bar', debrief: 'Review|bar', analysis: 'Analyse|bar' };
