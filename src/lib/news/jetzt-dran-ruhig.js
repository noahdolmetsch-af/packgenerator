// «Jetzt dran» (Noah 05.11.2026 «3a»): only the urgent rows are counted and shown; calm hints are folded under «Good to know»
export default {
  title: 'Up now: only what is urgent',
  lead: 'The tile «Up now» counts and shows only what is due. Calm hints wait in a folded line below.',
  points: [{ text: 'The calm hints (care outlook, weighing, unused parts, tidy-up) sit under «Good to know · N»', go: null }],
  small: [
    { box: 'nicer', text: 'The number at the top of «Up now» counts only the urgent rows', go: null },
    { box: 'new', text: 'When nothing is urgent, «Up now» says so and keeps the folded hints', go: null },
  ],
  test: [
    'Open Today: the rows under «Jetzt dran» all have a red, amber or blue dot, and the number matches them.',
    'Under them tap «Gut zu wissen · N»: the calm hints open (grey circles); tap again to close.',
  ],
  since: [],
  de: {
    'Up now: only what is urgent': 'Jetzt dran: nur was dringend ist',
    'The tile «Up now» counts and shows only what is due. Calm hints wait in a folded line below.': 'Die Kachel «Jetzt dran» zählt und zeigt nur, was ansteht. Ruhige Hinweise warten darunter in einer eingeklappten Zeile.',
    'The calm hints (care outlook, weighing, unused parts, tidy-up) sit under «Good to know · N»': 'Die ruhigen Hinweise (Pflege-Ausblick, Wägen, ungenutzte Teile, Aufräumen) stehen unter «Gut zu wissen · N»',
    'The number at the top of «Up now» counts only the urgent rows': 'Die Zahl oben bei «Jetzt dran» zählt nur die dringenden Zeilen',
    'When nothing is urgent, «Up now» says so and keeps the folded hints': 'Wenn nichts dringend ist, sagt das «Jetzt dran» und behält die eingeklappten Hinweise',
    'Open Today: the rows under «Jetzt dran» all have a red, amber or blue dot, and the number matches them.': 'Öffne Heute: Die Zeilen unter «Jetzt dran» haben alle einen roten, gelben oder blauen Punkt, und die Zahl passt dazu.',
    'Under them tap «Gut zu wissen · N»: the calm hints open (grey circles); tap again to close.': 'Tippe darunter auf «Gut zu wissen · N»: Die ruhigen Hinweise öffnen sich (graue Kreise); nochmals tippen schliesst sie.',
  },
};
