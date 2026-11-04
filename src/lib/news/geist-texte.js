// «Schlag deinen Geist» (Noah 04.11.2026 «3a»): clearer words on the card
export default {
  title: 'The ghost card, clearer',
  lead: 'The card now says in one sentence what a ghost is, tells route and length apart, says that a smaller drift is better, and shows the chosen ghost at once.',
  points: [
    {
      text: 'One sentence says what a ghost is; «route» and «length» are two things; the drift says «smaller is better»',
      go: { href: '#/flow/training', ride: 'ghost', steps: [{ sel: '[data-ana="ghost"]' }], note: 'The card says what a ghost is, and whether route and length are the same.', where: 'Open a bike ride with heart rate that has an earlier ride of a similar length (Training › Activities): the card «Beat your ghost» is further down.' },
    },
    {
      text: 'The list shows the chosen ghost at once, in a short line, instead of an empty field',
      go: { href: '#/flow/training', ride: 'ghost', steps: [{ sel: '[data-ghost-pick]' }], note: 'The list shows your ghost: the day, the route and the length.', where: 'Open a bike ride with heart rate that has an earlier ride of a similar length (Training › Activities): the card «Beat your ghost» is further down.' },
    },
  ],
  small: [],
  test: [
    'Open Training › Activities and a bike ride with heart rate that has an earlier ride of a similar length.',
    'On the card «Beat your ghost» the list shows a ghost right away; the chips say «same route» and «length +1 %».',
    'In the table the drift row says «smaller is better».',
  ],
  since: [],
  de: {
    'The ghost card, clearer': 'Die Geist-Karte, klarer',
    'The card now says in one sentence what a ghost is, tells route and length apart, says that a smaller drift is better, and shows the chosen ghost at once.': 'Die Karte sagt jetzt in einem Satz, was ein Geist ist, trennt Route und Länge, sagt, dass weniger Nachlassen besser ist, und zeigt den gewählten Geist sofort.',
    'One sentence says what a ghost is; «route» and «length» are two things; the drift says «smaller is better»': 'Ein Satz sagt, was ein Geist ist; «Route» und «Länge» sind zwei Dinge; beim Nachlassen steht «kleiner ist besser»',
    'The card says what a ghost is, and whether route and length are the same.': 'Die Karte sagt, was ein Geist ist und ob Route und Länge gleich sind.',
    'The list shows the chosen ghost at once, in a short line, instead of an empty field': 'Die Liste zeigt den gewählten Geist sofort, in einer kurzen Zeile, statt eines leeren Feldes',
    'The list shows your ghost: the day, the route and the length.': 'Die Liste zeigt deinen Geist: Tag, Route und Länge.',
    'Open a bike ride with heart rate that has an earlier ride of a similar length (Training › Activities): the card «Beat your ghost» is further down.': 'Öffne eine Velofahrt mit Puls, zu der es eine frühere Fahrt ähnlicher Länge gibt (Training › Aktivitäten): die Karte «Schlag deinen Geist» steht weiter unten.',
    'Open Training › Activities and a bike ride with heart rate that has an earlier ride of a similar length.': 'Öffne Training › Aktivitäten und eine Velofahrt mit Puls, zu der es eine frühere Fahrt ähnlicher Länge gibt.',
    'On the card «Beat your ghost» the list shows a ghost right away; the chips say «same route» and «length +1 %».': 'Auf der Karte «Schlag deinen Geist» zeigt die Liste sofort einen Geist; die Felder sagen «Gleiche Route» und «Länge +1 %».',
    'In the table the drift row says «smaller is better».': 'In der Tabelle steht bei der Zeile zum Nachlassen «kleiner ist besser».',
  },
};
