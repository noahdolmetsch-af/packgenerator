// «Diagramme besser machen» (Noah 21.11.2026), Schritt 6: from a bar to the units behind it
export default {
  title: 'From a bar to its units',
  lead: 'The window of a tapped bar has a button that lists the units behind it, with day, sport and time.',
  points: [
    { text: 'Tap a bar in the Sports year or the review of a sport, then «See the units»', href: '#/auswerten/sportjahr', go: { href: '#/auswerten/sportjahr', where: 'Auswerten › Sports year: tap a bar, then the button under the sports.' } },
  ],
  test: [
    'Open the Sports year and tap a bar with training.',
    'Tap «See the units»: the list shows day, sport and time of each unit, newest first.',
    'Tap «Hide the units»: the list closes. Moving to another bar starts with the list closed.',
  ],
  since: [],
  de: {
    'From a bar to its units': 'Vom Balken zu den Einheiten',
    'The window of a tapped bar has a button that lists the units behind it, with day, sport and time.': 'Das Fenster eines angetippten Balkens hat einen Knopf, der die Einheiten dahinter mit Tag, Sportart und Zeit auflistet.',
    'Tap a bar in the Sports year or the review of a sport, then «See the units»': 'Tippe im Sportjahr oder im Rückblick pro Sportart einen Balken an, dann «Einheiten ansehen»',
    'Auswerten › Sports year: tap a bar, then the button under the sports.': 'Auswerten › Sportjahr: einen Balken antippen, dann den Knopf unter den Sportarten.',
    'Open the Sports year and tap a bar with training.': 'Öffne das Sportjahr und tippe einen Balken mit Training an.',
    'Tap «See the units»: the list shows day, sport and time of each unit, newest first.': 'Tippe «Die Einheiten ansehen»: die Liste zeigt Tag, Sportart und Zeit jeder Einheit, die neueste zuerst.',
    'Tap «Hide the units»: the list closes. Moving to another bar starts with the list closed.': 'Tippe «Einheiten verbergen»: die Liste schliesst sich. Ein anderer Balken startet mit geschlossener Liste.',
  },
};
