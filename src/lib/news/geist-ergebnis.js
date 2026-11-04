// «Schlag deinen Geist» (Noah 04.11.2026 «2a»): the result in one line on the ride and in a box on the card
export default {
  title: 'Ghost beaten or not',
  lead: 'A ride now says in one line under its numbers whether you beat your ghost. The card has the result in a box and a tick at each better value.',
  points: [
    {
      text: 'A slim line under the numbers of a ride: «Ghost beaten» with the reason, a tap goes to the card',
      go: { href: '#/flow/training', ride: 'ghost', steps: [{ sel: '[data-ghost-strip]' }], note: 'The line says in one word whether you beat your ghost.', where: 'Open a bike ride with heart rate that has an earlier ride of a similar length (Training › Activities): the line is under the numbers.' },
    },
    {
      text: 'On the card a box says «Ghost beaten», «Level» or «Not beaten this time», and a tick marks every better value',
      go: { href: '#/flow/training', ride: 'ghost', steps: [{ sel: '[data-ghost-result]' }], note: 'The box at the top says whether you beat your ghost; a tick marks each better value.', where: 'Open a bike ride with heart rate that has an earlier ride of a similar length (Training › Activities): the card «Beat your ghost» is further down.' },
    },
  ],
  small: [],
  test: [
    'Open Training › Activities and a bike ride with heart rate that has an earlier ride of a similar length.',
    'Under the numbers a line says «Ghost beaten» or «Not beaten this time». Tap it: the card glows.',
    'On the card the box at the top says the same, and a tick stands at each better value.',
  ],
  since: [],
  de: {
    'Ghost beaten or not': 'Geist geschlagen oder nicht',
    'A ride now says in one line under its numbers whether you beat your ghost. The card has the result in a box and a tick at each better value.': 'Eine Fahrt sagt jetzt in einer Zeile unter den Zahlen, ob du deinen Geist geschlagen hast. Die Karte zeigt das Ergebnis in einem Kasten und einen Haken bei jedem besseren Wert.',
    'A slim line under the numbers of a ride: «Ghost beaten» with the reason, a tap goes to the card': 'Eine schmale Zeile unter den Zahlen einer Fahrt: «Geist geschlagen» mit Begründung, ein Tipp führt zur Karte',
    'The line says in one word whether you beat your ghost.': 'Die Zeile sagt in einem Wort, ob du deinen Geist geschlagen hast.',
    'Open a bike ride with heart rate that has an earlier ride of a similar length (Training › Activities): the line is under the numbers.': 'Öffne eine Velofahrt mit Puls, zu der es eine frühere Fahrt ähnlicher Länge gibt (Training › Aktivitäten): die Zeile steht unter den Zahlen.',
    'On the card a box says «Ghost beaten», «Level» or «Not beaten this time», and a tick marks every better value': 'Auf der Karte sagt ein Kasten «Geist geschlagen», «Auf Augenhöhe» oder «Diesmal nicht geschlagen», und ein Haken markiert jeden besseren Wert',
    'The box at the top says whether you beat your ghost; a tick marks each better value.': 'Der Kasten oben sagt, ob du deinen Geist geschlagen hast; ein Haken markiert jeden besseren Wert.',
    'Open a bike ride with heart rate that has an earlier ride of a similar length (Training › Activities): the card «Beat your ghost» is further down.': 'Öffne eine Velofahrt mit Puls, zu der es eine frühere Fahrt ähnlicher Länge gibt (Training › Aktivitäten): die Karte «Schlag deinen Geist» steht weiter unten.',
    'Open Training › Activities and a bike ride with heart rate that has an earlier ride of a similar length.': 'Öffne Training › Aktivitäten und eine Velofahrt mit Puls, zu der es eine frühere Fahrt ähnlicher Länge gibt.',
    'Under the numbers a line says «Ghost beaten» or «Not beaten this time». Tap it: the card glows.': 'Unter den Zahlen sagt eine Zeile «Geist geschlagen» oder «Geist diesmal nicht geschlagen». Tippe darauf: die Karte leuchtet.',
    'On the card the box at the top says the same, and a tick stands at each better value.': 'Auf der Karte sagt der Kasten oben dasselbe, und bei jedem besseren Wert steht ein Haken.',
  },
};
