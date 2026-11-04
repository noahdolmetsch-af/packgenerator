// «Frage deine Daten» (Noah 03.11.2026, Idee 7 der Cockpit-Ideen): ⌘ K and questions about the training
export default {
  title: 'Ask your training data',
  lead: 'Press ⌘ K (Ctrl K on Windows) and ask: «Show me my most efficient Z2 rides» or «Compare my last four weeks». The app answers from your Strava rides, free and on this device.',
  points: [
    { text: '⌘ K or Ctrl K opens the search from anywhere', go: { href: '#/me', steps: [{ sel: 'header.top .search button.icon' }], where: 'The search at the top; with a keyboard press ⌘ K.' } },
    { text: '«Show me my most efficient Z2 rides»: the rides with the most watts per heartbeat, each a tap to the ride', go: { href: '#/assistent', steps: [{ text: 'Show me my most efficient Z2 rides' }], where: 'Assistant, example questions.' } },
    { text: '«Compare my last four weeks»: activities, time, distance and climbing against the four weeks before', go: { href: '#/assistent', steps: [{ text: 'Compare my last four weeks' }], where: 'Assistant, example questions.' } },
  ],
  small: [{ box: 'new', text: 'Keyboard help (?) lists ⌘ K' }],
  test: [
    'Press ⌘ K (or Ctrl K): the search opens and you can type.',
    'Type «Show me my most efficient Z2 rides»: a card lists up to five rides; tap one to open it.',
    'Type «Compare my last four weeks»: the card shows both periods side by side.',
  ],
  since: [],
  de: {
    'Ask your training data': 'Frag deine Trainingsdaten',
    'Press ⌘ K (Ctrl K on Windows) and ask: «Show me my most efficient Z2 rides» or «Compare my last four weeks». The app answers from your Strava rides, free and on this device.': 'Drücke ⌘ K (Ctrl K unter Windows) und frage: «Zeig mir meine effizientesten Z2-Fahrten» oder «Vergleiche meine letzten vier Wochen». Die App antwortet aus deinen Strava-Fahrten, gratis und auf diesem Gerät.',
    '⌘ K or Ctrl K opens the search from anywhere': '⌘ K oder Ctrl K öffnet die Suche von überall',
    'The search at the top; with a keyboard press ⌘ K.': 'Die Suche oben; mit Tastatur ⌘ K drücken.',
    '«Show me my most efficient Z2 rides»: the rides with the most watts per heartbeat, each a tap to the ride': '«Zeig mir meine effizientesten Z2-Fahrten»: die Fahrten mit den meisten Watt pro Herzschlag, jede mit einem Tipp zur Fahrt',
    'Assistant, example questions.': 'Assistent, Beispielfragen.',
    '«Compare my last four weeks»: activities, time, distance and climbing against the four weeks before': '«Vergleiche meine letzten vier Wochen»: Aktivitäten, Zeit, Strecke und Höhenmeter gegen die vier Wochen davor',
    'Keyboard help (?) lists ⌘ K': 'Die Tastenhilfe (?) nennt ⌘ K',
    'Press ⌘ K (or Ctrl K): the search opens and you can type.': 'Drücke ⌘ K (oder Ctrl K): die Suche öffnet sich und du kannst tippen.',
    'Type «Show me my most efficient Z2 rides»: a card lists up to five rides; tap one to open it.': 'Tippe «Zeig mir meine effizientesten Z2-Fahrten»: eine Karte listet bis zu fünf Fahrten; tippe eine an, um sie zu öffnen.',
    'Type «Compare my last four weeks»: the card shows both periods side by side.': 'Tippe «Vergleiche meine letzten vier Wochen»: die Karte zeigt beide Zeiträume nebeneinander.',
  },
};
