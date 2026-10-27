/**
 * «Touren sichtbar» (Noah 24.10.2026 «2b 3a»): the parts of a trip's debrief as chips under the band
 * (ui/QuickLinks.svelte). The labels are the names in «What the app can do» (features.js), so search,
 * catalogue and page say the same. A chip shows only while its part is on the page.
 */
export const DEBRIEF_JUMPS = [
  { key: 'unneeded', label: 'What did you not need?', jump: '#unneeded-h' },
  { key: 'missing', label: 'What was missing?', jump: '#miss-h' },
  { key: 'diary', label: 'Tour diary', jump: '[data-tagebuch]' },
  { key: 'extraq', label: 'More to learn', jump: '[data-zusatzfragen]' },
  { key: 'future', label: 'A message to your future self', jump: '[data-zukunft]' },
  { key: 'breakdown', label: 'Note a breakdown', jump: '[data-learn-break]' },
  { key: 'sleep', label: 'Rate a place to sleep', jump: '[data-learn-sleep]' },
  { key: 'picture', label: 'Tour picture', jump: '[data-postcard-open]' },
  // Touren b (996 Ideen 56, 58)
  { key: 'listen', label: 'Your day to listen to', jump: '[data-day-listen]' },
  { key: 'used', label: 'Book what was used', jump: '[data-used]' },
];
