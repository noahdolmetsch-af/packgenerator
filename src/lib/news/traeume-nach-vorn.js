// «Träume und Neuland» PR 1 (Noah 27.10.2026 «1-5 a»): Träume second under Touren, a row «A dream that fits now»
// on Touren › Übersicht, links to Neuland and the heatmap on Träume; «Neuland des Jahres» gets its own setting
export default {
  title: 'Dreams move forward',
  lead: 'Dreams stand right after the overview, and the overview says when one fits.',
  points: [
    { text: 'Trips: Dreams is the second tab now', href: '#/trips/dreams', go: 'f.dreams' },
    { text: 'Trips › Overview: a row when a dream fits this month', href: '#/trips', go: { href: '#/trips', where: 'Shows on Trips › Overview when a dream fits this month.' } },
  ],
  small: [
    { box: 'nicer', text: 'Dreams: New ground and Heatmap at the bottom under «Collected»', go: 'f.dreams' },
    { box: 'fixed', text: 'New ground of the year and the New ground page no longer overwrite each other', go: null },
  ],
  test: [
    'Open Trips: the tabs start with Overview, Dreams.',
    'Add a dream on Dreams with this month: Trips › Overview shows «A dream that fits now».',
    'At the bottom of Dreams, «New ground» opens the map with the bingo.',
  ],
  since: [],
  de: {
    'Dreams move forward': 'Träume nach vorn',
    'Dreams stand right after the overview, and the overview says when one fits.': 'Träume stehen gleich nach der Übersicht, und die Übersicht sagt, wenn einer passt.',
    'Trips: Dreams is the second tab now': 'Touren: Träume ist jetzt der zweite Reiter',
    'Trips › Overview: a row when a dream fits this month': 'Touren › Übersicht: eine Zeile, wenn ein Traum in diesem Monat passt',
    'Dreams: New ground and Heatmap at the bottom under «Collected»': 'Träume: Neuland und Heatmap unten unter «Gesammelt»',
    'New ground of the year and the New ground page no longer overwrite each other': '«Neuland des Jahres» und die Neuland-Seite überschreiben sich nicht mehr',
    'Open Trips: the tabs start with Overview, Dreams.': 'Öffne Touren: die Reiter beginnen mit Übersicht, Träume.',
    'Add a dream on Dreams with this month: Trips › Overview shows «A dream that fits now».': 'Leg auf Träume einen Traum an, der in diesem Monat passt: Touren › Übersicht zeigt «Ein Traum passt jetzt».',
    'At the bottom of Dreams, «New ground» opens the map with the bingo.': 'Unten auf Träume öffnet «Neuland» die Karte mit dem Bingo.',
  },
};
