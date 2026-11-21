// «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»), PR 15: the month bars of «In Zahlen» follow the same rules as the other charts
export default {
  title: 'In numbers: the month charts you can point at',
  lead: 'km, climbing, weekdays, time in heart rate zones, pace and heart rate per month show exact values and a table.',
  points: [
    { text: 'Point at a month for its numbers; tap it for the month', href: '#/trips', go: { href: '#/trips', steps: [{ sel: '[data-in-numbers]' }], where: 'Trips › In numbers › open «Distance» and point at a bar of «km and climbing».' } },
    { text: '«As table» lists the months with their numbers', href: '#/trips', go: { href: '#/trips', steps: [{ sel: '[data-in-numbers]' }], where: 'Trips › In numbers › any chart › «As table».' } },
  ],
  test: [
    'Open Trips › In numbers › «Distance» and point at a bar of «km and climbing»: the month and its km appear above the chart.',
    'Tap a bar: a window shows the numbers of the month; «Earlier one» and «Later one» walk through the months.',
    'Tap «As table»: the months are listed with their numbers, the newest first. The same works for the weekdays, the time in zones and the pace.',
  ],
  since: [],
  de: {
    'In numbers: the month charts you can point at': 'In Zahlen: die Monats-Diagramme zum Antippen',
    'km, climbing, weekdays, time in heart rate zones, pace and heart rate per month show exact values and a table.': 'km, Höhenmeter, Wochentage, Zeit in Herzfrequenz-Zonen, Tempo und Puls pro Monat zeigen genaue Werte und eine Tabelle.',
    'Point at a month for its numbers; tap it for the month': 'Zeig auf einen Monat für die Zahlen; tippe ihn an für den Monat',
    '«As table» lists the months with their numbers': '«Als Tabelle» listet die Monate mit ihren Zahlen',
    'Trips › In numbers › open «Distance» and point at a bar of «km and climbing».': 'Touren › In Zahlen › «Strecke» öffnen und auf einen Balken von «km und Höhenmeter» zeigen.',
    'Trips › In numbers › any chart › «As table».': 'Touren › In Zahlen › ein Diagramm › «Als Tabelle».',
    'Open Trips › In numbers › «Distance» and point at a bar of «km and climbing»: the month and its km appear above the chart.': 'Öffne Touren › In Zahlen › «Strecke» und zeig auf einen Balken von «km und Höhenmeter»: Monat und km stehen über dem Diagramm.',
    'Tap a bar: a window shows the numbers of the month; «Earlier one» and «Later one» walk through the months.': 'Tippe einen Balken an: ein Fenster zeigt die Zahlen des Monats; «Der davor» und «Der danach» führen durch die Monate.',
    'Tap «As table»: the months are listed with their numbers, the newest first. The same works for the weekdays, the time in zones and the pace.': 'Tippe «Als Tabelle»: die Monate stehen mit ihren Zahlen da, der neueste zuerst. Dasselbe geht bei den Wochentagen, der Zeit in Zonen und dem Tempo.',
  },
};
