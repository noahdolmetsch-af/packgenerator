// «Velokarte: langer Typ» (Durchklick Etappe 4, Frage 4a, Noah 06.11.2026)
export default {
  title: 'Bike card: a long type no longer breaks mid-word',
  lead: 'A long bike type from an import, like «A/B (Source)», now breaks after the slash and is cut with «…» after two lines.',
  points: [{ text: 'Bikes: long types stay readable in the small bike card', go: { href: '#/bikes', steps: [{ text: 'Bikes' }] } }],
  small: [],
  test: ['Open Bikes on the phone and look at the small bike cards.', 'A long type breaks after the slash and ends with «…» after two lines; the chosen card shows all of it.'],
  since: [],
  de: {
    'Bike card: a long type no longer breaks mid-word': 'Velokarte: Ein langer Typ bricht nicht mehr mitten im Wort um',
    'A long bike type from an import, like «A/B (Source)», now breaks after the slash and is cut with «…» after two lines.': 'Ein langer Velotyp aus einem Import, zum Beispiel «A/B (Quelle)», bricht jetzt nach dem Schrägstrich um und wird nach zwei Zeilen mit «…» gekürzt.',
    'Bikes: long types stay readable in the small bike card': 'Velos: Lange Typen bleiben in der kleinen Velokarte lesbar',
    'Open Bikes on the phone and look at the small bike cards.': 'Öffne Velos auf dem Handy und schau die kleinen Velokarten an.',
    'A long type breaks after the slash and ends with «…» after two lines; the chosen card shows all of it.': 'Ein langer Typ bricht nach dem Schrägstrich um und endet nach zwei Zeilen mit «…»; die gewählte Karte zeigt alles.',
  },
};
