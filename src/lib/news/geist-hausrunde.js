// «Schlag deinen Geist» (Noah 04.11.2026 «5b»): the home loop card leaves out its sentence while the ghost card shows
export default {
  title: 'One sentence less on the ride page',
  lead: 'When the card «Beat your ghost» is shown for a ride, the card «Your home loop over time» no longer repeats the same kind of sentence. The line and the table stay.',
  points: [
    {
      text: 'The sentence of the home loop is left out while the ghost card is shown; switch the ghost card off and it is back',
      go: { href: '#/flow/training', steps: [{ sel: '[data-ana="homeloop"]' }], where: 'Open a bike ride with heart rate on a route you rode at least three times (Training › Activities): the card «Your home loop over time» is further down.' },
    },
  ],
  small: [],
  test: [
    'Open Training › Activities and a bike ride with heart rate on a route you rode at least three times.',
    'On the card «Your home loop over time» there is the line and the table, but no sentence on top.',
    'Open «Adjust analyses» and switch «Beat your ghost» off: the sentence is back.',
  ],
  since: [],
  de: {
    'One sentence less on the ride page': 'Ein Satz weniger auf der Fahrt-Seite',
    'When the card «Beat your ghost» is shown for a ride, the card «Your home loop over time» no longer repeats the same kind of sentence. The line and the table stay.': 'Wenn für eine Fahrt die Karte «Schlag deinen Geist» steht, wiederholt die Karte «Deine Hausrunde über die Zeit» nicht mehr denselben Satz. Die Linie und die Tabelle bleiben.',
    'The sentence of the home loop is left out while the ghost card is shown; switch the ghost card off and it is back': 'Der Satz der Hausrunde entfällt, solange die Geist-Karte da ist; schaltest du die Geist-Karte aus, ist er wieder da',
    'Open a bike ride with heart rate on a route you rode at least three times (Training › Activities): the card «Your home loop over time» is further down.': 'Öffne eine Velofahrt mit Puls auf einer Strecke, die du mindestens dreimal gefahren bist (Training › Aktivitäten): die Karte «Deine Hausrunde über die Zeit» steht weiter unten.',
    'Open Training › Activities and a bike ride with heart rate on a route you rode at least three times.': 'Öffne Training › Aktivitäten und eine Velofahrt mit Puls auf einer Strecke, die du mindestens dreimal gefahren bist.',
    'On the card «Your home loop over time» there is the line and the table, but no sentence on top.': 'Auf der Karte «Deine Hausrunde über die Zeit» stehen die Linie und die Tabelle, aber oben kein Satz.',
    'Open «Adjust analyses» and switch «Beat your ghost» off: the sentence is back.': 'Öffne «Analysen anpassen» und schalte «Schlag deinen Geist» aus: der Satz ist wieder da.',
  },
};
