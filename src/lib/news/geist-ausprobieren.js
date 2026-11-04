// «Schlag deinen Geist» (Noah 04.11.2026 «1a»): «Try it» now leads to the card on a ride, not to Training › Week
export default {
  title: 'Try it leads to the ghost card',
  lead: '«Try it» at «Beat your ghost» used to open Training › Week, where the card is not. It now opens a ride and lights the card.',
  points: [
    {
      text: '«Try it» opens the newest ride that has an earlier ride to race against, and lights the card',
      go: {
        href: '#/flow/training',
        ride: 'ghost',
        steps: [{ sel: '[data-ana="ghost"]' }],
        note: 'The card puts this ride against an earlier ride of yours: who is ahead, and how alike the two rides are.',
        where: 'Open a bike ride with heart rate that has an earlier ride of a similar length (Training › Activities): the card «Beat your ghost» is further down.',
      },
    },
  ],
  small: [],
  test: [
    'Open Me › What is new and find the update «Beat your ghost».',
    'Tap «Try it»: a ride opens and the card «Beat your ghost» glows with one line below.',
    'With no ride that has an earlier one, Training opens and a line says what a ride needs.',
  ],
  since: [],
  de: {
    'Try it leads to the ghost card': '«Ausprobieren» führt zur Geist-Karte',
    '«Try it» at «Beat your ghost» used to open Training › Week, where the card is not. It now opens a ride and lights the card.': '«Ausprobieren» bei «Schlag deinen Geist» öffnete bisher Training › Woche, wo die Karte nicht liegt. Es öffnet jetzt eine Fahrt und lässt die Karte leuchten.',
    '«Try it» opens the newest ride that has an earlier ride to race against, and lights the card': '«Ausprobieren» öffnet die neueste Fahrt mit einer früheren Fahrt zum Antreten und lässt die Karte leuchten',
    'The card puts this ride against an earlier ride of yours: who is ahead, and how alike the two rides are.': 'Die Karte stellt diese Fahrt einer früheren Fahrt von dir gegenüber: wer vorn liegt und wie ähnlich die beiden Fahrten sind.',
    'Open a bike ride with heart rate that has an earlier ride of a similar length (Training › Activities): the card «Beat your ghost» is further down.': 'Öffne eine Velofahrt mit Puls, zu der es eine frühere Fahrt ähnlicher Länge gibt (Training › Aktivitäten): die Karte «Schlag deinen Geist» steht weiter unten.',
    'Open Me › What is new and find the update «Beat your ghost».': 'Öffne Ich › Was ist neu und suche das Update «Schlag deinen Geist».',
    'Tap «Try it»: a ride opens and the card «Beat your ghost» glows with one line below.': 'Tippe auf «Ausprobieren»: eine Fahrt öffnet sich, und die Karte «Schlag deinen Geist» leuchtet, mit einer Zeile darunter.',
    'With no ride that has an earlier one, Training opens and a line says what a ride needs.': 'Gibt es keine Fahrt mit einer früheren, öffnet sich Training und eine Zeile sagt, was eine Fahrt dafür braucht.',
  },
};
