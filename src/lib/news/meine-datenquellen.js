// «Meine Datenquellen» (Noah 07.11.2026 «1a», Tour A–Z, Schritt 0, PR B): where the numbers come from, how fresh, where the gaps are
export default {
  title: 'My data sources',
  lead: 'One page that says where your numbers come from, how fresh they are and where days are missing.',
  points: [
    { text: 'Each source shows what is held and how fresh it is: Fitbit, Strava, your daily answers, tours and bikes', go: { href: '#/auswerten/quellen', where: 'Me › Connections › «See where your numbers come from».' } },
    { text: 'Days without a value and sources without news for a while are named, and so are the limits of the data (weather, costs)', go: { href: '#/auswerten/quellen', where: 'Me › Connections › «See where your numbers come from».' } },
  ],
  small: [{ box: 'new', text: 'Me › Connections has a link to the page under the list of connections' }],
  test: [
    'Open Me › Connections and tap «See where your numbers come from»: the page «My data sources» opens.',
    'Read the lines: Fitbit, Strava and the others show what is held and how fresh it is; Weather and Costs name their limits.',
    'Tap «Manage connections»: you are back in Me › Connections.',
  ],
  since: ['f.quellen'],
  de: {
    'My data sources': 'Meine Datenquellen',
    'One page that says where your numbers come from, how fresh they are and where days are missing.': 'Eine Seite, die sagt, woher deine Zahlen kommen, wie frisch sie sind und wo Tage fehlen.',
    'Each source shows what is held and how fresh it is: Fitbit, Strava, your daily answers, tours and bikes': 'Jede Quelle zeigt, was gespeichert ist und wie frisch es ist: Fitbit, Strava, deine täglichen Antworten, Touren und Velos',
    'Me › Connections › «See where your numbers come from».': 'Ich › Verbindungen › «Sieh, woher deine Zahlen kommen».',
    'Days without a value and sources without news for a while are named, and so are the limits of the data (weather, costs)': 'Tage ohne Wert und Quellen ohne Neues seit einer Weile werden genannt, ebenso die Grenzen der Daten (Wetter, Kosten)',
    'Me › Connections has a link to the page under the list of connections': 'Ich › Verbindungen hat unter der Liste der Verbindungen einen Link zur Seite',
    'Open Me › Connections and tap «See where your numbers come from»: the page «My data sources» opens.': 'Öffne Ich › Verbindungen und tippe «Sieh, woher deine Zahlen kommen»: Die Seite «Meine Datenquellen» öffnet sich.',
    'Read the lines: Fitbit, Strava and the others show what is held and how fresh it is; Weather and Costs name their limits.': 'Lies die Zeilen: Fitbit, Strava und die anderen zeigen, was gespeichert ist und wie frisch es ist; Wetter und Kosten nennen ihre Grenzen.',
    'Tap «Manage connections»: you are back in Me › Connections.': 'Tippe «Verbindungen verwalten»: Du bist zurück in Ich › Verbindungen.',
  },
};
