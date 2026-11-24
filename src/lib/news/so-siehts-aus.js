// «So sieht's aus» (Noah 23.11.2026 «1-5a», Frage 5a): ein Muster auf den leeren Hauptseiten
export default {
  title: 'How it looks',
  lead: 'An empty main page now shows what it looks like with a sample, and one tap puts the sample in.',
  points: [
    { text: 'Empty Trips, Pack, Gear and Bikes: a quiet line «How it looks» with «See a sample» in the empty card', go: { href: '#/trips', steps: [{ sel: '[data-sosieht]' }], where: 'Trips, with no trip yet' } },
    { text: 'The sample is the example trip, bike and gear, marked «example»; Me › Data and backup › «Remove the examples» takes it away', go: null },
  ],
  small: [{ box: 'new', text: 'Your own data is never written over; only what is missing comes in' }],
  test: [
    'On an empty app open Trips: the card says «No trips yet», with the line «How it looks» below it.',
    'Tap «See a sample»: the example trip «Jura loop (example)» is there and the page shows a full list.',
    'Open Me › Data and backup › «Remove the examples»: the sample goes, your own things stay.',
  ],
  since: [],
  de: {
    'How it looks': 'So sieht\'s aus',
    'An empty main page now shows what it looks like with a sample, and one tap puts the sample in.': 'Eine leere Hauptseite zeigt jetzt, wie sie mit einem Muster aussieht, und ein Tipp holt das Muster.',
    'Empty Trips, Pack, Gear and Bikes: a quiet line «How it looks» with «See a sample» in the empty card': 'Leere Touren, Packen, Material und Velos: eine ruhige Zeile «So sieht\'s aus» mit «Muster ansehen» in der leeren Karte',
    'The sample is the example trip, bike and gear, marked «example»; Me › Data and backup › «Remove the examples» takes it away': 'Das Muster ist die Beispiel-Tour, das Beispiel-Velo und das Beispiel-Material, als «Beispiel» markiert; Ich › Daten und Backup › «Beispiele entfernen» nimmt es weg',
    'Trips, with no trip yet': 'Touren, ohne Tour',
    'Your own data is never written over; only what is missing comes in': 'Deine eigenen Daten werden nie überschrieben; es kommt nur dazu, was fehlt',
    'On an empty app open Trips: the card says «No trips yet», with the line «How it looks» below it.': 'Öffne in einer leeren App Touren: Die Karte sagt «Noch keine Touren», darunter steht die Zeile «So sieht\'s aus».',
    'Tap «See a sample»: the example trip «Jura loop (example)» is there and the page shows a full list.': 'Tippe auf «Muster ansehen»: Die Beispiel-Tour «Jura-Runde (Beispiel)» ist da und die Seite zeigt eine volle Liste.',
    'Open Me › Data and backup › «Remove the examples»: the sample goes, your own things stay.': 'Öffne Ich › Daten und Backup › «Beispiele entfernen»: Das Muster geht, deine eigenen Sachen bleiben.',
  },
};
