// «Vier Phasen statt Schrittleiste» (Noah 08.11.2026 «A» und «b», Plan-Schritt 1b): the bar of a tour shows the four phases of the Tour-Pfad
export default {
  title: 'Four phases',
  lead: 'The bar of a tour now says Planning, Preparing, On the way, Afterwards and Evaluation.',
  points: [
    { text: 'The bar above a tour has four phases, the same as the Tour path', go: { href: '#/pack', steps: [{ sel: 'nav.stepbar' }], where: 'Shows on top of a tour you plan or pack.' } },
    { text: 'The evaluation stays the last point of the bar', go: { href: '#/trips', where: 'Open a tour: the last point of the bar is Evaluation.' } },
  ],
  small: [{ box: 'nicer', text: 'Buttons keep their words, for example «Continue to Pack»' }],
  test: [
    'Open a tour: the bar above says Planning · Preparing · On the way · Afterwards · Evaluation.',
    'Tap Afterwards: the debrief opens; tap Evaluation: the tour page opens.',
    'Tap «Tour path» above the bar: the rows of the four phases open.',
  ],
  since: [],
  de: {
    'Four phases': 'Vier Phasen',
    'The bar of a tour now says Planning, Preparing, On the way, Afterwards and Evaluation.': 'Die Leiste einer Tour zeigt jetzt Planen, Vorbereiten, Unterwegs, Danach und Auswertung.',
    'The bar above a tour has four phases, the same as the Tour path': 'Die Leiste über einer Tour hat vier Phasen, dieselben wie im Tour-Pfad',
    'Shows on top of a tour you plan or pack.': 'Steht oben auf einer Tour, die du planst oder packst.',
    'The evaluation stays the last point of the bar': 'Die Auswertung bleibt der letzte Punkt der Leiste',
    'Open a tour: the last point of the bar is Evaluation.': 'Öffne eine Tour: Der letzte Punkt der Leiste ist Auswertung.',
    'Buttons keep their words, for example «Continue to Pack»': 'Die Knöpfe behalten ihre Wörter, zum Beispiel «Weiter zu Packen»',
    'Open a tour: the bar above says Planning · Preparing · On the way · Afterwards · Evaluation.': 'Öffne eine Tour: Die Leiste oben zeigt Planen · Vorbereiten · Unterwegs · Danach · Auswertung.',
    'Tap Afterwards: the debrief opens; tap Evaluation: the tour page opens.': 'Tippe auf Danach: Der Rückblick öffnet sich; tippe auf Auswertung: Die Tour-Seite öffnet sich.',
    'Tap «Tour path» above the bar: the rows of the four phases open.': 'Tippe oben auf «Tour-Pfad»: Die Zeilen der vier Phasen öffnen sich.',
  },
};
