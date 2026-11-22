// «Draussen» PR 3a (Noah 22.11.2026 «a»): «Tick off» on the card Outdoors, like the habit cards
export default {
  title: 'Tick off on the card Outdoors',
  lead: 'The card Outdoors has the green button «Tick off», like your habits: the goal of today is reached in one tap.',
  points: [
    { text: 'The button «Tick off» adds the minutes that are still missing to your 90 minutes (Strava counted); a second tap takes them back', go: { href: '#/', steps: [{ sel: '[data-outdoor-tick], [data-outdoor-card]' }] } },
    { text: 'A smaller amount still works as before with +15, +30, +60 or your own minutes', go: { href: '#/', steps: [{ sel: '[data-outdoor-add], [data-outdoor-card]' }] } },
  ],
  small: [{ box: 'new', text: 'Nothing on Heute moves: the card Outdoors only gets one button' }],
  test: ['On Today, on the card «Outdoors», tap «Tick off»: the line says «Done today» and the button says «Ticked · take back».', 'Tap «Ticked · take back» or «Undo» in the message: the minutes that were missing are gone again.'],
  since: [],
  de: {
    'Tick off on the card Outdoors': 'Abhaken auf der Karte Draussen',
    'The card Outdoors has the green button «Tick off», like your habits: the goal of today is reached in one tap.': 'Die Karte Draussen hat den grünen Knopf «Abhaken», wie deine Gewohnheiten: das Tagesziel ist mit einem Tipp erreicht.',
    'The button «Tick off» adds the minutes that are still missing to your 90 minutes (Strava counted); a second tap takes them back': 'Der Knopf «Abhaken» zählt die Minuten dazu, die dir bis zu deinen 90 Minuten noch fehlen (Strava mitgezählt); ein zweiter Tipp nimmt sie zurück',
    'A smaller amount still works as before with +15, +30, +60 or your own minutes': 'Eine kleinere Menge geht weiter wie bisher mit +15, +30, +60 oder eigenen Minuten',
    'Nothing on Heute moves: the card Outdoors only gets one button': 'Auf Heute rutscht nichts: die Karte Draussen bekommt nur einen Knopf',
    'On Today, on the card «Outdoors», tap «Tick off»: the line says «Done today» and the button says «Ticked · take back».': 'Tippe auf Heute auf der Karte «Draussen» auf «Abhaken»: die Zeile sagt «Heute geschafft» und der Knopf «Abgehakt · zurücknehmen».',
    'Tap «Ticked · take back» or «Undo» in the message: the minutes that were missing are gone again.': 'Tippe auf «Abgehakt · zurücknehmen» oder in der Meldung auf «Rückgängig»: die fehlenden Minuten sind wieder weg.',
  },
};
