// «Wetter oben» (Noah 23.11.2026 «b», Thread «Prototyp»): one weather card on Today, all lines open, little space
export default {
  title: 'Weather on Today: one small card',
  lead: 'All weather lines stand together in one small card at the top of Today, nothing is hidden.',
  points: [
    { text: 'On Today the weather is one small card: now on the left, the air layers with the snow line on the right, fog, night and lake below', go: { href: '#/', steps: [{ sel: '[data-heute-wetter-card]' }], where: 'Today › the weather card: it shows on a day with a planned trip and a forecast.' } },
    { text: 'The closed line «Weather today» is gone: its lines now stand open in the card, each with its own switch on the weather page', go: { href: '#/wetter', steps: [{ sel: '[data-wx-tabs]' }] } },
  ],
  small: [],
  test: ['Open Today on a day with a planned trip: the weather card sits near the top and shows the temperature, the wind and the rain.', 'Look at the right side of the card: the temperatures by height and the snow line stand there without opening anything.', 'Open Weather and switch a line off: it leaves the card.'],
  since: [],
  de: {
    'Weather on Today: one small card': 'Wetter auf Heute: eine kleine Karte',
    'All weather lines stand together in one small card at the top of Today, nothing is hidden.': 'Alle Wetterzeilen stehen in einer kleinen Karte oben auf Heute, nichts ist versteckt.',
    'On Today the weather is one small card: now on the left, the air layers with the snow line on the right, fog, night and lake below': 'Auf Heute ist das Wetter eine kleine Karte: links «Jetzt», rechts die Höhen mit der Schneefallgrenze, darunter Nebel, Nacht und See',
    'Today › the weather card: it shows on a day with a planned trip and a forecast.': 'Heute › die Wetterkarte: sie erscheint an einem Tag mit geplanter Tour und mit Vorhersage.',
    'The closed line «Weather today» is gone: its lines now stand open in the card, each with its own switch on the weather page': 'Die geschlossene Zeile «Wetter heute» fällt weg: Ihre Zeilen stehen jetzt offen in der Karte, jede mit eigenem Schalter auf der Wetterseite',
    'Open Today on a day with a planned trip: the weather card sits near the top and shows the temperature, the wind and the rain.': 'Öffne Heute an einem Tag mit geplanter Tour: Die Wetterkarte steht weit oben und zeigt Temperatur, Wind und Regen.',
    'Look at the right side of the card: the temperatures by height and the snow line stand there without opening anything.': 'Schau auf die rechte Seite der Karte: Die Temperaturen nach Höhe und die Schneefallgrenze stehen dort, ohne dass du etwas öffnest.',
    'Open Weather and switch a line off: it leaves the card.': 'Öffne Wetter und schalte eine Zeile aus: Sie verschwindet aus der Karte.',
  },
};
