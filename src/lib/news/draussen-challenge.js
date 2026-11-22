// «Draussen-Challenge» (Noah 21.11.2026 «1a 2b 3a 4a», Thread «Challenges in den Vordergrund stellen»): a daily goal in minutes on Heute
export default {
  title: 'Outdoors challenge',
  lead: 'A challenge with a daily goal: for example 90 minutes outdoors every day. A card on Today shows how many you have and how many are missing.',
  points: [
    { text: 'On Today the card «Outdoors» shows today\'s minutes against the goal and every day of the challenge as a dot', go: { href: '#/', steps: [{ sel: '[data-outdoor-start], [data-outdoor-card]' }] } },
    { text: 'Strava walks, hikes, runs and rides count by themselves; any other time outdoors you add with +15, +30, +60 or your own minutes, with Undo', go: { href: '#/', steps: [{ sel: '[data-outdoor-start], [data-outdoor-card]' }] } },
  ],
  small: [{ box: 'new', text: 'From 16:00 an open day gets a stronger frame, and with a home place the card says when the sun sets and when to start at the latest' }],
  test: ['On Today tap «Start» in the line «Start a challenge with a daily goal?», then «Start» in the window: the card «Outdoors» appears with Day 1.', 'Tap «+30 min» and then «Undo» in the message: the minutes go up by 30 and come back down.'],
  since: [],
  de: {
    'Outdoors challenge': 'Challenge Draussen',
    'A challenge with a daily goal: for example 90 minutes outdoors every day. A card on Today shows how many you have and how many are missing.': 'Eine Challenge mit Tagesziel: zum Beispiel jeden Tag 90 Minuten draussen. Eine Karte auf Heute zeigt, wie viele du hast und wie viele noch fehlen.',
    'On Today the card «Outdoors» shows today\'s minutes against the goal and every day of the challenge as a dot': 'Auf Heute zeigt die Karte «Draussen» die Minuten von heute gegen das Ziel und jeden Tag der Challenge als Punkt',
    'Strava walks, hikes, runs and rides count by themselves; any other time outdoors you add with +15, +30, +60 or your own minutes, with Undo': 'Gehen, Wandern, Laufen und Velofahren aus Strava zählen von selbst; jede andere Zeit draussen zählst du mit +15, +30, +60 oder eigenen Minuten dazu, mit Rückgängig',
    'From 16:00 an open day gets a stronger frame, and with a home place the card says when the sun sets and when to start at the latest': 'Ab 16 Uhr hat ein offener Tag einen stärkeren Rahmen, und mit Heimatort sagt die Karte, wann die Sonne untergeht und wann du spätestens losgehst',
    'On Today tap «Start» in the line «Start a challenge with a daily goal?», then «Start» in the window: the card «Outdoors» appears with Day 1.': 'Tippe auf Heute in der Zeile «Eine Challenge mit Tagesziel starten?» auf «Start» und dann im Fenster auf «Start»: die Karte «Draussen» erscheint mit Tag 1.',
    'Tap «+30 min» and then «Undo» in the message: the minutes go up by 30 and come back down.': 'Tippe auf «+30 Min» und dann in der Meldung auf «Rückgängig»: die Minuten steigen um 30 und gehen wieder zurück.',
  },
};
