// «Aktivzonenminuten gegen das eigene Normal» (Noah 22.11.2026 «a», Thread «Alle Sportarten und Erholung», Schritt K)
export default {
  title: 'Zone minutes against your own usual',
  lead: 'The week review shows your active zone minutes next to your own usual week and the same week a year ago.',
  points: [
    { text: 'Under «Body this week»: your usual (the median of your weeks before) and the same week a year ago', go: { href: '#/flow/review', steps: [{ sel: '[data-body="azm"]' }], where: 'Week review › Body this week › Active zone minutes (when the watch has delivered the values).' } },
    { text: 'The guideline of the watch (150 a week) stands only as a line, never as a goal; weeks you marked as a pause are left out of your usual', go: { href: '#/flow/review', steps: [{ sel: '[data-azm-ref]' }], where: 'Week review › Body this week › Active zone minutes.' } },
  ],
  small: [],
  test: [
    'Open the week review: under «Active zone minutes» a line says «Your usual: … min a week» and, from a year back, the same week a year ago.',
    'Mark an earlier week as a pause: your usual no longer counts it.',
  ],
  since: [],
  de: {
    'Zone minutes against your own usual': 'Zonenminuten gegen dein eigenes Normal',
    'The week review shows your active zone minutes next to your own usual week and the same week a year ago.': 'Der Wochenrückblick zeigt deine Aktivzonenminuten neben deiner eigenen üblichen Woche und derselben Woche vor einem Jahr.',
    'Under «Body this week»: your usual (the median of your weeks before) and the same week a year ago': 'Unter «Körper diese Woche»: dein Normal (der Median deiner Wochen davor) und dieselbe Woche vor einem Jahr',
    'Week review › Body this week › Active zone minutes (when the watch has delivered the values).': 'Wochenrückblick › Körper diese Woche › Aktivzonenminuten (wenn die Uhr die Werte geliefert hat).',
    'The guideline of the watch (150 a week) stands only as a line, never as a goal; weeks you marked as a pause are left out of your usual': 'Der Richtwert der Uhr (150 pro Woche) steht nur als Zeile, nie als Ziel; Wochen, die du als Pause markiert hast, fehlen in deinem Normal',
    'Week review › Body this week › Active zone minutes.': 'Wochenrückblick › Körper diese Woche › Aktivzonenminuten.',
    'Open the week review: under «Active zone minutes» a line says «Your usual: … min a week» and, from a year back, the same week a year ago.': 'Öffne den Wochenrückblick: unter «Aktivzonenminuten» steht «Dein Normal: … Min. pro Woche» und, wenn es ein Jahr zurückreicht, dieselbe Woche vor einem Jahr.',
    'Mark an earlier week as a pause: your usual no longer counts it.': 'Markiere eine frühere Woche als Pause: dein Normal zählt sie nicht mehr.',
  },
};
