// «Diagramme besser machen» (Noah 21.11.2026), Schritt 3: a time with nothing to show says why, no «0»
export default {
  title: 'No data instead of 0',
  lead: 'In the Sports year and the review of a sport, a month that has not come or lies before your first record says so, instead of showing 0 hours.',
  points: [
    { text: 'Pointing at a month to come says «Not yet»; before your first record it says «No data in this period»', href: '#/auswerten/sportjahr', go: { href: '#/auswerten/sportjahr', where: 'Auswerten › Sports year › year: point at a month at the right end of the chart.' } },
  ],
  test: [
    'Open the Sports year and choose «Year»: the line above the chart starts on the newest month with data, not on a month to come.',
    'Point at a month that has not come: it says «Not yet» instead of «0 min».',
    'Tap «As table»: months to come show a dash instead of 0.',
  ],
  since: [],
  de: {
    'No data instead of 0': 'Keine Daten statt 0',
    'In the Sports year and the review of a sport, a month that has not come or lies before your first record says so, instead of showing 0 hours.': 'Im Sportjahr und im Rückblick pro Sportart sagt ein Monat, der noch nicht da ist oder vor deiner ersten Aufzeichnung liegt, das selbst, statt 0 Stunden zu zeigen.',
    'Pointing at a month to come says «Not yet»; before your first record it says «No data in this period»': 'Zeigst du auf einen kommenden Monat, steht «Noch nicht»; vor deiner ersten Aufzeichnung steht «Keine Daten in diesem Zeitraum»',
    'Auswerten › Sports year › year: point at a month at the right end of the chart.': 'Auswerten › Sportjahr › Jahr: auf einen Monat am rechten Rand des Diagramms zeigen.',
    'Open the Sports year and choose «Year»: the line above the chart starts on the newest month with data, not on a month to come.': 'Öffne das Sportjahr und wähle «Jahr»: die Zeile über dem Diagramm startet beim neuesten Monat mit Daten, nicht bei einem kommenden Monat.',
    'Point at a month that has not come: it says «Not yet» instead of «0 min».': 'Zeig auf einen Monat, der noch nicht da ist: es steht «Noch nicht» statt «0 min».',
    'Tap «As table»: months to come show a dash instead of 0.': 'Tippe «Als Tabelle»: kommende Monate zeigen einen Strich statt 0.',
  },
};
