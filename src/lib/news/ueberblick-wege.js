// «Überblick öffnet die Analyse» (Noah 07.11.2026 «3a» des Entwurfs «Wege besser sichtbar»): the tiles and rows of the overview lead to Analyse
export default {
  title: 'The overview opens Analyse',
  lead: 'The tiles of the overview, the sport cards and the rows of the last 7 days now open the value in Analyse. The older page stays one tap away there.',
  points: [{ text: 'Tap a tile (heart rate, calories, sleep) or a sport card in the overview: Analyse shows the value with its course. «Also in the older view» leads to the old page', go: { href: '#/flow', steps: [{ sel: '[data-ov="hr"]' }], where: 'Aktiv › Overview.' } }],
  small: [],
  test: ['Open Aktiv › Overview and tap the tile «Heart rate»: Analyse opens with the resting pulse of the last week.', 'Under the diagram tap «Also in the older view»: the old page opens. Back leads to where you came from.'],
  since: [],
  de: {
    'The overview opens Analyse': 'Der Überblick öffnet die Analyse',
    'The tiles of the overview, the sport cards and the rows of the last 7 days now open the value in Analyse. The older page stays one tap away there.': 'Die Kacheln des Überblicks, die Sportkarten und die Zeilen der letzten 7 Tage öffnen jetzt den Wert in der Analyse. Die bisherige Seite bleibt dort einen Tipp entfernt.',
    'Tap a tile (heart rate, calories, sleep) or a sport card in the overview: Analyse shows the value with its course. «Also in the older view» leads to the old page': 'Tippe im Überblick auf eine Kachel (Puls, Kalorien, Schlaf) oder eine Sportkarte: die Analyse zeigt den Wert mit seinem Verlauf. «Auch in der bisherigen Ansicht» führt zur alten Seite',
    'Aktiv › Overview.': 'Aktiv › Überblick.',
    'Open Aktiv › Overview and tap the tile «Heart rate»: Analyse opens with the resting pulse of the last week.': 'Öffne Aktiv › Überblick und tippe auf die Kachel «Herzfrequenz»: die Analyse öffnet den Ruhepuls der letzten Woche.',
    'Under the diagram tap «Also in the older view»: the old page opens. Back leads to where you came from.': 'Tippe unter dem Diagramm auf «Auch in der bisherigen Ansicht»: die alte Seite öffnet sich. Zurück führt dorthin, woher du kamst.',
  },
};
