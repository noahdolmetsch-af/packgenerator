// «Heute als Begleiter» (Noah 1.11.2026 «a»): the Start-Karte «On the way today / Last evening» is gone, «Your moment» says it
export default {
  title: 'Today: one card for the next step',
  lead: 'The extra card «On the way today» / «Last evening» is gone. «Your moment» shows the next step.',
  points: [{ text: 'On a trip day «Your moment» leads to On the way; the small line «Last evening» is back with the trip card', go: { href: '#/', steps: [{ sel: '[data-moment-step]' }], where: 'The button sits in the card «Your moment» on Today.' } }],
  small: [],
  test: ['Open Today: no separate card «On the way today» above the trip card.', 'Tap the button in «Your moment»: it opens the next step of your trip.'],
  since: [],
  de: {
    'Today: one card for the next step': 'Heute: eine Karte für den nächsten Schritt',
    'The extra card «On the way today» / «Last evening» is gone. «Your moment» shows the next step.': 'Die zusätzliche Karte «Heute unterwegs» / «Letzter Abend» ist weg. «Dein Moment» zeigt den nächsten Schritt.',
    'On a trip day «Your moment» leads to On the way; the small line «Last evening» is back with the trip card': 'An einem Tourtag führt «Dein Moment» zu Unterwegs; die kleine Zeile «Letzter Abend» steht wieder bei der Tour-Karte',
    'The button sits in the card «Your moment» on Today.': 'Der Knopf steht in der Karte «Dein Moment» auf Heute.',
    'Open Today: no separate card «On the way today» above the trip card.': 'Öffne Heute: keine eigene Karte «Heute unterwegs» über der Tour-Karte.',
    'Tap the button in «Your moment»: it opens the next step of your trip.': 'Tippe auf den Knopf in «Dein Moment»: er öffnet den nächsten Schritt deiner Tour.',
  },
};
