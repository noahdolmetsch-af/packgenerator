// «Analyse» M6 (Noah 27.10.2026 «alle Mockups 1:1»): every value gets its own page with its course
export default {
  title: 'A page for every value',
  lead: 'Tap a tile on Analyse: you see the course of that value over a day, week, month, 3 months, year or everything.',
  points: [
    { text: 'Mean, lowest, highest and your typical range; trips as a band, the 7-day mean, the year before alongside', go: 'f.analyse' },
    { text: 'Up to two more values in the same chart, per weekday, and the days with what you did the day before', go: 'f.analyse' },
    { text: 'Tap a point: the day with all its values', go: 'f.analyse' },
  ],
  small: [{ box: 'nicer', text: 'A tile no longer opens Körperwerte or «Haken ausgewertet»; both are one link further down on the new page', go: 'f.analyse' }],
  test: [
    'Open Auswerten › Analyse and tap «Ruhepuls».',
    'Switch between T, W, M, 3 M, J and Alles; go back with ‹.',
    'Tap «+ Schlaf», then tap a day in the list: you see every value of that day.',
  ],
  since: [],
  de: {
    'A page for every value': 'Eine Seite für jeden Wert',
    'Tap a tile on Analyse: you see the course of that value over a day, week, month, 3 months, year or everything.':
      'Tippe in der Analyse auf eine Kachel: Du siehst den Verlauf des Werts über einen Tag, eine Woche, einen Monat, 3 Monate, ein Jahr oder alles.',
    'Mean, lowest, highest and your typical range; trips as a band, the 7-day mean, the year before alongside':
      'Schnitt, tiefster, höchster Wert und dein üblicher Bereich; Touren als Band, der 7-Tage-Schnitt, das Vorjahr daneben',
    'Up to two more values in the same chart, per weekday, and the days with what you did the day before':
      'Bis zu zwei weitere Werte im selben Diagramm, pro Wochentag, und die Tage mit dem, was du am Tag davor gemacht hast',
    'Tap a point: the day with all its values': 'Tipp auf einen Punkt: der Tag mit allen Werten',
    'A tile no longer opens Körperwerte or «Haken ausgewertet»; both are one link further down on the new page':
      'Eine Kachel öffnet nicht mehr Körperwerte oder «Haken ausgewertet»; beide sind als Link weiter unten auf der neuen Seite',
    'Open Auswerten › Analyse and tap «Ruhepuls».': 'Öffne Auswerten › Analyse und tippe auf «Ruhepuls».',
    'Switch between T, W, M, 3 M, J and Alles; go back with ‹.': 'Wechsle zwischen T, W, M, 3 M, J und Alles; geh mit ‹ zurück.',
    'Tap «+ Schlaf», then tap a day in the list: you see every value of that day.': 'Tippe «+ Schlaf», dann einen Tag in der Liste: Du siehst alle Werte dieses Tages.',
  },
};
