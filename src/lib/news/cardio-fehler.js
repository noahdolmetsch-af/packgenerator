// «Cardio-Belastung lesbar» (Noah 07.11.2026 «1a», UI-Test der Analyse-Seite): five faults of the page of one value
export default {
  title: 'Cardio load: easier to read',
  lead: 'The page of a value (for example Cardio load) is fixed in five places: trip names, weekday bars, cards, «day before» and «+ Value».',
  points: [
    { text: 'The weekday bars show real differences, with the number above each bar', go: { href: '#/auswerten/analyse/cardioLoad', steps: [{ sel: '[data-detail="cardioLoad"] .wdbars' }], where: 'Auswerten › Analyse › All values › Heart › Cardio load, card «Per weekday».' } },
    { text: 'Trip names in the course only show where there is room, the legend counts the trips', go: { href: '#/auswerten/analyse/cardioLoad', steps: [{ sel: '[data-detail="cardioLoad"] .legend' }], where: 'Auswerten › Analyse › All values › Heart › Cardio load, below the course.' } },
    { text: '«Done the day before» says «nothing ticked» instead of a dash, «+ Value» is a small chip', go: { href: '#/auswerten/analyse/cardioLoad', steps: [{ sel: '[data-detail="cardioLoad"] [data-add-layer]' }], where: 'Auswerten › Analyse › All values › Heart › Cardio load, above the course and in the card «Days».' } },
  ],
  small: [],
  test: [
    'Open Auswerten › Analyse › All values › Heart › Cardio load, switch the range to «3 M».',
    'Look at «Per weekday»: the bars differ in height and every bar has its number above.',
    'Look at the course: trip names do not lie on top of each other, the legend says how many trips there are.',
  ],
  since: [],
  de: {
    'Cardio load: easier to read': 'Cardio-Belastung: besser lesbar',
    'The page of a value (for example Cardio load) is fixed in five places: trip names, weekday bars, cards, «day before» and «+ Value».': 'Die Seite eines Wertes (zum Beispiel Cardio-Belastung) ist an fünf Stellen behoben: Tour-Namen, Wochentag-Balken, Karten, «Am Tag davor» und «+ Wert».',
    'The weekday bars show real differences, with the number above each bar': 'Die Wochentag-Balken zeigen echte Unterschiede, mit der Zahl über jedem Balken',
    'Auswerten › Analyse › All values › Heart › Cardio load, card «Per weekday».': 'Auswerten › Analyse › Alle Werte › Herz › Cardio-Belastung, Karte «Pro Wochentag».',
    'Trip names in the course only show where there is room, the legend counts the trips': 'Tour-Namen im Verlauf stehen nur, wo Platz ist, die Legende zählt die Touren',
    'Auswerten › Analyse › All values › Heart › Cardio load, below the course.': 'Auswerten › Analyse › Alle Werte › Herz › Cardio-Belastung, unter dem Verlauf.',
    '«Done the day before» says «nothing ticked» instead of a dash, «+ Value» is a small chip': '«Am Tag davor gemacht» sagt «nichts abgehakt» statt eines Strichs, «+ Wert» ist ein kleiner Knopf',
    'Auswerten › Analyse › All values › Heart › Cardio load, above the course and in the card «Days».': 'Auswerten › Analyse › Alle Werte › Herz › Cardio-Belastung, über dem Verlauf und in der Karte «Tage».',
    'Open Auswerten › Analyse › All values › Heart › Cardio load, switch the range to «3 M».': 'Öffne Auswerten › Analyse › Alle Werte › Herz › Cardio-Belastung und stelle den Zeitraum auf «3 M».',
    'Look at «Per weekday»: the bars differ in height and every bar has its number above.': 'Schau bei «Pro Wochentag»: die Balken sind verschieden hoch und über jedem steht seine Zahl.',
    'Look at the course: trip names do not lie on top of each other, the legend says how many trips there are.': 'Schau auf den Verlauf: Tour-Namen liegen nicht übereinander, die Legende sagt, wie viele Touren es sind.',
  },
};
