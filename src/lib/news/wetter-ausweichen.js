// «Wetter-Ausweichen» (Noah 07.11.2026 «1b 2a 3a», Thread «Verbessern: Routing und Navigation»): bei Gewitter oder Starkregen voraus nennt die Live-Karte das nächste Dach
export default {
  title: 'Weather ahead: the nearest roof',
  lead: 'The thunderstorm alert of the live map now also warns of heavy rain and names the nearest roof, with «Plan there».',
  points: [
    { text: 'Heavy rain in the next 2 hours is warned like a thunderstorm (switch «Thunderstorm and heavy rain alert» in the options of the live map)', href: '#/live', go: 'f.live' },
    { text: 'The card names the nearest shelter, bus stop with a roof, station or café, and «Plan there» opens the planner with that place. Nothing is planned by itself.', href: '#/live', go: 'f.live' },
  ],
  small: [],
  test: ['On the live map open «Options» and switch on «Thunderstorm and heavy rain alert», then start a ride.', 'When a thunderstorm or heavy rain is forecast for the next 2 hours, a line says so and a card names the nearest roof. «Plan there» opens «Plan a new way to …» with that place, «Not now» hides the card.'],
  since: [],
  de: {
    'Weather ahead: the nearest roof': 'Wetter voraus: das nächste Dach',
    'The thunderstorm alert of the live map now also warns of heavy rain and names the nearest roof, with «Plan there».': 'Die Gewitter-Warnung der Live-Karte warnt jetzt auch vor Starkregen und nennt das nächste Dach, mit «Dorthin planen».',
    'Heavy rain in the next 2 hours is warned like a thunderstorm (switch «Thunderstorm and heavy rain alert» in the options of the live map)': 'Starkregen in den nächsten 2 Stunden wird wie ein Gewitter gemeldet (Schalter «Gewitter- und Starkregen-Warnung» in den Optionen der Live-Karte)',
    'The card names the nearest shelter, bus stop with a roof, station or café, and «Plan there» opens the planner with that place. Nothing is planned by itself.': 'Die Karte nennt den nächsten Unterstand, die Bushaltestelle mit Dach, den Bahnhof oder das Café, und «Dorthin planen» öffnet die Planung mit diesem Ort. Nichts wird von selbst geplant.',
    'On the live map open «Options» and switch on «Thunderstorm and heavy rain alert», then start a ride.': 'Auf der Live-Karte «Optionen» öffnen, «Gewitter- und Starkregen-Warnung» einschalten und eine Fahrt starten.',
    'When a thunderstorm or heavy rain is forecast for the next 2 hours, a line says so and a card names the nearest roof. «Plan there» opens «Plan a new way to …» with that place, «Not now» hides the card.': 'Wenn für die nächsten 2 Stunden ein Gewitter oder Starkregen vorhergesagt ist, sagt es eine Zeile, und eine Karte nennt das nächste Dach. «Dorthin planen» öffnet «Neu planen zu …» mit diesem Ort, «Jetzt nicht» blendet die Karte aus.',
  },
};
