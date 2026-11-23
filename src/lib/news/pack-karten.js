// «Pack-Karten» (Warteliste 4; Noah 22.11.2026 «4a»): the tours being prepared stand as cards on top of Trips
export default {
  title: 'Cards for the tours you are packing',
  lead: 'On Trips, the next tours stand on top as cards: how much is packed, when it starts, and a button that continues where you stopped.',
  points: [
    { text: 'Trips: a card for each next tour with the ring «packed», «Continue with Clothes» and «Open», and the card «New trip»', go: { href: '#/trips', steps: [{ sel: '[data-pack-cards]' }] } },
    { text: '«Continue with …» opens the packing list in Steps, with that step open', go: null },
  ],
  small: [{ box: 'new', text: 'Only tours that start today or later and are not finished get a card; at most three', go: null }],
  test: [
    'Open Trips: below the title the next tours stand as cards with a ring.',
    'Tap «Continue with …» on a card: the packing list opens in Steps with the waiting step open.',
    'Tap «Open» on another card: the packing list of that tour opens as it was.',
  ],
  since: [],
  de: {
    'Cards for the tours you are packing': 'Karten für die Touren, die du packst',
    'On Trips, the next tours stand on top as cards: how much is packed, when it starts, and a button that continues where you stopped.': 'Auf Touren stehen die nächsten Touren oben als Karten: wie viel gepackt ist, wann es losgeht, und ein Knopf, der dort weitermacht, wo du aufgehört hast.',
    'Trips: a card for each next tour with the ring «packed», «Continue with Clothes» and «Open», and the card «New trip»': 'Touren: je eine Karte für die nächsten Touren mit dem Ring «gepackt», «Weiter mit Kleider» und «Öffnen», dazu die Karte «Neue Tour»',
    '«Continue with …» opens the packing list in Steps, with that step open': '«Weiter mit …» öffnet die Packliste in Schritten, der wartende Schritt ist offen',
    'Only tours that start today or later and are not finished get a card; at most three': 'Nur Touren, die heute oder später beginnen und nicht abgeschlossen sind, bekommen eine Karte; höchstens drei',
    'Open Trips: below the title the next tours stand as cards with a ring.': 'Touren öffnen: unter dem Titel stehen die nächsten Touren als Karten mit einem Ring.',
    'Tap «Continue with …» on a card: the packing list opens in Steps with the waiting step open.': '«Weiter mit …» auf einer Karte antippen: die Packliste öffnet in Schritten, der wartende Schritt ist offen.',
    'Tap «Open» on another card: the packing list of that tour opens as it was.': '«Öffnen» auf einer anderen Karte antippen: die Packliste dieser Tour öffnet wie bisher.',
  },
};
